ALTER TABLE `absences`
  MODIFY COLUMN `status` enum('draft','pending_approval','approved','rejected','cancelled') DEFAULT 'draft',
  MODIFY COLUMN `isPaid` boolean DEFAULT true,
  MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `auditLogs`
  MODIFY COLUMN `id` bigint NOT NULL AUTO_INCREMENT,
  MODIFY COLUMN `action` varchar(100) NOT NULL,
  MODIFY COLUMN `resourceType` varchar(50) NOT NULL,
  MODIFY COLUMN `resourceId` varchar(100) NOT NULL,
  MODIFY COLUMN `hash` varchar(256) NOT NULL,
  MODIFY COLUMN `occurredAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `employees`
  MODIFY COLUMN `firstName` varchar(100) NOT NULL,
  MODIFY COLUMN `lastName` varchar(100) NOT NULL,
  MODIFY COLUMN `email` varchar(255) NOT NULL,
  MODIFY COLUMN `hireDate` timestamp NOT NULL,
  MODIFY COLUMN `isNightWorker` boolean DEFAULT false,
  MODIFY COLUMN `isMinor` boolean DEFAULT false,
  MODIFY COLUMN `isActive` boolean DEFAULT true,
  MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `featureFlags`
  MODIFY COLUMN `isEnabled` boolean DEFAULT false,
  MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `payrolls`
  MODIFY COLUMN `baseSalary` decimal(10,2),
  MODIFY COLUMN `hoursWorked` decimal(8,2),
  MODIFY COLUMN `nightHours` decimal(8,2),
  MODIFY COLUMN `nightBonus` decimal(10,2),
  MODIFY COLUMN `nutriPass` decimal(10,2),
  MODIFY COLUMN `gross` decimal(10,2),
  MODIFY COLUMN `net` decimal(10,2),
  MODIFY COLUMN `status` enum('draft','calculated','approved','paid') DEFAULT 'draft',
  MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `payrollRules`
  MODIFY COLUMN `isActive` boolean DEFAULT true,
  MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `rtaEvents`
  MODIFY COLUMN `eventType` varchar(50) NOT NULL,
  MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `sessions`
  MODIFY COLUMN `isActive` boolean DEFAULT true,
  MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE `shifts`
  MODIFY COLUMN `isShortDay` boolean DEFAULT false,
  MODIFY COLUMN `isCompensatory` boolean DEFAULT false,
  MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `tenants`
  MODIFY COLUMN `countryCode` varchar(3) DEFAULT 'BR',
  MODIFY COLUMN `timezone` varchar(50) DEFAULT 'America/Sao_Paulo',
  MODIFY COLUMN `legalJurisdiction` enum('BR','ES','PT','FI') DEFAULT 'BR',
  MODIFY COLUMN `isActive` boolean DEFAULT true,
  MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `userTenantRoles`
  MODIFY COLUMN `mfaRequired` boolean DEFAULT false,
  MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `users`
  MODIFY COLUMN `mfaEnabled` boolean DEFAULT false,
  MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
