# Scope and implementation notes

## Product intent retained

MuseAi Social is a Git-FED-owned community home focused on Muse AI Meta glasses and Meta products/integrations. Posts are organized by Learn, Build, Help, Show, and News; subjects are Meta Glasses, Meta AI app, and Meta integrations. The editorial composition remains distinct from a Discord server rail, Reddit clone, or conventional social feed. The retained FED palette is `#0e0e14`, `#1a1a26`, `#ececf1`, `#7c5cfc`, and `#f472b6`.

## Included portable static representation

- Data-driven pre-rendered homepage, all-posts archive, topic pages, subject pages, and article pages.
- Search and filtering, taxonomy discovery, local-only room setup, and a local-only post-draft/export form.
- Five original dark-comic mascot promotional illustrations, an optimized animated GIF, a symbol-only favicon/brand mark, and the supplied Git-FED avatar.
- A dark non-orbital animated flowing-contour canvas, a repeating editorial ticker, reduced-motion handling, responsive layouts, and visual hover/motion effects.
- Community HTML page with a responsive centered Discord widget.
- Support HTML page with a required session-side 18+ acknowledgment before revealing provider options or dynamically loading PayPal/Stripe checkout widgets. Provider actions use the user-supplied third-party destinations/identifiers. No Ko-fi widget or script is present.
- A local informational HTML sign-in route, a thank-you route, 404 page, canonical/OG metadata, Article JSON-LD, sitemap, robots file, and Cloudflare headers/redirects.
- GitHub Actions workflow for GitHub Pages, Cloudflare Pages Wrangler settings, and a separate static-assets Worker config.

## Explicitly not wired up

This archive contains no backend, database, account system, server-side age verification, identity verification, payment processing, secrets, or live moderation. Its age gate is only a browser-side acknowledgment; it can be bypassed and is not legal-compliance enforcement. PayPal/Stripe scripts and other providers retain checkout and payment handling. Provider-account configuration, amounts, renewal terms, availability, and legal compliance must be confirmed in those provider accounts. GitHub Pages and Cloudflare configuration files do not connect or publish accounts by themselves.

Votes, comments, saves, follows, and real group chat are not connected to an application service. The login path resolves to a local HTML explanation instead of a dead link. Room creation remains a browser-only draft. Automated 30-minute moderation, personal welcomes/replies, flags, logging, and notifications are not activated. No deployment, provider-account change, repository push, or public-side effect has been performed here.
