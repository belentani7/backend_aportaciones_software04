CREATE TABLE IF NOT EXISTS `payrollRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`conceptName` varchar(100),
	`ruleType` enum('income','deduction','exempt'),
	`condition` text,
	`formula` text,
	`priority` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payrollRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `payrollRules_tenantId_idx` ON `payrollRules` (`tenantId`);