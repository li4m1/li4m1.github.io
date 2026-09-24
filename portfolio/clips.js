/* ═══ PORTFOLIO — SHORT FORM ════════════════════════════════════════
   The whole subsite renders from this one array. To add a clip:

     1. ./ingest.sh /path/to/folder     (transcodes + makes the poster)
     2. paste the printed entry below
     3. fix cat / platform / client / year

   Files it expects, both made by ingest.sh:
     media/<slug>.mp4          the clip
     media/posters/<slug>.jpg  the poster frame

   cat must be one of the FILTERS keys below, or it won't be reachable.
   Order here is the order on the page and in the viewer.
═══════════════════════════════════════════════════════════════════ */

const FILTERS = {
  all:      "All",
  brand:    "Brand",
  music:    "Music",
  street:   "Street",
  personal: "Personal",
};

const CLIPS = [
  { slug: "berlin-final",            title: "Berlin",            cat: "brand",  platform: "Instagram", year: "2026", dur: "1:16", ar: "1280/720",  client: "" },
  { slug: "4eva-1-new",              title: "4eva",              cat: "music",  platform: "Instagram", year: "2026", dur: "0:11", ar: "1280/720",  client: "" },
  { slug: "nev-2-resize",            title: "Nev II",            cat: "music",  platform: "TikTok",    year: "2026", dur: "0:39", ar: "720/1280",  client: "" },
  { slug: "aw26",                    title: "AW26",              cat: "brand",  platform: "Instagram", year: "2024", dur: "0:41", ar: "720/1280",  client: "" },
  { slug: "bts-ubahn-reel",          title: "BTS U-Bahn",        cat: "street", platform: "Instagram", year: "2025", dur: "1:05", ar: "720/1280",  client: "" },
  { slug: "dreh-bts-1",              title: "Dreh BTS",          cat: "street", platform: "Instagram", year: "2026", dur: "0:40", ar: "1280/1006", client: "" },
  { slug: "berkin-dreh-timeline",    title: "Runnin'",          cat: "brand",  platform: "Instagram", year: "2026", dur: "2:12", ar: "1280/720",  client: "" },
  { slug: "lichter",                 title: "Lichter",           cat: "brand",  platform: "Instagram", year: "2026", dur: "0:19", ar: "1280/1006", client: "" },
  { slug: "thats-not-me-1",          title: "That's Not Me",     cat: "music",  platform: "Instagram", year: "2026", dur: "0:22", ar: "1280/720",  client: "" },
  { slug: "benni-1-7",               title: "Benni II",          cat: "music",  platform: "Instagram", year: "2026", dur: "0:11", ar: "720/1280",  client: "" },
  { slug: "benni-1-6",               title: "Benni",             cat: "music",  platform: "Instagram", year: "2026", dur: "0:38", ar: "720/1280",  client: "" },
  { slug: "crazy-vid-1",             title: "7-Eleven",          cat: "street", platform: "Instagram", year: "2026", dur: "0:15", ar: "1280/720",  client: "" },
  { slug: "where-is-he",             title: "Where Is He",       cat: "street", platform: "Instagram", year: "2026", dur: "0:22", ar: "1280/1006", client: "" },
  { slug: "malta-finall",            title: "Malta",             cat: "brand",  platform: "Instagram", year: "2026", dur: "0:30", ar: "1280/1006", client: "" },
  { slug: "song-scene",              title: "Song Scene",        cat: "music",  platform: "Instagram", year: "2026", dur: "0:04", ar: "1280/1006", client: "" },
  { slug: "soir-aftermovie",         title: "Soir Aftermovie",   cat: "street", platform: "Instagram", year: "2026", dur: "0:27", ar: "720/1280",  client: "" },
  { slug: "trailer-4-week-2-2160-1", title: "Trailer",           cat: "brand",  platform: "Instagram", year: "2026", dur: "0:21", ar: "1280/1280", client: "" },
  { slug: "halo-new",                title: "Halo",              cat: "music",  platform: "Instagram", year: "2026", dur: "0:18", ar: "720/1280",  client: "" },
  { slug: "4eva-2-final",            title: "4eva II",           cat: "music",  platform: "Instagram", year: "2026", dur: "0:10", ar: "1280/720",  client: "" },
  { slug: "teaser-tempelhof",        title: "Teaser Tempelhof",  cat: "brand",  platform: "Instagram", year: "2025", dur: "0:20", ar: "720/1280",  client: "MMAAH" },
  { slug: "berlin41",                title: "Berlin 41",         cat: "brand",  platform: "Instagram", year: "2024", dur: "0:32", ar: "720/1280",  client: "41 Shoots" },
  { slug: "nev-final",               title: "Nev",               cat: "music",  platform: "TikTok",    year: "2024", dur: "0:34", ar: "406/720",   client: "" },

  /* ── Iberia Eclipse ── */
  { slug: "04-artist-caleb-jackson", title: "Artist Caleb Jackson", cat: "brand", platform: "Instagram", year: "2026", dur: "0:42", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "artist-calabasa", title: "Artist Calabasa", cat: "brand", platform: "Instagram", year: "2026", dur: "1:03", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "artist-freddy-k", title: "Artist Freddy K", cat: "brand", platform: "Instagram", year: "2026", dur: "0:44", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "artist-honeyluv", title: "Artist Honeyluv", cat: "brand", platform: "Instagram", year: "2026", dur: "0:37", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "artist-nacho", title: "Artist Nacho", cat: "brand", platform: "Instagram", year: "2026", dur: "0:45", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "artist-natalie-robinson", title: "Artist Natalie Robinson", cat: "brand", platform: "Instagram", year: "2026", dur: "0:34", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "anna-final", title: "Anna", cat: "brand", platform: "Instagram", year: "2026", dur: "1:03", ar: "724/1280", client: "Iberia Eclipse" },
  { slug: "bts-montage", title: "BTS Montage", cat: "brand", platform: "Instagram", year: "2026", dur: "0:41", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "0619", title: "BTS Footage", cat: "brand", platform: "Instagram", year: "2026", dur: "0:47", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "0619-3", title: "BTS Footage 2", cat: "brand", platform: "Instagram", year: "2026", dur: "0:35", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "0619-4", title: "BTS Footage 3", cat: "brand", platform: "Instagram", year: "2026", dur: "0:48", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "emotional-1", title: "Emotional #1", cat: "brand", platform: "Instagram", year: "2026", dur: "0:45", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "emotional-2", title: "Emotional #2", cat: "brand", platform: "Instagram", year: "2026", dur: "0:52", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "emotional-3", title: "Emotional #3", cat: "brand", platform: "Instagram", year: "2026", dur: "0:49", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "informative-3", title: "Informative #3", cat: "brand", platform: "Instagram", year: "2026", dur: "0:41", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "informative-4", title: "Informative #4", cat: "brand", platform: "Instagram", year: "2026", dur: "0:32", ar: "720/1280", client: "Iberia Eclipse" },
  { slug: "viral-3", title: "Viral #3", cat: "brand", platform: "Instagram", year: "2026", dur: "0:53", ar: "720/1280", client: "Iberia Eclipse" },
  /* ── Milano Vice + MMAAH ── */
  { slug: "cutdown-aftermovie", title: "Cutdown Aftermovie", cat: "brand", platform: "Instagram", year: "2026", dur: "0:45", ar: "720/1280", client: "Milano Vice" },
  { slug: "founder-interview", title: "Founder Interview", cat: "brand", platform: "Instagram", year: "2026", dur: "1:06", ar: "720/1280", client: "Milano Vice" },
  { slug: "mv-rudi-interview", title: "Rudi Interview", cat: "brand", platform: "Instagram", year: "2026", dur: "1:01", ar: "720/1280", client: "Milano Vice" },
  { slug: "pizzaturm-new-song", title: "Pizzaturm — New Song", cat: "brand", platform: "Instagram", year: "2026", dur: "0:15", ar: "720/1280", client: "Milano Vice" },
  { slug: "rudi-preisvideo-final", title: "Rudi Preisvideo", cat: "brand", platform: "Instagram", year: "2026", dur: "0:45", ar: "720/1280", client: "Milano Vice" },
  { slug: "wind-reel-u-berarbeitet", title: "Wind Reel", cat: "brand", platform: "Instagram", year: "2026", dur: "0:08", ar: "720/1280", client: "Milano Vice" },
  { slug: "hamburg-teaser-final", title: "Hamburg Teaser", cat: "brand", platform: "Instagram", year: "2026", dur: "0:15", ar: "720/1280", client: "MMAAH" },
  { slug: "mmaah-interview", title: "MMAAH Interview", cat: "brand", platform: "Instagram", year: "2026", dur: "0:31", ar: "720/1280", client: "MMAAH" },
  /* ── MIRAGE INTRO + Takumi ── */
  { slug: "mirage-intro", title: "Mirage Intro", cat: "brand", platform: "Instagram", year: "2026", dur: "0:28", ar: "1280/720", client: "" },
  { slug: "indoor-outdoor-1-final", title: "Indoor & Outdoor 1", cat: "brand", platform: "Instagram", year: "2026", dur: "0:13", ar: "720/1280", client: "Takumi" },
  { slug: "indoor-outdoor-2-final", title: "Indoor & Outdoor 2", cat: "brand", platform: "Instagram", year: "2026", dur: "0:11", ar: "720/1280", client: "Takumi" },
  { slug: "ugc-1", title: "UGC 1", cat: "brand", platform: "Instagram", year: "2026", dur: "0:22", ar: "720/1280", client: "Takumi" },
  { slug: "ugc-2", title: "UGC 2", cat: "brand", platform: "Instagram", year: "2026", dur: "0:14", ar: "720/1280", client: "Takumi" },
  { slug: "ugc-3", title: "UGC 3", cat: "brand", platform: "Instagram", year: "2026", dur: "0:19", ar: "720/1280", client: "Takumi" },
  { slug: "ugc-4", title: "UGC 4", cat: "brand", platform: "Instagram", year: "2026", dur: "0:31", ar: "720/1280", client: "Takumi" },
  { slug: "vibe-1-final", title: "Vibe 1", cat: "brand", platform: "Instagram", year: "2026", dur: "0:12", ar: "720/1280", client: "Takumi" },
  { slug: "vibe-2-final", title: "Vibe 2", cat: "brand", platform: "Instagram", year: "2026", dur: "0:11", ar: "720/1280", client: "Takumi" },
  { slug: "vibe-3-final", title: "Vibe 3", cat: "brand", platform: "Instagram", year: "2026", dur: "0:11", ar: "720/1280", client: "Takumi" },
  { slug: "vibe-4-final", title: "Vibe 4", cat: "brand", platform: "Instagram", year: "2026", dur: "0:13", ar: "720/1280", client: "Takumi" },
];
