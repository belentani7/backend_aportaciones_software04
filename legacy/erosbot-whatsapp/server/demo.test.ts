import { describe, expect, it } from "vitest";
import { detectPatterns, safetyDecision } from "./patterns";
import { loadI18n, normalizeConversation, SUPPORTED_LANGUAGES } from "./linguistics";
import { processDemoMessage } from "./demo";

describe("Aurea demo safety and language layer", () => {
  it("normalizes common Spanish typos and detects the language", () => {
    const result = normalizeConversation("kuanto cobras?", "es-ES");
    expect(result.normalized).toContain("cuanto");
    expect(result.language).toBe("es-ES");
  });

  it("loads every independent language file", () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const copy = loadI18n(language);
      expect(copy.greeting.length).toBeGreaterThan(5);
      expect(copy.premium.length).toBeGreaterThan(5);
    }
  });

  it("detects a coercion pattern before any assistant response", () => {
    const signals = detectPatterns("Te quito el móvil y no puedes irte");
    expect(signals.some(signal => signal.category === "coercion")).toBe(true);
    expect(signals.some(signal => signal.requiresHumanReview)).toBe(true);
  });

  it("blocks absent consent as a critical human-review signal", () => {
    const signals = detectPatterns("Hazlo sin tu consentimiento");
    const decision = safetyDecision(signals);
    expect(signals.some(signal => signal.code === "CONSENT_ABSENT")).toBe(true);
    expect(decision.action).toBe("stop_and_escalate");
    expect(decision.shouldCallModel).toBe(false);
  });

  it("classifies extortion as high-risk and pauses the assistant", () => {
    const signals = detectPatterns("If you do not pay, I will blackmail you");
    const decision = safetyDecision(signals);
    expect(signals.some(signal => signal.code === "HARASSMENT")).toBe(true);
    expect(decision.action).toBe("pause_and_review");
    expect(decision.shouldCallModel).toBe(false);
  });

  it("routes ambiguous sensitive wording to human review", async () => {
    const phone = `ambiguous-${Date.now()}`;
    const result = await processDemoMessage({ id: "ambiguous", from: phone, text: "Maybe I am not sure about consent", timestamp: Date.now() });
    expect(result.decision.action).toBe("pause_and_review");
    expect(result.decision.shouldCallModel).toBe(false);
    expect(result.state).toBe("human_review");
  });

  it("walks the demo FSM through language, terms, adult declaration and assistant", async () => {
    const phone = `test-${Date.now()}`;
    const first = await processDemoMessage({ id: "1", from: phone, text: "Hola", timestamp: Date.now() });
    expect(first.state).toBe("terms");
    const second = await processDemoMessage({ id: "2", from: phone, text: "Sí", timestamp: Date.now() });
    expect(second.state).toBe("adult_declaration");
    const third = await processDemoMessage({ id: "3", from: phone, text: "Sí", timestamp: Date.now() });
    expect(third.state).toBe("assistant");
  });
});
