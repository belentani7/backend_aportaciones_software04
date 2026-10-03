import { z } from "zod";
import { eq } from "drizzle-orm";
import { tenants, userTenantRoles } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { createTenant, getUserTenants } from "../services/tenantService";

export const tenantsRouter = router({
  listUserTenants: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const memberships = await getUserTenants(ctx.user.id);
    if (memberships.length === 0) {
      // Auto-provision a default tenant if none exists for this user to prevent zero-tenant isolation lockouts
      const defaultTenantId = await createTenant(
        `${ctx.user.name || "Empresa"} (Principal)`,
        `tenant-${ctx.user.id}-${Date.now()}`,
        ctx.user.id
      );
      return [{
        id: defaultTenantId,
        name: `${ctx.user.name || "Empresa"} (Principal)`,
        slug: `tenant-${ctx.user.id}-${Date.now()}`,
        role: "admin",
      }];
    }

    const results = [];
    for (const m of memberships) {
      const t = await db.select().from(tenants).where(eq(tenants.id, m.tenantId)).limit(1);
      if (t.length > 0) {
        results.push({
          id: t[0].id,
          name: t[0].name,
          slug: t[0].slug,
          role: m.role,
        });
      }
    }
    return results;
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(2), slug: z.string().min(2) }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await createTenant(input.name, input.slug, ctx.user.id);
      return { success: true, tenantId };
    }),
});
