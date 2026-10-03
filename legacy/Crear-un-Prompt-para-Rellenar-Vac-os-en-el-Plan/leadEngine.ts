import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  appointments,
  auditLogs,
  businesses,
  campaigns,
  consentEvents,
  leads,
  messages,
} from "../drizzle/schema";
import { getDb } from "./db";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { clampDailyLimit, isEligibleForSimulation, normalizeConsent, renderTemplate } from "./leadEnginePolicy";

const channelSchema = z.enum(["email", "whatsapp"]);
const leadStatusSchema = z.enum([
  "new",
  "queued",
  "contacted",
  "replied",
  "qualified",
  "booked",
  "converted",
  "disqualified",
]);

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La base de datos no está disponible." });
  }
  return db;
}

function percent(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() || undefined;
}

function normalizePhone(value?: string) {
  return value?.replace(/[^\d+]/g, "") || undefined;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"') { value += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { values.push(value.trim()); value = ""; continue; }
    value += character;
  }
  values.push(value.trim());
  return values;
}

async function writeAudit(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, ownerId: number, action: string, resourceType: string, resourceId: number | undefined, result: "success" | "blocked" | "error", metadata?: Record<string, unknown>) {
  await db.insert(auditLogs).values({ ownerId, action, resourceType, resourceId, result, metadata: metadata ? JSON.stringify(metadata) : undefined });
}

