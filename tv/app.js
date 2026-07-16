/* ── JANSSON TV — broadcast engine ───────────────────────────────
   The station runs on the wall clock: position in each channel's
   loop is derived from (now − STATION.epoch), so the broadcast is
   "live" — no pause, no scrubber, everyone sees the same frame.
   ───────────────────────────────────────────────────────────────── */
(() => {
'use strict';

const $ = id => document.getElementById(id);
const scr = $('screen'), video = $('video'), noise = $('noise'), card = $('card');
const osdCh = $('osdCh'), osdNum = $('osdNum'), osdName = $('osdName');
const osdVol = $('osdVol'), volBars = $('volBars'), osdMute = $('osdMute'), osdHint = $('osdHint');
const lower3 = $('lower3'), l3Artist = $('l3Artist'), l3Title = $('l3Title'), l3Meta = $('l3Meta');
const guide = $('guide'), gGrid = $('gGrid'), gClock = $('gClock');
const rem = $('remote');

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NUMS = CHANNELS.map(c => c.num).sort((a, b) => a - b);

let powered = false;
let current = null;          // tuned channel object (or null on a dead channel)
let deadNum = null;
let vol = Math.max(0, Math.min(10, parseInt(localStorage.getItem('jtv-vol') ?? '7', 10) || 0));
let muted = localStorage.getItem('jtv-muted') === '1';
let tuneToken = 0;           // invalidates in-flight tunes on every new action
let typeBuf = '', typeTimer = null;
let l3Timer = null, l3EndShown = true;
let chOsdTimer = null, volOsdTimer = null, hintTimer = null;
let tcTimer = null, guideTimer = null;

/* ── schedule math ── */
function schedule(ch, atMs = Date.now()) {
  const total = ch.playlist.reduce((s, v) => s + v.dur, 0);
  let pos = ((atMs - STATION.epoch) / 1000) % total;
  if (pos < 0) pos += total;
  let idx = 0;
  while (pos >= ch.playlist[idx].dur) { pos -= ch.playlist[idx].dur; idx++; }
  const item = ch.playlist[idx];
  const startedAt = atMs - pos * 1000;
  return {
    item, offset: pos, startedAt,
    next: ch.playlist[(idx + 1) % ch.playlist.length],
    nextAt: startedAt + item.dur * 1000,
  };
}

/* ── audio (all synthesized — no files) ── */
let actx = null, noiseBuf = null, hissSrc = null, hissGain = null;
function ensureAudio() {
  if (actx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  actx = new AC();
  noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
function burst(dur = 0.35) {
  if (!actx || muted || !vol) return;
  const src = actx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const g = actx.createGain();
  g.gain.setValueAtTime(vol / 10 * 0.22, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
  src.connect(g).connect(actx.destination);
  src.start(); src.stop(actx.currentTime + dur + 0.05);
}
function hiss(on) {
  if (on) {
    if (!actx || hissSrc) return;
    hissSrc = actx.createBufferSource(); hissSrc.buffer = noiseBuf; hissSrc.loop = true;
    hissGain = actx.createGain();
    hissGain.gain.value = muted ? 0 : vol / 10 * 0.05;
    hissSrc.connect(hissGain).connect(actx.destination);
    hissSrc.start();
  } else if (hissSrc) {
    try { hissSrc.stop(); } catch (e) {}
    hissSrc = null; hissGain = null;
  }
}
function click() {
  if (!actx || muted || !vol) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = 'square'; o.frequency.value = 170;
  g.gain.setValueAtTime(vol / 10 * 0.07, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.06);
  o.connect(g).connect(actx.destination);
  o.start(); o.stop(actx.currentTime + 0.07);
}

/* ── static noise ── */
const nctx = noise.getContext('2d');
const nimg = nctx.createImageData(160, 120);
const nbuf = new Uint32Array(nimg.data.buffer);
let noiseRAF = null;
function noiseFrame() {
  for (let i = 0; i < nbuf.length; i++) {
    const v = (Math.random() * 255) | 0;
    nbuf[i] = 0xff000000 | (v << 16) | (v << 8) | v;
  }
  nctx.putImageData(nimg, 0, 0);
}
function noiseOn() {
  scr.classList.add('static');
  if (RM) { noiseFrame(); return; }
  if (noiseRAF) return;
  const loop = () => { noiseFrame(); noiseRAF = requestAnimationFrame(loop); };
  loop();
}
function noiseOff() {
  scr.classList.remove('static');
  if (noiseRAF) { cancelAnimationFrame(noiseRAF); noiseRAF = null; }
}

/* ── OSD ── */
function showChOsd(numText, name, hold = 2600) {
  osdNum.textContent = 'CH ' + numText;
  osdName.textContent = name || '';
  osdCh.hidden = false;
  clearTimeout(chOsdTimer);
  chOsdTimer = setTimeout(() => { osdCh.hidden = true; }, hold);
}
function showVolOsd() {
  volBars.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const b = document.createElement('i');
    if (i <= vol) b.className = 'onn';
    volBars.appendChild(b);
  }
  osdVol.hidden = false;
  clearTimeout(volOsdTimer);
  volOsdTimer = setTimeout(() => { osdVol.hidden = true; }, 1600);
}
function showHint(t, hold = 4000) {
  osdHint.textContent = t;
  osdHint.hidden = false;
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => { osdHint.hidden = true; }, hold);
}
function showL3(ch, item) {
  l3Artist.textContent = item.artist;
  l3Title.textContent = item.title;
  l3Meta.textContent = item.meta || '';
  lower3.classList.toggle('pirate', !!ch.pirate);
  lower3.classList.remove('out');
  lower3.hidden = false;
  clearTimeout(l3Timer);
  l3Timer = setTimeout(hideL3, 6000);
}
function hideL3() {
  if (lower3.hidden) return;
  clearTimeout(l3Timer);
  lower3.classList.add('out');
  setTimeout(() => { lower3.hidden = true; lower3.classList.remove('out'); }, 420);
}
const setTitle = t => { document.title = t; };

/* ── cards ── */
function clearCard() {
  card.hidden = true; card.innerHTML = ''; card.className = 'card';
  if (tcTimer) { clearInterval(tcTimer); tcTimer = null; }
}
function renderTestcard() {
  card.className = 'card testcard';
  card.innerHTML =
    `<div class="tc-bars"><i></i><i></i><i></i><i></i><i></i><i></i></div>` +
    `<div class="tc-strip"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>` +
    `<div class="tc-center"><div class="tc-disc">` +
    `<img src="/crown.png" alt="">` +
    `<div class="tc-name">JANSSON TELEVISION</div>` +
    `<div class="tc-clock" id="tcClock"></div>` +
    `<div class="tc-note">OFF AIR — BACK SOON</div>` +
    `</div></div>`;
  card.hidden = false;
  const el = $('tcClock');
  const tick = () => { el.textContent = new Date().toLocaleTimeString('de-DE'); };
  tick();
  tcTimer = setInterval(tick, 1000);
}
function renderIdent(c) {
  card.className = 'card identcard';
  card.innerHTML =
    `<div class="ic-frame">` +
    `<div class="ic-line1">${esc(c.line1)}</div>` +
    `<div class="ic-line2">${esc(c.line2)}</div>` +
    `<a class="ic-cta" href="${esc(c.href)}" target="_blank" rel="noopener">${esc(c.cta)}</a>` +
    `</div>`;
  card.hidden = false;
}

/* ── tuning ── */
async function tune(chNum) {
  if (!powered) return;
  const token = ++tuneToken;
  const ch = CHANNELS.find(c => c.num === chNum);
  hideL3(); clearCard();
  video.pause();
  noiseOn(); burst(0.32);
  showChOsd(pad(chNum), ch ? ch.name : '');
  await sleep(RM ? 60 : 280 + Math.random() * 170);
  if (token !== tuneToken) return;

  if (!ch) { // dead channel — you are lost in the band
    current = null; deadNum = chNum;
    video.removeAttribute('src'); video.load();
    hiss(true);
    showChOsd(pad(chNum), 'NO SIGNAL', 4000);
    setTitle(`CH ${pad(chNum)} · NO SIGNAL — JANSSON TV`);
    return;
  }

  deadNum = null; hiss(false);
  current = ch;
  localStorage.setItem('jtv-ch', chNum);

  if (ch.offair) {
    video.removeAttribute('src'); video.load();
    renderTestcard(); noiseOff();
    setTitle(`CH ${pad(ch.num)} · OFF AIR — JANSSON TV`);
    return;
  }
  if (ch.card) {
    video.removeAttribute('src'); video.load();
    renderIdent(ch.card); noiseOff();
    setTitle(`CH ${pad(ch.num)} · ${ch.name} — JANSSON TV`);
    return;
  }
  playFromClock(ch, token);
}

function playFromClock(ch, token) {
  const s = schedule(ch);
  l3EndShown = true; // armed after the seek lands
  video.src = encodeURI(s.item.file);
  video.addEventListener('loadedmetadata', () => {
    if (token !== tuneToken) return;
    try { video.currentTime = Math.min(s.offset, Math.max(0, s.item.dur - 1)); } catch (e) {}
  }, { once: true });
  video.addEventListener('playing', () => {
    if (token !== tuneToken) return;
    noiseOff();
    showL3(ch, s.item);
    l3EndShown = false;
    setTitle(`CH ${pad(ch.num)} · ${s.item.artist} — ${s.item.title}`);
  }, { once: true });
  video.play().catch(() => {
    // autoplay with sound refused — play muted, tell the viewer
    video.muted = true;
    video.play().catch(() => {});
    showHint('PRESS M TO UNMUTE');
  });
}

video.addEventListener('ended', async () => {
  if (!powered || !current || !current.playlist) return;
  const token = ++tuneToken;
  noiseOn(); burst(0.18);
  await sleep(RM ? 40 : 240);
  if (token !== tuneToken) return;
  playFromClock(current, token);
});

// MTV grammar: credits come back just before the video ends
video.addEventListener('timeupdate', () => {
  if (l3EndShown || !current || !current.playlist || !video.duration) return;
  if (video.duration - video.currentTime < 13) {
    l3EndShown = true;
    const s = schedule(current);
    showL3(current, s.item);
  }
});

// broadcast integrity: coming back to the tab, re-sync to the clock
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !powered || !current || !current.playlist) return;
  const s = schedule(current);
  const sameFile = decodeURI(video.src || '').endsWith(s.item.file);
  if (!sameFile || Math.abs(video.currentTime - s.offset) > 4) {
    playFromClock(current, ++tuneToken);
  }
});

