import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'dist');
const config = JSON.parse(await fs.readFile(path.join(ROOT, 'site.config.json'), 'utf8'));
const topics = JSON.parse(await fs.readFile(path.join(ROOT, 'data/topics.json'), 'utf8'));
const posts = JSON.parse(await fs.readFile(path.join(ROOT, 'data/posts.json'), 'utf8'));
const rawBase = process.env.SITE_BASE_PATH ?? config.basePath;
const BASE = rawBase === '/' ? '' : `/${String(rawBase).replace(/^\/+|\/+$/g, '')}`;
const ORIGIN = (process.env.SITE_BASE_URL ?? config.baseUrl).replace(/\/$/, '');
const SITE_DIR = path.join(OUT, BASE.replace(/^\//, ''));

const esc = (value = '') => String(value).replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));
// Flat layout: every page is one .html file in the site folder, no nested
// route folders. '/topic/learn/' -> 'topic-learn.html', '/all/' -> 'all.html',
// '/' -> 'index.html'. This is what makes the output deployable by dragging
// a single folder anywhere: there are no per-page directories to lose.
const flatFile = route => {
  const clean = String(route).replace(/^\/+|\/+$/g, '');
  if (!clean) return 'index.html';
  return `${clean.replaceAll('/', '-')}.html`;
};
const pageHref = route => `${BASE}/${flatFile(route)}`;
const canonical = route => route === '/' ? `${ORIGIN}${BASE}/` : `${ORIGIN}${pageHref(route)}`;
const subject = key => topics.subjects[key] ?? { name: 'Meta integrations', color: '#38bdf8', desc: '' };
const section = key => topics.sections[key] ?? { name: 'Learn', color: '#34d399', desc: '' };
const postUrl = post => pageHref(`/${post.slug}/`);
const loginUrl = (route = '/', fragment = '') => `${pageHref('/login/')}?next=${encodeURIComponent(`${pageHref(route)}${fragment}`)}`;
const writePage = async (route, html) => {
  const file = path.join(SITE_DIR, flatFile(route));
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html);
};

function header(active = '') {
  const nav = [
    ['Board', `${BASE}/`, 'board'],
    ['All posts', `${BASE}/all/`, 'all'],
    ['Learn', `${BASE}/topic/learn/`, 'learn'],
    ['Build', `${BASE}/topic/build/`, 'build'],
    ['Community', `${BASE}/community/`, 'community'],
    ['Support', `${BASE}/support/`, 'support']
  ];
  return `<header class="hub-head">
    <a class="hub-brand" href="${BASE}/" aria-label="FED Hub home"><img class="hub-mark" src="${BASE}/assets/fed-symbol.svg" alt=""><span>FED Hub</span></a>
    <nav class="hub-nav" aria-label="Primary navigation">${nav.map(([label, href, id]) => `<a href="${href}"${active === id ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    <div class="hub-session"><span class="hub-chip"><i></i> Reading public · login to act</span><a href="${loginUrl('/')}" class="hub-login">Sign in <span aria-hidden="true">↗</span></a></div>
  </header>
  <div class="signal-ticker"><span class="sr-only">No hype, just what works. Learn, build, show, and share. Meta glasses and useful integrations.</span><div class="ticker-track" aria-hidden="true"><div class="ticker-set"><span>NO HYPE · JUST WHAT WORKS</span><i>✳</i><span>LEARN / BUILD / SHOW / SHARE</span><i>✳</i><span>META GLASSES · USEFUL INTEGRATIONS</span><i>✳</i></div><div class="ticker-set"><span>NO HYPE · JUST WHAT WORKS</span><i>✳</i><span>LEARN / BUILD / SHOW / SHARE</span><i>✳</i><span>META GLASSES · USEFUL INTEGRATIONS</span><i>✳</i></div></div></div>`;
}

function taxonomy(activeType = '', activeSubject = '') {
  const typeLinks = Object.entries(topics.sections).map(([key, item]) => `<a class="tax-link ${activeType === key ? 'is-active' : ''}" href="${BASE}/topic/${key}/" style="--topic:${item.color}"><span class="tax-mark"></span>${esc(item.name)}</a>`).join('');
  const subjectLinks = Object.entries(topics.subjects).map(([key, item]) => `<a class="tax-link ${activeSubject === key ? 'is-active' : ''}" href="${BASE}/subject/${key}/" style="--topic:${item.color}"><span class="tax-mark"></span>${esc(item.name)}</a>`).join('');
  return `<div class="taxonomy" aria-label="Browse the knowledge field"><a class="tax-link ${!activeType && !activeSubject ? 'is-active' : ''}" href="${BASE}/"><span class="tax-mark"></span>Everything</a><span class="tax-divider"></span><span class="tax-label">FORMATS</span>${typeLinks}<span class="tax-divider"></span><span class="tax-label">SUBJECTS</span>${subjectLinks}</div>`;
}

function footer() {
  return `<footer class="site-foot"><a href="${BASE}/" class="foot-brand">MuseAi Social</a><span>Meta glasses + Meta integrations</span><span>Read free · sign in to interact</span><a href="${BASE}/community/">Community ↗</a><a href="${BASE}/support/">Support ↗</a><a href="${BASE}/all/">Public index ↗</a></footer>`;
}

function rewriteLinks(html, absolute) {
  const basePrefix = BASE || '';
  return html.replace(/\b(href|src)="([^"]+)"/g, (match, attribute, value) => {
    if (value.startsWith('//')) return match;
    const splitAt = value.search(/[?#]/);
    const pathname = splitAt < 0 ? value : value.slice(0, splitAt);
    const suffix = splitAt < 0 ? '' : value.slice(splitAt);
    if (basePrefix ? !(pathname === basePrefix || pathname.startsWith(`${basePrefix}/`)) : !pathname.startsWith('/')) return match;
    const localPath = (basePrefix ? pathname.slice(basePrefix.length) : pathname).replace(/^\/+/, '');
    const isAsset = localPath === 'favicon.ico' || localPath.startsWith('assets/');
    const alreadyFlat = localPath.endsWith('.html');
    const targetFile = isAsset || alreadyFlat ? localPath : flatFile(`/${localPath}`);
    // All pages are flat files in one folder, so a relative link is just the
    // file name. The 404 page needs absolute links instead: it can be served
    // for a missing URL at any depth, where a relative link would resolve
    // against the wrong folder.
    return absolute ? `${attribute}="${basePrefix}/${targetFile}${suffix}"` : `${attribute}="${targetFile}${suffix}"`;
  });
}

function makeLinksRelative(html) {
  return rewriteLinks(html, false);
}

function makeLinksAbsolute(html) {
  return rewriteLinks(html, true);
}

function shell({ title, description, route, content, type = 'website', article = null, noindex = false, active = '', relativeLinks = true }) {
  const pageUrl = canonical(route);
  const titleText = esc(title);
  const descText = esc(description);
  const articleJson = article ? `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    dateModified: article.date,
    author: { '@type': 'Person', name: article.author },
    publisher: { '@type': 'Organization', name: config.siteName, url: `${ORIGIN}${BASE}` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    articleSection: section(article.topic).name,
    about: subject(article.subject).name
  })}</script>` : '';
  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0e0e14">
  <title>${titleText}</title>
  <meta name="description" content="${descText}">
  <link rel="canonical" href="${pageUrl}">
  ${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
  <meta property="og:site_name" content="${esc(config.siteName)}">
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${titleText}">
  <meta property="og:description" content="${descText}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${canonical('/assets/promo-hero.webp')}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${titleText}">
  <meta name="twitter:description" content="${descText}">
  <link rel="icon" type="image/svg+xml" href="${BASE}/assets/fed-symbol.svg">
  <link rel="alternate icon" href="${BASE}/favicon.ico">
  ${articleJson}
  <link rel="stylesheet" href="${BASE}/assets/style.css">
  <script src="${BASE}/assets/flow-field.js" defer></script>
  <script src="${BASE}/assets/app.js" defer></script>
</head>
<body>
  <canvas class="flow-field" aria-hidden="true"></canvas>
  <div class="ambient-wash" aria-hidden="true"></div>
  ${header(active)}
  <main>${content}</main>
  ${footer()}
</body>
</html>`;
  return relativeLinks ? makeLinksRelative(html) : makeLinksAbsolute(html);
}

