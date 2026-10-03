CREATE TABLE `automation_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`job_name` varchar(255) NOT NULL,
	`schedule` varchar(100) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`schedule_cron_task_uid` varchar(65),
	`last_run_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_jobs_task_uid_idx` UNIQUE(`schedule_cron_task_uid`)
);
--> statement-breakpoint
CREATE TABLE `automation_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`idempotency_key` varchar(191) NOT NULL,
	`status` varchar(50) NOT NULL,
	`phase` varchar(30) NOT NULL,
	`result` json,
	`error` text,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`finished_at` timestamp,
	CONSTRAINT `automation_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_runs_idem_idx` UNIQUE(`idempotency_key`)
);
--> statement-breakpoint
CREATE TABLE `crm_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'lead',
	`value` decimal(10,2) NOT NULL DEFAULT '0.00',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pvcu_ledger_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequence_id` int NOT NULL,
	`workflow_id` varchar(191) NOT NULL,
	`envelope_id` varchar(191) NOT NULL,
	`input_hash` varchar(128) NOT NULL,
	`previous_hash` varchar(128) NOT NULL,
	`record_hash` varchar(128) NOT NULL,
	`passed` int NOT NULL DEFAULT 1,
	`envelope` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pvcu_ledger_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `pvcu_sequence_idx` UNIQUE(`sequence_id`)
);
--> statement-breakpoint
CREATE INDEX `automation_jobs_user_idx` ON `automation_jobs` (`user_id`);--> statement-breakpoint
CREATE INDEX `automation_runs_job_idx` ON `automation_runs` (`job_id`);--> statement-breakpoint
CREATE INDEX `crm_contacts_user_idx` ON `crm_contacts` (`user_id`);--> statement-breakpoint
CREATE INDEX `pvcu_workflow_idx` ON `pvcu_ledger_records` (`workflow_id`);