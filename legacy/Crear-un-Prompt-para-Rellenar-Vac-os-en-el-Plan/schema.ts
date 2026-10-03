import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** A business client that receives qualified leads. */
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  niche: varchar("niche", { length: 100 }).notNull(),
  city: varchar("city", { length: 120 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 40 }),
  status: mysqlEnum("status", ["active", "paused", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  businessId: int("businessId"),
  name: varchar("name", { length: 180 }).notNull(),
  channel: mysqlEnum("channel", ["email", "whatsapp"]).default("email").notNull(),
  mode: mysqlEnum("mode", ["simulation", "live"]).default("simulation").notNull(),
  status: mysqlEnum("status", ["draft", "running", "paused", "completed"]).default("draft").notNull(),
  dailyLimit: int("dailyLimit").default(25).notNull(),
  subject: varchar("subject", { length: 240 }),
  bodyTemplate: text("bodyTemplate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  businessId: int("businessId"),
  campaignId: int("campaignId"),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  source: varchar("source", { length: 100 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  city: varchar("city", { length: 120 }),
  consentStatus: mysqlEnum("consentStatus", ["verified", "pending", "revoked", "unknown"]).default("unknown").notNull(),
  consentProof: text("consentProof"),
  consentAt: timestamp("consentAt"),
  doNotContact: boolean("doNotContact").default(false).notNull(),
  status: mysqlEnum("status", ["new", "queued", "contacted", "replied", "qualified", "booked", "converted", "disqualified"]).default("new").notNull(),
  score: int("score").default(0).notNull(),
  lastContactedAt: timestamp("lastContactedAt"),
  nextContactAt: timestamp("nextContactAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const consentEvents = mysqlTable("consent_events", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  leadId: int("leadId").notNull(),
  eventType: mysqlEnum("eventType", ["captured", "verified", "revoked", "exported"]).notNull(),
  source: varchar("source", { length: 120 }).notNull(),
  proof: text("proof"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  leadId: int("leadId").notNull(),
  campaignId: int("campaignId").notNull(),
  channel: mysqlEnum("channel", ["email", "whatsapp"]).notNull(),
  direction: mysqlEnum("direction", ["outbound", "inbound"]).notNull(),
  status: mysqlEnum("status", ["simulated", "queued", "sent", "delivered", "failed", "received"]).notNull(),
  subject: varchar("subject", { length: 240 }),
  body: text("body").notNull(),
  providerMessageId: varchar("providerMessageId", { length: 180 }),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  leadId: int("leadId").notNull(),
  businessId: int("businessId"),
  campaignId: int("campaignId"),
  status: mysqlEnum("status", ["scheduled", "attended", "no_show", "cancelled"]).default("scheduled").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  revenueCents: int("revenueCents").default(0).notNull(),
  commissionCents: int("commissionCents").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  resourceType: varchar("resourceType", { length: 80 }).notNull(),
  resourceId: int("resourceId"),
  result: mysqlEnum("result", ["success", "blocked", "error"]).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type ConsentEvent = typeof consentEvents.$inferSelect;
export type InsertConsentEvent = typeof consentEvents.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
