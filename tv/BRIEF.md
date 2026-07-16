# JANSSON TV — Design Brief (the prompt)

_Enhanced from: "I want JANSSON TV, but only with music videos of my choice. Deep research on
the design, make it an in-depth prompt, apply it, execute. As creative and cool as possible."_
_Research inputs: CathodeRetro's CRT-faking techniques doc, RetroArch CRT-filter guides,
MyRetroTVs / My90sTV channel-surf simulators, VCR-OSD typography references, MTV's 25-year
Kabel lower-third system, canvas noise performance patterns._

## 1. Concept

**janssonliam.de/tv** is a television station, not a video page. One CRT set in a dark room,
broadcasting Liam's personal music-video archive on a real schedule. You don't browse — you
**tune**. The channel is playing whether you're watching or not: playback position is derived
from the wall clock against a fixed station epoch, so two people who open the page at the same
moment see the same frame, and revisiting mid-song feels like catching a video halfway through,
exactly like 1995. No thumbnails, no scrubber, no "next" button. The station decides; you surf.

Content: **only the curated music videos in `/music/`** — the 90s NYC boom-bap archive and the
UK tape rips. No portfolio clips, no self-promo channel. The taste *is* the content.

## 2. What the research says

1. **A CRT is a stack, not a filter** (CathodeRetro). Authenticity = scanlines + RGB slot-mask
   + edge vignette/curvature + glass diffusion/glow, composited in that order, each at LOW
   opacity. Overcooked scanlines cause moiré against low-res video; subtlety reads as real.
2. **Live > library** (MyRetroTVs). Channels that loop on clock time and can't be paused are
   the entire magic trick. Random-access playback kills the fantasy instantly.
3. **The OSD is the typography moment** (VCR-OSD references). Blocky mono type, top-right
   channel number, segmented volume bar, all with slight glow — drawn "by the TV", so it sits
   *under* the glass reflections, above the picture.
4. **The lower third is the music-TV signature** (MTV). Artist / "Song" / year · label, slides
   in when a video starts and again before it ends, one brand typeface, always the same corner.
   This single element says "music television" louder than any logo.
5. **Static is a canvas job**: small buffer (~160×120) filled via `Uint32Array` +
   `putImageData`, upscaled with `image-rendering: pixelated`, ~30fps. Runs only during bursts
   and dead channels — near-zero cost.
6. **The set sells it**: bezel, speaker grille, model plate, power LED, physical buttons.
   The TV must feel like an object in a room, not a `<video>` in a div.

## 3. Brand system (non-negotiable, carried from v1/v2)

- Colors: crown purple `#6C1ADB`, gold `#F0B429`, night `#02010A`, deep purple `#2B0A72`,
  ink `#140933`, cream `#F4F1EA`. OSD is **gold** (house), not VCR-green.
- Fonts self-hosted, root-absolute like fx-lab: Captions (`/Captions.woff2`) for lower-third
  artist names + brand plate; JetBrains Mono (`/fonts/JetBrainsMono-var.woff2`) for ALL OSD,
  guide, labels; Inter (`/fonts/Inter-var.woff2`) for the rare sentence.
- Crown: on the set's brand plate ("JANSSON ♛ COLORTRON-2600 · BERLIN") and as home link.
- Playful in the details, professional in the structure.

## 4. Set design (the room)

