import { afterEach, describe, expect, it } from "vitest";
import { createConfiguredApp } from "./_core/index";
import type { Server } from "node:http";

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

async function startTestServer() {
  const { app, server } = await createConfiguredApp(false);
  await new Promise<void>(resolve => server.listen(0, resolve));
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("test_server_address_unavailable");
  return `http://127.0.0.1:${address.port}`;
}

describe("HTTP surface integration", () => {
  it("responds through operational, OAuth, storage and tRPC surfaces", async () => {
    const base = await startTestServer();
    const checks = await Promise.all([
      fetch(`${base}/api/webhooks/whatsapp`),
      fetch(`${base}/api/scheduled/maintenance`, { method: "POST" }),
      fetch(`${base}/api/trpc/auth.me`),
      fetch(`${base}/api/oauth/callback`),
      fetch(`${base}/manus-storage/unknown-key`),
    ]);
    expect(checks[0].status).not.toBe(404);
    expect([403, 500]).toContain(checks[1].status);
    expect(checks[2].status).not.toBe(404);
    expect([400, 302, 303, 307, 308]).toContain(checks[3].status);
    expect(checks[4].status).not.toBe(404);
  });

  it("returns 404 for economic endpoints that are not mounted", async () => {
    const base = await startTestServer();
    for (const path of ["booking", "escrow", "split", "refund", "commission", "checkout"]) {
      const response = await fetch(`${base}/api/${path}`);
      expect(response.status, path).toBe(404);
    }
  });
});