function card(post, compact = false) {
  const kind = section(post.topic);
  const subj = subject(post.subject);
  const searchText = `${post.title} ${post.excerpt} ${post.body.join(' ')} ${kind.name} ${subj.name}`.replace(/<[^>]*>/g, ' ');
  return `<article class="entry-card ${compact ? 'entry-compact' : ''}" style="--topic:${kind.color}" data-search="${esc(searchText.toLowerCase())}">
    <div class="entry-index"><span>${String(posts.indexOf(post) + 1).padStart(2, '0')}</span><i></i></div>
    <div class="entry-main"><div class="entry-kicker"><span class="entry-tag">${esc(kind.name)}</span><span class="entry-topic" style="--subject:${subj.color}">${esc(subj.name)}</span></div>
      <h2><a href="${postUrl(post)}">${esc(post.title)}</a></h2><p>${esc(post.excerpt)}</p>
      <div class="entry-meta"><span>${esc(post.author)}</span><span>${esc(post.date)}</span><span class="votes">▲ ${Number(post.votes) || 0}</span><span>👁 ${Number(post.views) || 0} views</span><span>${post.comments.length} ${post.comments.length === 1 ? 'reply' : 'replies'}</span></div>
    </div><a class="entry-arrow" href="${postUrl(post)}" aria-label="Read ${esc(post.title)}">↗</a>
  </article>`;
}

function roomDirectory() {
  const formats = Object.entries(topics.sections).map(([key, item]) => {
    const count = posts.filter(post => post.topic === key).length;
    return `<a class="room-tile" href="${BASE}/topic/${key}/" style="--topic:${item.color}"><span class="room-code">FIELD / ${key.toUpperCase()}</span><strong>${esc(item.name)}</strong><span>${count} public ${count === 1 ? 'thread' : 'threads'} <i>↗</i></span></a>`;
  }).join('');
  const rooms = Object.entries(topics.subjects).map(([key, item]) => `<a class="room-tile room-subject" href="${BASE}/subject/${key}/" style="--topic:${item.color}"><span class="room-code">SUBJECT / ${key.toUpperCase()}</span><strong>${esc(item.name)}</strong><span>Browse public notes <i>↗</i></span></a>`).join('');
  return `<section class="rooms-section" id="rooms"><div class="section-heading"><div><span class="eyebrow">COMMUNITY MAP</span><h2>Rooms by subject.<br><em>Threads by purpose.</em></h2></div><div class="section-aside"><p>Focused channels and forum-style threads, without the server clutter.</p><button class="button button-quiet" type="button" data-open-room>Create a room draft <span>＋</span></button></div></div><div class="room-grid">${formats}${rooms}</div><div class="local-note"><span class="note-dot"></span>Room creation is a local-only preview in this portable build. Live group chat is not connected.</div></section>`;
}

