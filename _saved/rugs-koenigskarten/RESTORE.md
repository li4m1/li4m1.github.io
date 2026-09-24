# Rug + Königskarten — parked 2026-09-24

Removed from `index.html` on request ("remove the rugs and königskarten pages
for now"). Markup only — **all CSS was left in place** in the inline `<style>`
block (`.rug-*`, `.kk-*`, `.rip*`, `.btn-ink`, `.btn-red`, `#koenigskarten`),
so restoring is markup + nav only. Images are untouched in `carddeck/`.

## To restore

1. Paste `sections.html` back into `index.html` between the `#lab`
   `</section>` and the `<div class="marquee">` that precedes `#contact`.
2. Put the two dock links back, before the Contact link:
   ```html
   <a href="#rugs"    data-sec="rugs"><span>07</span><span class="tip">Rug</span></a>
   <a href="#koenigskarten" data-sec="koenigskarten"><span>08</span><span class="tip">Königskarten</span></a>
   ```
3. Renumber: dock Contact back to `09`, and the `#contact` eyebrow
   `<span class="num">` back to `09`. (While parked they are `07`.)

## Note on the section numbers

The eyebrow numbers are hand-maintained, not generated — they have silently
collided before. After any restore, check that the dock numbers and the
in-section `.eyebrow .num` values still agree.
