// Product storytelling checks: real scrolling, preference changes and static fallbacks.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import { start } from './serve.mjs';

const out = process.env.QA_OUT ?? '/tmp/lockedin-journey-qa';
await mkdir(out, { recursive: true });
const server = await start(4173);
let browser;
const checks = [];
function check(name, pass) {
  checks.push({ name, pass });
  if (!pass) throw new Error(name);
}
try {
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.route(/supabase\.co/, (route) => route.fulfill({ status: 204 }));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  for (const section of ['how', 'proof']) {
    for (const index of [0, 1, 2, 1, 0]) {
      const step = page.locator(`#${section} .step`).nth(index);
      await step.evaluate((el) => {
        window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 100, behavior: 'instant' });
      });
      await page.waitForFunction(({ section, index }) => document.querySelector(`#${section} .product-rail`)?.dataset.activeStep === String(index), { section, index });
      await page.waitForTimeout(400);
      const phone = page.locator(`#${section} .product-sticky .phone`);
      const bounds = await phone.boundingBox();
      check(`${section} step ${index} phone within viewport`, bounds.y >= 70 && bounds.y + bounds.height <= 900);
      check(`${section} step ${index} image decoded`, await page.locator(`#${section} .stage-screen.is-active img`).evaluate((img) => img.complete && img.naturalWidth > 0));
      if (index === 1) await page.screenshot({ path: `${out}/${section}-active.png` });
    }
  }
  const axe = await new AxeBuilder({ page }).analyze();
  check('enhanced desktop accessibility', axe.violations.length === 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => !document.querySelector('.journey-enhanced'));
  check('live reduced motion restores inline screen', await page.locator('#proof .step-phone').first().evaluate((el) => getComputedStyle(el).opacity === '1'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => !!document.querySelector('#proof .journey-enhanced'));
  check('motion can be re-enabled', true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => !document.querySelector('.journey-enhanced'));
  check('mobile retains static screens', await page.locator('#how .step-phone').first().evaluate((el) => getComputedStyle(el).opacity === '1'));
  await page.setViewportSize({ width: 1440, height: 600 });
  check('short desktop retains static screens', await page.locator('.product-rail').first().isHidden());
  check('no runtime errors', errors.length === 0);
  await context.close();

  // A failed replacement image must not hide the original static layout.
  const fallback = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await fallback.route(/supabase\.co/, (route) => route.fulfill({ status: 204 }));
  await fallback.route(/LIM-UI-005-intentions/, (route) => route.abort());
  const failedPage = await fallback.newPage();
  await failedPage.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await failedPage.locator('#how').scrollIntoViewIfNeeded();
  await failedPage.waitForTimeout(500);
  check('image failure preserves static journey', await failedPage.locator('#how .journey').evaluate((el) => !el.classList.contains('journey-enhanced')));
  await fallback.close();
} finally {
  await browser?.close();
  server.close();
  console.log(JSON.stringify(checks, null, 2));
}