function moderationNotice() {
  return `<aside class="moderation-note"><span class="mod-icon" aria-hidden="true">✳</span><div><strong>Keep the signal useful.</strong><p>30-minute review cadence is the moderation target in the design. This static file bundle does not run an automated moderation job. Flags and hard decisions stay with Git-FED; no automatic deletion or bans.</p></div><span class="status-label">POLICY · NOT LIVE</span></aside>`;
}

function promoGallery() {
  return `<section class="promo-section" aria-labelledby="promo-title"><div class="section-heading"><div><span class="eyebrow">FIELD HUMOR / 03 PANELS</span><h2 id="promo-title">Useful, with a grin<span class="heading-period">.</span></h2></div><a class="text-link" href="${BASE}/community/">Find the people behind the notes <span>↗</span></a></div><div class="promo-gallery">
    <a class="promo-card" href="${BASE}/topic/learn/"><img src="${BASE}/assets/promo-glasses-mishap.webp" loading="lazy" alt="The furry FED mascot in smart glasses gets a surprise pigeon photobomb at sunset"><span class="promo-card-tag">LEARN / CAPTURE</span><strong>Even the pigeon made the field notes.</strong><i>Explore lessons ↗</i></a>
    <a class="promo-card" href="${BASE}/topic/build/"><img src="${BASE}/assets/promo-build-lab.webp" loading="lazy" alt="The FED mascot proudly displays a tiny home-built gadget while a robot offers a wrench"><span class="promo-card-tag">BUILD / PROTOTYPE</span><strong>One spoon. Three cables. A working prototype.</strong><i>See what is being built ↗</i></a>
    <a class="promo-card" href="${BASE}/community/"><img src="${BASE}/assets/promo-community.webp" loading="lazy" alt="The FED mascot laughs with a group of friendly gadget characters"><span class="promo-card-tag">SHOW / COMMUNITY</span><strong>Good notes travel better together.</strong><i>Visit the community ↗</i></a>
  </div></section>`;
}

function homePage() {
  const featured = posts[0];
  const next = posts.slice(1, 4);
  const content = `<div class="page-wrap home-wrap">
    <section class="hero-field">
      <div class="hero-copy"><span class="eyebrow"><span class="pulse-dot"></span> A PUBLIC KNOWLEDGE FIELD <span class="eyebrow-line"></span> 01 / 2026</span>
        <h1>Make the useful<br><em>impossible to lose.</em></h1>
        <p class="hero-deck">What we learned. What we built. One focused home for Muse AI on Meta glasses and the Meta things that work with it.</p>
        <div class="hero-actions"><a class="button button-primary" href="${BASE}/all/">Explore the index <span>↗</span></a><a class="text-link" href="${BASE}/topic/build/">See what’s being built <span>→</span></a></div>
      </div>
      <div class="hero-visual" aria-label="Comic illustration of the FED mascot using smart glasses">
        <img class="hero-art" src="${BASE}/assets/promo-hero.webp" alt="The spiky-haired FED mascot rides a golden cloud while using smart glasses" fetchpriority="high">
        <div class="visual-orientation">FIELD NOTE <b>NO. 001</b></div>
        <div class="visual-caption"><span>Meta glasses</span><span>Builds · lessons · working answers</span></div>
      </div>
      <div class="hero-footline"><span>NO HYPE. JUST WHAT WORKS.</span><span>PUBLIC READ / LOGIN TO CONTRIBUTE</span><span>SCROLL TO EXPLORE ↓</span></div>
    </section>

    <section class="signal-section" aria-labelledby="signal-title"><div class="section-heading signal-heading"><div><span class="eyebrow">RECENT SIGNAL <span class="eyebrow-line"></span> ${String(posts.length).padStart(2, '0')} ENTRIES</span><h2 id="signal-title">Latest field notes<span class="heading-period">.</span></h2></div><a class="text-link" href="${BASE}/all/">Open the full index <span>↗</span></a></div>
      <div class="feature-layout"><article class="feature-entry" style="--topic:${section(featured.topic).color}"><div class="feature-top"><span class="entry-tag">${esc(section(featured.topic).name)}</span><span class="feature-code">FEATURED / ${featured.date.replaceAll('-', '.')}</span></div><h3><a href="${postUrl(featured)}">${esc(featured.title)}</a></h3><p>${esc(featured.excerpt)}</p><div class="feature-bottom"><span>${esc(featured.author)} <i>·</i> ${featured.comments.length} replies</span><a href="${postUrl(featured)}" aria-label="Read featured field note">Read note <span>↗</span></a></div><div class="feature-watermark" aria-hidden="true">✳</div></article>
      <div class="recent-stack">${next.map((post, i) => `<article class="recent-line"><span class="recent-num">0${i + 2}</span><div><div class="entry-kicker"><span class="entry-tag" style="--topic:${section(post.topic).color}">${esc(section(post.topic).name)}</span><span class="recent-date">${esc(post.date)}</span></div><h3><a href="${postUrl(post)}">${esc(post.title)}</a></h3><p>${esc(post.excerpt)}</p></div><a class="recent-go" href="${postUrl(post)}" aria-label="Read ${esc(post.title)}">↗</a></article>`).join('')}</div></div>
    </section>

    ${promoGallery()}

    <section class="type-strip"><div class="type-intro"><span class="eyebrow">A SMALL, USEFUL SCOPE</span><p>Meta glasses.<br>Meta integrations.<br><em>Nothing else.</em></p></div><div class="type-columns">${Object.entries(topics.sections).map(([key, item], i) => `<a class="type-column" href="${BASE}/topic/${key}/" style="--topic:${item.color}"><span class="type-no">0${i + 1}</span><strong>${esc(item.name)}</strong><p>${esc(item.desc)}</p><span class="type-link">Explore <i>↗</i></span></a>`).join('')}</div></section>
    ${roomDirectory()}
    ${moderationNotice()}
    <div class="bottom-cta"><span class="eyebrow">HAVE SOMETHING THAT WORKS?</span><div><h2>Save the lesson.<br><em>Share the build.</em></h2><a href="${BASE}/new/" class="button button-primary">Draft a post <span>↗</span></a></div><p>Drafts stay on this device until you choose to export them. Nothing publishes from this static bundle.</p></div>
  </div>${roomDialog()}`;
  return shell({ title: 'MuseAi Social — Meta glasses and Meta integrations, learned and built', description: config.description, route: '/', content, active: 'board' });
}

