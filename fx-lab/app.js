'use strict';

/* ---------- state ---------- */
const $ = s => document.querySelector(s);
let currentFx = 'thermal';
let images = [];   // {full, prev, thumb, W, H}
let cur = -1;      // index of active image
const PREVIEW_MAX = 1200;

const view = $('#view'), drop = $('#drop'), meta = $('#meta');
const filmstrip = $('#filmstrip'), thumbs = $('#thumbs');

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
  if(cur < 0) return;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    const out = applyEffect(images[cur].prev, 1);
    view.width = out.width; view.height = out.height;
    view.getContext('2d').drawImage(out,0,0);
  });
}

/* ---------- image management ---------- */
function addImage(bitmap){
  const W = bitmap.width, H = bitmap.height;
  const full = makeCanvas(W,H);
  full.getContext('2d').drawImage(bitmap,0,0);
  const k = Math.min(1, PREVIEW_MAX/Math.max(W,H));
  const prev = makeCanvas(Math.round(W*k), Math.round(H*k));
  prev.getContext('2d').drawImage(bitmap,0,0,prev.width,prev.height);
  // square center-crop thumbnail
  const T = 112, thumb = makeCanvas(T,T);
  const s = Math.min(W,H);
  thumb.getContext('2d').drawImage(full,(W-s)/2,(H-s)/2,s,s,0,0,T,T);
  images.push({full, prev, thumb, W, H});
  select(images.length-1);
}

function select(i){
  cur = i;
  const img = images[cur];
  drop.hidden = true;
  view.hidden = false;
  filmstrip.hidden = false;
  $('#dlBtn').disabled = false;
  meta.textContent = `${img.W}×${img.H}px · preview ${img.prev.width}×${img.prev.height}`;
  buildThumbs();
  render();
}

function buildThumbs(){
  thumbs.innerHTML = '';
  images.forEach((img,i) => {
    const b = document.createElement('button');
    b.className = 'thumb' + (i===cur ? ' on' : '');
    b.type = 'button';
    b.setAttribute('aria-label', `Picture ${i+1}${i===cur?' (active)':''}`);
    b.appendChild(img.thumb);
    b.onclick = () => { if(i !== cur) select(i); };
    thumbs.appendChild(b);
  });
}

async function loadFiles(fileList){
  for(const file of [...(fileList||[])]){
    if(!file || !file.type.startsWith('image/')) continue;
    try{
      const bmp = await createImageBitmap(file, {imageOrientation:'from-image'});
      addImage(bmp);
    }catch(e){
      await new Promise(res => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { addImage(img); URL.revokeObjectURL(url); res(); };
        img.onerror = res;
        img.src = url;
      });
    }
  }
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
  const s = document.createElement('button');
  s.className = 'chip surprise';
  s.textContent = 'Surprise me';
  s.type = 'button';
  s.onclick = surprise;
  wrap.appendChild(s);
}

function surprise(){
  const ids = Object.keys(EFFECTS);
  currentFx = ids[(Math.random()*ids.length)|0];
  const fx = EFFECTS[currentFx];
  if(fx.palettes){
    const names = Object.keys(fx.palettes);
    fx.palette = names[(Math.random()*names.length)|0];
  }
  fx.params.forEach(pr => {
    const steps = Math.round((pr.max - pr.min) / pr.step);
    pr.value = +(pr.min + ((Math.random()*(steps+1))|0) * pr.step).toFixed(2);
  });
  buildChips(); buildPalettes(); buildSliders(); render();
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
$('#file').onchange = e => { loadFiles(e.target.files); e.target.value = ''; };
drop.onclick = () => $('#file').click();
drop.onkeydown = e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); $('#file').click(); } };
$('#addBtn').onclick = () => $('#file').click();

['dragover','dragenter'].forEach(ev => document.addEventListener(ev, e => {
  e.preventDefault(); drop.classList.add('over');
}));
['dragleave','drop'].forEach(ev => document.addEventListener(ev, e => {
  e.preventDefault(); drop.classList.remove('over');
}));
document.addEventListener('drop', e => loadFiles(e.dataTransfer.files));
document.addEventListener('paste', e => {
  const items = [...(e.clipboardData?.items||[])].filter(i => i.type.startsWith('image/'));
  if(items.length) loadFiles(items.map(i => i.getAsFile()));
});

/* hold to compare with original */
view.addEventListener('pointerdown', () => {
  if(cur >= 0) view.getContext('2d').drawImage(images[cur].prev,0,0);
});
['pointerup','pointerleave'].forEach(ev => view.addEventListener(ev, render));

/* full-res export: native share sheet on touch devices (one-tap "Save
   Image" on iOS/Android instead of the blob opening in a new tab),
   classic download link on desktop */
$('#dlBtn').onclick = async () => {
  if(cur < 0) return;
  const btn = $('#dlBtn');
  btn.disabled = true; btn.textContent = 'Rendering…';
  await new Promise(r => requestAnimationFrame(r));
  try{
    const img = images[cur];
    const scale = img.full.width / img.prev.width;
    const out = applyEffect(img.full, scale);
    const blob = await new Promise(r => out.toBlob(r, 'image/png'));
    const name = `fxlab-${currentFx}-${Date.now()}.png`;
    const file = new File([blob], name, {type:'image/png'});
    const touch = matchMedia('(pointer: coarse)').matches;
    if(touch && navigator.canShare && navigator.canShare({files:[file]})){
      try{
        await navigator.share({files:[file]});
        return;
      }catch(e){
        if(e.name === 'AbortError') return;  // user closed the sheet
        // NotAllowedError etc. → fall back to download link below
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }finally{
    btn.disabled = false; btn.textContent = 'Download full-res PNG';
  }
};

buildChips(); buildPalettes(); buildSliders();
