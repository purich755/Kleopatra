// Добавляет в raw/ya-photos.json прямые ссылки из брифа (фото из отзывов, логотип), без дублей.
import fs from 'node:fs';
const brief = `13206609/2a0000018f2f80d4927156919eb414498471 logo
6406681/2a00000181251c1cd93e98d7074d8ab6a54b
5232541/2a000001816302ad5670d63db7511eb70097
19519244/2a0000019c36fd97704bbb68e4c0469494b6 r
19646909/2a0000019c36fd6e28f91e48ca287f134ddb r
19582126/2a0000019cec6bce5af270afd1005ec2fb12 r
19902702/2a0000019cec6c1091199ff72d1a4e142ad4 r
13482651/2a0000019301e9f26f5ab88bc7254eec5720 r
14193233/2a0000019301e9f2769cc05a2e06f9a1f144 r
14306621/2a00000192d49ee048f662dc1c40f3ced3bc r
11395677/2a0000018d3fb2975211c4e003c00c0eacb8 r
10878016/2a0000018d1c5cd96991c2722282b87cf296 r
10963046/2a0000018d1c5d21d0f628b5c5ba4c0a1c6e r
11406796/2a0000018d1c5d57a4cd225830e3a103e3b6 r
1439437/2a0000018d1c5cfe2e64180ec1d2970a5386 r
18098886/2a0000019cc8154d52cdec0171ca1aeef98b r
16420800/2a0000019cd3e93354a163e36dea6d1f02d4 r
20840442/2a000001a039d3c3f99ff952409d7991cf2c r
13951679/2a00000195bdda5cf0b61fead0bb5e7fdefc keratin
14381528/2a00000195bdda88b1804605f39d8d824d20 keratin`;
const list = JSON.parse(fs.readFileSync('raw/ya-photos.json', 'utf8'));
const have = new Set(list.map((p) => p.base.split('/').slice(-2, -1)[0]));
let add = 0;
for (const line of brief.split('\n')) {
  const [path, tag] = line.trim().split(' ');
  const key = path.split('/')[1];
  if (have.has(key)) { list.find((p) => p.base.includes(key)).tag = tag || 'brief'; continue; }
  list.push({ base: `https://avatars.mds.yandex.net/get-altay/${path}/`, tag: tag || 'brief' }); add++;
}
fs.writeFileSync('raw/ya-photos.json', JSON.stringify(list, null, 2));
console.log('добавлено', add, 'всего', list.length);
