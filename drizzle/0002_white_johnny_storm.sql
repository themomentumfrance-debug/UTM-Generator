ALTER TABLE `utm_links` ADD `slug` varchar(20);--> statement-breakpoint
ALTER TABLE `utm_links` ADD `short_url` text;--> statement-breakpoint
ALTER TABLE `utm_links` ADD CONSTRAINT `utm_links_slug_unique` UNIQUE(`slug`);