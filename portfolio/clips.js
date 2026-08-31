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
  { slug: "4eva-1-new",              title: "4eva",              cat: "music",  platform: "Instagram", year: "2026", dur: "0:11", ar: "1280/720",  client: "" },
  { slug: "nev-2-resize",            title: "Nev II",            cat: "music",  platform: "TikTok",    year: "2026", dur: "0:39", ar: "720/1280",  client: "" },
  { slug: "berlin-final",            title: "Berlin",            cat: "brand",  platform: "Instagram", year: "2026", dur: "1:16", ar: "1280/720",  client: "" },
  { slug: "teaser-tempelhof",        title: "Teaser Tempelhof",  cat: "brand",  platform: "Instagram", year: "2025", dur: "0:20", ar: "720/1280",  client: "" },
  { slug: "bts-ubahn-reel",          title: "BTS U-Bahn",        cat: "street", platform: "Instagram", year: "2025", dur: "1:05", ar: "720/1280",  client: "" },
  { slug: "berlin41",                title: "Berlin 41",         cat: "brand",  platform: "Instagram", year: "2024", dur: "0:32", ar: "720/1280",  client: "41 Shoots" },
  { slug: "aw26",                    title: "AW26",              cat: "brand",  platform: "Instagram", year: "2024", dur: "0:41", ar: "720/1280",  client: "" },
  { slug: "nev-final",               title: "Nev",               cat: "music",  platform: "TikTok",    year: "2024", dur: "0:34", ar: "406/720",   client: "" },
  { slug: "bts-final",               title: "Behind The Scenes", cat: "street", platform: "Instagram", year: "2024", dur: "0:16", ar: "406/720",   client: "" },
  { slug: "c4809",                   title: "C4809",             cat: "street", platform: "TikTok",    year: "2024", dur: "0:09", ar: "406/720",   client: "" },
];
