ALTER TABLE `absences` ADD COLUMN IF NOT EXISTS `coverageImpactScore` text;--> statement-breakpoint
ALTER TABLE `absences` ADD COLUMN IF NOT EXISTS `payrollImpact` text;--> statement-breakpoint
ALTER TABLE `absences` ADD COLUMN IF NOT EXISTS `supportingDocument` varchar(500);--> statement-breakpoint
ALTER TABLE `absences` ADD COLUMN IF NOT EXISTS `notes` text;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD COLUMN IF NOT EXISTS `entityType` varchar(50);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD COLUMN IF NOT EXISTS `entityId` int;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD COLUMN IF NOT EXISTS `oldValues` text;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD COLUMN IF NOT EXISTS `newValues` text;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD COLUMN IF NOT EXISTS `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `payrolls` ADD COLUMN IF NOT EXISTS `itDeduction` text;