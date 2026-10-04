import { cp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { packager } from '@electron/packager';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const stage = path.resolve('desktop-stage');
await mkdir(stage, { recursive: true });
await cp('dist', path.join(stage, 'dist'), { recursive: true });
await cp('desktop/main.cjs', path.join(stage, 'main.cjs'));
await writeFile(path.join(stage, 'package.json'), JSON.stringify({
  name: 'kukirin-tuner-desktop', productName: 'KuKirin Tuner', version: '1.0.57', main: 'main.cjs',
}));
const builds = await packager({ dir: stage, out: 'desktop-release', name: 'KuKirin Tuner',
  platform: 'win32', arch: 'x64', electronVersion: require('electron/package.json').version,
  asar: true, overwrite: true, prune: false, win32metadata: { ProductName: 'KuKirin Tuner', FileDescription: 'KuKirin Tuner scooter game' },
});
await writeFile(path.join(builds[0], 'ALUSTA.txt'),
  'KuKirin Tuner - Windows 64-bit\r\n\r\nAva KuKirin Tuner.exe. Hoia kogu kausta sisu koos.\r\nMangu saab mangida ilma internetita. W: gaas. S: tagapidur. Space: wheelie. Q/E: tasakaal treeningus.\r\nF11: taisekraan. Alt+Left: tagasi.\r\nSalvestused hoitakse Windowsi kasutaja AppData kaustas. Brauseri ja Androidi salvestus ei kandu automaatselt ule.\r\n');
console.log(builds[0]);
