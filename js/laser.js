/* Сцена «Луч» (пин, луч снимает тонировку) + конструктор зон лазерной эпиляции. */
(function () {
  'use strict';
  var M = window.KLEO_M = window.KLEO_M || {};
  var K = window.KLEO;
  var NS = 'http://www.w3.org/2000/svg';

  /* =========================================================
     Силуэт: контуры — точки левой половины (dx от центра 80, y), правая — зеркально.
     Гладкость даёт сплайн Катмулла—Рома. Без анатомических деталей.
     ========================================================= */
  var FIG = {
    her: {
      head: [80, 34, 14.5, 18.5],
      body: [[-6.5, 50], [-7, 63], [-17, 69], [-29, 74], [-33, 84], [-29.5, 100], [-28.5, 118], [-25, 138], [-21.5, 158], [-24.5, 180],
        [-31, 203], [-30, 236], [-25.5, 270], [-20.5, 300], [-20, 328], [-16.5, 362], [-11.5, 394], [-13, 405], [-16, 412], [-9, 416],
        [-5, 412], [-5.5, 396], [-6.5, 362], [-9.5, 330], [-6.5, 302], [-7.5, 272], [-4.5, 242], [-1.2, 226]],
      arm: [[-33, 82], [-39, 100], [-41.5, 130], [-42.5, 160], [-45, 188], [-47, 214], [-50, 230], [-49, 247], [-43.5, 252],
        [-40, 236], [-40, 216], [-37, 188], [-34.5, 160], [-33.5, 132], [-32.5, 106]]
    },
    him: {
      head: [80, 33, 15, 19],
      body: [[-7.5, 50], [-8.5, 62], [-20, 68], [-34, 73], [-38.5, 84], [-33, 102], [-31, 124], [-28, 146], [-26.5, 166], [-27.5, 186],
        [-29, 206], [-29, 236], [-25.5, 270], [-21, 300], [-20.5, 328], [-17, 362], [-12, 394], [-13.5, 405], [-16.5, 412], [-9, 416],
        [-5, 412], [-5.5, 396], [-6.5, 362], [-9.5, 330], [-6.5, 302], [-7.5, 272], [-4.5, 242], [-1.2, 226]],
      arm: [[-38.5, 82], [-44, 100], [-46.5, 130], [-47, 160], [-49, 188], [-50.5, 214], [-53.5, 230], [-52.5, 248], [-46.5, 253],
        [-43.5, 236], [-43.5, 216], [-41, 188], [-38.5, 160], [-37.5, 132], [-36, 106]]
    }
  };

  /* Зоны: v — вид (f спереди, b со спины); s — фигуры: [клип, тип, данные]. Клипы: h голова, b тело, a руки, '' без клипа. */
  function R(c, x0, y0, x1, y1) { return [c, 'r', [x0, y0, x1, y1]]; }
  var Z_HER = {
    lip: { v: 'f', s: [R('h', 72, 40.5, 88, 44)] },
    chin: { v: 'f', s: [R('h', 66, 46.5, 94, 54)] },
    face: { v: 'f', s: [R('h', 60, 14, 100, 54)] },
    cheeks: { v: 'f', s: [R('h', 60, 14, 100, 39)] },
    neck: { v: 'f', s: [R('b', 60, 49, 100, 66)] },
    armpits: { v: 'f', s: [['', 'e', [51.2, 100, 3.2, 6.5]], ['', 'e', [108.8, 100, 3.2, 6.5]]] },
    forearm: { v: 'f', s: [R('a', 0, 160, 160, 216)] },
    upperarm: { v: 'f', s: [R('a', 0, 80, 160, 160)] },
    arms: { v: 'f', s: [R('a', 0, 80, 160, 216)] },
    hands: { v: 'f', s: [R('a', 0, 216, 160, 237)] },
    handsf: { v: 'f', s: [R('a', 0, 216, 160, 256)] },
    fingers: { v: 'f', s: [R('a', 0, 237, 160, 256)] },
    shoulders: { v: 'f', s: [R('b', 40, 64, 66, 88), R('b', 94, 64, 120, 88), R('a', 0, 80, 160, 98)] },
    line: { v: 'f', s: [R('b', 78.3, 142, 81.7, 204)] },
    areola: { v: 'f', s: [['', 'c', [67, 117, 3.2]], ['', 'c', [93, 117, 3.2]]] },
    chest: { v: 'f', s: [R('b', 40, 98, 120, 140)] },
    decollete: { v: 'f', s: [['b', 'p', [[57, 70], [103, 70], [80, 104]]]] },
    belly: { v: 'f', s: [R('b', 40, 140, 120, 201)] },
    lowback: { v: 'b', s: [R('b', 40, 158, 120, 192)] },
    back: { v: 'b', s: [R('b', 40, 64, 120, 192)] },
    bikinid: { v: 'f', s: [['b', 'p', [[53, 199], [107, 199], [90, 236], [70, 236]]]] },
    bikinic: { v: 'f', s: [['b', 'p', [[61, 207], [99, 207], [86, 229], [74, 229]]]] },
    intergl: { v: 'b', s: [R('b', 78.3, 196, 81.7, 232)] },
    glutes: { v: 'b', s: [R('b', 40, 192, 120, 240)] },
    shins: { v: 'f', s: [R('b', 40, 288, 120, 400)] },
    legs: { v: 'f', s: [R('b', 40, 226, 120, 418)] },
    thighs: { v: 'f', s: [R('b', 40, 226, 120, 290)] },
    knees: { v: 'f', s: [R('b', 40, 288, 120, 314)] },
    toes: { v: 'f', s: [R('b', 40, 404, 120, 418)] }
  };
  var Z_HIM = {
    neck: { v: 'f', s: [R('b', 60, 49, 100, 66)] },
    armpits: { v: 'f', s: [['', 'e', [46.2, 103, 3.4, 7]], ['', 'e', [113.8, 103, 3.4, 7]]] },
    arms: { v: 'f', s: [R('a', 0, 80, 160, 216)] },
    upperarm: { v: 'f', s: [R('a', 0, 80, 160, 160)] },
    handsf: { v: 'f', s: [R('a', 0, 216, 160, 256)] },
    chest: { v: 'f', s: [R('b', 36, 96, 124, 146)] },
    areola: { v: 'f', s: [['', 'c', [65, 113, 3.3]], ['', 'c', [95, 113, 3.3]]] },
    sternum: { v: 'f', s: [R('b', 75, 98, 85, 148)] },
    shoulders: { v: 'f', s: [R('b', 36, 62, 62, 90), R('b', 98, 62, 124, 90), R('a', 0, 80, 160, 98)] },
    belly: { v: 'f', s: [R('b', 36, 146, 124, 206)] },
    lowbelly: { v: 'f', s: [R('b', 36, 178, 124, 206)] },
    back: { v: 'b', s: [R('b', 36, 62, 124, 194)] },
    upperback: { v: 'b', s: [R('b', 36, 62, 124, 124)] },
    lowback: { v: 'b', s: [R('b', 36, 160, 124, 194)] },
    bikinid: { v: 'f', s: [['b', 'p', [[55, 204], [105, 204], [90, 238], [70, 238]]]] },
    bikinic: { v: 'f', s: [['b', 'p', [[61, 210], [99, 210], [86, 231], [74, 231]]]] },
    glutes: { v: 'b', s: [R('b', 36, 194, 124, 242)] },
    intergl: { v: 'b', s: [R('b', 78.3, 198, 81.7, 234)] },
    legs: { v: 'f', s: [R('b', 36, 226, 124, 418)] },
    thighs: { v: 'f', s: [R('b', 36, 226, 124, 292)] },
    thighpart: { v: 'f', s: [R('b', 36, 226, 124, 262)] },
    shins: { v: 'f', s: [R('b', 36, 292, 124, 404)] }
  };

  function mirror(pts) {
    var left = pts.map(function (p) { return [80 + p[0], p[1]]; });
    var right = pts.slice().reverse().map(function (p) { return [80 - p[0], p[1]]; });
    return left.concat(right);
  }
  function crPath(pts, closed) {
    var n = pts.length, d = 'M' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
    var last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (!closed) { if (i === 0) p0 = p1; if (i + 2 >= n) p3 = p2; }
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += 'C' + [c1, c2, p2].map(function (p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' ');
    }
    return d + (closed ? 'Z' : '');
  }

  function svgEl(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function buildFigure(sex, zones) {
    var f = FIG[sex];
    var body = crPath(mirror(f.body), true);
    var armL = crPath(f.arm.map(function (p) { return [80 + p[0], p[1]]; }), true);
    var armR = crPath(f.arm.map(function (p) { return [80 - p[0], p[1]]; }), true);
    var h = f.head;
    var svg = svgEl('svg', { viewBox: '0 0 380 452', role: 'presentation' });
    var defs = svgEl('defs', {});
    var id = 'fz-' + sex;
    var cb = svgEl('clipPath', { id: id + '-b' }); cb.appendChild(svgEl('path', { d: body })); defs.appendChild(cb);
    var ca = svgEl('clipPath', { id: id + '-a' }); ca.appendChild(svgEl('path', { d: armL })); ca.appendChild(svgEl('path', { d: armR })); defs.appendChild(ca);
    var ch = svgEl('clipPath', { id: id + '-h' }); ch.appendChild(svgEl('ellipse', { cx: h[0], cy: h[1], rx: h[2], ry: h[3] })); defs.appendChild(ch);
    svg.appendChild(defs);

    [['f', 20, 'спереди'], ['b', 200, 'со спины']].forEach(function (view) {
      var g = svgEl('g', { transform: 'translate(' + view[1] + ' 6)' });
      g.appendChild(svgEl('path', { d: armL, class: 'fig-body' }));
      g.appendChild(svgEl('path', { d: armR, class: 'fig-body' }));
      g.appendChild(svgEl('path', { d: body, class: 'fig-body' }));
      g.appendChild(svgEl('ellipse', { cx: h[0], cy: h[1], rx: h[2], ry: h[3], class: 'fig-body' }));
      if (view[0] === 'b') g.appendChild(svgEl('path', { d: 'M80 70 C 79.4 120, 80.6 160, 80 196', class: 'fig-detail' }));
      // зоны: крупные снизу, мелкие сверху — чтобы попадали под курсор
      var list = Object.keys(zones).filter(function (k) { return zones[k].v === view[0]; });
      list.sort(function (a, b) { return area(zones[b]) - area(zones[a]); });
      list.forEach(function (zid) {
        var zg = svgEl('g', { class: 'zone', 'data-zone': zid });
        zones[zid].s.forEach(function (s) {
          var shape;
          if (s[1] === 'r') shape = svgEl('rect', { x: s[2][0], y: s[2][1], width: s[2][2] - s[2][0], height: s[2][3] - s[2][1] });
          else if (s[1] === 'e') shape = svgEl('ellipse', { cx: s[2][0], cy: s[2][1], rx: s[2][2], ry: s[2][3] });
          else if (s[1] === 'c') shape = svgEl('circle', { cx: s[2][0], cy: s[2][1], r: s[2][2] });
          else shape = svgEl('polygon', { points: s[2].map(function (p) { return p.join(','); }).join(' ') });
          if (s[0]) shape.setAttribute('clip-path', 'url(#' + id + '-' + s[0] + ')');
          zg.appendChild(shape);
        });
        g.appendChild(zg);
      });
      var t = svgEl('text', { x: 80, y: 440, 'text-anchor': 'middle', class: 'fig-label' }); t.textContent = view[2];
      g.appendChild(t);
      svg.appendChild(g);
    });
    return svg;
  }
  function area(z) {
    return z.s.reduce(function (a, s) {
      if (s[1] === 'r') return a + (s[2][2] - s[2][0]) * (s[2][3] - s[2][1]) * (s[0] === 'b' ? .55 : s[0] === 'a' ? .2 : .6);
      if (s[1] === 'p') return a + 600;
      return a + 30;
    }, 0);
  }

  /* =========================================================
     Конструктор
     ========================================================= */
  var state = { sex: 'her', sel: [] };
  var ui = {};

  function priceOf(id) { var z = find(id); return z ? z.price : 0; }
  function find(id) { return K.laser[state.sex].filter(function (z) { return z.id === id; })[0]; }

  function renderChips() {
    var esc = window.KLEO_UI.esc;
    var zones = K.laser[state.sex];
    ui.chips.innerHTML = K.laser.groups.map(function (g) {
      var items = zones.filter(function (z) { return z.g === g[0]; });
      if (!items.length) return '';
      return '<div class="chip-group"><p class="chip-group-t">' + g[1] + '</p><div class="chip-list">' +
        items.map(function (z) {
          return '<button type="button" class="chip" data-zone="' + z.id + '" aria-pressed="false">' +
            '<span>' + esc(z.name) + '</span><span class="chip-p">' + K.money(z.price) + '&nbsp;₽</span></button>';
        }).join('') + '</div></div>';
    }).join('');
    ui.chips.classList.remove('is-swap'); void ui.chips.offsetWidth; ui.chips.classList.add('is-swap');
  }
  function renderFigure() {
    ui.fig.innerHTML = '';
    ui.fig.appendChild(buildFigure(state.sex, state.sex === 'her' ? Z_HER : Z_HIM));
    ui.tip = document.createElement('span'); ui.tip.className = 'fig-tip'; ui.fig.appendChild(ui.tip);
  }

  function setHover(id, on) {
    Array.prototype.forEach.call(document.querySelectorAll('#zones [data-zone="' + id + '"]'), function (e) { e.classList.toggle('is-hover', on); });
  }
  function toggle(id) {
    var i = state.sel.indexOf(id);
    if (i === -1) state.sel.push(id); else state.sel.splice(i, 1);
    sync(id, i === -1);
  }

  function complexMatch() {
    if (state.sex !== 'her') return null;
    var sel = state.sel.slice().sort().join('|');
    return K.laser.complexes.filter(function (c) { return c.zones.slice().sort().join('|') === sel; })[0] || null;
  }

  function sync(changed, added) {
    Array.prototype.forEach.call(document.querySelectorAll('#zones [data-zone]'), function (e) {
      var on = state.sel.indexOf(e.getAttribute('data-zone')) !== -1;
      e.classList.toggle('is-on', on);
      if (e.classList.contains('chip')) e.setAttribute('aria-pressed', String(on));
    });
    var esc = window.KLEO_UI.esc;
    if (!state.sel.length) ui.list.innerHTML = '<li class="check-empty">Пока пусто — отметьте зону</li>';
    else ui.list.innerHTML = state.sel.map(function (id) {
      var z = find(id);
      return '<li' + (id === changed && added ? ' class="is-new"' : '') + '><span>' + esc(z.name) + '</span><span>' + K.money(z.price) + '&nbsp;₽</span></li>';
    }).join('');
    var sum = state.sel.reduce(function (a, id) { return a + priceOf(id); }, 0);
    var cx = complexMatch(), total = sum;
    if (cx) {
      total = Math.round(sum * (100 - cx.off) / 100);
      ui.complex.innerHTML = 'Это <b>Комплекс ' + cx.n + '</b> — скидка ' + cx.off + '%: <b>' + K.money(total) + '&nbsp;₽</b> вместо ' + K.money(sum) + '&nbsp;₽';
      ui.complex.hidden = false;
      ui.old.textContent = K.money(sum) + ' ₽';
      ui.old.hidden = false;
    } else { ui.complex.hidden = true; ui.old.hidden = true; }
    ui.odo(total);
    ui.live.textContent = 'Итого ' + K.money(total).replace(/ /g, ' ') + ' рублей' + (cx ? ', комплекс ' + cx.n + ' со скидкой ' + cx.off + '%' : '');
    // сообщение в WhatsApp
    if (state.sel.length) {
      var names = state.sel.map(function (id) { return find(id).name.toLowerCase(); }).join(', ');
      var msg = 'Здравствуйте! Хочу на лазерную эпиляцию' + (state.sex === 'him' ? ' (мужской прайс)' : '') + ': ' + names + '.' +
        (cx ? ' Это Комплекс ' + cx.n + ' — ' + K.money(total).replace(/ /g, ' ') + ' ₽ по прайсу на сайте.' : ' По прайсу на сайте — ' + K.money(total).replace(/ /g, ' ') + ' ₽.');
      ui.wa.href = K.contacts.wa + '?text=' + encodeURIComponent(msg);
      ui.wa.removeAttribute('aria-disabled');
    } else { ui.wa.href = K.contacts.wa; ui.wa.setAttribute('aria-disabled', 'true'); }
  }

  function setSex(sex) {
    if (sex === state.sex) return;
    state.sex = sex; state.sel = [];
    ui.toggle.setAttribute('data-sex', sex);
    Array.prototype.forEach.call(ui.toggle.querySelectorAll('.toggle-b'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-sex') === sex)); });
    renderChips(); renderFigure(); sync();
  }

  function bind() {
    // чипы
    ui.chips.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) toggle(b.getAttribute('data-zone')); });
    ui.chips.addEventListener('mouseover', function (e) { var b = e.target.closest('.chip'); if (b) setHover(b.getAttribute('data-zone'), true); });
    ui.chips.addEventListener('mouseout', function (e) { var b = e.target.closest('.chip'); if (b) setHover(b.getAttribute('data-zone'), false); });
    ui.chips.addEventListener('focusin', function (e) { var b = e.target.closest('.chip'); if (b) setHover(b.getAttribute('data-zone'), true); });
    ui.chips.addEventListener('focusout', function (e) { var b = e.target.closest('.chip'); if (b) setHover(b.getAttribute('data-zone'), false); });
    // силуэт
    var cur = null;
    ui.fig.addEventListener('click', function (e) { var z = e.target.closest('.zone'); if (z) toggle(z.getAttribute('data-zone')); });
    ui.fig.addEventListener('pointermove', function (e) {
      var z = e.target.closest('.zone'), id = z && z.getAttribute('data-zone');
      if (id !== cur) { if (cur) setHover(cur, false); cur = id; if (id) setHover(id, true); }
      if (id) {
        var box = ui.fig.getBoundingClientRect(), item = find(id);
        ui.tip.textContent = item.name + ' · ' + K.money(item.price) + ' ₽';
        ui.tip.style.left = (e.clientX - box.left) + 'px'; ui.tip.style.top = (e.clientY - box.top) + 'px';
        ui.tip.classList.add('is-on');
      } else ui.tip.classList.remove('is-on');
    });
    ui.fig.addEventListener('pointerleave', function () { if (cur) setHover(cur, false); cur = null; ui.tip.classList.remove('is-on'); });
    ui.toggle.addEventListener('click', function (e) { var b = e.target.closest('.toggle-b'); if (b) setSex(b.getAttribute('data-sex')); });
  }

  /* =========================================================
     Сцена «Луч»
     ========================================================= */
  var stage, frame, stageSvg, stagePath;
  function stageLine(p) {
    if (!stageSvg) return;
    var W = stage.offsetWidth, H = stage.offsetHeight;
    var sx = M.line ? M.line.spineX() : 40;
    var sr = stage.getBoundingClientRect(), fr = frame.getBoundingClientRect();
    var fl = fr.left - sr.left, ft = fr.top - sr.top, fh = fr.height;
    var by = ft + fh * p;
    stageSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var copy = stage.querySelector('.laser-copy').getBoundingClientRect();
    var cx = Math.min(copy.right - sr.left + 28, fl - 40);
    var d = 'M' + sx + ' 0V' + by.toFixed(1);
    if (cx > sx + 40 && innerWidth >= 900) d += 'M' + cx.toFixed(1) + ' ' + by.toFixed(1) + 'H' + (fl - 26).toFixed(1);
    else d += 'H' + (fl - 26).toFixed(1);
    if (p > .985) d += 'M' + sx + ' ' + by.toFixed(1) + 'V' + H;
    stagePath.setAttribute('d', d);
  }
  function makeStageSvg() {
    stageSvg = svgEl('svg', { class: 'gl', 'aria-hidden': 'true' });
    stagePath = svgEl('path', { class: 'gl-path' });
    stageSvg.appendChild(stagePath);
    stage.insertBefore(stageSvg, stage.firstChild);
  }

  M.laser = {
    render: function () {
      ui.fig = document.querySelector('[data-figure]');
      ui.chips = document.querySelector('[data-chips]');
      ui.list = document.querySelector('[data-check-list]');
      ui.old = document.querySelector('[data-check-old]');
      ui.complex = document.querySelector('[data-complex]');
      ui.wa = document.querySelector('[data-wa]');
      ui.live = document.querySelector('[data-total-live]');
      ui.toggle = document.querySelector('.toggle');
      if (!ui.chips) return;
      ui.toggle.setAttribute('data-sex', 'her');
      ui.odo = window.KLEO_UI.odometer(document.querySelector('[data-odo="total"]'));
      renderChips(); renderFigure(); bind(); sync();
      stage = document.querySelector('[data-laser-stage]');
      frame = stage.querySelector('.beam-frame');
      makeStageSvg();
    },
    initStatic: function () {
      stage.classList.add('is-static');
      stageLine(1);
    },
    relines: function () {},
    initScroll: function (mm) {
      var gsap = window.gsap, ST = window.ScrollTrigger;
      var theses = Array.prototype.slice.call(stage.querySelectorAll('.thesis'));
      var head = stage.querySelector('.h2');
      var eyebrow = stage.querySelector('.eyebrow');
      var setP = function (p) { frame.style.setProperty('--p', (p * 100).toFixed(2) + '%'); stageLine(p); };
      ST.addEventListener('refresh', function () { stageLine(state.p || 0); });

      mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
        var lines = head.__lines || head.querySelectorAll('.sline-in');
        var prog = { p: 0 };
        var tl = gsap.timeline({ defaults: { ease: 'none' } });
        tl.fromTo(prog, { p: 0 }, { p: 1, duration: 1, onUpdate: function () { state.p = prog.p; setP(prog.p); } }, 0);
        theses.forEach(function (t, i) {
          tl.fromTo(t, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: .14, ease: 'power2.out' }, .14 + i * .28);
        });
        // заголовок выезжает из маски при входе в сцену, до пина
        gsap.set(head.querySelectorAll('.sline-in'), { yPercent: 110 });
        gsap.set(eyebrow, { opacity: 0 });
        ST.create({
          trigger: stage, start: 'top 75%', once: true,
          onEnter: function () {
            gsap.to(head.querySelectorAll('.sline-in'), { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: .08 });
            gsap.to(eyebrow, { opacity: 1, duration: .8 });
            head.__shown = true;
          }
        });
        ST.create({
          trigger: stage, pin: true, start: 'top top', end: '+=150%', scrub: .6,
          anticipatePin: 1, invalidateOnRefresh: true, animation: tl
        });
        return function () { setP(1); };
      });

      mm.add('(max-width: 899px) and (prefers-reduced-motion: no-preference)', function () {
        setP(0);
        gsap.set(theses, { opacity: 0, y: 24 });
        ST.create({
          trigger: frame, start: 'top 70%', once: true,
          onEnter: function () {
            var o = { p: 0 };
            gsap.to(o, { p: 1, duration: 2.4, ease: 'power2.inOut', onUpdate: function () { setP(o.p); } });
          }
        });
        ST.create({ trigger: stage.querySelector('.theses'), start: 'top 85%', once: true, onEnter: function () { gsap.to(theses, { opacity: 1, y: 0, stagger: .15, duration: .9, ease: 'expo.out' }); } });
      });

      mm.add('(prefers-reduced-motion: reduce)', function () {
        stage.classList.add('is-static'); setP(1);
        return function () { stage.classList.remove('is-static'); };
      });
    }
  };
})();
