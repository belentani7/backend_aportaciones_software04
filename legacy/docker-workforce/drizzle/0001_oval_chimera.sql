ALTER TABLE `users` ADD `notificationConsent` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `notificationConsentAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `notificationConsentRevokedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `notificationSoundEnabled` boolean DEFAULT true;