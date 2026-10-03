import { describe, expect, it } from "vitest";
import { clampDailyLimit, isEligibleForSimulation, normalizeConsent, renderTemplate } from "./leadEnginePolicy";

describe("lead engine policy", () => {
  it("requires proof before treating consent as verified", () => {
    expect(normalizeConsent("verified")).toBe("pending");
    expect(normalizeConsent("verified", "form:2026-08-28T10:00Z")).toBe("verified");
    expect(normalizeConsent("unknown")).toBe("unknown");
  });

  it("blocks revoked or suppressed contacts regardless of channel", () => {
    const base = { email: "ana@example.com", phone: "+34123456789", consentStatus: "verified" as const, status: "new" as const };
    expect(isEligibleForSimulation({ ...base, doNotContact: true }, "email").eligible).toBe(false);
    expect(isEligibleForSimulation({ ...base, consentStatus: "revoked", doNotContact: false }, "email").reasons).toContain("consent_not_verified");
    expect(isEligibleForSimulation({ ...base, doNotContact: true }, "email").reasons).toContain("suppression_list");
  });

  it("requires the destination channel and an untouched lifecycle", () => {
    const lead = { email: "ana@example.com", phone: null, consentStatus: "verified" as const, doNotContact: false, status: "new" as const };
    expect(isEligibleForSimulation(lead, "email").eligible).toBe(true);
    expect(isEligibleForSimulation(lead, "whatsapp").reasons).toContain("missing_whatsapp");
    expect(isEligibleForSimulation({ ...lead, status: "contacted" }, "email").reasons).toContain("already_contacted");
  });

  it("renders allowed variables and rejects unknown data", () => {
    expect(renderTemplate("Hola {{name}} — {{businessName}}", { name: "Ana", businessName: "Clínica Norte" })).toBe("Hola Ana — Clínica Norte");
    expect(() => renderTemplate("Hola {{secret}}", { name: "Ana", businessName: "Clínica Norte" })).toThrow("Variables no permitidas");
  });

  it("clamps daily limits to a safe range", () => {
    expect(clampDailyLimit(-4)).toBe(1);
    expect(clampDailyLimit(25.9)).toBe(25);
    expect(clampDailyLimit(1000)).toBe(100);
  });
});
