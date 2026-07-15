'use strict';

/* ═══ INSPO · creative second brain ═══
   One planet of references. Categories are regions on a sphere; dragging
   orbits the ball, scrolling zooms toward the surface. Everything below
   is PLACEHOLDER data: swap ITEMS entries for real references later. */

const rnd = (seed => () => {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
})(41);

const R = 1500;   // planet radius
const CATS = [
  { id:'film',   label:'FILM',   lat:8,   lon:0,    subs:['music videos','short films','scenes'] },
  { id:'photo',  label:'PHOTO',  lat:-14, lon:62,   subs:['street','flash','editorial'] },
  { id:'music',  label:'MUSIC',  lat:16,  lon:-64,  subs:['tracks','albums'] },
  { id:'books',  label:'BOOKS',  lat:-10, lon:126,  subs:['design','stories'] },
  { id:'design', label:'DESIGN', lat:14,  lon:-128, subs:['posters','type','sites'] },
  { id:'words',  label:'WORDS',  lat:-4,  lon:180,  subs:['quotes','ideas'] },
];
const TYPE = { film:'video', photo:'image', music:'music', books:'book', design:'image', words:'quote' };
const HUES = {
  film:  [['#2B0A72','#e0342b'],['#140933','#6C1ADB'],['#02010A','#F0B429']],
  photo: [['#F0B429','#2B0A72'],['#e0342b','#140933'],['#B7A9E6','#02010A']],
  music: [['#6C1ADB','#02010A'],['#2B0A72','#F0B429'],['#140933','#B7A9E6']],
  books: [['#F4F1EA','#2B0A72'],['#F0B429','#140933'],['#F4F1EA','#e0342b']],
  design:[['#B7A9E6','#140933'],['#F0B429','#6C1ADB'],['#2B0A72','#F4F1EA']],
  words: [['#F4F1EA','#F4F1EA']],
};
const QUOTES = [
  'Make it feel found, not made.',
  'Hard light tells the truth.',
  'Style is what you refuse.',
  'Shoot the in-between moments.',
  'The frame is the sentence.',
  'Taste is a muscle. Feed it.',
];

const ITEMS = [];
CATS.forEach(cat => {
  cat.subs.forEach((sub, si) => {
    for (let k = 0; k < 3; k++) {
      const n = ITEMS.length + 1;
      ITEMS.push({
        id: 'p' + n, cat: cat.id, sub,
        type: TYPE[cat.id],
        title: TYPE[cat.id] === 'quote'
          ? QUOTES[(si * 3 + k) % QUOTES.length]
          : `Untitled ${String(n).padStart(2, '0')}`,
        meta: 'placeholder · swap for a real reference',
        hue: HUES[cat.id][(si + k) % HUES[cat.id].length],
        lat: cat.lat + (rnd() - 0.5) * 34,
        lon: cat.lon + (rnd() - 0.5) * 44,
      });
    }
  });
});

const dir = (lat, lon) => {
  const la = lat * Math.PI/180, lo = lon * Math.PI/180;
  return { x: Math.cos(la)*Math.sin(lo), y: Math.sin(la), z: Math.cos(la)*Math.cos(lo) };
};
/* camera-space depth (1 = dead centre facing the viewer) under scene rotation */
function facing(v, rxDeg, ryDeg){
  const ry = ryDeg * Math.PI/180, rx = rxDeg * Math.PI/180;
  const z1 = -v.x*Math.sin(ry) + v.z*Math.cos(ry);
  return v.y*Math.sin(rx) + z1*Math.cos(rx);
}

const SIZE = { video:[280,158], image:[200,250], book:[150,220], quote:[230,150], music:[260,44] };

/* ---------- placeholder art ---------- */
function art(item, scale = 1){
  if (item.type === 'quote' || item.type === 'music') return null;
  const [w, h] = SIZE[item.type];
  const c = document.createElement('canvas');
  c.width = w * scale * 2; c.height = h * scale * 2;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, c.width * 0.35, c.height);
  g.addColorStop(0, item.hue[0]); g.addColorStop(1, item.hue[1]);
  x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = 'rgba(2,1,10,0.35)';
  if (item.type === 'video'){ x.fillRect(0, c.height * 0.72, c.width, c.height); }
  if (item.type === 'image'){ x.strokeStyle = 'rgba(244,241,234,0.5)'; x.lineWidth = 3; x.strokeRect(c.width*0.12, c.height*0.1, c.width*0.76, c.height*0.62); }
  if (item.type === 'book'){ x.fillStyle = 'rgba(244,241,234,0.9)'; x.fillRect(c.width*0.16, c.height*0.16, c.width*0.68, c.height*0.2); }
  x.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 220; i++) x.fillRect(Math.random()*c.width, Math.random()*c.height, 2, 2);
  return c;
}

/* ---------- build the planet ---------- */
const camera = document.getElementById('camera');
const space = document.getElementById('space');
const els = [];

