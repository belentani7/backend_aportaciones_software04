import crypto from "crypto";
import { desc, eq } from "drizzle-orm";
import {
  automationJobs,
  automationRuns,
  councilAuditLogs,
  councilControls,
  pvcuLedgerRecords,
} from "../../drizzle/schema";
import { PVCUValidator } from "../_core/pvc-u-profile";
import { getDb } from "../db";

export type AutomationExecutionInput = {
  jobId: number;
  idempotencyKey: string;
};

export type AutomationExecutionResult = {
  jobId: number;
  runId?: number;
  idempotencyKey: string;
  phase: "prepare" | "confirm" | "commit";
  status: "succeeded" | "failed" | "deduplicated";
  ledgerRecordHash?: string;
  message: string;
};

const ZERO_HASH = "0".repeat(64);

/**
 * Executes a deterministic automation through HARMONÍA's three durable phases.
 * Every phase is persisted before the next one begins, and retries are collapsed
 * by the unique idempotency key.
 */
export async function executeAutomationJob(
  input: AutomationExecutionInput,
): Promise<AutomationExecutionResult> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is required for automation execution");

  const job = (
    await db
      .select()
      .from(automationJobs)
      .where(eq(automationJobs.id, input.jobId))
      .limit(1)
  )[0];
  if (!job) throw new Error(`Automation job ${input.jobId} was not found`);

  const existing = (
    await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.idempotencyKey, input.idempotencyKey))
      .limit(1)
  )[0];
  if (existing) {
    return {
      jobId: job.id,
      runId: existing.id,
      idempotencyKey: input.idempotencyKey,
      phase: existing.phase as AutomationExecutionResult["phase"],
      status: "deduplicated",
      message: "The automation was already processed for this idempotency key.",
    };
  }

  const startedAt = new Date();
  const insertedRun = await db
    .insert(automationRuns)
    .values({
      jobId: job.id,
      idempotencyKey: input.idempotencyKey,
      status: "preparing",
      phase: "prepare",
      startedAt,
    });
  const runId = Number(insertedRun[0].insertId);

  try {
    const control = (
      await db
        .select()
        .from(councilControls)
        .where(eq(councilControls.userId, job.userId))
        .limit(1)
    )[0];

    if (control?.killSwitchActive === 1) {
      const details = { jobId: job.id, runId, idempotencyKey: input.idempotencyKey, reason: "owner_kill_switch" };
      await db.insert(councilAuditLogs).values({
        userId: job.userId,
        actorUserId: control.updatedByUserId,
        eventType: "automation.blocked_by_kill_switch",
        details,
      });
      await db.update(automationRuns).set({
        status: "failed",
        phase: "prepare",
        error: "HARMONIA_KILL_SWITCH_ACTIVE",
        result: details,
        finishedAt: new Date(),
      }).where(eq(automationRuns.id, runId));
      return {
        jobId: job.id,
        runId,
        idempotencyKey: input.idempotencyKey,
        phase: "prepare",
        status: "failed",
        message: "Automation blocked by the persistent owner kill switch.",
      };
    }

    const validator = new PVCUValidator();
    const envelope = validator.validateExtraction(
      `https://harmonia.local/automation/${job.id}`,
      job.jobName,
      `HARMONIA automation execution for ${job.jobName}. Schedule: ${job.schedule}.`,
    );

    const previous = (
      await db
        .select()
        .from(pvcuLedgerRecords)
        .orderBy(desc(pvcuLedgerRecords.sequenceId))
        .limit(1)
    )[0];
    const sequenceId = (previous?.sequenceId ?? 0) + 1;
    const previousHash = previous?.recordHash ?? ZERO_HASH;
    const payload = `${sequenceId}:${job.id}:${envelope.envelopeId}:${envelope.inputHash}:${previousHash}`;
    const recordHash = crypto.createHash("sha256").update(payload).digest("hex");

    await db.insert(pvcuLedgerRecords).values({
      sequenceId,
      workflowId: `automation_${job.id}`,
      envelopeId: envelope.envelopeId,
      inputHash: envelope.inputHash,
      previousHash,
      recordHash,
      passed: envelope.passed ? 1 : 0,
      envelope,
    });

    await db
      .update(automationRuns)
      .set({
        status: envelope.passed ? "confirming" : "failed",
        phase: "confirm",
        result: { validation: envelope, sequenceId, recordHash },
        error: envelope.passed ? null : "PVC-U validation failed",
      })
      .where(eq(automationRuns.id, runId));

    if (!envelope.passed) {
      await db
        .update(automationRuns)
        .set({ finishedAt: new Date() })
        .where(eq(automationRuns.id, runId));
      return {
        jobId: job.id,
        runId,
        idempotencyKey: input.idempotencyKey,
        phase: "confirm",
        status: "failed",
        ledgerRecordHash: recordHash,
        message: "PVC-U rejected the automation before commit.",
      };
    }

    await db
      .update(automationRuns)
      .set({ status: "committing", phase: "commit" })
      .where(eq(automationRuns.id, runId));

    await db
      .update(automationJobs)
      .set({ lastRunAt: new Date(), status: "active" })
      .where(eq(automationJobs.id, job.id));

    await db
      .update(automationRuns)
      .set({
        status: "succeeded",
        phase: "commit",
        finishedAt: new Date(),
        result: { validation: envelope, sequenceId, recordHash, committed: true },
      })
      .where(eq(automationRuns.id, runId));

    await db.insert(councilAuditLogs).values({
      userId: job.userId,
      actorUserId: job.userId,
      eventType: "automation.committed",
      details: { jobId: job.id, runId, idempotencyKey: input.idempotencyKey, sequenceId, recordHash },
    });

    return {
      jobId: job.id,
      runId,
      idempotencyKey: input.idempotencyKey,
      phase: "commit",
      status: "succeeded",
      ledgerRecordHash: recordHash,
      message: "Automation committed after PVC-U validation.",
    };
  } catch (error) {
    await db
      .update(automationRuns)
      .set({
        status: "failed",
        phase: "commit",
        error: error instanceof Error ? error.message : String(error),
        finishedAt: new Date(),
      })
      .where(eq(automationRuns.id, runId));
    throw error;
  }
}

export function cronIdempotencyKey(taskUid: string, now = new Date()) {
  return `cron:${taskUid}:${now.toISOString().slice(0, 16)}`;
}
