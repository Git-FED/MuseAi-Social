import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  subject: text("subject").notNull(),
  author: text("author").notNull(),
  authorId: text("author_id"),
  authorUsername: text("author_username"),
  date: text("date").notNull(),
  readMinutes: integer("read_minutes").notNull().default(3),
  votes: integer("votes").notNull().default(0),
  views: integer("views").notNull().default(0),
  imageAsset: text("image_asset"),
  excerpt: text("excerpt").notNull(),
  bodyJson: text("body_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postSlug: text("post_slug").notNull(),
  author: text("author").notNull(),
  authorId: text("author_id"),
  authorUsername: text("author_username"),
  date: text("date").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const rooms = sqliteTable("rooms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  subjectName: text("subject_name").notNull(),
  creatorId: text("creator_id"),
  creatorUsername: text("creator_username"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const attachments = sqliteTable("attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerKind: text("owner_kind").notNull(), // "post" | "comment"
  ownerKey: text("owner_key").notNull(), // post slug, or comment id as text
  kind: text("kind").notNull(), // "image" | "file"
  name: text("name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  blobKey: text("blob_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  isOwner: integer("is_owner").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
