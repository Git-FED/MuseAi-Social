import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronLeft,
  Compass,
  ExternalLink,
  Flame,
  Gem,
  Hash,
  Headphones,
  Heart,
  Lock,
  Mic,
  MicOff,
  Pin,
  Plus,
  PlusCircle,
  Search,
  SendHorizontal,
  Settings,
  ThumbsUp,
  Users,
  Volume2,
} from "lucide-react";
import fedSymbol from "./assets/fed-symbol.svg";
import avatarImg from "./assets/gitfed-avatar.webp";
import bannerArt from "./assets/promo-community.webp";
import iconReddit from "./assets/server-icon-reddit.webp";
import iconDiscord from "./assets/server-icon-discord.webp";
import iconFacebook from "./assets/server-icon-facebook.webp";
import iconTelegram from "./assets/server-icon-telegram.webp";
import iconGithub from "./assets/server-icon-github.webp";
import iconSkool from "./assets/server-icon-skool.webp";
import iconForums from "./assets/server-icon-forums.webp";
import iconWhop from "./assets/server-icon-whop.webp";
import iconTokenTown from "./assets/server-icon-token-town.webp";
import {
  CATEGORIES,
  RAIL_SERVERS,
  SERVER_INTRO,
  findChannel,
  type RailServer,
} from "./servers-data";

/* Generated flat-emblem icons for the server rail, one per platform slot.
   The home slot keeps the FED symbol mark. */
const SERVER_ICONS: Record<string, string> = {
  reddit: iconReddit,
  discord: iconDiscord,
  facebook: iconFacebook,
  telegram: iconTelegram,
  github: iconGithub,
  skool: iconSkool,
  forums: iconForums,
  whop: iconWhop,
  "token-town": iconTokenTown,
};

/* Accent color for a channel's link embeds: the color of the rail server
   that points at the channel, falling back to the site accent. */
function embedColorFor(channelId: string): string {
  const s = RAIL_SERVERS.find((r) => r.channelId === channelId);
  return s?.color ?? "#7c5cfc";
}

const AUTHOR_STYLE: Record<string, { color: string; bg: string }> = {
  "Git-FED": { color: "#f5c542", bg: "#b8860b" },
  "Mod Bot": { color: "#b7a6ff", bg: "#7c5cfc" },
  "Server notes": { color: "#7dd3fc", bg: "#0e7490" },
  You: { color: "#6ee7a7", bg: "#047857" },
};

function authorStyle(name: string) {
  return AUTHOR_STYLE[name] ?? { color: "#f9a8d4", bg: "#be185d" };
}

type LocalMessage = { author: string; text: string };

/* ---------------- member list (right sidebar) ---------------- */

type Member = {
  name: string;
  color: string;
  bg: string;
  status: "online" | "idle" | "dnd" | "offline";
  activity?: string;
  bot?: boolean;
  avatar?: string;
};

const MEMBER_GROUPS: { name: string; members: Member[] }[] = [
  {
    name: "Owner",
    members: [
      {
        name: "Git-FED",
        color: "#f5c542",
        bg: "#b8860b",
        status: "online",
        activity: "Running the map",
        avatar: avatarImg,
      },
    ],
  },
  {
    name: "Bots",
    members: [
      {
        name: "Mod Bot",
        color: "#b7a6ff",
        bg: "#7c5cfc",
        status: "online",
        activity: "Pinning the good stuff",
        bot: true,
      },
    ],
  },
  {
    name: "Community reps",
    members: [
      { name: "Built with Muse", color: "#6ee7a7", bg: "#047857", status: "online", activity: "1,063 members" },
      { name: "MuseInviteHub", color: "#7dd3fc", bg: "#0369a1", status: "online", activity: "544 codes shared" },
      { name: "Muse Gadgets", color: "#f9a8d4", bg: "#be185d", status: "idle", activity: "322 online on Discord" },
      { name: "Muse Agent", color: "#fca5a5", bg: "#b91c1c", status: "online", activity: "633 on Discord" },
      { name: "awesome-muse-skills", color: "#fcd34d", bg: "#92400e", status: "dnd", activity: "2,384 skills listed" },
    ],
  },
  {
    name: "Offline",
    members: [
      { name: "Muse Forum", color: "#a2a1b1", bg: "#3f3f4d", status: "offline", activity: "16 agents · 15 threads" },
      { name: "musexy", color: "#a2a1b1", bg: "#3f3f4d", status: "offline", activity: "59 use cases" },
    ],
  },
];

