/* Пространство: параллакс коллажа, drag-лента с инерцией и табами, FLIP-лайтбокс. */
(function () {
  'use strict';
  var M = window.KLEO_M = window.KLEO_M || {};
  var K = window.KLEO;

  var tab = 'interior';
  var strip, track, lb, lbImg, lbCap, lbCount, lbFig, lenis = null;
  var current = [], index = 0, opener = null, openThumb = null;

  function itemsFor(cat) { return K.gallery.filter(function (g) { return g[0] === cat; }); }

  function renderStrip() {
    var esc = window.KLEO_UI.esc;
    current = itemsFor(tab);
    track.innerHTML = current.map(function (g, i) {
      return '<li class="strip-item"><button type="button" data-i="' + i + '" aria-label="Открыть фото: ' + esc(g[6]) + '">' +
        '<img src="assets/img/' + g[1] + '-t.webp" width="' + g[4] + '" height="' + g[5] + '" alt="' + esc(g[6]) + '" loading="lazy" decoding="async" draggable="false">' +
        '</button></li>';
    }).join('');
  }

  function switchTab(cat, btn) {
    if (cat === tab) return;
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) { t.setAttribute('aria-selected', String(t === btn)); });
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var swap = function () {
      tab = cat; renderStrip(); strip.scrollLeft = 0;
      if (reduce || !window.gsap) return;
      window.gsap.fromTo(track.children, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .7, ease: 'expo.out', stagger: .05 });
    };
    if (reduce || !window.gsap) return swap();
    window.gsap.to(track.children, { opacity: 0, y: -10, duration: .25, stagger: .02, onComplete: swap });
  }

  /* ---------- drag с инерцией (мышь); тач и тачпад — нативный скролл ---------- */
  function initDrag() {
    var down = false, moved = 0, startX = 0, startL = 0, lastX = 0, lastT = 0, v = 0, raf = 0;
    strip.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      e.preventDefault();
      cancelAnimationFrame(raf);
      down = true; moved = 0; startX = lastX = e.clientX; startL = strip.scrollLeft; lastT = performance.now(); v = 0;
      strip.classList.add('is-drag');
    });
    // слушаем окно и не захватываем указатель: иначе клики по кадрам перестают доходить
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      strip.scrollLeft = startL - dx;
      var t = performance.now(), dt = Math.max(1, t - lastT);
      v = v * .6 + ((lastX - e.clientX) / dt) * .4;
      lastX = e.clientX; lastT = t;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false; strip.classList.remove('is-drag');
      var vel = v * 16;
      (function glide() {
        if (Math.abs(vel) < .4) return;
        strip.scrollLeft += vel; vel *= .94;
        raf = requestAnimationFrame(glide);
      })();
    });
    strip.addEventListener('dragstart', function (e) { e.preventDefault(); });
    strip.addEventListener('click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; return; }
      var b = e.target.closest('button[data-i]');
      if (b) open(+b.getAttribute('data-i'), b);
    }, true);
    // колесо по вертикали над лентой оставляем странице; горизонтальное — ленте
    strip.addEventListener('keydown', function (e) {
      if (e.target !== strip) return;
      if (e.key === 'ArrowRight') { strip.scrollBy({ left: 320, behavior: 'smooth' }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { strip.scrollBy({ left: -320, behavior: 'smooth' }); e.preventDefault(); }
    });
  }

  /* ---------- лайтбокс ---------- */
  function finalRect(w, h) {
    var vw = innerWidth, vh = innerHeight;
    var maxW = vw - (vw < 700 ? 24 : 200), maxH = vh - (vw < 700 ? 150 : 170);
    var s = Math.min(maxW / w, maxH / h, 1.6);
    var fw = w * s, fh = h * s;
    return { w: fw, h: fh, l: (vw - fw) / 2, t: (vh - fh) / 2 - 10 };
  }
  function place(g) {
    var fr = finalRect(g[2], g[3]);
    lbFig.style.width = fr.w + 'px'; lbFig.style.height = fr.h + 'px';
    lbFig.style.left = fr.l + 'px'; lbFig.style.top = fr.t + 'px';
    return fr;
  }
  function setContent(i) {
    index = (i + current.length) % current.length;
    var g = current[index];
    lbImg.src = 'assets/img/' + g[1] + '-t.webp';
    var full = new Image();
    full.onload = function () { if (current[index] === g) lbImg.src = full.src; };
    full.src = 'assets/img/' + g[1] + '.webp';
    lbImg.alt = g[6];
    lbCap.textContent = g[6];
    lbCount.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(current.length).padStart(2, '0');
    return place(g);
  }
  function thumbOf(i) { return track.querySelector('button[data-i="' + i + '"] img'); }

  function open(i, btn) {
    var gsap = window.gsap, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    opener = btn; openThumb = btn.querySelector('img');
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    var fr = setContent(i);
    lb.querySelector('.lb-close').focus({ preventScroll: true });
    if (!gsap || reduce) { lb.classList.add('is-open'); return; }
    var r = openThumb.getBoundingClientRect();
    // FLIP: начинаем из места миниатюры, приезжаем в центр
    gsap.set(lbFig, { x: r.left - fr.l, y: r.top - fr.t, scaleX: r.width / fr.w, scaleY: r.height / fr.h, transformOrigin: '0 0' });
    gsap.to(lbFig, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .75, ease: 'expo.inOut' });
    gsap.fromTo(lb.querySelector('.lb-bg'), { opacity: 0 }, { opacity: 1, duration: .5 });
    gsap.fromTo(lb.querySelectorAll('.lb-b, .lb-count, .lb-cap'), { opacity: 0 }, { opacity: 1, duration: .4, delay: .45 });
    lb.classList.add('is-open');
  }
  function close() {
    if (lb.hidden) return;
    var gsap = window.gsap, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var done = function () {
      lb.hidden = true; lb.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lenis) lenis.start();
      if (gsap) gsap.set(lbFig, { clearProps: 'transform' });
      var b = track.querySelector('button[data-i="' + index + '"]') || opener;
      if (b) b.focus({ preventScroll: true });
    };
    if (!gsap || reduce) return done();
    var t = thumbOf(index), fr = lbFig.getBoundingClientRect();
    var r = t && t.getBoundingClientRect();
    var visible = r && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
    gsap.to(lb.querySelectorAll('.lb-b, .lb-count, .lb-cap'), { opacity: 0, duration: .2 });
    gsap.to(lb.querySelector('.lb-bg'), { opacity: 0, duration: .5, delay: .1 });
    if (visible) {
      gsap.to(lbFig, { x: r.left - fr.left, y: r.top - fr.top, scaleX: r.width / fr.width, scaleY: r.height / fr.height, transformOrigin: '0 0', duration: .6, ease: 'expo.inOut', onComplete: done });
    } else gsap.to(lbFig, { opacity: 0, scale: .96, duration: .35, onComplete: function () { gsap.set(lbFig, { opacity: 1, scale: 1 }); done(); } });
  }
  function go(d) {
    var gsap = window.gsap, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!gsap || reduce) return setContent(index + d);
    gsap.to(lbFig, { opacity: 0, x: -30 * d, duration: .2, ease: 'power2.in', onComplete: function () {
      setContent(index + d);
      gsap.fromTo(lbFig, { opacity: 0, x: 30 * d }, { opacity: 1, x: 0, duration: .45, ease: 'expo.out' });
    } });
  }
  function initLightbox() {
    lb = document.querySelector('[data-lb]');
    lbImg = lb.querySelector('.lb-img'); lbCap = lb.querySelector('.lb-cap'); lbCount = lb.querySelector('.lb-count'); lbFig = lb.querySelector('.lb-fig');
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { go(-1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { go(1); });
    lb.querySelector('.lb-bg').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab') {
        // фокус-ловушка: только кнопки диалога
        var f = Array.prototype.slice.call(lb.querySelectorAll('button'));
        var at = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(at + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    // свайп
    var sx = 0, sy = 0, st = 0;
    lb.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Date.now() - st > 800) return;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
    }, { passive: true });
    window.addEventListener('resize', function () { if (!lb.hidden) place(current[index]); });
  }

  M.gallery = {
    render: function () {
      strip = document.querySelector('[data-strip]');
      track = document.querySelector('[data-strip-track]');
      if (!track) return;
      renderStrip();
    },
    init: function (mm, lenisRef) {
      lenis = lenisRef;
      Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
        t.addEventListener('click', function () { switchTab(t.getAttribute('data-tab'), t); });
        t.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          var all = Array.prototype.slice.call(document.querySelectorAll('.tab'));
          var n = all[(all.indexOf(t) + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
          n.focus(); n.click();
        });
      });
      initDrag();
      initLightbox();
      if (!mm) return;
      var gsap = window.gsap;
      mm.add('(prefers-reduced-motion: no-preference)', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.cl[data-speed]'), function (f) {
          var sp = parseFloat(f.getAttribute('data-speed'));
          var img = f.querySelector('.ph');
          var amt = (sp - 1) * 220; // >1 — кадр обгоняет страницу, <1 — отстаёт: глубина зала
          gsap.fromTo(f, { y: amt }, { y: -amt, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
          if (!f.querySelector('.cap')) gsap.fromTo(img, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'center center', scrub: true } });
        });
      });
    }
  };
})();