/* ── surf / type ── */
function step(dir) {
  if (!powered) return;
  const cur = current ? current.num : (deadNum ?? NUMS[0]);
  let target;
  if (dir > 0) target = NUMS.find(n => n > cur) ?? NUMS[0];
  else target = [...NUMS].reverse().find(n => n < cur) ?? NUMS[NUMS.length - 1];
  tune(target);
}
function typeDigit(d) {
  if (!powered) return;
  typeBuf += d;
  showChOsd(typeBuf + '–'.repeat(Math.max(0, 2 - typeBuf.length)), 'TUNING', 1600);
  clearTimeout(typeTimer);
  if (typeBuf.length >= 2) commitType();
  else typeTimer = setTimeout(commitType, 1100);
}
function commitType() {
  clearTimeout(typeTimer);
  const n = parseInt(typeBuf, 10);
  typeBuf = '';
  if (!isNaN(n) && n >= STATION.dialMin && n <= STATION.dialMax) tune(n);
  else if (current) showChOsd(pad(current.num), current.name);
}

/* ── volume ── */
function applyAudioLevels() {
  video.volume = vol / 10;
  video.muted = muted;
  if (hissGain) hissGain.gain.value = muted ? 0 : vol / 10 * 0.05;
  osdMute.hidden = !muted;
}
function setVol(v) {
  vol = Math.max(0, Math.min(10, v));
  localStorage.setItem('jtv-vol', String(vol));
  if (muted && v > 0) setMuted(false);
  applyAudioLevels();
  showVolOsd();
  click();
}
function setMuted(m) {
  muted = m;
  localStorage.setItem('jtv-muted', m ? '1' : '0');
  applyAudioLevels();
}

