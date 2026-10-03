import { afterEach, describe, expect, it, vi } from "vitest";
import { deliverOutboundWebhook } from "./automation";

describe("outbound webhook", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends the result with the event idempotency key", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    await expect(deliverOutboundWebhook("https://example.test/events", { resultado: "ok" }, "event-key")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("https://example.test/events", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "x-idempotency-key": "event-key" }),
      body: JSON.stringify({ resultado: "ok" }),
    }));
  });

  it("raises a status-bearing error for a permanent destination failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 400 }));
    await expect(deliverOutboundWebhook("https://example.test/events", {}, "event-key")).rejects.toMatchObject({ status: 400 });
  });
});
