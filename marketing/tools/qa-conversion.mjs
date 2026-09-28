// Conversion and attribution contracts; every backend request is mocked.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { start } from './serve.mjs';
const server = await start(4173);
let browser;
const passed = [];
try {
  browser = await chromium.launch();
  async function fixture({ stored, dnt = false } = {}) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await context.addInitScript(({ stored, dnt }) => {
      if (stored !== undefined) localStorage.setItem('lim_attribution', JSON.stringify(stored));
      if (dnt) Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' });
    }, { stored, dnt });
    const events = [], signups = [], emails = [];
    let mode = 'success';
    await context.route(/supabase\.co/, async (route) => {
      const url = route.request().url();
      const body = route.request().postDataJSON();
      if (url.includes('/landing_events')) events.push(body);
      if (url.includes('/send-waitlist-confirmation')) emails.push(body);
      if (url.includes('/waitlist_signups')) {
        signups.push(body);
        if (mode === 'stall') return; // Held until the client's deadline aborts it.
        if (mode === 'fallback' && signups.length === 1) return route.fulfill({ status: 400, json: { code: 'PGRST204' } });
        return route.fulfill({ status: 201, body: '{}' });
      }
      return route.fulfill({ status: 204 });
    });
    const page = await context.newPage();
    async function submit() {
      await page.locator('#email').fill('conversion-qa@example.com');
      await page.locator('#waitlist-submit').click();
    }
    return { context, page, events, signups, emails, submit, mode: (value) => { mode = value; } };
  }
  const f = await fixture();
  await f.page.goto('http://localhost:4173/?utm_source=creator&utm_campaign=launch');
  await f.page.locator('[data-track="hero_early_access_click"]').click();
  await f.page.waitForFunction(() => document.querySelector('#email') !== null);
  await f.page.goto('http://localhost:4173/?utm_source=second');
  await f.submit();
  await f.page.waitForFunction(() => document.querySelector('#early-access').dataset.done === 'true');
  assert.equal(f.signups[0].utm_source, 'creator');
  assert.equal(f.signups[0].utm_campaign, 'launch');
  assert.equal(f.events.filter((e) => e.event === 'hero_early_access_click').length, 1);
  assert.equal(f.events.filter((e) => e.event === 'waitlist_form_success').length, 1);
  passed.push('first-touch attribution survives navigation; CTA and conversion fire once');
  await f.context.close();

  const sanitized = await fixture({ stored: { t: Date.now(), utm_source: 'x'.repeat(300), extra: 'discard', landing_path: '/'.repeat(300) } });
  await sanitized.page.goto('http://localhost:4173/');
  await sanitized.submit();
  await sanitized.page.waitForFunction(() => document.querySelector('#early-access').dataset.done === 'true');
  assert.equal(sanitized.signups[0].utm_source.length, 120);
  assert.equal(sanitized.signups[0].landing_path.length, 200);
  assert.equal(sanitized.signups[0].extra, undefined);
  passed.push('cached attribution is bounded and unknown fields are discarded');
  await sanitized.context.close();

  for (const t of [Date.now() - 31 * 86400000, Date.now() + 86400000]) {
    const expired = await fixture({ stored: { t, utm_source: 'old' } });
    await expired.page.goto('http://localhost:4173/?utm_source=fresh');
    await expired.submit();
    await expired.page.waitForFunction(() => document.querySelector('#early-access').dataset.done === 'true');
    assert.equal(expired.signups[0].utm_source, 'fresh');
    await expired.context.close();
  }
  passed.push('expired and future-dated attribution are replaced');

  const fallback = await fixture();
  fallback.mode('fallback');
  await fallback.page.goto('http://localhost:4173/?utm_source=launch');
  await fallback.submit();
  await fallback.page.waitForFunction(() => document.querySelector('#early-access').dataset.done === 'true');
  assert.equal(fallback.signups.length, 2);
  assert.deepEqual(Object.keys(fallback.signups[1]).sort(), ['email', 'platform_interest']);
  passed.push('unmigrated attribution columns retry once with the existing contract');
  await fallback.context.close();

  const timeout = await fixture();
  timeout.mode('stall');
  await timeout.page.goto('http://localhost:4173/');
  await timeout.submit();
  await timeout.page.waitForFunction(() => document.querySelector('#waitlist-form').dataset.state === 'submitting');
  assert.equal(await timeout.page.locator('#waitlist-form').getAttribute('aria-busy'), 'true');
  await timeout.page.locator('#waitlist-form').evaluate((form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await timeout.page.waitForFunction(() => document.querySelector('#waitlist-form').dataset.state === 'server_error', null, { timeout: 20000 });
  assert.equal(timeout.signups.length, 1);
  assert.equal(await timeout.page.locator('#waitlist-submit').isEnabled(), true);
  assert.equal(await timeout.page.locator('#waitlist-form').getAttribute('aria-busy'), 'false');
  assert.match(await timeout.page.locator('#waitlist-status').textContent(), /too long/);
  timeout.mode('success');
  await timeout.submit();
  await timeout.page.waitForFunction(() => document.querySelector('#early-access').dataset.done === 'true');
  passed.push('timeout releases busy state, blocks duplicate submit and allows retry');
  await timeout.context.close();

  const mobile = await fixture();
  await mobile.page.goto('http://localhost:4173/');
  await mobile.page.locator('[data-view="discover_view"]').evaluate((el) => el.style.minHeight = '3000px');
  await mobile.page.locator('[data-view="discover_view"] h2').scrollIntoViewIfNeeded();
  await mobile.page.waitForTimeout(200);
  assert.equal(mobile.events.filter((e) => e.event === 'discover_view').length, 1);
  passed.push('tall mobile sections emit their view event');
  await mobile.context.close();

  const dnt = await fixture({ dnt: true });
  await dnt.page.goto('http://localhost:4173/');
  await dnt.submit();
  await dnt.page.waitForFunction(() => document.querySelector('#early-access').dataset.done === 'true');
  assert.equal(dnt.events.length, 0);
  assert.equal(dnt.signups.length, 1);
  passed.push('Do Not Track suppresses analytics without preventing signup');
  await dnt.context.close();
} finally {
  await browser?.close();
  server.close();
  console.log(JSON.stringify({ passed }, null, 2));
}