const STATUS_DOT: Record<Member["status"], string> = {
  online: "#23a55a",
  idle: "#f0b232",
  dnd: "#f23f43",
  offline: "#80848e",
};

const VOICE_CHANNELS: { name: string; occupants: { name: string; speaking?: boolean }[] }[] = [
  {
    name: "lounge",
    occupants: [{ name: "Git-FED", speaking: true }, { name: "Mod Bot" }],
  },
  { name: "build-lab", occupants: [] },
];

/* ---------------- reactions ---------------- */

function Reactions({ seed, idPrefix }: { seed: number; idPrefix: string }) {
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const base = [
    { key: "up", Icon: ThumbsUp, count: 2 + (seed % 6) },
    { key: "heart", Icon: Heart, count: 1 + (seed % 4) },
    { key: "flame", Icon: Flame, count: seed % 3 },
  ].filter((r) => r.count > 0);
  const toggle = (key: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {base.map(({ key, Icon, count }) => {
        const active = picked.has(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            aria-pressed={active}
            aria-label={`React to ${idPrefix} message`}
            className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-semibold transition-colors ${
              active
                ? "border-[var(--accent)] bg-[var(--accent)]/25 text-white"
                : "border-[var(--border)] bg-[#26263a] text-[var(--dim)] hover:border-[var(--dim)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {count + (active ? 1 : 0)}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- server rail ---------------- */

function RailButton({
  server,
  active,
  unread,
  onJump,
}: {
  server: RailServer;
  active: boolean;
  unread?: boolean;
  onJump: (channelId: string) => void;
}) {
  const icon = SERVER_ICONS[server.id];
  const shape = active ? "rounded-2xl" : "rounded-full hover:rounded-2xl";
  const inner =
    server.id === "home" ? (
      <span className="flex h-full w-full items-center justify-center bg-[var(--accent)]">
        <img src={fedSymbol} alt="" className="h-7 w-7" />
      </span>
    ) : icon ? (
      <img src={icon} alt="" className="h-full w-full object-cover" />
    ) : (
      <span
        className="font-display flex h-full w-full items-center justify-center text-sm font-black text-white"
        style={{ background: server.color, color: server.textColor ?? "#ffffff" }}
      >
        {server.short}
      </span>
    );
  const pill = (
    <span
      className={`absolute -left-[13px] top-1/2 w-1 -translate-y-1/2 rounded-r bg-white transition-all ${
        active ? "h-10" : unread ? "h-2.5" : "h-0"
      }`}
      aria-hidden="true"
    />
  );
  const cls = `relative block h-11 w-11 shrink-0 overflow-hidden transition-all sm:h-12 sm:w-12 ${shape} ${
    active ? "ring-2 ring-white/25" : ""
  }`;
  if (server.href) {
    return (
      <span className="relative block shrink-0">
        {pill}
        <a
          href={server.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${server.label} (opens in a new tab)`}
          title={server.label}
          className={cls}
        >
          {inner}
        </a>
      </span>
    );
  }
  return (
    <span className="relative block shrink-0">
      {pill}
      <button
        type="button"
        onClick={() => server.channelId && onJump(server.channelId)}
        aria-label={server.label}
        aria-current={active ? "true" : undefined}
        title={server.label}
        className={cls}
      >
        {inner}
      </button>
    </span>
  );
}

/* ---------------- one chat message ---------------- */

function ChatMessage({
  author,
  time,
  text,
  pinned,
  children,
  seed,
}: {
  author: string;
  time: string;
  text?: string;
  pinned?: boolean;
  children?: ReactNode;
  seed: number;
}) {
  const st = authorStyle(author);
  const isBot = author === "Mod Bot";
  return (
    <div className="group -mx-2 flex gap-3 rounded px-2 py-1.5 hover:bg-white/[0.03] sm:gap-4">
      {author === "Git-FED" ? (
        <img
          src={avatarImg}
          alt=""
          className="mt-0.5 h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          className="font-display mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-black text-white"
          style={{ background: st.bg }}
          aria-hidden="true"
        >
          {author.charAt(0)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-display font-extrabold" style={{ color: st.color }}>
            {author}
          </span>
          {isBot && (
            <span className="rounded bg-[var(--accent)] px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-white">
              Bot
            </span>
          )}
          {pinned && (
            <span className="flex items-center gap-1 rounded bg-[#26263a] px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-[var(--dim)]">
              <Pin className="h-3 w-3" aria-hidden="true" />
              Pinned
            </span>
          )}
          <span className="text-[11px] text-[var(--faint)]">{time}</span>
        </p>
        {text && <p className="mt-0.5 leading-relaxed text-[#e3e3ef]">{text}</p>}
        {children}
        <Reactions seed={seed} idPrefix={author} />
      </div>
    </div>
  );
}

/* ---------------- the view ---------------- */

export function ServersView() {
  const [selectedId, setSelectedId] = useState("welcome");
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());
  const [mobilePane, setMobilePane] = useState<"list" | "main">("list");
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [showMembers, setShowMembers] = useState(true);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [notifOff, setNotifOff] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [localMsgs, setLocalMsgs] = useState<Record<string, LocalMessage[]>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);

  const channel = findChannel(selectedId);
  const embedColor = embedColorFor(channel.id);

  const select = (id: string) => {
    setSelectedId(id);
    setReadIds((prev) => new Set(prev).add(id));
    setMobilePane("main");
    setQuery("");
    setDraft("");
  };

  const toggleCategory = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const isUnread = (id: string, unread?: boolean) =>
    !!unread && !readIds.has(id) && id !== selectedId;

  const railUnread = (s: RailServer) =>
    !!s.channelId && isUnread(s.channelId, findChannel(s.channelId).unread);

  const q = query.trim().toLowerCase();
  const visiblePinned = useMemo(
    () =>
      q
        ? channel.pinned.filter(
            (m) =>
              m.text.toLowerCase().includes(q) || m.author.toLowerCase().includes(q),
          )
        : channel.pinned,
    [channel, q],
  );
  const visibleLinks = useMemo(
    () =>
      q
        ? channel.links.filter(
            (l) =>
              l.label.toLowerCase().includes(q) ||
              (l.detail ?? "").toLowerCase().includes(q),
          )
        : channel.links,
    [channel, q],
  );
  const topicVisible = !q || channel.topic.toLowerCase().includes(q);
  const nothingFound = q && !topicVisible && visiblePinned.length === 0 && visibleLinks.length === 0;

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setLocalMsgs((prev) => ({
      ...prev,
      [channel.id]: [...(prev[channel.id] ?? []), { author: "You", text }],
    }));
    setDraft("");
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  };

  return (
    <section className="py-6" aria-label="Servers — Muse AI community map">
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-[var(--dim)]">{SERVER_INTRO}</p>

      <div className="flex h-[74dvh] min-h-[460px] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] md:h-[78dvh]">
        {/* Server rail */}
        <div
          className="flex w-[68px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-[#12121c] px-[10px] py-3"
          role="navigation"
          aria-label="Servers"
        >
          {RAIL_SERVERS.slice(0, 8).map((s) => (
            <RailButton
              key={s.id}
              server={s}
              active={!!s.channelId && s.channelId === selectedId && s.id !== "token-town"}
              unread={railUnread(s)}
              onJump={select}
            />
          ))}
          <div className="my-1 h-px w-8 shrink-0 bg-[var(--border)]" aria-hidden="true" />
          <p className="text-center text-[9px] font-bold uppercase tracking-wider text-[var(--faint)]">
            Git-FED's own
          </p>
          {RAIL_SERVERS.slice(8).map((s) => (
            <RailButton
              key={s.id}
              server={s}
              active={s.id === "token-town" && selectedId === "discord"}
              onJump={select}
            />
          ))}
          <div className="my-1 h-px w-8 shrink-0 bg-[var(--border)]" aria-hidden="true" />
          <button
            type="button"
            onClick={() => select("forums-sites")}
            aria-label="Browse the directory channel"
            title="Browse the directory"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#26263a] text-[#23a55a] transition-all hover:rounded-2xl hover:bg-[#23a55a] hover:text-white sm:h-12 sm:w-12"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => select("welcome")}
            aria-label="Go to the welcome channel"
            title="Discover — back to welcome"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#26263a] text-[#23a55a] transition-all hover:rounded-2xl hover:bg-[#23a55a] hover:text-white sm:h-12 sm:w-12"
          >
            <Compass className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Channel list */}
        <div
          className={`${mobilePane === "list" ? "flex" : "hidden"} min-w-0 flex-1 flex-col bg-[#171724] md:flex md:w-60 md:flex-none lg:w-64`}
        >
          <div className="relative shrink-0">
            <img src={bannerArt} alt="" className="h-24 w-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#171724] via-transparent to-black/30" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-2">
              <p className="font-display text-base font-black tracking-tight text-white drop-shadow">
                MuseAi Social
              </p>
              <ChevronDown className="h-5 w-5 text-white/80" aria-hidden="true" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] px-4 py-2">
            <Gem className="h-4 w-4 shrink-0 text-[var(--pink)]" aria-hidden="true" />
            <span className="text-xs font-bold text-[var(--dim)]">Level 2</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#26263a]">
              <span className="block h-full w-2/3 rounded-full bg-[var(--pink)]" />
            </span>
            <span className="text-[11px] text-[var(--faint)]">9 / 14 boosts</span>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {CATEGORIES.map((cat) => {
              const isCollapsed = collapsed.has(cat.name);
              return (
                <div key={cat.name} className="mb-1">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    aria-expanded={!isCollapsed}
                    className="flex w-full items-center gap-1 rounded px-1.5 py-1.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--faint)] hover:text-[var(--dim)]"
                  >
                    <ChevronDown
                      className={`h-3 w-3 shrink-0 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                      aria-hidden="true"
                    />
                    {cat.name}
                  </button>
                  {!isCollapsed &&
                    cat.channels.map((ch) => {
                      const active = ch.id === selectedId;
                      const unread = isUnread(ch.id, ch.unread);
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => select(ch.id)}
                          aria-current={active ? "true" : undefined}
                          className={`relative flex w-full items-center gap-1.5 rounded-lg px-2 py-[7px] text-left text-sm ${
                            active
                              ? "bg-[#2b2b3d] font-semibold text-white"
                              : unread
                                ? "font-semibold text-[var(--text)] hover:bg-[#22222f]"
                                : "text-[var(--dim)] hover:bg-[#22222f] hover:text-[var(--text)]"
                          }`}
                        >
                          {unread && (
                            <span
                              className="absolute -left-2 top-1/2 h-2.5 w-1 -translate-y-1/2 rounded-r bg-white"
                              aria-hidden="true"
                            />
                          )}
                          {ch.id === "agent-only-forum" ? (
                            <Lock className="h-4 w-4 shrink-0 text-[var(--faint)]" aria-hidden="true" />
                          ) : (
                            <Hash className="h-4 w-4 shrink-0 text-[var(--faint)]" aria-hidden="true" />
                          )}
                          <span className="min-w-0 flex-1 truncate">{ch.name}</span>
                          {ch.members && (
                            <span className="shrink-0 rounded-full bg-[#26263a] px-1.5 py-0.5 text-[10px] font-bold text-[#b7a6ff]">
                              {ch.members}
                            </span>
                          )}
                          {unread && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#f23f43]" aria-label="Unread" />
                          )}
                        </button>
                      );
                    })}
                </div>
              );
            })}

            {/* Voice channels */}
            <div className="mb-1 mt-2">
              <p className="flex items-center gap-1 px-1.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--faint)]">
                <ChevronDown className="h-3 w-3 shrink-0" aria-hidden="true" />
                Voice channels
              </p>
              {VOICE_CHANNELS.map((vc) => (
                <div key={vc.name}>
                  <div className="flex w-full items-center gap-1.5 rounded-lg px-2 py-[7px] text-sm text-[var(--dim)]">
                    <Volume2 className="h-4 w-4 shrink-0 text-[var(--faint)]" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{vc.name}</span>
                    {vc.occupants.length > 0 && (
                      <span className="shrink-0 rounded-full bg-[#26263a] px-1.5 py-0.5 text-[10px] font-bold text-[#b7a6ff]">
                        {vc.occupants.length} in voice
                      </span>
                    )}
                  </div>
                  {vc.occupants.map((o) => (
                    <div key={o.name} className="flex items-center gap-2 py-1 pl-9 pr-2 text-sm text-[var(--dim)]">
                      {o.name === "Git-FED" ? (
                        <img src={avatarImg} alt="" className="h-4 w-4 rounded-full object-cover" />
                      ) : (
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-white ${o.speaking ? "ring-2 ring-[#23a55a]" : ""}`}
                          style={{ background: authorStyle(o.name).bg }}
                          aria-hidden="true"
                        >
                          {o.name.charAt(0)}
                        </span>
                      )}
                      <span className={o.speaking ? "font-semibold text-white" : ""}>{o.name}</span>
                      {o.speaking ? (
                        <Mic className="h-3.5 w-3.5 text-[#23a55a]" aria-hidden="true" />
                      ) : (
                        <MicOff className="h-3.5 w-3.5 text-[#f23f43]" aria-hidden="true" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* User panel */}
          <div className="flex shrink-0 items-center gap-2 bg-[#101018] px-2.5 py-2">
            <span className="relative shrink-0">
              <img src={avatarImg} alt="" className="h-8 w-8 rounded-full object-cover" />
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#101018] bg-[#23a55a]"
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="font-display block truncate text-sm font-extrabold">Git-FED</span>
              <span className="block truncate text-[11px] text-[var(--dim)]">
                {deafened ? "Deafened" : muted ? "Muted" : "Owner · online"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-pressed={muted}
              aria-label={muted ? "Unmute microphone" : "Mute microphone"}
              title={muted ? "Unmute" : "Mute"}
              className={`rounded-md p-1.5 hover:bg-[#26263a] ${muted ? "text-[#f23f43]" : "text-[var(--dim)]"}`}
            >
              {muted ? <MicOff className="h-5 w-5" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setDeafened((d) => !d);
                if (!deafened) setMuted(true);
              }}
              aria-pressed={deafened}
              aria-label={deafened ? "Undeafen" : "Deafen"}
              title={deafened ? "Undeafen" : "Deafen"}
              className={`rounded-md p-1.5 hover:bg-[#26263a] ${deafened ? "text-[#f23f43]" : "text-[var(--dim)]"}`}
            >
              <Headphones className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setShowMembers((s) => !s)}
              aria-pressed={showMembers}
              aria-label="Toggle member list"
              title="Toggle member list"
              className="rounded-md p-1.5 text-[var(--dim)] hover:bg-[#26263a]"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Main pane */}
        <div className={`${mobilePane === "main" ? "flex" : "hidden"} min-w-0 flex-1 flex-col bg-[var(--surface)] md:flex`}>
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
            <button
              type="button"
              onClick={() => setMobilePane("list")}
              aria-label="Back to channel list"
              className="flex items-center gap-0.5 rounded-full border border-[var(--border)] px-2 py-1 text-xs font-bold text-[var(--dim)] md:hidden"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Channels
            </button>
            <Hash className="h-5 w-5 shrink-0 text-[var(--faint)]" aria-hidden="true" />
            <h2 className="font-display shrink-0 truncate text-lg font-extrabold">{channel.name}</h2>
            {channel.members && (
              <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[#26263a] px-2 py-0.5 text-xs font-bold text-[#b7a6ff] sm:flex">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                {channel.members}
              </span>
            )}
            <span className="hidden min-w-0 truncate border-l border-[var(--border)] pl-3 text-sm text-[var(--dim)] lg:block">
              {channel.desc}
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setNotifOff((n) => !n)}
                aria-pressed={notifOff}
                aria-label={notifOff ? "Unmute channel notifications" : "Mute channel notifications"}
                title={notifOff ? "Notifications off" : "Notifications on"}
                className="rounded-md p-1.5 text-[var(--dim)] hover:bg-[#26263a] hover:text-white"
              >
                {notifOff ? <BellOff className="h-5 w-5" aria-hidden="true" /> : <Bell className="h-5 w-5" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => pinnedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                aria-label="Jump to pinned messages"
                title="Pinned messages"
                className="rounded-md p-1.5 text-[var(--dim)] hover:bg-[#26263a] hover:text-white"
              >
                <Pin className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setShowMembers((s) => !s)}
                aria-pressed={showMembers}
                aria-label="Toggle member list"
                title="Member list"
                className={`hidden rounded-md p-1.5 hover:bg-[#26263a] hover:text-white xl:block ${showMembers ? "text-white" : "text-[var(--dim)]"}`}
              >
                <Users className="h-5 w-5" aria-hidden="true" />
              </button>
              <span className="relative ml-1 hidden md:block">
                <Search
                  className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--faint)]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  aria-label={`Search messages in ${channel.name}`}
                  className="w-36 rounded-md bg-[#101018] py-1.5 pl-8 pr-2 text-sm text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] lg:w-44"
                />
              </span>
            </span>
          </div>

          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#26263a]">
                  <Hash className="h-8 w-8 text-white" aria-hidden="true" />
                </div>
                <h3 className="font-display mt-3 text-2xl font-black sm:text-3xl">
                  Welcome to #{channel.name}!
                </h3>
                <p className="mt-1 text-sm text-[var(--dim)]">
                  This is the very beginning of the #{channel.name} channel. {channel.desc}
                </p>

                <div className="my-5 flex items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1 bg-[var(--border)]" />
                  <span className="rounded-full bg-[#26263a] px-2.5 py-0.5 text-[11px] font-bold text-[var(--dim)]">
                    November 24, 2026
                  </span>
                  <span className="h-px flex-1 bg-[var(--border)]" />
                </div>

                {nothingFound && (
                  <p className="py-6 text-center text-sm text-[var(--dim)]">
                    No messages in #{channel.name} match “{query}”.
                  </p>
                )}

                {topicVisible && (
                  <ChatMessage author="Mod Bot" time="11/24/2026 9:00 AM" text={channel.topic} seed={channel.name.length} />
                )}

                <div ref={pinnedRef} className="scroll-mt-4">
                  {visiblePinned.map((msg, i) => (
                    <ChatMessage
                      key={i}
                      author={msg.author}
                      time={`11/24/2026 9:${String(12 + i * 7).padStart(2, "0")} AM`}
                      text={msg.text}
                      pinned
                      seed={msg.text.length + i}
                    />
                  ))}
                </div>

                {visibleLinks.length > 0 && (
                  <ChatMessage
                    author="Mod Bot"
                    time="11/24/2026 10:05 AM"
                    text={`The real communities for #${channel.name} — every one of these came out of the research sweeps:`}
                    seed={channel.id.length + 3}
                  >
                    <div className="mt-2 grid max-w-xl gap-2">
                      {visibleLinks.map((link) => {
                        const inner = (
                          <>
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--faint)]">
                              Community link
                            </span>
                            <span className="font-display mt-0.5 flex items-center gap-1.5 font-extrabold text-[#7dd3fc]">
                              {link.label}
                              {link.href && <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                            </span>
                            {link.detail && (
                              <span className="mt-0.5 block text-sm leading-snug text-[#cfcfe0]">{link.detail}</span>
                            )}
                            <span className="mt-1.5 block text-[11px] text-[var(--faint)]">
                              {link.href
                                ? "Muse AI community map · Nov 2026 sweeps"
                                : "Listed in the sweeps — no public link found"}
                            </span>
                          </>
                        );
                        const cls =
                          "block rounded-md border-l-4 bg-[#14141f] px-3.5 py-2.5";
                        return link.href ? (
                          <a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className={`${cls} transition-colors hover:bg-[#191926]`}
                            style={{ borderLeftColor: embedColor }}
                          >
                            {inner}
                          </a>
                        ) : (
                          <div key={link.label} className={cls} style={{ borderLeftColor: embedColor }}>
                            {inner}
                          </div>
                        );
                      })}
                    </div>
                  </ChatMessage>
                )}

                {(localMsgs[channel.id] ?? []).map((m, i) => (
                  <ChatMessage
                    key={i}
                    author={m.author}
                    time="Just now"
                    text={m.text}
                    seed={m.text.length + i}
                  />
                ))}
              </div>

              {/* Message composer */}
              <form onSubmit={send} className="shrink-0 px-4 pb-4 sm:px-5">
                <div className="flex items-center gap-2 rounded-xl bg-[#26263a] px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => setDraft((d) => `${d}#`)}
                    aria-label="Insert a channel hash into your message"
                    title="Insert #"
                    className="shrink-0 rounded-full p-1 text-[var(--dim)] hover:text-white"
                  >
                    <PlusCircle className="h-6 w-6" aria-hidden="true" />
                  </button>
                  <label htmlFor="server-composer" className="sr-only">
                    Message the {channel.name} channel
                  </label>
                  <input
                    id="server-composer"
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Message #${channel.name}`}
                    maxLength={500}
                    className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    aria-label={`Send message to ${channel.name}`}
                    title="Send"
                    className="shrink-0 rounded-full p-1.5 text-[var(--dim)] transition-colors hover:text-white disabled:opacity-40"
                  >
                    <SendHorizontal className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-1.5 px-1 text-[11px] text-[var(--faint)]">
                  Messages you send here stay in this preview — post for real on the Board tab.
                </p>
              </form>
            </div>

            {/* Member list */}
            {showMembers && (
              <aside
                className="hidden w-60 shrink-0 overflow-y-auto border-l border-[var(--border)] bg-[#171724] px-3 py-4 xl:block"
                aria-label="Member list"
              >
                {MEMBER_GROUPS.map((g) => (
                  <div key={g.name} className="mb-5">
                    <p className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--faint)]">
                      {g.name} — {g.members.length}
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      {g.members.map((m) => (
                        <div
                          key={m.name}
                          className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-[#22222f] ${
                            m.status === "offline" ? "opacity-50" : ""
                          }`}
                        >
                          <span className="relative shrink-0">
                            {m.avatar ? (
                              <img src={m.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <span
                                className="font-display flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white"
                                style={{ background: m.bg }}
                                aria-hidden="true"
                              >
                                {m.name.charAt(0)}
                              </span>
                            )}
                            <span
                              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#171724]"
                              style={{ background: STATUS_DOT[m.status] }}
                              aria-hidden="true"
                            />
                          </span>
                          <span className="min-w-0 leading-tight">
                            <span className="flex items-center gap-1.5">
                              <span className="font-display truncate text-sm font-bold" style={{ color: m.color }}>
                                {m.name}
                              </span>
                              {m.bot && (
                                <span className="shrink-0 rounded bg-[var(--accent)] px-1 py-px text-[9px] font-bold uppercase tracking-wide text-white">
                                  Bot
                                </span>
                              )}
                            </span>
                            {m.activity && (
                              <span className="block truncate text-[11px] text-[var(--dim)]">{m.activity}</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="px-1 text-[11px] leading-snug text-[var(--faint)]">
                  Sources: 75-community sweep, Nov 7 2026 · 50-worker sweep, Nov 24 2026
                </p>
              </aside>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
