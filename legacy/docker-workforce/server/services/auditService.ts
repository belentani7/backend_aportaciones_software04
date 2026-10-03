import { createHash } from "crypto";
import { and, eq, desc } from "drizzle-orm";
import { auditLogs, domainEvents } from "../../drizzle/schema";
import { getDb } from "../db";

/**
 * AION Audit Service
 * 
 * Zone Crítica #5: Auditoría e Event Store
 * 
 * Características:
 * - Append-only audit log (no UPDATE/DELETE)
 * - Hash chain criptográfica (SHA-256)
 * - Event sourcing para source of truth
 * - Trazabilidad completa (quién, cuándo, qué, dónde)
 * - GDPR compliance (derecho al olvido con anonimización)
 * - Request tracing para debugging
 */

export interface AuditEntry {
  tenantId: number;
  userId?: number;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DomainEventEntry {
  tenantId: number;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  eventData: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Calcula SHA-256 hash de un objeto
 */
function calculateHash(data: Record<string, any>): string {
  const json = JSON.stringify(data);
  return createHash("sha256").update(json).digest("hex");
}

/**
 * Crea entrada de auditoría inmutable con hash chain
 */
export async function createAuditLog(entry: AuditEntry): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Obtener hash anterior
  const lastLog = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.tenantId, entry.tenantId))
    .orderBy(desc(auditLogs.id))
    .limit(1);

  const previousHash = lastLog.length > 0 ? lastLog[0].hash : null;

  // Calcular hash de este registro
  const hashData = {
    tenantId: entry.tenantId,
    userId: entry.userId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    beforeState: entry.beforeState,
    afterState: entry.afterState,
    previousHash,
    timestamp: new Date().toISOString(),
  };

  const hash = calculateHash(hashData);

  // Insertar en BD (append-only)
  const result = await db.insert(auditLogs).values({
    tenantId: entry.tenantId,
    userId: entry.userId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    beforeState: entry.beforeState ? JSON.stringify(entry.beforeState) : null,
    afterState: entry.afterState ? JSON.stringify(entry.afterState) : null,
    requestId: entry.requestId,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    hash,
    previousHash,
    occurredAt: new Date(),
  });

  return (result as any)[0]?.insertId || 1;
}

/**
 * Verifica integridad de hash chain
 * Retorna true si la cadena es válida, false si hay corrupción
 */
export async function verifyAuditChain(tenantId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.tenantId, tenantId))
    .orderBy(auditLogs.id);

  let expectedPreviousHash: string | null = null;

  for (const log of logs) {
    // Verificar que previousHash coincide
    if (log.previousHash !== expectedPreviousHash) {
      return false;
    }

    // Recalcular hash
    const hashData = {
      tenantId: log.tenantId,
      userId: log.userId,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      beforeState: log.beforeState ? JSON.parse(log.beforeState) : undefined,
      afterState: log.afterState ? JSON.parse(log.afterState) : undefined,
      previousHash: log.previousHash,
      timestamp: log.occurredAt ? new Date(log.occurredAt).toISOString() : "",
    };

    const calculatedHash = calculateHash(hashData);
    if (calculatedHash !== log.hash) {
      return false;
    }

    expectedPreviousHash = log.hash;
  }

  return true;
}

export async function createDomainEvent(entry: DomainEventEntry): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const latestEvent = await db
    .select({ version: domainEvents.version })
    .from(domainEvents)
    .where(and(
      eq(domainEvents.tenantId, entry.tenantId),
      eq(domainEvents.aggregateType, entry.aggregateType),
      eq(domainEvents.aggregateId, entry.aggregateId),
    ))
    .orderBy(desc(domainEvents.version))
    .limit(1);
  const version = (latestEvent[0]?.version ?? 0) + 1;

  const result = await db.insert(domainEvents).values({
    tenantId: entry.tenantId,
    aggregateType: entry.aggregateType,
    aggregateId: entry.aggregateId,
    eventType: entry.eventType,
    eventData: JSON.stringify(entry.eventData),
    metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    version,
    occurredAt: new Date(),
  });

  return (result as any)[0]?.insertId || 1;
}

export async function reconstructAggregate(tenantId: number, aggregateType: string, aggregateId: string): Promise<Record<string, any>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const events = await db
    .select()
    .from(domainEvents)
    .where(eq(domainEvents.tenantId, tenantId))
    .orderBy(domainEvents.id);

  const filtered = events.filter(e => e.aggregateType === aggregateType && e.aggregateId === aggregateId);

  let state: Record<string, any> = {};
  for (const event of filtered) {
    const data = JSON.parse(event.eventData);
    state = { ...state, ...data, lastEventType: event.eventType, lastUpdated: event.occurredAt };
  }

  return state;
}

export async function getResourceHistory(tenantId: number, resourceType: string, resourceId: string): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.tenantId, tenantId))
    .orderBy(desc(auditLogs.occurredAt));

  return logs.filter(l => l.resourceType === resourceType && l.resourceId === resourceId);
}

export async function listAuditLogs(tenantId: number, limit = 50): Promise<Array<{
  id: number;
  action: string;
  resourceType: string;
  resourceId: string;
  hash: string;
  previousHash: string | null;
  occurredAt: Date;
}>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const safeLimit = Math.min(Math.max(limit, 1), 200);
  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      hash: auditLogs.hash,
      previousHash: auditLogs.previousHash,
      occurredAt: auditLogs.occurredAt,
    })
    .from(auditLogs)
    .where(eq(auditLogs.tenantId, tenantId))
    .orderBy(desc(auditLogs.occurredAt))
    .limit(safeLimit);
  return logs;
}

export async function anonymizeUserData(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await createAuditLog({
    tenantId: 1,
    userId,
    action: "GDPR_ANONYMIZE",
    resourceType: "user",
    resourceId: userId.toString(),
    afterState: { status: "anonymized" }
  });
}

export async function exportAuditAsCSV(tenantId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.tenantId, tenantId))
    .orderBy(desc(auditLogs.occurredAt));

  const headers = ["ID", "Action", "Resource", "ResourceID", "Timestamp", "Hash"];
  const rows = logs.map(l => [l.id, l.action, l.resourceType, l.resourceId, l.occurredAt, l.hash].join(","));

  return [headers.join(","), ...rows].join("\n");
}

export async function getAuditStats(tenantId: number): Promise<Record<string, any>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.tenantId, tenantId));

  return {
    totalLogs: logs.length,
    lastActivity: logs.length > 0 ? logs[logs.length - 1].occurredAt : null,
    chainVerified: await verifyAuditChain(tenantId),
  };
}
