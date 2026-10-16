/* Общий init: утилиты, Lenis, порядок ScrollTrigger (пины — раньше остальных триггеров), секции без своих файлов. */
(function () {
  'use strict';

  var K = window.KLEO;
  var M = window.KLEO_M || {};
  var docEl = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = matchMedia('(pointer: fine)');
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var hasGsap = !!(gsap && ST);

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------- одометр: цифры прокручиваются вертикальными лентами ---------- */
  function odometer(el) {
    var shown = null;
    function build(str) {
      el.innerHTML = '';
      str.split('').forEach(function (ch) {
        var s = document.createElement('span');
        if (/\d/.test(ch)) {
          s.className = 'odo-d';
          var strip = document.createElement('span');
          strip.className = 'odo-s';
          for (var i = 0; i < 10; i++) { var d = document.createElement('span'); d.textContent = i; strip.appendChild(d); }
          s.appendChild(strip);
        } else { s.className = 'odo-sp'; s.textContent = ch === ' ' ? '' : ch; }
        el.appendChild(s);
      });
    }
    function apply(str) {
      var kids = el.children;
      str.split('').forEach(function (ch, i) {
        if (/\d/.test(ch)) kids[i].firstChild.style.transform = 'translateY(-' + (+ch * 10) + '%)';
      });
    }
    return function set(v) {
      var str = K.money(v);
      var shape = str.replace(/\d/g, '0');
      if (shown !== shape) {
        build(str);
        shown = shape;
        // новые ленты стартуют с нуля и доезжают до цифры на следующем кадре
        requestAnimationFrame(function () { requestAnimationFrame(function () { apply(str); }); });
      } else apply(str);
    };
  }

  /* ---------- сплиттер строк: слова → строки в масках ---------- */
  function splitLines(el) {
    if (el.__orig == null) el.__orig = el.innerHTML; else el.innerHTML = el.__orig;
    var tokens = [];
    (function walk(node) {
      Array.prototype.forEach.call(node.childNodes, function (n) {
        if (n.nodeType === 3) {
          // делим только по обычным пробелам: &nbsp; остаётся внутри слова и держит пару «в одном»
          n.textContent.split(/[ \t\n\r]+/).forEach(function (w) { if (w) tokens.push({ t: w }); });
        } else if (n.nodeName === 'BR') tokens.push({ br: true });
        else if (n.nodeType === 1) walk(n);
      });
    })(el);
    el.innerHTML = '';
    var spans = tokens.map(function (t) {
      if (t.br) { var b = document.createElement('br'); el.appendChild(b); return null; }
      var s = document.createElement('span');
      s.style.display = 'inline-block';
      s.textContent = t.t;
      el.appendChild(s);
      el.appendChild(document.createTextNode(' '));
      return s;
    });
    var lines = [], cur = null, top = null;
    spans.forEach(function (s) {
      if (!s) { cur = null; return; }
      var y = s.offsetTop;
      if (!cur || Math.abs(y - top) > 4) { cur = []; lines.push(cur); top = y; }
      cur.push(esc(s.textContent));
    });
    el.innerHTML = lines.map(function (l) { return '<span class="sline"><span class="sline-in">' + l.join(' ') + '</span></span>'; }).join('');
    return $$('.sline-in', el);
  }

  /* ---------- общие утилиты для модулей ---------- */
  window.KLEO_UI = { $: $, $$: $$, esc: esc, odometer: odometer, splitLines: splitLines, reduce: mqReduce, fine: mqFine };

  /* =========================================================
     Рендер из data.js — не зависит от CDN
     ========================================================= */
  function renderMasters() {
    var ul = $('[data-masters]'); if (!ul) return;
    ul.innerHTML = K.masters.map(function (m) {
      var vb = m.lead ? '0 0 300 360' : '0 0 300 440';
      var h = m.lead ? 360 : 440;
      var d = 'M0 ' + h + ' V150 A150 150 0 0 1 300 150 V' + h;
      return '<li class="mst' + (m.lead ? ' mst--lead' : '') + '">' +
        '<div class="mst-arch">' +
          '<span class="mst-letter" aria-hidden="true">' + esc(m.name.charAt(0)) + '</span>' +
          '<svg class="mst-outline" viewBox="' + vb + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '"/><path class="mst-draw" pathLength="1" d="' + d + '"/></svg>' +
        '</div>' +
        '<h3 class="mst-name">' + esc(m.name) + '</h3>' +
        '<p class="mst-role">' + esc(m.role) + '</p>' +
        '<p class="mst-q"><span class="hang">«</span>' + esc(m.quote) + '»</p>' +
      '</li>';
    }).join('');
  }

  function renderDay() {
    var ol = $('[data-day-stops]'); if (!ol) return;
    ol.innerHTML = K.day.map(function (s) {
      return '<li class="stop">' +
        '<p class="stop-time">' + esc(s[0]) + '</p>' +
        '<span class="stop-dot" aria-hidden="true"></span>' +
        '<div class="arch"><img class="ph" src="assets/img/' + s[3] + '.webp" width="640" height="820" alt="' + esc(s[4]) + '" loading="lazy" decoding="async"></div>' +
        '<h3 class="stop-t">' + esc(s[1]) + '</h3>' +
        '<p class="stop-n">' + esc(s[2]) + '</p>' +
      '</li>';
    }).join('');
  }

  /* ---------- цифры ---------- */
  function initNumbers() {
    var nums = $$('[data-count]');
    if (!hasGsap || mqReduce.matches) return;
    var lines = $$('.num');
    gsap.set(lines, { '--grow': 0 });
    nums.forEach(function (el) { el.textContent = pad(0, el.dataset.pad); });
    ST.create({
      trigger: '.num-grid', start: 'top 80%', once: true,
      onEnter: function () {
        gsap.to(lines, { '--grow': 1, duration: 1.4, ease: 'expo.out', stagger: .12 });
        nums.forEach(function (el, i) {
          var o = { v: 0 }, to = +el.dataset.count;
          gsap.to(o, { v: to, duration: 1.4, delay: .1 + i * .12, ease: 'power3.out', onUpdate: function () { el.textContent = pad(Math.round(o.v), el.dataset.pad); } });
        });
      }
    });
    function pad(v, p) { v = String(v); while (p && v.length < +p) v = '0' + v; return v; }
  }

  /* ---------- голоса ---------- */
  function initVoices() {
    var stage = $('[data-voices]'); if (!stage) return;
    var q = $('[data-voice-q]'), who = $('[data-voice-who]'), dotsBox = $('[data-voice-dots]'), bq = $('[data-voice]');
    var list = K.voices, i = 0, timer = null, left = 6000, started = 0, paused = false, visible = false;
    dotsBox.innerHTML = list.map(function (v, n) {
      return '<button type="button" class="voice-dot" aria-label="Отзыв ' + (n + 1) + ' из ' + list.length + '"><i></i></button>';
    }).join('');
    var dots = $$('.voice-dot', dotsBox);

    function words(text) {
      return text.split(/[ \t\n\r]+/).map(function (w, n) {
        return '<span class="w"><span>' + (n === 0 ? '<span class="hang">«</span>' : '') + esc(w) + '</span></span>';
      }).join(' ') + '<span class="w"><span>»</span></span>';
    }
    function show(n, animate) {
      i = (n + list.length) % list.length;
      var v = list[i];
      var put = function () {
        q.innerHTML = words(v.q);
        who.textContent = v.who;
        dots.forEach(function (d, k) {
          d.classList.toggle('is-on', k === i);
          d.setAttribute('aria-current', k === i ? 'true' : 'false');
          var bar = d.firstChild; bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
        });
        if (animate && hasGsap && !mqReduce.matches) {
          gsap.fromTo($$('.w > span', q), { yPercent: 115 }, { yPercent: 0, duration: .9, ease: 'expo.out', stagger: .028 });
          gsap.fromTo(who, { opacity: 0 }, { opacity: 1, duration: .6, delay: .3 });
        }
      };
      if (animate && hasGsap && !mqReduce.matches && q.innerHTML) {
        gsap.to([q, who], { opacity: 0, duration: .3, onComplete: function () { gsap.set([q, who], { opacity: 1 }); put(); } });
      } else put();
      left = 6000; arm();
    }
    function arm() {
      clearTimeout(timer);
      if (paused || !visible) return;
      started = Date.now();
      timer = setTimeout(function () { show(i + 1, true); }, left);
    }
    function pause() {
      if (paused) return; paused = true; stage.classList.add('is-paused');
      clearTimeout(timer); left = Math.max(400, left - (Date.now() - started));
    }
    function resume() { if (!paused) return; paused = false; stage.classList.remove('is-paused'); arm(); }
    dots.forEach(function (d, k) {
      d.addEventListener('click', function () { bq.setAttribute('aria-live', 'polite'); show(k, true); });
    });
    stage.addEventListener('mouseenter', pause);
    stage.addEventListener('mouseleave', resume);
    stage.addEventListener('focusin', pause);
    stage.addEventListener('focusout', resume);
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) { if (!paused) { stage.classList.remove('is-paused'); arm(); } }
      else { clearTimeout(timer); left = 6000; stage.classList.add('is-paused'); }
    }).observe(stage);
    show(0, false);
  }

  /* ---------- криолиполиз: насадки 1…5 ---------- */
  function initCryo() {
    var box = $('[data-cryo]'); if (!box) return;
    var input = $('input', box), n = $('[data-cryo-n]', box), live = $('[data-cryo-live]', box);
    var set = odometer($('[data-odo="cryo"]', box));
    var words = ['насадка', 'насадки', 'насадки', 'насадки', 'насадок'];
    function upd() {
      var k = +input.value, price = K.cryo[k - 1];
      n.textContent = k;
      set(price);
      var txt = k + ' ' + words[k - 1] + ' — ' + K.money(price).replace(/ /g, ' ') + ' рублей';
      input.setAttribute('aria-valuetext', txt);
      live.textContent = txt;
      input.style.setProperty('--fill', ((k - 1) / 4 * 100) + '%');
    }
    input.addEventListener('input', upd);
    upd();
  }

  /* ---------- шапка, меню, якоря ---------- */
  var lenis = null;
  function scrollToEl(el) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.4 });
    else el.scrollIntoView();
  }
  function initHeader() {
    var hdr = $('[data-hdr]'), burger = $('.hdr-burger'), menu = $('#menu');
    var lastY = 0, open = false;
    function onScroll(y) {
      hdr.classList.toggle('is-solid', y > 40);
      if (!open) {
        if (y > lastY + 4 && y > 240) hdr.classList.add('is-up');
        else if (y < lastY - 4 || y < 240) hdr.classList.remove('is-up');
      }
      lastY = y;
    }
    if (lenis) lenis.on('scroll', function (e) { onScroll(e.scroll); });
    else window.addEventListener('scroll', function () { onScroll(scrollY); }, { passive: true });

    function setMenu(v) {
      open = v;
      burger.setAttribute('aria-expanded', String(v));
      burger.setAttribute('aria-label', v ? 'Закрыть меню' : 'Открыть меню');
      if (v) { menu.hidden = false; requestAnimationFrame(function () { menu.classList.add('is-open'); }); hdr.classList.remove('is-up'); if (lenis) lenis.stop(); }
      else { menu.classList.remove('is-open'); menu.hidden = true; if (lenis) lenis.start(); }
    }
    burger.addEventListener('click', function () { setMenu(!open); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { setMenu(false); burger.focus(); } });

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      var el = id === 'top' ? document.body : document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      if (open) setMenu(false);
      if (id === 'top') { if (lenis) lenis.scrollTo(0, { duration: 1.4 }); else scrollTo(0, 0); }
      else scrollToEl(el);
      history.replaceState(null, '', '#' + id);
    });
  }

  /* ---------- бегущая строка: скорость реагирует на скорость скролла ---------- */
  function initTicker() {
    var track = $('.ticker-track'); if (!track) return;
    var run = $('.ticker-run', track);
    track.appendChild(run.cloneNode(true));
    if (!hasGsap || mqReduce.matches) { docEl.classList.add('no-gsap'); return; }
    var x = 0, boost = 0, w = run.offsetWidth;
    window.addEventListener('resize', function () { w = run.offsetWidth; });
    gsap.ticker.add(function (t, dt) {
      var v = lenis ? Math.abs(lenis.velocity || 0) : 0;
      boost += (Math.min(v, 60) * .9 - boost) * .08;
      x -= (0.045 + boost * .02) * dt;
      if (-x >= w) x += w;
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
    });
  }

  /* ---------- курсор и магнитные кнопки ---------- */
  function initCursor() {
    if (!mqFine.matches || !hasGsap) return;
    document.body.classList.add('has-cursor');
    var c = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      c.classList.remove('is-hidden');
      var t = e.target;
      c.classList.toggle('is-drag', !!t.closest('[data-strip]'));
      c.classList.toggle('is-hover', !!t.closest('a, button, input, [data-hover], .zone'));
    }, { passive: true });
    document.addEventListener('mouseleave', function () { c.classList.add('is-hidden'); });
    gsap.ticker.add(function () {
      rx += (mx - rx) * .2; ry += (my - ry) * .2;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
    });
  }
  function initMagnets() {
    if (!mqFine.matches || !hasGsap || mqReduce.matches) return;
    $$('.magnet').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3.out' });
      var yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        xTo(Math.max(-12, Math.min(12, dx * .25)));
        yTo(Math.max(-12, Math.min(12, dy * .35)));
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1,.4)', overwrite: 'auto' });
      });
    });
  }

  /* ---------- «Одним днём»: горизонтальная лента на пине ---------- */
  var dayPin = null;
  function initDayPin(mm) {
    var sec = $('#day'), track = $('[data-day-track]'), stops = $$('.stop', track), vp = $('.day-viewport');
    if (!sec || !track) return;
    function dist() { return Math.max(0, track.scrollWidth - vp.clientWidth); }
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
      gsap.set(track, { '--ax': 0 });
      var axis = $('.day-axis', track);
      var tl = gsap.timeline({ defaults: { ease: 'none' } })
        .fromTo(track, { x: 0 }, { x: function () { return -dist(); }, duration: 1 }, 0)
        .fromTo(axis, { '--ax': 0 }, { '--ax': 1, duration: 1 }, 0);
      dayPin = ST.create({
        trigger: sec, pin: true, start: 'top top', anticipatePin: 1, invalidateOnRefresh: true,
        end: function () { return '+=' + dist(); },
        scrub: 1, animation: tl,
        onUpdate: function (st) {
          var tipX = st.progress * track.scrollWidth;
          stops.forEach(function (s) { s.classList.toggle('is-on', s.offsetLeft + 4 <= tipX); });
        }
      });
      return function () { dayPin = null; stops.forEach(function (s) { s.classList.remove('is-on'); }); };
    });
    mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', function () {
      stops.forEach(function (s) {
        ST.create({ trigger: s, start: 'top 70%', onEnter: function () { s.classList.add('is-on'); }, onLeaveBack: function () { s.classList.remove('is-on'); } });
      });
    });
  }

  /* ---------- hero: параллакс фото ---------- */
  function initHeroParallax(mm) {
    mm.add('(prefers-reduced-motion: no-preference)', function () {
      gsap.to('.hero-arch picture', { yPercent: -9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- заголовки построчно и мягкие появления ---------- */
  var splitEls = [];
  function splitAll() {
    splitEls = $$('.split');
    splitEls.forEach(function (el) { el.__lines = splitLines(el); });
  }
  function resplit() {
    splitEls.forEach(function (el) {
      var shown = el.__shown || mqReduce.matches || !hasGsap;
      el.__lines = splitLines(el);
      if (!shown) gsap.set(el.__lines, { yPercent: 110 });
    });
    if (hasGsap) ST.refresh();
  }
  function initReveals(mm) {
    mm.add('(prefers-reduced-motion: no-preference)', function () {
      splitEls.forEach(function (el) {
        if (el.closest('[data-laser-stage]') && matchMedia('(min-width: 900px)').matches) return; // сцена «Луч» анимирует сама
        gsap.set(el.__lines, { yPercent: 110 });
        ST.create({
          trigger: el, start: 'clamp(top 88%)', once: true,
          onEnter: function () { el.__shown = true; gsap.to(el.__lines, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: .08 }); }
        });
      });
      var soft = $$([
        '.services-lead', '.idx', '.space-lead', '.masters-lead', '.mst', '.env', '.program li', '.cryo', '.sculpt-q',
        '.day-cap', '.passes', '.zones-head > *', '.final-tel', '.final-links', '.final-facts > div', '.goodplace',
        '.secrets-tea', '.strip-head', '.voices-stage', '.services-fine', '.masters-fine'
      ].join(','));
      gsap.set(soft, { opacity: 0, y: 26 });
      ST.batch(soft, {
        start: 'clamp(top 92%)', once: true,
        onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: .07, overwrite: 'auto' }); }
      });
    });
    // при смене ширины строки пересобираются, уже показанные — без анимации
    var lastW = innerWidth, t;
    window.addEventListener('resize', function () {
      if (Math.abs(innerWidth - lastW) < 40) return;
      clearTimeout(t);
      t = setTimeout(function () { lastW = innerWidth; resplit(); }, 220);
    });
  }

  /* =========================================================
     Старт
     ========================================================= */
  function boot() {
    var intro = $('.intro');
    if (intro) intro.addEventListener('click', function () { intro.classList.add('is-skip'); });
    renderMasters();
    renderDay();
    if (M.laser) M.laser.render();
    if (M.services) M.services.render();
    if (M.gallery) M.gallery.render();
    if (M.secrets) M.secrets.render();

    if (!hasGsap) {
      docEl.classList.add('no-gsap');
      initHeader(); initTicker(); initVoices(); initCryo();
      if (M.laser) M.laser.initStatic();
      if (M.services) M.services.init(null);
      if (M.gallery) M.gallery.init(null, null);
      if (M.secrets) M.secrets.init();
      lazyMap();
      return;
    }

    gsap.registerPlugin(ST);
    ST.config({ ignoreMobileResize: true });

    if (!mqReduce.matches && window.Lenis) {
      lenis = new window.Lenis({ lerp: .09, smoothWheel: true, wheelMultiplier: 1 });
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      ST.addEventListener('refresh', function () { lenis.resize(); });
      window.__kleo = { lenis: lenis };
    } else window.__kleo = { lenis: null };

    splitAll();
    var mm = gsap.matchMedia();
    // 1) пины — первыми, чтобы остальные триггеры учли их длину
    if (M.laser) M.laser.initScroll(mm);
    initDayPin(mm);
    // 2) всё остальное
    initHeroParallax(mm);
    initReveals(mm);
    initNumbers();
    if (M.services) M.services.init(mm);
    if (M.gallery) M.gallery.init(mm, lenis);
    if (M.secrets) M.secrets.init();
    if (M.line) M.line.init({ dayPin: function () { return dayPin; } });

    initHeader();
    initTicker();
    initCursor();
    initMagnets();
    initVoices();
    initCryo();
    lazyMap();

    // пересчёт после шрифтов и картинок
    var refresh = function () { ST.refresh(); };
    // шрифты меняют переносы — заголовки пересобираются по строкам заново
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resplit);
    window.addEventListener('load', refresh);
    if (window.ResizeObserver) {
      var lastH = 0, rt;
      new ResizeObserver(function () {
        var h = document.body.scrollHeight;
        if (Math.abs(h - lastH) < 2) return;
        lastH = h; clearTimeout(rt); rt = setTimeout(refresh, 150);
      }).observe(document.body);
    }

  }

  /* карта: iframe грузим, когда секция близко; до загрузки видна заглушка */
  function lazyMap() {
    var f = $('.map-frame'); if (!f) return;
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      f.addEventListener('load', function () { f.classList.add('is-ready'); });
      f.src = f.dataset.src;
    }, { rootMargin: '600px 0px' });
    io.observe(f);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
