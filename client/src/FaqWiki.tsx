import { useMemo, useState } from "react";

import faqHero from "./assets/faq-hero.webp";
import wikiHero from "./assets/wiki-hero.webp";
import wikiGettingStarted from "./assets/wiki-getting-started.webp";
import wikiMuseBasics from "./assets/wiki-muse-basics.webp";
import wikiGlasses from "./assets/wiki-glasses.webp";
import wikiMetaAiApp from "./assets/wiki-meta-ai-app.webp";
import wikiIntegrations from "./assets/wiki-integrations.webp";
import wikiRules from "./assets/wiki-rules.webp";
import wikiSkills from "./assets/wiki-skills.webp";
import wikiGlossary from "./assets/wiki-glossary.webp";

// Same delete rule sentence used across the board UI.
const DELETE_RULES_LINE =
  "Only admin can delete any post. You can only delete posts with your username on them.";

/* ---------------- FAQ data ---------------- */

type FaqItem = {
  q: string;
  a: string;
  wikiPage?: string;
  wikiLabel?: string;
};

type FaqGroup = { name: string; items: FaqItem[] };

const FAQ_GROUPS: FaqGroup[] = [
  {
    name: "Getting started",
    items: [
      {
        q: "What is MuseAi Social?",
        a: "A learn-and-build community for people who use Muse AI with Meta Glasses, the Meta AI app, and Meta integrations. Members post what they learned, what they built, and what went wrong, so the next person starts further ahead. Reading is public; posting takes a free account.",
        wikiPage: "getting-started",
        wikiLabel: "Wiki: Getting started",
      },
      {
        q: "What is Muse AI?",
        a: "Muse AI is the assistant platform this community is built around: an AI agent you talk to in plain language that can research, write, build, and connect to tools and skills. Here we focus on using it with Meta hardware and Meta apps.",
        wikiPage: "muse-ai-basics",
        wikiLabel: "Wiki: Muse AI basics",
      },
      {
        q: "What topics are allowed here?",
        a: "Posts use five topics: Learn (what you figured out), Build (what you made), Help (a question you are stuck on), Show (a result worth seeing), and News (changes and releases). Subjects are Meta Glasses, the Meta AI app, and Meta integrations. If it helps someone use Muse with Meta gear, it fits.",
        wikiPage: "posting-rules",
        wikiLabel: "Wiki: Posting and community rules",
      },
    ],
  },
  {
    name: "Account and username",
    items: [
      {
        q: "How do I create an account and pick a username?",
        a: "Tap Login, then Create Account. Enter your email, a password, and a username of 3 to 20 characters using letters, numbers, and underscore. That username is the name shown on everything you post here.",
        wikiPage: "getting-started",
        wikiLabel: "Wiki: Getting started",
      },
      {
        q: "Why is my email never shown?",
        a: "Your email is only your sign-in. Posts, replies, and your profile all show your username, never your email address, so you can take part without handing your inbox to the whole board.",
      },
      {
        q: "How do I change my username?",
        a: "Sign in, open your account from the pill in the top bar, type a new username in the Change username box, and save. Usernames are unique, and the username admin can only ever belong to one account.",
        wikiPage: "getting-started",
        wikiLabel: "Wiki: Getting started",
      },
    ],
  },
  {
    name: "Posting and deleting",
    items: [
      {
        q: "How do I make a post?",
        a: "Sign in with your username, tap New post, pick a topic (Learn, Build, Help, Show, or News) and a subject, write a title and body, and publish. It goes straight into the live feed under your username.",
        wikiPage: "posting-rules",
        wikiLabel: "Wiki: Posting and community rules",
      },
      {
        q: "Who can delete a post?",
        a: `${DELETE_RULES_LINE} The same rule covers replies: admin can delete any reply, and everyone else can only delete replies with their own username on them. Starter posts have no regular author, so only admin can delete them.`,
        wikiPage: "posting-rules",
        wikiLabel: "Wiki: Posting and community rules",
      },
      {
        q: "What is the Servers tab?",
        a: "A Discord-style directory of the wider Muse AI community: servers and groups across Discord, Reddit, Facebook, Telegram, GitHub, Skool, and forums, sorted into channels like invite codes, builds and workflows, prompts and tips, and help and onboarding, with member counts and links.",
      },
    ],
  },
  {
    name: "Meta Glasses",
    items: [
      {
        q: "How do Meta Glasses work with Muse?",
        a: "The glasses capture photos, video, and audio hands-free, and the Meta AI app on your phone is the bridge: captures land in the app, where Muse workflows can pick them up, sort them, and turn them into posts, notes, and files. The board's Learn and Build posts show the flows members actually use.",
        wikiPage: "meta-glasses",
        wikiLabel: "Wiki: Meta Glasses guide",
      },
      {
        q: "Can I use the glasses as a Bluetooth headset?",
        a: "Yes. The glasses pair as a Bluetooth audio device, so calls and music play through the open-ear speakers while the microphones pick up your voice. Members share their pairing notes and call-quality tips in the Learn posts on the board.",
        wikiPage: "meta-glasses",
        wikiLabel: "Wiki: Meta Glasses guide",
      },
    ],
  },
  {
    name: "Meta AI app",
    items: [
      {
        q: "What can the Meta AI app do with my glasses photos?",
        a: "Photos and clips from the glasses sync into the Meta AI app, where you can ask about what is in them, edit, and share them onward. Community flows cover getting captures off the glasses and into Drive, chats, and posts without cables.",
        wikiPage: "meta-ai-app",
        wikiLabel: "Wiki: Meta AI app guide",
      },
    ],
  },
  {
    name: "Community",
    items: [
      {
        q: "How do Community rooms work?",
        a: "The Community page holds the live Discord widget and a list of rooms. Anyone can create a room under a subject (Meta Glasses, Meta AI app, or Meta integrations) with the Create a room form, and rooms are saved on the site for everyone to see.",
        wikiPage: "posting-rules",
        wikiLabel: "Wiki: Posting and community rules",
      },
      {
        q: "What is the Support 18+ gate?",
        a: "The Support page asks you to confirm you are 18 or older before it shows the support and payment provider options. The gate keeps the adult-rated provider choices behind one clear tap, and every payment itself happens on the provider's own page.",
      },
    ],
  },
];

