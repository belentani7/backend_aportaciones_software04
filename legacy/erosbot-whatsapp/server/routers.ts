import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDemoSnapshot, processDemoMessage } from "./demo";
import { assertSensitiveCapability } from "./capabilities";
import { createBoundedRateLimiter } from "./rateLimiter";
import { incrementMetric } from "./observability";

const demoRateLimiter = createBoundedRateLimiter({ maxKeys: 10_000, windowMs: 60_000, maxRequests: 30 });

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  demo: router({
    snapshot: publicProcedure.query(() => getDemoSnapshot()),
    processMessage: publicProcedure
      .input(z.object({ from: z.string().regex(/^[a-zA-Z0-9._+-]{3,128}$/), text: z.string().trim().min(1).max(4000) }))
      .mutation(({ ctx, input }) => {
        const key = String(ctx.req.ip ?? ctx.req.socket?.remoteAddress ?? "anonymous");
        const limit = demoRateLimiter.check(key);
        if (!limit.allowed) {
          incrementMetric("api_rate_limited");
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "demo_rate_limited", cause: { retryAfterMs: limit.retryAfterMs } });
        }
        return processDemoMessage({ id: `demo_${Date.now()}`, from: input.from, text: input.text, timestamp: Date.now() });
      }),
    requestSensitiveCapability: publicProcedure
      .input(z.object({ consentAccepted: z.literal(true), subjectToken: z.string().min(16).max(4096), purpose: z.string().min(3).max(120) }))
      .mutation(({ input }) => assertSensitiveCapability(input)),
  }),
});

export type AppRouter = typeof appRouter;
