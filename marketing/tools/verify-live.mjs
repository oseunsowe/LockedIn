// Loads the LIVE site in Chromium (Supabase blocked so no analytics/signup rows are written),
// checks the real iPhone frames load, and saves screenshots.  node verify-live.mjs <outDir>
import { chromium } from 'playwright';

const out = process.argv[2] ?? '.';
const browser = await chromium.launch();
const results = [];
for (const [name, width, height, mobile] of [['desktop', 1440, 900, false], ['mobile', 390, 844, true]]) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1, reducedMotion: 'reduce' });
  await context.route(/supabase\.co/, (route) => route.abort());
  const page = await context.newPage();
  const bad = [];
  page.on('response', (r) => { if (r.url().includes('lockedinmission.app') && r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await page.goto('https://lockedinmission.app/', { waitUntil: 'networkidle' });
  const frameLoaded = await page.evaluate(async () => {
    const after = getComputedStyle(document.querySelector('.phone'), '::after').backgroundImage;
    return after.includes('iphone-17-pro-max');
  });
  const phones = await page.locator('.phone').count();
  await page.screenshot({ path: `${out}/live-${name}.png` });
  results.push({ viewport: name, phonesOnPage: phones, frameImageApplied: frameLoaded, failedRequests: bad });
  await context.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
