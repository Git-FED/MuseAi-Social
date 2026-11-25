import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actionFields } from "@hatch/space-sdk/fields" with { type: "macro" };
import { api, type ApiResponse } from "./api";
import type { Actions } from "../../server/src/actions";
import { ServersView } from "./ServersView";
import { FaqView, WikiView } from "./FaqWiki";

import postNewsImg from "./assets/post-news.webp";
import postHeyMetaImg from "./assets/post-hey-meta.webp";
import postHeadsetImg from "./assets/post-headset.webp";
import postWayfarerImg from "./assets/post-wayfarer.webp";
import postPhotosImg from "./assets/post-photos.webp";
import postDriveFlowImg from "./assets/post-drive-flow.webp";
import postWhatsappImg from "./assets/post-whatsapp.webp";
import postNeuralBandImg from "./assets/post-neural-band.webp";
import postQuestImg from "./assets/post-quest.webp";
import postOakleyImg from "./assets/post-oakley.webp";

import heroArt from "./assets/promo-hero.webp";
import mishapArt from "./assets/promo-glasses-mishap.webp";
import buildLabArt from "./assets/promo-build-lab.webp";
import communityArt from "./assets/promo-community.webp";
import supportArt from "./assets/promo-support.webp";
import loopGif from "./assets/promo-loop.gif";
import avatarImg from "./assets/gitfed-avatar.webp";
import fedSymbol from "./assets/fed-symbol.svg";

const FIELDS = actionFields<typeof Actions>();

type Feed = ApiResponse<typeof api, "getFeed">;
type Post = Feed["posts"][number];
type Profile = { userId: string; username: string; isOwner: boolean };

/* Delete rules: admin (username "admin", case-insensitive) can delete any
   post or reply. Everyone else can only delete posts and replies that carry
   their own username and their own account id. */
const DELETE_RULES_LINE =
  "Only admin can delete any post. You can only delete posts with your username on them.";

function isAdminProfile(p: Profile | null): boolean {
  return !!p && p.username.trim().toLowerCase() === "admin";
}