function roomDialog() {
  return `<dialog class="modal" id="room-modal"><form method="dialog" class="modal-close-row"><button class="icon-button" aria-label="Close room draft">×</button></form><span class="eyebrow">LOCAL ROOM SETUP</span><h2>Start a focused room.</h2><p class="modal-copy">This creates a private draft in this browser only. It will not start a chat or invite anyone.</p><form id="room-form" class="local-form"><label>Room name<input name="name" maxlength="48" required placeholder="e.g. Ray-Ban capture workflow"></label><label>Subject<select name="subject">${Object.entries(topics.subjects).map(([key, item]) => `<option value="${key}">${esc(item.name)}</option>`).join('')}</select></label><button class="button button-primary" type="submit">Save room draft <span>↗</span></button><p class="form-status" aria-live="polite"></p></form><div class="saved-rooms" id="saved-rooms"></div></dialog>`;
}

function allPage() {
  const content = `<div class="page-wrap archive-wrap">${taxonomy()}<header class="page-intro"><span class="eyebrow">PUBLIC ARCHIVE / ${posts.length} FIELD NOTES</span><h1>The index<span class="heading-period">.</span></h1><p>Every public note, rendered in the page source and searchable by title, text, and topic.</p><label class="searchbox"><span aria-hidden="true">⌕</span><input id="post-search" type="search" placeholder="Search a lesson, build, device, or integration…" aria-label="Search public posts"><kbd>/</kbd></label><div class="filter-row"><span>FILTER BY FORMAT</span><button class="filter-chip is-on" data-filter="all">All notes</button>${Object.entries(topics.sections).map(([key, item]) => `<button class="filter-chip" data-filter="${key}">${esc(item.name)}</button>`).join('')}</div></header><div class="archive-list" id="archive-list">${posts.map(post => card(post, true)).join('')}</div><p class="empty-state" id="empty-state" hidden>No notes match that search. Try a device name or a different topic.</p>${moderationNotice()}</div>`;
  return shell({ title: 'All public posts — MuseAi Social', description: 'Every Learn, Build, Help, Show, and News note about Meta glasses and Meta integrations.', route: '/all/', content, active: 'all' });
}

function listingPage({ route, title, description, activeType = '', activeSubject = '', filtered }) {
  const list = filtered.length ? `<div class="archive-list">${filtered.map(post => card(post, true)).join('')}</div>` : `<div class="empty-topic"><span>NO PUBLIC THREADS YET</span><p>This room is ready for a working answer. No filler posts.</p><a class="text-link" href="${loginUrl('/new/')}">Sign in to contribute <i>↗</i></a></div>`;
  const content = `<div class="page-wrap archive-wrap">${taxonomy(activeType, activeSubject)}<header class="topic-intro" style="--topic:${activeType ? section(activeType).color : activeSubject ? subject(activeSubject).color : '#7c5cfc'}"><span class="eyebrow">${activeType ? 'FORMAT' : 'SUBJECT'} / PUBLIC ROOM</span><h1>${esc(title)}<span class="heading-period">.</span></h1><p>${esc(description)}</p><span class="topic-count">${filtered.length} ${filtered.length === 1 ? 'public note' : 'public notes'}</span></header>${list}<div class="back-index"><a href="${BASE}/">← Return to the knowledge field</a></div>${moderationNotice()}</div>`;
  return shell({ title: `${title} — Meta glasses and Meta integrations · MuseAi Social`, description, route, content, active: activeType });
}

