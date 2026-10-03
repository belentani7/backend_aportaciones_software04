import { beforeEach, describe, expect, it, vi } from "vitest";
import { events, exceptions, executions, flows } from "../drizzle/schema";

const state = { rules: "[]", destinationType: "log interno", destinationUrl: null as string | null, events: [] as Array<{ id: number; flowId: number; idempotencyKey: string; payload: string; status: string }>, exceptions: [] as Array<{ id: number; eventId: number; payload: string; reason: string; status: string; attempts: number; resolvedAt?: Date | null }>, executions: [] as Array<{ trace: string; outcome: string }>, nextId: 1, eventLookups: 0 };

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn(async () => { const error = new Error("test failure"); Object.assign(error, { status: 400 }); throw error; }) }));
vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: async () => {
            if (table === flows) return [{ id: 1, status: "activo", rules: state.rules, confidenceThreshold: "0.70", destinationType: state.destinationType, destinationUrl: state.destinationUrl }];
            if (table === exceptions) return state.exceptions;
            state.eventLookups += 1;
            return state.eventLookups === 2 ? state.events : [];
          },
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (value: Record<string, unknown>) => {
        if (table === events) {
          const event = { id: state.nextId++, flowId: value.flowId as number, idempotencyKey: value.idempotencyKey as string, payload: value.payload as string, status: value.status as string };
          state.events.push(event);
          return { $returningId: async () => [{ id: event.id }] };
        }
        if (table === exceptions) state.exceptions.push({ id: state.nextId++, eventId: value.eventId as number, payload: value.payload as string, reason: value.reason as string, status: value.status as string, attempts: 0 });
        if (table === executions) state.executions.push({ trace: value.trace as string, outcome: value.outcome as string });
        return { $returningId: async () => [{ id: 1 }] };
      },
    }),
    update: (table: unknown) => ({ set: (patch: Record<string, unknown>) => ({ where: async () => { if (table === exceptions && state.exceptions[0]) Object.assign(state.exceptions[0], patch); } }) }),
  })),
}));

import { processEvent, reprocessException } from "./automation";

describe("automation persistence", () => {
  beforeEach(() => { state.rules = "[]"; state.destinationType = "log interno"; state.destinationUrl = null; state.events.length = 0; state.exceptions.length = 0; state.executions.length = 0; state.nextId = 1; state.eventLookups = 0; });

  it("persists only one event for the same idempotency key", async () => {
    state.rules = '[{"contains":"ticket"}]';
    const first = await processEvent(1, "same-key", { evento: "ticket" });
    const second = await processEvent(1, "same-key", { evento: "ticket" });
    expect(first.duplicate).toBe(false);
    expect(second).toMatchObject({ duplicate: true, eventId: 1 });
    expect(state.events).toHaveLength(1);
  });

  it("executes an outbound webhook through processEvent", async () => {
    state.rules = '[{"contains":"ticket"}]';
    state.destinationType = "webhook saliente";
    state.destinationUrl = "https://example.test/events";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    await processEvent(1, "webhook-key", { evento: "ticket" });
    expect(fetchMock).toHaveBeenCalledWith("https://example.test/events", expect.objectContaining({ headers: expect.objectContaining({ "x-idempotency-key": "1:webhook-key" }) }));
    fetchMock.mockRestore();
  });

  it("creates and reprocesses an exception with state, attempts and trace", async () => {
    const first = await processEvent(1, "failure-key", { evento: "ticket" });
    expect(first.exception).toBe("test failure");
    expect(state.exceptions[0]).toMatchObject({ status: "pendiente", attempts: 0 });
    expect(state.executions[0]?.outcome).toBe("excepcion");
    state.rules = '[{"contains":"ticket"}]';
    const result = await reprocessException(state.exceptions[0]!.id);
    expect(result.exception).toBeUndefined();
    expect(state.exceptions[0]).toMatchObject({ status: "resuelto", attempts: 1 });
    expect(state.executions.length).toBeGreaterThan(1);
    expect(state.executions.at(-1)?.trace).toContain("reprocess");
  });
});
