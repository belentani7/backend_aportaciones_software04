import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { receiveWebhook, verifyMetaSignature, verifyReplay } from "./webhook";
import { MetaWhatsAppTransport, MockWhatsAppTransport } from "./whatsapp";

describe("WhatsApp webhook security", () => {
  it("validates the Meta HMAC signature", () => {
    const body = Buffer.from('{"hello":"world"}');
    const secret = "demo-app-secret";
    const signature = `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
    expect(verifyMetaSignature(body, signature, secret)).toBe(true);
    expect(verifyMetaSignature(body, "sha256=invalid", secret)).toBe(false);
  });

  it("sends a text through the official Meta endpoint when configured", async () => {
    process.env.META_WHATSAPP_ACCESS_TOKEN = "test-token";
    process.env.META_WHATSAPP_PHONE_NUMBER_ID = "phone-id";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input, init) => {
      expect(String(input)).toContain("phone-id/messages");
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
      return new Response(JSON.stringify({ messages: [{ id: "wamid.demo" }] }), { status: 200 });
    }) as typeof fetch;
    const result = await new MetaWhatsAppTransport().sendText({ to: "+447700900123", text: "hello" });
    expect(result).toEqual({ provider: "meta", messageId: "wamid.demo" });
    globalThis.fetch = originalFetch;
  });

  it("rejects invalid demo recipients and oversized outgoing text", async () => {
    const transport = new MockWhatsAppTransport();
    await expect(transport.sendText({ to: "x", text: "ok" })).rejects.toThrow("Invalid WhatsApp recipient");
    await expect(transport.sendText({ to: "demo-user", text: "x".repeat(4097) })).rejects.toThrow("Invalid WhatsApp message length");
  });

  it("rejects malformed payloads and invalid timestamps", async () => {
    const response = () => {
      const result: { statusCode?: number; body?: unknown } = {};
      return { result, status(code: number) { result.statusCode = code; return this; }, json(body: unknown) { result.body = body; return this; }, sendStatus(code: number) { result.statusCode = code; return this; } } as any;
    };
    const tooLarge = response();
    await receiveWebhook({ body: Buffer.alloc(256 * 1024 + 1), header: () => undefined } as any, tooLarge);
    expect(tooLarge.result.statusCode).toBe(413);
    const invalidJson = response();
    await receiveWebhook({ body: Buffer.from("{"), header: () => undefined } as any, invalidJson);
    expect(invalidJson.result.statusCode).toBe(400);
    expect(verifyReplay("invalid-time", Number.NaN)).toBe(false);
  });

  it("rejects the same message id twice", () => {
    const id = `replay-${Date.now()}`;
    const now = Date.now();
    expect(verifyReplay(id, now)).toBe(true);
    expect(verifyReplay(id, now)).toBe(false);
  });
});
