# Portfolio — Short Form

Vertical (9:16) social cuts. Lives at **janssonliam.de/portfolio/**, linked from
the `#work` section on the main page.

Same rules as the rest of the site: no build step, no dependencies, no trackers,
everything self-hosted.

```
portfolio/
  index.html      markup
  styles.css      tokens copied from the main site so both read as one system
  app.js          grid + vertical player
  clips.js        ← the only file you edit to add a clip
  ingest.sh       transcode + poster pipeline
  media/          <slug>.mp4
  media/posters/  <slug>.jpg
```

## Adding clips

```bash
./ingest.sh /path/to/folder/of/videos
```

It walks the folder, ignores anything landscape, keeps the highest-resolution
copy when the same clip appears more than once (proxies, "final v2"), transcodes
to max 1280 tall, pulls a poster, and prints ready-made `clips.js` entries.
Paste them into `CLIPS` and fix `cat` / `platform` / `client` / `year`.

Re-running is safe — anything already in `media/` is skipped, so it only picks up
what's new.

### Levers

| var | default | what it does |
|---|---|---|
| `CRF` | `26` | quality; lower = better + bigger |
| `MAXH` | `1280` | max height |
| `MAXRATE` | `1400k` | hard bitrate ceiling |
| `POSTER_AT` | — | seconds; force a specific poster frame |

```bash
CRF=24 ./ingest.sh ~/clips              # nicer, bigger
POSTER_AT=6.5 ./ingest.sh ~/clips       # after deleting the bad poster
```

## Size — read this before a big drop

The repo is on GitHub Pages and was already ~830 MB (mostly `.git` history from
`clips/`) before this folder existed. GitHub's soft limit is 1 GB.

At the default ceiling a clip costs roughly **1.4 Mbps × its length**:

| length | ≈ size |
|---|---|
| 15s | 2.6 MB |
| 30s | 5.3 MB |
| 60s | 10.5 MB |

So ~25 clips of 30s ≈ **130 MB**. That fits, but it isn't free, and **git never
forgets** — deleting an mp4 later shrinks the checkout, not the history. Two
things follow:

1. Ingest in batches and check `du -sh media/` before committing.
2. If it ever gets tight, the fix is external storage (R2/Bunny) and pointing
   `src()` in `app.js` at a CDN base URL, not a lower bitrate. 1.4 Mbps is about
   what Instagram itself serves; going below looks worse than the platform.

## Player

Grid loads posters only — a clip's mp4 is fetched on hover/focus, not on page
load. Click opens the viewer, which walks **the filtered set**, not all clips.

- `↑` `↓` `←` `→` — previous / next
- `Space` — play / pause
- `M` — sound
- `Esc` — close
- swipe up/down on touch

Sound preference is sticky across clips (browsers require a gesture before audio,
hence the toggle rather than autoplaying with sound).

---

# Static posts

Stills, graphics and carousels. Second section on the same page (`#static`),
rendered from `posts.js` exactly the way the video grid is rendered from
`clips.js`. While `POSTS` is empty the section shows reserved "SOON" slots,
same language as the main site's work grid.

## Adding posts

Two ingests, depending on the shape of the source.

### Carousels — one folder per post

```bash
./ingest-posts.sh "/path/to/folder of post folders"
```

Expects a folder per post, slides numbered, and **slides may mix stills and
video** the way an Instagram carousel does:

```
static posts/
  static post 1/   slide1.mov slide2.jpg … slide 10.jpg
  static post 2/   slide01.PNG slide02.mov …
```

Order comes from the number in each filename read **numerically**, so
`slide 10` lands tenth rather than sorting next to `slide1`. Output per post,
`NN` being the 1-based slide position:

```
media/posts/<slug>-NN.jpg   a still, or a video slide's poster
media/posts/<slug>-NN.mp4   a video slide
media/posts/thumbs/<slug>.jpg
```

`posts.js` records the shape in `slides: ["video","img",…]` — one entry per
position, matching the file numbers.

### Loose stills

```bash
./ingest-img.sh /path/to/folder/of/images
```

Resizes to 1440px on the long edge, builds a 640px grid thumb, prints the
`posts.js` entries. Uses `sips`, which ships with macOS — so it reads HEIC
straight off the phone and adds no dependency.

**Carousels group by filename.** A `-1 -2 -3` suffix collapses into one post:

```
drop-1.jpg  drop-2.jpg  drop-3.jpg   ->  one post, 3 frames
lookbook.jpg                          ->  one post, 1 frame
```

Frame order follows the number, so `-10` sorts after `-9` correctly.

### Levers

| var | default | what it does |
|---|---|---|
| `MAXPX` | `1440` | long edge of the full image |
| `THUMBPX` | `640` | long edge of the grid thumb |
| `QUALITY` | `72` | jpeg quality, 0-100 |

## Lightbox

Arrows walk a **flat list of every frame across the filtered posts** — so a
carousel plays to its end and then rolls into the next post, rather than
dead-ending. Dots show position within the current carousel.

- `←` `→` `↑` `↓` — previous / next slide
- `Esc` — close
- swipe left/right on touch

Video slides autoplay muted and loop, with a sound toggle that sticks across
slides. Dots mark which positions are video.

Note: `static posts/` living inside the short-form folder is pruned by
`ingest.sh`, so carousel slides never get ingested as short-form clips.

---

# Where to put source files

Both ingest scripts read a folder **in place** and only write compressed copies
into `media/`. You never have to move originals into the repo — and shouldn't.

Drop folders already made for you on the external drive:

```
/Volumes/2TB 2/short-form/     videos
/Volumes/2TB 2/static-posts/   images
```

The internal disk had **8.1 GB free** when this was written, so keep source
media on the 2TB drive (642 GB free). Only the transcoded output belongs in
the repo.

---

# AI video

Section 02, between short form and static posts. Runs from `ai.js`, media in
`media/ai/`. Empty for now, so it shows reserved slots.

```bash
DEST=ai ALLOW_LANDSCAPE=1 ./ingest.sh /path/to/folder
```

Two differences from the short-form ingest:

- `DEST=ai` writes to `media/ai/` instead of `media/`, keeping the two
  sections' media apart.
- `ALLOW_LANDSCAPE=1` keeps 16:9, which short form drops. The scaler caps the
  **long** edge at `MAXH`, so landscape isn't upscaled.

Each entry carries an `ar`, detected by the ingest as the encoded file's real
dimensions (`1280/720`, `720/1280`, `1280/1006` …) rather than a rounded bucket
— a 2750x2160 source keeps its true shape instead of being forced to 16/9 and
letterboxed.

**`ar` drives the player, not the grid.** Cards use one uniform shape per
section (`--card-ar`: 4/5 for short form, 16/9 for AI) and crop to fill;
the player restores the real ratio on open. Mixing ratios in a single grid
tears the rows apart — short wide cards leave gaps beside tall vertical ones
— so the grid stays regular and the clip gets its true shape where it
actually matters.

## How the sections share one player

`app.js` builds video grids through `makeVideoSection(cfg)`, called once for
short form and once for AI. They share a single `Viewer`, which is handed the
calling section's filtered list and media folder on open — so prev/next never
walks out of the grid the visitor clicked, and the sound preference is sticky
across both.
