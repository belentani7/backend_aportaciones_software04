ALTER TABLE `flows` ADD `ownerId` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `flows_owner_idx` ON `flows` (`ownerId`);