// Drizzle schema for MuseAi Social.
//
// posts/comments hold the community content (seeded once from the
// user-supplied portable site archive, then grown by the user's own
// posts and comments). post_votes dedupes votes per device key,
// post_saves and topic_follows hold the user's saved posts and
// followed topics, and rooms holds community rooms.

import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  subject: text("subject").notNull(),
  author: text("author").notNull(),
  // Calendar date of the post, YYYY-MM-DD, as supplied or created.
  date: text("date").notNull(),
  readMinutes: integer("read_minutes").notNull().default(1),
  excerpt: text("excerpt").notNull(),
  // JSON-encoded array of body paragraphs.
  body: text("body").notNull(),
  votes: integer("votes").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id),
  author: text("author").notNull(),
  date: text("date").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const postVotes = sqliteTable(
  "post_votes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id),
    voterKey: text("voter_key").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("post_votes_post_voter").on(t.postId, t.voterKey)],
);

export const postSaves = sqliteTable(
  "post_saves",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("post_saves_post").on(t.postId)],
);

export const topicFollows = sqliteTable("topic_follows", {
  topic: text("topic").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const rooms = sqliteTable("rooms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
