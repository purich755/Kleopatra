// Крупный лист выбранных кадров: node tools/pick-sheet.mjs out.jpg ya009 ya021 ...
import sharp from 'sharp'; import fs from 'node:fs';
const [out, ...ids] = process.argv.slice(2);
const COLS = Math.min(4, ids.length), CELL = 420;
const comps = [];
for (let i = 0; i < ids.length; i++) {
  const f = fs.existsSync(`raw/photos/${ids[i]}.jpg`) ? `raw/photos/${ids[i]}.jpg` : ids[i];
  const m = await sharp(f).rotate().metadata();
  const buf = await sharp(f).rotate().resize(CELL, CELL, { fit: 'contain', background: '#222' }).jpeg({ quality: 80 }).toBuffer();
  const x = (i % COLS) * CELL, y = Math.floor(i / COLS) * (CELL + 22);
  comps.push({ input: buf, left: x, top: y + 22 });
  comps.push({ input: Buffer.from(`<svg width="${CELL}" height="22"><rect width="${CELL}" height="22" fill="#111"/><text x="4" y="16" font-family="monospace" font-size="14" fill="#0f0">${ids[i]} ${m.autoOrient?.width ?? m.width}x${m.autoOrient?.height ?? m.height}</text></svg>`), left: x, top: y });
}
await sharp({ create: { width: COLS * CELL, height: Math.ceil(ids.length / COLS) * (CELL + 22), channels: 3, background: '#000' } }).composite(comps).jpeg({ quality: 82 }).toFile(out);
console.log('✓', out);
