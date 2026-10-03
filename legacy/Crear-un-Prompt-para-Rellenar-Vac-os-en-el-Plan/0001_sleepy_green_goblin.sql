CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`leadId` int NOT NULL,
	`businessId` int,
	`campaignId` int,
	`status` enum('scheduled','attended','no_show','cancelled') NOT NULL DEFAULT 'scheduled',
	`scheduledAt` timestamp NOT NULL,
	`revenueCents` int NOT NULL DEFAULT 0,
	`commissionCents` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`niche` varchar(100) NOT NULL,
	`city` varchar(120),
	`contactEmail` varchar(320),
	`contactPhone` varchar(40),
	`status` enum('active','paused','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`businessId` int,
	`name` varchar(180) NOT NULL,
	`channel` enum('email','whatsapp') NOT NULL DEFAULT 'email',
	`mode` enum('simulation','live') NOT NULL DEFAULT 'simulation',
	`status` enum('draft','running','paused','completed') NOT NULL DEFAULT 'draft',
	`dailyLimit` int NOT NULL DEFAULT 25,
	`subject` varchar(240),
	`bodyTemplate` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consent_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`leadId` int NOT NULL,
	`eventType` enum('captured','verified','revoked','exported') NOT NULL,
	`source` varchar(120) NOT NULL,
	`proof` text,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consent_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`businessId` int,
	`campaignId` int,
	`name` varchar(180) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`source` varchar(100) NOT NULL,
	`sourceUrl` varchar(500),
	`city` varchar(120),
	`consentStatus` enum('verified','pending','revoked','unknown') NOT NULL DEFAULT 'unknown',
	`consentProof` text,
	`consentAt` timestamp,
	`doNotContact` boolean NOT NULL DEFAULT false,
	`status` enum('new','queued','contacted','replied','qualified','booked','converted','disqualified') NOT NULL DEFAULT 'new',
	`score` int NOT NULL DEFAULT 0,
	`lastContactedAt` timestamp,
	`nextContactAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`leadId` int NOT NULL,
	`campaignId` int NOT NULL,
	`channel` enum('email','whatsapp') NOT NULL,
	`direction` enum('outbound','inbound') NOT NULL,
	`status` enum('simulated','queued','sent','delivered','failed','received') NOT NULL,
	`subject` varchar(240),
	`body` text NOT NULL,
	`providerMessageId` varchar(180),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
