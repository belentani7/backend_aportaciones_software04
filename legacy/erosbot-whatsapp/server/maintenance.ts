import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { runMaintenance } from "./demo";
import { purgeExpiredOperationalData } from "./db";

export async function maintenanceHandler(req: Request, res: Response) {
  const startedAt = Date.now();
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const result = await runMaintenance();
    const durable = await purgeExpiredOperationalData();
    return res.json({ ...result, durable, taskUid: user.taskUid, durationMs: Date.now() - startedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "maintenance_failed";
    return res.status(500).json({
      error: message.slice(0, 160),
      context: { path: req.path, taskUid: "unknown" },
      timestamp: new Date().toISOString(),
    });
  }
}
