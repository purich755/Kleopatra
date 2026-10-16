// Клик-тесты интерактива: node tools/interact.mjs [--w 1440]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i === -1 ? d : process.argv[i + 1]; };
const W = +arg('w', '1440'), H = W < 700 ? 844 : 900;
const URL = arg('url', 'http://localhost:8720/');
const b = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: W < 700, hasTouch: W < 700, locale: 'ru-RU' });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await p.addInitScript(() => sessionStorage.setItem('kleo-intro', '1'));
await p.goto(URL, { waitUntil: 'load' });
await p.waitForTimeout(1200);
fs.mkdirSync('raw/shots', { recursive: true });
let ok = 0, fail = 0;
const check = (name, cond, info = '') => { cond ? ok++ : fail++; console.log((cond ? '✓ ' : '✗ ') + name + (info ? '  — ' + info : '')); };
const go = async (sel, off = 0) => { await p.evaluate(([s, o]) => { const el = document.querySelector(s); const l = window.__kleo && window.__kleo.lenis; const y = el.getBoundingClientRect().top + scrollY - o; l ? l.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); }, [sel, off]); await p.waitForTimeout(700); };
const click = async (sel) => { const el = p.locator(sel).first(); await p.evaluate((s) => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); if (r.top > 100 && r.bottom < innerHeight - 40) return; const l = window.__kleo && window.__kleo.lenis; const y = r.top + scrollY - innerHeight / 2 + r.height / 2; l ? l.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); }, sel); await p.waitForTimeout(450); const bb = await el.boundingBox(); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(250); };
const text = (sel) => p.evaluate((s) => document.querySelector(s)?.textContent.replace(/\s+/g, ' ').trim(), sel);
const odo = (sel) => p.evaluate((s) => [...document.querySelector(s).children].map((c) => c.classList.contains('odo-d') ? Math.round(-parseFloat(c.firstChild.style.transform.match(/-?[\d.]+/)[0]) / 10) : '').join(''), sel);

// --- конструктор
await go('#zones', 80);
await click('.chip[data-zone="bikinid"]');
await click('.chip[data-zone="armpits"]');
await p.waitForTimeout(1200);
check('бикини глубокое + подмышки = 2 826', (await odo('[data-odo="total"]')) === '2826', await odo('[data-odo="total"]'));
check('плашка «Комплекс 1»', /Комплекс 1.*10%/.test(await text('[data-complex]')), await text('[data-complex]'));
await click('.chip[data-zone="legs"]');
await p.waitForTimeout(1200);
check('+ ноги полностью = 5 728', (await odo('[data-odo="total"]')) === '5728', await odo('[data-odo="total"]'));
check('плашка «Комплекс 3 … 5 728 вместо 7 160»', /Комплекс 3.*20%.*5\s728.*7\s160/.test(await text('[data-complex]')), await text('[data-complex]'));
check('старая сумма зачёркнута', await p.evaluate(() => !document.querySelector('[data-check-old]').hidden));
const wa = await p.getAttribute('[data-wa]', 'href');
check('ссылка WhatsApp с текстом', wa.startsWith('https://wa.me/79274108889?text=') && decodeURIComponent(wa).includes('бикини глубокое'), decodeURIComponent(wa).slice(0, 120));
check('aria-pressed у чипа', (await p.getAttribute('.chip[data-zone="legs"]', 'aria-pressed')) === 'true');
check('зона на силуэте подсвечена', await p.evaluate(() => document.querySelector('.zone[data-zone="legs"]').classList.contains('is-on')));
await click('.chip[data-zone="shins"]');
await p.waitForTimeout(900);
check('лишняя зона — комплекса нет', await p.evaluate(() => document.querySelector('[data-complex]').hidden));
await p.screenshot({ path: `raw/shots/i${W}-zones.png` });
// клик по силуэту
if (W >= 700) {
  const z = p.locator('.zone[data-zone="back"] rect').first();
  const bb = await z.boundingBox();
  await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height * .2);
  await p.waitForTimeout(300);
  check('клик по силуэту выбирает зону', (await p.getAttribute('.chip[data-zone="back"]', 'aria-pressed')) === 'true');
}
await click('.toggle-b[data-sex="him"]');
await p.waitForTimeout(500);
check('мужской прайс: 12+ чипов, выбор сброшен', await p.evaluate(() => document.querySelectorAll('.chip').length === 22 && !document.querySelector('.chip[aria-pressed="true"]')));
await click('.chip[data-zone="back"]');
await p.waitForTimeout(1000);
check('спина полностью (м) = 2 999', (await odo('[data-odo="total"]')) === '2999');

