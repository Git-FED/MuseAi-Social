# MuseAi Social — portable static build

A self-contained, zero-dependency static site generator and prebuilt HTML bundle. The default output is a flat site that deploys at the root of any host. This is a file handoff only: it does not create a Manus site, Manus URL, repository, account, domain, Cloudflare project, or deployment.

## Preview locally

Requirements: Node.js 18+ to regenerate pages; Python 3 for the simple preview server.

```bash
npm run build
npm run serve
```

Open `http://localhost:8000/`. The public pages render as complete HTML without JavaScript; JavaScript adds archive search/filtering, local draft saving/export, local room drafts, and the support-page age acknowledgment/provider loading. Generated page links and assets are relative, so opening `dist/index.html` directly also loads its styling and artwork. The local preview server is still recommended for normal navigation and interactions.

## Flat layout: one folder, all the pages

The whole site is one folder: `dist/`. Every page is a single `.html` file sitting in that folder (`index.html`, `all.html`, `topic-learn.html`, `november-meta-muse-news.html`, and so on). The only subfolder is `assets/` for the stylesheet, scripts, and images. There are no per-page folders. To deploy, upload the contents of `dist/` to any static host and it works at the root. If you set a base path other than `/` (for example `/social`), the same flat files are generated under `dist/social/` instead, and `dist/index.html` redirects `/` to them.

## Backend: posts, comments, votes

The post area has a real backend in `backend/`, a zero-dependency Node server. No packages to install, no database to set up.

```bash
npm start
```

That serves the whole site with the live backend at `http://localhost:3000/`. Change the port with `PORT=8080 npm start`.

API endpoints:

- `GET /api/posts` — all posts
- `GET /api/posts/:slug` — one post with its comments
- `POST /api/posts` — publish a post (`title`, `topic`, `subject`, `body`, optional `author`)
- `POST /api/posts/:slug/comments` — add a comment (`author`, `body`)
- `POST /api/posts/:slug/vote` — upvote a post
- `GET /api/topics` — the topic and subject taxonomy

Data lives in `backend/data.json`, seeded from `backend/seed.json` (the 10 starter posts) on first run. Delete `data.json` to reset to the seed. New posts published to the API appear in the archive after rebuilding the static pages (`npm run build`), because the archive is pre-rendered HTML.

Without the server the static files still work, but publishing, comments, and votes stay local-only in the browser: the new-post form saves a local draft, and the vote and reply controls tell you the backend is not connected.

No login on the bundled backend: it is meant for local or single-owner use. The login page still explains the production sign-in boundary.

## Pages and routes

The generated static HTML includes the public homepage, all-posts index, five topic pages, three subject pages, ten individual article pages, a Discord community page, support/subscription directory, and thank-you page. `login.html` is a real explanatory HTML page because this bundle does not include the production sign-in backend. `new.html` is a local-only draft editor. A custom 404 page, root favicon, SVG favicon, sitemap, robots file, response headers, and provider-free initial payment page are included.

Internal navigation uses routes that exist as HTML files in `dist/social/`. Payment, newsletter, and Discord destinations are external provider pages/embeds and are disclosed as such. No Ko-fi overlay/widget or Ko-fi script is included. The Discord widget is in a centered responsive container.

## Age-gated payment and subscription options

`/social/support/` initially shows a required 18+ acknowledgment. The PayPal and Stripe checkout scripts are loaded only after a visitor checks the age-confirmation box and submits. The third-party provider links are revealed only after that step; the page keeps checkout details with PayPal, Stripe, GitHub Sponsors, Buy Me a Coffee, NOWPayments, or Substack rather than collecting payment data itself.

**Important limitation:** this is a browser-side age acknowledgment, not verified age/identity enforcement, and it can be bypassed. It is not a legal-compliance control. The ZIP has no server, payment processor, database, or provider-account access. Checkout IDs and buttons in the supplied code were carried over as public-facing embed identifiers; verify every product, amount, renewal, merchant, account, and live/sandbox setting in the provider dashboards before using them. A button rendering successfully does not prove a provider account is active or correctly configured. Providers control all checkout terms, payment handling, receipts, and refunds.

