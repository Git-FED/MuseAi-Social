// MuseAi Social backend — zero-dependency Node server.
// Serves the flat static site in dist/ and a small JSON API for the post area:
// posts, comments, and votes, stored in backend/data.json (seeded from
// backend/seed.json on first run). No database, no packages to install.
// Run:  node backend/server.js        (or: npm start)
// Then open http://localhost:3000/ — the site works with a live backend.
// Without this server the static files still work, but new posts, comments,
// and votes stay local-only in the browser.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DATA_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data.json');
const SEED_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed.json');
const PORT = Number(process.env.PORT || 3000);

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.copyFileSync(SEED_FILE, DATA_FILE);
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

const slugify = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'post';
const today = () => new Date().toISOString().slice(0, 10);
const sendJson = (res, status, value) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
};

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 200_000) throw new Error('body too large');
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!rel) rel = 'index.html';
  const file = path.resolve(DIST, rel);
  if (!file.startsWith(DIST)) {
    res.writeHead(403); res.end('forbidden'); return;
  }
  let target = file;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, 'index.html');
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    const notFound = path.join(DIST, '404.html');
    res.writeHead(404, { 'Content-Type': MIME['.html'] });
    res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(target)] || 'application/octet-stream' });
  fs.createReadStream(target).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/api/')) {
      if (req.method !== 'GET') { res.writeHead(405); res.end('method not allowed'); return; }
      serveStatic(req, res);
      return;
    }

    const data = loadData();
    const parts = url.pathname.split('/').filter(Boolean);

    // GET /api/topics
    if (req.method === 'GET' && parts.join('/') === 'api/topics') {
      sendJson(res, 200, data.topics);
      return;
    }

    // GET /api/posts
    if (req.method === 'GET' && parts.join('/') === 'api/posts') {
      sendJson(res, 200, data.posts);
      return;
    }

    // GET /api/posts/:slug
    if (req.method === 'GET' && parts.length === 3 && parts[0] === 'api' && parts[1] === 'posts') {
      const post = data.posts.find(p => p.slug === parts[2]);
      if (!post) { sendJson(res, 404, { error: 'post not found' }); return; }
      sendJson(res, 200, post);
      return;
    }

    // POST /api/posts
    if (req.method === 'POST' && parts.join('/') === 'api/posts') {
      const body = await readBody(req);
      const title = String(body.title || '').trim();
      const text = String(body.body || '').trim();
      const topic = String(body.topic || '').trim();
      const subject = String(body.subject || '').trim();
      if (!title || !text) { sendJson(res, 400, { error: 'title and body are required' }); return; }
      if (!data.topics.sections[topic]) { sendJson(res, 400, { error: 'unknown topic' }); return; }
      if (!data.topics.subjects[subject]) { sendJson(res, 400, { error: 'unknown subject' }); return; }
      const slug = slugify(title);
      if (data.posts.some(p => p.slug === slug)) { sendJson(res, 409, { error: 'a post with that title already exists' }); return; }
      const post = {
        slug,
        title,
        topic,
        subject,
        author: String(body.author || 'Guest').trim() || 'Guest',
        date: today(),
        read: 0,
        votes: 0,
        excerpt: text.slice(0, 160),
        body: text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean),
        comments: [],
      };
      data.posts.unshift(post);
      saveData(data);
      sendJson(res, 201, post);
      return;
    }

    // POST /api/posts/:slug/comments
    if (req.method === 'POST' && parts.length === 4 && parts[0] === 'api' && parts[1] === 'posts' && parts[3] === 'comments') {
      const post = data.posts.find(p => p.slug === parts[2]);
      if (!post) { sendJson(res, 404, { error: 'post not found' }); return; }
      const body = await readBody(req);
      const author = String(body.author || '').trim();
      const text = String(body.body || '').trim();
      if (!author || !text) { sendJson(res, 400, { error: 'author and body are required' }); return; }
      const comment = { author, date: today(), body: text };
      post.comments.push(comment);
      saveData(data);
      sendJson(res, 201, comment);
      return;
    }

    // POST /api/posts/:slug/vote
    if (req.method === 'POST' && parts.length === 4 && parts[0] === 'api' && parts[1] === 'posts' && parts[3] === 'vote') {
      const post = data.posts.find(p => p.slug === parts[2]);
      if (!post) { sendJson(res, 404, { error: 'post not found' }); return; }
      post.votes = (Number(post.votes) || 0) + 1;
      saveData(data);
      sendJson(res, 200, { slug: post.slug, votes: post.votes });
      return;
    }

    sendJson(res, 404, { error: 'unknown api route' });
  } catch (error) {
    sendJson(res, 400, { error: error.message || 'bad request' });
  }
});

server.listen(PORT, () => {
  console.log(`MuseAi Social backend running at http://localhost:${PORT}/`);
  console.log('Static site: dist/  ·  API: /api/posts, /api/topics  ·  Data: backend/data.json');
});
