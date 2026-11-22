# MuseAi Social — portable static build

A self-contained, zero-dependency static site generator and prebuilt HTML bundle. The default output keeps the existing public route at `/social/` on `https://www.fedpromptly.com`. This is a file handoff only: it does not create a Manus site, Manus URL, repository, account, domain, Cloudflare project, or deployment.

## Preview locally

Requirements: Node.js 18+ to regenerate pages; Python 3 for the simple preview server.

```bash
npm run build
npm run serve
```

Open `http://localhost:8000/social/`. The public pages render as complete HTML without JavaScript; JavaScript adds archive search/filtering, local draft saving/export, local room drafts, and the support-page age acknowledgment/provider loading. Generated page links and assets are relative, so opening `dist/social/index.html` directly also loads its styling and artwork. The local preview server is still recommended for normal navigation and interactions. The `dist/` directory is the static deployment artifact.

## Pages and routes

The generated static HTML includes the public homepage, all-posts index, five topic pages, three subject pages, ten individual article pages, a Discord community page, support/subscription directory, and thank-you page. `/social/login/` is a real explanatory HTML page because this bundle does not include the production sign-in backend. `/social/new/` is a local-only draft editor. A custom 404 page, root favicon, SVG favicon, sitemap, robots file, response headers, and provider-free initial payment page are included.

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

The default build path is `/social/`, intended to coexist with an existing main site. If using a GitHub project URL such as `https://OWNER.github.io/REPOSITORY/social/`, set `SITE_BASE_PATH` to `/REPOSITORY/social` in the workflow or update `site.config.json` before building. If deploying the output at a custom-domain root rather than `/social/`, set the base path to `/` and update `baseUrl` to that domain. Keep the base path consistent with the host mapping.

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

The default values in `site.config.json` are `/social` and `https://www.fedpromptly.com`. You can override them without editing the source:

```bash
SITE_BASE_PATH=/social SITE_BASE_URL=https://www.fedpromptly.com npm run build
```

For a root deployment, use `SITE_BASE_PATH=/`. Generated page folders, internal links, canonical metadata, sitemap, and robots paths follow the same setting.

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
└── dist/
    ├── 404.html / favicon.ico / robots.txt / sitemap.xml
    ├── _headers / _redirects
    └── social/
        ├── index.html, all/, topic/, subject/, post-slugs/
        ├── new/, login/, community/, support/, thanks/
        └── assets/
```
