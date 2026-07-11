'use strict';

/* ---------- tiny IndexedDB store for image blobs ---------- */
const idb = {
  _db: null,
  open(){
    if(this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('inspo', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('img');
      r.onsuccess = () => { this._db = r.result; res(this._db); };
      r.onerror = () => rej(r.error);
    });
  },
  async put(k, v){ const db = await this.open(); return new Promise((res, rej) => {
    const t = db.transaction('img','readwrite'); t.objectStore('img').put(v, k);
    t.oncomplete = res; t.onerror = () => rej(t.error);
  });},
  async get(k){ const db = await this.open(); return new Promise((res, rej) => {
    const r = db.transaction('img').objectStore('img').get(k);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });},
  async del(k){ const db = await this.open(); return new Promise((res, rej) => {
    const t = db.transaction('img','readwrite'); t.objectStore('img').delete(k);
    t.oncomplete = res; t.onerror = () => rej(t.error);
  });},
};

/* ---------- state ---------- */
const uid = () => crypto.randomUUID().slice(0, 8);
let state = { nodes: [], links: [], view: { x: 0, y: 0, k: 1 } };
let selected = null;

const viewport = document.getElementById('viewport');
const world = document.getElementById('world');
const wires = document.getElementById('wires');
const empty = document.getElementById('empty');

function load(){
  try{
    const raw = localStorage.getItem('inspo-board');
    if(raw){ const s = JSON.parse(raw); if(s.nodes) state = s; }
    // migrate v1 music nodes (big embeds) to slim bars
    for(const n of state.nodes){
      if(n.type !== 'music' || n.provider) continue;
      let m;
      if((m = (n.embed||'').match(/youtube-nocookie\.com\/embed\/([\w-]+)/))){
        n.provider = 'youtube'; n.media = m[1]; n.url = `https://youtu.be/${m[1]}`;
      }else if((m = (n.embed||'').match(/open\.spotify\.com\/embed\/(track|album|playlist|artist)\/(\w+)/))){
        n.provider = 'spotify'; n.kind = m[1]; n.media = m[2];
        n.url = `https://open.spotify.com/${m[1]}/${m[2]}`;
      }else if((m = (n.embed||'').match(/w\.soundcloud\.com\/player\/\?url=([^&]+)/))){
        n.provider = 'soundcloud'; n.url = decodeURIComponent(m[1]);
      }else{ continue; }
      delete n.embed; n.w = 340; n.h = 44; n.title = '';
    }
  }catch{ /* fresh board */ }
}
let saveT = 0;
function save(){
  clearTimeout(saveT);
  saveT = setTimeout(() => localStorage.setItem('inspo-board', JSON.stringify(state)), 350);
}

/* ---------- view transform ---------- */
function applyView(){
  const { x, y, k } = state.view;
  world.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
}
const toWorld = (sx, sy) => ({
  x: (sx - state.view.x) / state.view.k,
  y: (sy - state.view.y) / state.view.k,
});

/* ---------- wires ---------- */
function center(n){ return { x: n.x + n.w/2, y: n.y + n.h/2 }; }
function drawWires(){
  let d = '';
  const paths = [];
  for(const l of state.links){
    const a = state.nodes.find(n => n.id === l.a);
    const b = state.nodes.find(n => n.id === l.b);
    if(!a || !b) continue;
    const p = center(a), q = center(b);
    const mx = (p.x + q.x)/2;
    paths.push(`<path data-a="${l.a}" data-b="${l.b}" d="M${p.x},${p.y} C${mx},${p.y} ${mx},${q.y} ${q.x},${q.y}"/>`);
  }
  wires.innerHTML = paths.join('') + '<path class="temp" id="tempWire" d="" hidden/>';
}
wires.addEventListener('click', e => {
  const p = e.target.closest('path[data-a]');
  if(!p) return;
  state.links = state.links.filter(l => !(l.a === p.dataset.a && l.b === p.dataset.b));
  drawWires(); save();
});

/* ---------- node rendering ---------- */
function nodeEl(id){ return world.querySelector(`[data-id="${id}"]`); }

