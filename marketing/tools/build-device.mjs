// Builds the real iPhone 17 Pro Max device frame used around every product screen on the landing
// page, from the supplied transparent mockup (assets/iPhone figma/extra/...).  npm run device
// Prints the screen-opening geometry that css/landing.css uses (percentages of the frame).
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const source = path.join(repo, 'assets/iPhone figma/extra/mockup-apple-iphone-17-pro-max-2025-transparent.png');
const outDir = path.join(repo, 'marketing/lockedinmissions/assets/lockedin/devices');
await mkdir(outDir, { recursive: true });

const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const alpha = (x, y) => data[(y * W + x) * 4 + 3];

// Flood-fill the transparent screen opening from the centre of the frame.
const seen = new Uint8Array(W * H);
const stack = [[Math.floor(W / 2), Math.floor(H / 2)]];
let minX = W, maxX = 0, minY = H, maxY = 0, count = 0;
while (stack.length) {
  const [x, y] = stack.pop();
  if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x] || alpha(x, y) > 40) continue;
  seen[y * W + x] = 1;
  count++;
  if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}
const holeW = maxX - minX + 1;
const holeH = maxY - minY + 1;

// Corner radius: how far down the top edge the opening takes to reach its full width.
let radius = 0;
for (let y = minY; y <= maxY; y++) {
  let left = -1;
  for (let x = minX; x <= maxX; x++) if (seen[y * W + x]) { left = x; break; }
  if (left - minX <= 1) { radius = y - minY; break; }
}

const geometry = {
  frame: `${W}x${H}`,
  aspect: `${W} / ${H}`,
  leftPct: +(((minX) / W) * 100).toFixed(3),
  topPct: +(((minY) / H) * 100).toFixed(3),
  widthPct: +((holeW / W) * 100).toFixed(3),
  heightPct: +((holeH / H) * 100).toFixed(3),
  radiusPctOfHoleWidth: +((radius / holeW) * 100).toFixed(2),
  holeAspect: +(holeW / holeH).toFixed(4),
  holeAreaPct: +((count / (holeW * holeH)) * 100).toFixed(1),
};
console.log(JSON.stringify(geometry, null, 2));

// Hi-res frame (the source is only 389px wide): Lanczos upscale with a light sharpen so bezel
// edges stay crisp on retina screens. 1x = 440w, 2x = 880w.
for (const width of [440, 880]) {
  const base = sharp(source).resize({ width, kernel: 'lanczos3' }).sharpen({ sigma: 0.6 });
  await base.clone().webp({ quality: 92, alphaQuality: 100 }).toFile(path.join(outDir, `iphone-17-pro-max-${width}.webp`));
}
console.log('frame written to', outDir);
