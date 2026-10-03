import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { workforceRouter } from "./routers/workforce";
import { shiftsRouter, employeesRouter, complianceRouter, auditRouter } from "./routers/workforceData";
import { tenantsRouter } from "./routers/tenants";

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
  workforce: workforceRouter,
  shifts: shiftsRouter,
  employees: employeesRouter,
  compliance: complianceRouter,
  audit: auditRouter,
  tenants: tenantsRouter,
});

export type AppRouter = typeof appRouter;
