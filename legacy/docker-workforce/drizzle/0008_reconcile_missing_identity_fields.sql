ALTER TABLE `employees` ADD COLUMN `phone` varchar(20);
ALTER TABLE `users` ADD COLUMN `mfaEnabled` int DEFAULT 0, ADD COLUMN `deletedAt` timestamp;
