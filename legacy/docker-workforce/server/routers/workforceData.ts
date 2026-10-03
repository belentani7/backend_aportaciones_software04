import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { employees, shifts, complianceViolations, userTenantRoles } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { createAuditLog, listAuditLogs, verifyAuditChain } from "../services/auditService";

async function requireTenantAccess(userId: number, tenantId: number): Promise<void> {
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

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export const shiftsRouter = router({
  list: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireTenantAccess(ctx.user.id, input.tenantId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database not available" });

      const rows = await db
        .select()
        .from(shifts)
        .where(and(eq(shifts.tenantId, input.tenantId), eq(shifts.deletedAt, null as any)))
        .orderBy(desc(shifts.startTime));

      return rows.map((row) => ({
        id: row.id,
        employeeId: row.employeeId ?? 0,
        startTime: row.startTime,
        endTime: row.endTime,
        shiftType: (row.shiftType === "afternoon" || row.shiftType === "night" ? row.shiftType : "morning") as "morning" | "afternoon" | "night",
        status: (row.status === "published" || row.status === "completed" ? row.status : "scheduled") as "scheduled" | "published" | "completed",
      }));
    }),
});

export const employeesRouter = router({
  list: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireTenantAccess(ctx.user.id, input.tenantId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database not available" });

      const rows = await db
        .select()
        .from(employees)
        .where(and(eq(employees.tenantId, input.tenantId), eq(employees.isActive, true)));

      return rows.map((row) => ({
        id: row.id,
        name: `${row.firstName} ${row.lastName}`.trim(),
        email: row.email,
        phone: row.phone ?? "",
        contractType: row.contractType === "part_time" ? "part-time" : "full-time",
        birthDate: row.birthDate ?? new Date(0),
        skills: parseJsonArray(row.skills),
        availability: {},
      }));
    }),

  create: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      hireDate: z.date(),
      contractType: z.enum(["permanent", "temporary", "apprentice", "part_time"]).default("permanent"),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireTenantAccess(ctx.user.id, input.tenantId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database not available" });

      const result = await db.insert(employees).values({
        tenantId: input.tenantId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        hireDate: input.hireDate,
        contractType: input.contractType,
        createdBy: ctx.user.id,
        updatedBy: ctx.user.id,
      });

      await createAuditLog({
        tenantId: input.tenantId,
        userId: ctx.user.id,
        action: "employee_created",
        resourceType: "employee",
        resourceId: String((result as any)[0]?.insertId ?? "unknown"),
        afterState: input,
      });

      return { success: true, id: (result as any)[0]?.insertId ?? 0 };
    }),

  update: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      employeeId: z.number(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireTenantAccess(ctx.user.id, input.tenantId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database not available" });

      const { tenantId, employeeId, ...updates } = input;
      await db.update(employees).set({ ...updates, updatedBy: ctx.user.id, updatedAt: new Date() }).where(
        and(eq(employees.id, employeeId), eq(employees.tenantId, tenantId)),
      );

      await createAuditLog({
        tenantId,
        userId: ctx.user.id,
        action: "employee_updated",
        resourceType: "employee",
        resourceId: String(employeeId),
        afterState: updates,
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ tenantId: z.number(), employeeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireTenantAccess(ctx.user.id, input.tenantId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database not available" });

      await db.update(employees).set({ isActive: false, deletedAt: new Date(), updatedBy: ctx.user.id }).where(
        and(eq(employees.id, input.employeeId), eq(employees.tenantId, input.tenantId)),
      );

      await createAuditLog({
        tenantId: input.tenantId,
        userId: ctx.user.id,
        action: "employee_deactivated",
        resourceType: "employee",
        resourceId: String(input.employeeId),
        afterState: { isActive: false },
      });

      return { success: true };
    }),
});

export const auditRouter = router({
  list: protectedProcedure
    .input(z.object({ tenantId: z.number(), limit: z.number().int().positive().max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      await requireTenantAccess(ctx.user.id, input.tenantId);
      const [logs, integrity] = await Promise.all([
        listAuditLogs(input.tenantId, input.limit),
        verifyAuditChain(input.tenantId),
      ]);
      return { logs, integrity };
    }),
});

export const complianceRouter = router({
  violations: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireTenantAccess(ctx.user.id, input.tenantId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database not available" });

      const rows = await db
        .select()
        .from(complianceViolations)
        .where(eq(complianceViolations.tenantId, input.tenantId))
        .orderBy(desc(complianceViolations.createdAt));

      return rows.map((row) => ({
        id: row.id,
        employeeId: row.employeeId ?? 0,
        violationType: row.violationType,
        severity: row.severity === "critical" ? "critical" : "warning",
        description: row.description ?? "",
        detectedAt: row.createdAt,
        resolved: row.isResolved ?? false,
      }));
    }),
});