function renderNode(n){
  let el = nodeEl(n.id);
  if(!el){
    el = document.createElement('div');
    el.className = 'node';
    el.dataset.id = n.id;
    el.innerHTML = `<button class="del" aria-label="Delete">✕</button>
      <span class="port" title="Drag to another node to connect"></span>
      <span class="grip" aria-hidden="true"></span>`;
    if(n.type === 'image'){
      const img = document.createElement('img');
      img.alt = '';
      idb.get(n.img).then(blob => { if(blob) img.src = URL.createObjectURL(blob); });
      el.prepend(img);
    }else if(n.type === 'note'){
      el.insertAdjacentHTML('afterbegin',
        `<div class="bar">note</div><div class="txt" contenteditable="true" spellcheck="false" style="height:calc(100% - 22px)"></div>`);
      el.querySelector('.txt').textContent = n.text || '';
      el.querySelector('.txt').addEventListener('input', ev => { n.text = ev.target.textContent; save(); });
    }else if(n.type === 'music'){
      el.classList.add('music');
      el.insertAdjacentHTML('afterbegin',
        `<div class="mbar">
           <button class="play" aria-label="Play">\u25B6</button>
           <span class="mtitle"></span>
           <span class="mprov"></span>
         </div><div class="mplayer" hidden></div>`);
      el.querySelector('.mtitle').textContent = n.title || '\u2026';
      el.querySelector('.mprov').textContent = n.provider || '';
      if(!n.title) fetchTitle(n);
      const btn = el.querySelector('.play');
      btn.addEventListener('pointerdown', ev => ev.stopPropagation());
      btn.addEventListener('click', () => togglePlay(n));
    }
    world.appendChild(el);
  }
  el.style.left = n.x + 'px';
  el.style.top = n.y + 'px';
  el.style.width = n.w + 'px';
  el.style.height = n.h + 'px';
  el.classList.toggle('sel', selected === n.id);
}

function renderAll(){
  world.querySelectorAll('.node').forEach(el => {
    if(!state.nodes.find(n => n.id === el.dataset.id)) el.remove();
  });
  state.nodes.forEach(renderNode);
  drawWires();
  empty.hidden = state.nodes.length > 0;
}

function select(id){
  selected = id;
  world.querySelectorAll('.node').forEach(el =>
    el.classList.toggle('sel', el.dataset.id === id));
}

function removeNode(id){
  const n = state.nodes.find(x => x.id === id);
  if(!n) return;
  if(n.type === 'image' && n.img) idb.del(n.img);
  state.nodes = state.nodes.filter(x => x.id !== id);
  state.links = state.links.filter(l => l.a !== id && l.b !== id);
  if(selected === id) selected = null;
  renderAll(); save();
}

/* ---------- adders ---------- */
function addNode(n){
  state.nodes.push(n);
  renderNode(n);
  empty.hidden = true;
  select(n.id);
  save();
  return n;
}

function viewCenter(){
  return toWorld(innerWidth/2, innerHeight/2);
}

async function addImageBlob(blob, at){
  const bmp = await createImageBitmap(blob).catch(() => null);
  if(!bmp) return;
  // keep boards light: downscale big files
  let stored = blob;
  const max = 1600;
  if(Math.max(bmp.width, bmp.height) > max || blob.size > 1_500_000){
    const k = Math.min(1, max/Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width*k); c.height = Math.round(bmp.height*k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    stored = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.87)) || blob;
  }
  const imgId = uid();
  await idb.put(imgId, stored);
  const w = 260, h = Math.round(w * bmp.height / bmp.width);
  const p = at || viewCenter();
  addNode({ id: uid(), type: 'image', img: imgId, x: p.x - w/2, y: p.y - h/2, w, h });
}

function addNoteAt(at, text){
  const p = at || viewCenter();
  const n = addNode({ id: uid(), type: 'note', text: text || '', x: p.x - 120, y: p.y - 70, w: 240, h: 140 });
  const txt = nodeEl(n.id).querySelector('.txt');
  setTimeout(() => txt.focus(), 30);
}

