'use strict';

/* ═══ INSPO · creative second brain ═══
   One 3D space. Categories live in depth bands; scrolling flies the
   camera through them. All content below is PLACEHOLDER data: swap the
   ITEMS entries (title/meta/sub) for real references later. */

const rnd = (seed => () => {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
})(41);

const BAND = 1200, START = 420;
const CATS = [
  { id:'film',   label:'FILM',   x:0,    y:-40,  subs:['music videos','short films','scenes'] },
  { id:'photo',  label:'PHOTO',  x:660,  y:230,  subs:['street','flash','editorial'] },
  { id:'music',  label:'MUSIC',  x:-640, y:200,  subs:['tracks','albums'] },
  { id:'books',  label:'BOOKS',  x:520,  y:-300, subs:['design','stories'] },
  { id:'design', label:'DESIGN', x:-560, y:-280, subs:['posters','type','sites'] },
  { id:'words',  label:'WORDS',  x:60,   y:380,  subs:['quotes','ideas'] },
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
CATS.forEach((cat, ci) => {
  cat.z0 = START + ci * BAND;
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
        x: cat.x + (rnd() - 0.5) * 680,
        y: cat.y + (rnd() - 0.5) * 470,
        z: -(cat.z0 + rnd() * 780),
      });
    }
  });
});

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

/* ---------- build the space ---------- */
const camera = document.getElementById('camera');
const space = document.getElementById('space');
const els = [];

CATS.forEach(cat => {
  const g = document.createElement('div');
  g.className = 'ghost';
  g.innerHTML = `${cat.label}<i>${cat.subs.join(' · ')}</i>`;
  const gx = cat.x - cat.label.length * 52, gy = cat.y - 95, gz = -(cat.z0 + 950);
  g.style.transform = `translate3d(${gx}px, ${gy}px, ${gz}px)`;
  camera.appendChild(g);
  els.push({ el: g, z: gz, ghost: true });
});

ITEMS.forEach(item => {
  const [w, h] = SIZE[item.type];
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.id = item.id;
  el.style.width = w + 'px'; el.style.height = h + 'px';
  el.style.transform = `translate3d(${item.x - w/2}px, ${item.y - h/2}px, ${item.z}px)`;
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
  els.push({ el, z: item.z, item });
});

/* ---------- camera ---------- */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAXZ = START + CATS.length * BAND + 300;
const cam = { x: 0, y: 0, z: 0 };
const target = { x: 0, y: 0, z: 0 };
window.__cam = cam;  // test hook

function buckets(){
  for (const o of els){
    const d = o.z + cam.z;
    const b = d > -70 ? 'd-behind' : d > -1050 ? 'd-near' : d > -2300 ? 'd-mid' : 'd-far';
    if (o.b !== b){
      if (o.b) o.el.classList.remove(o.b);
      o.el.classList.add(b);
      o.b = b;
    }
  }
}

function hud(){
  const idx = Math.min(CATS.length - 1, Math.max(0, Math.round((cam.z - START - 500) / BAND)));
  const cat = CATS[idx];
  const h = document.getElementById('hud');
  if (h.dataset.cat !== cat.id){
    h.dataset.cat = cat.id;
    h.innerHTML = `${cat.label}<small>${String(idx+1).padStart(2,'0')} / ${String(CATS.length).padStart(2,'0')}</small>`;
    document.querySelectorAll('.rail-cat').forEach(b => b.classList.toggle('on', b.dataset.cat === cat.id));
  }
}

let raf = 0;
function tick(){
  raf = requestAnimationFrame(tick);
  const f = RM ? 1 : 0.14;
  cam.x += (target.x - cam.x) * f;
  cam.y += (target.y - cam.y) * f;
  cam.z += (target.z - cam.z) * f;
  camera.style.transform = `translate3d(${-cam.x}px, ${-cam.y}px, ${cam.z}px)`;
  buckets(); hud();
}
tick();

function flyTo(x, y, z){
  target.x = x; target.y = y;
  target.z = Math.max(0, Math.min(MAXZ, z));
}

/* ---------- input ---------- */
const pointers = new Map();
let drag = null;

