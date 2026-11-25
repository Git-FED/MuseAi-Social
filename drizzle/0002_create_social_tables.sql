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
  read_minutes INTEGER NOT NULL DEFAULT 3,
  votes INTEGER NOT NULL DEFAULT 0,
  excerpt TEXT NOT NULL,
  body_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  author TEXT NOT NULL,
  date TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
