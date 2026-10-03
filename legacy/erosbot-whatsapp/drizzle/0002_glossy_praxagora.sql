CREATE TABLE `assistant_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKey` varchar(128) NOT NULL,
	`state` varchar(32) NOT NULL,
	`language` varchar(16) NOT NULL,
	`premium` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `assistant_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `assistant_sessions_sessionKey_unique` UNIQUE(`sessionKey`)
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`subjectHash` varchar(128) NOT NULL,
	`ruleCode` varchar(96),
	`severity` enum('low','medium','high','critical'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_idempotency` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` varchar(256) NOT NULL,
	`messageHash` varchar(128) NOT NULL,
	`status` enum('processing','processed','failed') NOT NULL DEFAULT 'processing',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `message_idempotency_id` PRIMARY KEY(`id`),
	CONSTRAINT `message_idempotency_messageId_unique` UNIQUE(`messageId`)
);
