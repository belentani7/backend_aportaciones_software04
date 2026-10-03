CREATE TABLE `autonomous_iterations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`iterationNumber` int NOT NULL,
	`outcome` varchar(32) NOT NULL,
	`capacityState` varchar(16) NOT NULL,
	`confidence` decimal(5,2) NOT NULL,
	`actionJson` text NOT NULL,
	`reason` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `autonomous_iterations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `autonomous_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`runKey` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`casePrompt` text NOT NULL,
	`objective` text NOT NULL,
	`status` enum('active','completed','saturated','stopped','error') NOT NULL DEFAULT 'active',
	`maxIterations` int NOT NULL DEFAULT 20,
	`iterationCount` int NOT NULL DEFAULT 0,
	`lastOutcome` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `autonomous_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `autonomous_runs_runKey_unique` UNIQUE(`runKey`)
);
