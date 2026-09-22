# Parked copy

## Photography section headline — removed 2026-09-19

Sat directly under the `04 Photography & Stills` eyebrow, as the counterpart to
the Videos section's "Everything that moves." (removed earlier).

```html
<h2 class="work-display-title reveal">Everything that <em>doesn’t</em>.</h2>
```

To restore: paste back into `<section id="stills">`, directly after the
`<div class="eyebrow">…</div>` line.

## Photography & Stills section — removed 2026-09-22

Sat between AI and Websites. Its data (`POSTS` in `portfolio/posts.js`,
`STILL_CATS`, `STILLS`) is untouched, and the shared lightbox still renders
AI photo sets, so restoring this is markup plus the one `buildSection` call.

```html
  <!-- ── 04 Photography & stills ── -->
  <section id="stills" class="bg-ink">
    <div class="inner">
      <div class="eyebrow"><span class="num">04</span><span>Photography &amp; Stills</span><span class="rule"></span></div>
      <div class="rail reveal" id="stillRail" role="group" aria-label="Filter stills"></div>
      <div class="idx-head">
        <span class="idx-count mono" id="stillCount"></span>
        <span class="idx-count mono">Click to open the set</span>
      </div>
      <div class="idx-grid stills" id="stillGrid"></div>
    </div>
  </section>
```

Also removed: its dock entry, and

```js
    buildSection({
      railEl: "#stillRail", gridEl: "#stillGrid", countEl: "#stillCount",
      cats: STILL_CATS, items: STILLS, stills: true,
    });
```
