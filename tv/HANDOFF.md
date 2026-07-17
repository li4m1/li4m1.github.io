# JANSSON TV — Handoff

_Last updated: 2026-07-17. Read this before touching anything in `tv/`._

## What this is

**janssonliam.de/tv** — a television station, not a video page. A real CRT photograph is
the set; Liam's curated music videos broadcast inside its glass on a live schedule derived
from the wall clock. No scrubber, no library view: you power on, you surf, you catch songs
mid-play. Full design rationale + research → `BRIEF.md`. User-facing docs → `README.md`.

**Status:** live and working. Layout = photo-set version with the simplified dock
(power · CH ▲▼ · pause · skip · guide). Liam explicitly rejected volume/mute UI and the
on-screen remote — do not bring them back.

## Files

| File | Role |
|---|---|
| `index.html` | markup: room → `.set` (photo + `.screen`) → dock, guide overlay. Cache-bust `?v=` on css/js — **bump on every change** |
| `styles.css` | all styling incl. CRT stack, glass mapping, container-query OSD sizing |
| `app.js` | broadcast engine (schedule math, tuning, pause/skip, OSD, WebAudio, guide) |
| `channels.js` | **the station programming — the only file to touch for content** |
| `tv-set.jpg` | Liam's CRT photo (1200×1200). The set. Came from chat; original quality, don't recompress |
| `jtv-logo.svg` / `.png` | MTV-style JTV logo (standalone SVG has Captions embedded as data-URI; PNG is a transparent 1092×966 render). Inline copy lives in `index.html` (standby badge) |
| `BRIEF.md` | the design prompt (concept, research, rules) — historical, don't retrofit |

Videos are **referenced in place from `/music/`** at the repo root — never duplicated into `tv/`.

## The broadcast engine (app.js)

- **Live sync:** for a channel, `pos = ((now − STATION.epoch)/1000) % Σdur`, walk the playlist
  to find item + offset, seek there. `STATION.epoch` is fixed UTC in `channels.js` — never
  change it casually (it shifts every viewer's "what's on now").
- **`tuneToken`** invalidates every in-flight async tune — any new action increments it;
  stale callbacks check `token !== tuneToken` and bail. Keep this pattern for anything async.
- **`ended` →** recompute from clock → static blip → next (self-correcting drift).
- **Pause = timeshift:** `userPaused` flag, video pauses, gold `❚❚ PAUSE` OSD. On resume it
  continues where it stopped; when the video ends it **rejoins the live clock**.
- **Skip:** plays the next playlist item from 0 and sets `timeshifted = true`; cleared when
  `playFromClock` runs again (video end / channel change).
- **visibilitychange resync** puts a returning tab back on the live clock — but respects
  `userPaused || timeshifted` (never yank a timeshifted viewer).
- **Aspect rule:** on `loadedmetadata`, AR > 1.5 → `object-fit:contain` (widescreen letterbox),
  else `cover` (4:3 fills the tube = CRT overscan).
- **Dead channels:** any dial number (1–45) without an entry = canvas static + hiss.
  CH ▲▼ only visits programmed channels; typed digits can land anywhere.
- **All sound is WebAudio-synthesized** (noise buffer bursts, hiss, button click). No audio files.

## Programming the station (channels.js)

Add a video: drop `.mp4` (H.264) in `/music/`, then
`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "file.mp4"`
and add `{ file, artist, title, meta, dur }` to a playlist. **`dur` must be ffprobe-exact**
or the live schedule drifts. Lineup: CH 03 BOOM BAP (NYC), CH 07 PIRATE FEED (UK, `pirate:true`
switches lower-third styling to tape labels), CH 12 OFF AIR (test card + Berlin clock),
CH 41 easter-egg ident card → 41shoots.janssonliam.de.

## The photo set (the fragile part)

- `.screen` is mapped onto the photo's glass: `left:33.0%; top:34.8%; width:33.3%; height:27.1%;
  border-radius:10%/13%` — percentages of `.set` (which is `min(185vmin, 2200px)`, square,
  `translateY(2%)`).
- **If the photo is ever swapped or re-cropped, re-tune the mapping**: serve locally, inject
  `.screen{background:rgba(255,0,0,.4)!important}` via playwright `addStyleTag`, screenshot,
  measure against the glass, adjust the four percentages. That's exactly how it was aligned.
- OSD/lower-third/test-card type is sized in **`cqi`** (container = `.screen`), so it scales
  with the glass automatically. Don't reintroduce vmin/px sizes inside the screen.
- **Standby:** `body:not(.on)` hides the `<video>` and the fx stack so the photo's own glowing
  color bars show through, with the inline JTV badge on `.screen-off`. This is deliberate —
  the dead TV never goes black.
- `html,body` and `.room` use `overflow:clip` — REQUIRED: the oversized set otherwise expands
  the mobile layout viewport and breaks the fixed dock (was a real bug, verified fixed at 390×844).

## House rules

No build step, no dependencies, no external requests, no analytics, no cookies
(localStorage: `jtv-ch` only). Fonts/assets via **root-absolute paths** (`/Captions.woff2`,
`/fonts/…`, `/crown.png`, `/music/…`) — pages must be served from the **repo root**.
Full `prefers-reduced-motion` path (no boot flash, static = single frame, no flicker/roll).
Colors locked: crown `#6C1ADB`, gold `#F0B429`, night `#02010A`, deep `#2B0A72`,
ink `#140933`, cream `#F4F1EA`. OSD is gold, mono (JetBrains); display type is Captions.

## Local dev + verification

- Serve repo root with a **Range-request** server (`npx http-server -p 8080` — NOT
  `python3 -m http.server`, seeking breaks) → `http://localhost:8080/tv/`.
- E2E: playwright lives in `~/shoot-planner/node_modules`. Pattern:
  `cd ~/shoot-planner && NODE_PATH=$HOME/shoot-planner/node_modules node <script>` with
  `chromium.launch({ channel: "chrome", args: ["--no-proxy-server", "--autoplay-policy=no-user-gesture-required"] })`
  (bundled playwright browsers aren't downloaded; system Chrome works).
- A scratch range-server + verify scripts existed in the session scratchpad — trivial to rewrite.

## Deploy

`git push origin main` → GitHub Pages (repo `li4m1/li4m1.github.io`, domain via CNAME).
Verify: `curl -I https://janssonliam.de/tv/…`; videos must return **206** with a Range header.
Builds usually land in 1–3 min; the 2026-07-17 photo-layout build was abnormally slow (>15 min
"building") — check `gh api repos/li4m1/li4m1.github.io/pages/builds/latest` before assuming breakage.
A browser `net::ERR_ABORTED` on a video mid-tune is normal (range-request switchover), not a bug.

## Known trade-offs & backlog

- 16:9 rips letterbox inside the 1.23:1 glass (authentic; Liam hasn't objected).
- Mobile has no digit entry since the remote was removed → CH 41 unreachable on touch
  (guide row for 41 still works — it's clickable/tappable there).
- Ideas parked, unbuilt: station idents between videos, JTV logo color variants
  (all-vector, minutes each), mp3s over the CH 12 test card as night radio,
  airbrushed-texture logo via nano_banana_pro (needs Liam's OK — costs credits),
  guide accessible from standby.
- Liam's standing rules: push changes live immediately; keep everything credit-free
  (vector/CSS before image-gen); never re-add volume/mute UI or the remote.
