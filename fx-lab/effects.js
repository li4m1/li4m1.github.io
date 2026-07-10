'use strict';

/* ---------- helpers ---------- */
const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const clamp = (v,a,b) => v<a?a:v>b?b:v;

function mulberry32(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function makeCanvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }

/* Build a 256-entry RGB lookup table from gradient stops */
function buildLUT(stops, contrast, invert){
  const cols = stops.map(([p,h]) => [p, ...hex(h)]);
  const lut = new Uint8ClampedArray(256*3);
  for(let i=0;i<256;i++){
    let t = i/255;
    t = clamp((t-0.5)*contrast+0.5, 0, 1);
    if(invert) t = 1-t;
    let a = cols[0], b = cols[cols.length-1];
    for(let s=0;s<cols.length-1;s++){
      if(t >= cols[s][0] && t <= cols[s+1][0]){ a=cols[s]; b=cols[s+1]; break; }
    }
    const f = (t - a[0]) / ((b[0]-a[0]) || 1);
    lut[i*3  ] = a[1] + (b[1]-a[1])*f;
    lut[i*3+1] = a[2] + (b[2]-a[2])*f;
    lut[i*3+2] = a[3] + (b[3]-a[3])*f;
  }
  return lut;
}

/* Bright-trail smear: ghost the image sideways with lighten blending.
   Positive = trail to the right, negative = to the left. */
