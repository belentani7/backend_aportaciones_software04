import { createHash } from "node:crypto";
import { and, desc, eq, lte, lt } from "drizzle-orm";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { events, exceptions, executions, flows } from "../drizzle/schema";

const MODEL_INPUT_USD_PER_MILLION = Number(process.env.LLM_INPUT_USD_PER_MILLION ?? "0.15");
const MODEL_OUTPUT_USD_PER_MILLION = Number(process.env.LLM_OUTPUT_USD_PER_MILLION ?? "0.60");

export function calculateTokenCost(usage: { prompt_tokens?: number; completion_tokens?: number }) {
  const input = usage.prompt_tokens ?? 0;
  const output = usage.completion_tokens ?? 0;
  return ((input / 1_000_000) * MODEL_INPUT_USD_PER_MILLION + (output / 1_000_000) * MODEL_OUTPUT_USD_PER_MILLION).toFixed(8);
}

export function assignIdempotencyKey(payload: Record<string, unknown>, supplied?: string, flowId?: number) {
  const scoped = flowId === undefined ? supplied : `${flowId}:${supplied ?? ""}`;
  return scoped || createHash("sha256").update(`${flowId ?? ""}:${JSON.stringify(payload)}`).digest("hex");
}

export const eventPayloadSchema = z.record(z.string(), z.unknown()).refine(value => Object.keys(value).length > 0, "El payload debe contener al menos un campo");

export const analysisSchema = z.object({
  categoría: z.string().min(1),
  prioridad: z.string().min(1),
  sentimiento: z.string().min(1),
  resumen: z.string().min(1),
  "acción sugerida": z.string().min(1),
  "nivel de confianza": z.number().min(0).max(1),
});

export const transient = (error: unknown) => {
  const status = (error as { status?: number })?.status;
  return status === 429 || (status !== undefined && status >= 500);
};

export function workerBackoffMs(attempts: number) {
  return Math.min(300_000, 1_000 * 2 ** Math.max(0, attempts - 1));
}

export function shouldRetryWorkerFailure(error: unknown, attempts: number) {
  return transient(error) && attempts < 5;
}

const parseRules = (raw: string) => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((rule): rule is Record<string, unknown> => Boolean(rule && typeof rule === "object")) : [];
  } catch { return []; }
};

export async function enqueueEvent(flowId: number, idempotencyKey: string | undefined, payload: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const validPayload = eventPayloadSchema.parse(payload);
  const assignedIdempotencyKey = assignIdempotencyKey(validPayload, idempotencyKey, flowId);
  const [flow] = await db.select().from(flows).where(and(eq(flows.id, flowId), eq(flows.status, "activo"))).limit(1);
  if (!flow) throw new Error("Flow not found or paused");
  const existing = await db.select().from(events).where(eq(events.idempotencyKey, assignedIdempotencyKey)).limit(1);
  if (existing[0]) return { duplicate: true, eventId: existing[0].id, status: existing[0].status };
  try {
    const [created] = await db.insert(events).values({ flowId, idempotencyKey: assignedIdempotencyKey, payload: JSON.stringify(validPayload), status: "recibido", availableAt: new Date() }).$returningId();
    return { duplicate: false, queued: true, eventId: created.id, idempotencyKey: assignedIdempotencyKey, status: "recibido" };
  } catch (error) {
    const raced = await db.select().from(events).where(eq(events.idempotencyKey, assignedIdempotencyKey)).limit(1);
    if (raced[0]) return { duplicate: true, eventId: raced[0].id, status: raced[0].status };
    throw error;
  }
}

export function deterministicMatch(payload: Record<string, unknown>, rawRules: string) {
  const text = JSON.stringify(payload).toLowerCase();
  for (const rule of parseRules(rawRules)) {
    const contains = typeof rule.contains === "string" ? rule.contains.toLowerCase() : "";
    if (contains && text.includes(contains)) return { matched: true, rule };
  }
  return { matched: false };
}

