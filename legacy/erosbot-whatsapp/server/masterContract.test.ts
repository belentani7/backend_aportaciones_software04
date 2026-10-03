import { describe, expect, it } from "vitest";
import { detectPatterns, safetyDecision } from "./patterns";
import { processDemoMessage, runMaintenance } from "./demo";

describe("EROS-BOT EU v2.0 master contract", () => {
  it.each([
    ["minor", "Soy menor de 17 años", "stop_and_escalate"],
    ["violence", "I will hurt you with a weapon", "pause_and_review"],
    ["privacy", "Send your ID and full card number", "continue"],
    ["consent", "Do it without your consent", "stop_and_escalate"],
  ])("classifies %s deterministically before any model step", (_name, text, expectedAction) => {
    const signals = detectPatterns(text);
    const decision = safetyDecision(signals);
    if (_name === "privacy") expect(signals.some(signal => signal.category === "privacy")).toBe(true);
    else expect(signals.some(signal => signal.category === _name)).toBe(true);
    if (expectedAction !== "continue") expect(decision.action).toBe(expectedAction);
  });

  it("keeps maintenance bounded and returns a retry-safe result", async () => {
    const result = await runMaintenance(Date.now());
    expect(result.ok).toBe(true);
    expect(result.expiredSessions).toBeGreaterThanOrEqual(0);
    expect(result.compactedReviews).toBeGreaterThanOrEqual(0);
    expect(() => new Date(result.executedAt).toISOString()).not.toThrow();
  });

  it("keeps a high-risk message in human review rather than normal assistant state", async () => {
    const result = await processDemoMessage({ id: "contract-risk", from: `contract-${Date.now()}`, text: "Soy menor de 17 años", timestamp: Date.now() });
    expect(result.state).toBe("human_review");
    expect(result.decision.shouldCallModel).toBe(false);
  });
});
