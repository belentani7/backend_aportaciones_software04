import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, uniqueIndex } from "drizzle-orm/mysql-core";

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

export const operatingConfig = mysqlTable("operating_config", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  theoreticalCapacity: int("theoreticalCapacity").default(100).notNull(),
  qualityFactor: decimal("qualityFactor", { precision: 5, scale: 2 }).default("0.80").notNull(),
  humanFactor: decimal("humanFactor", { precision: 5, scale: 2 }).default("0.80").notNull(),
  safetyBuffer: decimal("safetyBuffer", { precision: 5, scale: 2 }).default("0.80").notNull(),
  minimumMargin: decimal("minimumMargin", { precision: 10, scale: 2 }).default("50.00").notNull(),
  maxResponseMinutes: int("maxResponseMinutes").default(60).notNull(),
  maxRisk: mysqlEnum("maxRisk", ["low", "medium", "high"]).default("medium").notNull(),
  authorizedChannels: text("authorizedChannels").notNull(),
  queueOrangeThreshold: int("queueOrangeThreshold").default(85).notNull(),
  queueRedThreshold: int("queueRedThreshold").default(100).notNull(),
  errorThreshold: decimal("errorThreshold", { precision: 5, scale: 2 }).default("0.08").notNull(),
  confidenceThreshold: decimal("confidenceThreshold", { precision: 5, scale: 2 }).default("0.65").notNull(),
  ruleVersion: varchar("ruleVersion", { length: 32 }).default("1.0.0").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const requests = mysqlTable("capacity_requests", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  requestKey: varchar("requestKey", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  channel: varchar("channel", { length: 64 }).notNull(),
  priority: int("priority").default(50).notNull(),
  complexity: int("complexity").default(1).notNull(),
  urgency: int("urgency").default(1).notNull(),
  estimatedLoad: int("estimatedLoad").default(1).notNull(),
  estimatedMargin: decimal("estimatedMargin", { precision: 10, scale: 2 }).default("0.00").notNull(),
  risk: mysqlEnum("risk", ["low", "medium", "high", "critical"]).default("low").notNull(),
  duplicateDetected: boolean("duplicateDetected").default(false).notNull(),
  status: mysqlEnum("status", ["accepted", "waitlist", "routed", "rejected", "human_review", "stopped", "processing", "completed", "expired"]).default("waitlist").notNull(),
  retryCount: int("retryCount").default(0).notNull(),
  maxRetries: int("maxRetries").default(3).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const decisions = mysqlTable("capacity_decisions", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  ownerId: int("ownerId").notNull(),
  outcome: mysqlEnum("outcome", ["accept", "waitlist", "route", "reject", "human_review", "stop"]).notNull(),
  capacityState: mysqlEnum("capacityState", ["VERDE", "AMARILLO", "NARANJA", "ROJO", "NEGRO"]).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  modelUsed: varchar("modelUsed", { length: 128 }).default("capacity-gate-rules").notNull(),
  rulesVersion: varchar("rulesVersion", { length: 32 }).notNull(),
  responseJson: text("responseJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const controlMetrics = mysqlTable("control_metrics", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  capacityUtilization: decimal("capacityUtilization", { precision: 6, scale: 2 }).default("0.00").notNull(),
  responseMinutes: decimal("responseMinutes", { precision: 10, scale: 2 }).default("0.00").notNull(),
  errorRate: decimal("errorRate", { precision: 6, scale: 2 }).default("0.00").notNull(),
  humanInterventionRate: decimal("humanInterventionRate", { precision: 6, scale: 2 }).default("0.00").notNull(),
  marginPerOperation: decimal("marginPerOperation", { precision: 10, scale: 2 }).default("0.00").notNull(),
  duplicateRate: decimal("duplicateRate", { precision: 6, scale: 2 }).default("0.00").notNull(),
  incidentCount: int("incidentCount").default(0).notNull(),
  alertLevel: mysqlEnum("alertLevel", ["normal", "warning", "critical"]).default("normal").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const autonomousRuns = mysqlTable("autonomous_runs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  runKey: varchar("runKey", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  casePrompt: text("casePrompt").notNull(),
  objective: text("objective").notNull(),
  status: mysqlEnum("status", ["active", "completed", "saturated", "stopped", "error"]).default("active").notNull(),
  maxIterations: int("maxIterations").default(20).notNull(),
  iterationCount: int("iterationCount").default(0).notNull(),
  lastOutcome: varchar("lastOutcome", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const autonomousIterations = mysqlTable("autonomous_iterations", {
  id: int("id").autoincrement().primaryKey(),
  runId: int("runId").notNull(),
  iterationNumber: int("iterationNumber").notNull(),
  outcome: varchar("outcome", { length: 32 }).notNull(),
  capacityState: varchar("capacityState", { length: 16 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  actionJson: text("actionJson").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const autoResponses = mysqlTable("auto_responses", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  outcome: mysqlEnum("outcome", ["accept", "waitlist", "route", "reject"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerOutcomeUnique: uniqueIndex("auto_responses_owner_outcome_unique").on(table.ownerId, table.outcome) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type OperatingConfig = typeof operatingConfig.$inferSelect;
export type CapacityRequest = typeof requests.$inferSelect;
export type CapacityDecision = typeof decisions.$inferSelect;
export type ControlMetric = typeof controlMetrics.$inferSelect;
export type AutoResponse = typeof autoResponses.$inferSelect;
export type AutonomousRun = typeof autonomousRuns.$inferSelect;
export type AutonomousIteration = typeof autonomousIterations.$inferSelect;
