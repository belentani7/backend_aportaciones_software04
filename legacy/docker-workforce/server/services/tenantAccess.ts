import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { userTenantRoles } from "../../drizzle/schema";
import { getDb } from "../db";

export async function requireTenantAccess(userId: number, tenantId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database not available" });

  const membership = await db
    .select({ id: userTenantRoles.id })
    .from(userTenantRoles)
    .where(and(eq(userTenantRoles.userId, userId), eq(userTenantRoles.tenantId, tenantId)))
    .limit(1);

  if (membership.length === 0 && userId !== tenantId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Tenant access denied" });
  }
}
