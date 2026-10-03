import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { canRetry, evaluateCapacityGate, isExpired, type GateRequest } from "./capacityEngine";
import { buildResolutionPrompt, resolveAutonomousStep } from "./autonomousEngine";
import { advancePersistedRun, reusableRun, terminalReplay } from "./autonomyPersistence";
import { autonomousIterations, autonomousRuns } from "../drizzle/schema";
import { autoResponses, decisions, getConfig, getDb, getSnapshot, listDecisions, listMetrics, listRequests, listResponses, operatingConfig, requests, saveConfig } from "./db";

const risk = z.enum(["low", "medium", "high", "critical"]);
const outcome = z.enum(["accept", "waitlist", "route", "reject", "human_review", "stop"]);
const configInput = z.object({
  theoreticalCapacity: z.number().int().min(1).max(100000), qualityFactor: z.number().min(0.1).max(1), humanFactor: z.number().min(0.1).max(1), safetyBuffer: z.number().min(0.1).max(1), minimumMargin: z.number().min(0), maxResponseMinutes: z.number().int().min(1), maxRisk: z.enum(["low", "medium", "high"]), authorizedChannels: z.array(z.string().min(1)).min(1), queueOrangeThreshold: z.number().int().min(1).max(1000), queueRedThreshold: z.number().int().min(1).max(2000), errorThreshold: z.number().min(0).max(1), confidenceThreshold: z.number().min(0).max(1), ruleVersion: z.string().default("1.0.0"),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  autonomy: router({
    create: protectedProcedure.input(z.object({ runKey: z.string().min(3).max(128), title: z.string().min(1).max(255).optional(), objective: z.string().min(1).max(4000), context: z.string().max(8000).optional(), maxIterations: z.number().int().min(1).max(100).default(20) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const title = input.title?.trim() || "Caso operativo autogenerado";
      const casePrompt = buildResolutionPrompt(input);
      if (!db) return { id: 0, ownerId: ctx.user.id, runKey: input.runKey, title, casePrompt, objective: input.objective, status: "active" as const, maxIterations: input.maxIterations, iterationCount: 0 };
      const existing = await db.select().from(autonomousRuns).where(eq(autonomousRuns.runKey, input.runKey)).limit(1);
      if (existing[0]) {
        if (!reusableRun(existing[0], ctx.user.id)) throw new Error("runKey already belongs to another owner");
        return existing[0];
      }
      await db.insert(autonomousRuns).values({ ownerId: ctx.user.id, runKey: input.runKey, title, casePrompt, objective: input.objective, maxIterations: input.maxIterations });
      const created = await db.select().from(autonomousRuns).where(eq(autonomousRuns.runKey, input.runKey)).limit(1);
      return created[0];
    }),
    step: protectedProcedure.input(z.object({ runKey: z.string().min(3).max(128), budget: z.number().int().min(1).max(10).default(1) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { status: "error" as const, iterations: [], reason: "Database unavailable: autonomous memory cannot be persisted safely." };
      const rows = await db.select().from(autonomousRuns).where(eq(autonomousRuns.runKey, input.runKey)).limit(1);
      const run = rows[0];
      if (!run || run.ownerId !== ctx.user.id) return { status: "error" as const, iterations: [], reason: "Autonomous run not found." };
      if (terminalReplay(run.status)) return { status: run.status, iterations: [], reason: "Run already terminal; no duplicate iteration created." };
      const config = await getConfig(ctx.user.id);
      const snapshot = await getSnapshot(ctx.user.id);
      const produced: unknown[] = [];
      let status: "active" | "completed" | "saturated" | "stopped" | "error" = run.status;
      for (let offset = 0; offset < input.budget && status === "active"; offset += 1) {
        const iterationNumber = run.iterationCount + offset;
        const result = resolveAutonomousStep({ iterationNumber, maxIterations: run.maxIterations, title: run.title, objective: run.objective }, config, snapshot);
        await db.insert(autonomousIterations).values({ runId: run.id, iterationNumber, outcome: result.outcome, capacityState: result.capacityState, confidence: String(result.confidence), actionJson: JSON.stringify({ action: result.action, request: result.request, decision: result.decision ?? null, stopReason: result.stopReason }), reason: result.reason });
        produced.push({ iterationNumber, ...result });
        status = result.status as typeof status;
        await db.update(autonomousRuns).set({ ...advancePersistedRun(run, { status, outcome: result.outcome }, iterationNumber), updatedAt: new Date() }).where(eq(autonomousRuns.id, run.id));
      }
      const updated = await db.select().from(autonomousRuns).where(eq(autonomousRuns.id, run.id)).limit(1);
      return { status, run: updated[0], iterations: produced };
    }),
    status: protectedProcedure.input(z.object({ runKey: z.string().min(3).max(128) })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { run: null, iterations: [] };
      const run = (await db.select().from(autonomousRuns).where(eq(autonomousRuns.runKey, input.runKey)).limit(1))[0];
      if (!run || run.ownerId !== ctx.user.id) return { run: null, iterations: [] };
      const iterations = await db.select().from(autonomousIterations).where(eq(autonomousIterations.runId, run.id));
      return { run, iterations };
    }),
  }),
  capacity: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      const ownerId = ctx.user.id; const config = await getConfig(ownerId); const snapshot = await getSnapshot(ownerId); const gate = evaluateCapacityGate(config, { requestKey: "overview", title: "", description: "", channel: "web", priority: 100, complexity: 1, urgency: 1, estimatedLoad: 0, estimatedMargin: config.minimumMargin, risk: "low" }, snapshot);
      return { config, snapshot, state: gate.capacityState, safeCapacity: gate.safeCapacity, remainingCapacity: gate.remainingCapacity };
    }),
    config: protectedProcedure.query(({ ctx }) => getConfig(ctx.user.id)),
    saveConfig: protectedProcedure.input(configInput).mutation(({ ctx, input }) => saveConfig(ctx.user.id, input)),
    requests: protectedProcedure.query(({ ctx }) => listRequests(ctx.user.id)),
    decisions: protectedProcedure.query(({ ctx }) => listDecisions(ctx.user.id)),
    metrics: protectedProcedure.query(({ ctx }) => listMetrics(ctx.user.id)),
    responses: protectedProcedure.query(({ ctx }) => listResponses(ctx.user.id)),
    retry: protectedProcedure.input(z.object({ requestKey: z.string().min(3) })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { success: true, retryCount: 1, status: "processing" as const };
      const rows = await db.select().from(requests).where(eq(requests.requestKey, input.requestKey)).limit(1); const request = rows[0];
      if (!request || request.ownerId !== ctx.user.id) return { success: false, retryCount: 0, status: "missing" as const };
      if (request.retryCount >= request.maxRetries) { await db.update(requests).set({ status: "stopped", updatedAt: new Date() }).where(eq(requests.id, request.id)); await db.insert(decisions).values({ requestId: request.id, ownerId: ctx.user.id, outcome: "stop", capacityState: "ROJO", confidence: "0.99", reason: "Límite de reintentos alcanzado: transición registrada por seguridad.", rulesVersion: "retry-1.0", responseJson: JSON.stringify({ requestKey: input.requestKey, retryCount: request.retryCount, status: "stopped" }) }); return { success: false, retryCount: request.retryCount, status: "stopped" as const }; }
      const nextRetry = request.retryCount + 1; await db.update(requests).set({ retryCount: nextRetry, status: "processing", updatedAt: new Date() }).where(eq(requests.id, request.id)); await db.insert(decisions).values({ requestId: request.id, ownerId: ctx.user.id, outcome: "human_review", capacityState: "AMARILLO", confidence: "0.99", reason: `Reintento ${nextRetry}/${request.maxRetries} registrado antes de continuar.`, rulesVersion: "retry-1.0", responseJson: JSON.stringify({ requestKey: input.requestKey, retryCount: nextRetry, status: "processing" }) }); return { success: true, retryCount: nextRetry, status: "processing" as const };
    }),
    saveResponse: protectedProcedure.input(z.object({ outcome: z.enum(["accept", "waitlist", "route", "reject"]), subject: z.string().min(1), body: z.string().min(1), enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ...input, ownerId: ctx.user.id };
      const existing = await db.select().from(autoResponses).where(eq(autoResponses.ownerId, ctx.user.id)).limit(20);
      const current = existing.find(item => item.outcome === input.outcome);
      if (current) await db.update(autoResponses).set({ subject: input.subject, body: input.body, enabled: input.enabled, updatedAt: new Date() }).where(eq(autoResponses.id, current.id));
      else await db.insert(autoResponses).values({ ownerId: ctx.user.id, outcome: input.outcome, subject: input.subject, body: input.body, enabled: input.enabled });
      return input;
    }),
    evaluate: protectedProcedure.input(z.object({ requestKey: z.string().min(3), title: z.string().min(1), description: z.string().min(1), channel: z.string().min(1), priority: z.number().int().min(0).max(100), complexity: z.number().int().min(1).max(10), urgency: z.number().int().min(1).max(10), estimatedLoad: z.number().int().min(1).max(10000), estimatedMargin: z.number().min(0), risk, retryCount: z.number().int().min(0).default(0), maxRetries: z.number().int().min(1).max(20).default(3), expiresAt: z.coerce.date().nullable().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); const config = await getConfig(ctx.user.id); const snapshot = await getSnapshot(ctx.user.id); const expired = isExpired(input.expiresAt); const retryBlocked = !canRetry(input.retryCount, input.maxRetries); const decision = expired ? { ...evaluateCapacityGate(config, input as GateRequest, snapshot), outcome: "stop" as const, reason: "Solicitud expirada: no se ejecuta fuera de su ventana operativa." } : retryBlocked ? { ...evaluateCapacityGate(config, input as GateRequest, snapshot), outcome: "stop" as const, reason: "Límite de reintentos alcanzado: se envía a cola de errores." } : evaluateCapacityGate(config, input as GateRequest, snapshot); const responseJson = JSON.stringify({ requestKey: input.requestKey, ...decision });
      if (db) {
        const existing = await db.select().from(requests).where(eq(requests.requestKey, input.requestKey)).limit(1);
        if (existing[0]) { await db.update(requests).set({ duplicateDetected: true, updatedAt: new Date() }).where(eq(requests.id, existing[0].id)); return { ...decision, requestKey: input.requestKey, duplicate: true }; }
        await db.insert(requests).values({ ownerId: ctx.user.id, requestKey: input.requestKey, title: input.title, description: input.description, channel: input.channel, priority: input.priority, complexity: input.complexity, urgency: input.urgency, estimatedLoad: input.estimatedLoad, estimatedMargin: String(input.estimatedMargin), risk: input.risk, retryCount: input.retryCount, maxRetries: input.maxRetries, expiresAt: input.expiresAt, status: expired ? "expired" : decision.outcome === "accept" ? "accepted" : decision.outcome === "waitlist" ? "waitlist" : decision.outcome === "route" ? "routed" : decision.outcome === "reject" ? "rejected" : decision.outcome === "human_review" ? "human_review" : "stopped" }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
        const row = await db.select({ id: requests.id }).from(requests).where(eq(requests.requestKey, input.requestKey)).limit(1);
        const requestId = row[0]?.id ?? 0;
        if (requestId) await db.insert(decisions).values({ requestId, ownerId: ctx.user.id, outcome: decision.outcome, capacityState: decision.capacityState, confidence: String(decision.confidence), reason: decision.reason, rulesVersion: decision.rulesVersion, responseJson });
      }
      return { ...decision, requestKey: input.requestKey };
    }),
  }),
});

export type AppRouter = typeof appRouter;
