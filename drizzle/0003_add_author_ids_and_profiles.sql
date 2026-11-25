ALTER TABLE posts ADD COLUMN author_id TEXT;
--> statement-breakpoint
ALTER TABLE posts ADD COLUMN author_username TEXT;
--> statement-breakpoint
ALTER TABLE comments ADD COLUMN author_id TEXT;
--> statement-breakpoint
ALTER TABLE comments ADD COLUMN author_username TEXT;
--> statement-breakpoint
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  is_owner INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
