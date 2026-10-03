ALTER TABLE `users`
  ADD COLUMN `mfaEnabled` int DEFAULT 0,
  ADD COLUMN `notificationConsent` int DEFAULT 0,
  ADD COLUMN `notificationConsentAt` timestamp,
  ADD COLUMN `notificationConsentRevokedAt` timestamp,
  ADD COLUMN `notificationSoundEnabled` int DEFAULT 1,
  ADD COLUMN `deletedAt` timestamp;

ALTER TABLE `auditLogs`
  ADD COLUMN `resourceType` varchar(50) DEFAULT 'legacy',
  ADD COLUMN `resourceId` varchar(100) DEFAULT 'legacy',
  ADD COLUMN `beforeState` text,
  ADD COLUMN `afterState` text,
  ADD COLUMN `requestId` varchar(100),
  ADD COLUMN `hash` varchar(256) DEFAULT '',
  ADD COLUMN `previousHash` varchar(256),
  ADD COLUMN `occurredAt` timestamp DEFAULT CURRENT_TIMESTAMP;
