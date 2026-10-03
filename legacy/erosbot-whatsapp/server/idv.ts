export type IdvStatus = "verified" | "failed" | "pending" | "expired" | "unavailable";

export type IdvResult = {
  provider: string;
  subjectHash: string;
  status: IdvStatus;
  verifiedAt?: number;
  expiresAt?: number;
  policyVersion: string;
};

/**
 * External IDV boundary. A conversational adult declaration is deliberately
 * not accepted here. A provider adapter must be injected by the operator.
 */
export interface ExternalIdvProvider {
  verify(input: { subjectToken: string; purpose: string }): Promise<IdvResult>;
}

export function isValidIdvResult(result: IdvResult, now = Date.now()) {
  return result.status === "verified"
    && Boolean(result.provider)
    && Boolean(result.subjectHash)
    && Boolean(result.verifiedAt)
    && Boolean(result.expiresAt && result.expiresAt > now)
    && Boolean(result.policyVersion);
}

export function requireValidIdv(result: IdvResult | undefined, now = Date.now()) {
  if (!result || !isValidIdvResult(result, now)) {
    throw new Error("external_idv_required");
  }
  return result;
}
