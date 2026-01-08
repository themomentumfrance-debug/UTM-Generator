CREATE TABLE `audiences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nom` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `audiences_id` PRIMARY KEY(`id`),
	CONSTRAINT `audiences_nom_unique` UNIQUE(`nom`)
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nom` varchar(255) NOT NULL,
	`lien` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nom` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_types_nom_unique` UNIQUE(`nom`)
);
--> statement-breakpoint
CREATE TABLE `gdrive_sync` (
	`id` int AUTO_INCREMENT NOT NULL,
	`table_name` varchar(100) NOT NULL,
	`last_sync_at` timestamp NOT NULL DEFAULT (now()),
	`record_count` int DEFAULT 0,
	`status` varchar(50) DEFAULT 'success',
	`error_message` text,
	CONSTRAINT `gdrive_sync_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `objectives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nom` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `objectives_id` PRIMARY KEY(`id`),
	CONSTRAINT `objectives_nom_unique` UNIQUE(`nom`)
);
--> statement-breakpoint
CREATE TABLE `publication_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`utm_link_id` int NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_key` varchar(500) NOT NULL,
	`url` text NOT NULL,
	`mime_type` varchar(100),
	`file_size` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publication_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nom` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `socials_id` PRIMARY KEY(`id`),
	CONSTRAINT `socials_nom_unique` UNIQUE(`nom`)
);
--> statement-breakpoint
CREATE TABLE `utm_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`destination_url` text NOT NULL,
	`social_id` int NOT NULL,
	`content_type_id` int NOT NULL,
	`channel_id` int,
	`objectif_id` int NOT NULL,
	`audience_id` int,
	`utm_source` varchar(255) NOT NULL,
	`utm_medium` varchar(255) NOT NULL,
	`utm_campaign` varchar(255) NOT NULL,
	`utm_term` varchar(255),
	`utm_content` varchar(255),
	`generated_url` text NOT NULL,
	`angle_marketing` text,
	`hook` text,
	`audience_cible` text,
	`budget` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` int,
	CONSTRAINT `utm_links_id` PRIMARY KEY(`id`)
);