async function callStructuredLLM(payload: Record<string, unknown>) {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Extrae únicamente los campos indicados. No inventes datos. Devuelve JSON válido." },
      { role: "user", content: JSON.stringify(payload) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "workflow_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            categoría: { type: "string" },
            prioridad: { type: "string" },
            sentimiento: { type: "string" },
            resumen: { type: "string" },
            "acción sugerida": { type: "string" },
            "nivel de confianza": { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["categoría", "prioridad", "sentimiento", "resumen", "acción sugerida", "nivel de confianza"],
          additionalProperties: false,
        },
      },
    },
  });
  const content = response.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content : JSON.stringify(content);
  const parsed = analysisSchema.parse(JSON.parse(text));
  const usage = (response as { usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }).usage;
  return { parsed, tokenCost: usage ? calculateTokenCost(usage) : "no disponible" };
}

export async function deliverOutboundWebhook(destinationUrl: string, result: unknown, idempotencyKey: string) {
  const response = await fetch(destinationUrl, { method: "POST", headers: { "content-type": "application/json", "x-idempotency-key": idempotencyKey }, body: JSON.stringify(result) });
  if (!response.ok) { const error = new Error(`Destination returned ${response.status}`); Object.assign(error, { status: response.status }); throw error; }
  return true;
}

export async function retry<T>(operation: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { return await operation(); } catch (error) {
      lastError = error;
      if (!transient(error) || attempt === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.min(8000, 250 * 2 ** attempt)));
    }
  }
  throw lastError;
}

export async function processEvent(flowId: number, idempotencyKey: string | undefined, payload: Record<string, unknown>, existingEventId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const validPayload = eventPayloadSchema.parse(payload);
  const assignedIdempotencyKey = assignIdempotencyKey(validPayload, idempotencyKey, flowId);
  const [flow] = await db.select().from(flows).where(and(eq(flows.id, flowId), eq(flows.status, "activo"))).limit(1);
  if (!flow) throw new Error("Flow not found or paused");
  let eventId: number;
  if (existingEventId !== undefined) {
    const [stored] = await db.select().from(events).where(and(eq(events.id, existingEventId), eq(events.flowId, flowId))).limit(1);
    if (!stored) throw new Error("Queued event not found");
    eventId = stored.id;
    await db.update(events).set({ status: "procesando", claimedAt: new Date(), lastError: null }).where(eq(events.id, eventId));
  } else {
    const existing = await db.select().from(events).where(eq(events.idempotencyKey, assignedIdempotencyKey)).limit(1);
    if (existing[0]) return { duplicate: true, eventId: existing[0].id, status: existing[0].status };
    try {
      const [event] = await db.insert(events).values({ flowId, idempotencyKey: assignedIdempotencyKey, payload: JSON.stringify(validPayload), status: "procesando" }).$returningId();
      eventId = event.id;
    } catch (error) {
      const raced = await db.select().from(events).where(eq(events.idempotencyKey, assignedIdempotencyKey)).limit(1);
      if (raced[0]) return { duplicate: true, eventId: raced[0].id, status: raced[0].status };
      throw error;
    }
  }
  const started = Date.now();
  try {
    const match = deterministicMatch(validPayload, flow.rules);
    let result: unknown;
    let outcome: "regla determinista" | "LLM" = "regla determinista";
    let tokenCost = "0";
    if (match.matched) result = match.rule;
    else {
      outcome = "LLM";
      const llmResult = await retry(() => callStructuredLLM(validPayload));
      result = llmResult.parsed;
      tokenCost = llmResult.tokenCost;
      const confidence = (result as z.infer<typeof analysisSchema>)["nivel de confianza"];
      if (confidence < Number(flow.confidenceThreshold)) throw new Error("nivel de confianza inferior al umbral");
    }
    if (flow.destinationType === "webhook saliente") {
      const destinationUrl = flow.destinationUrl;
      if (!destinationUrl) throw new Error("destinationUrl requerido para webhook saliente");
      await retry(() => deliverOutboundWebhook(destinationUrl, result, assignedIdempotencyKey));
    }
    await db.insert(executions).values({ eventId, flowId, durationMs: Date.now() - started, tokenCost, result: JSON.stringify(result), outcome, trace: JSON.stringify({ idempotencyKey: assignedIdempotencyKey, matchedRule: match.matched, destination: flow.destinationType }) });
    await db.update(events).set({ status: "completado" }).where(eq(events.id, eventId));
    return { duplicate: false, eventId, result };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Error desconocido";
    if (existingEventId !== undefined && transient(error)) {
      const [current] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
      const attempts = current?.attempts ?? 1;
      const retryable = shouldRetryWorkerFailure(error, attempts);
      if (retryable) {
        await db.update(events).set({ status: "recibido", availableAt: new Date(Date.now() + workerBackoffMs(attempts)), claimedAt: null, claimToken: null, lastError: reason }).where(eq(events.id, eventId));
        return { duplicate: false, eventId, exception: reason, retryable: true, exceptionQueued: false };
      }
    }
    await db.insert(exceptions).values({ eventId, payload: JSON.stringify(validPayload), reason, status: "pendiente" });
    await db.insert(executions).values({ eventId, flowId, durationMs: Date.now() - started, tokenCost: "0", result: JSON.stringify({ reason }), outcome: "excepcion", trace: JSON.stringify({ idempotencyKey: assignedIdempotencyKey, reason, terminal: true }) });
    await db.update(events).set({ status: "excepcion", availableAt: new Date(), lastError: reason, claimedAt: null, claimToken: null }).where(eq(events.id, eventId));
    return { duplicate: false, eventId, exception: reason, retryable: false, exceptionQueued: true };
  }
}

