import { afterEach, describe, expect, it } from "vitest";
import { assertSensitiveCapability, configureIdvProvider } from "./capabilities";

const now = Date.now();

afterEach(() => configureIdvProvider(undefined));

describe("sensitive capability enforcement", () => {
  it("rejects without explicit consent", async () => {
    await expect(assertSensitiveCapability({ consentAccepted: false, subjectToken: "subject-token-123456", purpose: "sensitive" })).rejects.toThrow("explicit_consent_required");
  });

  it("rejects when no external IDV provider is configured", async () => {
    await expect(assertSensitiveCapability({ consentAccepted: true, subjectToken: "subject-token-123456", purpose: "sensitive" })).rejects.toThrow("external_idv_required");
  });

  it("accepts only the provider's valid, unexpired result", async () => {
    configureIdvProvider({
      verify: async () => ({ provider: "external-idv", subjectHash: "sha256:subject", status: "verified", verifiedAt: now, expiresAt: now + 60_000, policyVersion: "v1" }),
    });
    await expect(assertSensitiveCapability({ consentAccepted: true, subjectToken: "subject-token-123456", purpose: "sensitive" })).resolves.toMatchObject({ status: "verified" });
  });
});
