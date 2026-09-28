// Builds the landing page's optimised assets. Dev-only; the outputs are committed, this is not deployed.
//   npm run assets
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const site = path.join(repo, 'marketing/lockedinmissions');
const shots = path.join(repo, 'assets/iPhone figma');
const out = path.join(site, 'assets/lockedin');

// Canonical product screens (real app captures only - never regenerated or mocked up).
const screens = [
  ['LIM-UI-001-home', path.join(shots, 'IMG_6791.PNG')],
  ['LIM-UI-002-mission-board', path.join(shots, 'IMG_6790.PNG')],
  ['LIM-UI-003-mission-detail', path.join(shots, 'IMG_6792.PNG')],
  ['LIM-UI-004-focus', path.join(site, 'assets/screenshot-focus.png')],
  ['LIM-UI-005-intentions', path.join(shots, 'IMG_6796.PNG')],
  ['LIM-UI-006-scan-intro', path.join(shots, 'IMG_6794.PNG')],
  ['LIM-UI-011-verified', path.join(site, 'assets/screenshot-verified.png')],
  ['LIM-UI-012-level-up', path.join(site, 'assets/screenshot-levelup.png')],
];
const widths = [360, 720];

// iOS modal captures show a sliver of the presenting screen under the status bar, which reads as a
// glitch once the screen sits inside a device frame. Repaint just those rows with the modal's own
// flat background (product UI below the sliver is untouched; captures without one are unchanged).
const SLIVER_SCREENS = new Set(['LIM-UI-003-mission-detail', 'LIM-UI-005-intentions']);
async function cleanModalSliver(src) {
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const lum = (x, y) => {
    const i = (y * W + x) * C;
    return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  };
  const rowAvg = (y) => {
    let sum = 0, n = 0;
    for (let x = Math.round(W * 0.15); x < Math.round(W * 0.85); x += 4) { sum += lum(x, y); n++; }
    return sum / n;
  };
  const refY = Math.round(H * 0.118);
  const bg = rowAvg(refY);
  let painted = 0;
  for (let y = Math.round(H * 0.046); y < Math.round(H * 0.105); y++) {
    if (rowAvg(y) <= bg + 2.5) continue;
    for (let x = 0; x < W; x++) {
      const from = (refY * W + x) * C;
      const to = (y * W + x) * C;
      for (let c = 0; c < C; c++) data[to + c] = data[from + c];
    }
    painted++;
  }
  console.log('  sliver rows repainted:', painted);
  return sharp(data, { raw: { width: W, height: H, channels: C } }).png().toBuffer();
}

await mkdir(path.join(out, 'ui'), { recursive: true });
await mkdir(path.join(out, 'brand'), { recursive: true });
await mkdir(path.join(site, 'assets/fonts'), { recursive: true });

for (const [name, src] of screens) {
  if (!existsSync(src)) {
    console.warn('missing source, skipped:', src);
    continue;
  }
  const input = SLIVER_SCREENS.has(name) ? await cleanModalSliver(src) : src;
  for (const w of widths) {
    const base = sharp(input).resize({ width: w });
    await base.clone().avif({ quality: 55, effort: 5 }).toFile(path.join(out, 'ui', `${name}-${w}.avif`));
    await base.clone().webp({ quality: 82 }).toFile(path.join(out, 'ui', `${name}-${w}.webp`));
  }
  console.log('ui', name);
}

// Self-hosted variable fonts (latin subset): removes the render-blocking Google Fonts request.
const fonts = [
  ['@fontsource-variable/outfit', 'outfit-latin-wght-normal.woff2'],
  ['@fontsource-variable/inter', 'inter-latin-wght-normal.woff2'],
  ['@fontsource-variable/jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2'],
];
for (const [pkg, file] of fonts) {
  await copyFile(path.join(here, 'node_modules', pkg, 'files', file), path.join(site, 'assets/fonts', file));
  console.log('font', file);
}

// Open Graph / social card: text wordmark, tagline and a real screen.
const phone = await sharp(path.join(shots, 'IMG_6791.PNG'))
  .resize({ width: 250 })
  .extend({ top: 6, bottom: 6, left: 6, right: 6, background: '#2a2a3a' })
  .png()
  .toBuffer();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <radialGradient id="g" cx="78%" cy="45%" r="60%"><stop offset="0" stop-color="#3a2a8a" stop-opacity=".55"/><stop offset="1" stop-color="#050508" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#050508"/><rect width="1200" height="630" fill="url(#g)"/>
  <text x="72" y="92" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="44" letter-spacing="-1" fill="#fff">Locked<tspan fill="#6365f1">In</tspan></text>
  <text x="72" y="150" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="20" letter-spacing="3" fill="#a78bfa">TURN INTENTIONS INTO REAL PROGRESS</text>
  <text x="72" y="270" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="88" fill="#fff">YOU SAID</text>
  <text x="72" y="360" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="88" fill="#fff">YOU'D DO IT.</text>
  <text x="72" y="450" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="88" fill="#6365f1">NOW PROVE IT.</text>
  <text x="72" y="560" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#9898a4">Commit. Do the work. Prove it. Progress.</text>
</svg>`;
await sharp(Buffer.from(svg))
  .composite([{ input: phone, left: 860, top: 25 }])
  .png()
  .toFile(path.join(out, 'brand/og-image.png'));
console.log('og-image');
