import {
  int,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  mysqlTable,
  index,
  unique,
  uniqueIndex,
  decimal,
  boolean,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

/**
 * AION Workforce Enterprise Schema
 * 
 * Design Principles:
 * 1. Every table has tenant_id for multi-tenant isolation
 * 2. Every table has created_by, updated_by for audit trail
 * 3. Every table has version for optimistic locking
 * 4. Audit logs are append-only with hash chain
 * 5. Event store is immutable source of truth
 * 6. Soft deletes via deleted_at for GDPR compliance
 * 7. All timestamps in UTC
 * 8. Request tracing via request_id
 */

// ═══════════════════════════════════════════════════════════════════════════
// IDENTITY & AUTHENTICATION (Zone Crítica #1)
// ═══════════════════════════════════════════════════════════════════════════

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }).unique(),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    mfaEnabled: boolean("mfaEnabled").default(false),
    notificationConsent: boolean("notificationConsent").default(false),
    notificationConsentAt: timestamp("notificationConsentAt"),
    notificationConsentRevokedAt: timestamp("notificationConsentRevokedAt"),
    notificationSoundEnabled: boolean("notificationSoundEnabled").default(true),
    lastSignedIn: timestamp("lastSignedIn").defaultNow(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"), // GDPR soft delete
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// MULTI-TENANT CORE (Zone Crítica #1)
// ═══════════════════════════════════════════════════════════════════════════

export const tenants = mysqlTable(
  "tenants",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    countryCode: varchar("countryCode", { length: 3 }).default("BR"),
    timezone: varchar("timezone", { length: 50 }).default("America/Sao_Paulo"),
    legalJurisdiction: mysqlEnum("legalJurisdiction", ["BR", "ES", "PT", "FI"]).default("BR"),
    collectiveAgreement: text("collectiveAgreement"), // JSON config
    legalConfig: text("legalConfig"), // JSON: compliance rules
    dataResidency: varchar("dataResidency", { length: 50 }).default("EU"),
    isActive: boolean("isActive").default(true),
    version: int("version").default(1),
    createdBy: int("createdBy"),
    updatedBy: int("updatedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    slugIdx: index("tenants_slug_idx").on(table.slug),
    activeIdx: index("tenants_active_idx").on(table.isActive),
  })
);

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// User-Tenant role mapping with explicit permissions
export const userTenantRoles = mysqlTable(
  "userTenantRoles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    tenantId: int("tenantId").notNull(),
    role: mysqlEnum("role", ["owner", "admin", "squad_lead", "operator", "employee", "auditor", "billing", "integration"]).notNull(),
    permissions: text("permissions"), // JSON array of permission strings
    mfaRequired: boolean("mfaRequired").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    membershipUnique: uniqueIndex("userTenantRoles_user_tenant_unique").on(table.userId, table.tenantId),
    tenantIdx: index("userTenantRoles_tenantId_idx").on(table.tenantId),
    roleIdx: index("userTenantRoles_role_idx").on(table.role),
  })
);

export type UserTenantRole = typeof userTenantRoles.$inferSelect;
export type InsertUserTenantRole = typeof userTenantRoles.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// EMPLOYEES & CONTRACTS
// ═══════════════════════════════════════════════════════════════════════════

export const employees = mysqlTable(
  "employees",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull(),
    externalId: varchar("externalId", { length: 100 }),
    firstName: varchar("firstName", { length: 100 }).notNull(),
    lastName: varchar("lastName", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    birthDate: timestamp("birthDate"),
    hireDate: timestamp("hireDate").notNull(),
    contractType: mysqlEnum("contractType", ["permanent", "temporary", "apprentice", "part_time"]).default("permanent"),
    baseSalary: decimal("baseSalary", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("BRL"),
    contractData: text("contractData"), // JSON: hours, shift_pattern, etc.
    skills: text("skills"), // JSON array: ["PT", "ES", "FI", "customer_service"]
    isNightWorker: boolean("isNightWorker").default(false),
    isMinor: boolean("isMinor").default(false),
    isActive: boolean("isActive").default(true),
    version: int("version").default(1),
    createdBy: int("createdBy"),
    updatedBy: int("updatedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    tenantIdx: index("employees_tenantId_idx").on(table.tenantId),
    emailIdx: unique("employees_email_unique").on(table.email),
    activeIdx: index("employees_active_idx").on(table.isActive),
  })
);

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// SHIFTS & SCHEDULING
// ═══════════════════════════════════════════════════════════════════════════

export const shifts = mysqlTable(
  "shifts",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull(),
    employeeId: int("employeeId"),
    startTime: timestamp("startTime").notNull(),
    endTime: timestamp("endTime").notNull(),
    shiftType: varchar("shiftType", { length: 50 }), // 'morning', 'afternoon', 'night', 'flex'
    market: varchar("market", { length: 50 }), // 'PT', 'FI', 'ES'
    status: mysqlEnum("status", ["scheduled", "published", "completed", "missed", "cancelled"]).default("scheduled"),
    isShortDay: boolean("isShortDay").default(false), // -2h reduction
    isCompensatory: boolean("isCompensatory").default(false), // Compensation for shift change
    generatedBy: varchar("generatedBy", { length: 50 }), // 'system' or 'manual'
    complianceCheckId: int("complianceCheckId"), // Link to compliance check
    notes: text("notes"),
    version: int("version").default(1),
    createdBy: int("createdBy"),
    updatedBy: int("updatedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    tenantIdx: index("shifts_tenantId_idx").on(table.tenantId),
    employeeIdx: index("shifts_employeeId_idx").on(table.employeeId),
    timeIdx: index("shifts_startTime_idx").on(table.startTime),
    statusIdx: index("shifts_status_idx").on(table.status),
  })
);

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// ABSENCES & LEAVE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