/* ── power ── */
function powerOn() {
  ensureAudio();
  if (actx && actx.state === 'suspended') actx.resume();
  powered = true;
  document.body.classList.add('on');
  scr.classList.remove('shutting');
  if (!RM) {
    scr.classList.add('booting');
    setTimeout(() => scr.classList.remove('booting'), 720);
  }
  applyAudioLevels();
  click();
  const last = parseInt(localStorage.getItem('jtv-ch'), 10);
  tune(NUMS.includes(last) ? last : NUMS[0]);
}
function powerOff() {
  powered = false;
  tuneToken++;
  document.body.classList.remove('on');
  hiss(false); noiseOff(); hideL3(); clearCard();
  toggleGuide(false);
  video.pause(); video.removeAttribute('src'); video.load();
  osdCh.hidden = true; osdVol.hidden = true; osdHint.hidden = true; osdMute.hidden = true;
  if (!RM) {
    scr.classList.add('shutting');
    setTimeout(() => scr.classList.remove('shutting'), 340);
  }
  setTitle('JANSSON TV');
}
const togglePower = () => (powered ? powerOff() : powerOn());

/* ── ambilight — the room breathes with the broadcast ── */
const amb = document.createElement('canvas');
amb.width = amb.height = 2;
const ambx = amb.getContext('2d', { willReadFrequently: true });
setInterval(() => {
  if (!powered || video.paused || !video.videoWidth) return;
  try {
    ambx.drawImage(video, 0, 0, 2, 2);
    const d = ambx.getImageData(0, 0, 2, 2).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < 16; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    r >>= 2; g >>= 2; b >>= 2;
    r = Math.round(r * .6 + 108 * .4);
    g = Math.round(g * .6 + 26 * .4);
    b = Math.round(b * .6 + 219 * .4);
    document.documentElement.style.setProperty('--glowc', `${r},${g},${b}`);
  } catch (e) {}
}, 400);

