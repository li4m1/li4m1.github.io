/* ═══ PORTFOLIO ═════════════════════════════════════════════════════
   Video sections (short form + AI) and static posts.
   Reads CLIPS/FILTERS from clips.js, AI_CLIPS/AI_FILTERS from ai.js,
   POSTS/POST_FILTERS from posts.js.
   No dependencies, no build step, nothing leaves the domain.
═══════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Media lives under /portfolio. The homepage embeds these same sections
  // from the site root, so it sets window.PORTFOLIO_BASE = "portfolio/".
  const BASE = window.PORTFOLIO_BASE || "";

  /* ── shared player ────────────────────────────────────────────────
     One viewer element serves every video section. A section hands it
     its own filtered list, so prev/next never walks out of the grid
     the visitor actually clicked. ── */
  const Viewer = (() => {
    const el     = $("viewer");
    const video  = $("vVideo");
    const frame  = document.querySelector(".v-frame");
    const title  = $("vTitle");
    const sub    = $("vSub");
    const pos    = $("vPos");
    const ticks  = $("vTicks");
    const sound  = $("vSound");
    const prev   = $("vPrev");
    const next   = $("vNext");

    let list = [];
    let base = "media";
    let i = -1;
    let wantSound = false;
    let lastFocus = null;
    const listeners = [];

    const src    = (c) => `${BASE}${base}/${c.slug}.mp4`;
    const poster = (c) => `${BASE}${base}/posters/${c.slug}.jpg`;

    function buildTicks() {
      ticks.innerHTML = "";
      list.forEach(() => {
        const t = document.createElement("span");
        t.className = "v-tick";
        t.innerHTML = "<i></i>";
        ticks.appendChild(t);
      });
    }

    function paintTicks() {
      [...ticks.children].forEach((t, n) => {
        t.classList.toggle("done", n < i);
        if (n !== i) t.querySelector("i").style.width = n < i ? "100%" : "0";
      });
    }

    function load(n) {
      const c = list[n];
      if (!c) return;
      i = n;

      video.src = src(c);
      video.poster = poster(c);
      video.muted = !wantSound;
      video.loop = list.length === 1;   // a lone clip loops; a set advances
      video.play().catch(() => {});

      frame.style.setProperty("--ar", c.ar || "9/16");
      title.textContent = c.title;
      sub.textContent = [c.client, c.platform, c.year, c.dur].filter(Boolean).join(" · ");
      pos.textContent = `${n + 1} / ${list.length}`;
      frame.classList.remove("paused");

      prev.disabled = n === 0;
      next.disabled = n === list.length - 1;
      paintTicks();
      syncSound();
    }

    function open(theList, theBase, n) {
      list = theList; base = theBase;
      if (n < 0 || n >= list.length) return;
      lastFocus = document.activeElement;
      el.hidden = false;
      document.body.classList.add("locked");
      requestAnimationFrame(() => el.classList.add("open"));
      buildTicks();
      load(n);
      $("vClose").focus();
    }

    function close() {
      el.classList.remove("open");
      video.pause();
      const done = () => {
        el.hidden = true;
        video.removeAttribute("src");
        video.load();
      };
      reduce ? done() : setTimeout(done, 280);
      document.body.classList.remove("locked");
      i = -1;
      if (lastFocus) lastFocus.focus();
    }

    const step = (d) => {
      const n = i + d;
      if (n >= 0 && n < list.length) load(n);
    };

    function syncSound() {
      const on = !video.muted;
      sound.textContent = on ? "Sound on" : "Sound off";
      sound.setAttribute("aria-pressed", String(on));
      listeners.forEach((fn) => fn(wantSound));
    }

    function toggleSound() {
      wantSound = !wantSound;
      video.muted = !wantSound;
      if (wantSound) video.play().catch(() => {});
      syncSound();
    }

    sound.addEventListener("click", toggleSound);
    $("vClose").addEventListener("click", close);
    prev.addEventListener("click", () => step(-1));
    next.addEventListener("click", () => step(1));

    $("vTap").addEventListener("click", () => {
      if (video.paused) { video.play().catch(() => {}); frame.classList.remove("paused"); }
      else { video.pause(); frame.classList.add("paused"); }
    });

    video.addEventListener("timeupdate", () => {
      const t = ticks.children[i];
      if (!t || !video.duration) return;
      t.querySelector("i").style.width = `${(video.currentTime / video.duration) * 100}%`;
    });

    video.addEventListener("ended", () => {
      if (i < list.length - 1) step(1);
      else frame.classList.add("paused");
    });

    el.addEventListener("click", (e) => { if (e.target === el) close(); });

    document.addEventListener("keydown", (e) => {
      if (el.hidden) return;
      switch (e.key) {
        case "Escape":     close(); break;
        case "ArrowDown":
        case "ArrowRight": e.preventDefault(); step(1); break;
        case "ArrowUp":
        case "ArrowLeft":  e.preventDefault(); step(-1); break;
        case "m": case "M": toggleSound(); break;
        case " ": e.preventDefault(); $("vTap").click(); break;
      }
    });

    let sy = 0, sx = 0;
    el.addEventListener("touchstart", (e) => {
      sy = e.changedTouches[0].clientY;
      sx = e.changedTouches[0].clientX;
    }, { passive: true });

    el.addEventListener("touchend", (e) => {
      const dy = e.changedTouches[0].clientY - sy;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dy) < 55 || Math.abs(dy) < Math.abs(dx)) return;
      step(dy < 0 ? 1 : -1);
    }, { passive: true });

    el.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const f = [...el.querySelectorAll("button:not(:disabled)")];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    return {
      open,
      onSound: (fn) => { listeners.push(fn); fn(wantSound); },
      setSound: (v) => { wantSound = v; video.muted = !v; syncSound(); },
      getSound: () => wantSound,
    };
  })();

  /* ── a video grid ─────────────────────────────────────────────────
     Used twice: short form and AI. Same markup, different data and
     media folder. ── */
  function makeVideoSection(cfg) {
    const grid     = $(cfg.grid);
    const filterEl = $(cfg.filterRow);
    const emptyMsg = $(cfg.empty);
    if (!grid || !cfg.data) return;

    const src    = (c) => `${BASE}${cfg.base}/${c.slug}.mp4`;
    const poster = (c) => `${BASE}${cfg.base}/posters/${c.slug}.jpg`;

    // nothing ingested yet: reserved slots, same language as the main site
    if (cfg.data.length === 0) {
      if (filterEl) {
        const controls = filterEl.closest(".controls");
        if (controls) controls.hidden = true;
      }
      if (cfg.slots === 0) { grid.hidden = true; return; }
      for (let n = 0; n < (cfg.slots || 6); n++) {
        const el = document.createElement("div");
        el.className = "reel slot-empty in";
        el.setAttribute("aria-label", "Reserved slot for upcoming work");
        el.innerHTML = `<div class="slot-tag"><b>SOON</b><span>reserved</span></div>`;
        grid.appendChild(el);
      }
      return;
    }

    let visible = cfg.data.slice();
    let onFilter = null;   // set by the collapse block below, if enabled

    const used = new Set(cfg.data.map((c) => c.cat));
    // One category means the pills would read "All / <that one>" — no
    // choice to make, so drop the row rather than show decoration.
    if (used.size <= 1 && filterEl && filterEl.closest(".controls")) {
      filterEl.closest(".controls").hidden = true;
    }

    Object.entries(cfg.filters).forEach(([key, label]) => {
      if (key !== "all" && !used.has(key)) return;
      const b = document.createElement("button");
      b.className = "filter-pill" + (key === "all" ? " active" : "");
      b.dataset.filter = key;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", key === "all" ? "true" : "false");
      b.textContent = label;
      b.addEventListener("click", () => applyFilter(key));
      filterEl.appendChild(b);
    });

    function applyFilter(key) {
      filterEl.querySelectorAll(".filter-pill").forEach((p) => {
        const on = p.dataset.filter === key;
        p.classList.toggle("active", on);
        p.setAttribute("aria-selected", String(on));
      });
      visible = cfg.data.filter((c) => key === "all" || c.cat === key);
      grid.querySelectorAll(".reel").forEach((el) => {
        el.classList.toggle("hidden", !(key === "all" || el.dataset.cat === key));
      });
      if (emptyMsg) emptyMsg.hidden = visible.length > 0;
      if (onFilter) onFilter();
    }

    cfg.data.forEach((c, idx) => {
      const el = document.createElement("button");
      el.className = "reel";
      el.type = "button";
      el.dataset.cat = c.cat;
      el.setAttribute("aria-label", `Play ${c.title}`);
      el.innerHTML = `
        <div class="reel-media">
          <img src="${poster(c)}" alt="" loading="lazy" decoding="async">
          <video src="${src(c)}" muted loop playsinline preload="none" aria-hidden="true"></video>
        </div>
        <span class="reel-badge">${c.dur}</span>
        <span class="reel-play" aria-hidden="true">▶</span>
        <div class="reel-body">
          <span class="reel-title">${c.title}</span>
          <span class="reel-sub">${[c.client || c.platform, c.year].filter(Boolean).join(" · ")}</span>
        </div>`;

      const vid = el.querySelector("video");

      // Hover/focus preview: load on demand so the page costs only posters
      // until the visitor actually shows interest in a clip.
      const preview = () => {
        if (reduce) return;
        if (!vid.dataset.armed) { vid.load(); vid.dataset.armed = "1"; }
        vid.play().then(() => el.classList.add("playing")).catch(() => {});
      };
      const stop = () => {
        el.classList.remove("playing");
        vid.pause();
        try { vid.currentTime = 0; } catch (_) {}
      };
      el.addEventListener("pointerenter", preview);
      el.addEventListener("pointerleave", stop);
      el.addEventListener("focus", preview);
      el.addEventListener("blur", stop);
      // The viewer walks the filtered set, so translate the index across.
      el.addEventListener("click", () => Viewer.open(visible, cfg.base, visible.indexOf(c)));

      grid.appendChild(el);
    });

    const cards = [...grid.querySelectorAll(".reel")];
    if (reduce || !("IntersectionObserver" in window)) {
      cards.forEach((c) => c.classList.add("in"));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          el.style.transitionDelay = `${(cards.indexOf(el) % 5) * 45}ms`;
          el.classList.add("in");
          io.unobserve(el);
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      cards.forEach((c) => io.observe(c));
    }

    /* ── collapse: two rows plus a sliver of the third ── */
    if (cfg.collapse) {
      const ROWS = 2;
      const PEEK = 0.34;          // how much of row three shows through

      const box = document.createElement("div");
      box.className = "grid-collapse";
      grid.parentNode.insertBefore(box, grid);
      box.appendChild(grid);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "grid-more mono";
      btn.setAttribute("aria-controls", cfg.grid);
      box.parentNode.insertBefore(btn, box.nextSibling);

      let expanded = false;

      const columns = () => {
        const t = getComputedStyle(grid).gridTemplateColumns;
        return t && t !== "none" ? t.split(" ").filter(Boolean).length : 1;
      };

      function measure() {
        const shown = cards.filter((c) => !c.classList.contains("hidden"));
        if (!shown.length) return { rows: 0, max: 0, hidden: 0 };
        const cols = Math.max(1, columns());
        const rows = Math.ceil(shown.length / cols);
        const gap  = parseFloat(getComputedStyle(grid).rowGap) || 0;
        const cardH = shown[0].getBoundingClientRect().height;
        const max = ROWS * cardH + ROWS * gap + PEEK * cardH;
        return { rows, max, hidden: Math.max(0, shown.length - ROWS * cols) };
      }

      function paint() {
        const { rows, max, hidden } = measure();
        // nothing worth hiding: drop the whole affordance
        if (rows <= ROWS) {
          box.style.maxHeight = "";
          box.classList.add("expanded");
          btn.hidden = true;
          return;
        }
        btn.hidden = false;
        if (expanded) {
          box.classList.add("expanded");
          box.style.maxHeight = "";
          btn.innerHTML = '<span class="chev" aria-hidden="true">▲</span> Show less';
        } else {
          box.classList.remove("expanded");
          box.style.maxHeight = `${Math.round(max)}px`;
          btn.innerHTML = `<span class="chev" aria-hidden="true">▼</span> Show all ${hidden} more`;
        }
        btn.setAttribute("aria-expanded", String(expanded));
      }

      btn.addEventListener("click", () => {
        expanded = !expanded;
        // clipped cards never intersected, so reveal them on expand
        if (expanded) cards.forEach((c) => c.classList.add("in"));
        paint();
        if (!expanded) box.scrollIntoView({ block: "nearest" });
      });

      onFilter = paint;              // recount when the filter changes
      requestAnimationFrame(paint);
      // posters load late and change the card height
      window.addEventListener("load", paint);
      let t = null;
      window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(paint, 150); });
    }
  }

  /* ── header stats ─────────────────────────────────────────────── */
  const toSecs = (d) => {
    const [m, s] = String(d || "0:00").split(":").map(Number);
    return (m || 0) * 60 + (s || 0);
  };
  const allVid = [].concat(
    typeof CLIPS !== "undefined" ? CLIPS : [],
    typeof AI_CLIPS !== "undefined" ? AI_CLIPS : []
  );
  const total = allVid.reduce((n, c) => n + toSecs(c.dur), 0);
  // These live in the portfolio masthead; the homepage has no such row.
  const put = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  put("stat-count", typeof CLIPS !== "undefined" ? CLIPS.length : 0);
  put("stat-ai",    typeof AI_CLIPS !== "undefined" ? AI_CLIPS.length : 0);
  put("stat-posts", typeof POSTS !== "undefined" ? POSTS.length : 0);
  put("stat-mins",  `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`);
  put("yr", new Date().getFullYear());

  /* ── build the sections ───────────────────────────────────────── */
  if (typeof CLIPS !== "undefined") {
    makeVideoSection({
      data: CLIPS, filters: FILTERS, base: "media",
      grid: "reelGrid", filterRow: "filters", empty: "empty", slots: 6,
      collapse: true,
    });
  }
  if (typeof AI_CLIPS !== "undefined") {
    makeVideoSection({
      data: AI_CLIPS, filters: AI_FILTERS, base: "media/ai",
      grid: "aiGrid", filterRow: "aiFilters", empty: "aiEmpty",
      // Reserved slots only while the whole AI section is empty; once the
      // stills grid has work, placeholders above it just look unfinished.
      slots: (typeof AI_POSTS !== "undefined" && AI_POSTS.length) ? 0 : 4,
    });
  }

  /* sticky sound preference, mirrored on the grid button */
  const soundPref = $("soundPref");
  if (soundPref) {
    Viewer.onSound((on) => {
      soundPref.setAttribute("aria-pressed", String(on));
      $("soundPrefTxt").textContent = on ? "Sound on" : "Sound off";
    });
    soundPref.addEventListener("click", () => Viewer.setSound(!Viewer.getSound()));
  }
})();