// --- криолиполиз
await go('#sculpt', 0);
const prices = [];
for (let k = 1; k <= 5; k++) {
  await p.evaluate((k) => { const i = document.querySelector('#cryo-range'); i.value = k; i.dispatchEvent(new Event('input')); }, k);
  await p.waitForTimeout(900);
  prices.push(await odo('[data-odo="cryo"]'));
}
check('криолиполиз 1500/2900/4300/5500/7000', prices.join('/') === '1500/2900/4300/5500/7000', prices.join('/'));
await p.focus('#cryo-range');
await p.keyboard.press('ArrowLeft');
await p.waitForTimeout(900);
check('ползунок с клавиатуры', (await odo('[data-odo="cryo"]')) === '5500');

// --- указатель
await go('#services', 0);
await click('.idx[data-svc="lashes"] .idx-row');
await p.waitForTimeout(900);
check('аккордеон открылся', await p.evaluate(() => document.querySelector('#svc-lashes').offsetHeight > 60));
check('цена «от 1 200» у маникюра', /от\s1\s200/.test(await text('.idx[data-svc="nails"] .idx-price')));

// --- печати
await go('#secrets', 0);
await click('.env');
await p.waitForTimeout(1300);
check('печать вскрыта', await p.evaluate(() => document.querySelector('.env').classList.contains('is-open') && document.querySelector('.env').getAttribute('aria-expanded') === 'true'));
await p.focus('.envelopes li:nth-child(2) .env');
await p.keyboard.press('Enter');
await p.waitForTimeout(300);
check('печать с клавиатуры', await p.evaluate(() => document.querySelectorAll('.env.is-open').length >= 2));

// --- лайтбокс
await go('.strip-head', 100);
await click('.strip-item button');
await p.waitForTimeout(1000);
check('лайтбокс открыт', await p.evaluate(() => !document.querySelector('[data-lb]').hidden));
check('счётчик 01 / 08', (await text('.lb-count')) === '01 / 08', await text('.lb-count'));
await p.screenshot({ path: `raw/shots/i${W}-lightbox.png` });
await p.keyboard.press('ArrowRight');
await p.waitForTimeout(800);
check('стрелка вправо → 02', (await text('.lb-count')) === '02 / 08');
await click('.lb-prev');
await p.waitForTimeout(800);
check('кнопка назад → 01', (await text('.lb-count')) === '01 / 08');
await p.keyboard.press('Tab');
check('фокус внутри диалога', await p.evaluate(() => !!document.activeElement.closest('[data-lb]')));
await p.keyboard.press('Escape');
await p.waitForTimeout(900);
check('Esc закрыл', await p.evaluate(() => document.querySelector('[data-lb]').hidden));
check('фокус вернулся на миниатюру', await p.evaluate(() => !!document.activeElement.closest('.strip-item')));
await click('.tab[data-tab="works"]');
await p.waitForTimeout(1000);
check('таб «Работы»: 12 кадров', await p.evaluate(() => document.querySelectorAll('.strip-item').length === 12));

// --- меню (мобильная ширина)
if (W < 1100) {
  await p.evaluate(() => scrollTo(0, 0));
  await click('.hdr-burger');
  await p.waitForTimeout(500);
  check('меню открыто', await p.evaluate(() => !document.querySelector('#menu').hidden));
  await click('#menu a[href="#masters"]');
  await p.waitForTimeout(1800);
  check('меню закрылось и доехало до мастеров', await p.evaluate(() => document.querySelector('#menu').hidden && Math.abs(document.querySelector('#masters').getBoundingClientRect().top) < 140));
}

const sw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
check('нет горизонтального скролла', sw <= 0, String(sw));
check('ошибок консоли нет', errors.length === 0, errors.join(' | '));
console.log(`\n${ok} ✓  ${fail} ✗`);
await b.close();
process.exit(fail ? 1 : 0);
