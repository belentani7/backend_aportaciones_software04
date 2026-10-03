import type { Express, Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { automationJobs, automationRuns, councilAuditLogs, councilControls, crmContacts, pvcuLedgerRecords } from "../../drizzle/schema";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";
import { executeAutomationJob } from "./worker";

async function requireUser(req: Request, res: Response) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    res.status(401).json({ error: "authentication_required" });
    return null;
  }
}

function requireAdmin(user: Awaited<ReturnType<typeof sdk.authenticateRequest>> | null, res: Response) {
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "admin_required" });
    return false;
  }
  return true;
}

function sendServerError(res: Response, error: unknown) {
  res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
}

export function registerCrmRoutes(app: Express) {
  app.get("/api/crm/contacts", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "database_unavailable" });
      const contacts = await db.select().from(crmContacts).where(eq(crmContacts.userId, user.id));
      res.json({ contacts });
    } catch (error) {
      sendServerError(res, error);
    }
  });

  app.post("/api/crm/contacts", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const parsed = z.object({
      name: z.string().trim().min(2).max(255),
      email: z.string().email().max(255),
      status: z.enum(["lead", "customer", "churned"]).default("lead"),
      value: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/).default("0.00"),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_contact", details: parsed.error.flatten() });
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "database_unavailable" });
      const inserted = await db.insert(crmContacts).values({ userId: user.id, ...parsed.data });
      res.status(201).json({ id: Number(inserted[0].insertId) });
    } catch (error) {
      sendServerError(res, error);
    }
  });

  app.get("/api/crm/jobs", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "database_unavailable" });
      const jobs = await db.select().from(automationJobs).where(eq(automationJobs.userId, user.id));
      res.json({ jobs });
    } catch (error) {
      sendServerError(res, error);
    }
  });

  app.get("/api/crm/runs", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "database_unavailable" });
      const jobs = await db.select({ id: automationJobs.id }).from(automationJobs).where(eq(automationJobs.userId, user.id));
      const ids = jobs.map((job) => job.id);
      if (!ids.length) return res.json({ runs: [] });
      const runs = await db.select().from(automationRuns).orderBy(desc(automationRuns.startedAt));
      res.json({ runs: runs.filter((run) => ids.includes(run.jobId)) });
    } catch (error) {
      sendServerError(res, error);
    }
  });

  app.post("/api/crm/jobs/:jobId/run", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const jobId = Number(req.params.jobId);
    if (!Number.isInteger(jobId) || jobId <= 0) return res.status(400).json({ error: "invalid_job_id" });
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "database_unavailable" });
      const job = (await db.select().from(automationJobs).where(and(eq(automationJobs.id, jobId), eq(automationJobs.userId, user.id))).limit(1))[0];
      if (!job) return res.status(404).json({ error: "job_not_found" });
      const result = await executeAutomationJob({ jobId, idempotencyKey: `crm:${user.id}:${jobId}:${Date.now()}` });
      res.json(result);
    } catch (error) {
      sendServerError(res, error);
    }
  });

  app.get("/api/crm/governance", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user || !requireAdmin(user, res)) return;
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "database_unavailable" });
      const control = (await db.select().from(councilControls).where(eq(councilControls.userId, user.id)).limit(1))[0];
      const [auditLogs, ledger] = await Promise.all([
        db.select().from(councilAuditLogs).where(eq(councilAuditLogs.userId, user.id)).orderBy(desc(councilAuditLogs.createdAt)).limit(30),
        db.select().from(pvcuLedgerRecords).orderBy(desc(pvcuLedgerRecords.sequenceId)).limit(30),
      ]);
      res.json({ killSwitchActive: control?.killSwitchActive === 1, updatedAt: control?.updatedAt ?? null, auditLogs, ledger });
    } catch (error) {
      sendServerError(res, error);
    }
  });

  app.post("/api/crm/governance/kill-switch", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user || !requireAdmin(user, res)) return;
    const parsed = z.object({ active: z.boolean(), reason: z.string().trim().min(3).max(500) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_kill_switch_request", details: parsed.error.flatten() });
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "database_unavailable" });
      await db.insert(councilControls).values({ userId: user.id, killSwitchActive: parsed.data.active ? 1 : 0, updatedByUserId: user.id }).onDuplicateKeyUpdate({
        set: { killSwitchActive: parsed.data.active ? 1 : 0, updatedByUserId: user.id },
      });
      await db.insert(councilAuditLogs).values({
        userId: user.id,
        actorUserId: user.id,
        eventType: parsed.data.active ? "council.kill_switch.activated" : "council.kill_switch.released",
        details: { reason: parsed.data.reason, source: "crm" },
      });
      res.json({ success: true, active: parsed.data.active });
    } catch (error) {
      sendServerError(res, error);
    }
  });
}
