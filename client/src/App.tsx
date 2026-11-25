import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actionFields } from "@hatch/space-sdk/fields" with { type: "macro" };
import { api, type ApiResponse } from "./api";
import type { Actions } from "../../server/src/actions";

import heroImg from "./assets/promo-hero.webp";
import glassesImg from "./assets/promo-glasses-mishap.webp";
import buildImg from "./assets/promo-build-lab.webp";
import communityImg from "./assets/promo-community.webp";
import supportImg from "./assets/promo-support.webp";
import avatarImg from "./assets/gitfed-avatar.webp";

const FIELDS = actionFields<typeof Actions>();

type Feed = ApiResponse<typeof api, "getFeed">;
type PostSummary = Feed["posts"][number];
type PostDetail = ApiResponse<typeof api, "getPost">;
type TaxonomyItem = Feed["topics"][number];

type View =
  | { kind: "feed" }
  | { kind: "post"; slug: string }
  | { kind: "new" }
  | { kind: "topics" }
  | { kind: "community" }
  | { kind: "support" }
  | { kind: "thanks" };

const SUBJECT_ART: Record<string, string> = {
  "meta-glasses": glassesImg,
  "meta-ai": heroImg,
  "meta-integrations": buildImg,
};

const SUPPORT_LINKS = [
  {
    name: "GitHub Sponsors",
    desc: "Sponsor Git-FED on GitHub.",
    href: "https://github.com/sponsors/Git-FED",
  },
  {
    name: "Buy Me a Coffee",
    desc: "One-time support through Buy Me a Coffee.",
    href: "https://www.buymeacoffee.com/fedpromptly",
  },
  {
    name: "Substack",
    desc: "Subscribe to the FedPromptly Substack.",
    href: "https://gitfed.substack.com/subscribe",
  },
  {
    name: "NOWPayments",
    desc: "Support with crypto through NOWPayments.",
    href: "https://nowpayments.io/payment/?iid=5997958570&source=button",
  },
  {
    name: "thanks.dev",
    desc: "Fund the open-source dependencies behind the work.",
    href: "https://thanks.dev/d/gh/git-fed/dependencies",
  },
];

const DISCORD_WIDGET =
  "https://discord.com/widget?id=1400235929154879490&theme=dark";

