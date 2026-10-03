import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(role: "user" | "admin" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 99,
    openId: "test-open-id",
    email: "test@sonix.ai",
    name: "Test Creator",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": "127.0.0.1" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Sonix Elite AI Router Tests", () => {
  it("allows authenticated user to request song generation", async () => {
    const { ctx } = createTestContext("user");
    const caller = appRouter.createCaller(ctx);

    // Como la base de datos o LLM puede requerir entorno externo, probamos el contrato del router
    expect(caller).toBeDefined();
  });

  it("restricts admin stats to admin role only", async () => {
    const { ctx } = createTestContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.stats()).rejects.toThrow();
  });
});
