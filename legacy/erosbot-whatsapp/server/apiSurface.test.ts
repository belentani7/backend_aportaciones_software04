import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { appRouter } from "./routers";
import { API_ROUTE_MANIFEST, assertNoThirdPartyEconomicRoutes } from "./apiRoutes";

describe("public API economic boundary", () => {
  it("does not expose third-party booking or payment procedures", () => {
    expect(assertNoThirdPartyEconomicRoutes()).toBe(true);
    expect(API_ROUTE_MANIFEST.map(route => route.path)).toEqual([
      "/api/webhooks/whatsapp",
      "/api/scheduled/maintenance",
      "/api/trpc",
      "/api/healthz",
      "/api/oauth/callback",
      "/manus-storage/",
    ]);
    const expressSource = readFileSync(resolve(process.cwd(), "server/_core/index.ts"), "utf8").toLowerCase();
    const webhookSource = readFileSync(resolve(process.cwd(), "server/webhook.ts"), "utf8").toLowerCase();
    const exposed = `${JSON.stringify((appRouter as any)._def.procedures)} ${expressSource} ${webhookSource}`.toLowerCase();
    for (const forbidden of ["booking", "reservation", "escrow", "split", "refund", "commission", "thirdpartycheckout"]) {
      expect(exposed).not.toContain(forbidden);
    }
    expect(exposed).not.toContain("checkout");
    expect(exposed).not.toContain("payment");
  });
});
