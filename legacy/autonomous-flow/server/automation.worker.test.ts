import { beforeEach, describe, expect, it, vi } from "vitest";
import { events, exceptions, executions, flows } from "../drizzle/schema";
import { getDb } from "./db";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

import { processPendingEvents, enqueueEvent, shouldRetryWorkerFailure, workerBackoffMs } from "./automation";
import { invokeLLM } from "./_core/llm";

const state = {
  event: {
    id: 7,
    flowId: 1,
    idempotencyKey: "1:queued",
    payload: JSON.stringify({ evento: "ticket" }),
    status: "recibido" as string,
    attempts: 0,
    availableAt: new Date(0),
    claimedAt: null as Date | null,
    claimToken: null as string | null,
    lastError: null as string | null,
  },
  executionCount: 0,
  exceptionCount: 0,
  rules: '[{"contains":"ticket"}]',
};

function fakeDb() {
  return {
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          orderBy: () => ({ limit: async () => table === events ? (state.event.status === "recibido" ? [state.event] : []) : [] }),
            limit: async () => table === flows ? [{ id: 1, status: "activo", rules: state.rules, confidenceThreshold: "0.70", destinationType: "log interno", destinationUrl: null }] : table === events ? (state.event.status === "ausente" ? [] : [state.event]) : [],
        }),
      }),
    }),
    update: (table: unknown) => ({
      set: (patch: Record<string, unknown>) => ({
        where: async () => {
          if (table === events) {
            const allowed = patch.status === undefined || patch.status === "completado" || patch.status === "fallido" || patch.status === "excepcion" || (patch.status === "procesando" && state.event.status === "recibido") || (patch.status === "recibido" && state.event.status === "procesando");
            if (allowed) Object.assign(state.event, patch);
          }
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (value: Record<string, unknown>) => {
        if (table === exceptions) {
          state.exceptionCount += 1;
        } else if (table === executions) {
          state.executionCount += 1;
        }
        return {
          $returningId: async () => {
            if (table === events) {
              state.event.id = 7;
              state.event.flowId = Number(value.flowId);
              state.event.idempotencyKey = String(value.idempotencyKey);
              state.event.payload = String(value.payload);
              state.event.status = String(value.status);
              state.event.attempts = 0;
            }
            return [{ id: 99 }];
          },
        };
      },
    }),
  };
}

describe("persistent worker", () => {
  beforeEach(() => {
    state.event.status = "recibido";
    state.event.attempts = 0;
    state.event.claimedAt = null;
    state.event.claimToken = null;
    state.event.lastError = null;
    state.executionCount = 0;
    state.exceptionCount = 0;
    state.rules = '[{"contains":"ticket"}]';
    vi.mocked(getDb).mockResolvedValue(fakeDb() as never);
    vi.mocked(invokeLLM).mockReset();
  });

  it("enqueues and processes without a browser", async () => {
    state.event.status = "ausente";
    const queued = await enqueueEvent(1, "queued", { evento: "ticket" });
    expect(queued).toMatchObject({ queued: true, eventId: 99, status: "recibido" });
    const processed = await processPendingEvents(10);
    expect(processed.resultados[0]).toMatchObject({ eventId: 7, status: "completado" });
  });

  it("claims once, processes without a browser, and does not process it twice", async () => {
    const first = await processPendingEvents(10);
    const second = await processPendingEvents(10);
    expect(first.procesados).toBe(1);
    expect(first.resultados[0]).toMatchObject({ eventId: 7, status: "completado" });
    expect(second.procesados).toBe(0);
    expect(state.event.status).toBe("completado");
  });

  it("recovers an abandoned lease and processes it", async () => {
    state.event.status = "procesando";
    state.event.claimedAt = new Date(0);
    const result = await processPendingEvents(10);
    expect(result.procesados).toBe(1);
    expect(state.event.status).toBe("completado");
  });

  it("reprograms a real transient worker failure with attempts and backoff", async () => {
    state.rules = "[]";
    const error = Object.assign(new Error("upstream"), { status: 503 });
    vi.mocked(invokeLLM).mockRejectedValue(error);
    const before = Date.now();
    const result = await processPendingEvents(10);
    expect(result.resultados[0]).toMatchObject({ status: "reprogramado" });
    expect(state.event.status).toBe("recibido");
    expect(state.event.attempts).toBe(1);
    expect(state.event.availableAt.getTime()).toBeGreaterThanOrEqual(before + 1000);
  });

  it("marks a real non-recoverable worker failure terminal with trace state", async () => {
    state.rules = "[]";
    const error = Object.assign(new Error("invalid upstream response"), { status: 400 });
    vi.mocked(invokeLLM).mockRejectedValue(error);
    const result = await processPendingEvents(10);
    expect(result.resultados[0]).toMatchObject({ status: "excepcion" });
    expect(state.event.status).toBe("excepcion");
    expect(state.event.lastError).toBe("invalid upstream response");
    expect(state.exceptionCount).toBe(1);
  });

  it("uses exponential backoff for transient failures and stops after the limit", () => {
    const transientError = Object.assign(new Error("upstream"), { status: 503 });
    expect(shouldRetryWorkerFailure(transientError, 1)).toBe(true);
    expect(workerBackoffMs(1)).toBe(1000);
    expect(workerBackoffMs(5)).toBe(16000);
    expect(shouldRetryWorkerFailure(transientError, 5)).toBe(false);
    expect(shouldRetryWorkerFailure(new Error("invalid payload"), 1)).toBe(false);
  });
});