export const absences = mysqlTable(
  "absences",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull(),
    employeeId: int("employeeId").notNull(),
    absenceType: varchar("absenceType", { length: 50 }).notNull(), // 'vacation', 'illness', 'maternity', etc.
    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate").notNull(),
    durationDays: decimal("durationDays", { precision: 5, scale: 2 }),
    isPaid: boolean("isPaid").default(true),
    status: mysqlEnum("status", ["draft", "pending_approval", "approved", "rejected", "cancelled"]).default("draft"),
    approvedBy: int("approvedBy"),
    approvalNotes: text("approvalNotes"),
    attachments: text("attachments"), // JSON: file references
    coverageImpactScore: text("coverageImpactScore"), // Legacy coverage score JSON
    payrollImpact: text("payrollImpact"), // Legacy payroll impact JSON
    supportingDocument: varchar("supportingDocument", { length: 500 }), // Legacy document reference
    notes: text("notes"), // Legacy operator notes
    impactOnCoverage: text("impactOnCoverage"), // JSON: coverage gap analysis
    impactOnPayroll: text("impactOnPayroll"), // JSON: salary impact
    version: int("version").default(1),
    createdBy: int("createdBy"),
    updatedBy: int("updatedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    tenantIdx: index("absences_tenantId_idx").on(table.tenantId),
    employeeIdx: index("absences_employeeId_idx").on(table.employeeId),
    typeIdx: index("absences_type_idx").on(table.absenceType),
    statusIdx: index("absences_status_idx").on(table.status),
  })
);

export type Absence = typeof absences.$inferSelect;
export type InsertAbsence = typeof absences.$inferInsert;

export const payrollRules = mysqlTable(
  "payrollRules",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull(),
    conceptName: varchar("conceptName", { length: 100 }),
    ruleType: mysqlEnum("ruleType", ["income", "deduction", "exempt"]),
    condition: text("condition"),
    formula: text("formula"),
    priority: int("priority").default(0),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("payrollRules_tenantId_idx").on(table.tenantId),
  })
);

export type PayrollRule = typeof payrollRules.$inferSelect;
export type InsertPayrollRule = typeof payrollRules.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// PAYROLL & COMPENSATION (Zone Crítica #5)
// ═══════════════════════════════════════════════════════════════════════════

export const payrolls = mysqlTable(
  "payrolls",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull(),
    employeeId: int("employeeId").notNull(),
    period: varchar("period", { length: 20 }).notNull(), // "2026-07"
    status: mysqlEnum("status", ["draft", "calculated", "approved", "paid"]).default("draft"),
    baseSalary: decimal("baseSalary", { precision: 10, scale: 2 }),
    hoursWorked: decimal("hoursWorked", { precision: 8, scale: 2 }),
    nightHours: decimal("nightHours", { precision: 8, scale: 2 }),
    overtimeHours: decimal("overtimeHours", { precision: 8, scale: 2 }),
    nightBonus: decimal("nightBonus", { precision: 10, scale: 2 }),
    overtimeBonus: decimal("overtimeBonus", { precision: 10, scale: 2 }),
    holidayBonus: decimal("holidayBonus", { precision: 10, scale: 2 }),
    nutriPass: decimal("nutriPass", { precision: 10, scale: 2 }),
    absenceDays: int("absenceDays"),
    itDeduction: text("itDeduction"), // Legacy payroll deduction representation
    deductions: decimal("deductions", { precision: 10, scale: 2 }),
    taxWithholding: decimal("taxWithholding", { precision: 10, scale: 2 }),
    gross: decimal("gross", { precision: 10, scale: 2 }),
    net: decimal("net", { precision: 10, scale: 2 }),
    payrollData: text("payrollData"), // JSON: all components with formulas
    approvedBy: int("approvedBy"),
    paidAt: timestamp("paidAt"),
    version: int("version").default(1),
    createdBy: int("createdBy"),
    updatedBy: int("updatedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("payrolls_tenantId_idx").on(table.tenantId),
    employeeIdx: index("payrolls_employeeId_idx").on(table.employeeId),
    periodIdx: index("payrolls_period_idx").on(table.period),
    statusIdx: index("payrolls_status_idx").on(table.status),
  })
);

