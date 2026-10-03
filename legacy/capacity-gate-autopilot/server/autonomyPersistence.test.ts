import { describe, expect, it } from "vitest";
import { advancePersistedRun, reusableRun, terminalReplay } from "./autonomyPersistence";

describe("autonomy persistence contract", () => {
  const active = { ownerId: 7, status: "active" as const, iterationCount: 2, maxIterations: 20, lastOutcome: "accept" };

  it("reuses the same run only for its owner", () => {
    expect(reusableRun(active, 7)).toBe(true);
    expect(reusableRun(active, 8)).toBe(false);
  });

  it("persists the next iteration and terminal metadata", () => {
    const next = advancePersistedRun(active, { status: "saturated", outcome: "stop" }, 2);
    expect(next.iterationCount).toBe(3);
    expect(next.lastOutcome).toBe("stop");
    expect(next.status).toBe("saturated");
    expect(next.completedAt).toBeInstanceOf(Date);
  });

  it("prevents duplicate writes after a terminal state", () => {
    expect(terminalReplay("active")).toBe(false);
    expect(terminalReplay("completed")).toBe(true);
    expect(terminalReplay("saturated")).toBe(true);
    expect(terminalReplay("stopped")).toBe(true);
  });
});
