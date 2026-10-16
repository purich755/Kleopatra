// Открытие двойным кликом: страница с file:// без ошибок и с рабочим интерактивом.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const e = [];
p.on('pageerror', (x) => e.push(x.message));
p.on('console', (m) => m.type() === 'error' && e.push(m.text()));
await p.goto(pathToFileURL(path.resolve('index.html')).href, { waitUntil: 'load' });
await p.waitForTimeout(2500);
const r = await p.evaluate(() => ({
  chips: document.querySelectorAll('.chip').length,
  slines: document.querySelectorAll('.sline').length,
  lenis: !!(window.__kleo && window.__kleo.lenis),
  broken: [...document.images].filter((i) => i.complete && i.src && i.naturalWidth === 0).map((i) => i.src)
}));
console.log('file://', JSON.stringify(r), 'ошибки:', e.length ? e.join(' | ') : 'нет');
await b.close();
