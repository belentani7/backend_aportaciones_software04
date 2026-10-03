import { timingSafeEqual } from "node:crypto";

export function isWebhookSecretValid(expectedSecret: string | undefined, suppliedSecret: string | undefined) {
  if (!expectedSecret || !suppliedSecret) return false;
  const expected = Buffer.from(expectedSecret);
  const supplied = Buffer.from(suppliedSecret);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
