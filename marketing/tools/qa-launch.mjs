// Local launch checks. No live backend writes, confirmations or analytics.
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { start } from './serve.mjs';
const engines = { chromium, firefox, webkit };
const name = process.env.QA_BROWSER ?? 'chromium';
assert.ok(engines[name], `Unsupported browser: ${name}`);
const port = Number(process.env.QA_PORT ?? 4173);
const base = `http://localhost:${port}/`;
const server = await start(port);
let browser;
const checks = [];
try {
  browser = await engines[name].launch();
  for (const width of [1440, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.route(/supabase\.co/, (route) => route.fulfill({ status: 201, body: '{}' }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('h1').count(), 1);
    assert.deepEqual(await page.locator('a[href^="#"]').evaluateAll((links) => links.filter((a) => !document.getElementById(a.hash.slice(1))).map((a) => a.hash)), []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    await page.locator('#email').fill('launch-qa@example.com');
    await page.locator('#waitlist-submit').click();
    await page.waitForFunction(() => document.querySelector('#early-access').dataset.done === 'true');
    assert.equal(await page.locator('#waitlist-success').isVisible(), true);
    // Enlarged text catches content loss beyond the standard viewport check.
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    checks.push(`${width}px: anchors, heading, overflow, axe, signup and 200% text passed`);
    await context.close();
  }
  for (const mode of ['no-js', 'failed-module']) {
    const context = await browser.newContext({ javaScriptEnabled: mode !== 'no-js', viewport: { width: 390, height: 844 } });
    await context.route(/supabase\.co/, (route) => route.abort());
    if (mode === 'failed-module') await context.route('**/js/waitlist.js', (route) => route.abort());
    const page = await context.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#email').isDisabled(), true);
    assert.equal(await page.locator('#waitlist-submit').isDisabled(), true);
    assert.match(await page.locator('#waitlist-status').textContent(), /reload/);
    assert.equal(await page.locator('#creator h2').isVisible(), true);
    checks.push(`${mode}: content readable; inactive signup explains recovery`);
    await context.close();
  }
} finally {
  await browser?.close();
  server.close();
  console.log(JSON.stringify({ browser: name, checks }, null, 2));
}
