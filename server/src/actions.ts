// Actions for MuseAi Social: the backend for the post area.
//
// Content starts with the ten posts and comments from the user's own
// portable site archive (importSiteContent, run once after submit) and
// then grows only through the user's own posts, comments, votes,
// saves, follows, and rooms created in this UI.

import { defineAction, z, type ActionsModule } from "@hatch/space-sdk";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import * as schema from "./schema";
import { SEED_POSTS, SEED_TOPICS } from "./seed-data";

const TOPIC_KEYS = ["learn", "build", "help", "show", "news"] as const;
const SUBJECT_KEYS = ["meta-glasses", "meta-ai", "meta-integrations"] as const;

const topicEnum = z.enum(TOPIC_KEYS);
const subjectEnum = z.enum(SUBJECT_KEYS);

const taxonomyItem = z.object({
  key: z.string(),
  name: z.string(),
  color: z.string(),
  desc: z.string(),
});

const postSummary = z.object({
  slug: z.string(),
  title: z.string(),
  topic: z.string(),
  subject: z.string(),
  author: z.string(),
  date: z.string(),
  readMinutes: z.number(),
  excerpt: z.string(),
  votes: z.number(),
  commentCount: z.number(),
  saved: z.boolean(),
  voted: z.boolean(),
});

type PostSummary = z.infer<typeof postSummary>;

function taxonomyList(
  record: Record<string, { name: string; color: string; desc: string }>,
) {
  return Object.entries(record).map(([key, v]) => ({
    key,
    name: v.name,
    color: v.color,
    desc: v.desc,
  }));
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "post";
}

