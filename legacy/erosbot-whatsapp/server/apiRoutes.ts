type EconomicPurpose = "none" | "premium-only-boundary" | "third-party";

type ApiRoute = { path: string; owner: string; economicPurpose: EconomicPurpose };

export const API_ROUTE_MANIFEST: readonly ApiRoute[] = [
  { path: "/api/webhooks/whatsapp", owner: "whatsapp", economicPurpose: "none" },
  { path: "/api/scheduled/maintenance", owner: "heartbeat", economicPurpose: "none" },
  { path: "/api/trpc", owner: "application", economicPurpose: "premium-only-boundary" },
  { path: "/api/healthz", owner: "health", economicPurpose: "none" },
  { path: "/api/oauth/callback", owner: "oauth", economicPurpose: "none" },
  { path: "/manus-storage/", owner: "storage", economicPurpose: "none" },
] as const;

export function assertNoThirdPartyEconomicRoutes() {
  const forbidden = /booking|reservation|escrow|split|refund|commission|checkout/i;
  return API_ROUTE_MANIFEST.every(route => !forbidden.test(route.path) && route.economicPurpose !== "third-party");
}