CATS.forEach(cat => {
  const g = document.createElement('div');
  g.className = 'ghost';
  g.innerHTML = `${cat.label}<i>${cat.subs.join(' · ')}</i>`;
  g.style.transform = `rotateY(${cat.lon}deg) rotateX(${-cat.lat}deg) translateZ(${R + 30}px) translate3d(${-cat.label.length * 52}px, -95px, 0)`;
  camera.appendChild(g);
  els.push({ el: g, v: dir(cat.lat, cat.lon), ghost: true });
});

ITEMS.forEach(item => {
  const [w, h] = SIZE[item.type];
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.id = item.id;
  el.style.width = w + 'px'; el.style.height = h + 'px';
  el.style.transform = `rotateY(${item.lon}deg) rotateX(${-item.lat}deg) translateZ(${R}px) translate(-50%, -50%)`;
  if (item.type === 'video'){ el.classList.add('play'); el.appendChild(art(item)); }
  else if (item.type === 'image'){ el.appendChild(art(item)); }
  else if (item.type === 'book'){ el.classList.add('book'); el.appendChild(art(item)); el.insertAdjacentHTML('beforeend','<span class="spine"></span>'); }
  else if (item.type === 'quote'){
    el.classList.add('paper');
    el.innerHTML = `<div class="q">“${item.title}”</div>`;
  }
  else if (item.type === 'music'){
    el.classList.add('pill');
    el.innerHTML = `<i>▶</i><b>${item.title}</b><span>track</span>`;
  }
  if (item.type !== 'music' && item.type !== 'quote')
    el.insertAdjacentHTML('beforeend', `<div class="cap"><b>${item.title}</b><span>${item.cat} / ${item.sub}</span></div>`);
  if (item.type === 'quote')
    el.insertAdjacentHTML('beforeend', `<div class="cap"><span>${item.cat} / ${item.sub}</span></div>`);
  camera.appendChild(el);
  els.push({ el, v: dir(item.lat, item.lon), item });
});

/* ---------- orbit camera ---------- */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cam = { rx: 0, ry: 0, zoom: -2050 };
const target = { rx: 0, ry: 0, zoom: -2050 };
window.__cam = cam;  // test hook
let lastInput = Date.now();

function buckets(){
  for (const o of els){
    const f = facing(o.v, cam.rx, cam.ry);
    const b = f > 0.5 ? 'd-near' : f > 0.1 ? 'd-mid' : f > -0.05 ? 'd-far' : 'd-behind';
    if (o.b !== b){
      if (o.b) o.el.classList.remove(o.b);
      o.el.classList.add(b);
      o.b = b;
    }
  }
}

function hud(){
  let best = CATS[0], bf = -2;
  for (const c of CATS){
    const f = facing(dir(c.lat, c.lon), cam.rx, cam.ry);
    if (f > bf){ bf = f; best = c; }
  }
  const h = document.getElementById('hud');
  if (h.dataset.cat !== best.id){
    h.dataset.cat = best.id;
    const idx = CATS.indexOf(best);
    h.innerHTML = `${best.label}<small>${String(idx+1).padStart(2,'0')} / ${String(CATS.length).padStart(2,'0')}</small>`;
    document.querySelectorAll('.rail-cat').forEach(x => x.classList.toggle('on', x.dataset.cat === best.id));
  }
}

function tick(){
  requestAnimationFrame(tick);
  if (!RM && Date.now() - lastInput > 6000) target.ry += 0.015;  // idle planet spin
  const f = RM ? 1 : 0.18;
  cam.rx += (target.rx - cam.rx) * f;
  cam.ry += (target.ry - cam.ry) * f;
  cam.zoom += (target.zoom - cam.zoom) * f;
  camera.style.transform = `translateZ(${cam.zoom}px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg)`;
  buckets(); hud();
}
tick();

/* rotate the given surface point to face the viewer, via the short way round */
function flyTo(lat, lon, zoom){
  let ry = -lon;
  ry += Math.round((target.ry - ry) / 360) * 360;
  target.ry = ry;
  target.rx = lat;
  target.zoom = Math.max(-2100, Math.min(-880, zoom));
}

/* manual picking: Chromium hit-testing is unreliable for 3D descendants,
   but projected rects are always correct. Topmost = most viewer-facing. */
function pick(cx, cy){
  let best = null, bestD = -Infinity;
  for (const o of els){
    if (o.ghost || (o.b !== 'd-near' && o.b !== 'd-mid')) continue;
    const r = o.el.getBoundingClientRect();
    if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom){
      const d = facing(o.v, cam.rx, cam.ry);
      if (d > bestD){ bestD = d; best = o; }
    }
  }
  return best;
}

/* ---------- input ---------- */
const pointers = new Map();
let drag = null, hovered = null;

space.addEventListener('pointerdown', e => {
  space.setPointerCapture(e.pointerId);
  lastInput = Date.now();
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2){
    const [a, b] = [...pointers.values()];
    drag = { pinch: Math.hypot(a.x-b.x, a.y-b.y), zoom: target.zoom };
  } else {
    drag = { sx: e.clientX, sy: e.clientY, trx: target.rx, try: target.ry, moved: false };
  }
});

