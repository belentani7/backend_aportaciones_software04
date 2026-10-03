import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, events, exceptions, executions, flows, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = values[field]; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export function resolveDestinationUrl(action: "log interno" | "webhook saliente", supplied?: string) {
  if (action === "log interno") return null;
  const candidate = supplied ?? process.env.OUTBOUND_WEBHOOK_URL;
  if (!candidate) throw new Error("destinationUrl requerido para webhook saliente");
  let url: URL;
  try { url = new URL(candidate); } catch { throw new Error("destinationUrl inválido"); }
  if (url.protocol !== "https:") throw new Error("destinationUrl debe usar HTTPS");
  return url.toString();
}

export async function createFlow(input: { nombre: string; descripción: string; reglas: string; umbralDeConfianzaMínima: number; acciónDestino: "webhook saliente" | "log interno"; destinoWebhook?: string }, ownerId: number, databaseOverride?: { insert: (...args: any[]) => any } | null) {
  const destinationUrl = resolveDestinationUrl(input.acciónDestino, input.destinoWebhook);
  const db = databaseOverride === undefined ? await getDb() : databaseOverride;
  if (!db) throw new Error("Database unavailable");
  const [created] = await db.insert(flows).values({
    ownerId,
    name: input.nombre,
    description: input.descripción,
    rules: input.reglas,
    confidenceThreshold: input.umbralDeConfianzaMínima.toFixed(2),
    destinationType: input.acciónDestino,
    destinationUrl,
  }).$returningId();
  return { id: created.id };
}

export async function getFlows(ownerId: number) {
  const db = await getDb();
  return db ? db.select().from(flows).where(eq(flows.ownerId, ownerId)).orderBy(desc(flows.updatedAt)) : [];
}

export async function getExceptions(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ exception: exceptions }).from(exceptions).innerJoin(events, eq(events.id, exceptions.eventId)).innerJoin(flows, eq(flows.id, events.flowId)).where(eq(flows.ownerId, ownerId)).orderBy(desc(exceptions.createdAt)).limit(100);
  return rows.map(row => row.exception);
}

export async function resolveException(id: number, ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const owned = await db.select({ id: exceptions.id, status: exceptions.status }).from(exceptions).innerJoin(events, eq(events.id, exceptions.eventId)).innerJoin(flows, eq(flows.id, events.flowId)).where(and(eq(flows.ownerId, ownerId), eq(exceptions.id, id))).limit(1);
  if (!owned[0] || owned[0].status !== "pendiente") throw new Error("Exception not pending");
  await db.update(exceptions).set({ status: "resuelto", resolvedAt: new Date() }).where(and(eq(exceptions.id, id), eq(exceptions.status, "pendiente")));
  return { success: true } as const;
}

export async function getExecutions(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ execution: executions }).from(executions).innerJoin(flows, eq(flows.id, executions.flowId)).where(eq(flows.ownerId, ownerId)).orderBy(desc(executions.timestamp)).limit(100);
  return rows.map(row => row.execution);
}
