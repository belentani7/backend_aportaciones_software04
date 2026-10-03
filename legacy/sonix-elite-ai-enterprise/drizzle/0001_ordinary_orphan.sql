CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`details` text NOT NULL,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instrumentals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`genre` varchar(100) NOT NULL,
	`bpm` int NOT NULL,
	`keySignature` varchar(20) NOT NULL,
	`instruments` text NOT NULL,
	`durationSeconds` int NOT NULL,
	`audioUrl` text,
	`audioKey` varchar(255),
	`status` enum('processing','completed','failed') NOT NULL DEFAULT 'processing',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `instrumentals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`genre` varchar(100) NOT NULL,
	`mood` varchar(100) NOT NULL,
	`language` varchar(20) NOT NULL,
	`lyrics` text NOT NULL,
	`audioUrl` text,
	`audioKey` varchar(255),
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `songs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voice_clones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`voiceName` varchar(255) NOT NULL,
	`sampleUrl` text NOT NULL,
	`sampleKey` varchar(255) NOT NULL,
	`consentAccepted` int NOT NULL DEFAULT 1,
	`consentIp` varchar(45),
	`status` enum('processing','ready','failed') NOT NULL DEFAULT 'processing',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_clones_id` PRIMARY KEY(`id`)
);
