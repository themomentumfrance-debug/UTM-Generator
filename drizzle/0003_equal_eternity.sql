CREATE TABLE `click_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`utm_link_id` int NOT NULL,
	`clicked_at` timestamp NOT NULL DEFAULT (now()),
	`country` varchar(100),
	`city` varchar(100),
	`device` varchar(50),
	`browser` varchar(100),
	`os` varchar(100),
	`referer` text,
	`user_agent` text,
	`ip_address` varchar(45),
	CONSTRAINT `click_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `utm_links` ADD `click_count` int DEFAULT 0;