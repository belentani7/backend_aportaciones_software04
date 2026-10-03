import type { Request, Response } from "express";
import { getObservabilitySnapshot, incrementMetric } from "./observability";

export function healthHandler(_req: Request, res: Response) {
  incrementMetric("health_checked");
  const observability = getObservabilitySnapshot();
  return res.status(200).json({
    ok: true,
    service: "erosbot-whatsapp",
    mode: process.env.WHATSAPP_MODE === "meta" ? "meta-configured" : "mock",
    timestamp: new Date().toISOString(),
    observability: { errorBufferSize: observability.recentErrors.length, metrics: observability.counters, alerts: observability.alerts },
  });
}
