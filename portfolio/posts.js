/* ═══ PORTFOLIO — STATIC POSTS ══════════════════════════════════════
   Stills, graphics and carousels posted to social. Renders the same
   way clips.js does. To add a post:

     1. ./ingest-img.sh /path/to/folder      (resizes + makes thumbs)
     2. paste the printed entry below
     3. fix cat / platform / client / year

   Files it expects, all made by ingest-img.sh:
     media/posts/<slug>-NN.jpg       a still, or a video slide's poster
     media/posts/<slug>-NN.mp4       a video slide
     media/posts/thumbs/<slug>.jpg   grid thumbnail

   slides is the carousel, one entry per position: "img" or "video".
   Files are numbered to match — <slug>-01, <slug>-02 … A video slide has
   both an .mp4 and a .jpg (its poster) at that number.

   Leave POSTS empty and the section shows reserved slots instead.
═══════════════════════════════════════════════════════════════════ */

const POST_FILTERS = {
  all:     "All",
  brand:   "Brand",
  music:   "Music",
  street:  "Street",
  graphic: "Graphic",
  ai:      "AI",
};

const POSTS = [
  { slug: "static-post-1", title: "How I Made This With AI", cat: "ai",    platform: "Instagram", year: "2026", client: "",
    ar: "1280/1250", slides: ["video","img","img","img","img","img","video","video","video","img"] },
  { slug: "static-post-2", title: "Frames From Our Last Shoot", cat: "brand", platform: "Instagram", year: "2026", client: "41 Shoots",
    ar: "1440/1440", slides: ["img","video","video","video","video"] },
];
