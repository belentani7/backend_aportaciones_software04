import { TRPCError } from "@trpc/server";

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  RATE_LIMIT: "RATE_LIMIT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  COMPLIANCE_VIOLATION: "COMPLIANCE_VIOLATION",
  MULTI_TENANT_VIOLATION: "MULTI_TENANT_VIOLATION",
};

export function toTRPCError(error: any): TRPCError {
  if (error instanceof AppError) {
    const codeMap: Record<string, any> = {
      [ErrorCodes.UNAUTHORIZED]: "UNAUTHORIZED",
      [ErrorCodes.FORBIDDEN]: "FORBIDDEN",
      [ErrorCodes.NOT_FOUND]: "NOT_FOUND",
      [ErrorCodes.VALIDATION_ERROR]: "BAD_REQUEST",
      [ErrorCodes.CONFLICT]: "CONFLICT",
      [ErrorCodes.RATE_LIMIT]: "TOO_MANY_REQUESTS",
      [ErrorCodes.COMPLIANCE_VIOLATION]: "FORBIDDEN",
      [ErrorCodes.MULTI_TENANT_VIOLATION]: "FORBIDDEN",
    };

    return new TRPCError({
      code: codeMap[error.code] || "INTERNAL_SERVER_ERROR",
      message: error.message,
      cause: error.context,
    });
  }

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error?.message || "Unknown error",
  });
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[ERROR]", error, context);
    throw toTRPCError(error);
  }
}

export function validateTenantAccess(userTenantId: number, resourceTenantId: number): void {
  if (userTenantId !== resourceTenantId) {
    throw new AppError(
      ErrorCodes.MULTI_TENANT_VIOLATION,
      "Access denied: tenant mismatch",
      403,
      { userTenantId, resourceTenantId }
    );
  }
}

export function validateComplianceState(violations: any[]): void {
  const critical = violations.filter((v) => v.severity === "critical");
  if (critical.length > 0) {
    throw new AppError(
      ErrorCodes.COMPLIANCE_VIOLATION,
      `${critical.length} critical compliance violations detected`,
      400,
      { violations: critical }
    );
  }
}