/* ---------------- Wiki data ---------------- */

type WikiSection = { heading: string; body: string[] };
type WikiPage = {
  key: string;
  title: string;
  img: string;
  imgAlt: string;
  intro: string;
  sections: WikiSection[];
};

const WIKI_PAGES: WikiPage[] = [
  {
    key: "getting-started",
    title: "Getting started",
    img: wikiGettingStarted,
    imgAlt: "Illustration of a doorway with glowing stepping stones leading to smart glasses and a friendly robot assistant",
    intro:
      "New here? This page walks you from first visit to first post: what the board is, how accounts work, and where everything lives.",
    sections: [
      {
        heading: "The board in one minute",
        body: [
          "The Board is the main feed. Every post has a topic (Learn, Build, Help, Show, or News) and a subject (Meta Glasses, Meta AI app, or Meta integrations). Use the search box and the topic and subject filters to narrow the feed, upvote what helped you, and save posts you want to come back to.",
          "Reading is always public. You only need an account to post, reply, and vote under your own name.",
        ],
      },
      {
        heading: "Create your account",
        body: [
          "Tap Login, choose Create Account, and enter an email, a password, and a username. Usernames are 3 to 20 characters: letters, numbers, and underscore only, and each one is unique.",
          "Your username is your public name here. Your email is only a sign-in and is never shown on the site. If you sign in before picking a username, the site asks you to set one before you can post.",
        ],
      },
      {
        heading: "Change your username",
        body: [
          "Open your account from the pill in the top bar, type the new name in the Change username box, and save. The change applies to your profile right away.",
          "One name is special: admin. The username admin can only ever belong to one account, and once an admin account exists nobody else can take or change to it.",
        ],
      },
      {
        heading: "Find your way around",
        body: [
          "Board is the feed. Servers is the directory of the wider Muse AI community. Community holds the Discord widget and rooms. Support holds the provider options behind an 18+ gate. FAQ answers the common questions, and this Wiki holds the longer guides.",
        ],
      },
    ],
  },
  {
    key: "muse-ai-basics",
    title: "Muse AI basics",
    img: wikiMuseBasics,
    imgAlt: "Illustration of a friendly robot head with a glowing speech bubble, orbiting chat bubbles, and a microphone",
    intro:
      "Muse AI is the assistant this whole community is built around. This page covers what it is, how people here talk to it, and the words you will see in posts.",
    sections: [
      {
        heading: "What Muse AI is",
        body: [
          "Muse AI is an AI agent: you describe what you want in plain language, and it works on it with you, researching, writing, building pages and tools, and checking its own results. It is not a search box; it holds a conversation and remembers the thread of what you are doing.",
        ],
      },
      {
        heading: "Learn: how people prompt it",
        body: [
          "The pattern that works here is simple: say the outcome, give the facts it cannot guess, and ask for the work in the form you want back. Members post their best prompts in Learn and Build posts, including the exact wording that got a good result.",
          "When an answer looks wrong, say so plainly and show what right looks like. The follow-up fix is usually faster than starting over.",
        ],
      },
      {
        heading: "Help: when you are stuck",
        body: [
          "Post in the Help topic with what you tried, what happened, and what you expected. Screenshots of the exact screen and the exact wording of any error message get the fastest useful replies.",
        ],
      },
      {
        heading: "News: keeping up",
        body: [
          "Muse and Meta both ship changes often. The News topic collects release notes, new features, and behaviour changes that affect glasses and app workflows, so check it before rebuilding a flow that suddenly broke.",
        ],
      },
    ],
  },
  {
    key: "meta-glasses",
    title: "Meta Glasses guide",
    img: wikiGlasses,
    imgAlt: "Illustration of smart glasses with sound waves and a photo frame icon floating beside them on a sunny street",
    intro:
      "Meta Glasses (Ray-Ban Meta and Oakley Meta) put a camera, microphones, and open-ear speakers in normal-looking frames. This guide covers the parts that matter for Muse workflows.",
    sections: [
      {
        heading: "What the glasses do",
        body: [
          "Tap the capture button or use your voice to take photos and video from your own point of view, hands-free. Speakers sit in the arms for calls, music, and assistant answers, and the microphone array picks up your voice for commands.",
          "Captures sync to the Meta AI app on your paired phone. That app is the bridge between the glasses and everything else, including Muse flows.",
        ],
      },
      {
        heading: "Learn: everyday flows",
        body: [
          "Members use the glasses as a Bluetooth headset for calls, capture first-person clips for build logs, and grab quick photos that the Meta AI app can describe and sort. The board's Learn posts cover first-week impressions, outdoor tests, and comfort notes for long sessions.",
        ],
      },
      {
        heading: "Build: from capture to post",
        body: [
          "A common build: capture on the glasses, let the photos land in the Meta AI app, share them into a Muse flow that files, captions, and drafts a post. The Build topic has step-by-step versions, including Drive-based filing for captures.",
        ],
      },
      {
        heading: "Help: pairing and audio basics",
        body: [
          "If the glasses will not pair, forget them in the phone's Bluetooth list, put them in the case, and pair again from the Meta AI app. For headset use, pair them as a normal Bluetooth audio device and pick them as the call output.",
        ],
      },
    ],
  },
  {
    key: "meta-ai-app",
    title: "Meta AI app guide",
    img: wikiMetaAiApp,
    imgAlt: "Illustration of a smartphone with a glowing AI chat screen, floating photo thumbnails, and a magic wand editing a sparkle",
    intro:
      "The Meta AI app is the phone companion for Meta Glasses and the home of Meta's assistant features. This page covers the parts community members rely on.",
    sections: [
      {
        heading: "The bridge for your glasses",
        body: [
          "Everything the glasses capture lands in the Meta AI app: photos, clips, and voice notes. From there you can view, ask about, edit, and share captures, which is why most Muse workflows start with getting media out of this app cleanly.",
        ],
      },
      {
        heading: "Learn: asking about photos",
        body: [
          "You can ask the app what is in a photo, get a description, and pull out details worth filing. Members share which questions get the most useful answers for receipts, whiteboards, and product shots.",
        ],
      },
      {
        heading: "Build: sharing captures onward",
        body: [
          "The share sheet is the integration point: send a capture to Drive, a chat, or a Muse flow in a couple of taps. Build posts cover share targets for WhatsApp and other apps, plus naming and filing habits that keep big capture days sortable.",
        ],
      },
      {
        heading: "Show: edits worth copying",
        body: [
          "The Show topic collects before-and-after edits made from glasses photos in the app, with the exact steps, so you can copy the look instead of guessing at it.",
        ],
      },
    ],
  },
  {
    key: "meta-integrations",
    title: "Meta integrations",
    img: wikiIntegrations,
    imgAlt: "Illustration of smart glasses, a phone, a laptop, and a car dashboard connected by glowing dotted lines and puzzle pieces",
    intro:
      "Integrations are where Muse, Meta Glasses, and the Meta AI app stop being separate tools: files move, captures file themselves, and one flow hands off to the next.",
    sections: [
      {
        heading: "The shape of a good integration",
        body: [
          "Every working integration here has three parts: a trigger (a capture, a share, a new file), a place the data lands (Drive, a chat, the board), and a Muse flow that does something useful with it, like sorting, captioning, or drafting.",
        ],
      },
      {
        heading: "Build: flows members run",
        body: [
          "Drive flows that file glasses captures by day, share flows that send build updates to WhatsApp, and headset-plus-glasses setups for drive time all live in the Build topic with the steps to copy them.",
        ],
      },
      {
        heading: "Learn: what connects to what",
        body: [
          "The glasses talk to the Meta AI app. The app's share sheet talks to almost everything else. Muse skills and connectors pick up from the shared file or message. Knowing which hop you are fixing saves hours: most failures are a share target or a permission, not the glasses.",
        ],
      },
      {
        heading: "Help: when a flow breaks",
        body: [
          "Check in order: is the capture in the app, did the share reach the target, and does the receiving flow still have permission? Post in Help with the step where it stops and the exact message you see.",
        ],
      },
    ],
  },
  {
    key: "posting-rules",
    title: "Posting and community rules",
    img: wikiRules,
    imgAlt: "Illustration of a community notice board with pinned notes, a pencil, a heart, an upvote arrow, and a shield with a checkmark",
    intro:
      "Short rules, plainly stated: what to post, how rooms work, and exactly who can delete what.",
    sections: [
      {
        heading: "Posting",
        body: [
          "Post under the topic that matches: Learn for what you figured out, Build for what you made, Help for a question, Show for a result, News for changes. Pick the closest subject: Meta Glasses, Meta AI app, or Meta integrations.",
          "Write titles that say the thing itself, and put the useful detail in the body: what you did, what happened, what you would change. Separate paragraphs with a blank line.",
        ],
      },
      {
        heading: "Deleting: the exact rule",
        body: [
          DELETE_RULES_LINE,
          "Admin is the account whose username is admin. Only admin can delete any post and any reply, including the starter posts, which have no regular author. Everyone else can only delete a post or reply when it carries their own username and their own account: if your name is not on it, you cannot delete it.",
          "The rule is enforced by the site itself, not just by hiding the button: a delete request from anyone who is not admin and not the author is rejected. The username admin can only ever belong to one account, so it cannot be taken or copied by a second account.",
        ],
      },
      {
        heading: "Community rooms",
        body: [
          "Rooms live on the Community page next to the Discord widget. Anyone can create a room under a subject with the Create a room form; give it a clear name that says what the room is for. Rooms are saved on the site and listed for everyone.",
        ],
      },
      {
        heading: "Be useful, be kind",
        body: [
          "Answer the question that was asked. Share what actually worked, including the parts that failed. No spam, no scraped reposts, and no pretending someone else's build is yours.",
        ],
      },
    ],
  },
  {
    key: "skills-github",
    title: "Skills, connectors and GitHub",
    img: wikiSkills,
    imgAlt: "Illustration of glowing skill cards and plug connectors over a laptop showing a branching code tree, with a star and fork symbol",
    intro:
      "Skills and connectors are how Muse reaches beyond chat: reusable playbooks and live links to services. GitHub is where a lot of that work is shared.",
    sections: [
      {
        heading: "What a skill is",
        body: [
          "A skill is a saved playbook for a repeat job: the steps, the checks, and the wording that worked, written down so the agent does it the same way every time. Community members share skills for capture filing, posting runs, and research sweeps.",
        ],
      },
      {
        heading: "What a connector is",
        body: [
          "A connector links Muse to a service, like a drive, a mailbox, or a code host, so it can read and act there with your permission. The Servers tab lists community hubs where connector and skill projects are discussed, including GitHub collections with thousands of shared skills.",
        ],
      },
      {
        heading: "Build: sharing on GitHub",
        body: [
          "Builders publish skills, invite hubs, and helper tools as GitHub repositories. A clear README, a manifest of what the tool needs, and one worked example get a repo starred and reused; the Build topic collects the ones this community rates.",
        ],
      },
      {
        heading: "Help: picking safe projects",
        body: [
          "Read the code or have Muse read it before you run anything. Check who maintains the repo, when it last changed, and what permissions it asks for. If a project wants broad access for a narrow job, skip it.",
        ],
      },
    ],
  },
  {
    key: "glossary",
    title: "Glossary",
    img: wikiGlossary,
    imgAlt: "Illustration of an open dictionary with a magnifying glass, floating tag shapes, and alphabet blocks",
    intro: "The words this community uses, in plain language.",
    sections: [
      {
        heading: "Admin",
        body: [
          "The account whose username is admin. Admin can delete any post and any reply. The username admin can only ever belong to one account.",
        ],
      },
      {
        heading: "Board",
        body: ["The main feed of posts on MuseAi Social, newest first."],
      },
      {
        heading: "Capture",
        body: [
          "A photo, video, or voice note taken on Meta Glasses, which syncs to the Meta AI app on your phone.",
        ],
      },
      {
        heading: "Connector",
        body: [
          "A link between Muse and an outside service, so Muse can read or act there with your permission.",
        ],
      },
      {
        heading: "Integration",
        body: [
          "Two or more tools wired together so data moves between them without manual copying, like glasses captures filing themselves into Drive.",
        ],
      },
      {
        heading: "Room",
        body: [
          "A named space on the Community page, created under a subject, for a narrower conversation than the main board.",
        ],
      },
      {
        heading: "Skill",
        body: [
          "A saved playbook that teaches Muse a repeat job: the steps, checks, and wording that worked.",
        ],
      },
      {
        heading: "Starter post",
        body: [
          "One of the original posts the board launched with. Starter posts have no regular author, so only admin can delete them.",
        ],
      },
      {
        heading: "Subject",
        body: [
          "What a post is about: Meta Glasses, the Meta AI app, or Meta integrations. Every post has one subject and one topic.",
        ],
      },
      {
        heading: "Topic",
        body: [
          "The kind of post: Learn, Build, Help, Show, or News. Every post has one topic and one subject.",
        ],
      },
      {
        heading: "Username",
        body: [
          "Your public name on the site, 3 to 20 characters of letters, numbers, and underscore. It is what shows on your posts; your email is never displayed.",
        ],
      },
    ],
  },
];