/* ── TV guide ── */
const fmtT = t => new Date(t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
function buildGuide() {
  gGrid.innerHTML = '<div class="g-row head"><span>CH</span><span>NOW</span><span>NEXT</span></div>';
  for (const ch of CHANNELS) {
    let now = '—', nowT = '', next = '—', nextT = '';
    if (ch.playlist) {
      const s = schedule(ch);
      now = `${s.item.artist} — ${s.item.title}`; nowT = fmtT(s.startedAt);
      next = `${s.next.artist} — ${s.next.title}`; nextT = fmtT(s.nextAt);
    } else if (ch.offair) { now = 'TEST CARD'; next = 'TEST CARD'; }
    else if (ch.card) { now = 'ENCRYPTED FEED'; next = 'ENCRYPTED FEED'; }
    const row = document.createElement('div');
    row.className = 'g-row';
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    row.innerHTML =
      `<span class="g-ch">${pad(ch.num)}<span class="g-chname">${esc(ch.name)}</span></span>` +
      `<span class="g-now"><i>${nowT}</i><b>${esc(now)}</b></span>` +
      `<span class="g-next"><i>${nextT}</i><b>${esc(next)}</b></span>`;
    const go = () => { toggleGuide(false); tune(ch.num); };
    row.addEventListener('click', go);
    row.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    gGrid.appendChild(row);
  }
  gClock.textContent = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}
function toggleGuide(show = guide.hidden) {
  if (show && !powered) return;
  guide.hidden = !show;
  clearInterval(guideTimer);
  if (show) {
    buildGuide();
    guideTimer = setInterval(buildGuide, 30000);
  }
}

/* ── inputs ── */
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === 'p' || k === 'P') { togglePower(); return; }
  if (!powered) { if (k === 'Enter' || k === ' ') togglePower(); return; }
  if (k === 'Escape') { toggleGuide(false); return; }
  if (k === 'ArrowUp') { e.preventDefault(); step(1); }
  else if (k === 'ArrowDown') { e.preventDefault(); step(-1); }
  else if (k === 'ArrowRight') { e.preventDefault(); setVol(vol + 1); }
  else if (k === 'ArrowLeft') { e.preventDefault(); setVol(vol - 1); }
  else if (k === 'm' || k === 'M') { setMuted(!muted); click(); }
  else if (k === 'g' || k === 'G') toggleGuide();
  else if (/^[0-9]$/.test(k)) typeDigit(k);
});

