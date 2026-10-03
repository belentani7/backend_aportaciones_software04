import { describe, expect, it, vi } from "vitest";
import { allowGenerativeStep, runGuardedGeneration } from "./generativeGuard";

const safe = { action: "continue" as const, shouldCallModel: true };
const risky = { action: "pause_and_review" as const, shouldCallModel: false };

describe("generative safety gate", () => {
  it("allows only a safe, unambiguous continue decision", () => {
    expect(allowGenerativeStep(safe, false)).toBe(true);
    expect(allowGenerativeStep(risky, false)).toBe(false);
    expect(allowGenerativeStep(safe, true)).toBe(false);
  });

  it("does not execute generation for risk or ambiguity", async () => {
    const generate = vi.fn().mockResolvedValue("should-not-run");
    await expect(runGuardedGeneration(risky, false, generate)).rejects.toThrow("generative_step_blocked_by_safety");
    await expect(runGuardedGeneration(safe, true, generate)).rejects.toThrow("generative_step_blocked_by_safety");
    expect(generate).not.toHaveBeenCalled();
  });

  it("executes a safe generation exactly once", async () => {
    const generate = vi.fn().mockResolvedValue("ok");
    await expect(runGuardedGeneration(safe, false, generate)).resolves.toBe("ok");
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
