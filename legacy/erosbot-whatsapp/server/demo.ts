import { loadI18n, normalizeConversation, type SupportedLanguage } from "./linguistics";
import { detectPatterns, isAmbiguousSafetyInput, safetyDecision } from "./patterns";
import { createWhatsAppTransport, getMockMessages, type WhatsAppMessage } from "./whatsapp";
import { createHash } from "node:crypto";
import { createAuditEvent, createSafetyReview, listPendingSafetyReviews, upsertAssistantSession } from "./db";
import { getObservabilitySnapshot, incrementMetric, recordSanitizedError } from "./observability";
import { getApprovedSourceCandidates, getSourceRegistry } from "./sourceRegistry";
import { isProhibitedTechnicalRequest } from "./policy";
import { findEnrichmentHints, getEnrichmentStats } from "./enrichmentRegistry";

export type ConversationState = "language" | "terms" | "adult_declaration" | "assistant" | "human_review" | "paused";

function persistSafely(operation: Promise<unknown>, code: string) {
  void operation.catch(() => recordSanitizedError(code));
}

const sessions = new Map<string, { state: ConversationState; language: SupportedLanguage; premium: boolean; updatedAt: number }>();
const reviewQueue: Array<{ id: string; from: string; code: string; severity: string; createdAt: string; status: "pending" | "resolved" }> = [];
const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_SESSIONS = 5_000;
const MAX_REVIEW_QUEUE = 1_000;
const transport = createWhatsAppTransport();

function sessionKey(phone: string) {
  return createHash("sha256").update(phone).digest("hex").slice(0, 24);
}

function getSession(phone: string) {
  const now = Date.now();
  for (const [key, session] of Array.from(sessions.entries())) if (now - session.updatedAt > SESSION_TTL_MS) sessions.delete(key);
  const key = sessionKey(phone);
  return sessions.get(key) ?? { state: "language" as const, language: "en-GB" as SupportedLanguage, premium: true, updatedAt: now };
}

function responseFor(language: SupportedLanguage, state: ConversationState, text?: string) {
  const copy = loadI18n(language);
  if (state === "language") return `${copy.greeting}\n\nSelect your language / Selecciona idioma: ES · EN · FR · DE · IT · PT · NL · PL · RO · EL · BG · CS`;
  if (state === "terms") return `${copy.greeting}\n\nPlease confirm that you accept the privacy notice and terms by replying YES.`;
  if (state === "adult_declaration") return "For this demo, confirm that you are an adult and will use the assistant lawfully. Reply YES to continue.";
  if (state === "human_review") return `${copy.human}\n\nThe conversation is paused while a safety review is handled.`;
  if (state === "paused") return "The assistant is paused. A human operator must reactivate it.";
  return `${copy.premium}\n\nI can translate, draft and organise replies. I do not set prices, receive money, negotiate for you or contact people without your instruction.\n\nReceived: ${text ?? ""}`;
}

