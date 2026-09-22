    /* ============ TV SHOWREEL — static until pressed, guarded play ============ */
    (() => {
      const video = $("#reel-video"), screen = $("#tv-screen"),
            unmute = $("#tv-unmute"), canvas = $("#static-canvas");
      const ctx = canvas.getContext("2d");
      let raf = null, playing = false;

      function drawStatic() {
        const w = canvas.offsetWidth | 0 || 2, h = canvas.offsetHeight | 0 || 2;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        const img = ctx.createImageData(w, h), d = img.data;
        for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255 | 0; d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255; }
        ctx.putImageData(img, 0, 0);
        raf = requestAnimationFrame(drawStatic);
      }
      function stopStatic() { if (raf) cancelAnimationFrame(raf); raf = null; canvas.style.opacity = 0; }
      if (!RM) drawStatic(); else canvas.style.opacity = 0.12;

      // pre-buffer when the TV approaches the viewport
      new IntersectionObserver((e, io) => {
        if (e[0].isIntersecting) { video.preload = "auto"; video.load(); io.disconnect(); }
      }, { rootMargin: "600px" }).observe(video);

      // once running, pause reel + audio whenever the TV leaves the viewport
      new IntersectionObserver(e => {
        if (!playing) return;
        if (e[0].isIntersecting) video.play().catch(() => {});
        else video.pause();
      }, { threshold: 0.15 }).observe(screen);

      function activate() {
        if (playing) { video.muted = !video.muted; return; }
        video.muted = false;
        const p = video.play();
        if (p) p.then(() => { playing = true; stopStatic(); unmute.style.display = "none"; })
               .catch(() => { unmute.textContent = "Tap again ▶"; });
      }
      screen.addEventListener("click", activate);
      screen.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); } });
    })();
