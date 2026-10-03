import { describe, expect, it } from "vitest";
import { assertPlatformPaymentPurpose } from "./paymentBoundary";

describe("platform payment boundary", () => {
  it("allows only platform premium access without custody", () => {
    expect(assertPlatformPaymentPurpose("premium_access")).toEqual({ purpose: "premium_access", custodial: false, beneficiary: "platform" });
  });

  it.each(["third_party_booking", "escrow", "split_payment", "refund", "commission"] as const)("rejects %s", purpose => {
    expect(() => assertPlatformPaymentPurpose(purpose)).toThrow("third_party_payments_not_supported");
  });
});