export async function processDemoMessage(message: WhatsAppMessage) {
  const key = sessionKey(message.from);
  const parsed = normalizeConversation(message.text, getSession(message.from).language);
  const signals = detectPatterns(parsed.normalized);
  const ambiguous = isAmbiguousSafetyInput(parsed.normalized);
  const prohibited = isProhibitedTechnicalRequest(parsed.normalized);
  const baseDecision = safetyDecision(signals);
  const decision = (ambiguous || prohibited) && baseDecision.action === "continue"
    ? { ...baseDecision, action: "pause_and_review" as const, shouldCallModel: false, requiresHumanReview: true }
    : baseDecision;
  const enrichmentHints = findEnrichmentHints(parsed.normalized, parsed.language);
  const current = getSession(message.from);
  let nextState = current.state;
  let reply: string;

  if (decision.action === "stop_and_escalate" || decision.action === "pause_and_review") {
    nextState = "human_review";
    incrementMetric("safety_review");
    const reviewSignals = prohibited && !signals.some(signal => signal.requiresHumanReview)
      ? [{ code: "PROHIBITED_TECHNICAL_REQUEST", severity: "high" as const }]
      : ambiguous && !signals.some(signal => signal.requiresHumanReview)
        ? [{ code: "AMBIGUOUS_SENSITIVE_INPUT", severity: "high" as const }]
        : signals.filter(signal => signal.requiresHumanReview);
    for (const signal of reviewSignals) {
      const externalId = `review_${message.id}_${signal.code}`;
      if (!reviewQueue.some(item => item.id === externalId)) {
        if (reviewQueue.length >= MAX_REVIEW_QUEUE) reviewQueue.shift();
        reviewQueue.push({ id: externalId, from: key, code: signal.code, severity: signal.severity, createdAt: new Date().toISOString(), status: "pending" });
      }
      persistSafely(createSafetyReview({ externalId, sessionKey: key, code: signal.code, severity: signal.severity, evidenceHash: undefined }), "safety_review_persistence_failed");
      persistSafely(createAuditEvent({ eventType: "safety_review", subjectHash: key, ruleCode: signal.code, severity: signal.severity as "low" | "medium" | "high" | "critical", expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }), "audit_event_persistence_failed");
    }
    reply = responseFor(parsed.language, nextState);
  } else if (current.state === "language") {
    const languageSelection: Record<string, SupportedLanguage> = { es: "es-ES", en: "en-GB", fr: "fr", de: "de", it: "it", pt: "pt-PT", nl: "nl", pl: "pl", ro: "ro", el: "el", bg: "bg", cs: "cs" };
    const selected = languageSelection[parsed.normalized.trim().toLowerCase()];
    nextState = "terms";
    reply = responseFor(selected ?? parsed.language, nextState);
  } else if (current.state === "terms" && /(?:yes|sí|si|oui|ja|sim|sì|tak|da|ναι|да|ano)/i.test(parsed.normalized)) {
    nextState = "adult_declaration";
    reply = responseFor(parsed.language, nextState);
  } else if (current.state === "adult_declaration" && /(?:yes|sí|si|oui|ja|sim|tak|da|ναι|да|ano)/i.test(parsed.normalized)) {
    nextState = "assistant";
    reply = responseFor(parsed.language, nextState, parsed.normalized);
  } else {
    reply = responseFor(parsed.language, current.state, parsed.normalized);
  }

  const selectedLanguage = current.state === "language" ? ({ es: "es-ES", en: "en-GB", fr: "fr", de: "de", it: "it", pt: "pt-PT", nl: "nl", pl: "pl", ro: "ro", el: "el", bg: "bg", cs: "cs" } as Record<string, SupportedLanguage>)[parsed.normalized.trim().toLowerCase()] : undefined;
  if (sessions.size >= MAX_SESSIONS && !sessions.has(key)) {
    const oldest = sessions.keys().next().value;
    if (oldest) sessions.delete(oldest);
  }
  const updatedAt = Date.now();
  const nextSession = { ...current, state: nextState, language: selectedLanguage ?? parsed.language, updatedAt };
  sessions.set(key, nextSession);
  await upsertAssistantSession({ sessionKey: key, state: nextSession.state, language: nextSession.language, premium: nextSession.premium, expiresAt: new Date(updatedAt + SESSION_TTL_MS) });
  await createAuditEvent({ eventType: "message_processed", subjectHash: key, expiresAt: new Date(updatedAt + 30 * 24 * 60 * 60 * 1000) });
  const outgoing = await transport.sendText({ to: message.from, text: reply, language: parsed.language });
  return { parsed, signals, decision, enrichmentHints, state: nextState, reply, outgoing };
}

export async function runMaintenance(now = Date.now()) {
  let expiredSessions = 0;
  for (const [key, session] of Array.from(sessions.entries())) {
    if (now - session.updatedAt > SESSION_TTL_MS) {
      sessions.delete(key);
      expiredSessions += 1;
    }
  }

  let compactedReviews = 0;
  const reviewRetentionMs = 24 * 60 * 60 * 1000;
  for (let index = reviewQueue.length - 1; index >= 0; index -= 1) {
    const review = reviewQueue[index];
    if (review.status === "resolved" && now - Date.parse(review.createdAt) > reviewRetentionMs) {
      reviewQueue.splice(index, 1);
      compactedReviews += 1;
    }
  }

  return { ok: true as const, expiredSessions, compactedReviews, executedAt: new Date(now).toISOString() };
}

export async function getDemoSnapshot() {
  const persistedReviews = await listPendingSafetyReviews();
  return {
    mode: process.env.WHATSAPP_MODE === "meta" ? "meta" : "mock",
    activeSessions: sessions.size,
    premiumAccess: "demo-active",
    pendingReviews: [...reviewQueue.filter(item => item.status === "pending"), ...persistedReviews],
    messages: getMockMessages(),
    observability: getObservabilitySnapshot(),
    linguisticSources: { version: getSourceRegistry().version, approvedCandidates: getApprovedSourceCandidates(), enrichment: getEnrichmentStats() },
  };
}
