/* «Секреты Клеопатры»: конверты с сургучными печатями. Печать вскрывается один раз — как настоящая. */
(function () {
  'use strict';
  var M = window.KLEO_M = window.KLEO_M || {};
  var K = window.KLEO;

  // неровный край сургуча — заранее посчитанный сплайн (tools: raw/seal-path.txt)
  var EDGE = 'M93.9 50C93.9 52.8 93.9 55.6 93.1 58.3C92.4 61.1 90.8 63.9 89.6 66.5C88.3 69.1 87.3 71.6 85.9 74.1C84.5 76.6 82.6 79.2 80.6 81.1C78.7 83 76.4 84.2 74.2 85.6C72 87 69.8 88.6 67.4 89.6C65 90.6 62.5 91.1 59.9 91.6C57.3 92.2 54.5 92.9 51.9 93C49.3 93.1 46.7 92.6 44.2 92.2C41.7 91.8 39.1 91.4 36.6 90.6C34.2 89.8 31.8 88.4 29.6 87.1C27.3 85.8 25.1 84.3 23.1 82.6C21.1 80.9 19.2 79 17.6 76.9C16 74.8 14.6 72.5 13.4 70.1C12.2 67.7 11.2 65.2 10.4 62.6C9.6 60 9 57.3 8.8 54.6C8.5 51.9 8.6 49.2 8.9 46.5C9.1 43.8 9.6 41.2 10.4 38.6C11.1 36.1 12.3 33.7 13.5 31.4C14.8 29 16.2 26.7 17.9 24.6C19.6 22.6 21.6 20.7 23.6 19C25.6 17.4 27.6 15.8 30 14.4C32.4 13 35.3 11.7 37.8 10.8C40.4 9.9 42.8 9.6 45.4 9.3C48 9 50.6 8.6 53.2 8.8C55.8 9.1 58.4 9.9 61 10.6C63.5 11.3 66.1 11.8 68.4 13.1C70.7 14.4 72.7 16.5 74.8 18.2C76.9 19.9 79.3 21.4 81.1 23.4C82.9 25.4 84.4 27.9 85.7 30.3C86.9 32.6 87.8 35.1 88.9 37.6C89.9 40.1 91.4 42.6 92.2 45.1C93 47.6 93.9 47.2 93.9 50Z';

  function sealSvg(n) {
    var g = 'wax' + n;
    return '<svg class="env-seal" viewBox="0 0 100 100" aria-hidden="true">' +
      '<defs><radialGradient id="' + g + '" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#A8303B"/><stop offset=".65" stop-color="#8E1F2A"/><stop offset="1" stop-color="#5E1119"/></radialGradient></defs>' +
      '<path d="' + EDGE + '" fill="url(#' + g + ')"/>' +
      '<circle cx="50" cy="50" r="31" fill="none" stroke="#5E1119" stroke-width="2.4" opacity=".7"/>' +
      '<circle cx="50" cy="50" r="31" fill="none" stroke="#E2C48E" stroke-width=".8" opacity=".55"/>' +
      '<svg x="38.5" y="31.5" width="23" height="36" viewBox="0 0 64 100" fill="#E2C48E"><use href="#mono"/></svg>' +
      '<path class="crack" d="M22 30 L38 44 L33 52 L50 60 L46 68 L70 80"/>' +
    '</svg>';
  }

  M.secrets = {
    render: function () {
      var ul = document.querySelector('[data-envelopes]'); if (!ul) return;
      var esc = window.KLEO_UI.esc;
      ul.innerHTML = K.secrets.map(function (s, i) {
        return '<li><button type="button" class="env" aria-expanded="false">' +
          '<span class="env-flap" aria-hidden="true"></span>' + sealSvg(i) +
          '<span class="env-body"><span class="env-n">Секрет № ' + (i + 1) + '</span>' +
          '<span class="env-txt"><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></span></span>' +
        '</button></li>';
      }).join('');
    },
    init: function () {
      var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
      Array.prototype.forEach.call(document.querySelectorAll('.env'), function (env) {
        function open() {
          if (env.classList.contains('is-open')) return;
          env.classList.add('is-open');
          env.setAttribute('aria-expanded', 'true');
        }
        env.addEventListener('click', open);
        if (fine) env.addEventListener('mouseenter', function () { clearTimeout(env.__t); env.__t = setTimeout(open, 180); });
        if (fine) env.addEventListener('mouseleave', function () { clearTimeout(env.__t); });
      });
    }
  };
})();
