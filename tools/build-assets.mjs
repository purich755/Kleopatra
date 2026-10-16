// Сборка картинок сайта из raw/photos (галерея Яндекс Карт) в assets/img/<папка>/ — WebP.
//   node tools/build-assets.mjs
// Крупные кадры — до 1600 px, остальные — до 900 px, качество ~80 (понижаем, пока файл тяжелее лимита).
import sharp from 'sharp';
import fs from 'node:fs';

const OUT = 'assets/img';
const src = (id) => `raw/photos/${id}.jpg`;

// [путь без расширения, источник, { w, h, position } | { long }, alt]
const PLAN = [
  ['interior/hero-team', 'ya072', { w: 1200, h: 1500, position: 'centre' }, 'Команда студии KLEOPATRA в красном и чёрном на бархатном диване'],
  ['interior/hero-team-sm', 'ya072', { w: 720, h: 940, position: 'centre' }, ''],


  ['body/laser-beam', 'ya091', { w: 900, h: 1120, position: 'centre' }, 'Процедура лазерной эпиляции голеней: насадка аппарата с розовым свечением'],
  ['body/candles', 'ya002', { w: 820, h: 1160, position: 'centre' }, 'Массажный кабинет со свечами в нишах: мастер делает массаж спины'],
  ['body/tea', 'ya167', { w: 900, h: 900, position: 'attention' }, 'Чай в золотой чашке, пирожные и фрукты для гостей'],

  // плавающие арки указателя: 260×340 на экране, файл вдвое больше
  ['works/svc-nails', 'ya147', { w: 520, h: 680 }, 'Нежно-розовый маникюр, рука на шёлке с жемчугом'],
  ['works/svc-lashes', 'ya161', { w: 520, h: 680, position: 'attention' }, 'Наращённые ресницы, крупный план глаза'],
  ['works/svc-brows', 'ya011', { w: 520, h: 680, position: 'attention' }, 'Мастер оформляет брови гостье'],
  ['body/svc-body', 'ya001', { w: 520, h: 680, position: 'attention' }, 'Массаж шеи и плеч'],
  ['body/svc-cosmo', 'ya055', { w: 520, h: 680, position: 'attention' }, 'Уход за лицом в кабинете косметолога'],
  ['works/svc-hair', 'ya179', { w: 520, h: 680 }, 'Длинные гладкие волосы после кератинового выпрямления'],
  ['works/svc-pmu', 'ya102', { w: 520, h: 680, position: 'attention' }, 'Перманентный макияж губ'],
  ['works/svc-piercing', 'ya013', { w: 520, h: 680, position: 'attention' }, 'Аккуратный прокол мочки уха с золотой серьгой'],
  ['works/svc-makeup', 'ya160', { w: 520, h: 680, position: 'attention' }, 'Визажист завершает макияж'],

  // «Одним днём»
  ['works/day-hands', 'ya146', { w: 640, h: 820, position: 'attention' }, 'Синий маникюр, рука с красной лентой'],
  ['works/day-feet', 'ya097', { w: 640, h: 820, position: 'attention' }, 'Мастер делает педикюр в общем зале'],
  ['works/day-lashes', 'ya053', { w: 640, h: 820, position: 'attention' }, 'Наращивание ресниц'],
  ['body/day-laser', 'ya103', { w: 640, h: 820, position: 'attention' }, 'Лазерная эпиляция рук, гостья в защитных очках'],
  ['body/day-massage', 'ya026', { w: 640, h: 820, position: 'attention' }, 'Массаж спины'],

  // коллаж «Пространство»
  ['interior/c-cabinet', 'ya081', { w: 900, h: 1120 }, 'Светлый кабинет с кушеткой и растениями на окне'],
  ['interior/c-laser', 'ya098', { w: 760, h: 960 }, 'Кабинет лазерной эпиляции'],
  ['interior/c-cryo', 'ya112', { w: 640, h: 820 }, 'Аппарат для криолиполиза в кабинете'],
  ['interior/c-hall', 'ya085', { w: 900, h: 720, position: 'centre' }, 'Кабинет с креслом, кольцевой лампой и аппаратом'],
  ['interior/c-wall', 'ya070', { w: 900, h: 600 }, 'Меловая стена «Добро пожаловать в студию красоты и лазерной эпиляции KLEOPATRA»']
];

