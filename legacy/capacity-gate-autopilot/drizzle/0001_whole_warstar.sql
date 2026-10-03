CREATE TABLE `auto_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`outcome` enum('accept','waitlist','route','reject') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auto_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `control_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`capacityUtilization` decimal(6,2) NOT NULL DEFAULT '0.00',
	`responseMinutes` decimal(10,2) NOT NULL DEFAULT '0.00',
	`errorRate` decimal(6,2) NOT NULL DEFAULT '0.00',
	`humanInterventionRate` decimal(6,2) NOT NULL DEFAULT '0.00',
	`marginPerOperation` decimal(10,2) NOT NULL DEFAULT '0.00',
	`duplicateRate` decimal(6,2) NOT NULL DEFAULT '0.00',
	`incidentCount` int NOT NULL DEFAULT 0,
	`alertLevel` enum('normal','warning','critical') NOT NULL DEFAULT 'normal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `control_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `capacity_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`ownerId` int NOT NULL,
	`outcome` enum('accept','waitlist','route','reject','human_review','stop') NOT NULL,
	`capacityState` enum('VERDE','AMARILLO','NARANJA','ROJO','NEGRO') NOT NULL,
	`confidence` decimal(5,2) NOT NULL,
	`reason` text NOT NULL,
	`modelUsed` varchar(128) NOT NULL DEFAULT 'capacity-gate-rules',
	`rulesVersion` varchar(32) NOT NULL,
	`responseJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `capacity_decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operating_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`theoreticalCapacity` int NOT NULL DEFAULT 100,
	`qualityFactor` decimal(5,2) NOT NULL DEFAULT '0.80',
	`humanFactor` decimal(5,2) NOT NULL DEFAULT '0.80',
	`safetyBuffer` decimal(5,2) NOT NULL DEFAULT '0.80',
	`minimumMargin` decimal(10,2) NOT NULL DEFAULT '50.00',
	`maxResponseMinutes` int NOT NULL DEFAULT 60,
	`maxRisk` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`authorizedChannels` text NOT NULL,
	`queueOrangeThreshold` int NOT NULL DEFAULT 85,
	`queueRedThreshold` int NOT NULL DEFAULT 100,
	`errorThreshold` decimal(5,2) NOT NULL DEFAULT '0.08',
	`confidenceThreshold` decimal(5,2) NOT NULL DEFAULT '0.65',
	`ruleVersion` varchar(32) NOT NULL DEFAULT '1.0.0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operating_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `capacity_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`requestKey` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`channel` varchar(64) NOT NULL,
	`priority` int NOT NULL DEFAULT 50,
	`complexity` int NOT NULL DEFAULT 1,
	`urgency` int NOT NULL DEFAULT 1,
	`estimatedLoad` int NOT NULL DEFAULT 1,
	`estimatedMargin` decimal(10,2) NOT NULL DEFAULT '0.00',
	`risk` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`status` enum('accepted','waitlist','routed','rejected','human_review','stopped','processing','completed','expired') NOT NULL DEFAULT 'waitlist',
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `capacity_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `capacity_requests_requestKey_unique` UNIQUE(`requestKey`)
);