function bodyBlock(item) {
  if (/^<h2>[\s\S]*<\/h2>$/.test(item) || /^<(ol|ul)>[\s\S]*<\/(ol|ul)>$/.test(item)) return item;
  return `<p>${esc(item)}</p>`;
}

function relatedPosts(post) {
  const same = posts.filter(other => other.slug !== post.slug && (other.subject === post.subject || other.topic === post.topic));
  const fill = posts.filter(other => other.slug !== post.slug && !same.includes(other));
  return [...same, ...fill].slice(0, 2);
}

function articlePage(post) {
  const kind = section(post.topic);
  const subj = subject(post.subject);
  const related = relatedPosts(post);
  const body = post.body.map(bodyBlock).join('\n');
  const comments = post.comments.length ? post.comments.map(comment => `<article class="comment"><div class="comment-by"><strong>${esc(comment.author)}</strong><time datetime="${esc(comment.date)}">${esc(comment.date)}</time></div><p>${esc(comment.body)}</p></article>`).join('') : '<p class="comment-empty">No replies yet. Sign in to be first.</p>';
  const content = `<div class="page-wrap article-wrap">${taxonomy(post.topic, post.subject)}<article class="article" style="--topic:${kind.color}"><div class="article-mast"><a class="entry-tag" href="${BASE}/topic/${post.topic}/">${esc(kind.name)}</a><span class="article-code">FIELD NOTE / ${post.date.replaceAll('-', '.')}</span></div><h1>${esc(post.title)}</h1><p class="article-deck">${esc(post.excerpt)}</p><div class="article-meta"><span class="author-mark" aria-hidden="true">✳</span><span><b>${esc(post.author)}</b><small>Published ${esc(post.date)}</small></span><span class="meta-divider"></span><a href="${BASE}/subject/${post.subject}/" class="subject-label" style="--subject:${subj.color}">${esc(subj.name)} ↗</a><span class="meta-divider"></span><span class="read-time">${Math.max(2, Math.ceil(post.body.join(' ').split(/\s+/).length / 210))} min read</span><span class="meta-divider"></span><span class="views-count">👁 ${Number(post.views) || 0} views</span></div>${post.image ? `<img class="article-cover" src="${BASE}/assets/${post.image}.webp" alt="Cover image for: ${esc(post.title)}">` : ''}<div class="article-body">${body}</div><div class="article-actions"><button type="button" class="static-vote" data-vote data-slug="${post.slug}" aria-label="Upvote this post">▲ <span data-vote-count>${Number(post.votes) || 0}</span> <small>upvotes</small></button><a class="button button-quiet" href="${loginUrl(`/${post.slug}/`, '#comments')}">Sign in to comment <span>↗</span></a><a class="save-link" href="${loginUrl(`/${post.slug}/`)}">Save for later</a></div></article><section class="comments-section" id="comments"><div class="section-heading"><div><span class="eyebrow">THREAD / ${post.comments.length} REPLIES</span><h2>What others added<span class="heading-period">.</span></h2></div><a class="text-link" href="${loginUrl(`/${post.slug}/`, '#comments')}">Join the thread ↗</a></div><div id="comments-list">${comments}</div><form id="comment-form" class="comment-form local-form" data-slug="${post.slug}"><label>Your name<input name="author" maxlength="48" required placeholder="Your name"></label><label>Reply<textarea name="body" rows="3" required placeholder="Add to the thread."></textarea></label><button class="button button-primary" type="submit">Post reply</button><p class="form-status" id="comment-status" role="status" aria-live="polite"></p></form></section><section class="related-section"><span class="eyebrow">FOLLOW THE THREAD</span><h2>Two notes in the same current.</h2><div class="related-grid">${related.map(other => `<a class="related-card" href="${postUrl(other)}"><span>${esc(section(other.topic).name)} / ${esc(subject(other.subject).name)}</span><strong>${esc(other.title)}</strong><i>Read related note ↗</i></a>`).join('')}</div><a class="topic-back" href="${BASE}/topic/${post.topic}/">Browse all in ${esc(kind.name)} →</a></section>${moderationNotice()}</div>`;
  return shell({ title: `${post.title} — MuseAi Social`, description: post.excerpt, route: `/${post.slug}/`, content, type: 'article', article: post, active: post.topic });
}

function newPostPage() {
  const content = `<div class="page-wrap draft-wrap">${taxonomy()}<div class="draft-shell"><span class="eyebrow">AUTHORING / LOCAL FIRST</span><h1>Capture a field note<span class="heading-period">.</span></h1><p class="draft-lead">Write a lesson or a build. This editor saves only to this browser and lets you export a JSON draft; it does not publish or send your content.</p><form id="draft-form" class="draft-form"><label>Post title<input name="title" maxlength="120" required placeholder="What did you learn or build?"></label><div class="form-pair"><label>Format<select name="topic">${Object.entries(topics.sections).map(([key, item]) => `<option value="${key}">${esc(item.name)}</option>`).join('')}</select></label><label>Subject<select name="subject">${Object.entries(topics.subjects).map(([key, item]) => `<option value="${key}">${esc(item.name)}</option>`).join('')}</select></label></div><label>What happened?<textarea name="body" rows="9" required placeholder="Share the steps, result, what failed, or how someone else can try it."></textarea></label><div class="draft-actions"><button class="button button-primary" type="submit">Save draft on this device <span>↓</span></button><button class="button button-quiet" type="button" id="export-draft">Export draft JSON <span>↗</span></button></div><p class="form-status" id="draft-status" aria-live="polite"></p></form><aside class="draft-boundary"><strong>Publishing needs the backend.</strong> With the server running (node backend/server.js), submitting publishes the post to the backend. Without it, the draft stays on this device until you export it. Comments, votes, saves, and joining remain behind the existing FED Hub login.</aside></div></div>`;
  return shell({ title: 'Draft a post — MuseAi Social', description: 'Create and save a local-only draft for MuseAi Social.', route: '/new/', content, noindex: true });
}

