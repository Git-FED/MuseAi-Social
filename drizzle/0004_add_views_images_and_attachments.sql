ALTER TABLE `posts` ADD COLUMN `views` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `posts` ADD COLUMN `image_asset` text;
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_kind` text NOT NULL,
	`owner_key` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`blob_key` text NOT NULL,
	`created_at` integer NOT NULL
);