## Visual assets and motion

- Five original, humorous mascot promotional illustrations in optimized WebP: panoramic hero, smart-glasses mishap, maker lab, community, and support.
- A symbol-only FED spark favicon (SVG and ICO). It is not a letter.
- A 24-frame animated GIF loop based on the community illustration.
- Original animated dark flowing-contour canvas background, slow hero image drift, hover treatments, reveal transitions, and infinitely repeating ticker. No orbit/ring visual motif. Motion stops or reduces under `prefers-reduced-motion`.
- The supplied Git-FED avatar is preserved as an optimized WebP on the local thank-you page.

## GitHub Pages

The archive includes `.github/workflows/pages.yml`. Once you put the files in your own GitHub repository and enable **Settings → Pages → GitHub Actions**, pushes to `main` build `dist/` and publish it. No repository was created or connected here.

The workflow detects the base path from the repository name automatically: a user-site repo (`OWNER.github.io`) builds at the root, and a project repo builds under `/REPOSITORY/`, with canonical URLs pointed at `https://OWNER.github.io`. No manual `SITE_BASE_PATH` edit is needed for GitHub Pages. If deploying the output under a sub-path such as `/social/`, set `SITE_BASE_PATH=/social` and update `baseUrl` to that domain. Keep the base path consistent with the host mapping.

## Cloudflare Pages

The repository includes `wrangler.toml` with the Pages output directory set to `./dist`. In Cloudflare Pages, connect the GitHub repository and select:

- Framework preset: **None**
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: 20 or later

Alternatively, after authenticating your own Cloudflare account, build locally and deploy `dist/` with Wrangler. `_headers` and a base-path-aware `_redirects` file are generated into the static output for Cloudflare Pages behavior. Do not deploy the same route to both GitHub Pages and Cloudflare without deciding which host is authoritative and adjusting DNS/origin routing.

## Cloudflare Workers with static assets

For a Worker instead of Pages, use `wrangler-worker.jsonc` and `worker.js`:

```bash
npm run build
npx wrangler deploy --config wrangler-worker.jsonc
```

This requires your own Cloudflare authentication, Worker name/availability, and account permissions. The Worker forwards requests to the static-assets binding; it does not add a backend or account system.

## Build path and canonical URL overrides

The default values in `site.config.json` are `/` and `https://www.fedpromptly.com`. You can override them without editing the source:

```bash
SITE_BASE_PATH=/social SITE_BASE_URL=https://www.fedpromptly.com npm run build
```

For a sub-path deployment, use a base path such as `SITE_BASE_PATH=/social`. Generated page files, internal links, canonical metadata, sitemap, and robots paths follow the same setting.

## Product boundaries

This is a portable static front-end, not a deployed community service. Reading is public. There is no sign-in, post submission, real comment/vote/save/follow, live chat service, server-side moderation, payment processing, identity verification, or background automation in this ZIP. New-post and group-room forms only save locally in the current browser or export a draft. Discord and external checkout pages remain provider-hosted. The 30-minute moderation cadence is a design target, not an active job. No site has been published and no account credentials were used.

## Structure

```text
museai-social-portable/
├── .github/workflows/pages.yml
├── README.md / SCOPE.md / CONTENTS.txt / package.json
├── site.config.json / build.mjs / worker.js
├── wrangler.toml / wrangler-worker.jsonc / worker.js
├── data/                         # Posts and topic taxonomy
├── src/
│   ├── app.js / flow-field.js / style.css
│   └── assets/                    # Mascot art, GIF, icon, supplied avatar
└── dist/                         # Flat: every page is one .html file here
    ├── index.html, all.html, topic-learn.html, topic-build.html,
    │   topic-help.html, topic-show.html, topic-news.html,
    │   subject-meta-glasses.html, subject-meta-ai.html,
    │   subject-meta-integrations.html, <post-slug>.html (10),
    │   new.html, login.html, community.html, support.html, thanks.html
    ├── 404.html / favicon.ico / robots.txt / sitemap.xml
    ├── _headers / _redirects
    └── assets/                    # style.css, app.js, flow-field.js, artwork
```