/* music: paste a link, get a slim player bar */
function musicInfo(url){
  url = (url || '').trim();
  let m;
  if((m = url.match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/)|youtu\.be\/)([\w-]{6,})/)))
    return { provider: 'youtube', media: m[1], url };
  if((m = url.match(/open\.spotify\.com\/(track|album|playlist|artist)\/(\w+)/)))
    return { provider: 'spotify', kind: m[1], media: m[2], url };
  if(/soundcloud\.com\//.test(url))
    return { provider: 'soundcloud', url };
  return null;
}

const musicEmbed = musicInfo;   // paste/drop handlers use this as a "is it music?" check

function addMusic(url, at){
  const info = musicInfo(url);
  const p = at || viewCenter();
  if(!info){ addNoteAt(p, url); return; }
  const n = addNode({ id: uid(), type: 'music', ...info, title: '', x: p.x - 170, y: p.y - 22, w: 340, h: 44 });
  fetchTitle(n);
}

async function fetchTitle(n){
  try{
    const api = n.provider === 'spotify'
      ? `https://open.spotify.com/oembed?url=${encodeURIComponent(n.url)}`
      : `https://noembed.com/embed?url=${encodeURIComponent(n.url)}`;
    const o = await (await fetch(api)).json();
    if(o && o.title){
      n.title = o.title;
      const el = nodeEl(n.id);
      if(el) el.querySelector('.mtitle').textContent = o.title;
      save();
    }
  }catch{ /* keep the ellipsis */ }
}

/* playback: YouTube + SoundCloud play through hidden widgets driven by
   postMessage; Spotify only plays inside its own player, so its bar
   expands a compact embed instead */
const players = new Map();

function setIcon(id, playing){
  const el = nodeEl(id);
  if(el) el.querySelector('.play').textContent = playing ? '\u275A\u275A' : '\u25B6';
}

function pausePlayer(id){
  const p = players.get(id);
  if(!p || !p.playing) return;
  if(p.kind === 'yt')
    p.f.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":[]}', '*');
  else if(p.kind === 'sc')
    p.f.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), 'https://w.soundcloud.com');
  else if(p.kind === 'sp'){
    p.f.remove(); players.delete(id);
    const n = state.nodes.find(x => x.id === id);
    const el = nodeEl(id);
    if(el) el.querySelector('.mplayer').hidden = true;
    if(n){ n.h = 44; renderNode(n); drawWires(); save(); }
  }
  p.playing = false;
  setIcon(id, false);
}

function togglePlay(n){
  const p = players.get(n.id);
  if(p && p.playing){ pausePlayer(n.id); return; }
  for(const id of players.keys()) if(id !== n.id) pausePlayer(id);
  const el = nodeEl(n.id);
  if(n.provider === 'youtube'){
    if(p){
      p.f.contentWindow.postMessage('{"event":"command","func":"playVideo","args":[]}', '*');
      p.playing = true;
    }else{
      const f = document.createElement('iframe');
      f.className = 'ghost';
      f.allow = 'autoplay; encrypted-media';
      f.src = `https://www.youtube-nocookie.com/embed/${n.media}?autoplay=1&enablejsapi=1&playsinline=1`;
      el.appendChild(f);
      players.set(n.id, { kind: 'yt', f, playing: true });
    }
  }else if(n.provider === 'soundcloud'){
    if(p){
      p.f.contentWindow.postMessage(JSON.stringify({ method: 'play' }), 'https://w.soundcloud.com');
      p.playing = true;
    }else{
      const f = document.createElement('iframe');
      f.className = 'ghost';
      f.allow = 'autoplay';
      f.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(n.url)}&auto_play=true`;
      el.appendChild(f);
      players.set(n.id, { kind: 'sc', f, playing: true });
    }
  }else if(n.provider === 'spotify'){
    const holder = el.querySelector('.mplayer');
    holder.hidden = false;
    n.h = 140; renderNode(n); drawWires(); save();
    const f = document.createElement('iframe');
    f.style.cssText = 'width:100%;height:80px;border:0;border-radius:12px;display:block';
    f.allow = 'encrypted-media';
    f.src = `https://open.spotify.com/embed/${n.kind || 'track'}/${n.media}`;
    holder.appendChild(f);
    players.set(n.id, { kind: 'sp', f, playing: true });
  }
  setIcon(n.id, true);
}

