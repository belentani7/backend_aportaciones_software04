import { eq } from "drizzle-orm";
import { auditLogs } from "../../drizzle/schema";
import { getDb } from "../db";

export interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  components: Record<string, any>;
  uptime: number;
}

export interface MetricSnapshot {
  timestamp: Date;
  auditLogsCount: number;
  shiftsCount: number;
  complianceViolations: number;
  averageResponseTime: number;
}

export async function healthCheck(): Promise<HealthCheck> {
  const db = await getDb();
  const startTime = Date.now();

  const components: Record<string, any> = {
    database: { status: db ? "ok" : "error" },
    timestamp: new Date(),
  };

  const status = db ? "healthy" : "unhealthy";
  const responseTime = Date.now() - startTime;

  return {
    status,
    timestamp: new Date(),
    components,
    uptime: process.uptime(),
  };
}

export async function getMetrics(tenantId: number): Promise<MetricSnapshot> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const logs = await db.select().from(auditLogs).where(eq(auditLogs.tenantId, tenantId));

  return {
    timestamp: new Date(),
    auditLogsCount: logs.length,
    shiftsCount: 0,
    complianceViolations: 0,
    averageResponseTime: 0,
  };
}

export function logPerformance(
  operation: string,
  duration: number,
  success: boolean,
  metadata?: Record<string, any>
): void {
  const level = success ? "info" : "warn";
  console.log(`[PERF] ${operation}: ${duration}ms [${level}]`, metadata);
}

export function logError(
  context: string,
  error: Error,
  metadata?: Record<string, any>
): void {
  console.error(`[ERROR] ${context}:`, error.message, metadata);
}
