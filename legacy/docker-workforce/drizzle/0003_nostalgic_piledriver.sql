ALTER TABLE `employees` MODIFY COLUMN `currency` varchar(3) DEFAULT 'BRL';--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `countryCode` varchar(3) DEFAULT 'BR';--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `timezone` varchar(50) DEFAULT 'America/Sao_Paulo';--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `legalJurisdiction` enum('BR','ES','PT','FI') DEFAULT 'BR';