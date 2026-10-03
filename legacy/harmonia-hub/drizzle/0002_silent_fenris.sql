CREATE TABLE `council_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`actor_user_id` int NOT NULL,
	`event_type` varchar(80) NOT NULL,
	`details` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `council_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `council_controls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`kill_switch_active` int NOT NULL DEFAULT 0,
	`updated_by_user_id` int NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `council_controls_id` PRIMARY KEY(`id`),
	CONSTRAINT `council_controls_user_idx` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `music_playlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`client_playlist_id` varchar(191) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`cover_url` text NOT NULL,
	`mood` varchar(32),
	`context` varchar(32),
	`genres` json NOT NULL,
	`tracks` json NOT NULL,
	`source` enum('ai','manual') NOT NULL DEFAULT 'ai',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `music_playlists_id` PRIMARY KEY(`id`),
	CONSTRAINT `music_playlists_owner_client_idx` UNIQUE(`user_id`,`client_playlist_id`)
);
--> statement-breakpoint
CREATE TABLE `music_track_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`track_id` varchar(191) NOT NULL,
	`state` enum('liked','recent') NOT NULL,
	`track` json NOT NULL,
	`occurred_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `music_track_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `music_track_states_owner_track_state_idx` UNIQUE(`user_id`,`track_id`,`state`)
);
--> statement-breakpoint
CREATE INDEX `council_audit_logs_owner_created_idx` ON `council_audit_logs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `music_playlists_user_idx` ON `music_playlists` (`user_id`);--> statement-breakpoint
CREATE INDEX `music_track_states_owner_state_idx` ON `music_track_states` (`user_id`,`state`);