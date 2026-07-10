# FX LAB

Browser image effects — upload a photo, dial in an effect, download full-res. Everything runs client-side on `<canvas>`; nothing ever uploads.

**Live:** https://janssonliam.de/fx-lab/

## Effects

- **Thermal** — false-color gradient map (SKULL / IRON / NIGHT / XRAY / ACID palettes) with smear + grain
- **Duotone** — two-color luminance map
- **Glitch** — RGB shift, band displacement, scanlines
- **Poster** — posterize + contrast + grain

## Adding an effect

Effects are data-driven in [effects.js](effects.js). Add one entry to `EFFECTS`:

```js
myeffect: {
  label: 'My Effect',
  palettes: {...},          // optional — shows swatch picker
  params: [                 // each becomes a slider
    {key:'amount', name:'Amount', min:0, max:100, step:1, value:50},
  ],
  render(work, p, scale, palette){
    // work: canvas with the source drawn in — mutate its pixels
    // p: current slider values, e.g. p.amount
    // scale: multiply pixel-sized params by this so full-res export matches preview
  }
}
```

The UI (chip, sliders, swatches, export) builds itself.

## Dev

No build step. Open `index.html` or `python3 -m http.server` in the repo. Deploy = push to `main` (GitHub Pages).
