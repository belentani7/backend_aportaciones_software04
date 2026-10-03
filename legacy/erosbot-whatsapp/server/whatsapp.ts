import crypto from "node:crypto";

export type WhatsAppMessage = {
  id: string;
  from: string;
  text: string;
  timestamp: number;
};

export type OutgoingMessage = {
  to: string;
  text: string;
  language?: string;
};

export interface WhatsAppTransport {
  sendText(message: OutgoingMessage): Promise<{ provider: "mock" | "meta"; messageId: string }>;
}

const sentMessages: Array<Omit<OutgoingMessage, "to"> & { recipientHash: string; messageId: string; createdAt: string }> = [];
const MAX_OUTGOING_CHARS = 4_096;
const MAX_MOCK_MESSAGES = 500;

function validateOutgoing(message: OutgoingMessage, requireE164: boolean) {
  if (requireE164 ? !/^\+?[1-9]\d{6,15}$/.test(message.to) : !/^[a-zA-Z0-9._-]{2,128}$/.test(message.to)) throw new Error("Invalid WhatsApp recipient");
  if (!message.text.trim() || message.text.length > MAX_OUTGOING_CHARS) throw new Error("Invalid WhatsApp message length");
}

export class MetaWhatsAppTransport implements WhatsAppTransport {
  async sendText(message: OutgoingMessage) {
    validateOutgoing(message, true);
    const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) throw new Error("Meta WhatsApp secrets are not configured");
    const response = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: message.to.replace(/^\+/, ""), type: "text", text: { body: message.text, preview_url: false } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Meta WhatsApp API failed with ${response.status}`);
    const result = await response.json() as { messages?: Array<{ id?: string }> };
    return { provider: "meta" as const, messageId: result.messages?.[0]?.id ?? `meta_${Date.now()}` };
  }
}

export class MockWhatsAppTransport implements WhatsAppTransport {
  async sendText(message: OutgoingMessage) {
    validateOutgoing(message, false);
    const messageId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (sentMessages.length >= MAX_MOCK_MESSAGES) sentMessages.shift();
    const recipientHash = crypto.createHash("sha256").update(message.to).digest("hex").slice(0, 16);
    const { to: _to, ...safeMessage } = message;
    sentMessages.push({ ...safeMessage, recipientHash, messageId, createdAt: new Date().toISOString() });
    return { provider: "mock" as const, messageId };
  }
}

export function getMockMessages() {
  return [...sentMessages].reverse();
}

export function clearMockMessages() {
  sentMessages.length = 0;
}

export function createWhatsAppTransport(): WhatsAppTransport {
  return process.env.WHATSAPP_MODE === "meta" ? new MetaWhatsAppTransport() : new MockWhatsAppTransport();
}
