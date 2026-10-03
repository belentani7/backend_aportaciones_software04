import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { generateSchedule, publishSchedule } from "../services/schedulingEngine";
import { calculatePayroll } from "../services/payrollService";
import { requestAbsence, approveAbsence } from "../services/absenceService";
import { getComplianceStats } from "../services/complianceEngine";
import { loadQuorumIdentitiesFromEnv } from "../services/quorumService";
import { requireTenantAccess } from "../services/tenantAccess";

export const workforceRouter = router({
  generateSchedule: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      startDate: z.date(),
      endDate: z.date(),
      employeeIds: z.array(z.number()),
      market: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireTenantAccess(ctx.user.id, input.tenantId);
      return await generateSchedule({ tenantId: input.tenantId, startDate: input.startDate, endDate: input.endDate, employeeIds: input.employeeIds, market: input.market });
    }),

  publishSchedule: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      shifts: z.array(z.object({ id: z.number() })),
      operation: z.object({
        operationId: z.string().min(1),
        tenantId: z.number(),
        operationType: z.literal("publish_schedule"),
        payload: z.record(z.string(), z.unknown()),
        createdAt: z.string(),
        expiresAt: z.string(),
      }),
      confirmations: z.array(z.object({
        nodeId: z.string().min(1),
        algorithm: z.enum(["ed25519", "ecdsa-p256"]),
        operationId: z.string().min(1),
        payloadDigest: z.string().length(64),
        confirmedAt: z.string(),
        signatureBase64: z.string().min(1),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireTenantAccess(ctx.user.id, input.tenantId);
      const identities = loadQuorumIdentitiesFromEnv();
      if (identities.length !== 3) throw new Error("Three quorum node identities are required before publication");
      return await publishSchedule(input.tenantId, input.shifts, {
        operation: input.operation,
        confirmations: input.confirmations,
        identities,
      });
    }),

  calculatePayroll: protectedProcedure
    .input(z.object({ tenantId: z.number(), employeeId: z.number(), period: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireTenantAccess(ctx.user.id, input.tenantId);
      return await calculatePayroll(input.tenantId, input.employeeId, input.period);
    }),

  requestAbsence: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      employeeId: z.number(),
      absenceType: z.string(),
      startDate: z.date(),
      endDate: z.date(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireTenantAccess(ctx.user.id, input.tenantId);
      const id = await requestAbsence(
        input.tenantId,
        input.employeeId,
        input.absenceType,
        input.startDate,
        input.endDate,
        input.reason,
        ctx.user.id
      );
      return { id };
    }),

  approveAbsence: protectedProcedure
    .input(z.object({ tenantId: z.number(), absenceId: z.number(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await requireTenantAccess(ctx.user.id, input.tenantId);
      await approveAbsence(input.tenantId, input.absenceId, ctx.user.id, input.notes);
      return { success: true };
    }),

  getComplianceStats: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireTenantAccess(ctx.user.id, input.tenantId);
      return await getComplianceStats(input.tenantId);
    }),
});
