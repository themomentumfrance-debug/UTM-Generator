CREATE TABLE `click_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`utm_link_id` int NOT NULL,
	`clicked_at` timestamp NOT NULL DEFAULT (now()),
	`country` varchar(100),
	`country_code` varchar(10),
	`city` varchar(100),
	`region` varchar(100),
	`device_type` varchar(50),
	`browser` varchar(100),
	`browser_version` varchar(50),
	`os` varchar(100),
	`os_version` varchar(50),
	`referer` text,
	`user_agent` text,
	`ip_address` varchar(45),
	`platform` varchar(100),
	CONSTRAINT `click_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audiences` DROP INDEX `audiences_nom_unique`;--> statement-breakpoint
ALTER TABLE `content_types` DROP INDEX `content_types_nom_unique`;--> statement-breakpoint
ALTER TABLE `objectives` DROP INDEX `objectives_nom_unique`;--> statement-breakpoint
ALTER TABLE `socials` DROP INDEX `socials_nom_unique`;--> statement-breakpoint
ALTER TABLE `audiences` ADD `user_id` int;--> statement-breakpoint
ALTER TABLE `channels` ADD `user_id` int;--> statement-breakpoint
ALTER TABLE `content_types` ADD `user_id` int;--> statement-breakpoint
ALTER TABLE `objectives` ADD `user_id` int;--> statement-breakpoint
ALTER TABLE `socials` ADD `user_id` int;--> statement-breakpoint
ALTER TABLE `utm_links` ADD `click_count` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `utm_links` ADD `user_id` int NOT NULL;