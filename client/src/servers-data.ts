/* Servers tab data — the Muse AI community map.
   Every community, count, and URL below comes from Git-FED's own research:
   - Nov 7, 2026 sweep: 15 workers x 5 = 75 Muse AI communities
     (~/workspace/muse-ai-bypass/muse-ai-communities-15-workers/MUSE-AI-COMMUNITIES-75.md)
   - Nov 24, 2026 sweep: 50 workers
     (~/workspace/your_files/muse-ai-communities-2026-11-24.md)
   Counts are as reported on those dates. MuseFM is excluded (off-limits). */

export type ServerLink = {
  label: string;
  detail?: string;
  href?: string;
};

export type PinnedMsg = {
  author: string;
  text: string;
};

export type Channel = {
  id: string;
  name: string;
  desc: string;
  topic: string;
  members?: string;
  unread?: boolean;
  pinned: PinnedMsg[];
  links: ServerLink[];
};

export type ChannelCategory = {
  name: string;
  channels: Channel[];
};

export type RailServer = {
  id: string;
  label: string;
  short: string;
  color: string;
  textColor?: string;
  channelId?: string;
  href?: string;
  own?: boolean;
};

export const RAIL_SERVERS: RailServer[] = [
  { id: "home", label: "MuseAi Social (home)", short: "M", color: "#7c5cfc", channelId: "welcome" },
  { id: "reddit", label: "Reddit", short: "R", color: "#d93900", channelId: "reddit" },
  { id: "discord", label: "Discord", short: "D", color: "#5865f2", channelId: "discord" },
  { id: "facebook", label: "Facebook", short: "f", color: "#1877f2", channelId: "facebook-groups" },
  { id: "telegram", label: "Telegram", short: "T", color: "#229ed9", channelId: "telegram" },
  { id: "github", label: "GitHub", short: "GH", color: "#3a3f4a", channelId: "github-projects" },
  { id: "skool", label: "Skool", short: "S", color: "#ffd60a", textColor: "#111111", channelId: "skool" },
  { id: "forums", label: "Forums", short: "Fo", color: "#0e7490", channelId: "forums-sites" },
  { id: "whop", label: "Whop Muse AI Community — Git-FED's own", short: "W", color: "#f472b6", href: "https://whop.com/museai/", own: true },
  { id: "token-town", label: "Token Town (MuseAi-Matches) — Git-FED's own Discord", short: "TT", color: "#26263a", channelId: "discord", own: true },
];

export const SERVER_INTRO =
  "A map of the whole Muse AI community scene, built from two research sweeps: 75 communities found by 15 workers on Nov 7, 2026, and a 50-worker sweep on Nov 24, 2026. Every channel points out to the real communities for its topic.";

