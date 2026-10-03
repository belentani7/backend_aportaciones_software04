import { describe, expect, it } from "vitest";
import { isValidIdvResult, requireValidIdv } from "./idv";

describe("external IDV boundary", () => {
  const now = 1_700_000_000_000;
  const valid = { provider: "external-idv", subjectHash: "sha256:subject", status: "verified" as const, verifiedAt: now - 1000, expiresAt: now + 60_000, policyVersion: "v1" };

  it("accepts only an external verified result that has not expired", () => {
    expect(isValidIdvResult(valid, now)).toBe(true);
    expect(isValidIdvResult({ ...valid, status: "pending" }, now)).toBe(false);
    expect(isValidIdvResult({ ...valid, expiresAt: now - 1 }, now)).toBe(false);
  });

  it("rejects missing IDV instead of treating a declaration as verification", () => {
    expect(() => requireValidIdv(undefined, now)).toThrow("external_idv_required");
    expect(() => requireValidIdv({ ...valid, provider: "conversation-declaration", status: "pending" }, now)).toThrow("external_idv_required");
  });
});
