DROP TABLE IF EXISTS entries;
--> statement-breakpoint
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  subject TEXT NOT NULL,
  author TEXT NOT NULL,
  date TEXT NOT NULL,
  read_minutes INTEGER NOT NULL DEFAULT 1,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  author TEXT NOT NULL,
  date TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE post_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  voter_key TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX post_votes_post_voter ON post_votes (post_id, voter_key);
--> statement-breakpoint
CREATE TABLE post_saves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX post_saves_post ON post_saves (post_id);
--> statement-breakpoint
CREATE TABLE topic_follows (
  topic TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