export type Payroll = typeof payrolls.$inferSelect;
export type InsertPayroll = typeof payrolls.$inferInsert;

// Immutable ledger for payroll adjustments
export const payrollAdjustments = mysqlTable(
  "payrollAdjustments",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull(),
    payrollId: int("payrollId").notNull(),
    adjustmentType: varchar("adjustmentType", { length: 50 }).notNull(), // 'correction', 'bonus', 'deduction'
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    reason: text("reason").notNull(),
    approvedBy: int("approvedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    // NO updatedAt - this is immutable
  },
  (table) => ({
    tenantIdx: index("payrollAdjustments_tenantId_idx").on(table.tenantId),
    payrollIdx: index("payrollAdjustments_payrollId_idx").on(table.payrollId),
  })
);

export type PayrollAdjustment = typeof payrollAdjustments.$inferSelect;
export type InsertPayrollAdjustment = typeof payrollAdjustments.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// COMPLIANCE & LEGAL (Zone Crítica #2)
// ═══════════════════════════════════════════════════════════════════════════

export const complianceRuleVersions = mysqlTable(
  "complianceRuleVersions",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId"),
    ruleId: varchar("ruleId", { length: 100 }).notNull(), // e.g., "HR_DAILY_REST_12H"
    jurisdiction: varchar("jurisdiction", { length: 50 }).notNull(), // "ES", "PT", "FI", "EU"
    norm: varchar("norm", { length: 255 }).notNull(), // e.g., "Estatuto de los Trabajadores"
    articleReference: varchar("articleReference", { length: 100 }).notNull(), // e.g., "Art. 34.3"
    sourceUrl: text("sourceUrl").notNull(), // Official source
    effectiveFrom: timestamp("effectiveFrom").notNull(),
    effectiveTo: timestamp("effectiveTo"),
    parameters: text("parameters"), // JSON: configurable parameters
    logic: text("logic"), // JSON: rule logic/formula
    severity: mysqlEnum("severity", ["info", "warning", "hard_stop"]).notNull(),
    status: mysqlEnum("status", ["draft", "active", "deprecated"]).default("active"),
    version: int("version").default(1),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    createdBy: int("createdBy"),
  },
  (table) => ({
    ruleIdx: index("complianceRuleVersions_ruleId_idx").on(table.ruleId),
    jurisdictionIdx: index("complianceRuleVersions_jurisdiction_idx").on(table.jurisdiction),
    statusIdx: index("complianceRuleVersions_status_idx").on(table.status),
  })
);

export type ComplianceRuleVersion = typeof complianceRuleVersions.$inferSelect;
export type InsertComplianceRuleVersion = typeof complianceRuleVersions.$inferInsert;

// Immutable compliance violations
export const complianceViolations = mysqlTable(
  "complianceViolations",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull(),
    employeeId: int("employeeId"),
    shiftId: int("shiftId"),
    ruleId: varchar("ruleId", { length: 100 }).notNull(),
    violationType: varchar("violationType", { length: 100 }).notNull(),
    description: text("description"),
    severity: mysqlEnum("severity", ["warning", "critical"]).default("warning"),
    articleViolated: varchar("articleViolated", { length: 100 }),
    penaltyEur: decimal("penaltyEur", { precision: 10, scale: 2 }),
    isResolved: boolean("isResolved").default(false),
    resolvedAt: timestamp("resolvedAt"),
    resolvedBy: int("resolvedBy"),
    resolutionNotes: text("resolutionNotes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    // NO updatedAt - violations are immutable
  },
  (table) => ({
    tenantIdx: index("complianceViolations_tenantId_idx").on(table.tenantId),
    employeeIdx: index("complianceViolations_employeeId_idx").on(table.employeeId),
    ruleIdx: index("complianceViolations_ruleId_idx").on(table.ruleId),
  })
);