function smear(canvas, amountPx){
  if(amountPx === 0) return;
  const ctx = canvas.getContext('2d');
  const snap = makeCanvas(canvas.width, canvas.height);
  snap.getContext('2d').drawImage(canvas,0,0);
  ctx.globalCompositeOperation = 'lighten';
  const steps = 10;
  for(let i=1;i<=steps;i++){
    ctx.globalAlpha = 0.65 * (1 - i/steps);
    ctx.drawImage(snap, amountPx * i/steps, 0);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/* ---------- palettes ---------- */
const PALETTES_THERMAL = {
  SKULL:  [[0,'#0a0a2e'],[0.18,'#1c1cd8'],[0.42,'#2b6a5a'],[0.58,'#6e7a52'],[0.72,'#f03a8c'],[0.87,'#ffd21f'],[1,'#fff6c8']],
  IRON:   [[0,'#000004'],[0.25,'#3b0f70'],[0.5,'#ba3655'],[0.75,'#f98c0a'],[1,'#fcffa4']],
  NIGHT:  [[0,'#020604'],[0.35,'#0c3d1e'],[0.65,'#2e8b3a'],[0.85,'#a8e063'],[1,'#f4ffd0']],
  XRAY:   [[0,'#e8f4ff'],[0.4,'#7aa8d8'],[0.7,'#1c3a8a'],[1,'#040418']],
  ACID:   [[0,'#12006e'],[0.3,'#7b2fbf'],[0.55,'#ff2079'],[0.8,'#ff9e00'],[1,'#faff00']],
};
const PALETTES_DUO = {
  CRTZ:   ['#0a0a2a','#ffd21f'],
  BLOOD:  ['#0d0208','#ff2a2a'],
  OCEAN:  ['#020a1c','#4fd8ff'],
  PAPER:  ['#1a1408','#f2e8d0'],
  VIOLET: ['#0e0218','#c86bff'],
};

/* ---------- effect definitions ----------
   Each effect: label, optional palettes, params (become sliders),
   and render(work, p, scale, palette). `scale` compensates pixel-sized
   params so full-res exports match the preview. */
const EFFECTS = {
  thermal: {
    label: 'Thermal',
    palettes: PALETTES_THERMAL,
    palette: 'SKULL',
    params: [
      {key:'contrast', name:'Contrast', min:0.4, max:2.6, step:0.05, value:1.25},
      {key:'smear',    name:'Smear ←→', min:-60, max:60,  step:1,    value:0},
      {key:'grain',    name:'Grain',    min:0,   max:90,  step:1,    value:28},
    ],
    render(work, p, scale, stops){
      smear(work, p.smear * scale);
      const ctx = work.getContext('2d');
      const img = ctx.getImageData(0,0,work.width,work.height);
      const d = img.data;
      const lut = buildLUT(stops, p.contrast, false);
      const g = p.grain;
      for(let i=0;i<d.length;i+=4){
        const l = (d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114) | 0;
        const n = g ? (Math.random()-0.5)*g : 0;
        d[i]   = lut[l*3  ] + n;
        d[i+1] = lut[l*3+1] + n;
        d[i+2] = lut[l*3+2] + n;
      }
      ctx.putImageData(img,0,0);
    }
  },

  duotone: {
    label: 'Duotone',
    palettes: PALETTES_DUO,
    palette: 'CRTZ',
    params: [
      {key:'contrast', name:'Contrast', min:0.4, max:2.6, step:0.05, value:1.3},
      {key:'grain',    name:'Grain',    min:0,   max:90,  step:1,    value:20},
    ],
    render(work, p, scale, pair){
      const ctx = work.getContext('2d');
      const img = ctx.getImageData(0,0,work.width,work.height);
      const d = img.data;
      const A = hex(pair[0]), B = hex(pair[1]);
      const g = p.grain;
      for(let i=0;i<d.length;i+=4){
        let t = (d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114)/255;
        t = clamp((t-0.5)*p.contrast+0.5, 0, 1);
        const n = g ? (Math.random()-0.5)*g : 0;
        d[i]   = A[0] + (B[0]-A[0])*t + n;
        d[i+1] = A[1] + (B[1]-A[1])*t + n;
        d[i+2] = A[2] + (B[2]-A[2])*t + n;
      }
      ctx.putImageData(img,0,0);
    }
  },

  glitch: {
    label: 'Glitch',
    params: [
      {key:'shift', name:'RGB shift', min:0, max:40, step:1, value:10},
      {key:'bands', name:'Bands',     min:0, max:20, step:1, value:6},
      {key:'scan',  name:'Scanlines', min:0, max:100, step:1, value:40},
    ],
    render(work, p, scale){
      const ctx = work.getContext('2d');
      const w = work.width, h = work.height;
      // horizontal band displacement (seeded, stable across renders)
      if(p.bands > 0){
        const rnd = mulberry32(1337);
        const snap = makeCanvas(w,h);
        snap.getContext('2d').drawImage(work,0,0);
        for(let b=0;b<p.bands;b++){
          const y = (rnd()*h) | 0;
          const bh = (8 + rnd()*40) * scale;
          const dx = (rnd()-0.5) * 90 * scale;
          ctx.drawImage(snap, 0,y,w,bh, dx,y,w,bh);
        }
      }
      const img = ctx.getImageData(0,0,w,h);
      const d = img.data, src = new Uint8ClampedArray(d);
      const s = Math.round(p.shift * scale);
      const scan = p.scan/100;
      const period = Math.max(2, Math.round(3*scale));
      for(let y=0;y<h;y++){
        const dark = scan && (y % period === 0) ? 1-scan*0.55 : 1;
        for(let x=0;x<w;x++){
          const i = (y*w+x)*4;
          const xr = clamp(x-s,0,w-1), xb = clamp(x+s,0,w-1);
          d[i]   = src[(y*w+xr)*4]   * dark;
          d[i+1] = src[i+1]          * dark;
          d[i+2] = src[(y*w+xb)*4+2] * dark;
        }
      }
      ctx.putImageData(img,0,0);
    }
  },

  poster: {
    label: 'Poster',
    params: [
      {key:'levels',   name:'Levels',   min:2,   max:10,  step:1,    value:4},
      {key:'contrast', name:'Contrast', min:0.4, max:2.6, step:0.05, value:1.4},
      {key:'grain',    name:'Grain',    min:0,   max:90,  step:1,    value:15},
    ],
    render(work, p, scale){
      const ctx = work.getContext('2d');
      const img = ctx.getImageData(0,0,work.width,work.height);
      const d = img.data;
      const n = p.levels - 1, g = p.grain;
      for(let i=0;i<d.length;i+=4){
        const noise = g ? (Math.random()-0.5)*g : 0;
        for(let c=0;c<3;c++){
          let v = d[i+c]/255;
          v = clamp((v-0.5)*p.contrast+0.5, 0, 1);
          d[i+c] = Math.round(v*n)/n*255 + noise;
        }
      }
      ctx.putImageData(img,0,0);
    }
  },
};
