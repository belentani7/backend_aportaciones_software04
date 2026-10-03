ALTER TABLE `tenants`
  ADD COLUMN `slug` varchar(100) NOT NULL UNIQUE,
  ADD COLUMN `legalJurisdiction` enum('BR','ES','PT','FI') DEFAULT 'BR',
  ADD COLUMN `dataResidency` varchar(50) DEFAULT 'EU',
  ADD COLUMN `version` int DEFAULT 1,
  ADD COLUMN `createdBy` int,
  ADD COLUMN `updatedBy` int,
  ADD COLUMN `deletedAt` timestamp;

ALTER TABLE `tenants`
  MODIFY COLUMN `countryCode` varchar(3) DEFAULT 'BR',
  MODIFY COLUMN `timezone` varchar(50) DEFAULT 'America/Sao_Paulo';
