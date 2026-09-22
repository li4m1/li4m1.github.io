# JANSSON v3 — Landing + Multi-Category IA Brief

## The problem

Adding Social, Video Editing and Photography to the existing site would take it to
**eleven stacked full-height sections** (Hero, Showreel, Short Form, AI, Static,
Social, Video Edit, Photography, Lab, Rugs, Königskarten, Contact) — a twelve-screen
scroll before Contact, each section repeating the same eyebrow + title + filter-row
pattern. More categories, less showcase.

## Research findings

Ten live reference sites were checked (see REFERENCES). The consistent finding:

**1. Elite creative sites do not give each category its own section.**
BUCK (Work/About/Games/Goods), Locomotive (Work/Agency/Store), Studio Freight
(Work/Info/News/Aeon), BASIC/DEPT (Work/About/Thinking) all run *one* work index.
Discipline is metadata on the card, never page structure.

**2. Category belongs on the card, as a filter.**
Sam Kolder — the closest analogue, a filmmaker with mixed client and personal work —
shows one grid of cards labelled by client/category ("Insta360", "Personal", "DJI"),
with animated thumbnail previews, immediately below the hero. No per-category pages.

**3. Side projects get their own bucket, separate from client work.**
BUCK splits "Games" and "Goods" out of "Work"; Locomotive splits "Store". This
validates keeping Rugs and Königskarten as their own destinations rather than
folding them into the portfolio.

**4. Motion work must move in the grid.**
Hover-to-play (or always-on muted loops) is the standard. A poster with a play
triangle reads as a placeholder in 2026.

**5. Visual-first landings show work before words.**
Cosmos, Savee and Are.na all open on a field of images with a typographic spine and
effectively zero prose.

## Architecture

**Zone 1 — Landing.** JANSSON wordmark, crown as the O, centred. A scattered field
of ten real work tiles around it, clear of a centre exclusion zone, with mouse
parallax and a few always-playing muted loops. Click any tile to open it. No
paragraph, no scroll needed to see the vibe.

**Zone 2 — Showreel.** The CRT TV stays. It is the signature moment.

**Zone 3 — Work (motion).** One unified index replacing the old Short Form + AI
sections. A **category rail** sits on top: one card per category, each playing a
representative clip under its name, so every discipline is instantly visible and
one click filters the grid beneath. Categories: Social, Video Edit, Short Form,
Music, Street, AI.

**Zone 4 — Photography & Stills.** Same rail + grid pattern for still work:
Photography, Social Stills, AI Stills.

**Zone 5–7 — Lab, Rugs, Königskarten.** Unchanged; the things that aren't client work.

**Zone 8 — Contact.**

Eight dock stops instead of eleven, and the three requested categories become
first-class, visually-previewed filters rather than three more empty scroll-screens.

## Taxonomy

Categories live in one editable `TAGS` map at the top of the page script, so
re-tagging a clip is a one-word edit. Seeded honestly from the real data:

| Category    | Rule used to seed it                          |
|-------------|-----------------------------------------------|
| Social      | brand clips shot vertical (9:16) — social cuts |
| Video Edit  | brand clips landscape/square, longer runtimes  |
| Music       | existing `music` tag                           |
| Street      | existing `street` tag                          |
| AI          | everything in ai.js                            |
| Photography | reserved — no assets exist yet                 |

## Content reality

24 real clips with posters, 14 lightweight preview loops, 3 AI clips, 11 AI stills.
**No photography assets exist on disk** — that category ships with the same reserved
treatment as the rugs until there is a shoot.

## References checked (all returned HTTP 200)

IA: buck.co · locomotive.ca · studiofreight.com · basicagency.com · samkolder.com ·
hoverstat.es · dennissnellenberg.com · aristidebenoist.com · obys.agency · pierre.co

Landing: cosmos.so · savee.it · are.na · bruno-simon.com · activetheory.net ·
obys.agency · resn.co.nz · hellomonday.com · antinomy.studio · makereign.com
