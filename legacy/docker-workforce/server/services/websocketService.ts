import { createAuditLog } from "./auditService";
import crypto from "crypto";

export interface WebSocketConnection {
  userId: number;
  tenantId: number;
  connectionId: string;
  connectedAt: Date;
  lastHeartbeat: Date;
}

export interface NotificationPayload {
  type: "task_complete" | "compliance_violation" | "schedule_published" | "payroll_ready";
  taskId: string;
  taskName: string;
  status: "success" | "warning" | "error";
  timestamp: Date;
}

const activeConnections = new Map<string, WebSocketConnection>();
const connectionsByTenant = new Map<number, Set<string>>();
const connectionsByUser = new Map<number, Set<string>>();

export function registerConnection(
  userId: number,
  tenantId: number
): string {
  const connectionId = crypto.randomUUID();
  const connection: WebSocketConnection = {
    userId,
    tenantId,
    connectionId,
    connectedAt: new Date(),
    lastHeartbeat: new Date(),
  };

  activeConnections.set(connectionId, connection);

  if (!connectionsByTenant.has(tenantId)) {
    connectionsByTenant.set(tenantId, new Set());
  }
  connectionsByTenant.get(tenantId)!.add(connectionId);

  if (!connectionsByUser.has(userId)) {
    connectionsByUser.set(userId, new Set());
  }
  connectionsByUser.get(userId)!.add(connectionId);

  return connectionId;
}

export function unregisterConnection(connectionId: string): void {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;

  activeConnections.delete(connectionId);
  connectionsByTenant.get(connection.tenantId)?.delete(connectionId);
  connectionsByUser.get(connection.userId)?.delete(connectionId);
}

export function getConnectionsByTenant(tenantId: number): WebSocketConnection[] {
  const connectionIds = connectionsByTenant.get(tenantId) || new Set();
  return Array.from(connectionIds)
    .map((id) => activeConnections.get(id))
    .filter((c) => c !== undefined) as WebSocketConnection[];
}

export function getConnectionsByUser(userId: number): WebSocketConnection[] {
  const connectionIds = connectionsByUser.get(userId) || new Set();
  return Array.from(connectionIds)
    .map((id) => activeConnections.get(id))
    .filter((c) => c !== undefined) as WebSocketConnection[];
}

export async function broadcastNotification(
  tenantId: number,
  userId: number,
  payload: NotificationPayload
): Promise<void> {
  const connections = getConnectionsByUser(userId).filter(
    (c) => c.tenantId === tenantId
  );

  for (const connection of connections) {
    // Aquí se enviaría el mensaje al WebSocket
    // En producción, esto se haría con una librería como `ws` o Socket.io
    console.log(`[WS] Sending notification to ${connection.connectionId}:`, payload);
  }

  await createAuditLog({
    tenantId,
    userId,
    action: "notification_sent",
    resourceType: "notification",
    resourceId: payload.taskId,
    afterState: payload,
    requestId: crypto.randomUUID(),
  });
}

export function updateHeartbeat(connectionId: string): boolean {
  const connection = activeConnections.get(connectionId);
  if (!connection) return false;

  connection.lastHeartbeat = new Date();
  return true;
}

export function pruneStaleConnections(maxIdleMs: number = 60000): number {
  const now = new Date();
  let pruned = 0;

  for (const [connectionId, connection] of Array.from(activeConnections.entries())) {
    const idleTime = now.getTime() - connection.lastHeartbeat.getTime();
    if (idleTime > maxIdleMs) {
      unregisterConnection(connectionId);
      pruned++;
    }
  }

  return pruned;
}

export function getConnectionStats(): Record<string, any> {
  return {
    totalConnections: activeConnections.size,
    tenants: connectionsByTenant.size,
    users: connectionsByUser.size,
    connectionsByTenant: Object.fromEntries(
      Array.from(connectionsByTenant.entries()).map(([tenantId, conns]) => [
        tenantId,
        conns.size,
      ])
    ),
  };
}