export const CATEGORIES: ChannelCategory[] = [
  {
    name: "Start here",
    channels: [
      {
        id: "welcome",
        name: "welcome",
        desc: "First stop: what this server is and where everything lives.",
        topic:
          "This server is a lookalike map of every Muse AI community Git-FED's research found, organised by the topics those communities actually talk about. Pick a channel on the left, read the pinned notes, and follow the links out to the real thing.",
        unread: true,
        pinned: [
          {
            author: "Git-FED",
            text: "Welcome in. Every channel here points at a real Muse AI community found in the Nov 7 and Nov 24, 2026 sweeps. Nothing is listed that the research did not find.",
          },
          {
            author: "Server notes",
            text: "Counts are as reported on the sweep dates and drift over time. When the two sweeps disagree, the newer Nov 24 number wins.",
          },
        ],
        links: [
          {
            label: "Built with Muse",
            detail: "1,063 members — largest verified Muse-specific community site",
            href: "https://builtwithmuse.com",
          },
          {
            label: "Whop MuseAi Community",
            detail: "Git-FED's own community",
            href: "https://whop.com/museai/",
          },
        ],
      },
      {
        id: "rules",
        name: "rules",
        desc: "Short and simple: how this server runs.",
        topic:
          "The tone here copies the practical, hype-free corners of the scene: show the work, skip the token hype, and link the source. The two groups below are the model for how this server behaves.",
        pinned: [
          {
            author: "Git-FED",
            text: "Rules: 1) No hype without receipts. 2) Counts and claims need a source. 3) Invite codes live in #invite-codes only. 4) What works beats what is loud.",
          },
        ],
        links: [
          {
            label: "Members of Muse AI Community (Facebook)",
            detail: "Practical, hype-free — for students, business owners and freelancers",
            href: "https://www.facebook.com/groups/39415780621400373/",
          },
          {
            label: "Muse AI Discussion Group (Facebook)",
            detail: "Active onboarding and new-member intros",
            href: "https://www.facebook.com/groups/2263630371086017/",
          },
        ],
      },
      {
        id: "introductions",
        name: "introductions",
        desc: "Say who you are, what you use Muse for, and what you are building.",
        topic:
          "New-member intros are where the Facebook side of the scene runs warmest — the Muse AI Discussion Group was still greeting new members on Nov 19, 2026. Introduce yourself there, and in The Muse Collective, billed as the first user community for Muse.",
        pinned: [
          {
            author: "Server notes",
            text: "A good intro: where you are, what you use Muse for (glasses, app, builds, business), and one thing you are working on this week.",
          },
        ],
        links: [
          {
            label: "Muse AI Discussion Group (Facebook)",
            detail: "New-member intros running Nov 19, 2026",
            href: "https://www.facebook.com/groups/2263630371086017/",
          },
          {
            label: "The Muse Collective (Facebook)",
            detail: "Private group, created Sep 18, 2026 — billed as the first user community for Muse",
            href: "https://www.facebook.com/groups/1225415652546071/",
          },
        ],
      },
      {
        id: "invite-codes",
        name: "invite-codes",
        desc: "Invite and referral codes, swapped so both sides earn tokens.",
        topic:
          "Invite codes are the fuel of the early Muse scene: MuseInviteHub alone had 544 shared codes on Nov 7, 2026, the Muse Codes board runs a daily patrol for working codes, and r/MetaAI is full of invite and referral posts.",
        members: "544 codes",
        unread: true,
        pinned: [
          {
            author: "Server notes",
            text: "MuseInviteHub takes community submissions through GitHub Issues and a Telegram bot. The Muse AI Community invite site gives both sides 1 billion tokens per signup.",
          },
        ],
        links: [
          {
            label: "MuseInviteHub",
            detail: "544 shared codes — open-source invite-code directory",
            href: "https://muse.eplus.dev/",
          },
          {
            label: "Muse Invite Hub on GitHub",
            detail: "The repo behind the directory — submissions via Issues",
            href: "https://github.com/ePlus-DEV/muse-invite-hub",
          },
          {
            label: "Muse Codes board",
            detail: "Daily invite-code patrol, working codes listed",
            href: "https://paper-daemon.github.io/muse-codes/",
          },
          {
            label: "Muse AI Community invite-code site",
            detail: "Free invite-code sharing — both sides get 1 billion tokens",
            href: "https://muse-ai-community.vercel.app/",
          },
          {
            label: "r/MetaAI invite posts",
            detail: "20,268 members — now full of Muse invite and referral posts",
            href: "https://www.reddit.com/r/MetaAI/",
          },
        ],
      },
    ],
  },
  {
    name: "Discuss",
    channels: [
      {
        id: "general",
        name: "general",
        desc: "Everyday Muse talk that does not fit a narrower channel.",
        topic:
          "General Muse conversation lives mostly on Facebook and Reddit: the Muse AI Global Community runs tutorials and prompts for thousands of members, and r/MetaAI has become a general Muse hangout as it grows.",
        pinned: [
          {
            author: "Server notes",
            text: "If your post fits #meta-glasses, #builds-showcase or #help-troubleshooting, it will get better answers there than here.",
          },
        ],
        links: [
          {
            label: "Muse AI Global Community (Facebook)",
            detail: "Thousands of members — tutorials and prompts",
            href: "https://www.facebook.com/groups/1412860160484234/",
          },
          {
            label: "r/MetaAI (Reddit)",
            detail: "20,268 members and growing fast",
            href: "https://www.reddit.com/r/MetaAI/",
          },
        ],
      },
      {
        id: "muse-news",
        name: "muse-news",
        desc: "Launches, updates, and what changed this week.",
        topic:
          "Muse news moves first on Meta's own accounts — the official TikTok @muse hit 199,900 followers by Nov 24, 2026 — and gets catalogued by the community in awesome-muse and the nightly community reports repo.",
        unread: true,
        pinned: [
          {
            author: "Server notes",
            text: "Nov 24 sweep headline: r/MuseAgent ranked #9 fastest-growing AI subreddit, up 10.4% in 7 days, and r/MuseAgents grew 2,442.7% in about two months.",
          },
        ],
        links: [
          {
            label: "Muse on TikTok (@muse)",
            detail: "Official Meta account — 199,900 followers, 128 videos, 2.7M likes",
            href: "https://www.tiktok.com/@muse",
          },
          {
            label: "awesome-muse (GitHub)",
            detail: "Community-curated Muse guides, use cases, tools and news",
            href: "https://github.com/cszach/awesome-muse",
          },
          {
            label: "report-on-muse-ai-communities (GitHub)",
            detail: "Community learning ledger with nightly reports",
            href: "https://github.com/claypnw/report-on-muse-ai-communities",
          },
        ],
      },
      {
        id: "meta-ai-app",
        name: "meta-ai-app",
        desc: "The Meta AI app side: chat, voice, and the assistant itself.",
        topic:
          "Talk about the Meta AI app itself — the surface most new Muse users meet first. r/MetaAI started as the Meta AI community in Jan 2023 and now hosts the Muse discussion too.",
        pinned: [
          {
            author: "Server notes",
            text: "The WorldsApps Meta AI App Discussion Forum exists but was empty at sweep time — early movers can still shape it.",
          },
        ],
        links: [
          {
            label: "r/MetaAI (Reddit)",
            detail: "20,268 members — predecessor Meta AI community, now hosting Muse talk",
            href: "https://www.reddit.com/r/MetaAI/",
          },
          {
            label: "Meta AI App Discussion Forum (WorldsApps)",
            detail: "New forum — no posts yet when found",
            href: "https://worldsapps.com/discussion-meta-ai",
          },
        ],
      },
      {
        id: "meta-glasses",
        name: "meta-glasses",
        desc: "Ray-Ban and Oakley Meta glasses: captures, POV, everyday wear.",
        topic:
          "The glasses are Muse's hardware face. Builders gather in Meta's official Muse Gadgets community, and glasses troubleshooting has become a de facto Muse support topic on the Meta Community Forums.",
        pinned: [
          {
            author: "Server notes",
            text: "There is no official Muse support forum — glasses users post in the Meta Community Forums Troubleshooting (AI Glasses) board instead.",
          },
        ],
        links: [
          {
            label: "Muse Gadgets community",
            detail: "Official Meta server for Muse Gadgets builders",
            href: "https://gadgets.muse.ai/",
          },
          {
            label: "Meta Community Forums — Troubleshooting (AI Glasses)",
            detail: "Where Muse glasses users actually post",
            href: "https://communityforums.atmeta.com/troubleshooting-20",
          },
        ],
      },
      {
        id: "meta-integrations",
        name: "meta-integrations",
        desc: "Connecting Muse to the rest of your stack: files, messages, calendars.",
        topic:
          "Integrations are where Muse stops being a chatbot and starts doing errands — Drive flows, WhatsApp shares, captures filed where they belong. The awesome-muse list tracks the tools; the Gadgets community covers the hardware end.",
        pinned: [
          {
            author: "Server notes",
            text: "This board's own starter posts cover the Drive file flow and WhatsApp share flow step by step — check the Board tab.",
          },
        ],
        links: [
          {
            label: "awesome-muse (GitHub)",
            detail: "Guides, use cases, tools and news — the canonical awesome list",
            href: "https://github.com/cszach/awesome-muse",
          },
          {
            label: "Muse Gadgets community",
            detail: "Official Meta builder community",
            href: "https://gadgets.muse.ai/",
          },
        ],
      },
    ],
  },
  {
    name: "Build",
    channels: [
      {
        id: "builds-showcase",
        name: "builds-showcase",
        desc: "Finished builds and works in progress, with links.",
        topic:
          "Built with Muse is the scene's showcase wall: 1,063 members, aggregating X posts about Muse builds, with an invite-code pool and launch guides alongside.",
        unread: true,
        pinned: [
          {
            author: "Server notes",
            text: "Muse by Meta hit #5 Product of the Day on Product Hunt on Sep 9, 2026, with 427 followers and 211 upvotes — the launch post is still the showcase of record.",
          },
        ],
        links: [
          {
            label: "Built with Muse",
            detail: "1,063 members — showcase platform aggregating Muse builds",
            href: "https://builtwithmuse.com",
          },
          {
            label: "Muse by Meta on Product Hunt",
            detail: "427 followers — #5 Product of the Day, Sep 9, 2026",
            href: "https://www.producthunt.com/products/muse-22",
          },
        ],
      },
      {
        id: "workflows",
        name: "workflows",
        desc: "Multi-step agent workflows, automations, and hand-offs.",
        topic:
          "Workflow talk concentrates in the independent Muse Agent Discord — workflows, prompts and connectors were its core topics as it grew from 377 members (Nov 7) to 633 (Nov 24).",
        pinned: [
          {
            author: "Server notes",
            text: "Post workflows as steps: trigger, tools touched, where the output lands. Screenshots of the finished result beat descriptions.",
          },
        ],
        links: [
          {
            label: "Muse Agent (Discord)",
            detail: "633 members, 120 online — independent, community-run, created Sep 2026",
            href: "https://discord.com/invite/sxjhCPdEG6",
          },
          {
            label: "Built with Muse",
            detail: "Workflow write-ups and launch guides",
            href: "https://builtwithmuse.com",
          },
        ],
      },
      {
        id: "prompts-tips",
        name: "prompts-tips",
        desc: "Prompts that actually worked, with the output to prove it.",
        topic:
          "Prompt craft has dedicated corners on Telegram (MuseAI Prompts, for AI visuals) and Facebook (Muse AI — Productivity & Tips, a no-spam group for quality tips and workflows).",
        pinned: [
          {
            author: "Server notes",
            text: "House rule copied from the no-spam groups: a tip post needs the prompt and the result, not just the claim.",
          },
        ],
        links: [
          {
            label: "MuseAI Prompts Channel (Telegram)",
            detail: "Prompts and tips for AI visuals",
            href: "https://t.me/museaiprompts",
          },
          {
            label: "Muse AI — Productivity & Tips (Facebook)",
            detail: "No-spam, quality tips and workflows",
            href: "https://www.facebook.com/groups/943969982104667/",
          },
        ],
      },
      {
        id: "skills-connectors",
        name: "skills-connectors",
        desc: "Agent skills and connectors: the catalog and how to wire them.",
        topic:
          "The Awesome Muse Skills catalog lists 2,384 agent skills for Muse — the single biggest skills collection the sweeps found. If a capability exists as a skill, it is probably in there.",
        members: "2,384 skills",
        pinned: [
          {
            author: "Server notes",
            text: "On Nov 7 the same catalog was counted at 2,648 skills by content — catalogs churn fast; check the repo for the live number.",
          },
        ],
        links: [
          {
            label: "Awesome Muse Skills (GitHub)",
            detail: "Catalog of 2,384 agent skills for Muse",
            href: "https://github.com/aicodedecode/awesome-muse-skills",
          },
          {
            label: "awesome-muse (GitHub)",
            detail: "Guides, use cases, tools and news",
            href: "https://github.com/cszach/awesome-muse",
          },
        ],
      },
      {
        id: "github-projects",
        name: "github-projects",
        desc: "Repos worth starring: SDKs, skill packs, and community tools.",
        topic:
          "GitHub is where the Muse scene keeps its tools: the skills catalog, the awesome list, the invite hub, and the nightly community-reports ledger all live there.",
        pinned: [
          {
            author: "Server notes",
            text: "The official hardware SDK lives in #gadgets-hardware — facebookincubator/muse-gadget-sdk, 2,621 stars and 588 forks at sweep time.",
          },
        ],
        links: [
          {
            label: "Awesome Muse Skills",
            detail: "2,384 agent skills catalogued",
            href: "https://github.com/aicodedecode/awesome-muse-skills",
          },
          {
            label: "awesome-muse",
            detail: "Community-curated guides, use cases, tools and news",
            href: "https://github.com/cszach/awesome-muse",
          },
          {
            label: "Muse Invite Hub",
            detail: "Open-source invite-code directory",
            href: "https://github.com/ePlus-DEV/muse-invite-hub",
          },
          {
            label: "report-on-muse-ai-communities",
            detail: "Nightly reports on the Muse community scene",
            href: "https://github.com/claypnw/report-on-muse-ai-communities",
          },
        ],
      },
      {
        id: "gadgets-hardware",
        name: "gadgets-hardware",
        desc: "Muse Gadgets and DIY hardware: bands, wearables, and the official SDK.",
        topic:
          "Muse Gadgets is Meta's official hardware lane for Muse: the community Discord had 280 people online on Nov 7 and 322 online on Nov 24, 2026, and the official SDK repo is the largest Muse repo on GitHub.",
        members: "322 online",
        pinned: [
          {
            author: "Server notes",
            text: "facebookincubator/muse-gadget-sdk: 2,621 stars, 588 forks (Nov 7 sweep). Start there before asking hardware questions anywhere else.",
          },
        ],
        links: [
          {
            label: "Muse Gadgets community Discord",
            detail: "Official Meta server — 322 online Nov 24 (280 online Nov 7)",
            href: "https://gadgets.muse.ai/",
          },
          {
            label: "muse-gadget-sdk (GitHub)",
            detail: "Official Meta SDK — 2,621 stars, 588 forks",
            href: "https://github.com/facebookincubator/muse-gadget-sdk",
          },
          {
            label: "Built with Muse",
            detail: "Hardware builds in the showcase",
            href: "https://builtwithmuse.com",
          },
        ],
      },
    ],
  },
  {
    name: "Learn",
    channels: [
      {
        id: "tutorials",
        name: "tutorials",
        desc: "Step-by-step guides, from first prompt to full setup.",
        topic:
          "Tutorials cluster in the big Facebook groups and on PHCorner, the Filipino tech forum whose Muse AI tag carries setup guides and tutorials alongside its invite-code threads.",
        pinned: [
          {
            author: "Server notes",
            text: "The Muse AI Global Community's tutorials and prompts threads are the fastest route from zero to a working setup.",
          },
        ],
        links: [
          {
            label: "Muse AI Global Community (Facebook)",
            detail: "Thousands of members — tutorials and prompts",
            href: "https://www.facebook.com/groups/1412860160484234/",
          },
          {
            label: "Muse AI tag on PHCorner",
            detail: "Setup guides and tutorials on the Filipino tech forum",
            href: "https://phcorner.org/tags/muse-ai/",
          },
        ],
      },
      {
        id: "help-troubleshooting",
        name: "help-troubleshooting",
        desc: "Stuck? Lockouts, region blocks, broken captures — ask here.",
        topic:
          "There is no official Muse support forum, so Muse users troubleshoot in the Meta Community Forums' AI Glasses board — lockout threads included — and lean on the Muse AI Discussion Group for onboarding help.",
        pinned: [
          {
            author: "Server notes",
            text: "Before posting: say which surface (glasses, app, web), what you tapped, and the exact error text. Half of all help threads stall on a missing error message.",
          },
        ],
        links: [
          {
            label: "Meta Community Forums — Troubleshooting (AI Glasses)",
            detail: "The de facto Muse support board",
            href: "https://communityforums.atmeta.com/troubleshooting-20",
          },
          {
            label: "Muse AI Discussion Group (Facebook)",
            detail: "Active onboarding and peer help",
            href: "https://www.facebook.com/groups/2263630371086017/",
          },
        ],
      },
      {
        id: "onboarding",
        name: "onboarding",
        desc: "New to Muse? Start paths, first-week checklists, invite help.",
        topic:
          "Onboarding starts with an invite code (#invite-codes), then a start path. The Muse AI Discussion Group runs the most active new-member onboarding the sweeps found.",
        pinned: [
          {
            author: "Git-FED",
            text: "First week that works: day 1, set up the app and one glasses capture habit. Day 2-3, one integration. Day 4-7, one workflow you will actually repeat.",
          },
        ],
        links: [
          {
            label: "Muse AI Discussion Group (Facebook)",
            detail: "Active onboarding, new-member intros Nov 19, 2026",
            href: "https://www.facebook.com/groups/2263630371086017/",
          },
          {
            label: "MuseInviteHub",
            detail: "Start here if you still need an invite code — 544 shared",
            href: "https://muse.eplus.dev/",
          },
        ],
      },
    ],
  },
  {
    name: "Earn",
    channels: [
      {
        id: "business-money",
        name: "business-money",
        desc: "Muse for business and personal money: offers, pricing, results.",
        topic:
          "The money lane is the biggest lane in the scene: Muse AI For Business and Personal Life is the largest Muse Facebook group found at 30.2K members, and Skool's Muse Makes Money runs free training with a weekly Lab Report and monthly live teardowns.",
        members: "30.2K",
        pinned: [
          {
            author: "Server notes",
            text: "The same Facebook group was counted at 1,000 members on Oct 9, 2026 and 30.2K on Nov 24 — the fastest growth the sweeps recorded anywhere.",
          },
        ],
        links: [
          {
            label: "Muse AI For Business and Personal Life (Facebook)",
            detail: "30.2K members — largest Muse Facebook group found",
            href: "https://www.facebook.com/groups/1025166646935100/",
          },
          {
            label: "Muse Makes Money (Skool)",
            detail: "Free training community — weekly Lab Report, monthly live teardowns",
            href: "https://www.skool.com/musemakesmoney-4807",
          },
        ],
      },
      {
        id: "agency-clients",
        name: "agency-clients",
        desc: "Running Muse as a service: agencies, client work, delivery.",
        topic:
          "The agency corner is small but real: the Muse AI Agency on Whop is the business hub, and the AI Agent Academy teaches Muse as one course among others to about 80 mostly realtor-focused members.",
        pinned: [
          {
            author: "Server notes",
            text: "Git-FED's own MuseAi Community on Whop is the home base linked in #welcome — the Muse AI Agency below is a separate, unaffiliated listing.",
          },
        ],
        links: [
          {
            label: "Muse AI Agency (Whop)",
            detail: "Agency and business hub",
            href: "https://whop.com/museaiagency/",
          },
          {
            label: "AI Agent Academy",
            detail: "About 80 members — realtor-focused, Muse is one course among others",
            href: "https://www.theaiagent.academy/",
          },
        ],
      },
      {
        id: "jobs-gigs",
        name: "jobs-gigs",
        desc: "Gigs, collabs, and paid Muse work.",
        topic:
          "There is no Muse job board yet — the professional lane runs through the one Muse-only LinkedIn group the sweeps found (login-gated, member count unverified) and launch platforms like Product Hunt.",
        pinned: [
          {
            author: "Server notes",
            text: "Post gigs with scope, pay range, and deadline. Vague 'DM me' posts get removed — the scene is small enough that reputation is the whole game.",
          },
        ],
        links: [
          {
            label: "Muse builders community (LinkedIn)",
            detail: "The only Muse-only LinkedIn group found — promoted by AI at Meta",
            href: "https://www.linkedin.com/groups/42825008",
          },
          {
            label: "Muse by Meta on Product Hunt",
            detail: "427 followers — where Muse products launch",
            href: "https://www.producthunt.com/products/muse-22",
          },
        ],
      },
    ],
  },
  {
    name: "Community",
    channels: [
      {
        id: "events-meetups",
        name: "events-meetups",
        desc: "Online sessions, meetups, and deep dives.",
        topic:
          "The Gen AI Enthusiasts meetup runs fortnightly online sessions, and its Dec 7, 2026 event is a full hands-on Muse deep dive. In Singapore, OpenBuilder's Muse meetup signed up 250 people in 24 hours.",
        unread: true,
        pinned: [
          {
            author: "Server notes",
            text: "Dec 7, 2026: Gen AI Enthusiasts hosts a full hands-on Muse deep dive, online. The meetup link has the session details.",
          },
        ],
        links: [
          {
            label: "Gen AI Enthusiasts (Meetup)",
            detail: "Dec 7 event is a full hands-on Muse deep dive",
            href: "https://www.meetup.com/genai_enthusiasts_aiusers-online/",
          },
          {
            label: "OpenBuilder — Singapore",
            detail: "Muse Singapore Meetup — 250 signed up in 24 hours (found via LinkedIn, 1,367 followers)",
          },
        ],
      },
      {
        id: "international",
        name: "international",
        desc: "Muse communities by country and language.",
        topic:
          "Muse launched US/Canada-only, so international communities are small and scrappy: a Traditional Chinese Facebook group in Taiwan, a brand-new Japanese community site, and a WhatsApp group mostly from India.",
        pinned: [
          {
            author: "Server notes",
            text: "Japan hit #1 on its App Store on Oct 23, 2026, but the Muse Community Japan site only opened Nov 17 — its shelves were still empty at sweep time.",
          },
        ],
        links: [
          {
            label: "Muse Community (Japan)",
            detail: "Opened Nov 17, 2026 — no articles yet when found",
            href: "https://muse-prompt.kurashiki-bouzu.com/",
          },
          {
            label: "Muse Ai WhatsApp Group",
            detail: "Listed active Nov 23, 2026 — mostly members from India",
            href: "https://groupwhat.com/groups/rylWSq96ne798C1dZzywM",
          },
          {
            label: "Muse.AI Taiwan (Facebook)",
            detail: "353 members — Traditional Chinese (Oct 9 baseline)",
          },
        ],
      },
      {
        id: "agent-only-forum",
        name: "agent-only-forum",
        desc: "Places where the agents themselves post.",
        topic:
          "The strangest corner of the scene: forums where Muse instances and Muse-style agents post for each other. Muse Forum runs 16 agents across 15 threads, musexy mixes a forum with 59 use cases and a Muse Pageant, and Muselings is a social network where only Muse agents post.",
        members: "16 agents",
        pinned: [
          {
            author: "Server notes",
            text: "The Muse Commons Facebook group is built for the AI agents and bot Pages themselves — humans are welcome to observe.",
          },
        ],
        links: [
          {
            label: "Muse Forum",
            detail: "Public forum where Muse instances post — 16 agents, 15 threads",
            href: "https://muse-forum.nequex.workers.dev/",
          },
          {
            label: "musexy",
            detail: "Forum with 59 use cases, a daily topic, and the Muse Pageant",
            href: "https://musexy.app/",
          },
          {
            label: "Musebook",
            detail: "Agent-first social feed for Muse-style agents",
            href: "https://musebook.lol/",
          },
          {
            label: "Muselings",
            detail: "Social network where only Muse agents post",
            href: "https://muselings.io/",
          },
        ],
      },
      {
        id: "off-topic",
        name: "off-topic",
        desc: "Everything else. Keep it friendly.",
        topic:
          "The overflow channel. The wider scene's overflow lives on Mastodon's #MuseAI hashtag feed and in The Muse Commons, the Facebook group built for the agents and bot Pages themselves.",
        pinned: [
          {
            author: "Server notes",
            text: "Off-topic still follows #rules. If a thread turns into real Muse talk, move it to the right channel and link back.",
          },
        ],
        links: [
          {
            label: "The Muse Commons (Facebook)",
            detail: "Built for the AI agents and bot Pages themselves — humans welcome to observe",
            href: "https://www.facebook.com/groups/4491955790939487/",
          },
          {
            label: "#MuseAI on Mastodon",
            detail: "Hashtag feed — Australia launch and invite-code posts, Nov 20-23",
            href: "https://mastodon.social/tags/MuseAI",
          },
        ],
      },
      {
        id: "feedback",
        name: "feedback",
        desc: "What this server and the wider scene should do better.",
        topic:
          "Feedback on Muse itself routes to Meta's channels — the Product Hunt page and the Meta Community Forums are where the sweeps saw it land. Feedback on this server goes right here.",
        pinned: [
          {
            author: "Git-FED",
            text: "Tell me which communities the sweeps missed. New finds get verified and added to the directory channels with their counts.",
          },
        ],
        links: [
          {
            label: "Muse by Meta on Product Hunt",
            detail: "427 followers, 211 upvotes — launch feedback lives here",
            href: "https://www.producthunt.com/products/muse-22",
          },
          {
            label: "Meta Community Forums",
            detail: "Where Muse users post because there is no official Muse support forum",
            href: "https://communityforums.atmeta.com/troubleshooting-20",
          },
        ],
      },
    ],
  },
  {
    name: "Directory",
    channels: [
      {
        id: "reddit",
        name: "reddit",
        desc: "Every Muse subreddit found, with member counts.",
        topic:
          "Reddit is quietly the biggest Muse platform: r/MuseAgent alone has 25,240 members and ranked #9 fastest-growing AI subreddit on Nov 24, 2026. Five Muse subreddits were found in total.",
        members: "25,240 largest",
        unread: true,
        pinned: [
          {
            author: "Server notes",
            text: "Counts from the Nov 24, 2026 sweep. r/MuseAgents grew 2,442.7% in about two months — the fastest riser on the platform.",
          },
        ],
        links: [
          {
            label: "r/MuseAgent",
            detail: "25,240 members — #9 fastest-growing AI subreddit, up 10.4% in 7 days",
            href: "https://www.reddit.com/r/MuseAgent/",
          },
          {
            label: "r/MetaAI",
            detail: "20,268 members — now hosting Muse discussion and invite posts",
            href: "https://www.reddit.com/r/MetaAI/",
          },
          {
            label: "r/MuseAgents",
            detail: "2,619 members — up 2,442.7% in about two months",
            href: "https://www.reddit.com/r/MuseAgents/",
          },
          {
            label: "r/MuseAI_Agent",
            detail: "767 members — about two months old",
            href: "https://www.reddit.com/r/MuseAI_Agent/",
          },
          {
            label: "r/MuseAssistant",
            detail: "144 members — 4.1 posts/day, founded Sep 2026",
            href: "https://www.reddit.com/r/MuseAssistant/",
          },
        ],
      },
      {
        id: "discord",
        name: "discord",
        desc: "Muse on Discord: one official server, one independent.",
        topic:
          "Only two genuinely Muse-specific Discord servers with verifiable size exist: Meta's official Muse Gadgets server, and the independent Muse Agent server, which grew from 377 members on Nov 7 to 633 on Nov 24, 2026.",
        members: "633",
        pinned: [
          {
            author: "Git-FED",
            text: "My own Discord is Token Town (MuseAi-Matches) — the paywalled matching server for Muse users. It is in the server rail on the far left.",
          },
        ],
        links: [
          {
            label: "Muse Agent (Discord)",
            detail: "633 members, 120 online — independent, created Sep 2026 (was 377 on Nov 7)",
            href: "https://discord.com/invite/sxjhCPdEG6",
          },
          {
            label: "Muse Gadgets community Discord",
            detail: "Official Meta server — 322 online Nov 24",
            href: "https://gadgets.muse.ai/",
          },
        ],
      },
      {
        id: "facebook-groups",
        name: "facebook-groups",
        desc: "The Facebook groups, from the 30.2K giant down.",
        topic:
          "Facebook hosts the two largest Muse communities anywhere: Muse AI For Business and Personal Life at 30.2K members, and the original Muse AI Community at about 6,500 — plus a long tail of focused groups.",
        members: "30.2K largest",
        pinned: [
          {
            author: "Server notes",
            text: "The ~6,500-member Muse AI Community (counted Oct 23, 2026) is the biggest Muse-specific group the Nov 7 sweep found anywhere. Its direct link was not in the research files, so it is listed without one.",
          },
        ],
        links: [
          {
            label: "Muse AI For Business and Personal Life",
            detail: "30.2K members — largest Muse Facebook group (Nov 24)",
            href: "https://www.facebook.com/groups/1025166646935100/",
          },
          {
            label: "Muse AI Community",
            detail: "~6,500 members — biggest Muse-specific group found Nov 7 (no link in research)",
          },
          {
            label: "Muse AI Global Community",
            detail: "Thousands of members — tutorials and prompts",
            href: "https://www.facebook.com/groups/1412860160484234/",
          },
          {
            label: "Muse AI Users",
            detail: "Tips, tricks and ideas",
            href: "https://www.facebook.com/groups/1690556762466160/",
          },
          {
            label: "The Muse Collective",
            detail: "Private — billed as the first user community for Muse",
            href: "https://www.facebook.com/groups/1225415652546071/",
          },
        ],
      },
      {
        id: "telegram",
        name: "telegram",
        desc: "Telegram channels and groups — read the labels, some are shops.",
        topic:
          "Telegram's Muse scene runs on channels: the @muse channel passed 5,082 subscribers with +320 in a single day. Labels matter here — DreamX is a token top-up and account shop, not a discussion community.",
        members: "5,082",
        pinned: [
          {
            author: "Server notes",
            text: "There is no official Muse Telegram from Meta. The Nov 7 sweep found the Telegram scene is mostly a token economy — check what a channel actually is before joining.",
          },
        ],
        links: [
          {
            label: "Muse (@muse) on Telegram",
            detail: "5,082 subscribers — growing fast, +320 in 24 hours",
            href: "https://t.me/muse",
          },
          {
            label: "DreamX Muse Server (Telegram)",
            detail: "4,988 subscribers — third-party token top-up and account shop, not a discussion community",
            href: "https://t.me/dreamxmuseserver",
          },
          {
            label: "MuseAI Prompts Channel (Telegram)",
            detail: "Prompts and tips for AI visuals",
            href: "https://t.me/museaiprompts",
          },
        ],
      },
      {
        id: "skool",
        name: "skool",
        desc: "The five Muse Skool communities the sweep found.",
        topic:
          "Skool is the money-and-training wing of the scene: five Muse communities, from the 148-member Meta Muse AI Mindset & Money to the tiny 5-member Agent Operator Lab.",
        members: "148 largest",
        pinned: [
          {
            author: "Server notes",
            text: "Muse AI Lab runs founding membership at $19/month for the first 20 members, with weekly live workshops. Meta Muse More Time More Money kicks off with live builds in December.",
          },
        ],
        links: [
          {
            label: "Meta Muse AI Mindset & Money (Skool)",
            detail: "148 members — free",
            href: "https://www.skool.com/ai-glow-up-3326/about",
          },
          {
            label: "Muse Makes Money (Skool)",
            detail: "Free training community — weekly Lab Report, monthly live teardowns",
            href: "https://www.skool.com/musemakesmoney-4807",
          },
          {
            label: "Muse AI Lab (Skool)",
            detail: "Founding membership $19/month for first 20 — weekly live workshops",
            href: "https://www.skool.com/muse-ai-lab-5772/about",
          },
          {
            label: "Meta Muse More Time More Money (Skool)",
            detail: "Free — kickoff with live builds in December",
            href: "https://www.skool.com/muse-ai-more-time-more-money-4693/about",
          },
          {
            label: "Muse Ai Agent Operator Lab (Skool)",
            detail: "5 members — small",
            href: "https://www.skool.com/agent-operator-lab-1073/-/members",
          },
        ],
      },
      {
        id: "forums-sites",
        name: "forums-sites",
        desc: "Independent forums and community sites.",
        topic:
          "Beyond the big platforms: Built with Muse is the largest verified Muse-specific community site at 1,063 members, musexy and Muse Forum serve the agent crowd, and All Things Muse is still a waitlist.",
        members: "1,063 largest",
        pinned: [
          {
            author: "Server notes",
            text: "All Things Muse Community is not open yet — the waitlist had 164 email subscribers when the Nov 24 sweep found it.",
          },
        ],
        links: [
          {
            label: "Built with Muse",
            detail: "1,063 members — largest verified Muse-specific community site",
            href: "https://builtwithmuse.com",
          },
          {
            label: "musexy",
            detail: "Forum — 59 use cases, daily topic, Muse Pageant",
            href: "https://musexy.app/",
          },
          {
            label: "Muse Forum",
            detail: "16 agents, 15 threads — Muse instances post here",
            href: "https://muse-forum.nequex.workers.dev/",
          },
          {
            label: "All Things Muse Community",
            detail: "Forum on waitlist — 164 email subscribers, not yet open",
            href: "https://www.allthingsmuse.com/community/",
          },
        ],
      },
    ],
  },
];

export const ALL_CHANNELS: Channel[] = CATEGORIES.flatMap((c) => c.channels);

export function findChannel(id: string): Channel {
  const found = ALL_CHANNELS.find((c) => c.id === id);
  if (found) return found;
  const first = ALL_CHANNELS[0];
  if (!first) throw new Error("No channels defined");
  return first;
}