$('btnPower').addEventListener('click', togglePower);
$('rPower').addEventListener('click', togglePower);
$('btnChUp').addEventListener('click', () => step(1));
$('btnChDn').addEventListener('click', () => step(-1));
$('rChUp').addEventListener('click', () => step(1));
$('rChDn').addEventListener('click', () => step(-1));
$('btnVolUp').addEventListener('click', () => setVol(vol + 1));
$('btnVolDn').addEventListener('click', () => setVol(vol - 1));
$('rVolUp').addEventListener('click', () => setVol(vol + 1));
$('rVolDn').addEventListener('click', () => setVol(vol - 1));
$('btnMute').addEventListener('click', () => { setMuted(!muted); click(); });
$('rMute').addEventListener('click', () => { setMuted(!muted); click(); });
$('btnGuide').addEventListener('click', () => toggleGuide());
$('rGuide').addEventListener('click', () => toggleGuide());
$('gClose').addEventListener('click', () => toggleGuide(false));
guide.addEventListener('click', e => { if (e.target === guide) toggleGuide(false); });

// remote digits
const rDigits = $('rDigits');
for (const d of ['1','2','3','4','5','6','7','8','9','','0','']) {
  if (d === '') { rDigits.appendChild(document.createElement('span')); continue; }
  const b = document.createElement('button');
  b.textContent = d;
  b.setAttribute('aria-label', 'Digit ' + d);
  b.addEventListener('click', () => typeDigit(d));
  rDigits.appendChild(b);
}

// remote drag (desktop)
rem.addEventListener('pointerdown', e => {
  if (e.target.closest('button')) return;
  const rect = rem.getBoundingClientRect();
  const ox = e.clientX - rect.left, oy = e.clientY - rect.top;
  rem.classList.add('dragging');
  rem.setPointerCapture(e.pointerId);
  const move = ev => {
    rem.style.left = Math.max(0, Math.min(innerWidth - rect.width, ev.clientX - ox)) + 'px';
    rem.style.top = Math.max(0, Math.min(innerHeight - rect.height, ev.clientY - oy)) + 'px';
    rem.style.right = 'auto'; rem.style.bottom = 'auto';
  };
  const up = () => { rem.classList.remove('dragging'); rem.removeEventListener('pointermove', move); };
  rem.addEventListener('pointermove', move);
  rem.addEventListener('pointerup', up, { once: true });
});

// touch: swipe the tube to surf, tap for channel OSD
let tY = null, tX = null;
scr.addEventListener('touchstart', e => {
  tY = e.touches[0].clientY; tX = e.touches[0].clientX;
}, { passive: true });
scr.addEventListener('touchend', e => {
  if (tY === null) return;
  const dy = e.changedTouches[0].clientY - tY;
  const dx = e.changedTouches[0].clientX - tX;
  tY = tX = null;
  if (!powered) return;
  if (Math.abs(dy) > 42 && Math.abs(dy) > Math.abs(dx)) step(dy < 0 ? 1 : -1);
  else if (Math.abs(dy) < 8 && Math.abs(dx) < 8 && current) showChOsd(pad(current.num), current.name);
}, { passive: true });

/* ── boot state ── */
applyAudioLevels();
setTitle('JANSSON TV');
})();
