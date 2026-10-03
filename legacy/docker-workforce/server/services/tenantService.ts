import { eq } from "drizzle-orm";
import { tenants, userTenantRoles } from "../../drizzle/schema";
import { getDb } from "../db";
import { createAuditLog } from "./auditService";

export async function createTenant(
  name: string,
  slug: string,
  userId: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tenants).values({
    name,
    slug,
    createdBy: userId,
  });

  const tenantId = result[0].insertId as number;

  await db.insert(userTenantRoles).values({
    userId,
    tenantId,
    role: "admin",
  });

  await createAuditLog({
    tenantId,
    userId,
    action: "tenant_created",
    resourceType: "tenant",
    resourceId: String(tenantId),
    afterState: { name, slug },
  });

  return tenantId;
}

export async function getTenant(tenantId: number): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserTenants(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(userTenantRoles).where(eq(userTenantRoles.userId, userId));
}

export async function addUserToTenant(
  tenantId: number,
  userId: number,
  role: "admin" | "squad_lead" | "operator" | "employee" | "auditor" | "billing" | "integration",
  addedBy: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(userTenantRoles).values({
    userId,
    tenantId,
    role,
  });

  await createAuditLog({
    tenantId,
    userId: addedBy,
    action: "user_added_to_tenant",
    resourceType: "userTenantRole",
    resourceId: `${userId}_${tenantId}`,
    afterState: { userId, role },
  });
}