space.addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (drag){
    lastInput = Date.now();
    if (drag.pinch && pointers.size === 2){
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x-b.x, a.y-b.y);
      target.zoom = Math.max(-2100, Math.min(-880, drag.zoom + (d - drag.pinch) * 4.5));
      return;
    }
    if (drag.pinch) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
    target.ry = drag.try + dx * 0.34;
    target.rx = Math.max(-72, Math.min(72, drag.trx - dy * 0.30));
    if (drag.moved) space.classList.add('panning');
    return;
  }
  const hit = pick(e.clientX, e.clientY);
  const el = hit ? hit.el : null;
  if (el !== hovered){
    if (hovered) hovered.classList.remove('hover');
    if (el) el.classList.add('hover');
    hovered = el;
    space.style.cursor = el ? 'pointer' : 'grab';
  }
});

['pointerup','pointercancel'].forEach(ev => space.addEventListener(ev, e => {
  pointers.delete(e.pointerId);
  space.classList.remove('panning');
  if (drag && !drag.pinch && !drag.moved){
    const hit = pick(e.clientX, e.clientY);
    if (hit) openFocus(hit.item.id);
  }
  drag = null;
}));

space.addEventListener('wheel', e => {
  e.preventDefault();
  lastInput = Date.now();
  const unit = e.deltaMode === 1 ? 16 : 1;
  target.zoom = Math.max(-2100, Math.min(-880, target.zoom - e.deltaY * unit * 3.4));
}, { passive: false });

addEventListener('keydown', e => {
  if (e.key === 'Escape') closeFocus();
  lastInput = Date.now();
  if (e.key === 'ArrowLeft') target.ry -= 14;
  if (e.key === 'ArrowRight') target.ry += 14;
  if (e.key === 'ArrowUp') target.rx = Math.min(72, target.rx + 10);
  if (e.key === 'ArrowDown') target.rx = Math.max(-72, target.rx - 10);
  if (e.key === '+' || e.key === 'w') target.zoom = Math.min(-880, target.zoom + 220);
  if (e.key === '-' || e.key === 's') target.zoom = Math.max(-2100, target.zoom - 220);
});

/* ---------- rail ---------- */
const rail = document.getElementById('rail');
CATS.forEach(cat => {
  const group = document.createElement('div');
  group.className = 'rail-group';
  const btn = document.createElement('button');
  btn.className = 'rail-cat'; btn.dataset.cat = cat.id;
  btn.innerHTML = `${cat.label}<span class="n">${ITEMS.filter(i => i.cat === cat.id).length}</span>`;
  btn.onclick = () => flyTo(cat.lat, cat.lon, -1150);
  group.appendChild(btn);
  cat.subs.forEach(sub => {
    const sb = document.createElement('button');
    sb.className = 'rail-sub'; sb.textContent = sub;
    sb.onclick = () => {
      const mine = ITEMS.filter(i => i.cat === cat.id && i.sub === sub);
      const la = mine.reduce((t, i) => t + i.lat, 0) / mine.length;
      const lo = mine.reduce((t, i) => t + i.lon, 0) / mine.length;
      flyTo(la, lo, -1020);
    };
    group.appendChild(sb);
  });
  rail.appendChild(group);
});

const railToggle = document.getElementById('railToggle');
railToggle.onclick = () => {
  const hidden = rail.classList.toggle('hidden');
  railToggle.setAttribute('aria-expanded', String(!hidden));
};
if (matchMedia('(max-width: 760px)').matches){
  rail.classList.add('hidden');
  railToggle.setAttribute('aria-expanded', 'false');
}

/* ---------- focus overlay ---------- */
const focus = document.getElementById('focus');
function openFocus(id){
  const item = ITEMS.find(i => i.id === id);
  if (!item) return;
  const holder = document.getElementById('focusArt');
  holder.innerHTML = '';
  const big = art(item, 1.6);
  if (big) holder.appendChild(big);
  else if (item.type === 'quote') holder.innerHTML = `<div style="background:var(--cream);color:var(--ink);border-radius:10px;padding:22px;font-size:16px;line-height:1.5">“${item.title}”</div>`;
  else holder.innerHTML = `<div style="display:flex;align-items:center;gap:12px;background:var(--night);border:1px solid var(--line);border-radius:999px;padding:10px 18px"><span style="width:30px;height:30px;border-radius:50%;background:var(--gold);color:var(--night);display:flex;align-items:center;justify-content:center;font-size:10px">▶</span>${item.title}</div>`;
  document.getElementById('focusPath').textContent = `${item.cat} / ${item.sub}`;
  document.getElementById('focusTitle').textContent = item.title;
  document.getElementById('focusMeta').textContent = item.meta;
  focus.hidden = false;
}
function closeFocus(){ focus.hidden = true; }
document.getElementById('focusClose').onclick = closeFocus;
focus.addEventListener('click', e => { if (e.target === focus) closeFocus(); });

/* arrive from deep space, then settle on FILM */
if (RM) flyTo(CATS[0].lat, CATS[0].lon, -1150);
else { cam.ry = -70; setTimeout(() => flyTo(CATS[0].lat, CATS[0].lon, -1150), 350); }
