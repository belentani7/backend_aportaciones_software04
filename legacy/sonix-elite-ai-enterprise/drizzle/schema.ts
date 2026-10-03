import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

export const songs = mysqlTable("songs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  genre: varchar("genre", { length: 100 }).notNull(),
  mood: varchar("mood", { length: 100 }).notNull(),
  language: varchar("language", { length: 20 }).notNull(),
  lyrics: text("lyrics").notNull(),
  audioUrl: text("audioUrl"),
  audioKey: varchar("audioKey", { length: 255 }),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;

export const voiceClones = mysqlTable("voice_clones", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  voiceName: varchar("voiceName", { length: 255 }).notNull(),
  sampleUrl: text("sampleUrl").notNull(),
  sampleKey: varchar("sampleKey", { length: 255 }).notNull(),
  consentAccepted: int("consentAccepted").notNull().default(1), // 1 = accepted
  consentIp: varchar("consentIp", { length: 45 }),
  status: mysqlEnum("status", ["processing", "ready", "failed"]).default("processing").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VoiceClone = typeof voiceClones.$inferSelect;
export type InsertVoiceClone = typeof voiceClones.$inferInsert;

export const instrumentals = mysqlTable("instrumentals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  genre: varchar("genre", { length: 100 }).notNull(),
  bpm: int("bpm").notNull(),
  keySignature: varchar("keySignature", { length: 20 }).notNull(),
  instruments: text("instruments").notNull(), // JSON or comma separated
  durationSeconds: int("durationSeconds").notNull(),
  audioUrl: text("audioUrl"),
  audioKey: varchar("audioKey", { length: 255 }),
  status: mysqlEnum("status", ["processing", "completed", "failed"]).default("processing").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Instrumental = typeof instrumentals.$inferSelect;
export type InsertInstrumental = typeof instrumentals.$inferInsert;

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