function loginPage() {
  const next = `<a class="button button-primary" href="${BASE}/all/">Return to the public index <span>↗</span></a>`;
  const content = `<div class="page-wrap login-wrap"><div class="login-card"><img src="${BASE}/assets/fed-symbol.svg" alt="" width="46" height="46"><span class="eyebrow">FED HUB / PORTABLE EDITION</span><h1>Member actions need a live sign-in service<span class="heading-period">.</span></h1><p>This portable static bundle has no authentication backend. The sign-in link is routed to this real HTML page rather than a dead endpoint; no password or personal information is collected here.</p><div class="login-actions">${next}<a class="text-link" href="${BASE}/community/">Open the community page <span>↗</span></a></div></div></div>`;
  return shell({ title: 'Sign-in information — MuseAi Social', description: 'Authentication is not configured in this portable static edition.', route: '/login/', content, noindex: true });
}

function communityPage() {
  const content = `<div class="page-wrap community-wrap"><section class="community-hero"><div><span class="eyebrow">THE ROOM / LIVE DISCORD WIDGET</span><h1>Bring the useful bits together<span class="heading-period">.</span></h1><p>Browse the public notes here, and find the live Discord widget at the bottom of this page.</p><a class="button button-primary" href="${BASE}/all/">Read the public index <span>↗</span></a></div><img src="${BASE}/assets/promo-loop.gif" alt="Animated comic scene of the FED mascot sharing a laugh with friendly gadget characters"></section><div class="community-links"><a class="related-card" href="${BASE}/support/"><span>KEEP THE PROJECT GOING</span><strong>Support the community through the age-gated provider choices.</strong><i>Open support page ↗</i></a><a class="related-card" href="${BASE}/topic/show/"><span>SHOW / PUBLIC NOTES</span><strong>Browse things that work, in public HTML.</strong><i>Explore Show notes ↗</i></a></div><section class="discord-section" aria-labelledby="discord-title"><div class="discord-heading"><span class="eyebrow">COMMUNITY CHAT / DISCORD</span><h2 id="discord-title">A proper room, centered.</h2><p>Discord controls this embedded view. If it does not load, the static site still works normally.</p></div><div class="discord-frame-wrap"><iframe src="https://discord.com/widget?id=1400235929154879490&amp;theme=dark" title="Git-FED Discord community widget" width="350" height="500" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe></div><p class="discord-note">The widget is hosted by Discord and may be unavailable due to browser settings, network restrictions, or server configuration.</p></section></div>`;
  return shell({ title: 'Community — MuseAi Social', description: 'A centered Discord community widget and public field notes for MuseAi Social.', route: '/community/', content, active: 'community' });
}

