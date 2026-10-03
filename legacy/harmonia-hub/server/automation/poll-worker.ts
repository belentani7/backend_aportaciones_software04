import "dotenv/config";

import { eq } from "drizzle-orm";

import { automationJobs } from "../../drizzle/schema";
import { getDb } from "../db";
import { executeAutomationJob } from "./worker";

const POLL_INTERVAL_MS = 1_000;

function isDue(schedule: string, now: Date, lastRunAt: Date | null): boolean {
  const match = /^(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+\*\s+\*\s+\*$/.exec(schedule);
  if (!match) return false;
  const [, second, minute, hour] = match.map(Number);
  if (second !== now.getUTCSeconds() || minute !== now.getUTCMinutes() || hour !== now.getUTCHours()) return false;
  return !lastRunAt || lastRunAt.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10);
}

async function tick() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is required for the local HARMONÍA worker");
  const now = new Date();
  const jobs = await db.select().from(automationJobs).where(eq(automationJobs.status, "active"));
  for (const job of jobs) {
    if (!isDue(job.schedule, now, job.lastRunAt)) continue;
    const idempotencyKey = `local:${job.id}:${now.toISOString().slice(0, 16)}`;
    try {
      const result = await executeAutomationJob({ jobId: job.id, idempotencyKey });
      console.log("[harmonia-worker]", JSON.stringify({ jobId: job.id, status: result.status, phase: result.phase }));
    } catch (error) {
      console.error("[harmonia-worker] execution failed", { jobId: job.id, error: error instanceof Error ? error.message : String(error) });
    }
  }
}

async function main() {
  console.log("[harmonia-worker] local scheduler started; schedules run in UTC and commits remain PVC-U + kill-switch gated.");
  await tick();
  setInterval(() => { void tick(); }, POLL_INTERVAL_MS);
}

void main().catch((error) => {
  console.error("[harmonia-worker] unable to start", error);
  process.exit(1);
});
