import { describe, expect, it } from "vitest";
import { claimMessageId, markMessageProcessed, purgeExpiredOperationalData } from "./db";

describe("durable operational state", () => {
  it("claims a message once and rejects the durable duplicate", async () => {
    const id = `operational-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const expiresAt = new Date(Date.now() + 60_000);
    const first = await claimMessageId(id, "hash-test", expiresAt);
    const second = await claimMessageId(id, "hash-test", expiresAt);
    expect(first).toBe(true);
    expect(second).toBe(false);
    await markMessageProcessed(id, "processed");
  });

  it("purge is safe and returns bounded counters", async () => {
    const result = await purgeExpiredOperationalData(new Date(Date.now() - 1));
    expect(result.sessions).toBeGreaterThanOrEqual(0);
    expect(result.idempotency).toBeGreaterThanOrEqual(0);
    expect(result.audit).toBeGreaterThanOrEqual(0);
  });
});
