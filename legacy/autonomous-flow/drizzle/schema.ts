import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

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

export const flows = mysqlTable("flows", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().default(0),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").notNull(),
  rules: text("rules").notNull(),
  confidenceThreshold: varchar("confidenceThreshold", { length: 16 }).notNull().default("0.70"),
  destinationType: mysqlEnum("destinationType", ["webhook saliente", "log interno"]).notNull().default("log interno"),
  destinationUrl: varchar("destinationUrl", { length: 500 }),
  status: mysqlEnum("status", ["activo", "pausado"]).notNull().default("activo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIndex: index("flows_status_idx").on(table.status),
  ownerIndex: index("flows_owner_idx").on(table.ownerId),
}));

export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  flowId: int("flowId").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 180 }).notNull().unique(),
  payload: text("payload").notNull(),
  status: mysqlEnum("status", ["recibido", "procesando", "completado", "fallido", "excepcion"]).notNull().default("recibido"),
  attempts: int("attempts").notNull().default(0),
  availableAt: timestamp("availableAt").defaultNow().notNull(),
  claimedAt: timestamp("claimedAt"),
  claimToken: varchar("claimToken", { length: 64 }),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  flowStatusIndex: index("events_flow_status_idx").on(table.flowId, table.status),
  queueIndex: index("events_queue_idx").on(table.status, table.availableAt),
}));

export const executions = mysqlTable("executions", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  flowId: int("flowId").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  durationMs: int("durationMs"),
  tokenCost: varchar("tokenCost", { length: 32 }).notNull().default("0"),
  result: text("result"),
  outcome: mysqlEnum("outcome", ["regla determinista", "LLM", "reintento", "excepcion", "completado"]).notNull(),
  trace: text("trace").notNull(),
}, (table) => ({
  eventIndex: index("executions_event_idx").on(table.eventId),
  flowIndex: index("executions_flow_idx").on(table.flowId),
}));

export const exceptions = mysqlTable("exceptions", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  payload: text("payload").notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["pendiente", "resuelto"]).notNull().default("pendiente"),
  attempts: int("attempts").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, (table) => ({
  statusIndex: index("exceptions_status_idx").on(table.status),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Flow = typeof flows.$inferSelect;
export type InsertFlow = typeof flows.$inferInsert;
export type Event = typeof events.$inferSelect;
export type Execution = typeof executions.$inferSelect;
export type Exception = typeof exceptions.$inferSelect;