space.addEventListener('pointerdown', e => {
  space.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2){
    const [a, b] = [...pointers.values()];
    drag = { pinch: Math.hypot(a.x-b.x, a.y-b.y), z: target.z };
  } else {
    drag = { sx: e.clientX, sy: e.clientY, tx: target.x, ty: target.y, moved: false };
  }
});
space.addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!drag) return;
  if (drag.pinch && pointers.size === 2){
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x-b.x, a.y-b.y);
    target.z = Math.max(0, Math.min(MAXZ, drag.z + (d - drag.pinch) * 4));
    return;
  }
  if (drag.pinch) return;
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
  target.x = drag.tx - dx * 1.15;
  target.y = drag.ty - dy * 1.15;
  if (drag.moved) space.classList.add('panning');
});
/* Chromium hit-testing is unreliable for 3D-transformed descendants, so
   picking is manual: projected rects are always correct even when clicks
   fall through. Topmost = closest to the eye. */
function pick(cx, cy){
  let best = null, bestD = -Infinity;
  for (const o of els){
    if (o.ghost || (o.b !== 'd-near' && o.b !== 'd-mid')) continue;
    const r = o.el.getBoundingClientRect();
    if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom){
      const d = o.z + cam.z;
      if (d > bestD){ bestD = d; best = o; }
    }
  }
  return best;
}

['pointerup','pointercancel'].forEach(ev => space.addEventListener(ev, e => {
  pointers.delete(e.pointerId);
  space.classList.remove('panning');
  if (drag && !drag.pinch && !drag.moved){
    const hit = pick(e.clientX, e.clientY);
    if (hit) openFocus(hit.item.id);
  }
  drag = null;
}));

let hovered = null;
space.addEventListener('pointermove', e => {
  if (drag) return;
  const hit = pick(e.clientX, e.clientY);
  const el = hit ? hit.el : null;
  if (el !== hovered){
    if (hovered) hovered.classList.remove('hover');
    if (el) el.classList.add('hover');
    hovered = el;
    space.style.cursor = el ? 'pointer' : 'grab';
  }
});

space.addEventListener('wheel', e => {
  e.preventDefault();
  const unit = e.deltaMode === 1 ? 16 : 1;
  target.z = Math.max(0, Math.min(MAXZ, target.z - e.deltaY * unit * 1.6));
}, { passive: false });

addEventListener('keydown', e => {
  if (e.key === 'Escape') closeFocus();
  const step = 120;
  if (e.key === 'ArrowLeft') target.x -= step;
  if (e.key === 'ArrowRight') target.x += step;
  if (e.key === 'ArrowUp') target.y -= step;
  if (e.key === 'ArrowDown') target.y += step;
  if (e.key === '+' || e.key === 'w') target.z = Math.min(MAXZ, target.z + 300);
  if (e.key === '-' || e.key === 's') target.z = Math.max(0, target.z - 300);
});

/* ---------- rail ---------- */
const rail = document.getElementById('rail');
CATS.forEach(cat => {
  const group = document.createElement('div');
  group.className = 'rail-group';
  const btn = document.createElement('button');
  btn.className = 'rail-cat'; btn.dataset.cat = cat.id;
  btn.innerHTML = `${cat.label}<span class="n">${ITEMS.filter(i => i.cat === cat.id).length}</span>`;
  btn.onclick = () => flyTo(cat.x, cat.y, cat.z0 + 480);
  group.appendChild(btn);
  cat.subs.forEach(sub => {
    const sb = document.createElement('button');
    sb.className = 'rail-sub'; sb.textContent = sub;
    sb.onclick = () => {
      const mine = ITEMS.filter(i => i.cat === cat.id && i.sub === sub);
      const cx = mine.reduce((s, i) => s + i.x, 0) / mine.length;
      const cy = mine.reduce((s, i) => s + i.y, 0) / mine.length;
      const cz = mine.reduce((s, i) => s + i.z, 0) / mine.length;
      flyTo(cx, cy, -cz + 620);
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

/* start at the front door: drift into FILM */
flyTo(CATS[0].x, CATS[0].y, RM ? CATS[0].z0 + 480 : 260);
if (!RM) setTimeout(() => flyTo(CATS[0].x, CATS[0].y, CATS[0].z0 + 480), 400);
