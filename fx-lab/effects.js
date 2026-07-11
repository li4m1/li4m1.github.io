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

  halftone: {
    label: 'Halftone',
    palettes: {                      /* [paper, ink] — bright ink flips the dots */
      NEWS:  ['#f2ecdc','#141414'],
      PUNK:  ['#f2ecdc','#e0342b'],
      NIGHT: ['#0a0a14','#f2f2e6'],
      BLUE:  ['#eef2f8','#123a8c'],
      GOLD:  ['#101018','#ffd21f'],
    },
    palette: 'NEWS',
    params: [
      {key:'dot',      name:'Dot size', min:4,   max:18,  step:1,    value:8},
      {key:'angle',    name:'Angle',    min:0,   max:90,  step:1,    value:25},
      {key:'contrast', name:'Contrast', min:0.4, max:2.6, step:0.05, value:1.2},
    ],
    render(work, p, scale, pal){
      const w = work.width, h = work.height, ctx = work.getContext('2d');
      const cell = Math.max(3, p.dot*scale);
      const gw = Math.max(1, Math.ceil(w/cell)), gh = Math.max(1, Math.ceil(h/cell));
      const s = makeCanvas(gw,gh);
      s.getContext('2d').drawImage(work,0,0,gw,gh);
      const sd = s.getContext('2d').getImageData(0,0,gw,gh).data;
      const pk = hex(pal[0]), ik = hex(pal[1]);
      const inkBright = (ik[0]*0.299+ik[1]*0.587+ik[2]*0.114) > (pk[0]*0.299+pk[1]*0.587+pk[2]*0.114);
      ctx.fillStyle = pal[0]; ctx.fillRect(0,0,w,h);
      ctx.fillStyle = pal[1];
      const a = p.angle*Math.PI/180, cos = Math.cos(a), sin = Math.sin(a);
      const diag = Math.hypot(w,h);
      for(let v=-diag; v<diag; v+=cell){
        for(let u=-diag; u<diag; u+=cell){
          const x = u*cos - v*sin + w/2, y = u*sin + v*cos + h/2;
          if(x < -cell || y < -cell || x > w+cell || y > h+cell) continue;
          const gx = clamp((x/cell)|0, 0, gw-1), gy = clamp((y/cell)|0, 0, gh-1);
          const i = (gy*gw+gx)*4;
          let l = (sd[i]*0.299 + sd[i+1]*0.587 + sd[i+2]*0.114)/255;
          l = clamp((l-0.5)*p.contrast+0.5, 0, 1);
          const r = (inkBright ? l : 1-l) * cell * 0.66;
          if(r > 0.4){ ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); }
        }
      }
    }
  },

  riso: {
    label: 'Riso',
    palettes: {                      /* [paper, shadow plate, midtone plate] */
      CLASSIC: ['#f4efe3','#1440c8','#ff4b33'],
      ZINE:    ['#f2ecdc','#141414','#ff48b0'],
      MINT:    ['#f4efe3','#0a7d5c','#ff8a00'],
      GRAPE:   ['#f0eadc','#5a1adb','#f0b429'],
    },
    palette: 'CLASSIC',
    params: [
      {key:'misprint', name:'Misprint', min:0,   max:20,  step:1,    value:6},
      {key:'grain',    name:'Grain',    min:0,   max:90,  step:1,    value:40},
      {key:'contrast', name:'Contrast', min:0.4, max:2.6, step:0.05, value:1.2},
    ],
    render(work, p, scale, pal){
      const w = work.width, h = work.height, ctx = work.getContext('2d');
      const img = ctx.getImageData(0,0,w,h), d = img.data;
      const src = new Uint8ClampedArray(d);
      const off = Math.round(p.misprint*scale);
      const paper = hex(pal[0]), A = hex(pal[1]), B = hex(pal[2]);
      const g = p.grain/255;
      const lumAt = i => (src[i]*0.299 + src[i+1]*0.587 + src[i+2]*0.114)/255;
      for(let y=0;y<h;y++) for(let x=0;x<w;x++){
        const i = (y*w+x)*4;
        let l1 = lumAt(i);
        l1 = clamp((l1-0.5)*p.contrast+0.5, 0, 1);
        const j = (clamp(y-off,0,h-1)*w + clamp(x-Math.round(off*0.6),0,w-1))*4;
        let l2 = lumAt(j);
        l2 = clamp((l2-0.5)*p.contrast+0.5, 0, 1);
        let a1 = clamp((1-l1)*1.6 - 0.15, 0, 1);            // shadows plate
        let a2 = clamp(1 - Math.abs(l2-0.55)*2.6, 0, 1)*0.85; // midtone plate
        if(g){ a1 = clamp(a1+(Math.random()-0.5)*g, 0, 1); a2 = clamp(a2+(Math.random()-0.5)*g, 0, 1); }
        let r = paper[0], gg = paper[1], b = paper[2];
        r *= (1-a1) + a1*A[0]/255; gg *= (1-a1) + a1*A[1]/255; b *= (1-a1) + a1*A[2]/255;
        r *= (1-a2) + a2*B[0]/255; gg *= (1-a2) + a2*B[1]/255; b *= (1-a2) + a2*B[2]/255;
        d[i] = r; d[i+1] = gg; d[i+2] = b;
      }
      ctx.putImageData(img,0,0);
    }
  },

  dither: {
    label: 'Dither',
    palettes: {                      /* dark → light; Floyd–Steinberg walks the ramp */
      MAC:     ['#0a0a0a','#f2f2ea'],
      GAMEBOY: ['#0f380f','#306230','#8bac0f','#9bbc0f'],
      AMBER:   ['#0d0800','#ffb000'],
      CGA:     ['#000000','#55ffff','#ff55ff','#ffffff'],
    },
    palette: 'MAC',
    params: [
      {key:'pixel',    name:'Pixel size', min:2,   max:10,  step:1,    value:4},
      {key:'contrast', name:'Contrast',   min:0.4, max:2.6, step:0.05, value:1.15},
    ],
    render(work, p, scale, pal){
      const w = work.width, h = work.height, ctx = work.getContext('2d');
      const f = Math.max(1, Math.round(p.pixel*scale));
      const dw = Math.max(1,(w/f)|0), dh = Math.max(1,(h/f)|0);
      const s = makeCanvas(dw,dh), sctx = s.getContext('2d');
      sctx.drawImage(work,0,0,dw,dh);
      const img = sctx.getImageData(0,0,dw,dh), d = img.data;
      const cols = pal.map(hex);
      const pl = cols.map(c => c[0]*0.299 + c[1]*0.587 + c[2]*0.114);
      const lums = new Float32Array(dw*dh);
      for(let i=0;i<dw*dh;i++){
        let l = d[i*4]*0.299 + d[i*4+1]*0.587 + d[i*4+2]*0.114;
        lums[i] = clamp((l/255-0.5)*p.contrast+0.5, 0, 1)*255;
      }
      for(let y=0;y<dh;y++) for(let x=0;x<dw;x++){
        const i = y*dw+x, old = lums[i];
        let bi = 0, bd = 1e9;
        for(let k=0;k<pl.length;k++){ const dd = Math.abs(pl[k]-old); if(dd<bd){ bd=dd; bi=k; } }
        const err = old - pl[bi];
        if(x+1<dw) lums[i+1] += err*7/16;
        if(y+1<dh){
          if(x>0) lums[i+dw-1] += err*3/16;
          lums[i+dw] += err*5/16;
          if(x+1<dw) lums[i+dw+1] += err*1/16;
        }
        const c = cols[bi];
        d[i*4] = c[0]; d[i*4+1] = c[1]; d[i*4+2] = c[2];
      }
      sctx.putImageData(img,0,0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0,0,w,h);
      ctx.drawImage(s,0,0,w,h);
      ctx.imageSmoothingEnabled = true;
    }
  },

  pixelsort: {
    label: 'Pixel sort',
    params: [
      {key:'threshold', name:'Threshold', min:0,  max:100, step:1, value:55},
      {key:'span',      name:'Max span',  min:20, max:400, step:5, value:180},
    ],
    render(work, p, scale){
      const w = work.width, h = work.height, ctx = work.getContext('2d');
      const img = ctx.getImageData(0,0,w,h), d = img.data;
      const th = p.threshold/100*255;
      const maxSpan = Math.max(4, Math.round(p.span*scale));
      const lumAt = i => d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114;
      for(let y=0;y<h;y++){
        const row = y*w;
        let x = 0;
        while(x < w){
          while(x < w && lumAt((row+x)*4) < th) x++;
          const start = x;
          while(x < w && x-start < maxSpan && lumAt((row+x)*4) >= th) x++;
          const len = x-start;
          if(len > 3){
            const px = [];
            for(let k=start;k<x;k++){ const i=(row+k)*4; px.push([lumAt(i), d[i], d[i+1], d[i+2]]); }
            px.sort((a,b) => a[0]-b[0]);
            for(let k=0;k<len;k++){ const i=(row+start+k)*4; d[i]=px[k][1]; d[i+1]=px[k][2]; d[i+2]=px[k][3]; }
          }
        }
      }
      ctx.putImageData(img,0,0);
    }
  },

  vhs: {
    label: 'VHS',
    params: [
      {key:'tracking', name:'Tracking',    min:0, max:30, step:1, value:8},
      {key:'bleed',    name:'Color bleed', min:0, max:20, step:1, value:8},
      {key:'noise',    name:'Noise',       min:0, max:80, step:1, value:30},
    ],
    render(work, p, scale){
      const w = work.width, h = work.height, ctx = work.getContext('2d');
      const img = ctx.getImageData(0,0,w,h), d = img.data;
      const src = new Uint8ClampedArray(d);
      const rnd = mulberry32(97);
      const track = p.tracking*scale, bleed = Math.round(p.bleed*scale), g = p.noise;
      const tearY = (rnd()*h)|0, tearH = (20 + rnd()*40)*scale;
      const period = Math.max(2, Math.round(3*scale));
      for(let y=0;y<h;y++){
        let dx = Math.sin(y*0.02 + 7)*track*0.3;
        if(y > tearY && y < tearY+tearH) dx += (rnd()-0.2)*track*3;
        dx |= 0;
        const dark = (y % period === 0) ? 0.82 : 1;
        for(let x=0;x<w;x++){
          const i = (y*w+x)*4;
          const xs = clamp(x-dx, 0, w-1);
          const si = (y*w+xs)*4;
          const ri = (y*w+clamp(xs-bleed,0,w-1))*4;
          const bi = (y*w+clamp(xs+bleed,0,w-1))*4;
          const n = g ? (rnd()-0.5)*g : 0;
          d[i]   = (src[ri]*0.9   + src[si+1]*0.1)*dark + n + 6;
          d[i+1] =  src[si+1]*dark + n + 6;
          d[i+2] = (src[bi+2]*0.9 + src[si+1]*0.1)*dark + n + 6;
        }
      }
      ctx.putImageData(img,0,0);
      const fs = Math.round(16*scale);
      ctx.font = `${fs}px ui-monospace, Menlo, monospace`;
      ctx.fillStyle = 'rgba(240,240,240,0.9)';
      ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 4*scale;
      ctx.fillText('▶ PLAY', 20*scale, 30*scale);
      const t = 'SP 0:07:41';
      ctx.fillText(t, w - ctx.measureText(t).width - 20*scale, 30*scale);
      ctx.shadowBlur = 0;
    }
  },

  dream: {
    label: 'Dream',
    params: [
      {key:'glow', name:'Glow', min:2, max:40,  step:1, value:14},
      {key:'haze', name:'Haze', min:0, max:100, step:1, value:55},
      {key:'fade', name:'Fade', min:0, max:60,  step:1, value:20},
    ],
    render(work, p, scale){
      const ctx = work.getContext('2d');
      const copy = makeCanvas(work.width, work.height);
      copy.getContext('2d').drawImage(work,0,0);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = p.haze/100;
      ctx.filter = `blur(${p.glow*scale}px) saturate(1.3) brightness(1.1)`;
      ctx.drawImage(copy,0,0);
      ctx.filter = 'none'; ctx.globalAlpha = 1;
      if(p.fade){
        ctx.globalCompositeOperation = 'lighten';
        ctx.globalAlpha = p.fade/100;
        ctx.fillStyle = '#1e1830';
        ctx.fillRect(0,0,work.width,work.height);
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  },

  ascii: {
    label: 'ASCII',
    palettes: {                      /* [background, glyph ink] */
      MATRIX:   ['#020a02','#39ff5a'],
      TERMINAL: ['#0a0a0f','#e8e8f0'],
      PAPER:    ['#f2ecdc','#141414'],
      AMBER:    ['#0d0800','#ffb000'],
    },
    palette: 'MATRIX',
    params: [
      {key:'size',     name:'Cell size', min:6,   max:20,  step:1,    value:10},
      {key:'contrast', name:'Contrast',  min:0.4, max:2.6, step:0.05, value:1.2},
    ],
    render(work, p, scale, pal){
      const w = work.width, h = work.height, ctx = work.getContext('2d');
      const cell = Math.max(4, Math.round(p.size*scale));
      const gw = Math.max(1,(w/cell)|0), gh = Math.max(1,(h/cell)|0);
      const s = makeCanvas(gw,gh);
      s.getContext('2d').drawImage(work,0,0,gw,gh);
      const sd = s.getContext('2d').getImageData(0,0,gw,gh).data;
      const bg = hex(pal[0]), ink = hex(pal[1]);
      const inkBright = (ink[0]*0.299+ink[1]*0.587+ink[2]*0.114) > (bg[0]*0.299+bg[1]*0.587+bg[2]*0.114);
      const RAMP = ' .:-=+*#%@';
      ctx.fillStyle = pal[0]; ctx.fillRect(0,0,w,h);
      ctx.fillStyle = pal[1];
      ctx.font = `${cell}px ui-monospace, Menlo, monospace`;
      ctx.textBaseline = 'top';
      for(let gy=0;gy<gh;gy++) for(let gx=0;gx<gw;gx++){
        const i = (gy*gw+gx)*4;
        let l = (sd[i]*0.299 + sd[i+1]*0.587 + sd[i+2]*0.114)/255;
        l = clamp((l-0.5)*p.contrast+0.5, 0, 1);
        const t = inkBright ? l : 1-l;
        const ch = RAMP[(t*(RAMP.length-1))|0];
        if(ch !== ' ') ctx.fillText(ch, gx*cell, gy*cell);
      }
    }
  },

  solar: {
    label: 'Solar',
    params: [
      {key:'threshold', name:'Threshold', min:10,  max:90,  step:1,    value:50},
      {key:'boost',     name:'Boost',     min:0.6, max:2.4, step:0.05, value:1.3},
      {key:'hue',       name:'Hue spin',  min:0,   max:100, step:1,    value:20},
    ],
    render(work, p, scale){
      const ctx = work.getContext('2d');
      const img = ctx.getImageData(0,0,work.width,work.height), d = img.data;
      const th = p.threshold/100*255, rot = p.hue/100;
      for(let i=0;i<d.length;i+=4){
        let r = d[i], g = d[i+1], b = d[i+2];
        if(r > th) r = 255-r;
        if(g > th) g = 255-g;
        if(b > th) b = 255-b;
        r = clamp((r-128)*p.boost+128, 0, 255);
        g = clamp((g-128)*p.boost+128, 0, 255);
        b = clamp((b-128)*p.boost+128, 0, 255);
        d[i]   = r*(1-rot) + g*rot;
        d[i+1] = g*(1-rot) + b*rot;
        d[i+2] = b*(1-rot) + r*rot;
      }
      ctx.putImageData(img,0,0);
    }
  },
};
