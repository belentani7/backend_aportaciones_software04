import { requireValidIdv, type ExternalIdvProvider, type IdvResult } from "./idv";

let provider: ExternalIdvProvider | undefined;

export function configureIdvProvider(next: ExternalIdvProvider | undefined) {
  provider = next;
}

export async function assertSensitiveCapability(input: { consentAccepted: boolean; subjectToken: string; purpose: string }): Promise<IdvResult> {
  if (!input.consentAccepted) throw new Error("explicit_consent_required");
  if (!provider) throw new Error("external_idv_required");
  const result = await provider.verify({ subjectToken: input.subjectToken, purpose: input.purpose });
  return requireValidIdv(result);
}
