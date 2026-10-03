export type PaymentPurpose = "premium_access" | "third_party_booking" | "escrow" | "split_payment" | "refund" | "commission";

export function assertPlatformPaymentPurpose(purpose: PaymentPurpose) {
  if (purpose !== "premium_access") {
    throw new Error("third_party_payments_not_supported");
  }
  return { purpose, custodial: false as const, beneficiary: "platform" as const };
}
