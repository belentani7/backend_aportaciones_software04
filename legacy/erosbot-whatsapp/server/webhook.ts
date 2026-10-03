import crypto from "node:crypto";
import type { Request, Response } from "express";
import { processDemoMessage } from "./demo";
import { incrementMetric, recordSanitizedError } from "./observability";
import { claimMessageId, markMessageProcessed } from "./db";

const seen = new Map<string, number>();
const REPLAY_WINDOW_MS = 5 * 60 * 1000;
const MAX_REPLAY_ENTRIES = 20_000;
const MAX_WEBHOOK_BYTES = 256 * 1024;
const MAX_MESSAGE_CHARS = 8_000;

function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function verifyMetaSignature(rawBody: Buffer, signature: string | undefined, appSecret: string | undefined) {
  if (!appSecret || !signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  return constantTimeEqual(expected, signature);
}

export function verifyReplay(messageId: string, timestamp: number) {
  const now = Date.now();
  seen.forEach((value, key) => { if (now - value > REPLAY_WINDOW_MS) seen.delete(key); });
  if (!Number.isFinite(timestamp) || !messageId || messageId.length > 256 || Math.abs(now - timestamp) > REPLAY_WINDOW_MS || seen.has(messageId)) return false;
  if (seen.size >= MAX_REPLAY_ENTRIES) {
    const oldest = seen.keys().next().value;
    if (oldest) seen.delete(oldest);
  }
  seen.set(messageId, now);
  return true;
}

export function verifyWebhook(req: Request, res: Response) {
  const mode = String(req.query["hub.mode"] ?? "");
  const token = String(req.query["hub.verify_token"] ?? "");
  const challenge = String(req.query["hub.challenge"] ?? "");
  if (mode === "subscribe" && token && token === process.env.META_WHATSAPP_VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
}

export async function receiveWebhook(req: Request, res: Response) {
  incrementMetric("webhook_received");
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
  if (rawBody.byteLength > MAX_WEBHOOK_BYTES) { incrementMetric("webhook_rejected"); recordSanitizedError("payload_too_large"); return res.status(413).json({ error: "payload_too_large" }); }
  const signature = req.header("x-hub-signature-256");
  const isMock = process.env.WHATSAPP_MODE !== "meta";
  if (!isMock && !verifyMetaSignature(rawBody, signature, process.env.META_APP_SECRET)) { incrementMetric("webhook_rejected"); recordSanitizedError("invalid_signature"); return res.status(401).json({ error: "invalid_signature" }); }
  let body: unknown;
  try { body = JSON.parse(rawBody.toString("utf8")); } catch { incrementMetric("webhook_rejected"); recordSanitizedError("invalid_json"); return res.status(400).json({ error: "invalid_json" }); }
  const value = (body as any)?.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  if (message?.id && message?.from && message?.timestamp && !verifyReplay(message.id, Number(message.timestamp) * 1000)) {
    incrementMetric("webhook_rejected");
    recordSanitizedError("replay_rejected");
    return res.status(409).json({ error: "replay_rejected" });
  }
  const persistentMessageId = typeof message?.id === "string" ? message.id : undefined;
  if (persistentMessageId) {
    const messageHash = crypto.createHash("sha256").update(rawBody).digest("hex");
    const claimed = await claimMessageId(persistentMessageId, messageHash, new Date(Date.now() + REPLAY_WINDOW_MS));
    if (!claimed) {
      incrementMetric("webhook_rejected");
      recordSanitizedError("duplicate_message");
      return res.status(409).json({ error: "duplicate_message" });
    }
  }
  if (message?.type === "text" && typeof message.text?.body === "string" && message.text.body.length <= MAX_MESSAGE_CHARS) {
    try {
      const result = await processDemoMessage({ id: String(message.id ?? "unknown"), from: String(message.from), text: message.text.body, timestamp: Number(message.timestamp) * 1000 });
      incrementMetric("message_processed");
      if (persistentMessageId) await markMessageProcessed(persistentMessageId, "processed");
      return res.status(200).json({ ok: true, mode: isMock ? "mock" : "meta", state: result.state, risk: result.signals });
    } catch (error) {
      incrementMetric("transport_error");
      if (persistentMessageId) await markMessageProcessed(persistentMessageId, "failed");
      recordSanitizedError(error instanceof Error ? `processing_failed:${error.name}` : "processing_failed");
      return res.status(503).json({ error: "temporarily_unavailable", retryable: true });
    }
  }
  return res.status(200).json({ ok: true, ignored: true });
}