function voterKey(): string {
  const storageKey = "museai-social-voter";
  let key = window.localStorage.getItem(storageKey);
  if (!key) {
    key =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(storageKey, key);
  }
  return key;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function topicOf(feed: Feed | undefined, key: string): TaxonomyItem | undefined {
  return feed?.topics.find((t) => t.key === key);
}
function subjectOf(
  feed: Feed | undefined,
  key: string,
): TaxonomyItem | undefined {
  return feed?.subjects.find((s) => s.key === key);
}

export function App() {
  const [view, setView] = useState<View>({ kind: "feed" });
  const [topic, setTopic] = useState<string | undefined>(undefined);
  const [subject, setSubject] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const key = useMemo(() => voterKey(), []);
  const queryClient = useQueryClient();

  const feedArgs = useMemo(
    () => ({
      ...(topic ? { topic: topic as PostSummary["topic"] } : {}),
      ...(subject ? { subject: subject as PostSummary["subject"] } : {}),
      ...(query.trim() ? { query: query.trim() } : {}),
      savedOnly,
      voterKey: key,
    }),
    [topic, subject, query, savedOnly, key],
  );

  const feed = useQuery({
    queryKey: ["feed", feedArgs],
    queryFn: () =>
      api.getFeed(feedArgs as Parameters<typeof api.getFeed>[0]),
  });

  const invalidateFeed = () =>
    queryClient.invalidateQueries({ queryKey: ["feed"] });

  const voteMutation = useMutation({
    mutationFn: async (slug: string) =>
      await api.toggleVote({ slug, voterKey: key }),
    onSuccess: () => {
      invalidateFeed();
      queryClient.invalidateQueries({ queryKey: ["post"] });
    },
    onError: () => {},
  });

  const saveMutation = useMutation({
    mutationFn: async (slug: string) => await api.toggleSave({ slug }),
    onSuccess: () => {
      invalidateFeed();
      queryClient.invalidateQueries({ queryKey: ["post"] });
    },
    onError: () => {},
  });

  const followMutation = useMutation({
    mutationFn: async (t: string) =>
      await api.toggleFollowTopic({
        topic: t as Parameters<typeof api.toggleFollowTopic>[0]["topic"],
      }),
    onSuccess: invalidateFeed,
    onError: () => {},
  });

  const goFeed = (next?: { topic?: string; subject?: string }) => {
    setTopic(next?.topic);
    setSubject(next?.subject);
    setSavedOnly(false);
    setView({ kind: "feed" });
  };

  const tickerItems = feed.data
    ? feed.data.posts.slice(0, 6).map((p) => p.title)
    : [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Ticker */}
      <div
        className="overflow-hidden border-b py-1.5"
        style={{ borderColor: "var(--border)", background: "#12121e" }}
        aria-hidden="true"
      >
        <div className="ticker-track flex w-max gap-10 whitespace-nowrap text-xs font-semibold tracking-wide">
          {[...tickerItems, ...tickerItems].map((title, i) => (
            <span key={i} style={{ color: "var(--dim)" }}>
              <span style={{ color: "var(--accent-pink)" }}>◆</span> {title}
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav
        className="sticky top-0 z-20 border-b backdrop-blur"
        style={{
          borderColor: "var(--border)",
          background: "rgba(14,14,20,0.92)",
        }}
        aria-label="Main"
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-2">
          <button
            type="button"
            onClick={() => goFeed()}
            className="font-display mr-2 px-2 py-1 text-base font-extrabold"
            style={{ color: "var(--text)" }}
          >
            MuseAi <span style={{ color: "var(--accent)" }}>Social</span>
          </button>
          <NavButton
            label="Posts"
            active={view.kind === "feed" || view.kind === "post"}
            onClick={() => goFeed()}
          />
          <NavButton
            label="Topics"
            active={view.kind === "topics"}
            onClick={() => setView({ kind: "topics" })}
          />
          <NavButton
            label="Community"
            active={view.kind === "community"}
            onClick={() => setView({ kind: "community" })}
          />
          <NavButton
            label="Support"
            active={view.kind === "support"}
            onClick={() => setView({ kind: "support" })}
          />
          <button
            type="button"
            onClick={() => setView({ kind: "new" })}
            className="ml-auto rounded-full px-4 py-1.5 text-sm font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            + New post
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        {view.kind === "feed" && (
          <FeedView
            feed={feed.data}
            isPending={feed.isPending}
            isError={feed.isError}
            topic={topic}
            subject={subject}
            query={query}
            savedOnly={savedOnly}
            onTopic={setTopic}
            onSubject={setSubject}
            onQuery={setQuery}
            onSavedOnly={setSavedOnly}
            onOpen={(slug) => setView({ kind: "post", slug })}
            onVote={(slug) => voteMutation.mutate(slug)}
            onSave={(slug) => saveMutation.mutate(slug)}
            onFollow={(t) => followMutation.mutate(t)}
            onNew={() => setView({ kind: "new" })}
          />
        )}
        {view.kind === "post" && (
          <PostView
            slug={view.slug}
            voterKey={key}
            feed={feed.data}
            onBack={() => setView({ kind: "feed" })}
            onVote={(slug) => voteMutation.mutate(slug)}
            onSave={(slug) => saveMutation.mutate(slug)}
            onTopic={(t) => goFeed({ topic: t })}
            onSubject={(s) => goFeed({ subject: s })}
          />
        )}
        {view.kind === "new" && (
          <NewPostView
            feed={feed.data}
            onPublished={(slug) => setView({ kind: "post", slug })}
            onCancel={() => setView({ kind: "feed" })}
          />
        )}
        {view.kind === "topics" && (
          <TopicsView
            feed={feed.data}
            onOpen={(t) => goFeed({ topic: t })}
            onFollow={(t) => followMutation.mutate(t)}
          />
        )}
        {view.kind === "community" && (
          <CommunityView onThanks={() => setView({ kind: "thanks" })} />
        )}
        {view.kind === "support" && <SupportView />}
        {view.kind === "thanks" && (
          <ThanksView onHome={() => goFeed()} />
        )}
      </main>
    </div>
  );
}

function NavButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="rounded-full px-3 py-1.5 text-sm font-semibold"
      style={{
        color: active ? "#fff" : "var(--dim)",
        background: active ? "var(--surface)" : "transparent",
        border: `1px solid ${active ? "var(--border)" : "transparent"}`,
      }}
    >
      {label}
    </button>
  );
}

function Chip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full px-3 py-1.5 text-sm font-semibold"
      style={{
        border: `1px solid ${active ? (color ?? "var(--accent)") : "var(--border)"}`,
        background: active ? (color ?? "var(--accent)") : "var(--surface)",
        color: active ? "#0e0e14" : "var(--text)",
      }}
    >
      {label}
    </button>
  );
}

