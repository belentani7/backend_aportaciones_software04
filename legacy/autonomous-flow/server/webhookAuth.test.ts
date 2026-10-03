import { describe, expect, it } from "vitest";
import { isWebhookSecretValid } from "./webhookAuth";

describe("webhook secret", () => {
  it("accepts the configured secret and rejects incorrect credentials", () => {
    const configured = process.env.WEBHOOK_SHARED_SECRET;
    expect(configured).toBeTruthy();
    expect(isWebhookSecretValid(configured, configured)).toBe(true);
    expect(isWebhookSecretValid(configured, "incorrect-secret")).toBe(false);
    expect(isWebhookSecretValid(configured, undefined)).toBe(false);
  });
});
