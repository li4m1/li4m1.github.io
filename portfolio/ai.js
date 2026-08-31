/* ═══ PORTFOLIO — AI VIDEO ══════════════════════════════════════════
   Generated and AI-assisted video. Same shape as clips.js, but this
   section accepts any aspect ratio — AI work is often 16:9.

     1. DEST=ai ALLOW_LANDSCAPE=1 ./ingest.sh /path/to/folder
     2. paste the printed entries below
     3. fix cat / platform / model / year

   Files live in media/ai/<slug>.mp4 and media/ai/posters/<slug>.jpg.

   ar comes from the ingest and drives the card and player shape:
   "9/16", "16/9" or "1/1". Leave AI_CLIPS empty for reserved slots.
═══════════════════════════════════════════════════════════════════ */

const AI_FILTERS = {
  all:    "All",
  brand:  "Brand",
  music:  "Music",
  concept:"Concept",
};

const AI_CLIPS = [
  { slug: "ai-part", title: "AI Part", cat: "concept", platform: "Instagram", year: "2026", dur: "0:33", ar: "1280/720", client: "" },
];

/* ── stills that belong with the AI work rather than the social feed.
   Same shape as posts.js; media lives in media/posts/ alongside the
   others, and the shared lightbox renders them. ── */
const AI_POST_FILTERS = {
  all:     "All",
  brand:   "Brand",
  concept: "Concept",
};

const AI_POSTS = [
  { slug: "arcteryx-shoot-ai", title: "Arc'teryx", cat: "brand", platform: "Instagram", year: "2026", client: "",
    ar: "1440/966",  slides: ["img","img","img","img","img","img"] },
  { slug: "corteiz-ai-shoot",  title: "Corteiz",   cat: "brand", platform: "Instagram", year: "2026", client: "",
    ar: "952/1440",  slides: ["img","img","img","img","img"] },
];
