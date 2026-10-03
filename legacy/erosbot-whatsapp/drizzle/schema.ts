import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

export const safetyReviews = mysqlTable("safety_reviews", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 96 }).notNull().unique(),
  sessionKey: varchar("sessionKey", { length: 128 }).notNull(),
  code: varchar("code", { length: 64 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  status: mysqlEnum("status", ["pending", "resolved", "dismissed"]).default("pending").notNull(),
  evidenceHash: varchar("evidenceHash", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type SafetyReview = typeof safetyReviews.$inferSelect;
export type InsertSafetyReview = typeof safetyReviews.$inferInsert;

export const assistantSessions = mysqlTable("assistant_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("sessionKey", { length: 128 }).notNull().unique(),
  state: varchar("state", { length: 32 }).notNull(),
  language: varchar("language", { length: 16 }).notNull(),
  premium: int("premium").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type AssistantSession = typeof assistantSessions.$inferSelect;
export type InsertAssistantSession = typeof assistantSessions.$inferInsert;

export const messageIdempotency = mysqlTable("message_idempotency", {
  id: int("id").autoincrement().primaryKey(),
  messageId: varchar("messageId", { length: 256 }).notNull().unique(),
  messageHash: varchar("messageHash", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["processing", "processed", "failed"]).default("processing").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type MessageIdempotency = typeof messageIdempotency.$inferSelect;
export type InsertMessageIdempotency = typeof messageIdempotency.$inferInsert;

export const auditEvents = mysqlTable("audit_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  subjectHash: varchar("subjectHash", { length: 128 }).notNull(),
  ruleCode: varchar("ruleCode", { length: 96 }),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type AuditEvent = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = typeof auditEvents.$inferInsert;