export type ComplianceViolation = typeof complianceViolations.$inferSelect;
export type InsertComplianceViolation = typeof complianceViolations.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT & EVENT SOURCING (Zone Crítica #5)
// ═══════════════════════════════════════════════════════════════════════════

// Immutable audit log with hash chain
export const auditLogs = mysqlTable(
  "auditLogs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull(),
    userId: int("userId"),
    action: varchar("action", { length: 100 }).notNull(), // 'shift_created', 'absence_approved'
    entityType: varchar("entityType", { length: 50 }), // Legacy entity naming
    entityId: int("entityId"), // Legacy entity identifier
    oldValues: text("oldValues"), // Legacy JSON snapshot
    newValues: text("newValues"), // Legacy JSON snapshot
    createdAt: timestamp("createdAt").defaultNow(), // Legacy timestamp
    resourceType: varchar("resourceType", { length: 50 }).notNull(), // 'shift', 'absence', 'employee'
    resourceId: varchar("resourceId", { length: 100 }).notNull(),
    beforeState: text("beforeState"), // JSON
    afterState: text("afterState"), // JSON
    requestId: varchar("requestId", { length: 100 }), // For tracing
    ipAddress: varchar("ipAddress", { length: 45 }),
    userAgent: text("userAgent"),
    hash: varchar("hash", { length: 256 }).notNull(), // SHA-256 of this record
    previousHash: varchar("previousHash", { length: 256 }), // SHA-256 of previous record
    occurredAt: timestamp("occurredAt").defaultNow().notNull(),
    // NO updatedAt - audit logs are immutable
  },
  (table) => ({
    tenantIdx: index("auditLogs_tenantId_idx").on(table.tenantId),
    resourceIdx: index("auditLogs_resourceType_resourceId_idx").on(table.resourceType, table.resourceId),
    actionIdx: index("auditLogs_action_idx").on(table.action),
    hashIdx: index("auditLogs_hash_idx").on(table.hash),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Immutable domain events (event sourcing)
export const domainEvents = mysqlTable(
  "domainEvents",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull(),
    aggregateType: varchar("aggregateType", { length: 50 }).notNull(), // 'shift', 'absence', 'payroll'
    aggregateId: varchar("aggregateId", { length: 100 }).notNull(),
    eventType: varchar("eventType", { length: 100 }).notNull(), // 'ShiftCreated', 'AbsenceApproved'
    eventData: text("eventData").notNull(), // JSON
    metadata: text("metadata"), // JSON: userId, requestId, timestamp
    version: int("version").notNull(), // Event version for this aggregate
    occurredAt: timestamp("occurredAt").defaultNow().notNull(),
    // NO updatedAt - events are immutable
  },
  (table) => ({
    tenantIdx: index("domainEvents_tenantId_idx").on(table.tenantId),
    aggregateIdx: index("domainEvents_aggregateType_aggregateId_idx").on(table.aggregateType, table.aggregateId),
    eventTypeIdx: index("domainEvents_eventType_idx").on(table.eventType),
  })
);

export type DomainEvent = typeof domainEvents.$inferSelect;
export type InsertDomainEvent = typeof domainEvents.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// REAL-TIME ADHERENCE (RTA)
// ═══════════════════════════════════════════════════════════════════════════

export const rtaEvents = mysqlTable(
  "rtaEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId").notNull(),
    employeeId: int("employeeId").notNull(),
    shiftId: int("shiftId"),
    eventType: varchar("eventType", { length: 50 }).notNull(), // 'login', 'logout', 'break_start', 'break_end'
    eventTime: timestamp("eventTime").notNull(),
    market: varchar("market", { length: 50 }),
    status: varchar("status", { length: 50 }), // 'on_time', 'late', 'absent'
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("rtaEvents_tenantId_idx").on(table.tenantId),
    employeeIdx: index("rtaEvents_employeeId_idx").on(table.employeeId),
    timeIdx: index("rtaEvents_eventTime_idx").on(table.eventTime),
  })
);

export type RtaEvent = typeof rtaEvents.$inferSelect;
export type InsertRtaEvent = typeof rtaEvents.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE FLAGS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const featureFlags = mysqlTable(
  "featureFlags",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenantId"),
    flagName: varchar("flagName", { length: 100 }).notNull(),
    description: text("description"),
    isEnabled: boolean("isEnabled").default(false),
    rolloutPercentage: int("rolloutPercentage").default(0), // 0-100
    config: text("config"), // JSON: feature-specific config
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    tenantFlagIdx: index("featureFlags_tenantId_flagName_idx").on(table.tenantId, table.flagName),
  })
);

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// SESSIONS & SECURITY
// ═══════════════════════════════════════════════════════════════════════════

export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: int("userId").notNull(),
    tenantId: int("tenantId").notNull(),
    ipAddress: varchar("ipAddress", { length: 45 }),
    userAgent: text("userAgent"),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
  },
  (table) => ({
    userIdx: index("sessions_userId_idx").on(table.userId),
    tenantIdx: index("sessions_tenantId_idx").on(table.tenantId),
  })
);

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