/* ---------- pointer interactions ---------- */
const pointers = new Map();
let mode = null;   // {type:'pan'|'node'|'resize'|'wire'|'pinch', ...}

function nodeFromEvent(e){
  const el = e.target.closest('.node');
  return el ? state.nodes.find(n => n.id === el.dataset.id) : null;
}

viewport.addEventListener('pointerdown', e => {
  viewport.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if(pointers.size === 2){
    const [a, b] = [...pointers.values()];
    mode = { type: 'pinch', d: Math.hypot(a.x-b.x, a.y-b.y), view: { ...state.view } };
    return;
  }

  if(e.target.classList.contains('port')){
    const n = nodeFromEvent(e);
    mode = { type: 'wire', from: n.id };
    document.body.classList.add('busy');
    return;
  }
  if(e.target.classList.contains('grip')){
    const n = nodeFromEvent(e);
    mode = { type: 'resize', n, w: n.w, h: n.h, sx: e.clientX, sy: e.clientY };
    document.body.classList.add('busy');
    return;
  }
  if(e.target.classList.contains('del')){
    removeNode(nodeFromEvent(e).id);
    mode = null;
    return;
  }

  const n = nodeFromEvent(e);
  if(n){
    // notes drag by their bar; text area is for writing
    if(n.type !== 'image' && !e.target.closest('.bar') && !e.target.closest('.txt')) { /* frame click ok */ }
    if(e.target.closest('.txt')){ select(n.id); mode = null; return; }
    select(n.id);
    world.appendChild(nodeEl(n.id));   // bring to front
    mode = { type: 'node', n, nx: n.x, ny: n.y, sx: e.clientX, sy: e.clientY };
    document.body.classList.add('busy');
  }else{
    select(null);
    mode = { type: 'pan', vx: state.view.x, vy: state.view.y, sx: e.clientX, sy: e.clientY };
    viewport.classList.add('panning');
  }
});

viewport.addEventListener('pointermove', e => {
  if(pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if(!mode) return;

  if(mode.type === 'pinch' && pointers.size === 2){
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x-b.x, a.y-b.y);
    const mid = { x: (a.x+b.x)/2, y: (a.y+b.y)/2 };
    const k = Math.min(3, Math.max(0.1, mode.view.k * d / mode.d));
    const w = { x: (mid.x - mode.view.x) / mode.view.k, y: (mid.y - mode.view.y) / mode.view.k };
    state.view = { k, x: mid.x - w.x*k, y: mid.y - w.y*k };
    applyView(); save();
    return;
  }
  if(mode.type === 'pan'){
    state.view.x = mode.vx + e.clientX - mode.sx;
    state.view.y = mode.vy + e.clientY - mode.sy;
    applyView(); save();
  }else if(mode.type === 'node'){
    mode.n.x = mode.nx + (e.clientX - mode.sx) / state.view.k;
    mode.n.y = mode.ny + (e.clientY - mode.sy) / state.view.k;
    renderNode(mode.n); drawWires(); save();
  }else if(mode.type === 'resize'){
    mode.n.w = Math.max(90, mode.w + (e.clientX - mode.sx) / state.view.k);
    mode.n.h = Math.max(60, mode.h + (e.clientY - mode.sy) / state.view.k);
    renderNode(mode.n); drawWires(); save();
  }else if(mode.type === 'wire'){
    const from = state.nodes.find(n => n.id === mode.from);
    const p = center(from), q = toWorld(e.clientX, e.clientY);
    const t = document.getElementById('tempWire');
    const mx = (p.x + q.x)/2;
    t.setAttribute('d', `M${p.x},${p.y} C${mx},${p.y} ${mx},${q.y} ${q.x},${q.y}`);
    t.hidden = false;
  }
});

viewport.addEventListener('pointerup', e => {
  pointers.delete(e.pointerId);
  document.body.classList.remove('busy');
  viewport.classList.remove('panning');
  if(mode && mode.type === 'wire'){
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.node');
    if(el && el.dataset.id !== mode.from){
      const a = mode.from, b = el.dataset.id;
      if(!state.links.some(l => (l.a === a && l.b === b) || (l.a === b && l.b === a)))
        state.links.push({ a, b });
    }
    drawWires(); save();
  }
  mode = null;
});
viewport.addEventListener('pointercancel', e => {
  pointers.delete(e.pointerId);
  mode = null;
  document.body.classList.remove('busy');
  viewport.classList.remove('panning');
});

