type MetricName = "webhook_received" | "webhook_rejected" | "message_processed" | "safety_review" | "transport_error" | "api_rate_limited" | "maintenance_failed" | "health_checked";
const counters = new Map<MetricName, number>();
const recentErrors: Array<{ code: string; at: string }> = [];
const startedAt = Date.now();
const MAX_ERROR_BUFFER = 100;

export function incrementMetric(name: MetricName) {
  counters.set(name, (counters.get(name) ?? 0) + 1);
}

export function recordSanitizedError(code: string) {
  recentErrors.push({ code: code.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 80), at: new Date().toISOString() });
  if (recentErrors.length > MAX_ERROR_BUFFER) recentErrors.shift();
}

export function getOperationalAlerts() {
  const errorsLastHour = recentErrors.filter(error => Date.now() - Date.parse(error.at) < 60 * 60 * 1000).length;
  const transportErrors = counters.get("transport_error") ?? 0;
  const alerts: Array<{ code: string; level: "info" | "warning" | "critical" }> = [];
  if (transportErrors > 0) alerts.push({ code: "transport_errors_observed", level: transportErrors >= 5 ? "critical" : "warning" });
  if (errorsLastHour >= 10) alerts.push({ code: "elevated_sanitized_errors", level: errorsLastHour >= 25 ? "critical" : "warning" });
  return alerts;
}

export function getObservabilitySnapshot() {
  const alerts = getOperationalAlerts();
  return {
    counters: Object.fromEntries(counters),
    recentErrors: [...recentErrors].reverse(),
    alerts,
    healthy: !alerts.some(alert => alert.level === "critical"),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  };
}
