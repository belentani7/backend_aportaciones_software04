CREATE TABLE `absences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`employeeId` int NOT NULL,
	`absenceType` varchar(50) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`durationDays` decimal(5,2),
	`isPaid` boolean DEFAULT true,
	`status` enum('draft','pending_approval','approved','rejected','cancelled') DEFAULT 'draft',
	`approvedBy` int,
	`approvalNotes` text,
	`attachments` text,
	`impactOnCoverage` text,
	`impactOnPayroll` text,
	`version` int DEFAULT 1,
	`createdBy` int,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `absences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(50) NOT NULL,
	`resourceId` varchar(100) NOT NULL,
	`beforeState` text,
	`afterState` text,
	`requestId` varchar(100),
	`ipAddress` varchar(45),
	`userAgent` text,
	`hash` varchar(256) NOT NULL,
	`previousHash` varchar(256),
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceRuleVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`ruleId` varchar(100) NOT NULL,
	`jurisdiction` varchar(50) NOT NULL,
	`norm` varchar(255) NOT NULL,
	`articleReference` varchar(100) NOT NULL,
	`sourceUrl` text NOT NULL,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`parameters` text,
	`logic` text,
	`severity` enum('info','warning','hard_stop') NOT NULL,
	`status` enum('draft','active','deprecated') DEFAULT 'active',
	`version` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	CONSTRAINT `complianceRuleVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceViolations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`employeeId` int,
	`shiftId` int,
	`ruleId` varchar(100) NOT NULL,
	`violationType` varchar(100) NOT NULL,
	`description` text,
	`severity` enum('warning','critical') DEFAULT 'warning',
	`articleViolated` varchar(100),
	`penaltyEur` decimal(10,2),
	`isResolved` boolean DEFAULT false,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`resolutionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complianceViolations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `domainEvents` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`aggregateType` varchar(50) NOT NULL,
	`aggregateId` varchar(100) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`eventData` text NOT NULL,
	`metadata` text,
	`version` int NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `domainEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`externalId` varchar(100),
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(20),
	`birthDate` timestamp,
	`hireDate` timestamp NOT NULL,
	`contractType` enum('permanent','temporary','apprentice','part_time') DEFAULT 'permanent',
	`baseSalary` decimal(10,2),
	`currency` varchar(3) DEFAULT 'EUR',
	`contractData` text,
	`skills` text,
	`isNightWorker` boolean DEFAULT false,
	`isMinor` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`version` int DEFAULT 1,
	`createdBy` int,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `featureFlags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`flagName` varchar(100) NOT NULL,
	`description` text,
	`isEnabled` boolean DEFAULT false,
	`rolloutPercentage` int DEFAULT 0,
	`config` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `featureFlags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payrollAdjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`payrollId` int NOT NULL,
	`adjustmentType` varchar(50) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`reason` text NOT NULL,
	`approvedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payrollAdjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payrolls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`employeeId` int NOT NULL,
	`period` varchar(20) NOT NULL,
	`status` enum('draft','calculated','approved','paid') DEFAULT 'draft',
	`baseSalary` decimal(10,2),
	`hoursWorked` decimal(8,2),
	`nightHours` decimal(8,2),
	`overtimeHours` decimal(8,2),
	`nightBonus` decimal(10,2),
	`overtimeBonus` decimal(10,2),
	`holidayBonus` decimal(10,2),
	`nutriPass` decimal(10,2),
	`absenceDays` int,
	`deductions` decimal(10,2),
	`taxWithholding` decimal(10,2),
	`gross` decimal(10,2),
	`net` decimal(10,2),
	`payrollData` text,
	`approvedBy` int,
	`paidAt` timestamp,
	`version` int DEFAULT 1,
	`createdBy` int,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payrolls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rtaEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`employeeId` int NOT NULL,
	`shiftId` int,
	`eventType` varchar(50) NOT NULL,
	`eventTime` timestamp NOT NULL,
	`market` varchar(50),
	`status` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rtaEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`employeeId` int,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`shiftType` varchar(50),
	`market` varchar(50),
	`status` enum('scheduled','completed','missed','cancelled') DEFAULT 'scheduled',
	`isShortDay` boolean DEFAULT false,
	`isCompensatory` boolean DEFAULT false,
	`generatedBy` varchar(50),
	`complianceCheckId` int,
	`notes` text,
	`version` int DEFAULT 1,
	`createdBy` int,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`countryCode` varchar(3) DEFAULT 'ES',
	`timezone` varchar(50) DEFAULT 'Europe/Madrid',
	`legalJurisdiction` enum('ES','PT','FI') DEFAULT 'ES',
	`collectiveAgreement` text,
	`legalConfig` text,
	`dataResidency` varchar(50) DEFAULT 'EU',
	`isActive` boolean DEFAULT true,
	`version` int DEFAULT 1,
	`createdBy` int,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `userTenantRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int NOT NULL,
	`role` enum('owner','admin','squad_lead','operator','employee','auditor','billing','integration') NOT NULL,
	`permissions` text,
	`mfaRequired` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userTenantRoles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`mfaEnabled` boolean DEFAULT false,
	`lastSignedIn` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `absences_tenantId_idx` ON `absences` (`tenantId`);--> statement-breakpoint
CREATE INDEX `absences_employeeId_idx` ON `absences` (`employeeId`);--> statement-breakpoint
CREATE INDEX `absences_type_idx` ON `absences` (`absenceType`);--> statement-breakpoint
CREATE INDEX `absences_status_idx` ON `absences` (`status`);--> statement-breakpoint
CREATE INDEX `auditLogs_tenantId_idx` ON `auditLogs` (`tenantId`);--> statement-breakpoint
CREATE INDEX `auditLogs_resourceType_resourceId_idx` ON `auditLogs` (`resourceType`,`resourceId`);--> statement-breakpoint
CREATE INDEX `auditLogs_action_idx` ON `auditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `auditLogs_hash_idx` ON `auditLogs` (`hash`);--> statement-breakpoint
CREATE INDEX `complianceRuleVersions_ruleId_idx` ON `complianceRuleVersions` (`ruleId`);--> statement-breakpoint
CREATE INDEX `complianceRuleVersions_jurisdiction_idx` ON `complianceRuleVersions` (`jurisdiction`);--> statement-breakpoint
CREATE INDEX `complianceRuleVersions_status_idx` ON `complianceRuleVersions` (`status`);--> statement-breakpoint
CREATE INDEX `complianceViolations_tenantId_idx` ON `complianceViolations` (`tenantId`);--> statement-breakpoint
CREATE INDEX `complianceViolations_employeeId_idx` ON `complianceViolations` (`employeeId`);--> statement-breakpoint
CREATE INDEX `complianceViolations_ruleId_idx` ON `complianceViolations` (`ruleId`);--> statement-breakpoint
CREATE INDEX `domainEvents_tenantId_idx` ON `domainEvents` (`tenantId`);--> statement-breakpoint
CREATE INDEX `domainEvents_aggregateType_aggregateId_idx` ON `domainEvents` (`aggregateType`,`aggregateId`);--> statement-breakpoint
CREATE INDEX `domainEvents_eventType_idx` ON `domainEvents` (`eventType`);--> statement-breakpoint
CREATE INDEX `employees_tenantId_idx` ON `employees` (`tenantId`);--> statement-breakpoint
CREATE INDEX `employees_active_idx` ON `employees` (`isActive`);--> statement-breakpoint
CREATE INDEX `featureFlags_tenantId_flagName_idx` ON `featureFlags` (`tenantId`,`flagName`);--> statement-breakpoint
CREATE INDEX `payrollAdjustments_tenantId_idx` ON `payrollAdjustments` (`tenantId`);--> statement-breakpoint
CREATE INDEX `payrollAdjustments_payrollId_idx` ON `payrollAdjustments` (`payrollId`);--> statement-breakpoint
CREATE INDEX `payrolls_tenantId_idx` ON `payrolls` (`tenantId`);--> statement-breakpoint
CREATE INDEX `payrolls_employeeId_idx` ON `payrolls` (`employeeId`);--> statement-breakpoint
CREATE INDEX `payrolls_period_idx` ON `payrolls` (`period`);--> statement-breakpoint
CREATE INDEX `payrolls_status_idx` ON `payrolls` (`status`);--> statement-breakpoint
CREATE INDEX `rtaEvents_tenantId_idx` ON `rtaEvents` (`tenantId`);--> statement-breakpoint
CREATE INDEX `rtaEvents_employeeId_idx` ON `rtaEvents` (`employeeId`);--> statement-breakpoint
CREATE INDEX `rtaEvents_eventTime_idx` ON `rtaEvents` (`eventTime`);--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `sessions_tenantId_idx` ON `sessions` (`tenantId`);--> statement-breakpoint
CREATE INDEX `shifts_tenantId_idx` ON `shifts` (`tenantId`);--> statement-breakpoint
CREATE INDEX `shifts_employeeId_idx` ON `shifts` (`employeeId`);--> statement-breakpoint
CREATE INDEX `shifts_startTime_idx` ON `shifts` (`startTime`);--> statement-breakpoint
CREATE INDEX `shifts_status_idx` ON `shifts` (`status`);--> statement-breakpoint
CREATE INDEX `tenants_slug_idx` ON `tenants` (`slug`);--> statement-breakpoint
CREATE INDEX `tenants_active_idx` ON `tenants` (`isActive`);--> statement-breakpoint
CREATE INDEX `userTenantRoles_tenantId_idx` ON `userTenantRoles` (`tenantId`);--> statement-breakpoint
CREATE INDEX `userTenantRoles_role_idx` ON `userTenantRoles` (`role`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);