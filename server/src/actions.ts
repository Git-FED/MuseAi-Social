import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import * as schema from "./schema";
import { SEED } from "./seed";

const attachmentOut = z.object({
  id: z.number(),
  kind: z.string(), // "image" | "file"
  name: z.string(),
  mime: z.string(),
  size: z.number(),
  url: z.string(),
});

const postOut = z.object({
  slug: z.string(),
  title: z.string(),
  topic: z.string(),
  subject: z.string(),
  author: z.string(),
  authorId: z.string().nullable(),
  authorUsername: z.string().nullable(),
  date: z.string(),
  readMinutes: z.number(),
  votes: z.number(),
  views: z.number(),
  imageAsset: z.string().nullable(),
  excerpt: z.string(),
  body: z.array(z.string()),
  commentCount: z.number(),
  attachments: z.array(attachmentOut),
});

const commentOut = z.object({
  id: z.number(),
  author: z.string(),
  authorId: z.string().nullable(),
  authorUsername: z.string().nullable(),
  date: z.string(),
  body: z.string(),
  attachments: z.array(attachmentOut),
});

/* ---------------- attachments (per-post / per-reply uploads) ---------------- */

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_ATTACHMENTS = 6;

const IMAGE_MIMES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};
const FILE_MIMES: Record<string, string> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/markdown": "md",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
};

const uploadIn = z.object({
  name: z.string().trim().min(1).max(120),
  mime: z.string().trim().min(1).max(100),
  dataBase64: z.string().min(1).max(15_000_000),
});

type UploadIn = z.infer<typeof uploadIn>;

function classifyUpload(u: UploadIn): "image" | "file" {
  if (u.mime in IMAGE_MIMES) return "image";
  if (u.mime in FILE_MIMES) return "file";
  throw new Error(
    `"${u.name}" is not an allowed type. Images: jpg, png, gif, webp. Files: pdf, txt, md, zip.`,
  );
}

async function storeAttachments(
  ctx: Ctx,
  ownerKind: "post" | "comment",
  ownerKey: string,
  uploads: UploadIn[],
) {
  if (uploads.length > MAX_ATTACHMENTS) {
    throw new Error(`At most ${MAX_ATTACHMENTS} attachments per post or reply.`);
  }
  const db = ctx.db<typeof schema>();
  for (const u of uploads) {
    const kind = classifyUpload(u);
    const bytes = Buffer.from(u.dataBase64, "base64");
    if (bytes.length === 0) throw new Error(`"${u.name}" came through empty.`);
    if (bytes.length > MAX_ATTACHMENT_BYTES) {
      throw new Error(`"${u.name}" is over the 10 MB per-file limit.`);
    }
    const safeName = u.name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 80) || "file";
    const blobKey = `attachments/${ownerKind}-${ownerKey}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${safeName}`;
    await ctx.blobs.put(blobKey, bytes, { contentType: u.mime });
    await db.insert(schema.attachments).values({
      ownerKind,
      ownerKey,
      kind,
      name: u.name,
      mime: u.mime,
      size: bytes.length,
      blobKey,
    });
  }
}

type AttachmentRow = typeof schema.attachments.$inferSelect;

async function attachmentsFor(
  ctx: Ctx,
  rows: AttachmentRow[],
  ownerKind: "post" | "comment",
  ownerKey: string,
) {
  const mine = rows.filter((r) => r.ownerKind === ownerKind && r.ownerKey === ownerKey);
  const out = [];
  for (const r of mine) {
    out.push({
      id: r.id,
      kind: r.kind,
      name: r.name,
      mime: r.mime,
      size: r.size,
      url: await ctx.blobs.getUrl(r.blobKey),
    });
  }
  return out;
}

const profileOut = z.object({
  userId: z.string(),
  username: z.string(),
  isOwner: z.boolean(),
});

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

