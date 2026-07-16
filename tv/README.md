# JANSSON TV — janssonliam.de/tv

A television station, not a video page. One CRT set, broadcasting the personal
music-video archive on a real schedule. Playback position is derived from the wall
clock against a fixed station epoch — the channel is playing whether you watch or not.
No pause, no scrubber. You tune, you surf.

- **CH 03 — BOOM BAP**: the NYC archive (~30 min loop)
- **CH 07 — PIRATE FEED**: the UK tape rips (~9 min loop)
- **CH 12 — OFF AIR**: test card + live Berlin clock
- **CH 41**: type it and see
- Everything else on the dial: static. Real TVs let you get lost.

## Controls

| Input | Action |
|---|---|
| **P** / power button | power on/off (power-on unlocks sound) |
| **↑ / ↓** or swipe | surf programmed channels |
| **0–9** | type a channel number directly |
| **← / →** | volume · **M** mute |
| **G** | TV guide (live now/next from the schedule) |

## Programming the station

Everything lives in `channels.js`. To add a video:

1. Drop the `.mp4` (H.264) into `/music/`.
2. Get its exact duration:
   `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "file.mp4"`
3. Add `{ file, artist, title, meta, dur }` to a playlist. `dur` must be exact or the
   live schedule drifts. New channels: add an object with a free `num` on the dial.

## Local dev

Serve the **repo root** (paths are root-absolute, like fx-lab) with a server that
supports HTTP Range requests — seeking into the broadcast needs them.
`python3 -m http.server` does **not** do ranges; use e.g. `npx http-server -p 8080`
from `my-website/`, then open `http://localhost:8080/tv/`.

## House rules

No build step, no dependencies, no external requests, no cookies (localStorage only
for volume/mute/last channel). All sound is WebAudio-synthesized. Full
`prefers-reduced-motion` path. Videos are referenced in place from `/music/` —
nothing is duplicated.
