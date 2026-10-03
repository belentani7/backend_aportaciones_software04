export type GenerativeSafetyDecision = {
  action: "continue" | "pause_and_review" | "stop_and_escalate";
  shouldCallModel: boolean;
};

export function allowGenerativeStep(decision: GenerativeSafetyDecision, ambiguous: boolean) {
  return decision.action === "continue" && decision.shouldCallModel && !ambiguous;
}

export async function runGuardedGeneration<T>(
  decision: GenerativeSafetyDecision,
  ambiguous: boolean,
  generate: () => Promise<T>,
) {
  if (!allowGenerativeStep(decision, ambiguous)) {
    throw new Error("generative_step_blocked_by_safety");
  }
  return generate();
}
