CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`flowId` int NOT NULL,
	`idempotencyKey` varchar(180) NOT NULL,
	`payload` text NOT NULL,
	`status` enum('recibido','procesando','completado','fallido','excepcion') NOT NULL DEFAULT 'recibido',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`),
	CONSTRAINT `events_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `exceptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`payload` text NOT NULL,
	`reason` text NOT NULL,
	`status` enum('pendiente','resuelto') NOT NULL DEFAULT 'pendiente',
	`attempts` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `exceptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`flowId` int NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`durationMs` int,
	`tokenCost` varchar(32) NOT NULL DEFAULT '0',
	`result` text,
	`outcome` enum('regla determinista','LLM','reintento','excepcion','completado') NOT NULL,
	`trace` text NOT NULL,
	CONSTRAINT `executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`rules` text NOT NULL,
	`confidenceThreshold` varchar(16) NOT NULL DEFAULT '0.70',
	`destinationType` enum('webhook saliente','log interno') NOT NULL DEFAULT 'log interno',
	`destinationUrl` varchar(500),
	`status` enum('activo','pausado') NOT NULL DEFAULT 'activo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `events_flow_status_idx` ON `events` (`flowId`,`status`);--> statement-breakpoint
CREATE INDEX `exceptions_status_idx` ON `exceptions` (`status`);--> statement-breakpoint
CREATE INDEX `executions_event_idx` ON `executions` (`eventId`);--> statement-breakpoint
CREATE INDEX `executions_flow_idx` ON `executions` (`flowId`);--> statement-breakpoint
CREATE INDEX `flows_status_idx` ON `flows` (`status`);