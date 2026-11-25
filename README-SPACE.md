# MuseAi Social — backended Space source (current live version, Nov 25, 2026)

This is the source of the MuseAi Social space that runs inside Muse:
a React client plus typed server actions and a database, so posts,
comments, votes, rooms, and profiles are all saved server-side instead of
living in the browser.

## What the live version does

- Board: feed with search, topic/subject filters, voting, saving, topic
  follows, and article pages with reply threads. Every post shows a view
  count that goes up by 1 each time the article is opened.
- Authorship: the 10 starter posts are authored by Mod Bot (author
  "Mod Bot", username modbot) — not Git-FED, not Muse3. Only the admin
  account can delete them.
- Attachments: the New post form and the reply form take images
  (jpg/png/gif/webp, shown inline) and files (pdf/txt/md/zip, shown as
  download links), up to 6 per post or reply, 10 MB each, stored as blobs.
- Starter post covers: each of the 10 starter posts has a generated cover
  image (client/src/assets/post-*.webp), shown as the feed thumbnail and
  at the top of the article.
- Login: Supabase sign-in with usernames. Posts and replies store the
  author's account id + username; email is never displayed.
- Delete rule: only the account with username "admin" can delete any post
  or reply; everyone else can delete only items carrying their own
  username and account id. The same rule covers rooms: admin can delete
  any room, and a room's creator can delete their own room.
- Servers tab: a Discord-style community-map server. The rail slots carry
  generated icon symbols (client/src/assets/server-icon-*.webp: Reddit,
  Discord, Facebook, Telegram, GitHub, Skool, Forums, Whop, Token Town),
  channels open as a real chat stream with Mod Bot messages, pinned notes,
  Discord-style link embeds, a member list, voice channels, and a working
  message composer (preview only).
- Community tab: rooms (creatable, deletable by admin or creator) first,
  the Discord widget at the bottom of the page.
- FAQ and Wiki tabs, Support page with the 18+ gate and 6 provider
  options, Thank-you page with Git-FED's avatar.
- There is deliberately NO whole-site ZIP download inside the space;
  these ZIP files in your workspace are the only copies.

## Layout

- client/ — the page (Board, Servers, Community, Support, Thanks, FAQ,
  Wiki). Key files: src/App.tsx, src/ServersView.tsx, src/FaqWiki.tsx,
  src/servers-data.ts (the researched Muse AI community map).
- server/src/actions.ts — the backend actions (getFeed, getPost,
  getProfile, setUsername, createPost, votePost, addComment, deletePost,
  deleteComment, createRoom, deleteRoom).
- server/src/seed.ts — the 10 starter posts (Mod Bot authorship, cover
  image keys), comments, and taxonomy, imported verbatim from the
  portable package's seed.
- server/src/schema.ts + drizzle/ — the database shape (migrations
  0001–0005; 0004 adds views/attachments, 0005 adds room creators).
- space.json — the space metadata. DATA-PLAN.md — the data provenance
  record for every feature above.

The live version runs in your Muse as the "MuseAi Social" space; the
10 starter posts seed themselves on first run. For the portable copy
that runs anywhere with Node, use MuseAi-Social-Portable-BACKEND.zip
(flat site + backend/server.js), which carries the same Mod Bot seed,
cover images, view counts, attachments API, and room delete rule.
