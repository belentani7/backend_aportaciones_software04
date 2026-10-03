import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { createConfiguredApp } from "./_core/index";

describe("release performance budget", () => {
  it("creates the API and serves health within the local budget", async () => {
    const startedAt = performance.now();
    const { server } = await createConfiguredApp(false);
    await new Promise<void>(resolve => server.listen(0, resolve));
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("test_server_address_unavailable");
      const response = await fetch(`http://127.0.0.1:${address.port}/api/healthz`);
      const elapsedMs = performance.now() - startedAt;
      expect(response.status).toBe(200);
      expect(elapsedMs).toBeLessThan(1_000);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
