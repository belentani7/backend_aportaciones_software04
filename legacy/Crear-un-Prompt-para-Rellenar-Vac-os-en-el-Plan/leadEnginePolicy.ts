export type ConsentStatus = "verified" | "pending" | "revoked" | "unknown";
export type LeadLifecycle = "new" | "queued" | "contacted" | "replied" | "qualified" | "booked" | "converted" | "disqualified";
export type Channel = "email" | "whatsapp";

export type PolicyLead = {
  email?: string | null;
  phone?: string | null;
  consentStatus: ConsentStatus;
  doNotContact: boolean;
  status: LeadLifecycle;
};

export function normalizeConsent(status: "verified" | "pending" | "unknown", proof?: string) {
  if (status === "verified" && proof?.trim()) return "verified" as const;
  return status === "verified" ? "pending" as const : status;
}

export function isEligibleForSimulation(lead: PolicyLead, channel: Channel) {
  const channelAvailable = channel === "email" ? Boolean(lead.email?.trim()) : Boolean(lead.phone?.trim());
  const lifecycleAllowed = lead.status === "new" || lead.status === "queued";
  return {
    eligible: lead.consentStatus === "verified" && !lead.doNotContact && channelAvailable && lifecycleAllowed,
    reasons: [
      lead.consentStatus !== "verified" ? "consent_not_verified" : null,
      lead.doNotContact ? "suppression_list" : null,
      !channelAvailable ? `missing_${channel}` : null,
      !lifecycleAllowed ? "already_contacted" : null,
    ].filter(Boolean) as string[],
  };
}

export function renderTemplate(template: string, values: { name: string; businessName: string; campaignName?: string }) {
  const allowed = { name: values.name, businessName: values.businessName, campaignName: values.campaignName ?? "" };
  const variables = Array.from(template.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)).map(match => match[1]);
  const unknown = Array.from(new Set(variables.filter(variable => !(variable in allowed))));
  if (unknown.length) throw new Error(`Variables no permitidas: ${unknown.join(", ")}`);
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, variable: keyof typeof allowed) => allowed[variable] ?? "");
}

export function clampDailyLimit(value: number) {
  return Math.min(100, Math.max(1, Math.trunc(value)));
}
