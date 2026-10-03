import express from "express";
import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { ENV } from "./_core/env";
import { registerStorageProxy } from "./_core/storageProxy";
import { serveStatic } from "./_core/vite";

const servers: Server[] = [];

async function listen(server: Server) {
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Server did not bind");
  return `http://127.0.0.1:${address.port}`;
}

async function closeServers() {
  await Promise.all(
    servers.splice(0).map(
      server =>
        new Promise<void>(resolve => {
          if (!server.listening) return resolve();
          server.close(() => resolve());
        })
    )
  );
}

afterEach(async () => {
  ENV.forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL ?? "";
  ENV.forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY ?? "";
  await closeServers();
});

describe("Express 5 runtime routes", () => {
  it("normalizes nested storage keys and redirects to a signed URL", async () => {
    const forge = createServer((_req, res) => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ url: "https://signed.example/object.txt" }));
    });
    const forgeUrl = await listen(forge);
    ENV.forgeApiUrl = forgeUrl;
    ENV.forgeApiKey = "test-token";

    const app = express();
    registerStorageProxy(app);
    const appServer = createServer(app);
    const appUrl = await listen(appServer);

    const response = await fetch(`${appUrl}/manus-storage/folder/object.txt`, {
      redirect: "manual",
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://signed.example/object.txt"
    );
  });

  it("serves the SPA fallback for an unknown client route", async () => {
    const app = express();
    serveStatic(app);
    const appServer = createServer(app);
    const appUrl = await listen(appServer);

    const response = await fetch(`${appUrl}/audit/unknown-route`);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("Forge10");
  });
});
