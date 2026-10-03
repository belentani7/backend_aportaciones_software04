ALTER TABLE `shifts`
  ADD COLUMN `complianceCheckId` int,
  ADD COLUMN `version` int DEFAULT 1,
  ADD COLUMN `createdBy` int,
  ADD COLUMN `updatedBy` int,
  ADD COLUMN `deletedAt` timestamp;

ALTER TABLE `absences`
  ADD COLUMN `durationDays` decimal(5,2),
  ADD COLUMN `isPaid` int DEFAULT 1,
  ADD COLUMN `approvalNotes` text,
  ADD COLUMN `attachments` text,
  ADD COLUMN `impactOnCoverage` text,
  ADD COLUMN `impactOnPayroll` text,
  ADD COLUMN `version` int DEFAULT 1,
  ADD COLUMN `createdBy` int,
  ADD COLUMN `updatedBy` int,
  ADD COLUMN `deletedAt` timestamp;

ALTER TABLE `payrolls`
  ADD COLUMN `overtimeHours` decimal(8,2),
  ADD COLUMN `overtimeBonus` decimal(10,2),
  ADD COLUMN `holidayBonus` decimal(10,2),
  ADD COLUMN `deductions` decimal(10,2),
  ADD COLUMN `taxWithholding` decimal(10,2),
  ADD COLUMN `approvedBy` int,
  ADD COLUMN `paidAt` timestamp,
  ADD COLUMN `version` int DEFAULT 1,
  ADD COLUMN `createdBy` int,
  ADD COLUMN `updatedBy` int;

ALTER TABLE `complianceViolations`
  ADD COLUMN `ruleId` varchar(100),
  ADD COLUMN `articleViolated` varchar(100),
  ADD COLUMN `penaltyEur` decimal(10,2),
  ADD COLUMN `resolvedBy` int,
  ADD COLUMN `resolutionNotes` text;

ALTER TABLE `userTenantRoles`
  ADD COLUMN `permissions` text,
  ADD COLUMN `mfaRequired` int DEFAULT 0,
  ADD COLUMN `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS `complianceRuleVersions` (
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
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdBy` int,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `payrollAdjustments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tenantId` int NOT NULL,
  `payrollId` int NOT NULL,
  `adjustmentType` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reason` text NOT NULL,
  `approvedBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `domainEvents` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `tenantId` int NOT NULL,
  `aggregateType` varchar(50) NOT NULL,
  `aggregateId` varchar(100) NOT NULL,
  `eventType` varchar(100) NOT NULL,
  `eventData` text NOT NULL,
  `metadata` text,
  `version` int NOT NULL,
  `occurredAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) NOT NULL,
  `userId` int NOT NULL,
  `tenantId` int NOT NULL,
  `ipAddress` varchar(45),
  `userAgent` text,
  `isActive` int DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` timestamp NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `featureFlags` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tenantId` int,
  `flagName` varchar(100) NOT NULL,
  `description` text,
  `isEnabled` int DEFAULT 0,
  `rolloutPercentage` int DEFAULT 0,
  `config` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