async function getProfileRow(ctx: Ctx, userId: string) {
  const db = ctx.db<typeof schema>();
  const rows = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

function isAdminUsername(username: string): boolean {
  return username.trim().toLowerCase() === "admin";
}

function toProfileOut(row: { id: string; username: string; isOwner: number }) {
  // isOwner now means "is the admin account": the profile whose username is
  // admin (case-insensitive). The first-account-becomes-owner rule is gone.
  return {
    userId: row.id,
    username: row.username,
    isOwner: isAdminUsername(row.username),
  };
}

async function requireProfile(ctx: Ctx, userId: string, username: string) {
  const profile = await getProfileRow(ctx, userId);
  if (!profile) {
    throw new Error("Set a username on your account before posting.");
  }
  if (profile.username !== username) {
    throw new Error("That username does not match your account profile.");
  }
  return profile;
}

async function assertCanDelete(
  ctx: Ctx,
  callerId: string,
  authorId: string | null,
  authorUsername: string | null,
) {
  const caller = await getProfileRow(ctx, callerId);
  // Admin (username "admin", case-insensitive) can delete anything.
  if (caller && isAdminUsername(caller.username)) return;
  // Everyone else can only delete their own items: the stored author id must
  // be their account id AND the stored author username must be their
  // username. Starter posts have no author, so only admin can delete them.
  if (
    caller &&
    authorId &&
    authorId === callerId &&
    authorUsername &&
    authorUsername.toLowerCase() === caller.username.toLowerCase()
  ) {
    return;
  }
  throw new Error(
    "Only admin can delete any post. You can only delete posts with your username on them.",
  );
}

const roomOut = z.object({
  id: z.number(),
  name: z.string(),
  subject: z.string(),
  subjectName: z.string(),
  creatorId: z.string().nullable(),
  creatorUsername: z.string().nullable(),
  createdAt: z.string(),
});

async function ensureSeeded(ctx: Ctx) {
  const db = ctx.db<typeof schema>();
  const existing = await db.select({ id: schema.posts.id }).from(schema.posts).limit(1);
  if (existing.length > 0) {
    // Authorship correction: on MuseAi Social the starter posts belong to
    // the mod bot, not Git-FED and not Muse3. Rewrite the author fields on
    // any stored starter post, and backfill each starter post's generated
    // image. Titles, bodies, dates, votes, views, topics, subjects, and
    // slugs are left exactly as they are. Because the author is modbot (not
    // a logged-in member), only admin can delete them.
    for (const p of SEED.posts) {
      await db
        .update(schema.posts)
        .set({
          author: "Mod Bot",
          authorId: "modbot",
          authorUsername: "modbot",
          imageAsset: p.image,
        })
        .where(eq(schema.posts.slug, p.slug));
    }
    return;
  }
  for (const p of SEED.posts) {
    await db.insert(schema.posts).values({
      slug: p.slug,
      title: p.title,
      topic: p.topic,
      subject: p.subject,
      author: p.author,
      authorId: "modbot",
      authorUsername: "modbot",
      date: p.date,
      readMinutes: p.read,
      votes: p.votes,
      views: 0,
      imageAsset: p.image,
      excerpt: p.excerpt,
      bodyJson: JSON.stringify(p.body),
    });
    for (const c of p.comments) {
      await db.insert(schema.comments).values({
        postSlug: p.slug,
        author: c.author,
        date: c.date,
        body: c.body,
      });
    }
  }
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "post";
}

export const Actions = {
  getFeed: defineAction({
    description: "Returns all posts (with comment counts), taxonomy, and rooms for the board.",
    request: z.object({}),
    response: z.object({
      posts: z.array(postOut),
      topics: z.array(
        z.object({ key: z.string(), name: z.string(), color: z.string(), desc: z.string() }),
      ),
      subjects: z.array(
        z.object({ key: z.string(), name: z.string(), color: z.string(), desc: z.string() }),
      ),
      rooms: z.array(roomOut),
    }),
    async handler(ctx) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.posts)
        .orderBy(desc(schema.posts.date), desc(schema.posts.id));
      const allComments = await db.select().from(schema.comments);
      const counts = new Map<string, number>();
      for (const c of allComments) counts.set(c.postSlug, (counts.get(c.postSlug) ?? 0) + 1);
      const allAttachments = await db.select().from(schema.attachments);
      const roomRows = await db
        .select()
        .from(schema.rooms)
        .orderBy(desc(schema.rooms.id));
      const topics = Object.entries(SEED.topics.sections).map(([key, v]) => ({
        key,
        name: v.name,
        color: v.color,
        desc: v.desc,
      }));
      const subjects = Object.entries(SEED.topics.subjects).map(([key, v]) => ({
        key,
        name: v.name,
        color: v.color,
        desc: v.desc,
      }));
      const posts = [];
      for (const r of rows) {
        posts.push({
          slug: r.slug,
          title: r.title,
          topic: r.topic,
          subject: r.subject,
          author: r.author,
          authorId: r.authorId,
          authorUsername: r.authorUsername,
          date: r.date,
          readMinutes: r.readMinutes,
          votes: r.votes,
          views: r.views,
          imageAsset: r.imageAsset,
          excerpt: r.excerpt,
          body: JSON.parse(r.bodyJson) as string[],
          commentCount: counts.get(r.slug) ?? 0,
          attachments: await attachmentsFor(ctx, allAttachments, "post", r.slug),
        });
      }
      return {
        posts,
        topics,
        subjects,
        rooms: roomRows.map((r) => ({
          id: r.id,
          name: r.name,
          subject: r.subject,
          subjectName: r.subjectName,
          creatorId: r.creatorId,
          creatorUsername: r.creatorUsername,
          createdAt: r.createdAt.toISOString(),
        })),
      };
    },
  }),

  getPost: defineAction({
    description:
      "Returns one post with its full reply thread. Opening an article counts as one view: the stored view count goes up by 1 on each call.",
    request: z.object({ slug: z.string().min(1).max(120) }),
    response: z.object({
      post: postOut.nullable(),
      comments: z.array(commentOut),
    }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.slug, args.slug))
        .limit(1);
      const row = rows[0];
      if (!row) return { post: null, comments: [] };
      // One view per article open.
      await db
        .update(schema.posts)
        .set({ views: sql`${schema.posts.views} + 1` })
        .where(eq(schema.posts.slug, args.slug));
      const fresh = await db
        .select({ views: schema.posts.views })
        .from(schema.posts)
        .where(eq(schema.posts.slug, args.slug))
        .limit(1);
      const views = fresh[0]?.views ?? row.views + 1;
      const cs = await db
        .select()
        .from(schema.comments)
        .where(eq(schema.comments.postSlug, args.slug))
        .orderBy(asc(schema.comments.id));
      const allAttachments = await db.select().from(schema.attachments);
      const comments = [];
      for (const c of cs) {
        comments.push({
          id: c.id,
          author: c.author,
          authorId: c.authorId,
          authorUsername: c.authorUsername,
          date: c.date,
          body: c.body,
          attachments: await attachmentsFor(
            ctx,
            allAttachments,
            "comment",
            String(c.id),
          ),
        });
      }
      return {
        post: {
          slug: row.slug,
          title: row.title,
          topic: row.topic,
          subject: row.subject,
          author: row.author,
          authorId: row.authorId,
          authorUsername: row.authorUsername,
          date: row.date,
          readMinutes: row.readMinutes,
          votes: row.votes,
          views,
          imageAsset: row.imageAsset,
          excerpt: row.excerpt,
          body: JSON.parse(row.bodyJson) as string[],
          commentCount: cs.length,
          attachments: await attachmentsFor(ctx, allAttachments, "post", row.slug),
        },
        comments,
      };
    },
  }),

  getProfile: defineAction({
    description: "Returns the board profile (username, owner flag) for a signed-in account id, or null.",
    request: z.object({ userId: z.string().trim().min(1).max(64) }),
    response: z.object({ profile: profileOut.nullable() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const row = await getProfileRow(ctx, args.userId);
      return { profile: row ? toProfileOut(row) : null };
    },
  }),

  setUsername: defineAction({
    description:
      "Creates or changes the username for a signed-in account. Usernames are unique. The username admin belongs to one account only: once an admin account exists, no other account can take or change to it.",
    request: z.object({
      userId: z.string().trim().min(1).max(64),
      username: z
        .string()
        .trim()
        .regex(
          USERNAME_RE,
          "Usernames are 3 to 20 characters: letters, numbers, and underscore only.",
        ),
    }),
    response: z.object({ profile: profileOut }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const wanted = args.username.toLowerCase();
      const all = await db
        .select({ id: schema.profiles.id, username: schema.profiles.username })
        .from(schema.profiles);
      const taken = all.some(
        (p) => p.id !== args.userId && p.username.toLowerCase() === wanted,
      );
      if (taken) {
        throw new Error("That username is taken. Pick another one.");
      }
      const existing = await getProfileRow(ctx, args.userId);
      // The username admin can only ever belong to one account. If an admin
      // account already exists, nobody else may take or change to it.
      if (wanted === "admin") {
        const adminHolder = all.find(
          (p) => p.username.toLowerCase() === "admin",
        );
        if (adminHolder && adminHolder.id !== args.userId) {
          throw new Error(
            "The username admin already belongs to the site admin account and cannot be taken.",
          );
        }
      }
      const isOwner = isAdminUsername(args.username) ? 1 : 0;
      if (existing) {
        await db
          .update(schema.profiles)
          .set({ username: args.username, isOwner })
          .where(eq(schema.profiles.id, args.userId));
        ctx.invalidateQueries();
        return {
          profile: toProfileOut({ ...existing, username: args.username, isOwner }),
        };
      }
      await db.insert(schema.profiles).values({
        id: args.userId,
        username: args.username,
        isOwner,
      });
      ctx.invalidateQueries();
      return {
        profile: { userId: args.userId, username: args.username, isOwner: isOwner === 1 },
      };
    },
  }),

  createPost: defineAction({
    description: "Publishes a new post into the feed, tied to the author's account and username.",
    request: z.object({
      title: z.string().trim().min(3).max(140),
      topic: z.enum(["learn", "build", "help", "show", "news"]),
      subject: z.enum(["meta-glasses", "meta-ai", "meta-integrations"]),
      authorId: z.string().trim().min(1).max(64),
      authorUsername: z
        .string()
        .trim()
        .regex(USERNAME_RE, "A valid username is required to post."),
      body: z.string().trim().min(10).max(8000),
      attachments: z.array(uploadIn).max(MAX_ATTACHMENTS).optional(),
    }),
    response: z.object({ slug: z.string() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      await requireProfile(ctx, args.authorId, args.authorUsername);
      const db = ctx.db<typeof schema>();
      let slug = slugify(args.title);
      const clash = await db
        .select({ id: schema.posts.id })
        .from(schema.posts)
        .where(eq(schema.posts.slug, slug))
        .limit(1);
      if (clash.length > 0) slug = `${slug}-${Date.now().toString(36)}`;
      const today = new Date().toISOString().slice(0, 10);
      const paragraphs = args.body
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean);
      const excerpt =
        (paragraphs[0] ?? args.body).slice(0, 220) +
        ((paragraphs[0] ?? "").length > 220 ? "…" : "");
      const readMinutes = Math.max(1, Math.round(args.body.split(/\s+/).length / 200));
      await db.insert(schema.posts).values({
        slug,
        title: args.title,
        topic: args.topic,
        subject: args.subject,
        author: args.authorUsername,
        authorId: args.authorId,
        authorUsername: args.authorUsername,
        date: today,
        readMinutes,
        votes: 0,
        views: 0,
        excerpt,
        bodyJson: JSON.stringify(paragraphs.length ? paragraphs : [args.body]),
      });
      if (args.attachments?.length) {
        await storeAttachments(ctx, "post", slug, args.attachments);
      }
      ctx.invalidateQueries();
      return { slug };
    },
  }),

  votePost: defineAction({
    description: "Adds one upvote to a post and returns the new total.",
    request: z.object({ slug: z.string().min(1).max(120) }),
    response: z.object({ votes: z.number() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      await db
        .update(schema.posts)
        .set({ votes: sql`${schema.posts.votes} + 1` })
        .where(eq(schema.posts.slug, args.slug));
      const rows = await db
        .select({ votes: schema.posts.votes })
        .from(schema.posts)
        .where(eq(schema.posts.slug, args.slug))
        .limit(1);
      ctx.invalidateQueries();
      return { votes: rows[0]?.votes ?? 0 };
    },
  }),

  addComment: defineAction({
    description: "Adds a reply to a post thread, tied to the author's account and username.",
    request: z.object({
      slug: z.string().min(1).max(120),
      authorId: z.string().trim().min(1).max(64),
      authorUsername: z
        .string()
        .trim()
        .regex(USERNAME_RE, "A valid username is required to reply."),
      body: z.string().trim().min(1).max(2000),
      attachments: z.array(uploadIn).max(MAX_ATTACHMENTS).optional(),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      await requireProfile(ctx, args.authorId, args.authorUsername);
      const db = ctx.db<typeof schema>();
      const today = new Date().toISOString().slice(0, 10);
      const result = await db
        .insert(schema.comments)
        .values({
          postSlug: args.slug,
          author: args.authorUsername,
          authorId: args.authorId,
          authorUsername: args.authorUsername,
          date: today,
          body: args.body,
        })
        .returning({ id: schema.comments.id });
      const commentId = result[0]?.id ?? 0;
      if (args.attachments?.length && commentId) {
        await storeAttachments(ctx, "comment", String(commentId), args.attachments);
      }
      ctx.invalidateQueries();
      return { id: commentId };
    },
  }),

  deletePost: defineAction({
    description:
      "Deletes a post and all of its replies. Only the admin account (username admin) can delete any post; everyone else can only delete a post whose author id and author username match their own account.",
    request: z.object({
      slug: z.string().min(1).max(120),
      callerId: z.string().trim().min(1).max(64),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select({
          authorId: schema.posts.authorId,
          authorUsername: schema.posts.authorUsername,
        })
        .from(schema.posts)
        .where(eq(schema.posts.slug, args.slug))
        .limit(1);
      const row = rows[0];
      if (!row) return { ok: true };
      await assertCanDelete(ctx, args.callerId, row.authorId, row.authorUsername);
      const postComments = await db
        .select({ id: schema.comments.id })
        .from(schema.comments)
        .where(eq(schema.comments.postSlug, args.slug));
      for (const c of postComments) {
        await db
          .delete(schema.attachments)
          .where(
            and(
              eq(schema.attachments.ownerKind, "comment"),
              eq(schema.attachments.ownerKey, String(c.id)),
            ),
          );
      }
      await db
        .delete(schema.attachments)
        .where(
          and(
            eq(schema.attachments.ownerKind, "post"),
            eq(schema.attachments.ownerKey, args.slug),
          ),
        );
      await db
        .delete(schema.comments)
        .where(eq(schema.comments.postSlug, args.slug));
      await db.delete(schema.posts).where(eq(schema.posts.slug, args.slug));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  deleteComment: defineAction({
    description:
      "Deletes one reply from a post thread. Only the admin account (username admin) can delete any reply; everyone else can only delete a reply whose author id and author username match their own account.",
    request: z.object({
      id: z.number().int().positive(),
      callerId: z.string().trim().min(1).max(64),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select({
          authorId: schema.comments.authorId,
          authorUsername: schema.comments.authorUsername,
        })
        .from(schema.comments)
        .where(eq(schema.comments.id, args.id))
        .limit(1);
      const row = rows[0];
      if (!row) return { ok: true };
      await assertCanDelete(ctx, args.callerId, row.authorId, row.authorUsername);
      await db
        .delete(schema.attachments)
        .where(
          and(
            eq(schema.attachments.ownerKind, "comment"),
            eq(schema.attachments.ownerKey, String(args.id)),
          ),
        );
      await db.delete(schema.comments).where(eq(schema.comments.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  createRoom: defineAction({
    description:
      "Creates a community room. When the creator is signed in with a username, the room records them as its creator so they (or admin) can delete it later; rooms created signed-out have no creator and are admin-only deletes.",
    request: z.object({
      name: z.string().trim().min(2).max(60),
      subject: z.enum(["meta-glasses", "meta-ai", "meta-integrations"]),
      authorId: z.string().trim().min(1).max(64).optional(),
      authorUsername: z
        .string()
        .trim()
        .regex(USERNAME_RE, "A valid username is required to own a room.")
        .optional(),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      let creatorId: string | null = null;
      let creatorUsername: string | null = null;
      if (args.authorId && args.authorUsername) {
        await requireProfile(ctx, args.authorId, args.authorUsername);
        creatorId = args.authorId;
        creatorUsername = args.authorUsername;
      }
      const labels: Record<string, string> = {
        "meta-glasses": "Meta Glasses",
        "meta-ai": "Meta AI app",
        "meta-integrations": "Meta integrations",
      };
      const result = await db
        .insert(schema.rooms)
        .values({
          name: args.name,
          subject: args.subject,
          subjectName: labels[args.subject] ?? "Meta integrations",
          creatorId,
          creatorUsername,
        })
        .returning({ id: schema.rooms.id });
      ctx.invalidateQueries();
      return { id: result[0]?.id ?? 0 };
    },
  }),

  deleteRoom: defineAction({
    description:
      "Deletes a community room. Only the admin account (username admin) can delete any room; everyone else can only delete a room they created (creator id and creator username match their own account). Rooms created signed-out have no creator, so only admin can delete them.",
    request: z.object({
      id: z.number().int().positive(),
      callerId: z.string().trim().min(1).max(64),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select({
          creatorId: schema.rooms.creatorId,
          creatorUsername: schema.rooms.creatorUsername,
        })
        .from(schema.rooms)
        .where(eq(schema.rooms.id, args.id))
        .limit(1);
      const row = rows[0];
      if (!row) return { ok: true };
      try {
        await assertCanDelete(ctx, args.callerId, row.creatorId, row.creatorUsername);
      } catch {
        throw new Error(
          "Only admin can delete any room. You can only delete rooms you created.",
        );
      }
      await db.delete(schema.rooms).where(eq(schema.rooms.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

} satisfies ActionsModule;
