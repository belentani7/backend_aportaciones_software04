CREATE TABLE `safety_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(96) NOT NULL,
	`sessionKey` varchar(128) NOT NULL,
	`code` varchar(64) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`status` enum('pending','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`evidenceHash` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `safety_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `safety_reviews_externalId_unique` UNIQUE(`externalId`)
);
