/* Золотая линия через всю страницу.
   Не одна SVG на весь документ (ломается на ресайзе), а своя SVG в каждой секции с [data-line].
   Все пути входят сверху и выходят снизу в одной точке — на середине левого поля, поэтому стыкуются.
   Пути пересчитываются на каждый ScrollTrigger.refresh() (после шрифтов, картинок, ресайза). */
(function () {
  'use strict';
  var M = window.KLEO_M = window.KLEO_M || {};
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, cls) { var e = document.createElementNS(NS, tag); if (cls) e.setAttribute('class', cls); return e; }
  function r(v) { return Math.round(v * 10) / 10; }
  var probe = null;
  function spineX() {
    // --gutter задан через clamp() — меряем фактическую ширину пробником
    if (!probe) { probe = document.createElement('div'); probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--gutter);height:0;left:0;top:0'; document.body.appendChild(probe); }
    return Math.max(8, Math.round(probe.offsetWidth / 2));
  }
  function rel(node, host) {
    var a = node.getBoundingClientRect(), b = host.getBoundingClientRect();
    return { l: a.left - b.left, t: a.top - b.top, r: a.right - b.left, b: a.bottom - b.top, w: a.width, h: a.height };
  }

  /* ---- построители путей: (host, W, H, sx) → d ---- */
  var builders = {
    spine: function (host, W, H, sx) { return 'M' + sx + ' 0V' + r(H); },

    // hero: от начала «стрелки» под вордмарком — влево, к полю, и вниз
    hero: function (host, W, H, sx) {
      var flick = host.querySelector('.flick');
      if (!flick) return builders.spine(host, W, H, sx);
      var f = rel(flick, host);
      var x0 = f.l + 2, y0 = f.t + f.h * (30 / 40);
      if (x0 - sx < 30) return 'M' + sx + ' ' + r(y0) + 'V' + r(H);
      return 'M' + r(x0) + ' ' + r(y0) +
        'C' + r(x0 - (x0 - sx) * .55) + ' ' + r(y0 + 2) + ' ' + r(sx) + ' ' + r(y0 + 14) + ' ' + r(sx) + ' ' + r(y0 + 70) +
        'V' + r(H);
    },

    // скульптор: линия обводит арку с фото и уходит вниз
    sculpt: function (host, W, H, sx) {
      var arch = host.querySelector('[data-sculpt-arch]');
      if (!arch || innerWidth < 900) return builders.spine(host, W, H, sx);
      var a = rel(arch, host);
      var o = Math.max(14, a.l - sx);
      var L = a.l - o, R = a.r + o, rad = a.w / 2 + o, cy = a.t + a.w / 2, B = a.b;
      return 'M' + sx + ' 0V' + r(cy) +
        (Math.abs(L - sx) > .5 ? 'L' + r(L) + ' ' + r(cy) : '') +
        'A' + r(rad) + ' ' + r(rad) + ' 0 0 1 ' + r(R) + ' ' + r(cy) +
        'V' + r(B + 18) +
        'C' + r(R) + ' ' + r(B + (H - B) * .55) + ' ' + r(sx) + ' ' + r(B + (H - B) * .35) + ' ' + r(sx) + ' ' + r(H);
    },

    // финал: линия замыкается в картуш вокруг адреса + поперечная черта на конце
    final: function (host, W, H, sx) {
      var c = host.querySelector('[data-cartouche]');
      if (!c) return builders.spine(host, W, H, sx);
      var a = rel(c, host);
      var L = a.l, T = a.t, R = a.r, B = a.b;
      var rad = Math.min((B - T) / 2, (R - L) / 2, 220);
      var d = 'M' + sx + ' 0' +
        'C' + sx + ' ' + r(T * .7) + ' ' + r(L + rad * .2) + ' ' + r(T) + ' ' + r(L + rad) + ' ' + r(T) +
        'H' + r(R - rad) +
        'A' + r(rad) + ' ' + r(rad) + ' 0 0 1 ' + r(R) + ' ' + r(T + rad) +
        'V' + r(B - rad) +
        'A' + r(rad) + ' ' + r(rad) + ' 0 0 1 ' + r(R - rad) + ' ' + r(B) +
        'H' + r(L + rad) +
        'A' + r(rad) + ' ' + r(rad) + ' 0 0 1 ' + r(L) + ' ' + r(B - rad) +
        'V' + r(T + rad) +
        'A' + r(rad) + ' ' + r(rad) + ' 0 0 1 ' + r(L + rad) + ' ' + r(T);
      // перевязь картуша — короткая черта у правого края
      var bx = R + Math.min(18, (W - R) / 2);
      if (bx < W - 4) d += 'M' + r(bx) + ' ' + r(T + rad * .55) + 'V' + r(B - rad * .55);
      return d;
    },

    offer: function (host, W, H, sx) { return 'M' + sx + ' 0V' + r(H); }
  };

  var items = [];

  function make(host) {
    var type = host.getAttribute('data-line');
    var svg = el('svg', 'gl'); svg.setAttribute('aria-hidden', 'true');
    var glow = el('path', 'gl-glow'), path = el('path', 'gl-path'), tip = el('circle', 'gl-tip');
    tip.setAttribute('r', '2.4');
    svg.appendChild(glow); svg.appendChild(path); svg.appendChild(tip);
    host.insertBefore(svg, host.firstChild);
    var it = { host: host, type: type, svg: svg, path: path, glow: glow, tip: tip, len: 0, p: 0 };
    items.push(it);
    return it;
  }

  function build(it) {
    var W = it.host.offsetWidth, H = it.host.offsetHeight;
    it.svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var d = (builders[it.type] || builders.spine)(it.host, W, H, spineX(it.host));
    it.path.setAttribute('d', d); it.glow.setAttribute('d', d);
    it.len = it.path.getTotalLength();
    [it.path, it.glow].forEach(function (p) { p.style.strokeDasharray = it.len + ' ' + (it.len + 2); });
    draw(it, it.p);
  }

  function draw(it, p) {
    it.p = p;
    var off = it.len * (1 - p);
    it.path.style.strokeDashoffset = off; it.glow.style.strokeDashoffset = off;
    if (p > .002 && p < .998) {
      var pt = it.path.getPointAtLength(it.len * p);
      it.tip.setAttribute('cx', pt.x); it.tip.setAttribute('cy', pt.y);
      it.tip.style.opacity = 1;
    } else it.tip.style.opacity = 0;
  }

  M.line = {
    spineX: spineX,
    init: function (opts) {
      var gsap = window.gsap, ST = window.ScrollTrigger;
      var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      Array.prototype.forEach.call(document.querySelectorAll('[data-line]'), make);
      items.forEach(function (it) {
        build(it);
        if (reduce || !ST) { draw(it, 1); return; }
        var cfg = { trigger: it.host, start: 'top 72%', end: 'bottom 72%', scrub: .6 };
        if (it.type === 'hero') { cfg.start = 'top top'; cfg.end = 'bottom 72%'; }
        if (it.host.id === 'day') { cfg.start = 'top 72%'; cfg.end = function () { var p = opts.dayPin(); return p ? p.end : 'bottom 72%'; }; }
        if (it.type === 'final') { cfg.end = 'bottom bottom'; }
        cfg.onUpdate = function (st) { draw(it, st.progress); };
        ST.create(cfg);
      });
      if (ST) ST.addEventListener('refresh', function () { items.forEach(build); });
      window.addEventListener('resize', function () { if (!ST) items.forEach(build); });
    }
  };
})();
