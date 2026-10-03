import { eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, safetyReviews, messageIdempotency, assistantSessions, auditEvents, type InsertSafetyReview } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createSafetyReview(review: InsertSafetyReview) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(safetyReviews).values(review).onDuplicateKeyUpdate({ set: { status: review.status ?? "pending" } });
  const rows = await db.select().from(safetyReviews).where(eq(safetyReviews.externalId, review.externalId)).limit(1);
  return rows[0];
}

export async function listPendingSafetyReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(safetyReviews).where(eq(safetyReviews.status, "pending"));
}

export async function upsertAssistantSession(session: { sessionKey: string; state: string; language: string; premium: boolean; expiresAt: Date }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(assistantSessions).values({ ...session, premium: session.premium ? 1 : 0 }).onDuplicateKeyUpdate({
    set: { state: session.state, language: session.language, premium: session.premium ? 1 : 0, expiresAt: session.expiresAt, updatedAt: new Date() },
  });
}

export async function createAuditEvent(event: { eventType: string; subjectHash: string; ruleCode?: string; severity?: "low" | "medium" | "high" | "critical"; expiresAt: Date }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditEvents).values(event);
}

export async function claimMessageId(messageId: string, messageHash: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return true;
  try {
    await db.insert(messageIdempotency).values({ messageId, messageHash, expiresAt, status: "processing" });
    return true;
  } catch (error) {
    const nestedMessage = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
    const message = `${error instanceof Error ? error.message : ""} ${nestedMessage}`;
    if (/duplicate|unique|ER_DUP_ENTRY/i.test(message)) {
      const existing = await db.select({ status: messageIdempotency.status }).from(messageIdempotency).where(eq(messageIdempotency.messageId, messageId)).limit(1);
      if (existing[0]?.status === "failed") {
        await db.update(messageIdempotency).set({ status: "processing", messageHash, expiresAt }).where(eq(messageIdempotency.messageId, messageId));
        return true;
      }
      return false;
    }
    throw error;
  }
}

export async function markMessageProcessed(messageId: string, status: "processed" | "failed" = "processed") {
  const db = await getDb();
  if (!db) return;
  await db.update(messageIdempotency).set({ status }).where(eq(messageIdempotency.messageId, messageId));
}

export async function purgeExpiredOperationalData(now = new Date()) {
  const db = await getDb();
  if (!db) return { sessions: 0, idempotency: 0, audit: 0 };
  const sessions = await db.delete(assistantSessions).where(lt(assistantSessions.expiresAt, now));
  const idempotency = await db.delete(messageIdempotency).where(lt(messageIdempotency.expiresAt, now));
  const audit = await db.delete(auditEvents).where(lt(auditEvents.expiresAt, now));
  return { sessions: Number((sessions as any).affectedRows ?? 0), idempotency: Number((idempotency as any).affectedRows ?? 0), audit: Number((audit as any).affectedRows ?? 0) };
}