// Лента галереи: миниатюра (длинная сторона 640) + кадр для лайтбокса (до 1600)
const GALLERY = {
  interior: [
    ['ya081', 'Кабинет с кушеткой'], ['ya098', 'Кабинет лазерной эпиляции'], ['ya085', 'Кабинет аппаратной косметологии'],
    ['ya093', 'Аппарат криолиполиза у окна'], ['ya166', 'Общий зал'], ['ya002', 'Массажная со свечами'],
    ['ya070', 'Меловая стена у входа'], ['ya149', 'Вход в студию с улицы, пр. Ямашева, 90']
  ],
  works: [
    ['ya010', 'Синий маникюр'], ['ya012', 'Нюдовый маникюр с золотом'], ['ya125', 'Красный маникюр'],
    ['ya147', 'Розовый маникюр'], ['ya161', 'Наращённые ресницы'], ['ya011', 'Брови и макияж'],
    ['ya102', 'Перманент губ'], ['ya203', 'Кератиновое выпрямление'], ['ya023', 'Стрижка каре'],
    ['ya013', 'Прокол мочки'], ['ya185', 'Красный маникюр, короткая длина'], ['ya156', 'Серый маникюр']
  ],
  team: [
    ['ya009', 'Команда студии'], ['ya154', 'Команда на ступенях'],
    ['ya005', 'Мастер в массажном кабинете'], ['ya078', 'Мастер лазерной эпиляции у аппарата'], ['ya123', 'Косметолог за работой'],
    ['ya169', 'Колорист за работой']
  ]
};
const galleryOut = [];
for (const [cat, list] of Object.entries(GALLERY)) {
  const dir = cat === 'interior' ? 'interior' : cat === 'team' ? 'team' : 'works';
  list.forEach(([id, alt], i) => {
    const n = `${dir}/g-${cat}-${String(i + 1).padStart(2, '0')}`;
    PLAN.push([`${n}-t`, id, { long: 640 }, alt]);
    PLAN.push([n, id, { long: 1600 }, alt]);
    galleryOut.push({ cat, base: n, alt, src: id });
  });
}

async function encode(pipe, name, limit) {
  for (const q of [80, 76, 72, 68, 62, 56]) {
    const buf = await pipe.clone().webp({ quality: q, effort: 5 }).toBuffer();
    if (buf.length <= limit || q === 56) { fs.writeFileSync(`${OUT}/${name}.webp`, buf); return [buf.length, q]; }
  }
}

for (const d of ['interior', 'works', 'team', 'body']) fs.mkdirSync(`${OUT}/${d}`, { recursive: true });
const manifest = {};
for (const [name, id, m, alt] of PLAN) {
  let p = sharp(src(id)).rotate();
  if (m.long) p = p.resize(m.long, m.long, { fit: 'inside', withoutEnlargement: true });
  else p = p.resize(m.w, m.h, { fit: 'cover', position: m.position || 'centre', kernel: 'lanczos3', withoutEnlargement: false });
  const big = (m.long || Math.max(m.w, m.h)) > 1000;
  const [size, q] = await encode(p, name, big ? 260 * 1024 : 110 * 1024);
  const meta = await sharp(`${OUT}/${name}.webp`).metadata();
  manifest[name] = { src: id, w: meta.width, h: meta.height, kb: Math.round(size / 1024), q, alt };
  console.log(name.padEnd(30), id, `${meta.width}x${meta.height}`, `${Math.round(size / 1024)}КБ q${q}`);
}
fs.writeFileSync('raw/manifest.json', JSON.stringify(manifest, null, 1));
fs.writeFileSync('raw/gallery.json', JSON.stringify(galleryOut.map((g) => ({ ...g, w: manifest[g.base].w, h: manifest[g.base].h, tw: manifest[g.base + '-t'].w, th: manifest[g.base + '-t'].h })), null, 1));
const total = Object.values(manifest).reduce((a, m) => a + m.kb, 0);
console.log('итого', Object.keys(manifest).length, 'файлов,', total, 'КБ');
