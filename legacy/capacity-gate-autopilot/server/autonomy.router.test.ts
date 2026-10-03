import { beforeEach, describe, expect, it, vi } from "vitest";
import { autonomousIterations, autonomousRuns } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

const state = vi.hoisted(() => ({ runs: [] as any[], iterations: [] as any[] }));
const config = vi.hoisted(() => ({ theoreticalCapacity: 100, qualityFactor: 0.8, humanFactor: 0.8, safetyBuffer: 0.8, minimumMargin: 50, maxResponseMinutes: 60, maxRisk: "medium" as const, authorizedChannels: ["autonomous"], queueOrangeThreshold: 85, queueRedThreshold: 100, errorThreshold: 0.08, confidenceThreshold: 0.65, ruleVersion: "1.0.0" }));
const snapshot = vi.hoisted(() => ({ currentLoad: 0, queueLoad: 0, responseMinutes: 5, errorRate: 0, humanInterventionRate: 0, marginPerOperation: 60, duplicateRate: 0, incidentCount: 0 }));

function fakeDb() {
  return {
    select() {
      return {
        from(table: unknown) {
          return {
            where() {
              return {
                limit: async () => table === autonomousRuns ? state.runs.slice(-1) : state.iterations.slice(-1),
              };
            },
          };
        },
      };
    },
    insert(table: unknown) {
      return {
        values: async (value: any) => {
          if (table === autonomousRuns) state.runs.push({ id: state.runs.length + 1, ...value, iterationCount: 0, status: value.status ?? "active", lastOutcome: null });
          if (table === autonomousIterations) state.iterations.push({ id: state.iterations.length + 1, ...value });
        },
      };
    },
    update(table: unknown) {
      return {
        set(value: any) {
          return {
            where: async () => {
              if (table === autonomousRuns && state.runs[0]) Object.assign(state.runs[0], value);
            },
          };
        },
      };
    },
  };
}

vi.mock("./db", () => ({
  getDb: vi.fn(async () => fakeDb()),
  getConfig: vi.fn(async () => config),
  getSnapshot: vi.fn(async () => snapshot),
  listDecisions: vi.fn(), listMetrics: vi.fn(), listRequests: vi.fn(), listResponses: vi.fn(), saveConfig: vi.fn(),
  autoResponses: {}, decisions: {}, operatingConfig: {}, requests: {},
}));

import { appRouter } from "./routers";

const ctx = { user: { id: 7, openId: "user-7", name: "Test", email: "test@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext;

describe("autonomy router persistence", () => {
  beforeEach(() => { state.runs.length = 0; state.iterations.length = 0; });

  it("reuses create by runKey without duplicating the run", async () => {
    const caller = appRouter.createCaller(ctx);
    const first = await caller.autonomy.create({ runKey: "case-1", objective: "Resolver cuello de botella" });
    const second = await caller.autonomy.create({ runKey: "case-1", objective: "Resolver cuello de botella" });
    expect(second.id).toBe(first.id);
    expect(state.runs).toHaveLength(1);
  });

  it("persists step count, outcome, status and iteration row", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.autonomy.create({ runKey: "case-2", objective: "Elevar con seguridad", maxIterations: 2 });
    const result = await caller.autonomy.step({ runKey: "case-2", budget: 1 });
    expect(state.runs[0].iterationCount).toBe(1);
    expect(state.runs[0].lastOutcome).toBe(result.iterations[0].outcome);
    expect(state.runs[0].status).toBe("active");
    expect(state.iterations).toHaveLength(1);
  });

  it("does not write another iteration after terminal replay", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.autonomy.create({ runKey: "case-3", objective: "Parar por presupuesto", maxIterations: 1 });
    await caller.autonomy.step({ runKey: "case-3", budget: 2 });
    expect(state.runs[0].status).toBe("completed");
    const count = state.iterations.length;
    const replay = await caller.autonomy.step({ runKey: "case-3", budget: 2 });
    expect(replay.iterations).toHaveLength(0);
    expect(state.iterations).toHaveLength(count);
  });
});