/* wheel: zoom to cursor */
viewport.addEventListener('wheel', e => {
  e.preventDefault();
  const k2 = Math.min(3, Math.max(0.1, state.view.k * (e.deltaY < 0 ? 1.09 : 0.92)));
  const w = toWorld(e.clientX, e.clientY);
  state.view = { k: k2, x: e.clientX - w.x*k2, y: e.clientY - w.y*k2 };
  applyView(); save();
}, { passive: false });

/* double-click empty canvas: quick note */
viewport.addEventListener('dblclick', e => {
  if(e.target.closest('.node')) return;
  addNoteAt(toWorld(e.clientX, e.clientY));
});

/* keyboard */
addEventListener('keydown', e => {
  if((e.key === 'Backspace' || e.key === 'Delete') && selected){
    if(document.activeElement?.isContentEditable) return;
    e.preventDefault();
    removeNode(selected);
  }
});

/* ---------- files in: drop, paste, picker ---------- */
['dragover','dragenter'].forEach(ev => addEventListener(ev, e => {
  e.preventDefault(); viewport.classList.add('dropping');
}));
['dragleave','drop'].forEach(ev => addEventListener(ev, e => {
  e.preventDefault(); viewport.classList.remove('dropping');
}));
addEventListener('drop', e => {
  const at = toWorld(e.clientX, e.clientY);
  [...(e.dataTransfer?.files || [])].filter(f => f.type.startsWith('image/'))
    .forEach((f, i) => addImageBlob(f, { x: at.x + i*36, y: at.y + i*36 }));
  const url = e.dataTransfer?.getData('text/uri-list') || '';
  if(url && musicEmbed(url)) addMusic(url, at);
});
addEventListener('paste', e => {
  if(document.activeElement?.isContentEditable) return;
  const items = [...(e.clipboardData?.items || [])];
  const imgs = items.filter(i => i.type.startsWith('image/'));
  if(imgs.length){ imgs.forEach(i => addImageBlob(i.getAsFile())); return; }
  const text = e.clipboardData?.getData('text') || '';
  if(!text.trim()) return;
  if(musicEmbed(text)) addMusic(text);
  else if(/^https?:\/\//.test(text.trim())) addNoteAt(null, text.trim());
});

document.getElementById('file').onchange = e => {
  [...e.target.files].forEach((f, i) => {
    const c = viewCenter();
    addImageBlob(f, { x: c.x + i*36, y: c.y + i*36 });
  });
  e.target.value = '';
};
document.getElementById('addImage').onclick = () => document.getElementById('file').click();
document.getElementById('addNote').onclick = () => addNoteAt();
document.getElementById('addMusic').onclick = () => {
  const url = prompt('Paste a YouTube, Spotify or SoundCloud link:');
  if(url) addMusic(url);
};
document.getElementById('zoomFit').onclick = () => {
  if(!state.nodes.length) return;
  const xs = state.nodes.map(n => n.x), ys = state.nodes.map(n => n.y);
  const xe = state.nodes.map(n => n.x + n.w), ye = state.nodes.map(n => n.y + n.h);
  const bx = Math.min(...xs), by = Math.min(...ys);
  const bw = Math.max(...xe) - bx, bh = Math.max(...ye) - by;
  const k = Math.min(3, Math.max(0.1, Math.min((innerWidth - 120)/bw, (innerHeight - 160)/bh)));
  state.view = {
    k,
    x: (innerWidth - bw*k)/2 - bx*k,
    y: (innerHeight - bh*k)/2 - by*k + 20,
  };
  applyView(); save();
};

/* while dragging, iframes must not eat pointer events */
const busyStyle = document.createElement('style');
busyStyle.textContent = 'body.busy iframe{pointer-events:none}';
document.head.appendChild(busyStyle);

/* ---------- boot ---------- */
load();
applyView();
renderAll();
