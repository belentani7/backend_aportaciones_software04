import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { assistantSessions, auditEvents } from "../drizzle/schema";
import { getDb, purgeExpiredOperationalData } from "./db";
import { processDemoMessage } from "./demo";
import { createHash } from "node:crypto";

describe("operational durable integration", () => {
  it("persists a session and audit event, then purges them by retention", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    const phone = `integration-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const key = createHash("sha256").update(phone).digest("hex").slice(0, 24);
    await processDemoMessage({ id: `integration-${Date.now()}`, from: phone, text: "Hola", timestamp: Date.now() });
    const storedSession = await db!.select().from(assistantSessions).where(eq(assistantSessions.sessionKey, key)).limit(1);
    const storedAudit = await db!.select().from(auditEvents).where(eq(auditEvents.subjectHash, key)).limit(1);
    expect(storedSession.length).toBe(1);
    expect(storedAudit.length).toBeGreaterThan(0);
    await purgeExpiredOperationalData(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    const afterSession = await db!.select().from(assistantSessions).where(eq(assistantSessions.sessionKey, key)).limit(1);
    const afterAudit = await db!.select().from(auditEvents).where(eq(auditEvents.subjectHash, key)).limit(1);
    expect(afterSession.length).toBe(0);
    expect(afterAudit.length).toBe(0);
  });
});
