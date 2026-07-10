'use strict';

/* ---------- state ---------- */
const $ = s => document.querySelector(s);
let currentFx = 'thermal';
let sourceFull = null;   // full-resolution source canvas
let sourcePrev = null;   // preview-scale source canvas
const PREVIEW_MAX = 1200;

const view = $('#view'), drop = $('#drop'), meta = $('#meta');

/* ---------- rendering ---------- */
function applyEffect(src, scale){
  const work = makeCanvas(src.width, src.height);
  work.getContext('2d').drawImage(src,0,0);
  const fx = EFFECTS[currentFx];
  const p = {};
  fx.params.forEach(pr => p[pr.key] = pr.value);
  const pal = fx.palettes ? fx.palettes[fx.palette] : null;
  fx.render(work, p, scale, pal);
  return work;
}

let raf = 0;
function render(){
  if(!sourcePrev) return;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    const out = applyEffect(sourcePrev, 1);
    view.width = out.width; view.height = out.height;
    view.getContext('2d').drawImage(out,0,0);
  });
}

function setImage(bitmap){
  const W = bitmap.width, H = bitmap.height;
  sourceFull = makeCanvas(W,H);
  sourceFull.getContext('2d').drawImage(bitmap,0,0);
  const k = Math.min(1, PREVIEW_MAX/Math.max(W,H));
  sourcePrev = makeCanvas(Math.round(W*k), Math.round(H*k));
  sourcePrev.getContext('2d').drawImage(bitmap,0,0,sourcePrev.width,sourcePrev.height);
  drop.hidden = true;
  view.hidden = false;
  $('#dlBtn').disabled = false;
  meta.textContent = `${W}×${H}px · preview ${sourcePrev.width}×${sourcePrev.height}`;
  render();
}

async function loadFile(file){
  if(!file || !file.type.startsWith('image/')) return;
  try{
    const bmp = await createImageBitmap(file, {imageOrientation:'from-image'});
    setImage(bmp);
  }catch(e){
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { setImage(img); URL.revokeObjectURL(url); };
    img.src = url;
  }
}

/* ---------- demo image (procedural skull-ish study) ---------- */
function demoImage(){
  const c = makeCanvas(900,1200), x = c.getContext('2d');
  x.fillStyle = '#0e0e16'; x.fillRect(0,0,900,1200);
  let g = x.createRadialGradient(450,510,60, 450,530,430);
  g.addColorStop(0,'#ece5d8'); g.addColorStop(0.5,'#8a857c');
  g.addColorStop(0.82,'#3a3830'); g.addColorStop(1,'#0e0e16');
  x.fillStyle = g;
  x.beginPath(); x.ellipse(450,540,305,385,0,0,7); x.fill();
  x.fillStyle = 'rgba(8,8,14,0.88)';
  x.beginPath(); x.ellipse(338,478,72,48,-0.18,0,7); x.fill();
  x.beginPath(); x.ellipse(562,478,72,48,0.18,0,7); x.fill();
  x.beginPath(); x.moveTo(450,555); x.lineTo(412,655); x.lineTo(488,655); x.closePath(); x.fill();
  for(let i=0;i<6;i++){
    x.fillStyle = '#d6cfc0';
    x.fillRect(332+i*40, 718, 28, 92);
  }
  x.fillStyle = 'rgba(8,8,14,0.62)'; x.fillRect(315,704,275,15);
  x.fillStyle = 'rgba(240,240,255,0.07)';
  const rnd = mulberry32(42);
  for(let i=0;i<50;i++) x.fillRect(rnd()*900, rnd()*1200, rnd()*200, 2);
  return c;
}

/* ---------- UI construction ---------- */
function buildChips(){
  const wrap = $('#fxChips');
  wrap.innerHTML = '';
  Object.entries(EFFECTS).forEach(([id,fx]) => {
    const b = document.createElement('button');
    b.className = 'chip' + (id===currentFx ? ' on' : '');
    b.textContent = fx.label;
    b.type = 'button';
    b.onclick = () => { currentFx = id; buildChips(); buildPalettes(); buildSliders(); render(); };
    wrap.appendChild(b);
  });
}

function buildPalettes(){
  const fx = EFFECTS[currentFx];
  const group = $('#paletteGroup'), wrap = $('#swatches');
  if(!fx.palettes){ group.hidden = true; return; }
  group.hidden = false;
  wrap.innerHTML = '';
  Object.entries(fx.palettes).forEach(([name,val]) => {
    const b = document.createElement('button');
    b.className = 'swatch' + (name===fx.palette ? ' on' : '');
    b.type = 'button';
    b.title = name;
    b.setAttribute('aria-label', name);
    const cssStops = Array.isArray(val[0])
      ? val.map(([p,h]) => `${h} ${p*100}%`).join(',')
      : `${val[0]} 0%,${val[1]} 100%`;
    b.style.background = `linear-gradient(90deg,${cssStops})`;
    b.onclick = () => { fx.palette = name; buildPalettes(); render(); };
    wrap.appendChild(b);
  });
}

function buildSliders(){
  const fx = EFFECTS[currentFx];
  const wrap = $('#sliderGroup');
  wrap.innerHTML = '<label>Dials</label>';
  fx.params.forEach(pr => {
    const el = document.createElement('div');
    el.className = 'slider';
    el.innerHTML = `<div class="row"><span class="name">${pr.name}</span><span class="val"></span></div>`;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = pr.min; input.max = pr.max; input.step = pr.step; input.value = pr.value;
    const val = el.querySelector('.val');
    const show = () => val.textContent = pr.step < 1 ? Number(pr.value).toFixed(2) : pr.value;
    show();
    input.oninput = () => { pr.value = Number(input.value); show(); render(); };
    el.appendChild(input);
    wrap.appendChild(el);
  });
}

/* ---------- events ---------- */
$('#file').onchange = e => loadFile(e.target.files[0]);
drop.onclick = () => $('#file').click();
drop.onkeydown = e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); $('#file').click(); } };
$('#demoBtn').onclick = e => { e.stopPropagation(); setImage(demoImage()); };
$('#newBtn').onclick = () => $('#file').click();

['dragover','dragenter'].forEach(ev => document.addEventListener(ev, e => {
  e.preventDefault(); drop.classList.add('over');
}));
['dragleave','drop'].forEach(ev => document.addEventListener(ev, e => {
  e.preventDefault(); drop.classList.remove('over');
}));
document.addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));
document.addEventListener('paste', e => {
  const item = [...(e.clipboardData?.items||[])].find(i => i.type.startsWith('image/'));
  if(item) loadFile(item.getAsFile());
});

/* hold to compare with original */
view.addEventListener('pointerdown', () => {
  if(sourcePrev) view.getContext('2d').drawImage(sourcePrev,0,0);
});
['pointerup','pointerleave'].forEach(ev => view.addEventListener(ev, render));

/* full-res export */
$('#dlBtn').onclick = () => {
  if(!sourceFull) return;
  const btn = $('#dlBtn');
  btn.disabled = true; btn.textContent = 'Rendering…';
  setTimeout(() => {
    const scale = sourceFull.width / sourcePrev.width;
    const out = applyEffect(sourceFull, scale);
    out.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `fxlab-${currentFx}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      btn.disabled = false; btn.textContent = 'Download full-res PNG';
    }, 'image/png');
  }, 30);
};

buildChips(); buildPalettes(); buildSliders();