// The archive's post bodies carry light markup (<h2>, <ol><li>, <code>)
// from the static site's article format. Expand it to plain readable
// paragraphs so posts render as text everywhere. Idempotent: text that
// is already plain passes through unchanged.
function plainParagraphs(paragraphs: string[]): string[] {
  const decode = (s: string) =>
    s
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  const strip = (s: string) => decode(s.replace(/<[^>]+>/g, "")).trim();
  const out: string[] = [];
  for (const para of paragraphs) {
    if (/<li[\s>]/i.test(para)) {
      const items = [...para.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((m) => strip(m[1] ?? ""))
        .filter(Boolean);
      for (const item of items) out.push(`• ${item}`);
    } else {
      const text = strip(para);
      if (text) out.push(text);
    }
  }
  return out;
}

function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const Actions = {
  importSiteContent: defineAction({
    description:
      "Imports the posts, comments, and vote counts from the user's MuseAi Social site archive into the database, once; later calls change nothing.",
    request: z.object({}),
    response: z.object({ imported: z.boolean(), posts: z.number() }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const existing = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.posts);
      const count = existing[0]?.count ?? 0;
      if (count > 0) {
        return { imported: false, posts: count };
      }
      const statements: BatchItem<"sqlite">[] = [];
      for (const post of SEED_POSTS) {
        statements.push(
          db.insert(schema.posts).values({
            slug: post.slug,
            title: post.title,
            topic: post.topic,
            subject: post.subject,
            author: post.author,
            date: post.date,
            readMinutes: post.read,
            excerpt: post.excerpt,
            body: JSON.stringify(plainParagraphs(post.body)),
            votes: post.votes,
          }),
        );
      }
      const [first, ...rest] = statements;
      if (first) await db.batch([first, ...rest]);

      // Comments reference post ids, so insert them after the posts exist.
      const rows = await db
        .select({ id: schema.posts.id, slug: schema.posts.slug })
        .from(schema.posts);
      const idBySlug = new Map(rows.map((r) => [r.slug, r.id]));
      const commentStatements: BatchItem<"sqlite">[] = [];
      for (const post of SEED_POSTS) {
        const postId = idBySlug.get(post.slug);
        if (!postId) continue;
        for (const comment of post.comments ?? []) {
          commentStatements.push(
            db.insert(schema.comments).values({
              postId,
              author: comment.author,
              date: comment.date,
              body: comment.body,
            }),
          );
        }
      }
      const [cFirst, ...cRest] = commentStatements;
      if (cFirst) await db.batch([cFirst, ...cRest]);
      ctx.invalidateQueries();
      return { imported: true, posts: SEED_POSTS.length };
    },
  }),

  getFeed: defineAction({
    description:
      "Returns the post feed with taxonomy, optionally filtered by topic, subject, search text, or saved-only, plus this device's vote/save/follow state.",
    request: z.object({
      topic: topicEnum.optional(),
      subject: subjectEnum.optional(),
      query: z.string().max(120).optional(),
      savedOnly: z.boolean().default(false),
      voterKey: z.string().min(1).max(64),
    }),
    response: z.object({
      posts: z.array(postSummary),
      topics: z.array(taxonomyItem),
      subjects: z.array(taxonomyItem),
      followedTopics: z.array(z.string()),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const conditions = [];
      if (args.topic) conditions.push(eq(schema.posts.topic, args.topic));
      if (args.subject)
        conditions.push(eq(schema.posts.subject, args.subject));
      let rows = await db
        .select()
        .from(schema.posts)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(schema.posts.date), desc(schema.posts.id));

      const commentCounts = await db
        .select({
          postId: schema.comments.postId,
          count: sql<number>`count(*)`,
        })
        .from(schema.comments)
        .groupBy(schema.comments.postId);
      const countByPost = new Map(commentCounts.map((c) => [c.postId, c.count]));

      const saveRows = await db.select().from(schema.postSaves);
      const savedIds = new Set(saveRows.map((s) => s.postId));

      const voteRows = await db
        .select()
        .from(schema.postVotes)
        .where(eq(schema.postVotes.voterKey, args.voterKey));
      const votedIds = new Set(voteRows.map((v) => v.postId));

      if (args.savedOnly) rows = rows.filter((r) => savedIds.has(r.id));
      const q = args.query?.trim().toLowerCase();
      if (q) {
        rows = rows.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.excerpt.toLowerCase().includes(q),
        );
      }

      const followRows = await db.select().from(schema.topicFollows);

      const posts: PostSummary[] = rows.map((r) => ({
        slug: r.slug,
        title: r.title,
        topic: r.topic,
        subject: r.subject,
        author: r.author,
        date: r.date,
        readMinutes: r.readMinutes,
        excerpt: r.excerpt,
        votes: r.votes,
        commentCount: countByPost.get(r.id) ?? 0,
        saved: savedIds.has(r.id),
        voted: votedIds.has(r.id),
      }));

      return {
        posts,
        topics: taxonomyList(SEED_TOPICS.sections),
        subjects: taxonomyList(SEED_TOPICS.subjects),
        followedTopics: followRows.map((f) => f.topic),
      };
    },
  }),

  getPost: defineAction({
    description:
      "Returns one post with its full body and comments, by slug.",
    request: z.object({
      slug: z.string().min(1).max(120),
      voterKey: z.string().min(1).max(64),
    }),
    response: z.object({
      post: postSummary.extend({
        body: z.array(z.string()),
      }),
      comments: z.array(
        z.object({
          id: z.number(),
          author: z.string(),
          date: z.string(),
          body: z.string(),
        }),
      ),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.slug, args.slug))
        .limit(1);
      const post = rows[0];
      if (!post) throw new Error("That post could not be found.");

      const commentRows = await db
        .select()
        .from(schema.comments)
        .where(eq(schema.comments.postId, post.id))
        .orderBy(asc(schema.comments.id));

      const saveRows = await db
        .select()
        .from(schema.postSaves)
        .where(eq(schema.postSaves.postId, post.id));
      const voteRows = await db
        .select()
        .from(schema.postVotes)
        .where(
          and(
            eq(schema.postVotes.postId, post.id),
            eq(schema.postVotes.voterKey, args.voterKey),
          ),
        );

      let body: string[] = [];
      try {
        const parsed: unknown = JSON.parse(post.body);
        if (Array.isArray(parsed)) {
          body = plainParagraphs(
            parsed.filter((p): p is string => typeof p === "string"),
          );
        }
      } catch {
        body = [post.body];
      }

      return {
        post: {
          slug: post.slug,
          title: post.title,
          topic: post.topic,
          subject: post.subject,
          author: post.author,
          date: post.date,
          readMinutes: post.readMinutes,
          excerpt: post.excerpt,
          votes: post.votes,
          commentCount: commentRows.length,
          saved: saveRows.length > 0,
          voted: voteRows.length > 0,
          body,
        },
        comments: commentRows.map((c) => ({
          id: c.id,
          author: c.author,
          date: c.date,
          body: c.body,
        })),
      };
    },
  }),

  createPost: defineAction({
    description:
      "Publishes a new post to the feed with the given title, topic, subject, author name, and body text.",
    request: z.object({
      title: z.string().trim().min(1).max(160),
      topic: topicEnum,
      subject: subjectEnum,
      author: z.string().trim().min(1).max(40),
      body: z.string().trim().min(1).max(8000),
    }),
    response: z.object({ slug: z.string() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const paragraphs = args.body
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      const words = args.body.split(/\s+/).filter(Boolean).length;
      const readMinutes = Math.max(1, Math.ceil(words / 200));
      const firstText = (paragraphs[0] ?? args.body).replace(/\s+/g, " ");
      const excerpt =
        firstText.length > 180 ? `${firstText.slice(0, 177)}...` : firstText;

      let slug = slugify(args.title);
      const clash = await db
        .select({ id: schema.posts.id })
        .from(schema.posts)
        .where(eq(schema.posts.slug, slug));
      if (clash.length > 0) slug = `${slug}-${Date.now().toString(36)}`;

      await db.insert(schema.posts).values({
        slug,
        title: args.title,
        topic: args.topic,
        subject: args.subject,
        author: args.author,
        date: todayISO(),
        readMinutes,
        excerpt,
        body: JSON.stringify(paragraphs),
        votes: 0,
      });
      ctx.invalidateQueries();
      return { slug };
    },
  }),

  addComment: defineAction({
    description: "Adds a comment to the post with the given slug.",
    request: z.object({
      slug: z.string().min(1).max(120),
      author: z.string().trim().min(1).max(40),
      body: z.string().trim().min(1).max(1000),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select({ id: schema.posts.id })
        .from(schema.posts)
        .where(eq(schema.posts.slug, args.slug))
        .limit(1);
      const post = rows[0];
      if (!post) throw new Error("That post could not be found.");
      const result = await db
        .insert(schema.comments)
        .values({
          postId: post.id,
          author: args.author,
          date: todayISO(),
          body: args.body,
        })
        .returning({ id: schema.comments.id });
      const inserted = result[0];
      if (!inserted) throw new Error("The comment could not be saved.");
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),

  toggleVote: defineAction({
    description:
      "Toggles this device's vote on a post and returns the new total.",
    request: z.object({
      slug: z.string().min(1).max(120),
      voterKey: z.string().min(1).max(64),
    }),
    response: z.object({ votes: z.number(), voted: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.slug, args.slug))
        .limit(1);
      const post = rows[0];
      if (!post) throw new Error("That post could not be found.");
      const mine = await db
        .select()
        .from(schema.postVotes)
        .where(
          and(
            eq(schema.postVotes.postId, post.id),
            eq(schema.postVotes.voterKey, args.voterKey),
          ),
        );
      let voted: boolean;
      let votes: number;
      if (mine.length > 0) {
        await db
          .delete(schema.postVotes)
          .where(eq(schema.postVotes.id, mine[0]!.id));
        votes = Math.max(0, post.votes - 1);
        voted = false;
      } else {
        await db
          .insert(schema.postVotes)
          .values({ postId: post.id, voterKey: args.voterKey });
        votes = post.votes + 1;
        voted = true;
      }
      await db
        .update(schema.posts)
        .set({ votes })
        .where(eq(schema.posts.id, post.id));
      ctx.invalidateQueries();
      return { votes, voted };
    },
  }),

  toggleSave: defineAction({
    description: "Toggles whether a post is in the saved list.",
    request: z.object({ slug: z.string().min(1).max(120) }),
    response: z.object({ saved: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select({ id: schema.posts.id })
        .from(schema.posts)
        .where(eq(schema.posts.slug, args.slug))
        .limit(1);
      const post = rows[0];
      if (!post) throw new Error("That post could not be found.");
      const mine = await db
        .select()
        .from(schema.postSaves)
        .where(eq(schema.postSaves.postId, post.id));
      let saved: boolean;
      if (mine.length > 0) {
        await db
          .delete(schema.postSaves)
          .where(eq(schema.postSaves.id, mine[0]!.id));
        saved = false;
      } else {
        await db.insert(schema.postSaves).values({ postId: post.id });
        saved = true;
      }
      ctx.invalidateQueries();
      return { saved };
    },
  }),

  toggleFollowTopic: defineAction({
    description: "Toggles whether a topic is followed.",
    request: z.object({ topic: topicEnum }),
    response: z.object({ followed: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const mine = await db
        .select()
        .from(schema.topicFollows)
        .where(eq(schema.topicFollows.topic, args.topic));
      let followed: boolean;
      if (mine.length > 0) {
        await db
          .delete(schema.topicFollows)
          .where(eq(schema.topicFollows.topic, args.topic));
        followed = false;
      } else {
        await db.insert(schema.topicFollows).values({ topic: args.topic });
        followed = true;
      }
      ctx.invalidateQueries();
      return { followed };
    },
  }),

  listRooms: defineAction({
    description: "Lists the community rooms, newest first.",
    request: z.object({}),
    response: z.object({
      rooms: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          description: z.string(),
          createdAt: z.string(),
        }),
      ),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.rooms)
        .orderBy(desc(schema.rooms.id));
      return {
        rooms: rows.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          createdAt: r.createdAt.toISOString(),
        })),
      };
    },
  }),

  createRoom: defineAction({
    description: "Creates a community room with a name and description.",
    request: z.object({
      name: z.string().trim().min(1).max(60),
      description: z.string().trim().max(240).default(""),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const result = await db
        .insert(schema.rooms)
        .values({ name: args.name, description: args.description })
        .returning({ id: schema.rooms.id });
      const inserted = result[0];
      if (!inserted) throw new Error("The room could not be created.");
      ctx.invalidateQueries();
      return { id: inserted.id };
    },
  }),
} satisfies ActionsModule;
