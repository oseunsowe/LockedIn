// Interaction QA for the tappable phones: real touch taps on mobile, full loop, hotspot alignment.
//   QA_OUT=<dir> node qa-demo.mjs
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { start } from './serve.mjs';

const out = process.env.QA_OUT ?? 'qa-output';
await mkdir(out, { recursive: true });
const server = await start(4173);
const browser = await chromium.launch();
const checks = [];
const check = (name, pass, detail = '') => checks.push({ name, pass, detail });

async function run(label, contextOptions) {
  const context = await browser.newContext(contextOptions);
  await context.route(/supabase\.co/, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
  await page.goto(process.env.BASE ?? 'http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.demo-hot{outline:2px solid #22ff88 !important;outline-offset:0}' });

  const phone = page.locator('.step-phone').first();
  await phone.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500); // warm-up + scroll-in
  const hot = phone.locator('.demo-hot');
  check(`${label}: hotspot present`, (await hot.count()) === 1);

  const currentSrc = () => phone.locator('.demo-layer.is-current img').getAttribute('src');
  const seen = [await currentSrc()];
  for (let i = 0; i < 6; i++) {
    await phone.screenshot({ path: path.join(out, `demo-${label}-${i}.png`) });
    if (contextOptions.hasTouch) await hot.tap(); else await hot.click();
    await page.waitForTimeout(i === 0 ? 200 : 700);
    if (i === 0) await phone.screenshot({ path: path.join(out, `demo-${label}-mid.png`) });
    await page.waitForTimeout(600);
    seen.push(await currentSrc());
  }
  check(`${label}: six taps visit six different screens`, new Set(seen.slice(0, 6)).size === 6, seen.map((s) => s.match(/LIM-UI-\d+/)[0]).join(' > '));
  check(`${label}: loop returns to the start screen`, seen[6] === seen[0]);
  check(`${label}: no script errors`, errors.length === 0, errors.join(' | '));
  const layers = await phone.locator('.demo-layer.is-current').count();
  check(`${label}: exactly one visible screen after taps`, layers === 1);
  await context.close();
}

await run('mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await run('reduced', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
await run('desktop', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });

await browser.close();
server.close();
console.log(JSON.stringify(checks, null, 2));
if (checks.some((c) => !c.pass)) process.exitCode = 1;
