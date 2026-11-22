# MuseAi Social — product design brief

**Project:** MuseAi Social, a fresh Git-FED-owned community home for Muse AI on Meta glasses and Meta integrations. **Destination target:** `fedpromptly.com/social`, reusing the existing FED Hub login and visual theme. **Ownership/deployment:** portable files owned by Git-FED; this archive is local only. No repository, Space, new domain, Manus site, or deployment is created here.

## Purpose and focus

One home to share what people learned and built around Muse AI Meta glasses and other Meta products that integrate with Muse, find useful information quickly, and discuss it. The product borrows only the parts called out in the source brief: a large community as an aspiration (not a Reddit feature model); topic channels and forum threads (not Discord extras); a public social stream and user-created group conversations (not a conventional social network); and a real, searchable forum-like knowledge home.

Scope stays narrow: Meta Glasses, Meta AI app, and Meta integrations. There is no general Muse AI topic outside Meta, general-chat drift, promo-code lane, or NSFW area. Supported Meta examples include Ray-Ban Meta Gen 2, Oakley Meta, Ray-Ban Display, Neural Band, audio frames, Wayfarer Gen 2 `0RW4012`; Meta AI app, Meta View, Hey Meta, voice, photos/video; and Quest, WhatsApp, Instagram, Facebook, Messenger, Horizon, or other Meta integrations with Muse.

## Information architecture

The two core post types are **What I Learned** (lesson, trick, fix, mistake, and what it taught) and **What I Built** (a build, link, image/video, what it does, and how to try it). Forum formats are Learn, Build, Help, Show, and News; subject rooms are Meta Glasses, Meta AI app, and Meta integrations. Each post can carry title, topic, body, link/file, author, date, a lesson/build format tag, vote count, comments, and save intent. Search spans title, body, and topic. The server concept is text only: channels by topic, forum threads, a help channel, and a builds channel. No voice, stage, Nitro, stickers, bots, games, soundboard, or other Discord extras.

The visual layout must not resemble a Discord server rail, Reddit, Facebook/Instagram, or a conventional Bluesky-style central feed. This file implementation uses an editorial knowledge-field/index composition. The existing FED Hub header/session and dark theme remain the context: background `#0e0e14`, surface `#1a1a26`, text `#ececf1`, brand purple `#7c5cfc`, and pink accent `#f472b6`; topic colors remain small accents only. The bespoke animated background is a dark fluid signal/contour field, not an orbital visual.

## Public reading and indexing

Public reading is separated from authenticated actions so pages can be crawled. Public pages are static HTML; each topic page links to the home/index, and each article links to its topic and two related notes. Article pages include a clean slug URL, title, description, canonical link, Open Graph/Twitter metadata, author/date/topic, and Article JSON-LD. The output contains a sitemap and robots file allowing crawl of `/social/`. Existing FED Hub login is not rebuilt; commenting, voting, saving, and joining remain sign-in actions. Search visibility and ranking cannot be guaranteed or inherited from another domain.

## Moderation policy from the source brief

The intended cadence is every 30 minutes. New members should be welcomed promptly; every first post should receive an individual, warm reply by name in the person's language with a relevant pointer and follow-up question. Avoid bulk or duplicate replies. Flag harassment, threats, doxxing, scams, impersonation, repeat promo spam, and promo-code flooding to Git-FED. Never delete, block, mute, report, unfollow, transfer, or impose blanket bans without Git-FED naming the exact target; Git-FED owns hard calls. Log each real cycle and remain quiet unless a reply/like fails or a flag needs attention. Label VERIFIED only after a hand check at a stated time; otherwise say UNVERIFIED.

These are product requirements, not services implemented by this static archive. This local package does not run a moderation monitor, post replies, send alerts, or perform actions on accounts. The UI labels the 30-minute cadence as a target/policy, not a live process.

## V1 and later boundaries

The source brief's v1 calls for the home feed of Meta-focused Learn/Build content, topic filtering and search, public post pages, comments/upvotes, text channels/forums, group chats, a local-first New Post form, moderation policy, mobile support, portable owned files, and indexing. In this static delivery, public content/pages/search are built; the authoring form stores only a browser-local draft and can export JSON; room creation only saves a browser-local room draft. Neither action sends or publishes content. There is no backend, database, authentication implementation, or connected social interaction service.

Real live chat/notifications, follows, profiles, badges, paid tier/shop links, and any import from Reddit/Discord are later work. Login already exists and must be reused, not recreated. Posting and other public mutations need the authorized existing application service; this archive links action entry points to the existing `/login` route and does not claim those actions are wired up. Free reading remains the rule; no purchase flow is included.

## Approval/deployment note

The source design document marked public-read and full v1 scope approval as pending. The user subsequently asked for all files in a ZIP and explicitly rejected creating a Manus AI website or URL. Therefore this deliverable packages a static file representation only; it does not decide deployment approval or perform deployment.
