# Showreel section — parked 2026-09-18

The CRT-TV showreel that used to sit between the landing and Videos.
Pulled out of `index.html` on request; nothing here is loaded by the live site.

## To put it back

1. `styles.css` → paste back into the `<style>` block in `index.html`,
   just above the `/* ===== 03 WORK GRID ... */` comment.
2. `section.html` → paste back into the body, directly after the
   `</section>` that closes `#home` and before the Videos section.
3. `script.js` → paste back into the second `<script>` block, directly above
   the `/* WORK GRID handler removed: ... */` comment. It must sit inside the
   same IIFE, because it uses the `$` and `RM` helpers defined there.
4. Add the dock link back into `<nav class="dock">`, after the Home entry:
   `<a href="#reel" data-sec="reel"><span>02</span><span class="tip">Showreel</span></a>`
5. Renumber: the dock `<span>NN</span>` values and each section's
   `<span class="num">NN</span>` eyebrow run in sequence.

## Assets it needs (still in the repo, untouched)

- `clips/showreel.mp4`
- `clips/posters/showreel.jpg`

## Note

`.reel-meta` and `.orbit-badge` in `styles.css` were already dead before this
was parked — no markup referenced them. `.tv-img` and `.tv-crown` likewise.
Worth deleting if this ever comes back.

It is also recoverable from git history: the last commit containing it is the
one before this change.
