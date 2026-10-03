import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, autoResponses, decisions, controlMetrics, operatingConfig, requests, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import type { GateConfig } from "./capacityEngine";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId, name: user.name, email: user.email, loginMethod: user.loginMethod, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) { if (user[field] !== undefined) { updateSet[field] = user[field] ?? null; } }
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) { values.role = user.role ?? "admin"; updateSet.role = values.role; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0];
}

const defaultConfig: GateConfig = {
  theoreticalCapacity: 100, qualityFactor: 0.8, humanFactor: 0.8, safetyBuffer: 0.8, minimumMargin: 50,
  maxResponseMinutes: 60, maxRisk: "medium" as const, authorizedChannels: ["web", "email", "referral"],
  queueOrangeThreshold: 85, queueRedThreshold: 100, errorThreshold: 0.08, confidenceThreshold: 0.65, ruleVersion: "1.0.0",
};

function parseConfig(row: typeof operatingConfig.$inferSelect | undefined) {
  if (!row) return defaultConfig;
  return { ...row, qualityFactor: Number(row.qualityFactor), humanFactor: Number(row.humanFactor), safetyBuffer: Number(row.safetyBuffer), minimumMargin: Number(row.minimumMargin), errorThreshold: Number(row.errorThreshold), confidenceThreshold: Number(row.confidenceThreshold), authorizedChannels: JSON.parse(row.authorizedChannels || "[]") };
}

export async function getConfig(ownerId: number) {
  const db = await getDb(); if (!db) return defaultConfig;
  const rows = await db.select().from(operatingConfig).where(eq(operatingConfig.ownerId, ownerId)).limit(1); return parseConfig(rows[0]);
}

export async function saveConfig(ownerId: number, input: typeof defaultConfig) {
  const db = await getDb(); if (!db) return input;
  const existing = await db.select().from(operatingConfig).where(eq(operatingConfig.ownerId, ownerId)).limit(1);
  const values = { ...input, ownerId, qualityFactor: String(input.qualityFactor), humanFactor: String(input.humanFactor), safetyBuffer: String(input.safetyBuffer), minimumMargin: String(input.minimumMargin), errorThreshold: String(input.errorThreshold), confidenceThreshold: String(input.confidenceThreshold), authorizedChannels: JSON.stringify(input.authorizedChannels), ruleVersion: `1.${Date.now()}` };
  if (existing[0]) await db.update(operatingConfig).set(values).where(eq(operatingConfig.id, existing[0].id));
  else await db.insert(operatingConfig).values(values);
  return getConfig(ownerId);
}

export async function getSnapshot(ownerId: number) {
  const db = await getDb();
  if (!db) return { currentLoad: 42, queueLoad: 31, errorRate: 0.03, responseMinutes: 18, humanInterventionRate: 0.24, duplicateRate: 0.01, incidentCount: 1 };
  const rows = await db.select({ load: sql<number>`coalesce(sum(case when ${requests.status} in ('accepted','processing') then ${requests.estimatedLoad} else 0 end), 0)`, queue: sql<number>`coalesce(sum(case when ${requests.status} in ('waitlist','human_review') then ${requests.estimatedLoad} else 0 end), 0)`, count: sql<number>`count(*)` }).from(requests).where(eq(requests.ownerId, ownerId));
  const metric = await db.select().from(controlMetrics).where(eq(controlMetrics.ownerId, ownerId)).orderBy(desc(controlMetrics.createdAt)).limit(1);
  const row = rows[0] ?? { load: 0, queue: 0, count: 0 }; const m = metric[0];
  return { currentLoad: Number(row.load), queueLoad: Number(row.queue), errorRate: Number(m?.errorRate ?? 0), responseMinutes: Number(m?.responseMinutes ?? 0), humanInterventionRate: Number(m?.humanInterventionRate ?? 0), duplicateRate: Number(m?.duplicateRate ?? 0), incidentCount: Number(m?.incidentCount ?? 0) };
}

export async function listRequests(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(requests).where(eq(requests.ownerId, ownerId)).orderBy(desc(requests.createdAt)).limit(50); }
export async function listDecisions(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(decisions).where(eq(decisions.ownerId, ownerId)).orderBy(desc(decisions.createdAt)).limit(50); }
export async function listMetrics(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(controlMetrics).where(eq(controlMetrics.ownerId, ownerId)).orderBy(desc(controlMetrics.createdAt)).limit(20); }
export async function listResponses(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(autoResponses).where(eq(autoResponses.ownerId, ownerId)).orderBy(autoResponses.outcome); }

export { autoResponses, decisions, controlMetrics, operatingConfig, requests };
