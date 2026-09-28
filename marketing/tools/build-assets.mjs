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

await mkdir(path.join(out, 'ui'), { recursive: true });
await mkdir(path.join(out, 'brand'), { recursive: true });
await mkdir(path.join(site, 'assets/fonts'), { recursive: true });

for (const [name, src] of screens) {
  if (!existsSync(src)) {
    console.warn('missing source, skipped:', src);
    continue;
  }
  for (const w of widths) {
    const base = sharp(src).resize({ width: w });
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

// Open Graph / social card: official brand mark, tagline and a real screen.
const brandMark = await sharp(path.join(site, 'assets/icon.png')).resize(64, 64).png().toBuffer();
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

  <text x="72" y="150" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="20" letter-spacing="3" fill="#a78bfa">TURN INTENTIONS INTO REAL PROGRESS</text>
  <text x="72" y="270" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="88" fill="#fff">YOU SAID</text>
  <text x="72" y="360" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="88" fill="#fff">YOU'D DO IT.</text>
  <text x="72" y="450" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="88" fill="#6365f1">NOW PROVE IT.</text>
  <text x="72" y="560" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#9898a4">Commit. Do the work. Prove it. Progress.</text>
</svg>`;
await sharp(Buffer.from(svg))
  .composite([{ input: phone, left: 860, top: 25 }, { input: brandMark, left: 72, top: 32 }])
  .png()
  .toFile(path.join(out, 'brand/og-image.png'));
console.log('og-image');
