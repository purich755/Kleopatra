/* Указатель услуг: строки-оглавление, аккордеон с ценами, фото в арке за курсором. */
(function () {
  'use strict';
  var M = window.KLEO_M = window.KLEO_M || {};
  var K = window.KLEO;

  function minPrice(s) {
    var min = Infinity;
    s.cols.forEach(function (c) { c.items.forEach(function (it) { if (typeof it[1] === 'number' && it[1] < min) min = it[1]; }); });
    if (s.id === 'hair') min = Math.min(min, 500);
    return min;
  }

  M.services = {
    render: function () {
      var ol = document.querySelector('[data-index]'); if (!ol) return;
      var esc = window.KLEO_UI.esc;
      ol.innerHTML = K.services.map(function (s, i) {
        var n = String(i + 1).padStart(2, '0');
        return '<li class="idx" data-svc="' + s.id + '">' +
          '<button type="button" class="idx-row" aria-expanded="false" aria-controls="svc-' + s.id + '">' +
            '<span class="idx-n">№&nbsp;' + n + '</span>' +
            '<span class="idx-name">' + esc(s.name) + '</span>' +
            '<span class="idx-dots" aria-hidden="true"></span>' +
            '<span class="idx-price">от&nbsp;' + K.money(s.from || minPrice(s)) + '&nbsp;₽</span>' +
            '<svg class="idx-arrow" viewBox="0 0 28 14" aria-hidden="true"><path d="M0 7h26M20 1l6 6-6 6"/></svg>' +
          '</button>' +
          '<div class="idx-panel" id="svc-' + s.id + '" role="region" aria-label="' + esc(s.name) + ' — цены">' +
            '<div class="idx-cols">' + s.cols.map(function (c) {
              return '<div class="idx-col"><h3>' + esc(c.title) + '</h3><ul>' + c.items.map(function (it) {
                var p = typeof it[1] === 'number' ? K.money(it[1]) : esc(it[1]);
                return '<li><span>' + esc(it[0]) + '</span><span>' + p + '&nbsp;₽</span></li>';
              }).join('') + '</ul></div>';
            }).join('') + '</div>' +
          '</div>' +
        '</li>';
      }).join('');
      // фото для плавающей арки
      var box = document.querySelector('.float-in');
      box.innerHTML = K.services.map(function (s) {
        return '<img data-for="' + s.id + '" alt="" width="520" height="680" decoding="async" data-src="assets/img/' + (s.img.indexOf('svc-body') === 0 || s.img.indexOf('svc-cosmo') === 0 ? 'body/' : 'works/') + s.img + '.webp">';
      }).join('');
    },

    init: function (mm) {
      var gsap = window.gsap;
      var list = document.querySelector('[data-index]'); if (!list) return;
      var items = Array.prototype.slice.call(list.querySelectorAll('.idx'));
      var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

      /* аккордеон */
      items.forEach(function (it) {
        var btn = it.querySelector('.idx-row'), panel = it.querySelector('.idx-panel');
        btn.addEventListener('click', function () {
          var open = btn.getAttribute('aria-expanded') !== 'true';
          btn.setAttribute('aria-expanded', String(open));
          it.classList.toggle('is-open', open);
          if (!gsap || reduce) { panel.classList.toggle('is-open', open); panel.style.height = open ? 'auto' : ''; refresh(); return; }
          if (open) {
            panel.classList.add('is-open');
            gsap.fromTo(panel, { height: 0 }, { height: 'auto', duration: .8, ease: 'expo.out', onComplete: refresh });
            gsap.fromTo(panel.querySelectorAll('li'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .6, stagger: .025, ease: 'power2.out', delay: .1 });
          } else {
            gsap.to(panel, { height: 0, duration: .6, ease: 'expo.inOut', onComplete: function () { panel.classList.remove('is-open'); refresh(); } });
          }
        });
      });
      function refresh() { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }

      /* hover: линия, приглушение, фото за курсором — только точный указатель */
      if (!matchMedia('(pointer: fine)').matches) return;
      var arch = document.querySelector('.float-arch'), imgs = {};
      Array.prototype.forEach.call(arch.querySelectorAll('img'), function (im) { imgs[im.getAttribute('data-for')] = im; });
      var loaded = false;
      function load() { if (loaded) return; loaded = true; for (var k in imgs) imgs[k].src = imgs[k].getAttribute('data-src'); }
      var x = 0, y = 0, tx = 0, ty = 0, rot = 0, on = false, running = false;
      function loop() {
        var dx = tx - x;
        x += dx * .12; y += (ty - y) * .12;
        rot += (Math.max(-12, Math.min(12, dx * .12)) - rot) * .1;
        arch.style.transform = 'translate3d(' + (x - 130).toFixed(1) + 'px,' + (y - 170).toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
        if (on || Math.abs(dx) > .5) requestAnimationFrame(loop); else running = false;
      }
      list.addEventListener('pointerenter', load);
      list.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        tx = e.clientX; ty = e.clientY;
        if (!on) { x = tx; y = ty; }
        var it = e.target.closest('.idx');
        var row = e.target.closest('.idx-row');
        items.forEach(function (i) { i.classList.toggle('is-hover', i === it); });
        list.classList.toggle('is-dim', !!row);
        var show = !!(row && it);
        if (show) {
          for (var k in imgs) imgs[k].classList.toggle('is-on', k === it.getAttribute('data-svc'));
        }
        if (show !== on) { on = show; arch.classList.toggle('is-on', on); }
        if (on && !running && !reduce) { running = true; requestAnimationFrame(loop); }
        if (reduce) arch.style.transform = 'translate3d(' + (tx - 130) + 'px,' + (ty - 170) + 'px,0)';
      });
      list.addEventListener('pointerleave', function () {
        on = false; arch.classList.remove('is-on'); list.classList.remove('is-dim');
        items.forEach(function (i) { i.classList.remove('is-hover'); });
      });
      window.addEventListener('scroll', function () { if (on) { on = false; arch.classList.remove('is-on'); list.classList.remove('is-dim'); items.forEach(function (i) { i.classList.remove('is-hover'); }); } }, { passive: true });
    }
  };
})();