/* ═══ STATIC POSTS ══════════════════════════════════════════════════
   Grid + lightbox for stills and carousels. Reads POSTS / POST_FILTERS
   from posts.js. Kept as its own module so the player above is
   untouched; the two only share the body scroll lock.
═══════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const lb       = $("lightbox");
  const lbImg    = $("lbImg");
  const lbVideo  = $("lbVideo");
  const lbSound  = $("lbSound");
  const lbTitle  = $("lbTitle");
  const lbSub    = $("lbSub");
  const lbDots   = $("lbDots");
  const lbFrame  = document.querySelector(".lb-frame");
  const lbPrev   = $("lbPrev");
  const lbNext   = $("lbNext");

  // A slide is a still or a video; posts.js records which per position.
  const pad   = (n) => String(n).padStart(2, "0");
  const kind  = (p, n) => (p.slides ? p.slides[n - 1] : "img") || "img";
  const B     = window.PORTFOLIO_BASE || "";
  const still = (p, n) => `${B}media/posts/${p.slug}-${pad(n)}.jpg`;
  const movie = (p, n) => `${B}media/posts/${p.slug}-${pad(n)}.mp4`;
  const count = (p) => (p.slides ? p.slides.length : (p.imgs || 1));
  const thumb = (p) => `${B}media/posts/thumbs/${p.slug}.jpg`;


  function makePostSection(cfg) {
  const grid     = $(cfg.grid);
  const filterEl = $(cfg.filterRow);
  const emptyMsg = $(cfg.empty);
  if (!grid || !cfg.data) return;
  const POSTS = cfg.data;
  const POST_FILTERS = cfg.filters;

  /* ── nothing ingested yet: reserved slots, and drop the filter row ── */
  if (POSTS.length === 0) {
    if (cfg.slots === 0) { grid.hidden = true;
      if (filterEl && filterEl.closest(".controls")) filterEl.closest(".controls").hidden = true;
      return; }
    if (filterEl && filterEl.closest(".controls")) filterEl.closest(".controls").hidden = true;
    for (let i = 0; i < (cfg.slots || 6); i++) {
      const el = document.createElement("div");
      el.className = "post slot-empty in";
      el.setAttribute("aria-label", "Reserved slot for an upcoming post");
      el.innerHTML = `<div class="post-thumb"><div class="slot-tag"><b>SOON</b><span>reserved</span></div></div>`;
      grid.appendChild(el);
    }
    return;
  }

  let active  = "all";
  let visible = POSTS.slice();

  /* ── filters ──────────────────────────────────────────────────── */
  const used = new Set(POSTS.map((p) => p.cat));
  if (used.size <= 1 && filterEl && filterEl.closest(".controls")) {
    filterEl.closest(".controls").hidden = true;
  }
  Object.entries(POST_FILTERS).forEach(([key, label]) => {
    if (key !== "all" && !used.has(key)) return;
    const b = document.createElement("button");
    b.className = "filter-pill" + (key === "all" ? " active" : "");
    b.dataset.filter = key;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", key === "all" ? "true" : "false");
    b.textContent = label;
    b.addEventListener("click", () => applyFilter(key));
    filterEl.appendChild(b);
  });

  function applyFilter(key) {
    active = key;
    filterEl.querySelectorAll(".filter-pill").forEach((p) => {
      const on = p.dataset.filter === key;
      p.classList.toggle("active", on);
      p.setAttribute("aria-selected", String(on));
    });
    visible = POSTS.filter((p) => key === "all" || p.cat === key);
    grid.querySelectorAll(".post").forEach((el) => {
      el.classList.toggle("hidden", !(key === "all" || el.dataset.cat === key));
    });
    emptyMsg.hidden = visible.length > 0;
  }

  /* ── grid ─────────────────────────────────────────────────────── */
  POSTS.forEach((p, i) => {
    const el = document.createElement("button");
    el.className = "post";
    el.type = "button";
    el.dataset.cat = p.cat;
    el.dataset.i = i;
    el.setAttribute("aria-label", `Open ${p.title}`);
    el.innerHTML = `
      <div class="post-thumb">
        <img src="${thumb(p)}" alt="" loading="lazy" decoding="async">
        ${count(p) > 1 ? `<span class="post-stack">▣ ${count(p)}${
          (p.slides || []).includes("video") ? '<span class="pv">▶</span>' : ""}</span>` : ""}
      </div>
      <div class="post-body">
        <span class="post-title">${p.title}</span>
        <span class="post-sub">${[p.client || p.platform, p.year].filter(Boolean).join(" · ")}</span>
      </div>`;
    el.addEventListener("click", () => open(visible, p, 1));
    grid.appendChild(el);
  });

  const cards = [...grid.querySelectorAll(".post")];
  if (reduce || !("IntersectionObserver" in window)) {
    cards.forEach((c) => c.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.style.transitionDelay = `${(cards.indexOf(el) % 5) * 45}ms`;
        el.classList.add("in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    cards.forEach((c) => io.observe(c));
  }

  }   /* ── end makePostSection ── */

  /* ── shared lightbox ──────────────────────────────────────────────
     One lightbox serves every post grid. The calling section hands it
     its own filtered list, so arrows never walk out of that grid. ── */
  let flat    = [];   // every frame of every visible post, in order
  let at      = -1;
  let wantSound = false;   // sticky across video slides
  let lastFocus = null;

  function rebuild(list) {
    flat = [];
    list.forEach((p) => {
      for (let n = 1; n <= count(p); n++) flat.push({ post: p, n });
    });
  }

  function show(i) {
    const f = flat[i];
    if (!f) return;
    at = i;
    const p = f.post;
    const isVid = kind(p, f.n) === "video";
    lbFrame.style.setProperty("--ar", p.ar || "1/1");

    lbVideo.pause();
    if (isVid) {
      lbVideo.src = movie(p, f.n);
      lbVideo.poster = still(p, f.n);
      lbVideo.muted = !wantSound;
      lbVideo.hidden = false;
      lbImg.hidden = true;
      lbImg.removeAttribute("src");
      lbVideo.play().catch(() => {});
      lbSound.hidden = false;
    } else {
      lbVideo.hidden = true;
      lbVideo.removeAttribute("src");
      lbImg.src = still(p, f.n);
      lbImg.hidden = false;
      lbSound.hidden = true;
    }
    syncLbSound();

    const total = count(p);
    lbImg.alt = total > 1 ? `${p.title}, slide ${f.n} of ${total}` : p.title;
    lbTitle.textContent = p.title;
    lbSub.textContent = [p.client, p.platform, p.year,
      total > 1 ? `${f.n}/${total}` : ""].filter(Boolean).join(" · ");

    lbDots.innerHTML = "";
    if (total > 1) {
      for (let n = 1; n <= total; n++) {
        const d = document.createElement("i");
        let cls = kind(p, n) === "video" ? "vid" : "";
        if (n === f.n) cls += " on";
        d.className = cls.trim();
        lbDots.appendChild(d);
      }
    }
    lbPrev.disabled = i === 0;
    lbNext.disabled = i === flat.length - 1;
  }

  function syncLbSound() {
    lbSound.textContent = wantSound ? "Sound on" : "Sound off";
    lbSound.setAttribute("aria-pressed", String(wantSound));
  }

  lbSound.addEventListener("click", (e) => {
    e.stopPropagation();
    wantSound = !wantSound;
    lbVideo.muted = !wantSound;
    if (wantSound) lbVideo.play().catch(() => {});
    syncLbSound();
  });

  function open(list, post, n) {
    rebuild(list);
    const i = flat.findIndex((f) => f.post === post && f.n === n);
    if (i === -1) return;
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.classList.add("locked");
    requestAnimationFrame(() => lb.classList.add("open"));
    show(i);
    $("lbClose").focus();
  }

  function close() {
    lb.classList.remove("open");
    lbVideo.pause();
    const done = () => {
      lb.hidden = true;
      lbImg.removeAttribute("src");
      lbVideo.removeAttribute("src");
      lbVideo.load();
    };
    reduce ? done() : setTimeout(done, 280);
    document.body.classList.remove("locked");
    at = -1;
    if (lastFocus) lastFocus.focus();
  }

  const step = (d) => { const i = at + d; if (i >= 0 && i < flat.length) show(i); };

  $("lbClose").addEventListener("click", close);
  lbPrev.addEventListener("click", () => step(-1));
  lbNext.addEventListener("click", () => step(1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });

  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    switch (e.key) {
      case "Escape":     close(); break;
      case "ArrowRight":
      case "ArrowDown":  e.preventDefault(); step(1); break;
      case "ArrowLeft":
      case "ArrowUp":    e.preventDefault(); step(-1); break;
    }
  });

  let sx = 0;
  lb.addEventListener("touchstart", (e) => { sx = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) < 55) return;
    step(dx < 0 ? 1 : -1);
  }, { passive: true });

  lb.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = [...lb.querySelectorAll("button:not(:disabled)")];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ── build the post grids ─────────────────────────────────────── */
  if (typeof POSTS !== "undefined") {
    makePostSection({
      data: POSTS, filters: POST_FILTERS,
      grid: "postGrid", filterRow: "postFilters", empty: "postEmpty", slots: 6,
    });
  }
  // Stills that belong with the AI work rather than the social feed.
  // slots: 0 — this grid stays hidden when there is nothing in it, so the
  // AI section does not show two rows of placeholders.
  if (typeof AI_POSTS !== "undefined") {
    makePostSection({
      data: AI_POSTS, filters: (typeof AI_POST_FILTERS !== "undefined" ? AI_POST_FILTERS : { all: "All" }),
      grid: "aiPostGrid", filterRow: "aiPostFilters", empty: "aiPostEmpty", slots: 0,
    });
  }
})();
