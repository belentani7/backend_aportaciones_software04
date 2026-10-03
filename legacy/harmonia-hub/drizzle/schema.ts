import {
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
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

export const crmContacts = mysqlTable(
  "crm_contacts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).default("lead").notNull(),
    value: decimal("value", { precision: 10, scale: 2 }).default("0.00").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
  },
  (table) => ({
    ownerIdx: index("crm_contacts_user_idx").on(table.userId),
  }),
);

export const automationJobs = mysqlTable(
  "automation_jobs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    jobName: varchar("job_name", { length: 255 }).notNull(),
    schedule: varchar("schedule", { length: 100 }).notNull(),
    status: varchar("status", { length: 50 }).default("active").notNull(),
    scheduleCronTaskUid: varchar("schedule_cron_task_uid", { length: 65 }),
    lastRunAt: timestamp("last_run_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index("automation_jobs_user_idx").on(table.userId),
    taskUidIdx: uniqueIndex("automation_jobs_task_uid_idx").on(table.scheduleCronTaskUid),
  }),
);

export const automationRuns = mysqlTable(
  "automation_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    jobId: int("job_id").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 191 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    phase: varchar("phase", { length: 30 }).notNull(),
    result: json("result"),
    error: text("error"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
  },
  (table) => ({
    jobIdx: index("automation_runs_job_idx").on(table.jobId),
    idemIdx: uniqueIndex("automation_runs_idem_idx").on(table.idempotencyKey),
  }),
);

export const pvcuLedgerRecords = mysqlTable(
  "pvcu_ledger_records",
  {
    id: int("id").autoincrement().primaryKey(),
    sequenceId: int("sequence_id").notNull(),
    workflowId: varchar("workflow_id", { length: 191 }).notNull(),
    envelopeId: varchar("envelope_id", { length: 191 }).notNull(),
    inputHash: varchar("input_hash", { length: 128 }).notNull(),
    previousHash: varchar("previous_hash", { length: 128 }).notNull(),
    recordHash: varchar("record_hash", { length: 128 }).notNull(),
    passed: int("passed").notNull().default(1),
    envelope: json("envelope").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    sequenceIdx: uniqueIndex("pvcu_sequence_idx").on(table.sequenceId),
    workflowIdx: index("pvcu_workflow_idx").on(table.workflowId),
  }),
);

/** Playlists generated or explicitly saved by one authenticated user. */
export const musicPlaylists = mysqlTable(
  "music_playlists",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    clientPlaylistId: varchar("client_playlist_id", { length: 191 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    coverUrl: text("cover_url").notNull(),
    mood: varchar("mood", { length: 32 }),
    context: varchar("context", { length: 32 }),
    genres: json("genres").notNull(),
    tracks: json("tracks").notNull(),
    source: mysqlEnum("source", ["ai", "manual"]).default("ai").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
  },
  (table) => ({
    ownerIdx: index("music_playlists_user_idx").on(table.userId),
    ownerClientIdx: uniqueIndex("music_playlists_owner_client_idx").on(table.userId, table.clientPlaylistId),
  }),
);

/** A durable user-owned track state, deliberately separate from seeded or catalog data. */
export const musicTrackStates = mysqlTable(
  "music_track_states",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    trackId: varchar("track_id", { length: 191 }).notNull(),
    state: mysqlEnum("state", ["liked", "recent"]).notNull(),
    track: json("track").notNull(),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  },
  (table) => ({
    ownerStateIdx: index("music_track_states_owner_state_idx").on(table.userId, table.state),
    ownerTrackStateIdx: uniqueIndex("music_track_states_owner_track_state_idx").on(table.userId, table.trackId, table.state),
  }),
);

/** Owner-level control gate checked by the Council UI and worker before commit. */
export const councilControls = mysqlTable(
  "council_controls",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    killSwitchActive: int("kill_switch_active").default(0).notNull(),
    updatedByUserId: int("updated_by_user_id").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
  },
  (table) => ({
    ownerIdx: uniqueIndex("council_controls_user_idx").on(table.userId),
  }),
);

/** Immutable application-level audit trail for owner overrides and Council decisions. */
export const councilAuditLogs = mysqlTable(
  "council_audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    actorUserId: int("actor_user_id").notNull(),
    eventType: varchar("event_type", { length: 80 }).notNull(),
    details: json("details").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    ownerCreatedIdx: index("council_audit_logs_owner_created_idx").on(table.userId, table.createdAt),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CrmContact = typeof crmContacts.$inferSelect;
export type InsertCrmContact = typeof crmContacts.$inferInsert;
export type AutomationJob = typeof automationJobs.$inferSelect;
export type InsertAutomationJob = typeof automationJobs.$inferInsert;
export type AutomationRun = typeof automationRuns.$inferSelect;
export type InsertAutomationRun = typeof automationRuns.$inferInsert;
export type PvcuLedgerRecord = typeof pvcuLedgerRecords.$inferSelect;
export type InsertPvcuLedgerRecord = typeof pvcuLedgerRecords.$inferInsert;
export type MusicPlaylist = typeof musicPlaylists.$inferSelect;
export type InsertMusicPlaylist = typeof musicPlaylists.$inferInsert;
export type MusicTrackState = typeof musicTrackStates.$inferSelect;
export type InsertMusicTrackState = typeof musicTrackStates.$inferInsert;
export type CouncilControl = typeof councilControls.$inferSelect;
export type InsertCouncilControl = typeof councilControls.$inferInsert;
export type CouncilAuditLog = typeof councilAuditLogs.$inferSelect;
export type InsertCouncilAuditLog = typeof councilAuditLogs.$inferInsert;
