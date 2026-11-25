# MuseAi Social — backended Space source

This is the source of the MuseAi Social space that runs inside Muse
(the Muse AI backend): a React client plus typed server actions and a
database, so posts, comments, votes, saves, topic follows, and rooms
are all saved server-side instead of living in the browser.

- client/ — the page (feed, article view, new-post form, topics,
  community with the Discord widget, support with the 18+ gate, thanks)
- server/src/actions.ts — the backend actions (getFeed, getPost,
  createPost, addComment, toggleVote, toggleSave, toggleFollowTopic,
  listRooms, createRoom, importSiteContent)
- server/src/seed-data.ts — your 10 posts, comments, and taxonomy,
  imported verbatim from MuseAi-Social-Portable1.zip
- server/src/schema.ts + drizzle/ — the database shape
- space.json — the space metadata

The live version runs in your Muse as the "MuseAi Social" space; the
10 starter posts import themselves on first run. For the portable
copy that runs anywhere with Node, use
MuseAi-Social-Portable-BACKEND.zip (flat site + backend/server.js).