export const leadEngineRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return { businesses: [], campaigns: [], leads: [], appointments: [], summary: { totalLeads: 0, verifiedLeads: 0, contactedLeads: 0, bookedLeads: 0, conversionRate: 0, activeCampaigns: 0, messagesSent: 0, revenueCents: 0 } };
    }

    const [businessRows, campaignRows, leadRows, appointmentRows, messageRows, auditRows] = await Promise.all([
      db.select().from(businesses).where(eq(businesses.ownerId, ctx.user.id)).orderBy(desc(businesses.createdAt)),
      db.select().from(campaigns).where(eq(campaigns.ownerId, ctx.user.id)).orderBy(desc(campaigns.createdAt)),
      db.select().from(leads).where(eq(leads.ownerId, ctx.user.id)).orderBy(desc(leads.createdAt)),
      db.select().from(appointments).where(eq(appointments.ownerId, ctx.user.id)).orderBy(desc(appointments.scheduledAt)),
      db.select().from(messages).where(eq(messages.ownerId, ctx.user.id)).orderBy(desc(messages.createdAt)),
      db.select().from(auditLogs).where(eq(auditLogs.ownerId, ctx.user.id)).orderBy(desc(auditLogs.createdAt)).limit(20),
    ]);

    const verifiedLeads = leadRows.filter(lead => lead.consentStatus === "verified" && !lead.doNotContact).length;
    const contactedLeads = leadRows.filter(lead => ["contacted", "replied", "qualified", "booked", "converted"].includes(lead.status)).length;
    const bookedLeads = leadRows.filter(lead => ["booked", "converted"].includes(lead.status)).length;

    return {
      businesses: businessRows,
      campaigns: campaignRows,
      leads: leadRows.slice(0, 50),
      appointments: appointmentRows.slice(0, 20),
      auditLogs: auditRows,
      summary: {
        totalLeads: leadRows.length,
        verifiedLeads,
        contactedLeads,
        bookedLeads,
        conversionRate: percent(bookedLeads, leadRows.length),
        activeCampaigns: campaignRows.filter(campaign => campaign.status === "running").length,
        messagesSent: messageRows.filter(message => ["sent", "delivered", "simulated"].includes(message.status)).length,
        revenueCents: appointmentRows.reduce((sum, appointment) => sum + appointment.revenueCents, 0),
      },
    };
  }),

  createBusiness: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(180), niche: z.string().min(2).max(100), city: z.string().max(120).optional(), contactEmail: z.string().email().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDb(await getDb());
      await db.insert(businesses).values({ ownerId: ctx.user.id, ...input });
      await writeAudit(db, ctx.user.id, "business.create", "business", undefined, "success", { niche: input.niche });
      return { success: true } as const;
    }),

  createLead: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(180),
      email: z.string().email().optional(),
      phone: z.string().max(40).optional(),
      source: z.string().min(2).max(100),
      sourceUrl: z.string().url().optional(),
      city: z.string().max(120).optional(),
      businessId: z.number().int().positive().optional(),
      consentStatus: z.enum(["verified", "pending", "unknown"]).default("pending"),
      consentProof: z.string().max(4000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDb(await getDb());
      if (!input.email && !input.phone) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cada lead necesita email o teléfono." });
      }
      const consentStatus = normalizeConsent(input.consentStatus, input.consentProof);
      await db.insert(leads).values({
        ownerId: ctx.user.id,
        name: input.name,
        email: normalizeEmail(input.email),
        phone: normalizePhone(input.phone),
        source: input.source,
        sourceUrl: input.sourceUrl,
        city: input.city,
        businessId: input.businessId,
        consentStatus,
        consentProof: input.consentProof,
        consentAt: consentStatus === "verified" ? new Date() : undefined,
        score: consentStatus === "verified" ? 70 : 20,
      });
      await writeAudit(db, ctx.user.id, "lead.create", "lead", undefined, "success", { consentStatus, source: input.source });
      return { success: true, consentStatus } as const;
    }),

  importCsv: protectedProcedure
    .input(z.object({ csv: z.string().min(10).max(1_000_000), source: z.string().min(2).max(100).default("CSV import") }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDb(await getDb());
      const lines = input.csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new TRPCError({ code: "BAD_REQUEST", message: "El CSV necesita cabecera y al menos una fila." });
      const headers = parseCsvLine(lines[0]).map(header => header.toLowerCase());
      if (!headers.includes("name")) throw new TRPCError({ code: "BAD_REQUEST", message: "La cabecera debe incluir name. También admite email, phone y consentProof." });
      const existing = await db.select({ email: leads.email, phone: leads.phone }).from(leads).where(eq(leads.ownerId, ctx.user.id));
      const known = new Set(existing.flatMap(lead => [lead.email ? `e:${lead.email.toLowerCase()}` : "", lead.phone ? `p:${lead.phone}` : ""].filter(Boolean)));
      const seen = new Set<string>();
      const rows: Array<typeof leads.$inferInsert> = [];
      const errors: Array<{ row: number; error: string }> = [];
      lines.slice(1).forEach((line, offset) => {
        const rowNumber = offset + 2;
        const values = parseCsvLine(line);
        const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
        const email = normalizeEmail(row.email);
        const phone = normalizePhone(row.phone);
        if (!row.name || (!email && !phone)) { errors.push({ row: rowNumber, error: "name y email o phone son obligatorios" }); return; }
        const keys = [email ? `e:${email}` : "", phone ? `p:${phone}` : ""].filter(Boolean);
        if (keys.some(key => known.has(key) || seen.has(key))) { errors.push({ row: rowNumber, error: "duplicado omitido" }); return; }
        keys.forEach(key => seen.add(key));
        const consentStatus = row.consentproof?.trim() ? "verified" as const : "pending" as const;
        rows.push({ ownerId: ctx.user.id, name: row.name.slice(0, 180), email, phone, source: row.source?.slice(0, 100) || input.source, sourceUrl: row.sourceurl?.slice(0, 500) || undefined, city: row.city?.slice(0, 120) || undefined, consentStatus, consentProof: row.consentproof?.slice(0, 4000) || undefined, consentAt: consentStatus === "verified" ? new Date() : undefined, score: consentStatus === "verified" ? 70 : 20 });
      });
      if (rows.length) await db.insert(leads).values(rows);
      await writeAudit(db, ctx.user.id, "lead.import", "lead", undefined, "success", { created: rows.length, errors: errors.length, source: input.source });
      return { created: rows.length, skipped: errors.length, errors };
    }),

  unsubscribe: publicProcedure
    .input(z.object({ leadId: z.number().int().positive(), email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = requireDb(await getDb());
      const lead = (await db.select({ id: leads.id, ownerId: leads.ownerId, email: leads.email }).from(leads).where(eq(leads.id, input.leadId)).limit(1))[0];
      if (!lead || !lead.email || lead.email.toLowerCase() !== input.email.trim().toLowerCase()) return { success: true } as const;
      await db.update(leads).set({ consentStatus: "revoked", doNotContact: true, status: "disqualified" }).where(eq(leads.id, lead.id));
      await db.insert(consentEvents).values({ ownerId: lead.ownerId, leadId: lead.id, eventType: "revoked", source: "public unsubscribe", proof: "email match" });
      await writeAudit(db, lead.ownerId, "consent.revoke.public", "lead", lead.id, "success", { reason: "unsubscribe" });
      return { success: true } as const;
    }),

  createCampaign: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(180),
      businessId: z.number().int().positive().optional(),
      channel: channelSchema,
      subject: z.string().max(240).optional(),
      bodyTemplate: z.string().min(10).max(8000),
      dailyLimit: z.number().int().min(1).max(100).default(25),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDb(await getDb());
      await db.insert(campaigns).values({ ownerId: ctx.user.id, ...input, mode: "simulation", status: "draft" });
      await writeAudit(db, ctx.user.id, "campaign.create", "campaign", undefined, "success", { channel: input.channel, mode: "simulation" });
      return { success: true } as const;
    }),

  updateLeadStatus: protectedProcedure
    .input(z.object({ leadId: z.number().int().positive(), status: leadStatusSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDb(await getDb());
      const owned = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.id, input.leadId), eq(leads.ownerId, ctx.user.id))).limit(1);
      if (!owned.length) throw new TRPCError({ code: "NOT_FOUND", message: "Lead no encontrado." });
      await db.update(leads).set({ status: input.status }).where(eq(leads.id, input.leadId));
      await writeAudit(db, ctx.user.id, "lead.status.update", "lead", input.leadId, "success", { status: input.status });
      return { success: true } as const;
    }),

  recordConsent: protectedProcedure
    .input(z.object({ leadId: z.number().int().positive(), status: z.enum(["verified", "revoked"]), source: z.string().min(2).max(120), proof: z.string().max(4000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDb(await getDb());
      const owned = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.id, input.leadId), eq(leads.ownerId, ctx.user.id))).limit(1);
      if (!owned.length) throw new TRPCError({ code: "NOT_FOUND", message: "Lead no encontrado." });
      if (input.status === "verified" && !input.proof) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La verificación necesita una prueba de consentimiento." });
      }
      await db.update(leads).set({
        consentStatus: input.status,
        consentProof: input.proof,
        consentAt: input.status === "verified" ? new Date() : null,
        doNotContact: input.status === "revoked" ? true : false,
      }).where(eq(leads.id, input.leadId));
      await db.insert(consentEvents).values({
        ownerId: ctx.user.id,
        leadId: input.leadId,
        eventType: input.status,
        source: input.source,
        proof: input.proof,
      });
      await writeAudit(db, ctx.user.id, input.status === "verified" ? "consent.verify" : "consent.revoke", "lead", input.leadId, "success", { source: input.source });
      return { success: true } as const;
    }),

  runSimulation: protectedProcedure
    .input(z.object({ campaignId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDb(await getDb());
      const campaign = (await db.select().from(campaigns).where(and(eq(campaigns.id, input.campaignId), eq(campaigns.ownerId, ctx.user.id))).limit(1))[0];
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaña no encontrada." });
      const business = campaign.businessId
        ? (await db.select().from(businesses).where(and(eq(businesses.id, campaign.businessId), eq(businesses.ownerId, ctx.user.id))).limit(1))[0]
        : undefined;
      const allLeads = await db.select().from(leads).where(and(eq(leads.ownerId, ctx.user.id), eq(leads.consentStatus, "verified"), eq(leads.doNotContact, false)));
      const eligible = allLeads.filter(lead => {
        const hasContact = campaign.channel === "email" ? Boolean(lead.email) : Boolean(lead.phone);
        return hasContact && isEligibleForSimulation(lead, campaign.channel).eligible;
      }).slice(0, clampDailyLimit(campaign.dailyLimit));

      await writeAudit(db, ctx.user.id, "campaign.simulation.preview", "campaign", campaign.id, "success", { eligible: eligible.length, blocked: allLeads.length - eligible.length, channel: campaign.channel });

      for (const lead of eligible) {
        const body = renderTemplate(campaign.bodyTemplate, { name: lead.name, businessName: business?.name ?? "tu negocio", campaignName: campaign.name });
        await db.insert(messages).values({
          ownerId: ctx.user.id,
          leadId: lead.id,
          campaignId: campaign.id,
          channel: campaign.channel,
          direction: "outbound",
          status: "simulated",
          subject: campaign.subject,
          body,
          sentAt: new Date(),
        });
        await db.update(leads).set({ status: "contacted", lastContactedAt: new Date() }).where(eq(leads.id, lead.id));
      }
      await db.update(campaigns).set({ status: "running" }).where(eq(campaigns.id, campaign.id));
      return { success: true, processed: eligible.length, mode: "simulation" as const };
    }),

  createAppointment: protectedProcedure
    .input(z.object({ leadId: z.number().int().positive(), businessId: z.number().int().positive().optional(), campaignId: z.number().int().positive().optional(), scheduledAt: z.coerce.date(), revenueCents: z.number().int().min(0).default(0), commissionCents: z.number().int().min(0).default(0) }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDb(await getDb());
      const owned = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.id, input.leadId), eq(leads.ownerId, ctx.user.id))).limit(1);
      if (!owned.length) throw new TRPCError({ code: "NOT_FOUND", message: "Lead no encontrado." });
      await db.insert(appointments).values({ ownerId: ctx.user.id, ...input });
      await db.update(leads).set({ status: "booked" }).where(eq(leads.id, input.leadId));
      await writeAudit(db, ctx.user.id, "appointment.create", "appointment", undefined, "success", { leadId: input.leadId });
      return { success: true } as const;
    }),
});

export type LeadEngineRouter = typeof leadEngineRouter;