function supportPage() {
  const content = `<div class="page-wrap support-wrap"><section class="support-hero"><div class="support-copy"><span class="eyebrow">FED HUB / SUPPORT & SUBSCRIBE</span><h1>Keep the signal humming<span class="heading-period">.</span></h1><p>Choose a provider for one-time support, recurring support, or the Git-FED newsletter. All checkout actions stay with the named third-party provider.</p><div class="support-badges"><span>EXTERNAL CHECKOUT</span><span>18+ CONFIRMATION FIRST</span><span>NO KO-FI WIDGET</span></div></div><img src="${BASE}/assets/promo-support.webp" alt="The FED mascot puts a gold coin into a transparent support jar"></section>
    <section class="age-gate-panel" id="age-gate-panel" aria-labelledby="age-gate-title"><span class="eyebrow">AGE-GATED PAYMENT AREA</span><h2 id="age-gate-title">Before checkout, confirm you are 18 or older.</h2><p>This is a front-end age acknowledgment only. It does not verify identity or age, and it is not a substitute for legal or payment-provider compliance controls.</p><form id="age-gate-form"><label class="age-check"><input type="checkbox" name="age" value="confirmed" required><span>I confirm that I am at least 18 years old and agree to continue to the external provider options.</span></label><button class="button button-primary" type="submit">Confirm 18+ and view options <span>↘</span></button><a class="text-link" href="${BASE}/">I’m not 18 — go back <span>↗</span></a><p class="gate-status" id="gate-status" role="status" aria-live="polite"></p></form></section>
    <div class="provider-options" id="provider-options" hidden>
      <div class="provider-intro"><span class="eyebrow">PROVIDER DIRECTORY / CHECK BEFORE YOU PAY</span><h2>Pick the route that suits you.</h2><p>Amounts, renewal terms, availability, fees, and refunds are controlled by each provider. Review their checkout details before approving anything.</p></div>
      <section class="provider-group" aria-labelledby="recurring-title"><div class="provider-heading"><span class="provider-index">01</span><div><span class="eyebrow">RECURRING SUPPORT</span><h3 id="recurring-title">Subscription options</h3></div></div><div class="provider-grid">
        <article class="provider-card"><span class="provider-kicker">PAYPAL / SUBSCRIPTION</span><h4>Support with PayPal</h4><p>PayPal-hosted subscription flow. The plan and billing terms are presented by PayPal before approval.</p><div id="paypal-subscription-buttons" class="paypal-slot"><span class="provider-loading">PayPal checkout loads after the age confirmation.</span></div><p class="provider-status" id="paypal-status" role="status" aria-live="polite"></p></article>
        <article class="provider-card"><span class="provider-kicker">STRIPE / SECURE CHECKOUT</span><h4>Subscribe with Stripe</h4><p>Stripe’s hosted buy button appears after age confirmation. Verify the product and recurring terms in Stripe checkout.</p><div id="stripe-buy-button-slot" class="stripe-slot"><span class="provider-loading">Stripe checkout loads after the age confirmation.</span></div><p class="provider-status" id="stripe-status" role="status" aria-live="polite"></p></article>
        <article class="provider-card"><span class="provider-kicker">GITHUB SPONSORS</span><h4>Sponsor Git-FED</h4><p>Choose a monthly sponsorship level on GitHub. GitHub shows the amount and renewal terms.</p><a class="provider-button" href="https://github.com/sponsors/Git-FED" target="_blank" rel="noopener noreferrer">Open GitHub Sponsors ↗</a></article>
      </div></section>
      <section class="provider-group" aria-labelledby="oneoff-title"><div class="provider-heading"><span class="provider-index">02</span><div><span class="eyebrow">ONE-TIME SUPPORT</span><h3 id="oneoff-title">A tip or donation</h3></div></div><div class="provider-grid">
        <article class="provider-card"><span class="provider-kicker">BUY ME A COFFEE</span><h4>Buy me a book</h4><p>One-time support through the provider’s own checkout page.</p><a class="provider-button" href="https://www.buymeacoffee.com/fedpromptly" target="_blank" rel="noopener noreferrer">Open Buy Me a Coffee ↗</a></article>
        <article class="provider-card"><span class="provider-kicker">THANKS.DEV</span><h4>Back open-source dependencies</h4><p>Voluntary support for the Git-FED dependency profile.</p><a class="provider-button" href="https://thanks.dev/d/gh/git-fed/dependencies" target="_blank" rel="noopener noreferrer">Donate on thanks.dev ↗</a></article>
        <article class="provider-card"><span class="provider-kicker">NOWPAYMENTS / CRYPTO</span><h4>Crypto payment</h4><p>Review supported assets, exchange rate, fees, and final amount on NOWPayments before sending.</p><a class="provider-button" href="https://nowpayments.io/payment/?iid=5997958570&amp;source=button" target="_blank" rel="noopener noreferrer">Open NOWPayments ↗</a></article>
      </div></section>
      <section class="provider-group" aria-labelledby="newsletter-title"><div class="provider-heading"><span class="provider-index">03</span><div><span class="eyebrow">NEWSLETTER</span><h3 id="newsletter-title">Subscribe to GitFed</h3></div></div><div class="newsletter-card"><div><span class="provider-kicker">SUBSTACK / GITFED</span><h4>Field notes in your inbox.</h4><p>Newsletter signup opens the GitFed Substack page. Subscription choices and terms are shown there.</p></div><a class="provider-button" href="https://gitfed.substack.com/subscribe" target="_blank" rel="noopener noreferrer">Open GitFed on Substack ↗</a></div></section>
      <aside class="provider-disclosure"><strong>Static-site boundary:</strong> the age gate is only a browser-side confirmation and can be bypassed. Provider scripts and third-party checkout destinations are loaded/opened only after the visitor confirms; this ZIP does not process payments, store card data, verify age, or guarantee provider accounts/configuration are active.</aside>
      <a class="button button-quiet support-home" href="${BASE}/">Return to the public site <span>↗</span></a>
    </div></div>`;
  return shell({ title: 'Support & subscriptions — MuseAi Social', description: 'Age-gated third-party support, subscription, donation, and newsletter options for Git-FED.', route: '/support/', content, active: 'support' });
}

