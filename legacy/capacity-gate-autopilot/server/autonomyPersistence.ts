export type PersistedRunState = {
  ownerId: number;
  status: "active" | "completed" | "saturated" | "stopped" | "error";
  iterationCount: number;
  maxIterations: number;
  lastOutcome: string | null;
};

export function reusableRun(existing: PersistedRunState, ownerId: number): boolean {
  return existing.ownerId === ownerId;
}

export function terminalReplay(status: PersistedRunState["status"]): boolean {
  return status !== "active";
}

export function advancePersistedRun(run: PersistedRunState, result: { status: PersistedRunState["status"]; outcome: string }, iterationNumber: number) {
  return {
    iterationCount: iterationNumber + 1,
    lastOutcome: result.outcome,
    status: result.status,
    completedAt: result.status === "active" ? null : new Date(),
  };
}
