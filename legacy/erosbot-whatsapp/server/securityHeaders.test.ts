import { describe, expect, it } from "vitest";
import { createConfiguredApp } from "./_core/index";

describe("defensive HTTP defaults", () => {
  it("sets defensive headers and exposes a minimal health endpoint", async () => {
    const { server } = await createConfiguredApp(false);
    await new Promise<void>(resolve => server.listen(0, resolve));
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("test_server_address_unavailable");
      const response = await fetch(`http://127.0.0.1:${address.port}/api/healthz`, { headers: { "x-request-id": "safe-test-request" } });
      expect(response.status).toBe(200);
      expect(response.headers.get("x-request-id")).toBe("safe-test-request");
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("x-frame-options")).toBe("DENY");
      expect(response.headers.get("cache-control")).toBe("no-store");
      await expect(response.json()).resolves.toMatchObject({ ok: true, service: "erosbot-whatsapp" });
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
