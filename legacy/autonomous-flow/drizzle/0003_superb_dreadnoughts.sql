ALTER TABLE `events` ADD `attempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `availableAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `claimedAt` timestamp;--> statement-breakpoint
ALTER TABLE `events` ADD `claimToken` varchar(64);--> statement-breakpoint
ALTER TABLE `events` ADD `lastError` text;--> statement-breakpoint
CREATE INDEX `events_queue_idx` ON `events` (`status`,`availableAt`);