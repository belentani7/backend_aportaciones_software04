import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createFlow, getFlows, getExceptions, getExecutions, resolveException } from "./db";
import { listDashboard, reprocessException } from "./automation";

const flowInput = z.object({
  nombre: z.string().min(1).max(160),
  descripción: z.string().min(1),
  reglas: z.string().min(2),
  umbralDeConfianzaMínima: z.coerce.number().min(0).max(1),
  acciónDestino: z.enum(["webhook saliente", "log interno"]),
  destinoWebhook: z.string().url().refine(value => value.startsWith("https://"), "destinoWebhook debe usar HTTPS").optional(),
}).superRefine((value, ctx) => {
  if (value.acciónDestino === "webhook saliente" && !value.destinoWebhook && !process.env.OUTBOUND_WEBHOOK_URL) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["destinoWebhook"], message: "destinoWebhook requerido para webhook saliente" });
  }
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: protectedProcedure.query(({ ctx }) => listDashboard(ctx.user.id)),
  flows: router({
    list: protectedProcedure.query(({ ctx }) => getFlows(ctx.user.id)),
    create: protectedProcedure.input(flowInput).mutation(({ ctx, input }) => createFlow(input, ctx.user.id)),
  }),
  executions: protectedProcedure.query(({ ctx }) => getExecutions(ctx.user.id)),
  exceptions: router({
    list: protectedProcedure.query(({ ctx }) => getExceptions(ctx.user.id)),
    resolve: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => resolveException(input.id, ctx.user.id)),
    reprocess: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => reprocessException(input.id, ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