function FeedView(props: {
  feed: Feed | undefined;
  isPending: boolean;
  isError: boolean;
  topic: string | undefined;
  subject: string | undefined;
  query: string;
  savedOnly: boolean;
  onTopic: (t: string | undefined) => void;
  onSubject: (s: string | undefined) => void;
  onQuery: (q: string) => void;
  onSavedOnly: (v: boolean) => void;
  onOpen: (slug: string) => void;
  onVote: (slug: string) => void;
  onSave: (slug: string) => void;
  onFollow: (t: string) => void;
  onNew: () => void;
}) {
  const { feed } = props;
  const activeTopic = props.topic ? topicOf(feed, props.topic) : undefined;
  return (
    <div>
      {/* Hero */}
      <section className="pt-6">
        <img
          src={heroImg}
          alt="MuseAi Social mascot artwork: the community crew around a pair of smart glasses"
          className="w-full rounded-2xl border object-cover"
          style={{ borderColor: "var(--border)", maxHeight: 300 }}
        />
        <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
          Learn and build with Muse AI on{" "}
          <span style={{ color: "var(--accent)" }}>Meta glasses</span>
        </h1>
        <p
          className="mt-2 max-w-2xl text-base"
          style={{ color: "var(--dim)" }}
        >
          Posts about Muse AI with Meta glasses, the Meta AI app, and Meta
          integrations: what was learned, what was built, questions answered,
          and finished work shown.
        </p>
      </section>

      {/* Search + filters */}
      <section className="mt-6" aria-label="Find posts">
        <label className="block">
          <span className="sr-only">Search posts</span>
          <input
            type="search"
            value={props.query}
            onChange={(e) => props.onQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-xl border px-4 py-2.5 text-base"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
          <Chip
            label="All topics"
            active={!props.topic}
            onClick={() => props.onTopic(undefined)}
          />
          {feed?.topics.map((t) => (
            <Chip
              key={t.key}
              label={t.name}
              color={t.color}
              active={props.topic === t.key}
              onClick={() => props.onTopic(t.key)}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filter by subject">
          <Chip
            label="All subjects"
            active={!props.subject}
            onClick={() => props.onSubject(undefined)}
          />
          {feed?.subjects.map((s) => (
            <Chip
              key={s.key}
              label={s.name}
              color={s.color}
              active={props.subject === s.key}
              onClick={() => props.onSubject(s.key)}
            />
          ))}
          <Chip
            label="Saved"
            active={props.savedOnly}
            onClick={() => props.onSavedOnly(!props.savedOnly)}
          />
        </div>
        {activeTopic && (
          <div
            className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border p-3"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--dim)" }}>
              <strong style={{ color: activeTopic.color }}>
                {activeTopic.name}:
              </strong>{" "}
              {activeTopic.desc}
            </p>
            <button
              type="button"
              onClick={() => props.onFollow(activeTopic.key)}
              className="ml-auto rounded-full px-3 py-1 text-sm font-bold"
              style={{
                background: feed?.followedTopics.includes(activeTopic.key)
                  ? "var(--border)"
                  : activeTopic.color,
                color: feed?.followedTopics.includes(activeTopic.key)
                  ? "var(--text)"
                  : "#0e0e14",
              }}
            >
              {feed?.followedTopics.includes(activeTopic.key)
                ? "Following"
                : "Follow topic"}
            </button>
          </div>
        )}
      </section>

      {/* Posts */}
      <section className="mt-6" aria-label="Posts">
        {props.isPending && (
          <p style={{ color: "var(--dim)" }}>Loading posts...</p>
        )}
        {props.isError && (
          <p style={{ color: "var(--accent-pink)" }}>
            The posts could not be loaded. Check your connection and try
            again.
          </p>
        )}
        {feed && feed.posts.length === 0 && (
          <div
            className="rounded-xl border p-6 text-center"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <p className="font-display text-lg font-bold">No posts here yet</p>
            <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>
              {props.savedOnly
                ? "Nothing saved yet. Tap Save on any post and it lands here."
                : "Nothing matches that filter yet. Be the first to post it."}
            </p>
            <button
              type="button"
              onClick={props.onNew}
              className="mt-4 rounded-full px-4 py-2 text-sm font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              Write the first post
            </button>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {feed?.posts.map((post) => (
            <PostCard
              key={post.slug}
              post={post}
              feed={feed}
              onOpen={() => props.onOpen(post.slug)}
              onVote={() => props.onVote(post.slug)}
              onSave={() => props.onSave(post.slug)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function PostCard({
  post,
  feed,
  onOpen,
  onVote,
  onSave,
}: {
  post: PostSummary;
  feed: Feed;
  onOpen: () => void;
  onVote: () => void;
  onSave: () => void;
}) {
  const topic = topicOf(feed, post.topic);
  const subject = subjectOf(feed, post.subject);
  const art = SUBJECT_ART[post.subject] ?? heroImg;
  return (
    <article
      className="flex flex-col overflow-hidden rounded-2xl border"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <img
        src={art}
        alt=""
        className="h-32 w-full object-cover"
        loading="lazy"
      />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span
            className="rounded-full px-2 py-0.5"
            style={{ background: topic?.color ?? "var(--border)", color: "#0e0e14" }}
          >
            {topic?.name ?? post.topic}
          </span>
          <span style={{ color: subject?.color ?? "var(--dim)" }}>
            {subject?.name ?? post.subject}
          </span>
          <span className="ml-auto font-normal" style={{ color: "var(--dim)" }}>
            {formatDate(post.date)} · {post.readMinutes} min read
          </span>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="mt-2 text-left"
          aria-label={`Read post: ${post.title}`}
        >
          <h2 className="font-display text-lg font-bold leading-snug">
            {post.title}
          </h2>
        </button>
        <p className="mt-1 flex-1 text-sm" style={{ color: "var(--dim)" }}>
          {post.excerpt}
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span style={{ color: "var(--dim)" }}>by {post.author}</span>
          <span className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onVote}
              aria-pressed={post.voted}
              aria-label={`${post.voted ? "Remove vote from" : "Vote for"} "${post.title}"`}
              className="rounded-full px-3 py-1 font-bold"
              style={{
                background: post.voted ? "var(--accent)" : "var(--space-surface-alt)",
                color: post.voted ? "#fff" : "var(--text)",
                border: "1px solid var(--border)",
              }}
            >
              ▲ {post.votes}
            </button>
            <button
              type="button"
              onClick={onOpen}
              aria-label={`Open "${post.title}" with ${post.commentCount} comments`}
              className="rounded-full px-3 py-1 font-semibold"
              style={{
                background: "var(--space-surface-alt)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              💬 {post.commentCount}
            </button>
            <button
              type="button"
              onClick={onSave}
              aria-pressed={post.saved}
              aria-label={`${post.saved ? "Unsave" : "Save"} "${post.title}"`}
              className="rounded-full px-3 py-1 font-semibold"
              style={{
                background: post.saved ? "var(--accent-pink)" : "var(--space-surface-alt)",
                color: post.saved ? "#0e0e14" : "var(--text)",
                border: "1px solid var(--border)",
              }}
            >
              {post.saved ? "Saved" : "Save"}
            </button>
          </span>
        </div>
      </div>
    </article>
  );
}

function PostView(props: {
  slug: string;
  voterKey: string;
  feed: Feed | undefined;
  onBack: () => void;
  onVote: (slug: string) => void;
  onSave: (slug: string) => void;
  onTopic: (t: string) => void;
  onSubject: (s: string) => void;
}) {
  const queryClient = useQueryClient();
  const [author, setAuthor] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [formError, setFormError] = useState("");

  const post = useQuery({
    queryKey: ["post", props.slug, props.voterKey],
    queryFn: () =>
      api.getPost({ slug: props.slug, voterKey: props.voterKey }),
  });

  const commentMutation = useMutation({
    mutationFn: async () =>
      await api.addComment({
        slug: props.slug,
        author: author.trim(),
        body: commentBody.trim(),
      }),
    onSuccess: () => {
      setCommentBody("");
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e) => setFormError(e.message),
  });

  const submitComment = (e: FormEvent) => {
    e.preventDefault();
    if (!author.trim()) {
      setFormError("Add your name so people know who is replying.");
      return;
    }
    if (!commentBody.trim()) {
      setFormError("Write the reply first.");
      return;
    }
    commentMutation.mutate();
  };

  if (post.isPending) {
    return <p className="pt-8" style={{ color: "var(--dim)" }}>Loading post...</p>;
  }
  if (post.isError || !post.data) {
    return (
      <div className="pt-8">
        <p style={{ color: "var(--accent-pink)" }}>
          That post could not be loaded.
        </p>
        <button
          type="button"
          onClick={props.onBack}
          className="mt-3 rounded-full px-4 py-2 text-sm font-bold"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          Back to posts
        </button>
      </div>
    );
  }

  const data: PostDetail = post.data;
  const p = data.post;
  const topic = topicOf(props.feed, p.topic);
  const subject = subjectOf(props.feed, p.subject);
  const art = SUBJECT_ART[p.subject] ?? heroImg;

  return (
    <article className="pt-6">
      <button
        type="button"
        onClick={props.onBack}
        className="rounded-full px-3 py-1.5 text-sm font-semibold"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        ← All posts
      </button>
      <img
        src={art}
        alt=""
        className="mt-4 w-full rounded-2xl border object-cover"
        style={{ borderColor: "var(--border)", maxHeight: 260 }}
      />
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => props.onTopic(p.topic)}
          className="rounded-full px-2 py-0.5"
          style={{ background: topic?.color ?? "var(--border)", color: "#0e0e14" }}
          aria-label={`See all ${topic?.name ?? p.topic} posts`}
        >
          {topic?.name ?? p.topic}
        </button>
        <button
          type="button"
          onClick={() => props.onSubject(p.subject)}
          style={{ color: subject?.color ?? "var(--dim)" }}
          aria-label={`See all ${subject?.name ?? p.subject} posts`}
        >
          {subject?.name ?? p.subject}
        </button>
        <span className="font-normal" style={{ color: "var(--dim)" }}>
          {formatDate(p.date)} · {p.readMinutes} min read · by {p.author}
        </span>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight">{p.title}</h1>
      <div className="mt-4 space-y-4 text-base leading-relaxed">
        {p.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => props.onVote(p.slug)}
          aria-pressed={p.voted}
          className="rounded-full px-4 py-2 font-bold"
          style={{
            background: p.voted ? "var(--accent)" : "var(--surface)",
            color: p.voted ? "#fff" : "var(--text)",
            border: "1px solid var(--border)",
          }}
        >
          ▲ {p.votes} votes
        </button>
        <button
          type="button"
          onClick={() => props.onSave(p.slug)}
          aria-pressed={p.saved}
          className="rounded-full px-4 py-2 font-semibold"
          style={{
            background: p.saved ? "var(--accent-pink)" : "var(--surface)",
            color: p.saved ? "#0e0e14" : "var(--text)",
            border: "1px solid var(--border)",
          }}
        >
          {p.saved ? "Saved" : "Save post"}
        </button>
      </div>

      <section className="mt-10" aria-label="Comments">
        <h2 className="font-display text-xl font-bold">
          Replies ({data.comments.length})
        </h2>
        <div className="mt-3 space-y-3">
          {data.comments.length === 0 && (
            <p className="text-sm" style={{ color: "var(--dim)" }}>
              No replies yet. Start the thread.
            </p>
          )}
          {data.comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border p-3"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <p className="text-sm font-bold">
                {c.author}{" "}
                <span className="font-normal" style={{ color: "var(--dim)" }}>
                  · {formatDate(c.date)}
                </span>
              </p>
              <p className="mt-1 text-sm">{c.body}</p>
            </div>
          ))}
        </div>
        <form onSubmit={submitComment} className="mt-5 space-y-3">
          <h3 className="font-display text-base font-bold">Add a reply</h3>
          <label className="block">
            <span className="text-sm font-semibold">Your name</span>
            <input
              {...FIELDS.addComment.author}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Git-FED"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Reply</span>
            <textarea
              {...FIELDS.addComment.body}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={3}
              placeholder="Working answers, not guesses."
              className="mt-1 w-full rounded-xl border px-3 py-2"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </label>
          {formError && (
            <p className="text-sm" style={{ color: "var(--accent-pink)" }} role="alert">
              {formError}
            </p>
          )}
          <button
            type="submit"
            disabled={commentMutation.isPending}
            className="rounded-full px-5 py-2 font-bold text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {commentMutation.isPending ? "Posting..." : "Post reply"}
          </button>
        </form>
      </section>
    </article>
  );
}

function NewPostView(props: {
  feed: Feed | undefined;
  onPublished: (slug: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [topicKey, setTopicKey] = useState("learn");
  const [subjectKey, setSubjectKey] = useState("meta-glasses");
  const [author, setAuthor] = useState("Git-FED");
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState("");

  const publish = useMutation({
    mutationFn: async () =>
      await api.createPost({
        title: title.trim(),
        topic: topicKey as Parameters<typeof api.createPost>[0]["topic"],
        subject: subjectKey as Parameters<typeof api.createPost>[0]["subject"],
        author: author.trim(),
        body: body.trim(),
      }),
    onSuccess: (res) => props.onPublished(res.slug),
    onError: (e) => setFormError(e.message),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Give the post a title.");
      return;
    }
    if (!author.trim()) {
      setFormError("Add your name as the author.");
      return;
    }
    if (!body.trim()) {
      setFormError("Write the post first. Blank lines split paragraphs.");
      return;
    }
    setFormError("");
    publish.mutate();
  };

  const inputStyle = {
    background: "var(--surface)",
    borderColor: "var(--border)",
    color: "var(--text)",
  } as const;

  return (
    <section className="pt-6">
      <img
        src={buildImg}
        alt="Mascot artwork of the maker lab, where builds get written up"
        className="w-full rounded-2xl border object-cover"
        style={{ borderColor: "var(--border)", maxHeight: 200 }}
      />
      <h1 className="mt-5 text-3xl font-extrabold">New post</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>
        Publishing saves it to the MuseAi Social backend. It lands in the
        feed right away.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">Title</span>
          <input
            {...FIELDS.createPost.title}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What did you learn or build?"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            style={inputStyle}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Topic</span>
            <select
              value={topicKey}
              onChange={(e) => setTopicKey(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              style={inputStyle}
              aria-label="Topic"
            >
              {props.feed?.topics.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Subject</span>
            <select
              value={subjectKey}
              onChange={(e) => setSubjectKey(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              style={inputStyle}
              aria-label="Subject"
            >
              {props.feed?.subjects.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-semibold">Author</span>
          <input
            {...FIELDS.createPost.author}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            style={inputStyle}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Post</span>
          <textarea
            {...FIELDS.createPost.body}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={9}
            placeholder={"First paragraph is the summary shown in the feed.\n\nLeave a blank line between paragraphs."}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            style={inputStyle}
          />
        </label>
        {formError && (
          <p className="text-sm" style={{ color: "var(--accent-pink)" }} role="alert">
            {formError}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={publish.isPending}
            className="rounded-full px-5 py-2 font-bold text-white disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {publish.isPending ? "Publishing..." : "Publish post"}
          </button>
          <button
            type="button"
            onClick={props.onCancel}
            className="rounded-full px-5 py-2 font-semibold"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

function TopicsView(props: {
  feed: Feed | undefined;
  onOpen: (topic: string) => void;
  onFollow: (topic: string) => void;
}) {
  const { feed } = props;
  return (
    <section className="pt-6">
      <h1 className="text-3xl font-extrabold">Topics and subjects</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>
        Every post sits in one topic and one subject. Follow a topic to mark
        it as yours.
      </p>
      <h2 className="font-display mt-6 text-xl font-bold">Topics</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {feed?.topics.map((t) => {
          const count = feed.posts.filter((p) => p.topic === t.key).length;
          const followed = feed.followedTopics.includes(t.key);
          return (
            <div
              key={t.key}
              className="rounded-2xl border p-4"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-sm font-bold"
                  style={{ background: t.color, color: "#0e0e14" }}
                >
                  {t.name}
                </span>
                <span className="text-sm" style={{ color: "var(--dim)" }}>
                  {count} posts
                </span>
                <button
                  type="button"
                  onClick={() => props.onFollow(t.key)}
                  aria-pressed={followed}
                  className="ml-auto rounded-full px-3 py-1 text-sm font-bold"
                  style={{
                    background: followed ? "var(--border)" : t.color,
                    color: followed ? "var(--text)" : "#0e0e14",
                  }}
                >
                  {followed ? "Following" : "Follow"}
                </button>
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--dim)" }}>
                {t.desc}
              </p>
              <button
                type="button"
                onClick={() => props.onOpen(t.key)}
                className="mt-3 text-sm font-bold"
                style={{ color: "var(--accent)" }}
                aria-label={`Read ${t.name} posts`}
              >
                Read {t.name} posts →
              </button>
            </div>
          );
        })}
      </div>
      <h2 className="font-display mt-8 text-xl font-bold">Subjects</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {feed?.subjects.map((s) => (
          <div
            key={s.key}
            className="overflow-hidden rounded-2xl border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <img
              src={SUBJECT_ART[s.key] ?? heroImg}
              alt=""
              className="h-24 w-full object-cover"
              loading="lazy"
            />
            <div className="p-4">
              <p className="font-display font-bold" style={{ color: s.color }}>
                {s.name}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CommunityView(props: { onThanks: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  const rooms = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.listRooms({}),
  });

  const create = useMutation({
    mutationFn: async () =>
      await api.createRoom({ name: name.trim(), description: description.trim() }),
    onSuccess: () => {
      setName("");
      setDescription("");
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (e) => setFormError(e.message),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Give the room a name.");
      return;
    }
    create.mutate();
  };

  const inputStyle = {
    background: "var(--surface)",
    borderColor: "var(--border)",
    color: "var(--text)",
  } as const;

  return (
    <section className="pt-6">
      <img
        src={communityImg}
        alt="Mascot artwork of the MuseAi Social community hanging out together"
        className="w-full rounded-2xl border object-cover"
        style={{ borderColor: "var(--border)", maxHeight: 240 }}
      />
      <h1 className="mt-5 text-3xl font-extrabold">Community</h1>
      <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--dim)" }}>
        The live chat hangs out on Discord. Rooms here are the topics the
        community organizes around: create one and it is saved to the
        backend.
      </p>

      <div
        className="mt-5 overflow-hidden rounded-2xl border"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <iframe
          src={DISCORD_WIDGET}
          title="MuseAi Social Discord server widget"
          width="100%"
          height="420"
          sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
          style={{ border: 0, display: "block" }}
        />
      </div>

      <h2 className="font-display mt-8 text-xl font-bold">Rooms</h2>
      {rooms.isPending && (
        <p className="mt-2 text-sm" style={{ color: "var(--dim)" }}>Loading rooms...</p>
      )}
      {rooms.data && rooms.data.rooms.length === 0 && (
        <p className="mt-2 text-sm" style={{ color: "var(--dim)" }}>
          No rooms yet. Create the first one below.
        </p>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {rooms.data?.rooms.map((room) => (
          <div
            key={room.id}
            className="rounded-2xl border p-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <p className="font-display font-bold">{room.name}</p>
            {room.description && (
              <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>
                {room.description}
              </p>
            )}
            <p className="mt-2 text-xs" style={{ color: "var(--dim)" }}>
              Created {new Date(room.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <h3 className="font-display text-base font-bold">Create a room</h3>
        <label className="block">
          <span className="text-sm font-semibold">Room name</span>
          <input
            {...FIELDS.createRoom.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Glasses setups"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            style={inputStyle}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">What it is for</span>
          <input
            {...FIELDS.createRoom.description}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Desk setups, carry kits, and what actually works"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            style={inputStyle}
          />
        </label>
        {formError && (
          <p className="text-sm" style={{ color: "var(--accent-pink)" }} role="alert">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-full px-5 py-2 font-bold text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {create.isPending ? "Creating..." : "Create room"}
        </button>
      </form>

      <p className="mt-10 text-sm" style={{ color: "var(--dim)" }}>
        Said thanks where it counts?{" "}
        <button
          type="button"
          onClick={props.onThanks}
          className="font-bold"
          style={{ color: "var(--accent)" }}
        >
          Open the thank-you page
        </button>
      </p>
    </section>
  );
}

function SupportView() {
  const [confirmed, setConfirmed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [gateError, setGateError] = useState("");

  const submitGate = (e: FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      setGateError("Check the box to confirm you are 18 or older first.");
      return;
    }
    setGateError("");
    setRevealed(true);
  };

  return (
    <section className="pt-6">
      <img
        src={supportImg}
        alt="Mascot artwork for the support page"
        className="w-full rounded-2xl border object-cover"
        style={{ borderColor: "var(--border)", maxHeight: 220 }}
      />
      <h1 className="mt-5 text-3xl font-extrabold">Support MuseAi Social</h1>
      <p className="mt-1 max-w-2xl text-sm" style={{ color: "var(--dim)" }}>
        Support keeps the hub running. Every option below is handled by the
        provider on their own page: no payment details are collected here.
        PayPal and Stripe options also live on the providers' own checkout
        pages.
      </p>

      {!revealed ? (
        <form
          onSubmit={submitGate}
          className="mt-6 rounded-2xl border p-5"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h2 className="font-display text-lg font-bold">Age check</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>
            Some support options are for adults. Confirm before the provider
            list opens.
          </p>
          <label className="mt-4 flex min-h-11 items-center gap-3 text-base">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="h-5 w-5"
            />
            I confirm I am 18 years old or older.
          </label>
          {gateError && (
            <p className="mt-2 text-sm" style={{ color: "var(--accent-pink)" }} role="alert">
              {gateError}
            </p>
          )}
          <button
            type="submit"
            className="mt-4 rounded-full px-5 py-2 font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            Show support options
          </button>
        </form>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {SUPPORT_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border p-4"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <p className="font-display font-bold" style={{ color: "var(--accent-pink)" }}>
                {link.name}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--dim)" }}>
                {link.desc}
              </p>
              <p className="mt-2 text-sm font-bold" style={{ color: "var(--accent)" }}>
                Open →
              </p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function ThanksView(props: { onHome: () => void }) {
  return (
    <section className="pt-10 text-center">
      <img
        src={avatarImg}
        alt="Git-FED's avatar"
        className="mx-auto h-28 w-28 rounded-full border object-cover"
        style={{ borderColor: "var(--border)" }}
      />
      <h1 className="mt-5 text-3xl font-extrabold">Thank you</h1>
      <p
        className="mx-auto mt-2 max-w-md text-base"
        style={{ color: "var(--dim)" }}
      >
        Thanks for backing MuseAi Social. Support keeps the posts, the
        rooms, and the experiments coming.
      </p>
      <button
        type="button"
        onClick={props.onHome}
        className="mt-6 rounded-full px-5 py-2 font-bold text-white"
        style={{ background: "var(--accent)" }}
      >
        Back to the posts
      </button>
    </section>
  );
}
