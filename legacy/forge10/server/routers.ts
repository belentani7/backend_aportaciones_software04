import { COOKIE_NAME } from "@shared/const";
import {
  buildAuditExport,
  auditComponents,
  getAuditSummary,
  isPerfectScore,
} from "@shared/audit";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

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
  audit: router({
    components: publicProcedure.query(() => auditComponents),
    summary: publicProcedure.query(() => getAuditSummary(auditComponents)),
    approvedStack: publicProcedure.query(() => ({
      backend: auditComponents.filter(
        component =>
          component.layer === "backend" && isPerfectScore(component.scores)
      ),
      frontend: auditComponents.filter(
        component =>
          component.layer === "frontend" && isPerfectScore(component.scores)
      ),
    })),
    exportJson: publicProcedure.query(() => buildAuditExport(auditComponents)),
  }),
});

export type AppRouter = typeof appRouter;