export async function reprocessException(exceptionId: number, ownerId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [exception] = await db.select().from(exceptions).where(eq(exceptions.id, exceptionId)).limit(1);
  if (!exception || exception.status !== "pendiente") throw new Error("Exception not pending");
  const [event] = await db.select().from(events).where(eq(events.id, exception.eventId)).limit(1);
  if (!event) throw new Error("Event not found");
  if (ownerId !== undefined) {
    const [ownedFlow] = await db.select({ id: flows.id }).from(flows).where(and(eq(flows.id, event.flowId), eq(flows.ownerId, ownerId))).limit(1);
    if (!ownedFlow) throw new Error("Exception not found");
  }
  const payload = eventPayloadSchema.parse(JSON.parse(exception.payload));
  const result = await processEvent(event.flowId, `${event.idempotencyKey}:reprocess:${exception.attempts + 1}`, payload);
  await db.update(exceptions).set({ attempts: exception.attempts + 1, status: result.exception ? "pendiente" : "resuelto", resolvedAt: result.exception ? null : new Date() }).where(eq(exceptions.id, exceptionId));
  return result;
}

export async function processPendingEvents(limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const staleBefore = new Date(Date.now() - 120_000);
  await db.update(events).set({ status: "recibido", claimedAt: null, claimToken: null, availableAt: new Date(), lastError: "lease recuperado" }).where(and(eq(events.status, "procesando"), lt(events.claimedAt, staleBefore)));
  const candidates = await db.select().from(events).where(and(eq(events.status, "recibido"), lte(events.availableAt, new Date()))).orderBy(events.createdAt).limit(limit);
  const results: Array<Record<string, unknown>> = [];
  for (const candidate of candidates) {
    const claimToken = createHash("sha256").update(`${candidate.id}:${Date.now()}:${Math.random()}`).digest("hex").slice(0, 64);
    await db.update(events).set({ status: "procesando", claimedAt: new Date(), claimToken, attempts: candidate.attempts + 1 }).where(and(eq(events.id, candidate.id), eq(events.status, "recibido"), lte(events.availableAt, new Date())));
    const [claimed] = await db.select().from(events).where(and(eq(events.id, candidate.id), eq(events.claimToken, claimToken), eq(events.status, "procesando"))).limit(1);
    if (!claimed) continue;
    try {
      const result = await processEvent(claimed.flowId, claimed.idempotencyKey, eventPayloadSchema.parse(JSON.parse(claimed.payload)), claimed.id);
      await db.update(events).set({ claimToken: null, claimedAt: null }).where(eq(events.id, claimed.id));
      if ("exception" in result && result.exception) {
        const retryable = "retryable" in result && result.retryable === true;
        await db.update(events).set({ status: retryable ? "recibido" : "excepcion", availableAt: retryable ? new Date(Date.now() + workerBackoffMs(claimed.attempts)) : new Date(), claimToken: null, claimedAt: null, lastError: result.exception }).where(eq(events.id, claimed.id));
        results.push({ eventId: claimed.id, status: retryable ? "reprogramado" : "excepcion", reason: result.exception });
      } else {
        results.push({ eventId: claimed.id, status: "completado", result });
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Error desconocido";
      const retryable = shouldRetryWorkerFailure(error, claimed.attempts);
      if (retryable) {
        await db.update(events).set({ status: "recibido", availableAt: new Date(Date.now() + workerBackoffMs(claimed.attempts)), claimedAt: null, claimToken: null, lastError: reason }).where(eq(events.id, claimed.id));
        results.push({ eventId: claimed.id, status: "reprogramado", reason });
      } else {
        await db.insert(exceptions).values({ eventId: claimed.id, payload: claimed.payload, reason, status: "pendiente" });
        await db.insert(executions).values({ eventId: claimed.id, flowId: claimed.flowId, durationMs: 0, tokenCost: "0", result: JSON.stringify({ reason }), outcome: "excepcion", trace: JSON.stringify({ idempotencyKey: claimed.idempotencyKey, reason, terminal: true }) });
        await db.update(events).set({ status: "excepcion", availableAt: new Date(), claimedAt: null, claimToken: null, lastError: reason }).where(eq(events.id, claimed.id));
        results.push({ eventId: claimed.id, status: "excepcion", reason });
      }
    }
  }
  return { procesados: results.length, resultados: results };
}

export async function reprocessPendingExceptions(limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const pending = await db.select().from(exceptions).where(eq(exceptions.status, "pendiente")).orderBy(exceptions.createdAt).limit(limit);
  const results = [];
  for (const exception of pending) {
    try { results.push(await reprocessException(exception.id)); }
    catch (error) { results.push({ exceptionId: exception.id, exception: error instanceof Error ? error.message : "Error desconocido" }); }
  }
  return { procesadas: results.length, resultados: results };
}

export async function listDashboard(ownerId: number) {
  const db = await getDb();
  if (!db) return { flows: [], executions: [], exceptions: [], metrics: { ticketsProcesados: 0, tasaDeAutomatizacion: 0, costeEstimado: "0", fallos: 0 } };
  const [flowRows, executionRows, exceptionRows] = await Promise.all([
    db.select().from(flows).where(eq(flows.ownerId, ownerId)).orderBy(desc(flows.updatedAt)),
    db.select({ execution: executions }).from(executions).innerJoin(flows, eq(flows.id, executions.flowId)).where(eq(flows.ownerId, ownerId)).orderBy(desc(executions.timestamp)).limit(50),
    db.select({ exception: exceptions }).from(exceptions).innerJoin(events, eq(events.id, exceptions.eventId)).innerJoin(flows, eq(flows.id, events.flowId)).where(eq(flows.ownerId, ownerId)).orderBy(desc(exceptions.createdAt)).limit(50),
  ]);
  const scopedExecutions = executionRows.map(row => row.execution);
  const scopedExceptions = exceptionRows.map(row => row.exception);
  const processed = scopedExecutions.filter(row => row.outcome === "completado" || row.outcome === "regla determinista" || row.outcome === "LLM").length;
  const automated = scopedExecutions.filter(row => row.outcome === "regla determinista" || row.outcome === "LLM").length;
  const estimatedCost = scopedExecutions.reduce((sum, row) => sum + (Number.isFinite(Number(row.tokenCost)) ? Number(row.tokenCost) : 0), 0).toFixed(8);
  return { flows: flowRows, executions: scopedExecutions, exceptions: scopedExceptions, metrics: { ticketsProcesados: processed, tasaDeAutomatizacion: processed ? Math.round((automated / processed) * 100) : 0, costeEstimado: estimatedCost, fallos: scopedExceptions.filter(row => row.status === "pendiente").length } };
}