- Night-black room, radial falloff, giant ghost "JANSSON" watermark at ~3% cream behind the set.
- The CRT set centered, ~big as the viewport allows at **4:3 screen** (real CRT ratio; 16:9
  rips letterbox — that's authentic broadcast, the 4:3 rips fill the tube perfectly).
- **Ambilight**: a blurred glow behind the set, tinted live by sampling the video to a 1×1
  canvas every ~400ms, mixed 40% toward crown purple. The room breathes with the broadcast.
- Bezel: charcoal-ink plastic, rounded, inner shadow; control strip below the tube with
  speaker grille lines, brand plate, and physical buttons: POWER (LED: red standby / gold on),
  CH ▲▼, VOL ▲▼, MUTE, GUIDE.
- Screen stack (in order): picture (video / noise canvas / cards) → slot-mask stripes →
  scanlines → slow drifting roll-bar band → flicker (±1.5% opacity) → vignette+curvature →
  OSD layer → glass reflection → boot flash overlay. `border-radius` + corner shading fake
  the bulge; no WebGL needed.

## 5. Broadcast engine

- `channels.js` is the only file you touch to program the station (fx-lab pattern).
- Station epoch: fixed UTC timestamp. For a channel with total playlist duration T:
  `pos = (now − epoch) mod T` → binary-walk to current video + offset. Seek there on tune.
- `ended` → recompute from clock (self-correcting drift) → brief static blip → next video.
- **Channel lineup** (dial has gaps like a real UHF band; everything else is dead static):
  - **CH 03 — BOOM BAP**: the seven NYC videos, ~30 min loop.
  - **CH 07 — PIRATE FEED**: the four UK tape rips, ~9 min loop; lower thirds styled as
    tape labels ("PIRATE TAPE"), not record credits.
  - **CH 12 — OFF AIR**: house-palette color bars test card, crown, station ident, live clock.
  - **CH 41 — easter egg**: encrypted-feed card for 41SHOOTS, links to the subdomain.
- Typing digits on keyboard/remote tunes directly (OSD echoes `0—` then `07`); typing a dead
  number lands on full static + hiss with the number displayed — real TVs let you get lost.
  CH ▲▼ only steps through programmed channels (channel memory).

## 6. Interactions

- **Power-on is the entry choreography** (replaces any loader): page loads to a dark set,
  red standby LED, one hint. Pressing POWER = the autoplay-unlocking user gesture → CRT
  turn-on animation (horizontal white line snaps open, flash, settle ≤700ms) → static burst →
  tunes to last-watched channel, **sound on**. Power off = collapse to a white dot.
- **Surfing**: ↑/↓ keys, panel/remote buttons, or swipe up/down on the tube (mobile). Every
  change = randomized 280–450ms static burst + white-noise pop (WebAudio-synthesized, no files).
- **Volume**: ←/→, buttons, segmented gold OSD bar. M mutes (persistent MUTE badge).
- **Remote control**: desktop gets a draggable physical remote (digits, rockers, MUTE, GUIDE,
  POWER) parked bottom-right. Touch devices use the set's own buttons + swipe instead.
- **TV GUIDE (G)**: 90s cable-guide overlay — deep-purple panel, gold mono grid: each channel's
  NOW (with wall-clock start time) and NEXT. Computed live from the same schedule math.
  Footer: Impressum/Datenschutz links + station ident.
- **Lower third** (MTV grammar): on video start and ~12s before end — artist in Captions gold,
  "song title" in cream, year · label in mono, purple accent bar. Slides in, holds ~6s.
- `document.title` mirrors the broadcast: `CH 03 · GROUP HOME — SUPA STAR`.

## 7. Sound design (all synthesized, zero files)

- WebAudio white-noise buffer: channel-change burst (gain envelope), dead-channel hiss (low),
  power-on pop. Filtered 60ms click for button presses. Everything obeys volume + mute.

## 8. Rules (house law)

- No-build static: `index.html` + `styles.css` + `app.js` + `channels.js`. No dependencies,
  no external requests, no analytics, no cookies (localStorage only for volume/mute/last
  channel). GDPR-clean. GitHub Pages deployable as-is.
- `prefers-reduced-motion`: no boot animation, static bursts become clean cuts with a single
  still noise frame, no flicker/roll-bar. Everything still works.
- Hover-dependent FX gated `pointer:fine`. All controls keyboard-reachable, focus-visible,
  aria-labeled; OSD announcements via `aria-live=polite`.
- Perf budget: one `<video>` element ever; noise canvas runs only when visible; ambilight
  samples at 2.5fps; overlays are static gradients (GPU-composited).
- Media: videos referenced in place from `/music/` — nothing duplicated, URL-encoded paths.

## 9. Definition of done

- Serving the repo root locally (range-request-capable server): power on → live channel with
  sound; surf 03/07/12 with static bursts; type 41 → easter egg; type 23 → dead static;
  guide shows correct now/next times; volume/mute persist; reduced-motion path clean;
  mobile swipe works; title updates. Playful count ≥ 6 (boot, ambilight, dead channels,
  pirate lower-thirds, 41 egg, test card clock, remote drag).