function thanksPage() {
  const content = `<div class="page-wrap thanks-wrap"><div class="thanks-card"><img class="thanks-avatar" src="${BASE}/assets/gitfed-avatar.webp" alt="Git-FED’s brown furry mascot with spiky black hair holding an orange four-star ball"><span class="eyebrow">THANK YOU / GIT-FED</span><h1>Small signals add up<span class="heading-period">.</span></h1><p>Thanks for considering support. The checkout choices are age-gated and remain with the provider you select.</p><div class="thanks-actions"><a class="button button-primary" href="${BASE}/support/">Open support options <span>↗</span></a><a class="text-link" href="${BASE}/">Back to the field <span>↗</span></a></div></div></div>`;
  return shell({ title: 'Thank you — MuseAi Social', description: 'A thank-you page for Git-FED community supporters.', route: '/thanks/', content });
}

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(path.join(SITE_DIR, 'assets'), { recursive: true });
for (const file of ['style.css', 'app.js', 'flow-field.js']) await fs.copyFile(path.join(ROOT, 'src', file), path.join(SITE_DIR, 'assets', file));
for (const file of ['fed-symbol.svg', 'promo-hero.webp', 'promo-glasses-mishap.webp', 'promo-build-lab.webp', 'promo-community.webp', 'promo-support.webp', 'promo-loop.gif', 'gitfed-avatar.webp', 'post-news.webp', 'post-hey-meta.webp', 'post-headset.webp', 'post-wayfarer.webp', 'post-photos.webp', 'post-drive-flow.webp', 'post-whatsapp.webp', 'post-neural-band.webp', 'post-quest.webp', 'post-oakley.webp', 'server-icon-reddit.webp', 'server-icon-discord.webp', 'server-icon-facebook.webp', 'server-icon-telegram.webp', 'server-icon-github.webp', 'server-icon-skool.webp', 'server-icon-forums.webp', 'server-icon-whop.webp', 'server-icon-token-town.webp']) {
  await fs.copyFile(path.join(ROOT, 'src/assets', file), path.join(SITE_DIR, 'assets', file));
}
await fs.copyFile(path.join(ROOT, 'src/assets/fed-symbol.ico'), path.join(OUT, 'favicon.ico'));
await fs.copyFile(path.join(ROOT, 'src/assets/fed-symbol.ico'), path.join(SITE_DIR, 'favicon.ico'));

await writePage('/', homePage());
await writePage('/all/', allPage());
for (const [key, item] of Object.entries(topics.sections)) {
  await writePage(`/topic/${key}/`, listingPage({ route: `/topic/${key}/`, title: item.name, description: item.desc, activeType: key, filtered: posts.filter(post => post.topic === key) }));
}
for (const [key, item] of Object.entries(topics.subjects)) {
  await writePage(`/subject/${key}/`, listingPage({ route: `/subject/${key}/`, title: item.name, description: item.desc, activeSubject: key, filtered: posts.filter(post => post.subject === key) }));
}
for (const post of posts) await writePage(`/${post.slug}/`, articlePage(post));
await writePage('/new/', newPostPage());
await writePage('/login/', loginPage());
await writePage('/community/', communityPage());
await writePage('/support/', supportPage());
await writePage('/thanks/', thanksPage());

const sitemapRoutes = ['/', '/all/', ...Object.keys(topics.sections).map(key => `/topic/${key}/`), ...Object.keys(topics.subjects).map(key => `/subject/${key}/`), ...posts.map(post => `/${post.slug}/`), '/community/', '/support/', '/thanks/'];
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes.map((route, index) => `  <url><loc>${canonical(route)}</loc><lastmod>${today}</lastmod><priority>${index === 0 ? '1.0' : route.startsWith('/topic/') || route.startsWith('/subject/') ? '0.8' : '0.9'}</priority></url>`).join('\n')}\n</urlset>\n`;
await fs.writeFile(path.join(OUT, 'sitemap.xml'), sitemap);
await fs.writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: ${BASE}/\nDisallow: ${BASE}/new.html\nDisallow: ${BASE}/login.html\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
await fs.writeFile(path.join(OUT, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n${BASE}/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n\n${BASE}/*\n  Cache-Control: public, max-age=0, must-revalidate\n`);
await fs.writeFile(path.join(OUT, '_redirects'), BASE ? `/ ${BASE}/ 301\n${BASE} ${BASE}/ 301\n` : '');
await fs.writeFile(path.join(OUT, '.nojekyll'), '');
// Root landing page: without this, every static host serves a 404 at /
// because the site itself lives under BASE (e.g. /social/). A real
// index.html redirect works on ALL static hosts, including GitHub Pages,
// which ignores _redirects entirely. Skipped for root deploys (BASE === ''),
// where writePage('/') already put the homepage at dist/index.html.
if (BASE) {
  const target = `${BASE}/`;
  await fs.writeFile(path.join(OUT, 'index.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=${target}">
  <meta name="robots" content="noindex,follow">
  <link rel="canonical" href="${canonical('/')}">
  <title>MuseAi Social — redirecting</title>
  <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0e0e14;color:#ececf1;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}main{text-align:center;padding:2rem}h1{font-size:1.6rem;margin:0 0 .5rem}p{color:#a1a1b3;margin:0 0 1.5rem}a{display:inline-block;padding:.8rem 1.4rem;border-radius:999px;background:#7c5cfc;color:#fff;text-decoration:none;font-weight:600}</style>
</head>
<body>
  <main><h1>MuseAi Social</h1><p>Opening the field notes&hellip;</p><a href="${target}">Continue to MuseAi Social &nearr;</a></main>
  <script>window.location.replace(${JSON.stringify(target)});</script>
</body>
</html>
`);
}
await fs.writeFile(path.join(OUT, '404.html'), shell({ title: 'Not found — MuseAi Social', description: 'That page was not found.', route: '/', relativeLinks: false, content: `<div class="page-wrap not-found"><span class="eyebrow">404 / OFF THE MAP</span><h1>No signal here<span class="heading-period">.</span></h1><a class="button button-primary" href="${BASE}/">Back to the field ↗</a></div>` }));
console.log(`Built ${sitemapRoutes.length} public pages, 3 utility pages, sitemap, robots, headers, and shared assets at ${SITE_DIR}.`);
