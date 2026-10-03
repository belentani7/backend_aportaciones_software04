import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { messageIdempotency } from "../drizzle/schema";
import { getDb } from "./db";
import { receiveWebhook } from "./webhook";

function responseMock() {
  const result: { statusCode?: number; body?: unknown } = {};
  return {
    result,
    status(code: number) { result.statusCode = code; return this; },
    json(body: unknown) { result.body = body; return this; },
  } as any;
}

function payload(id: string, from = "demo-user") {
  return Buffer.from(JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ id, from, type: "text", text: { body: "Hola" } }] } }] }] }));
}

describe("webhook durable delivery state", () => {
  it("returns duplicate_message on a durable second delivery", async () => {
    const id = `webhook-duplicate-${Date.now()}`;
    const body = payload(id);
    const first = responseMock();
    await receiveWebhook({ body, header: () => undefined } as any, first);
    expect(first.result.statusCode).toBe(200);
    const second = responseMock();
    await receiveWebhook({ body, header: () => undefined } as any, second);
    expect(second.result.statusCode).toBe(409);
    expect(second.result.body).toEqual({ error: "duplicate_message" });
  });

  it("marks a failed delivery and permits a controlled retry", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    const id = `webhook-failed-${Date.now()}`;
    const first = responseMock();
    await receiveWebhook({ body: payload(id, "x"), header: () => undefined } as any, first);
    expect(first.result.statusCode).toBe(503);
    const stored = await db!.select().from(messageIdempotency).where(eq(messageIdempotency.messageId, id)).limit(1);
    expect(stored[0]?.status).toBe("failed");
    const retry = responseMock();
    await receiveWebhook({ body: payload(id, "x"), header: () => undefined } as any, retry);
    expect(retry.result.statusCode).toBe(503);
  });
});