function DeleteRulesBox() {
  return (
    <div
      className="rounded-[var(--radius)] border border-[#fb7185]/40 bg-[#fb7185]/10 p-4"
      role="note"
      aria-label="Delete rules"
    >
      <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-[#fb7185]">
        Delete rules
      </h2>
      <p className="mt-1 text-sm font-semibold text-[var(--text)]">
        {DELETE_RULES_LINE}
      </p>
      <p className="mt-1 text-sm text-[var(--dim)]">
        The same rule covers replies: admin can delete any reply, and everyone
        else can only delete replies with their own username on them. The
        username admin belongs to one account only.
      </p>
    </div>
  );
}

function canDeleteItem(
  session: SbSession | null,
  profile: Profile | null,
  authorId: string | null,
  authorUsername: string | null,
): boolean {
  if (!session || !profile) return false;
  if (isAdminProfile(profile)) return true;
  return (
    !!authorId &&
    authorId === session.userId &&
    !!authorUsername &&
    authorUsername.toLowerCase() === profile.username.toLowerCase()
  );
}

/* Generated cover images for the starter posts, keyed by the image_asset
   value the backend stores on each post. Embedded build assets, no hotlinks. */
const POST_IMAGES: Record<string, string> = {
  "post-news": postNewsImg,
  "post-hey-meta": postHeyMetaImg,
  "post-headset": postHeadsetImg,
  "post-wayfarer": postWayfarerImg,
  "post-photos": postPhotosImg,
  "post-drive-flow": postDriveFlowImg,
  "post-whatsapp": postWhatsappImg,
  "post-neural-band": postNeuralBandImg,
  "post-quest": postQuestImg,
  "post-oakley": postOakleyImg,
};

type Attachment = Post["attachments"][number];
type PendingUpload = {
  name: string;
  mime: string;
  dataBase64: string;
  size: number;
  kind: "image" | "file";
  previewUrl: string | null;
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];
const FILE_EXTS = ["pdf", "txt", "md", "zip"];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = typeof reader.result === "string" ? reader.result : "";
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/* Renders the stored attachments of a post or reply: images inline, files
   as download links with name and size. */
function AttachmentList({
  attachments,
  large = false,
}: {
  attachments: Attachment[];
  large?: boolean;
}) {
  if (attachments.length === 0) return null;
  const images = attachments.filter((a) => a.kind === "image");
  const files = attachments.filter((a) => a.kind !== "image");
  return (
    <div className="mt-3 grid gap-2">
      {images.map((a) => (
        <img
          key={a.id}
          src={a.url}
          alt={a.name}
          loading="lazy"
          className={`w-full rounded-xl border border-[var(--border)] object-cover ${
            large ? "max-h-[26rem]" : "max-h-64"
          }`}
        />
      ))}
      {files.map((a) => (
        <a
          key={a.id}
          href={a.url}
          download={a.name}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[#12121c] px-3.5 py-2.5 text-sm font-semibold text-[#b7a6ff]"
          aria-label={`Download ${a.name} (${formatBytes(a.size)})`}
        >
          <span aria-hidden="true">📎</span>
          <span className="truncate">{a.name}</span>
          <span className="ml-auto shrink-0 text-xs text-[var(--faint)]">
            {formatBytes(a.size)} · Download
          </span>
        </a>
      ))}
    </div>
  );
}

/* Add image / Add file picker with preview and remove, used by the New post
   form and the reply form. */
function AttachmentPicker({
  pending,
  onChange,
  idPrefix,
}: {
  pending: PendingUpload[];
  onChange: (next: PendingUpload[]) => void;
  idPrefix: string;
}) {
  const [pickError, setPickError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (list: FileList | null, kind: "image" | "file") => {
    if (!list || list.length === 0) return;
    setPickError("");
    const next = [...pending];
    for (const f of Array.from(list)) {
      const ext = (f.name.split(".").pop() ?? "").toLowerCase();
      const allowed = kind === "image" ? IMAGE_EXTS : FILE_EXTS;
      if (!allowed.includes(ext)) {
        setPickError(
          kind === "image"
            ? `"${f.name}" is not an image we take. Images: jpg, png, gif, webp.`
            : `"${f.name}" is not a file type we take. Files: pdf, txt, md, zip.`,
        );
        continue;
      }
      if (f.size > MAX_UPLOAD_BYTES) {
        setPickError(`"${f.name}" is over the 10 MB per-file limit.`);
        continue;
      }
      if (next.length >= 6) {
        setPickError("At most 6 attachments per post or reply.");
        break;
      }
      try {
        const dataBase64 = await fileToBase64(f);
        next.push({
          name: f.name,
          mime:
            f.type ||
            ({
              jpg: "image/jpeg",
              jpeg: "image/jpeg",
              png: "image/png",
              gif: "image/gif",
              webp: "image/webp",
              pdf: "application/pdf",
              txt: "text/plain",
              md: "text/markdown",
              zip: "application/zip",
            } as Record<string, string>)[ext] ||
            "application/octet-stream",
          dataBase64,
          size: f.size,
          kind,
          previewUrl: kind === "image" ? URL.createObjectURL(f) : null,
        });
      } catch {
        setPickError(`"${f.name}" could not be read. Try again.`);
      }
    }
    onChange(next);
  };

  const removeAt = (i: number) => {
    const item = pending[i];
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    onChange(pending.filter((_, j) => j !== i));
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          aria-label="Add image"
          className="rounded-full bg-[#26263a] px-4 py-2 text-sm font-bold"
        >
          🖼 Add image
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Add file"
          className="rounded-full bg-[#26263a] px-4 py-2 text-sm font-bold"
        >
          📎 Add file
        </button>
        <span className="self-center text-xs text-[var(--faint)]">
          Images jpg, png, gif, webp · Files pdf, txt, md, zip · 10 MB max each
        </span>
      </div>
      <input
        ref={imageInputRef}
        id={`${idPrefix}-image-input`}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        aria-label="Choose image files"
        onChange={(e) => {
          void addFiles(e.target.files, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        id={`${idPrefix}-file-input`}
        type="file"
        accept=".pdf,.txt,.md,.zip,application/pdf,text/plain,text/markdown,application/zip"
        multiple
        className="hidden"
        aria-label="Choose files to attach"
        onChange={(e) => {
          void addFiles(e.target.files, "file");
          e.target.value = "";
        }}
      />
      {pickError && (
        <p role="alert" className="text-sm font-semibold text-[#fb7185]">
          {pickError}
        </p>
      )}
      {pending.length > 0 && (
        <ul className="grid gap-2" aria-label="Attachments to upload">
          {pending.map((u, i) => (
            <li
              key={`${u.name}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[#12121c] p-2.5"
            >
              {u.kind === "image" && u.previewUrl ? (
                <img
                  src={u.previewUrl}
                  alt={`Preview of ${u.name}`}
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span aria-hidden="true" className="px-2 text-lg">📎</span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{u.name}</span>
                <span className="block text-xs text-[var(--faint)]">{formatBytes(u.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remove ${u.name}`}
                className="ml-auto shrink-0 rounded-full bg-[#26263a] px-3 py-1.5 text-xs font-bold text-[#fb7185]"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type View =
  | { name: "board" }
  | { name: "article"; slug: string }
  | { name: "new" }
  | { name: "servers" }
  | { name: "community" }
  | { name: "support" }
  | { name: "thanks" }
  | { name: "faq" }
  | { name: "wiki"; page: string };

/* ---------------- Supabase auth (direct browser calls, publishable key) ---------------- */

const SB_URL = "https://qyuczfpgydgqywgthgrz.supabase.co";
const SB_KEY = "sb_publishable_2NLEuDREplLS9DgUXeA8Tw_f8MJOhCq";
const SB_STORAGE_KEY = "museai-sb-session";
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

type SbSession = { access_token: string; userId: string };

function loadSession(): SbSession | null {
  try {
    const raw =
      localStorage.getItem(SB_STORAGE_KEY) ?? sessionStorage.getItem(SB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SbSession>;
    if (
      typeof parsed.access_token === "string" &&
      parsed.access_token &&
      typeof parsed.userId === "string" &&
      parsed.userId
    ) {
      return { access_token: parsed.access_token, userId: parsed.userId };
    }
    return null;
  } catch {
    return null;
  }
}

function storeSession(session: SbSession | null, remember: boolean) {
  try {
    localStorage.removeItem(SB_STORAGE_KEY);
    sessionStorage.removeItem(SB_STORAGE_KEY);
    if (session) {
      (remember ? localStorage : sessionStorage).setItem(
        SB_STORAGE_KEY,
        JSON.stringify(session),
      );
    }
  } catch {
    /* storage unavailable; session lives for this view only */
  }
}

async function sbAuth(
  path: string,
  body: Record<string, unknown>,
): Promise<{
  session: SbSession | null;
  error: string | null;
  sent?: boolean;
  metadataUsername: string | null;
}> {
  try {
    const res = await fetch(`${SB_URL}/auth/v1/${path}`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok) {
      const msg =
        (data?.["error_description"] as string) ||
        (data?.["msg"] as string) ||
        (data?.["message"] as string) ||
        "Sign-in failed. Check the email and password and try again.";
      return { session: null, error: msg, metadataUsername: null };
    }
    if (path === "recover") return { session: null, error: null, sent: true, metadataUsername: null };
    const token = data?.["access_token"] as string | undefined;
    const user = data?.["user"] as
      | { id?: string; user_metadata?: { username?: unknown } }
      | undefined;
    const metaName =
      typeof user?.user_metadata?.username === "string"
        ? user.user_metadata.username
        : null;
    if (token && user?.id) {
      return {
        session: { access_token: token, userId: user.id },
        error: null,
        metadataUsername: metaName,
      };
    }
    // Signup with autoconfirm off on some projects returns a user but no session.
    return {
      session: null,
      error: null,
      sent: true,
      metadataUsername: metaName,
    };
  } catch {
    return {
      session: null,
      error: "Could not reach the sign-in service. Check your connection.",
      metadataUsername: null,
    };
  }
}

async function sbUpdateUsername(accessToken: string, username: string): Promise<void> {
  try {
    await fetch(`${SB_URL}/auth/v1/user`, {
      method: "PUT",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: { username } }),
    });
  } catch {
    /* best effort: the board profile is the source of truth for display */
  }
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}

/* ---------------- small local-state hook ---------------- */

function useLocalSet(key: string): [Set<string>, (v: string) => void] {
  const [set, setSet] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(key) ?? "[]") as string[]);
    } catch {
      return new Set();
    }
  });
  const toggle = (v: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      try {
        localStorage.setItem(key, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  return [set, toggle];
}

/* ---------------- App ---------------- */

export function App() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>({ name: "board" });
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [session, setSession] = useState<SbSession | null>(() => loadSession());
  const [authOpen, setAuthOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const pendingUsernameRef = useRef<string | null>(null);

  // Load (or first create) the board profile for the signed-in account. A
  // username chosen at signup rides along in pendingUsernameRef and claims
  // the profile on first sign-in. The profile whose username is admin is
  // the site admin; there is no first-account owner rule.
  useEffect(() => {
    if (!session) {
      setProfile(null);
      setProfileChecked(true);
      return;
    }
    let cancelled = false;
    setProfileChecked(false);
    (async () => {
      let p: Profile | null = null;
      try {
        p = (await api.getProfile({ userId: session.userId })).profile;
      } catch {
        p = null;
      }
      if (!p && pendingUsernameRef.current) {
        try {
          p = (
            await api.setUsername({
              userId: session.userId,
              username: pendingUsernameRef.current,
            })
          ).profile;
          pendingUsernameRef.current = null;
        } catch {
          p = null; // taken or invalid: the Set username screen takes over
        }
      }
      if (!cancelled) {
        setProfile(p);
        setProfileChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const needsUsername = !!session && profileChecked && !profile;

  const canDeletePost = (p: Post): boolean =>
    canDeleteItem(session, profile, p.authorId, p.authorUsername);

  const [saves, toggleSave] = useLocalSet("museai-saves");
  const [follows, toggleFollow] = useLocalSet("museai-follows");
  const [voted, toggleVoted] = useLocalSet("museai-voted");

  const feed = useQuery({ queryKey: ["feed"], queryFn: () => api.getFeed({}) });

  const voteMut = useMutation({
    mutationFn: async (slug: string) => await api.votePost({ slug }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const handleVote = (post: Post) => {
    if (voted.has(post.slug)) return;
    toggleVoted(post.slug);
    voteMut.mutate(post.slug);
  };

  const deletePostMut = useMutation({
    mutationFn: async (slug: string) =>
      await api.deletePost({ slug, callerId: session?.userId ?? "" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const go = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0 });
  };

  const topics = feed.data?.topics ?? [];
  const subjects = feed.data?.subjects ?? [];
  const topicByKey = useMemo(
    () => new Map(topics.map((t) => [t.key, t])),
    [topics],
  );
  const subjectByKey = useMemo(
    () => new Map(subjects.map((s) => [s.key, s])),
    [subjects],
  );

  const filteredPosts = useMemo(() => {
    const all = feed.data?.posts ?? [];
    const term = search.trim().toLowerCase();
    return all.filter((p) => {
      if (topicFilter !== "all" && p.topic !== topicFilter) return false;
      if (subjectFilter !== "all" && p.subject !== subjectFilter) return false;
      if (savedOnly && !saves.has(p.slug)) return false;
      if (!term) return true;
      const hay = `${p.title} ${p.excerpt} ${p.body.join(" ")} ${p.author}`.toLowerCase();
      return hay.includes(term);
    });
  }, [feed.data, search, topicFilter, subjectFilter, savedOnly, saves]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[#0e0e14]/95 pt-safe backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <button
            type="button"
            onClick={() => go({ name: "board" })}
            className="flex items-center gap-2"
            aria-label="MuseAi Social home"
          >
            <img src={fedSymbol} alt="" className="h-8 w-8" />
            <span className="font-display text-lg font-black tracking-tight">
              MuseAi Social
            </span>
          </button>
          <nav aria-label="Primary" className="order-3 flex w-full flex-wrap justify-center gap-1 sm:order-2 sm:w-auto sm:flex-1 sm:flex-nowrap">
            {(
              [
                ["board", "Board"],
                ["servers", "Servers"],
                ["community", "Community"],
                ["support", "Support"],
                ["thanks", "Thanks"],
                ["faq", "FAQ"],
                ["wiki", "Wiki"],
              ] as const
            ).map(([name, label]) => (
              <button
                key={name}
                type="button"
                onClick={() =>
                  name === "wiki"
                    ? go({ name: "wiki", page: "getting-started" })
                    : go({ name })
                }
                aria-current={view.name === name ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  view.name === name
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--dim)] hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="order-2 ml-auto flex items-center gap-2 sm:order-3 sm:ml-0">
            <button
              type="button"
              onClick={() => go({ name: "new" })}
              className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-bold text-white"
            >
              New post
            </button>
            {session ? (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                aria-label={
                  profile
                    ? `Signed in as ${profile.username}. Open account menu`
                    : "Signed in. Open account menu to set your username"
                }
                className="max-w-[10rem] truncate rounded-full bg-[#26263a] px-3 py-1.5 text-sm font-bold text-[#b7a6ff]"
              >
                {profile ? `@${profile.username}` : "Set username"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                aria-label="Login"
                className="rounded-full bg-[var(--pink)] px-4 py-1.5 text-sm font-bold text-white"
              >
                Login
              </button>
            )}
          </div>
        </div>
        <div className="overflow-hidden border-t border-[var(--border)] py-1" aria-hidden="true">
          <div className="ticker-track text-[11px] font-bold tracking-[0.2em] text-[var(--faint)]">
            {[0, 1].map((i) => (
              <span key={i} className="flex shrink-0 items-center">
                {["NO HYPE · JUST WHAT WORKS", "LEARN / BUILD / SHOW / SHARE", "META GLASSES · USEFUL INTEGRATIONS"].map(
                  (t) => (
                    <span key={t} className="flex items-center">
                      <span className="px-4">{t}</span>
                      <span className="text-[var(--accent)]">✳</span>
                    </span>
                  ),
                )}
              </span>
            ))}
          </div>
        </div>
      </header>

      {authOpen && (
        <AuthModal
          session={session}
          profile={profile}
          onClose={() => setAuthOpen(false)}
          onSession={(s, remember, pendingUsername) => {
            pendingUsernameRef.current = pendingUsername ?? null;
            setSession(s);
            storeSession(s, remember);
          }}
          onProfile={(p) => setProfile(p)}
          onSignOut={() => {
            setSession(null);
            setProfile(null);
            pendingUsernameRef.current = null;
            storeSession(null, false);
            setAuthOpen(false);
          }}
        />
      )}

      {needsUsername && session ? (
        <SetUsernameScreen
          session={session}
          onProfile={(p) => setProfile(p)}
          onSignOut={() => {
            setSession(null);
            setProfile(null);
            pendingUsernameRef.current = null;
            storeSession(null, false);
          }}
        />
      ) : (
      <main className="mx-auto max-w-6xl px-4 pb-16">
        {view.name === "board" && (
          <>
            {/* Hero */}
            <section className="grid items-center gap-6 py-8 md:grid-cols-2">
              <div>
                <p className="text-xs font-bold tracking-[0.25em] text-[var(--accent)]">
                  ● A PUBLIC KNOWLEDGE FIELD
                </p>
                <h1 className="font-display mt-3 text-4xl font-black leading-[1.05] sm:text-5xl">
                  Make the useful
                  <br />
                  <em className="text-[var(--pink)]">impossible to lose.</em>
                </h1>
                <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--dim)]">
                  What we learned. What we built. One focused home for Muse AI on
                  Meta glasses and the Meta things that work with it.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("feed")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="rounded-full bg-[var(--accent)] px-5 py-2.5 font-bold text-white"
                  >
                    Explore the board ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => go({ name: "community" })}
                    className="rounded-full border border-[var(--border)] px-5 py-2.5 font-bold"
                  >
                    Visit Community
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)]">
                <img
                  src={heroArt}
                  alt="The spiky-haired FED mascot rides a golden cloud while using smart glasses"
                  className="h-full w-full object-cover"
                />
              </div>
            </section>

            {/* Promo strip */}
            <section aria-label="Highlights" className="mb-10 grid gap-4 sm:grid-cols-3">
              {[
                { img: mishapArt, alt: "The furry FED mascot in smart glasses gets a surprise pigeon photobomb at sunset", tag: "LEARN / CAPTURE", text: "Even the pigeon made the field notes.", topic: "learn" },
                { img: buildLabArt, alt: "The FED mascot proudly displays a tiny home-built gadget while a robot offers a wrench", tag: "BUILD / PROTOTYPE", text: "One spoon. Three cables. A working prototype.", topic: "build" },
                { img: communityArt, alt: "The FED mascot laughs with a group of friendly gadget characters", tag: "SHOW / COMMUNITY", text: "Good notes travel better together.", topic: "show" },
              ].map((c) => (
                <button
                  key={c.tag}
                  type="button"
                  onClick={() => {
                    setTopicFilter(c.topic);
                    document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] text-left"
                  aria-label={`${c.text} Filter the feed to ${c.topic}`}
                >
                  <img src={c.img} alt={c.alt} className="aspect-[3/2] w-full object-cover" loading="lazy" />
                  <span className="block p-4">
                    <span className="text-[11px] font-bold tracking-[0.18em] text-[var(--accent)]">{c.tag}</span>
                    <strong className="mt-1 block font-display text-base">{c.text}</strong>
                  </span>
                </button>
              ))}
            </section>

            {/* Feed */}
            <section id="feed" aria-labelledby="feed-title">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 id="feed-title" className="font-display text-3xl font-black">
                  Latest field notes<span className="text-[var(--pink)]">.</span>
                </h2>
                <label className="flex min-w-[14rem] flex-1 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 sm:max-w-xs">
                  <span aria-hidden="true">⌕</span>
                  <input
                    aria-label="Search posts"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search posts…  ( / )"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--faint)]"
                  />
                </label>
              </div>

              {/* Topic filters + follows */}
              <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
                <FilterChip
                  label="All topics"
                  active={topicFilter === "all"}
                  onClick={() => setTopicFilter("all")}
                />
                {topics.map((t) => (
                  <span key={t.key} className="flex items-center gap-1">
                    <FilterChip
                      label={t.name}
                      color={t.color}
                      active={topicFilter === t.key}
                      onClick={() => setTopicFilter(topicFilter === t.key ? "all" : t.key)}
                    />
                    <button
                      type="button"
                      onClick={() => toggleFollow(t.key)}
                      aria-label={follows.has(t.key) ? `Unfollow ${t.name}` : `Follow ${t.name}`}
                      aria-pressed={follows.has(t.key)}
                      className={`rounded-full px-2 py-1 text-xs font-bold ${follows.has(t.key) ? "bg-[var(--accent)] text-white" : "text-[var(--faint)]"}`}
                    >
                      {follows.has(t.key) ? "Following" : "+ Follow"}
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by subject">
                <FilterChip
                  label="All subjects"
                  active={subjectFilter === "all"}
                  onClick={() => setSubjectFilter("all")}
                />
                {subjects.map((s) => (
                  <FilterChip
                    key={s.key}
                    label={s.name}
                    color={s.color}
                    active={subjectFilter === s.key}
                    onClick={() => setSubjectFilter(subjectFilter === s.key ? "all" : s.key)}
                  />
                ))}
                <FilterChip
                  label="♥ Saved"
                  active={savedOnly}
                  onClick={() => setSavedOnly(!savedOnly)}
                />
              </div>

              {feed.isPending && <p className="py-10 text-[var(--dim)]">Loading the board…</p>}
              {feed.error && (
                <p className="py-10 text-[#fb7185]">
                  The board failed to load. Pull to retry, or reopen the space.
                </p>
              )}
              {feed.data && filteredPosts.length === 0 && (
                <p className="py-10 text-[var(--dim)]">
                  No posts match that filter yet. Clear the search or pick another topic.
                </p>
              )}
              <div className="mt-6 grid gap-4">
                {filteredPosts.map((p) => (
                  <PostCard
                    key={p.slug}
                    post={p}
                    topic={topicByKey.get(p.topic)}
                    subject={subjectByKey.get(p.subject)}
                    saved={saves.has(p.slug)}
                    hasVoted={voted.has(p.slug)}
                    onOpen={() => go({ name: "article", slug: p.slug })}
                    onVote={() => handleVote(p)}
                    onSave={() => toggleSave(p.slug)}
                    canDelete={canDeletePost(p)}
                    onDelete={() => deletePostMut.mutate(p.slug)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {view.name === "article" && (
          <ArticleView
            slug={view.slug}
            session={session}
            profile={profile}
            saved={saves.has(view.slug)}
            hasVoted={voted.has(view.slug)}
            topicByKey={topicByKey}
            subjectByKey={subjectByKey}
            onBack={() => go({ name: "board" })}
            onVote={() => {
              if (!voted.has(view.slug)) {
                toggleVoted(view.slug);
                voteMut.mutate(view.slug);
              }
            }}
            onSave={() => toggleSave(view.slug)}
            onDeleted={() => go({ name: "board" })}
          />
        )}

        {view.name === "new" && (
          <NewPostView
            session={session}
            profile={profile}
            topics={topics}
            subjects={subjects}
            onPublished={(slug) => go({ name: "article", slug })}
            onCancel={() => go({ name: "board" })}
          />
        )}

        {view.name === "servers" && <ServersView />}

        {view.name === "faq" && (
          <FaqView onOpenWiki={(page) => go({ name: "wiki", page })} />
        )}

        {view.name === "wiki" && (
          <WikiView key={view.page} initialPage={view.page} />
        )}

        {view.name === "community" && (
          <CommunityView
            rooms={feed.data?.rooms ?? []}
            subjects={subjects}
            session={session}
            profile={profile}
          />
        )}

        {view.name === "support" && <SupportView />}

        {view.name === "thanks" && (
          <section className="mx-auto max-w-xl py-12 text-center">
            <img
              src={avatarImg}
              alt="Git-FED's brown furry mascot with spiky black hair holding an orange four-star ball"
              className="mx-auto h-40 w-40 rounded-full border-4 border-[var(--accent)] object-cover"
            />
            <p className="mt-6 text-xs font-bold tracking-[0.25em] text-[var(--accent)]">
              THANK YOU / GIT-FED
            </p>
            <h1 className="font-display mt-2 text-4xl font-black">
              Small signals add up<span className="text-[var(--pink)]">.</span>
            </h1>
            <p className="mt-3 text-[var(--dim)]">
              Thanks for considering support. The checkout choices are age-gated
              and remain with the provider you select.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => go({ name: "support" })}
                className="rounded-full bg-[var(--accent)] px-5 py-2.5 font-bold text-white"
              >
                Open support options ↗
              </button>
              <button
                type="button"
                onClick={() => go({ name: "board" })}
                className="rounded-full border border-[var(--border)] px-5 py-2.5 font-bold"
              >
                Back to the field
              </button>
            </div>
          </section>
        )}
      </main>
      )}

      <footer className="border-t border-[var(--border)] py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 text-sm text-[var(--dim)]">
          <span className="font-display font-extrabold text-[var(--text)]">MuseAi Social</span>
          <span>Meta glasses + Meta integrations</span>
          <span>Read free · sign in to interact</span>
          <button type="button" onClick={() => go({ name: "servers" })} className="font-semibold text-[#b7a6ff]">
            Servers ↗
          </button>
          <button type="button" onClick={() => go({ name: "community" })} className="font-semibold text-[#b7a6ff]">
            Community ↗
          </button>
          <button type="button" onClick={() => go({ name: "support" })} className="font-semibold text-[#b7a6ff]">
            Support ↗
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- pieces ---------------- */

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-bold ${
        active
          ? "border-transparent text-white"
          : "border-[var(--border)] text-[var(--dim)]"
      }`}
      style={active ? { background: color ?? "#7c5cfc" } : undefined}
    >
      {label}
    </button>
  );
}

function PostCard({
  post,
  topic,
  subject,
  saved,
  hasVoted,
  onOpen,
  onVote,
  onSave,
  canDelete,
  onDelete,
}: {
  post: Post;
  topic?: { name: string; color: string };
  subject?: { name: string; color: string };
  saved: boolean;
  hasVoted: boolean;
  onOpen: () => void;
  onVote: () => void;
  onSave: () => void;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const coverImg =
    (post.imageAsset ? POST_IMAGES[post.imageAsset] : undefined) ??
    post.attachments.find((a) => a.kind === "image")?.url;
  const firstImageIdx = post.attachments.findIndex((a) => a.kind === "image");
  const extraAttachments =
    !post.imageAsset && firstImageIdx >= 0
      ? post.attachments.filter((_, i) => i !== firstImageIdx)
      : post.attachments;
  return (
    <article className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span
          className="rounded-full px-2.5 py-1 text-white"
          style={{ background: topic?.color ?? "#7c5cfc" }}
        >
          {topic?.name ?? post.topic}
        </span>
        <span className="text-[var(--faint)]">{subject?.name ?? post.subject}</span>
        <span className="text-[var(--faint)]">{post.date}</span>
        <span className="text-[var(--faint)]">{post.readMinutes} min read</span>
      </div>
      {coverImg && (
        <button
          type="button"
          onClick={onOpen}
          className="mt-3 block w-full"
          aria-label={`Open: ${post.title}`}
        >
          <img
            src={coverImg}
            alt={`Cover image for: ${post.title}`}
            loading="lazy"
            className="aspect-[16/7] w-full rounded-xl border border-[var(--border)] object-cover"
          />
        </button>
      )}
      <button type="button" onClick={onOpen} className="mt-2 block text-left" aria-label={`Read: ${post.title}`}>
        <h3 className="font-display text-xl font-extrabold leading-snug hover:text-[#b7a6ff]">
          {post.title}
        </h3>
      </button>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--dim)]">{post.excerpt}</p>
      <AttachmentList attachments={extraAttachments} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onVote}
          disabled={hasVoted}
          aria-label={hasVoted ? `Upvoted, ${post.votes} votes` : `Upvote ${post.title}`}
          className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${hasVoted ? "bg-[#34d399]/20 text-[#34d399]" : "bg-[#26263a] text-white"}`}
        >
          ▲ {post.votes}
        </button>
        <span
          className="rounded-full bg-[#26263a] px-3.5 py-1.5 text-sm font-bold text-[var(--dim)]"
          aria-label={`${post.views} views`}
        >
          👁 {post.views} views
        </span>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open replies for ${post.title}`}
          className="rounded-full bg-[#26263a] px-3.5 py-1.5 text-sm font-bold"
        >
          💬 {post.commentCount} replies
        </button>
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          aria-label={saved ? `Unsave ${post.title}` : `Save ${post.title}`}
          className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${saved ? "bg-[var(--pink)] text-white" : "bg-[#26263a]"}`}
        >
          {saved ? "♥ Saved" : "♡ Save"}
        </button>
        {canDelete &&
          (confirmingDelete ? (
            <span className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Confirm delete ${post.title}`}>
              <span className="text-sm font-bold text-[#fb7185]">Delete this post?</span>
              <button
                type="button"
                onClick={onDelete}
                aria-label={`Yes, delete ${post.title}`}
                className="rounded-full bg-[#fb7185] px-3 py-1.5 text-sm font-bold text-white"
              >
                Yes, delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                aria-label="Cancel delete"
                className="rounded-full bg-[#26263a] px-3 py-1.5 text-sm font-bold"
              >
                Cancel
              </button>
              <span className="basis-full text-xs font-semibold text-[var(--dim)]">
                {DELETE_RULES_LINE}
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              aria-label={`Delete ${post.title}`}
              className="rounded-full bg-[#26263a] px-3.5 py-1.5 text-sm font-bold text-[#fb7185]"
            >
              Delete
            </button>
          ))}
        <span className="ml-auto text-sm text-[var(--faint)]">by {post.author}</span>
      </div>
      {canDelete && (
        <p className="mt-2 text-xs text-[var(--faint)]">{DELETE_RULES_LINE}</p>
      )}
    </article>
  );
}

function ArticleView({
  slug,
  session,
  profile,
  saved,
  hasVoted,
  topicByKey,
  subjectByKey,
  onBack,
  onVote,
  onSave,
  onDeleted,
}: {
  slug: string;
  session: SbSession | null;
  profile: Profile | null;
  saved: boolean;
  hasVoted: boolean;
  topicByKey: Map<string, { name: string; color: string }>;
  subjectByKey: Map<string, { name: string; color: string }>;
  onBack: () => void;
  onVote: () => void;
  onSave: () => void;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const detail = useQuery({
    queryKey: ["post", slug],
    queryFn: () => api.getPost({ slug }),
  });
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState("");
  const [replyUploads, setReplyUploads] = useState<PendingUpload[]>([]);

  // Opening this article already counted one view server-side; refresh the
  // feed once so the card shows the new count when the reader goes back.
  const countedSlugRef = useRef<string | null>(null);
  useEffect(() => {
    if (detail.data?.post && countedSlugRef.current !== slug) {
      countedSlugRef.current = slug;
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    }
  }, [detail.data, slug, queryClient]);

  const addComment = useMutation({
    mutationFn: async () =>
      await api.addComment({
        slug,
        authorId: session?.userId ?? "",
        authorUsername: profile?.username ?? "",
        body,
        attachments: replyUploads.map((u) => ({
          name: u.name,
          mime: u.mime,
          dataBase64: u.dataBase64,
        })),
      }),
    onSuccess: () => {
      setBody("");
      setReplyUploads([]);
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["post", slug] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Reply failed. Try again."),
  });

  const [confirmingDeletePost, setConfirmingDeletePost] = useState(false);
  const [confirmingCommentId, setConfirmingCommentId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const deletePostMut = useMutation({
    mutationFn: async () =>
      await api.deletePost({ slug, callerId: session?.userId ?? "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      onDeleted();
    },
    onError: (e) =>
      setDeleteError(e instanceof Error ? e.message : "Delete failed. Try again."),
  });

  const deleteCommentMut = useMutation({
    mutationFn: async (id: number) =>
      await api.deleteComment({ id, callerId: session?.userId ?? "" }),
    onSuccess: () => {
      setConfirmingCommentId(null);
      queryClient.invalidateQueries({ queryKey: ["post", slug] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e) =>
      setDeleteError(e instanceof Error ? e.message : "Delete failed. Try again."),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!session || !profile) {
      setFormError("Sign in with a username to reply.");
      return;
    }
    if (!body.trim()) {
      setFormError("Write a reply first.");
      return;
    }
    addComment.mutate();
  };

  if (detail.isPending) return <p className="py-12 text-[var(--dim)]">Loading the note…</p>;
  if (detail.error || !detail.data?.post)
    return (
      <div className="py-12">
        <p className="text-[#fb7185]">That post could not be found.</p>
        <button type="button" onClick={onBack} className="mt-4 rounded-full bg-[var(--accent)] px-5 py-2 font-bold text-white">
          ← Back to the board
        </button>
      </div>
    );

  const post = detail.data.post;
  const topic = topicByKey.get(post.topic);
  const subject = subjectByKey.get(post.subject);
  const canDeleteThisPost = canDeleteItem(
    session,
    profile,
    post.authorId,
    post.authorUsername,
  );

  return (
    <article className="mx-auto max-w-3xl py-8">
      <button type="button" onClick={onBack} className="text-sm font-bold text-[#b7a6ff]" aria-label="Back to the board">
        ← Back to the board
      </button>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="rounded-full px-2.5 py-1 text-white" style={{ background: topic?.color ?? "#7c5cfc" }}>
          {topic?.name ?? post.topic}
        </span>
        <span className="text-[var(--faint)]">{subject?.name ?? post.subject}</span>
        <span className="text-[var(--faint)]">{post.date} · {post.readMinutes} min read · by {post.author}</span>
      </div>
      <h1 className="font-display mt-3 text-3xl font-black leading-tight sm:text-4xl">{post.title}</h1>
      {post.imageAsset && POST_IMAGES[post.imageAsset] && (
        <img
          src={POST_IMAGES[post.imageAsset]}
          alt={`Cover image for: ${post.title}`}
          className="mt-5 aspect-[16/8] w-full rounded-[var(--radius)] border border-[var(--border)] object-cover"
        />
      )}
      <div className="article-body mt-5">
        {post.body.map((block, i) => {
          const t = block.trim();
          const h2 = t.match(/^<h2>([\s\S]*)<\/h2>$/);
          if (h2) return <h2 key={i}>{stripTags(h2[1] ?? "")}</h2>;
          if (/^<(ol|ul)>/.test(t)) {
            const ListTag = t.startsWith("<ul>") ? "ul" : "ol";
            const items = [...t.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) =>
              stripTags(m[1] ?? ""),
            );
            if (items.length)
              return (
                <ListTag key={i}>
                  {items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ListTag>
              );
          }
          return (
            <p key={i} className="mb-4">{block}</p>
          );
        })}
      </div>
      <AttachmentList attachments={post.attachments} large />
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onVote}
          disabled={hasVoted}
          aria-label={hasVoted ? `Upvoted, ${post.votes} votes` : "Upvote this post"}
          className={`rounded-full px-4 py-2 font-bold ${hasVoted ? "bg-[#34d399]/20 text-[#34d399]" : "bg-[var(--accent)] text-white"}`}
        >
          ▲ {post.votes} {hasVoted ? "· Upvoted" : "· Upvote"}
        </button>
        <span
          className="rounded-full bg-[#26263a] px-4 py-2 font-bold text-[var(--dim)]"
          aria-label={`${post.views} views`}
        >
          👁 {post.views} views
        </span>
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          aria-label={saved ? "Unsave this post" : "Save this post"}
          className={`rounded-full px-4 py-2 font-bold ${saved ? "bg-[var(--pink)] text-white" : "bg-[#26263a]"}`}
        >
          {saved ? "♥ Saved" : "♡ Save"}
        </button>
        {canDeleteThisPost &&
          (confirmingDeletePost ? (
            <span className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Confirm delete this post">
              <span className="text-sm font-bold text-[#fb7185]">Delete this post?</span>
              <button
                type="button"
                onClick={() => deletePostMut.mutate()}
                disabled={deletePostMut.isPending}
                aria-label="Yes, delete this post"
                className="rounded-full bg-[#fb7185] px-3.5 py-2 font-bold text-white disabled:opacity-50"
              >
                {deletePostMut.isPending ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDeletePost(false)}
                aria-label="Cancel delete"
                className="rounded-full bg-[#26263a] px-3.5 py-2 font-bold"
              >
                Cancel
              </button>
              <span className="basis-full text-xs font-semibold text-[var(--dim)]">
                {DELETE_RULES_LINE}
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDeletePost(true)}
              aria-label="Delete this post"
              className="rounded-full bg-[#26263a] px-4 py-2 font-bold text-[#fb7185]"
            >
              Delete
            </button>
          ))}
      </div>
      {canDeleteThisPost && (
        <p className="mt-2 text-xs text-[var(--faint)]">{DELETE_RULES_LINE}</p>
      )}
      {deleteError && (
        <p role="alert" className="mt-3 text-sm font-semibold text-[#fb7185]">
          {deleteError}
        </p>
      )}

      <section aria-labelledby="replies-title" className="mt-10 border-t border-[var(--border)] pt-6">
        <h2 id="replies-title" className="font-display text-2xl font-extrabold">
          Replies ({detail.data.comments.length})
        </h2>
        <div className="mt-4 grid gap-3">
          {detail.data.comments.length === 0 && (
            <p className="text-[var(--dim)]">No replies yet. Be the first with a working answer.</p>
          )}
          {detail.data.comments.map((c) => {
            const own = canDeleteItem(
              session,
              profile,
              c.authorId,
              c.authorUsername,
            );
            return (
              <div key={c.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm">
                    <strong>{c.author}</strong>{" "}
                    <time className="text-[var(--faint)]">{c.date}</time>
                  </p>
                  {own &&
                    (confirmingCommentId === c.id ? (
                      <span className="flex max-w-[16rem] shrink-0 flex-wrap items-center gap-1.5" role="group" aria-label="Confirm delete this reply">
                        <span className="text-xs font-bold text-[#fb7185]">Delete reply?</span>
                        <button
                          type="button"
                          onClick={() => deleteCommentMut.mutate(c.id)}
                          disabled={deleteCommentMut.isPending}
                          aria-label="Yes, delete this reply"
                          className="rounded-full bg-[#fb7185] px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50"
                        >
                          Yes, delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingCommentId(null)}
                          aria-label="Cancel delete reply"
                          className="rounded-full bg-[#26263a] px-2.5 py-1 text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <span className="basis-full text-[11px] font-semibold text-[var(--dim)]">
                          {DELETE_RULES_LINE}
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingCommentId(c.id)}
                        aria-label={`Delete your reply: ${c.body.slice(0, 40)}`}
                        className="shrink-0 rounded-full bg-[#26263a] px-2.5 py-1 text-xs font-bold text-[#fb7185]"
                      >
                        Delete
                      </button>
                    ))}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#cfcfe0]">{c.body}</p>
                <AttachmentList attachments={c.attachments} />
                {own && (
                  <p className="mt-2 text-xs text-[var(--faint)]">{DELETE_RULES_LINE}</p>
                )}
              </div>
            );
          })}
        </div>
        {session && profile ? (
          <form onSubmit={submit} className="mt-6 grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="font-display text-lg font-extrabold">Add a reply</h3>
            <p className="text-sm text-[var(--dim)]">
              Replying as <strong className="text-white">@{profile.username}</strong>
            </p>
            <label className="grid gap-1 text-sm font-semibold">
              Reply
              <textarea
                {...FIELDS.addComment.body}
                aria-label="Reply text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="What worked, what did not, what to try next…"
                className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2 font-normal outline-none focus:border-[var(--accent)]"
              />
            </label>
            <AttachmentPicker
              pending={replyUploads}
              onChange={setReplyUploads}
              idPrefix="reply"
            />
            {formError && <p role="alert" className="text-sm font-semibold text-[#fb7185]">{formError}</p>}
            <button
              type="submit"
              disabled={addComment.isPending}
              className="justify-self-start rounded-full bg-[var(--accent)] px-5 py-2.5 font-bold text-white disabled:opacity-50"
            >
              {addComment.isPending ? "Posting…" : "Post reply"}
            </button>
          </form>
        ) : (
          <p className="mt-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--dim)]">
            Sign in with the Login button above to add a reply. Your replies
            post under your username, never your email.
          </p>
        )}
      </section>
    </article>
  );
}

function NewPostView({
  session,
  profile,
  topics,
  subjects,
  onPublished,
  onCancel,
}: {
  session: SbSession | null;
  profile: Profile | null;
  topics: Feed["topics"];
  subjects: Feed["subjects"];
  onPublished: (slug: string) => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState<"learn" | "build" | "help" | "show" | "news">("learn");
  const [subject, setSubject] = useState<"meta-glasses" | "meta-ai" | "meta-integrations">("meta-glasses");
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState("");
  const [postUploads, setPostUploads] = useState<PendingUpload[]>([]);

  const create = useMutation({
    mutationFn: async () =>
      await api.createPost({
        title,
        topic,
        subject,
        authorId: session?.userId ?? "",
        authorUsername: profile?.username ?? "",
        body,
        attachments: postUploads.map((u) => ({
          name: u.name,
          mime: u.mime,
          dataBase64: u.dataBase64,
        })),
      }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      onPublished(r.slug);
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Publishing failed. Try again."),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!session || !profile) {
      setFormError("Sign in with a username to publish a post.");
      return;
    }
    if (title.trim().length < 3) {
      setFormError("Give the post a title of at least 3 characters.");
      return;
    }
    if (body.trim().length < 10) {
      setFormError("The body needs at least a sentence or two (10+ characters).");
      return;
    }
    setFormError("");
    create.mutate();
  };

  if (!session || !profile) {
    return (
      <section className="mx-auto max-w-2xl py-8">
        <h1 className="font-display text-3xl font-black">
          New post<span className="text-[var(--pink)]">.</span>
        </h1>
        <p className="mt-3 text-[var(--dim)]">
          Sign in with the Login button above to publish. Posts go out under
          your username, never your email.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-5 rounded-full border border-[var(--border)] px-5 py-2.5 font-bold"
        >
          Back to the board
        </button>
        <div className="mt-6">
          <DeleteRulesBox />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl py-8">
      <h1 className="font-display text-3xl font-black">
        New post<span className="text-[var(--pink)]">.</span>
      </h1>
      <p className="mt-2 text-[var(--dim)]">
        Posting as <strong className="text-white">@{profile.username}</strong>.
        Publishes straight into the live feed. Separate paragraphs with a blank line.
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <label className="grid gap-1 text-sm font-semibold">
          Title
          <input
            {...FIELDS.createPost.title}
            aria-label="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What you learned or built, in one line"
            className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2 font-normal outline-none focus:border-[var(--accent)]"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Topic
            <select
              {...FIELDS.createPost.topic}
              aria-label="Post topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value as typeof topic)}
              className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2 font-normal outline-none focus:border-[var(--accent)]"
            >
              {topics.map((t) => (
                <option key={t.key} value={t.key}>{t.name} — {t.desc}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Subject
            <select
              {...FIELDS.createPost.subject}
              aria-label="Post subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value as typeof subject)}
              className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2 font-normal outline-none focus:border-[var(--accent)]"
            >
              {subjects.map((s) => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-1 text-sm font-semibold">
          Body
          <textarea
            {...FIELDS.createPost.body}
            aria-label="Post body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={9}
            placeholder={"What happened, what worked, what you would do differently.\n\nA second paragraph with the details…"}
            className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2 font-normal outline-none focus:border-[var(--accent)]"
          />
        </label>
        <AttachmentPicker
          pending={postUploads}
          onChange={setPostUploads}
          idPrefix="new-post"
        />
        {formError && <p role="alert" className="text-sm font-semibold text-[#fb7185]">{formError}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-full bg-[var(--accent)] px-6 py-2.5 font-bold text-white disabled:opacity-50"
          >
            {create.isPending ? "Publishing…" : "Publish to the feed"}
          </button>
          <button type="button" onClick={onCancel} className="rounded-full border border-[var(--border)] px-5 py-2.5 font-bold">
            Cancel
          </button>
        </div>
      </form>
      <div className="mt-6">
        <DeleteRulesBox />
      </div>
    </section>
  );
}

const ROOM_DELETE_RULES_LINE =
  "Only admin can delete any room. You can only delete rooms you created.";

function CommunityView({
  rooms,
  subjects,
  session,
  profile,
}: {
  rooms: Feed["rooms"];
  subjects: Feed["subjects"];
  session: SbSession | null;
  profile: Profile | null;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<"meta-glasses" | "meta-ai" | "meta-integrations">("meta-glasses");
  const [formError, setFormError] = useState("");
  const [note, setNote] = useState("");
  const [confirmingRoomId, setConfirmingRoomId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const create = useMutation({
    mutationFn: async () =>
      await api.createRoom({
        name,
        subject,
        ...(session && profile
          ? { authorId: session.userId, authorUsername: profile.username }
          : {}),
      }),
    onSuccess: () => {
      setName("");
      setFormError("");
      setNote("Room created. It is saved in the backend and listed below.");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Room creation failed."),
  });

  const deleteRoomMut = useMutation({
    mutationFn: async (id: number) =>
      await api.deleteRoom({ id, callerId: session?.userId ?? "" }),
    onSuccess: () => {
      setConfirmingRoomId(null);
      setDeleteError("");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e) =>
      setDeleteError(e instanceof Error ? e.message : "Room delete failed."),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setFormError("Give the room a name of at least 2 characters.");
      return;
    }
    create.mutate();
  };

  return (
    <section className="py-8">
      <div className="grid items-center gap-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-[var(--accent)]">THE ROOM / LIVE DISCORD WIDGET</p>
          <h1 className="font-display mt-3 text-4xl font-black leading-tight">
            Bring the useful bits together<span className="text-[var(--pink)]">.</span>
          </h1>
          <p className="mt-3 max-w-md text-[var(--dim)]">
            Browse the public notes here, make a room, and find the live
            Discord widget at the bottom of this page.
          </p>
        </div>
        <img
          src={loopGif}
          alt="Animated comic scene of the FED mascot sharing a laugh with friendly gadget characters"
          className="w-full rounded-[var(--radius)] border border-[var(--border)] object-cover"
        />
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Rooms</h2>
          {rooms.length === 0 && (
            <p className="mt-3 text-[var(--dim)]">No rooms yet. Create the first one.</p>
          )}
          {deleteError && (
            <p role="alert" className="mt-3 text-sm font-semibold text-[#fb7185]">{deleteError}</p>
          )}
          <ul className="mt-3 grid gap-2">
            {rooms.map((r) => {
              const canDel = canDeleteItem(session, profile, r.creatorId, r.creatorUsername);
              const confirming = confirmingRoomId === r.id;
              return (
                <li key={r.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <strong className="font-display">{r.name}</strong>
                    <span className="text-sm text-[var(--faint)]">· {r.subjectName}</span>
                    {r.creatorUsername && (
                      <span className="text-sm text-[var(--faint)]">· by @{r.creatorUsername}</span>
                    )}
                  </div>
                  {canDel &&
                    (confirming ? (
                      <span className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label={`Confirm delete room ${r.name}`}>
                        <span className="text-sm font-bold text-[#fb7185]">Delete this room?</span>
                        <button
                          type="button"
                          onClick={() => deleteRoomMut.mutate(r.id)}
                          disabled={deleteRoomMut.isPending}
                          aria-label={`Yes, delete room ${r.name}`}
                          className="rounded-full bg-[#fb7185] px-3 py-1.5 text-sm font-bold text-white disabled:opacity-50"
                        >
                          {deleteRoomMut.isPending ? "Deleting…" : "Yes, delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingRoomId(null)}
                          aria-label="Cancel delete"
                          className="rounded-full bg-[#26263a] px-3 py-1.5 text-sm font-bold"
                        >
                          Cancel
                        </button>
                        <span className="basis-full text-xs font-semibold text-[var(--dim)]">
                          {ROOM_DELETE_RULES_LINE}
                        </span>
                      </span>
                    ) : (
                      <span className="mt-2 block">
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError("");
                            setConfirmingRoomId(r.id);
                          }}
                          aria-label={`Delete room ${r.name}`}
                          className="rounded-full bg-[#26263a] px-3.5 py-1.5 text-sm font-bold text-[#fb7185]"
                        >
                          Delete
                        </button>
                        <span className="mt-1.5 block text-xs text-[var(--faint)]">
                          {ROOM_DELETE_RULES_LINE}
                        </span>
                      </span>
                    ))}
                </li>
              );
            })}
          </ul>
        </div>
        <form onSubmit={submit} className="grid content-start gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="font-display text-lg font-extrabold">Create a room</h3>
          <label className="grid gap-1 text-sm font-semibold">
            Room name
            <input
              {...FIELDS.createRoom.name}
              aria-label="Room name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wind-noise fixes"
              className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2 font-normal outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Subject
            <select
              {...FIELDS.createRoom.subject}
              aria-label="Room subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value as typeof subject)}
              className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2 font-normal outline-none focus:border-[var(--accent)]"
            >
              {subjects.map((s) => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
            </select>
          </label>
          <p className="text-sm text-[var(--dim)]">
            {session && profile
              ? `Creating as @${profile.username}. You can delete rooms you create; admin can delete any room.`
              : "Sign in and set a username to own the rooms you create, so you can delete them later. Admin can delete any room."}
          </p>
          {formError && <p role="alert" className="text-sm font-semibold text-[#fb7185]">{formError}</p>}
          {note && <p role="status" className="text-sm font-semibold text-[#34d399]">{note}</p>}
          <button
            type="submit"
            disabled={create.isPending}
            className="justify-self-start rounded-full bg-[var(--accent)] px-5 py-2.5 font-bold text-white disabled:opacity-50"
          >
            {create.isPending ? "Creating…" : "Create room"}
          </button>
        </form>
      </div>

      <div className="mt-14 text-center">
        <h2 className="font-display text-2xl font-extrabold">A proper room, centered.</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--dim)]">
          Discord controls this embedded view. If it does not load, the rest of
          the community still works normally.
        </p>
        <div className="mt-5 flex justify-center">
          <iframe
            src="https://discord.com/widget?id=1400235929154879490&theme=dark"
            title="Git-FED Discord community widget"
            width="350"
            height="500"
            frameBorder="0"
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            className="max-w-full rounded-[var(--radius)] border border-[var(--border)]"
          />
        </div>
      </div>
    </section>
  );
}

function SupportView() {
  const [confirmed, setConfirmed] = useState(() => {
    try {
      return sessionStorage.getItem("museai-age-confirmed") === "yes";
    } catch {
      return false;
    }
  });
  const [checked, setChecked] = useState(false);
  const [gateError, setGateError] = useState("");
  const paypalRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<HTMLDivElement>(null);
  const [providerNote, setProviderNote] = useState("");

  useEffect(() => {
    if (!confirmed) return;
    // PayPal subscription button
    const ppScript = document.createElement("script");
    ppScript.src =
      "https://www.paypal.com/sdk/js?client-id=BAA_ndqaWMyQwTnDZ0LXwLQ22jdJo9uxkeXYqmBbF-hD41HMiZ83mvOcx1Kti0b6ZfXfje7Q1ievNaS8Ok&vault=true&intent=subscription";
    ppScript.async = true;
    ppScript.onload = () => {
      const w = window as unknown as {
        paypal?: {
          Buttons: (cfg: Record<string, unknown>) => { render: (sel: string) => Promise<void> };
        };
      };
      if (w.paypal && paypalRef.current) {
        paypalRef.current.replaceChildren();
        const holder = document.createElement("div");
        holder.id = "paypal-subscription-buttons";
        paypalRef.current.appendChild(holder);
        w.paypal
          .Buttons({
            style: { shape: "rect", color: "gold", layout: "vertical", label: "subscribe" },
            createSubscription: (
              _data: unknown,
              actions: { subscription: { create: (o: Record<string, unknown>) => unknown } },
            ) => actions.subscription.create({ plan_id: "P-4FD24238VX4902214NK2XP2Y", quantity: 1 }),
            onApprove: () =>
              setProviderNote("PayPal returned an approval. Review and finish the provider's on-screen confirmation."),
            onError: () =>
              setProviderNote("PayPal could not complete this step. Review the provider message or choose another option."),
          })
          .render("#paypal-subscription-buttons")
          .catch(() => setProviderNote("PayPal checkout could not load. Try another provider."));
      }
    };
    ppScript.onerror = () =>
      setProviderNote("PayPal checkout could not load. Check your connection or try another provider.");
    document.head.appendChild(ppScript);
    // Stripe buy button
    const stScript = document.createElement("script");
    stScript.src = "https://js.stripe.com/v3/buy-button.js";
    stScript.async = true;
    stScript.onload = () => {
      if (stripeRef.current) {
        stripeRef.current.replaceChildren();
        const btn = document.createElement("stripe-buy-button");
        btn.setAttribute("buy-button-id", "buy_btn_1UJKaaJaRf233kfWKZ81fcIe");
        btn.setAttribute(
          "publishable-key",
          "pk_live_51UIdAGJaRf233kfWlFacR31IYVGdjCVAttNFzIgQGXQzrUdc894iJcBqamRZNwF11z2AN5kvjyzitor462f2egVI00UmKj0sd8",
        );
        stripeRef.current.appendChild(btn);
      }
    };
    document.head.appendChild(stScript);
    return () => {
      ppScript.remove();
      stScript.remove();
    };
  }, [confirmed]);

  const submitGate = (e: FormEvent) => {
    e.preventDefault();
    if (!checked) {
      setGateError("Check the box to confirm you are at least 18 years old.");
      return;
    }
    try {
      sessionStorage.setItem("museai-age-confirmed", "yes");
    } catch {
      /* providers still load for this view */
    }
    setConfirmed(true);
  };

  return (
    <section className="py-8">
      <div className="grid items-center gap-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-[var(--accent)]">FED HUB / SUPPORT &amp; SUBSCRIBE</p>
          <h1 className="font-display mt-3 text-4xl font-black leading-tight">
            Keep the signal humming<span className="text-[var(--pink)]">.</span>
          </h1>
          <p className="mt-3 max-w-md text-[var(--dim)]">
            Choose a provider for one-time support, recurring support, or the
            Git-FED newsletter. All checkout actions stay with the named
            third-party provider.
          </p>
          <p className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold tracking-wider text-[var(--faint)]">
            <span className="rounded-full border border-[var(--border)] px-2.5 py-1">EXTERNAL CHECKOUT</span>
            <span className="rounded-full border border-[var(--border)] px-2.5 py-1">18+ CONFIRMATION FIRST</span>
          </p>
        </div>
        <img
          src={supportArt}
          alt="The FED mascot puts a gold coin into a transparent support jar"
          className="w-full rounded-[var(--radius)] border border-[var(--border)] object-cover"
        />
      </div>

      {!confirmed ? (
        <form
          onSubmit={submitGate}
          className="mx-auto mt-10 max-w-xl rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6"
        >
          <p className="text-xs font-bold tracking-[0.25em] text-[var(--accent)]">AGE-GATED PAYMENT AREA</p>
          <h2 className="font-display mt-2 text-2xl font-extrabold">Before checkout, confirm you are 18 or older.</h2>
          <p className="mt-2 text-sm text-[var(--dim)]">
            This is a front-end age acknowledgment only. It does not verify
            identity or age, and it is not a substitute for legal or
            payment-provider compliance controls.
          </p>
          <label className="mt-4 flex items-start gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              aria-label="I confirm that I am at least 18 years old"
              className="mt-1 h-5 w-5 shrink-0"
            />
            <span>I confirm that I am at least 18 years old and agree to continue to the external provider options.</span>
          </label>
          {gateError && <p role="alert" className="mt-2 text-sm font-semibold text-[#fb7185]">{gateError}</p>}
          <button type="submit" className="mt-5 rounded-full bg-[var(--accent)] px-6 py-3 font-bold text-white">
            Confirm 18+ and view options ↘
          </button>
        </form>
      ) : (
        <div className="mt-10">
          <h2 className="font-display text-2xl font-extrabold">Pick the route that suits you.</h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--dim)]">
            Amounts, renewal terms, availability, fees, and refunds are
            controlled by each provider. Review their checkout details before
            approving anything.
          </p>
          {providerNote && <p role="status" className="mt-3 text-sm font-semibold text-[#34d399]">{providerNote}</p>}
          <h3 className="font-display mt-8 text-lg font-extrabold">01 · Subscription options</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-[11px] font-bold tracking-wider text-[var(--accent)]">PAYPAL / SUBSCRIPTION</p>
              <h4 className="font-display mt-1 text-lg font-extrabold">Support with PayPal</h4>
              <p className="mt-1 text-sm text-[var(--dim)]">PayPal-hosted subscription flow. The plan and billing terms are presented by PayPal before approval.</p>
              <div ref={paypalRef} className="mt-3">
                <span className="text-sm text-[var(--faint)]">PayPal checkout loads after the age confirmation.</span>
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-[11px] font-bold tracking-wider text-[var(--accent)]">STRIPE / SECURE CHECKOUT</p>
              <h4 className="font-display mt-1 text-lg font-extrabold">Subscribe with Stripe</h4>
              <p className="mt-1 text-sm text-[var(--dim)]">Stripe's hosted buy button appears after age confirmation. Verify the product and recurring terms in Stripe checkout.</p>
              <div ref={stripeRef} className="mt-3">
                <span className="text-sm text-[var(--faint)]">Stripe checkout loads after the age confirmation.</span>
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-[11px] font-bold tracking-wider text-[var(--accent)]">GITHUB SPONSORS</p>
              <h4 className="font-display mt-1 text-lg font-extrabold">Sponsor Git-FED</h4>
              <p className="mt-1 text-sm text-[var(--dim)]">Choose a monthly sponsorship level on GitHub. GitHub shows the amount and renewal terms.</p>
              <a
                href="https://github.com/sponsors/Git-FED"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-full bg-[#26263a] px-4 py-2 text-sm font-bold"
              >
                Open GitHub Sponsors ↗
              </a>
            </div>
          </div>
          <h3 className="font-display mt-8 text-lg font-extrabold">02 · A tip or donation</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {[
              { kicker: "BUY ME A COFFEE", title: "Buy me a book", desc: "One-time support through the provider's own checkout page.", href: "https://www.buymeacoffee.com/fedpromptly", cta: "Open Buy Me a Coffee ↗" },
              { kicker: "THANKS.DEV", title: "Back open-source dependencies", desc: "Voluntary support for the Git-FED dependency profile.", href: "https://thanks.dev/d/gh/git-fed/dependencies", cta: "Donate on thanks.dev ↗" },
              { kicker: "NOWPAYMENTS / CRYPTO", title: "Crypto payment", desc: "Review supported assets, exchange rate, fees, and final amount on NOWPayments before sending.", href: "https://nowpayments.io/payment/?iid=5997958570&source=button", cta: "Open NOWPayments ↗" },
            ].map((c) => (
              <div key={c.kicker} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
                <p className="text-[11px] font-bold tracking-wider text-[var(--accent)]">{c.kicker}</p>
                <h4 className="font-display mt-1 text-lg font-extrabold">{c.title}</h4>
                <p className="mt-1 text-sm text-[var(--dim)]">{c.desc}</p>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block rounded-full bg-[#26263a] px-4 py-2 text-sm font-bold"
                >
                  {c.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- Set username gate ---------------- */

function SetUsernameScreen({
  session,
  onProfile,
  onSignOut,
}: {
  session: SbSession;
  onProfile: (p: Profile) => void;
  onSignOut: () => void;
}) {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    if (!USERNAME_RE.test(name)) {
      setError("Usernames are 3 to 20 characters: letters, numbers, and underscore only.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await api.setUsername({ userId: session.userId, username: name });
      await sbUpdateUsername(session.access_token, name);
      onProfile(r.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that username. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      <section className="mx-auto max-w-md py-14">
        <img src={fedSymbol} alt="" className="h-12 w-12" />
        <h1 className="font-display mt-4 text-3xl font-black">
          Set your username<span className="text-[var(--pink)]">.</span>
        </h1>
        <p className="mt-3 text-[var(--dim)]">
          One more step before you can use the board. Everything you post
          shows this username. Your email is never shown anywhere on the site.
        </p>
        <p className="mt-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--dim)]">
          The username <strong className="text-white">admin</strong> can only
          ever belong to one account, and only admin can delete any post. If
          this is your site, claim the username admin first, before you share
          the site with anyone.
        </p>
        <form onSubmit={submit} className="mt-6 grid gap-3">
          <label className="grid gap-1 text-sm font-semibold">
            Username
            <input
              type="text"
              aria-label="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="3-20 characters, letters, numbers, _"
              className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm font-semibold text-[#fb7185]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-[var(--pink)] px-5 py-3 font-display text-base font-extrabold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save username and enter"}
          </button>
        </form>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 text-sm font-bold text-[var(--dim)]"
        >
          Sign out instead
        </button>
      </section>
    </main>
  );
}

/* ---------------- Auth modal (Supabase) ---------------- */

function AuthModal({
  session,
  profile,
  onClose,
  onSession,
  onProfile,
  onSignOut,
}: {
  session: SbSession | null;
  profile: Profile | null;
  onClose: () => void;
  onSession: (s: SbSession, remember: boolean, pendingUsername?: string) => void;
  onProfile: (p: Profile) => void;
  onSignOut: () => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [changeBusy, setChangeBusy] = useState(false);
  const [changeStatus, setChangeStatus] = useState("");
  const [changeIsError, setChangeIsError] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setIsError(true);
      setStatus("Enter your email and password.");
      return;
    }
    if (mode === "signup" && !USERNAME_RE.test(username.trim())) {
      setIsError(true);
      setStatus("Pick a username: 3 to 20 characters, letters, numbers, and underscore only.");
      return;
    }
    setBusy(true);
    setStatus("");
    const path = mode === "signin" ? "token?grant_type=password" : "signup";
    const body: Record<string, unknown> =
      mode === "signup"
        ? { email: email.trim(), password, data: { username: username.trim() } }
        : { email: email.trim(), password };
    const r = await sbAuth(path, body);
    setBusy(false);
    if (r.error) {
      setIsError(true);
      setStatus(r.error);
      return;
    }
    if (r.session) {
      const pending =
        mode === "signup" ? username.trim() : (r.metadataUsername ?? undefined);
      onSession(r.session, remember, pending);
      setStatus(mode === "signin" ? "Signed in. Welcome back." : "Account created and signed in.");
      setTimeout(onClose, 700);
    } else {
      setIsError(false);
      setStatus("Account created. Check your email to confirm, then sign in.");
      setMode("signin");
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setIsError(true);
      setStatus("Enter your email above first, then tap Forgot password.");
      return;
    }
    setBusy(true);
    const r = await sbAuth("recover", { email: email.trim() });
    setBusy(false);
    if (r.error) {
      setIsError(true);
      setStatus(r.error);
    } else {
      setIsError(false);
      setStatus("Password reset email sent. Check your inbox for the recovery link.");
    }
  };

  const changeUsername = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const name = newUsername.trim();
    if (!USERNAME_RE.test(name)) {
      setChangeIsError(true);
      setChangeStatus("Usernames are 3 to 20 characters: letters, numbers, and underscore only.");
      return;
    }
    setChangeBusy(true);
    setChangeStatus("");
    try {
      const r = await api.setUsername({ userId: session.userId, username: name });
      await sbUpdateUsername(session.access_token, name);
      onProfile(r.profile);
      setNewUsername("");
      setChangeIsError(false);
      setChangeStatus(`Username changed to @${r.profile.username}.`);
    } catch (err) {
      setChangeIsError(true);
      setChangeStatus(err instanceof Error ? err.message : "Could not change the username. Try again.");
    } finally {
      setChangeBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[var(--surface)] p-6 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <img src={fedSymbol} alt="" className="h-10 w-10" />
          <button type="button" onClick={onClose} aria-label="Close sign in" className="rounded-full bg-[#26263a] px-3 py-1.5 font-bold">
            ✕
          </button>
        </div>
        {session ? (
          <div className="mt-4">
            <h2 className="font-display text-2xl font-black">Account</h2>
            {profile ? (
              <p className="mt-2 text-sm text-[var(--dim)]">
                You are signed in as{" "}
                <strong className="text-white">@{profile.username}</strong>
                {profile.isOwner ? " (admin)" : ""}. Your posts and
                replies show this username. Your email stays private and is
                never displayed on the site.
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--dim)]">
                You are signed in. Set a username to finish setting up your
                account before posting.
              </p>
            )}
            <div className="mt-5">
              <DeleteRulesBox />
            </div>
            {profile && (
              <form onSubmit={changeUsername} className="mt-5 grid gap-2">
                <label className="grid gap-1 text-sm font-semibold">
                  Change username
                  <input
                    type="text"
                    aria-label="New username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="3-20 characters, letters, numbers, _"
                    className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
                  />
                </label>
                {changeStatus && (
                  <p role="status" className={`text-sm font-semibold ${changeIsError ? "text-[#fb7185]" : "text-[#34d399]"}`}>
                    {changeStatus}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={changeBusy}
                  className="rounded-full bg-[var(--accent)] px-5 py-2.5 font-bold text-white disabled:opacity-50"
                >
                  {changeBusy ? "Saving…" : "Change username"}
                </button>
              </form>
            )}
            <button
              type="button"
              onClick={onSignOut}
              className="mt-5 w-full rounded-full bg-[#26263a] px-5 py-3 font-bold"
            >
              Sign out
            </button>
          </div>
        ) : (
          <>
            <h2 className="font-display mt-4 text-2xl font-black">
              {mode === "signin" ? "Sign in" : "Create account"}
              <span className="text-[var(--pink)]">.</span>
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Sign in or create account">
              <button
                type="button"
                onClick={() => setMode("signin")}
                aria-pressed={mode === "signin"}
                className={`rounded-full py-2 font-bold ${mode === "signin" ? "bg-[var(--accent)] text-white" : "bg-[#26263a]"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                aria-pressed={mode === "signup"}
                className={`rounded-full py-2 font-bold ${mode === "signup" ? "bg-[var(--accent)] text-white" : "bg-[#26263a]"}`}
              >
                Create Account
              </button>
            </div>
            <form onSubmit={submit} className="mt-4 grid gap-3">
              {mode === "signup" && (
                <label className="grid gap-1 text-sm font-semibold">
                  Username
                  <input
                    type="text"
                    aria-label="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="3-20 characters, letters, numbers, _"
                    className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
                  />
                  <span className="text-xs font-normal text-[var(--faint)]">
                    This is the name shown on your posts. Your email is never displayed.
                  </span>
                </label>
              )}
              <label className="grid gap-1 text-sm font-semibold">
                Email
                <input
                  type="email"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Password
                <input
                  type="password"
                  aria-label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="Your password"
                  className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
                />
              </label>
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    aria-label="Remember me"
                    className="h-5 w-5"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={forgot}
                  disabled={busy}
                  className="text-sm font-bold text-[#b7a6ff] disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>
              {status && (
                <p role="status" className={`text-sm font-semibold ${isError ? "text-[#fb7185]" : "text-[#34d399]"}`}>
                  {status}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-[var(--pink)] px-5 py-3 font-display text-base font-extrabold text-white disabled:opacity-50"
              >
                {busy ? "Working…" : mode === "signin" ? "Sign In" : "Create Account"}
              </button>
              <p className="text-center text-xs text-[var(--faint)]">
                Accounts are handled by Supabase. Reading the board is always public.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