/* ---------------- FAQ view ---------------- */

export function FaqView({
  onOpenWiki,
}: {
  onOpenWiki: (page: string) => void;
}) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      FAQ_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            !term ||
            it.q.toLowerCase().includes(term) ||
            it.a.toLowerCase().includes(term),
        ),
      })).filter((g) => g.items.length > 0),
    [term],
  );
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <section className="py-8">
      <div className="grid items-center gap-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-[var(--accent)]">
            FAQ / PLAIN ANSWERS
          </p>
          <h1 className="font-display mt-3 text-4xl font-black leading-tight">
            Questions, answered straight<span className="text-[var(--pink)]">.</span>
          </h1>
          <p className="mt-3 max-w-md text-[var(--dim)]">
            The short version of how MuseAi Social, Muse AI, Meta Glasses, and
            the Meta AI app fit together. Search below, or open a question for
            the plain answer.
          </p>
          <label className="mt-5 grid max-w-md gap-1 text-sm font-semibold">
            Search the FAQ
            <input
              type="search"
              aria-label="Search the FAQ"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: delete, username, glasses…"
              className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>
        <img
          src={faqHero}
          alt="Illustration of community members with question and lightbulb speech bubbles around a pair of smart glasses"
          className="w-full rounded-[var(--radius)] border border-[var(--border)] object-cover"
        />
      </div>

      <div className="mt-10 grid gap-10">
        {groups.map((g) => (
          <div key={g.name}>
            <h2 className="font-display text-2xl font-extrabold">{g.name}</h2>
            <div className="mt-4 grid gap-3">
              {g.items.map((it) => (
                <details
                  key={it.q}
                  className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4"
                >
                  <summary className="cursor-pointer font-display text-base font-bold">
                    {it.q}
                  </summary>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--dim)]">
                    {it.a}
                  </p>
                  {it.wikiPage && (
                    <button
                      type="button"
                      onClick={() => onOpenWiki(it.wikiPage ?? "getting-started")}
                      aria-label={`Open ${it.wikiLabel ?? "the wiki page"} for: ${it.q}`}
                      className="mt-3 rounded-full bg-[#26263a] px-4 py-1.5 text-sm font-bold text-[#b7a6ff]"
                    >
                      {it.wikiLabel ?? "Read more in the Wiki"} →
                    </button>
                  )}
                </details>
              ))}
            </div>
          </div>
        ))}
        {total === 0 && (
          <p className="text-[var(--dim)]">
            No questions match that search. Try a shorter word, like delete,
            username, or glasses.
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------------- Wiki view ---------------- */

export function WikiView({ initialPage }: { initialPage: string }) {
  const [pageKey, setPageKey] = useState<string>(
    WIKI_PAGES.some((p) => p.key === initialPage) ? initialPage : "getting-started",
  );
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      WIKI_PAGES.filter(
        (p) =>
          !term ||
          p.title.toLowerCase().includes(term) ||
          p.intro.toLowerCase().includes(term) ||
          p.sections.some(
            (s) =>
              s.heading.toLowerCase().includes(term) ||
              s.body.some((b) => b.toLowerCase().includes(term)),
          ),
      ),
    [term],
  );
  const page = WIKI_PAGES.find((p) => p.key === pageKey) ?? WIKI_PAGES[0];

  if (!page) return null;

  return (
    <section className="py-8">
      <div className="grid items-center gap-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-[var(--accent)]">
            WIKI / THE LONG VERSION
          </p>
          <h1 className="font-display mt-3 text-4xl font-black leading-tight">
            The community handbook<span className="text-[var(--pink)]">.</span>
          </h1>
          <p className="mt-3 max-w-md text-[var(--dim)]">
            Longer guides for Muse AI, Meta Glasses, the Meta AI app, and Meta
            integrations, written in the board's own terms: Learn, Build, Help,
            Show, News.
          </p>
          <label className="mt-5 grid max-w-md gap-1 text-sm font-semibold">
            Search the Wiki
            <input
              type="search"
              aria-label="Search the Wiki"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: delete, pairing, skill…"
              className="rounded-lg border border-[var(--border)] bg-[#12121c] px-3 py-2.5 font-normal outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>
        <img
          src={wikiHero}
          alt="Illustration of a giant glowing open book with smart glasses, a chat bubble, and puzzle pieces on its pages, with small readers around it"
          className="w-full rounded-[var(--radius)] border border-[var(--border)] object-cover"
        />
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[220px_1fr]">
        <nav aria-label="Wiki pages" className="md:sticky md:top-32 md:self-start">
          <ul className="flex flex-wrap gap-2 md:grid md:gap-1.5">
            {matches.map((p) => (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => setPageKey(p.key)}
                  aria-current={p.key === page.key ? "page" : undefined}
                  aria-label={`Wiki page: ${p.title}`}
                  className={`rounded-full px-4 py-2 text-left text-sm font-bold md:w-full md:rounded-xl ${
                    p.key === page.key
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--surface)] text-[var(--dim)] hover:text-white"
                  }`}
                >
                  {p.title}
                </button>
              </li>
            ))}
          </ul>
          {matches.length === 0 && (
            <p className="mt-2 text-sm text-[var(--dim)]">
              No wiki pages match that search.
            </p>
          )}
        </nav>

        <article className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
          <img
            src={page.img}
            alt={page.imgAlt}
            className="h-44 w-full rounded-xl object-cover sm:h-56"
          />
          <h2 className="font-display mt-5 text-3xl font-black">{page.title}</h2>
          <p className="mt-2 max-w-3xl leading-relaxed text-[var(--dim)]">{page.intro}</p>
          {page.sections.map((s) => (
            <section key={s.heading} className="mt-6">
              <h3 className="font-display text-xl font-extrabold">{s.heading}</h3>
              {s.body.map((para, i) => (
                <p key={i} className="mt-2 max-w-3xl leading-relaxed text-[#cfcfe0]">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </section>
  );
}
