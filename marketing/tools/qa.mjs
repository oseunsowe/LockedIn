// Local QA for the landing page: screenshots, console errors, axe a11y, LCP/CLS.  npm run qa
// Supabase requests are blocked so test runs never write analytics/waitlist rows.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';
import { start } from './serve.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.env.QA_OUT ?? path.join(here, 'qa-output');
await mkdir(outDir, { recursive: true });

const viewports = [
  { name: 'small-mobile', width: 320, height: 740, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];

const server = await start(4173);
const browser = await chromium.launch();
const report = [];

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    deviceScaleFactor: vp.deviceScaleFactor ?? 1,
    reducedMotion: 'reduce',
  });
  await context.route(/supabase\.co/, (route) => route.abort());
  const page = await context.newPage();
  const problems = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !/supabase|ERR_FAILED|Failed to load resource/.test(msg.text())) problems.push(msg.text());
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('response', (response) => {
    if (response.url().startsWith('http://localhost:4173/') && response.status() >= 400) {
      problems.push(`asset: ${response.status()} ${response.url()}`);
    }
  });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  // Visit lazy media before a full-page capture; offscreen images otherwise appear blank.
  for (const img of await page.locator('img[loading="lazy"]').all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate((el) => el.decode());
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: path.join(outDir, `${vp.name}-full.png`), fullPage: true });
  await page.screenshot({ path: path.join(outDir, `${vp.name}-fold.png`) });

  const axe = await new AxeBuilder({ page }).analyze();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  report.push({
    viewport: vp.name,
    consoleProblems: problems,
    horizontalOverflowPx: overflow,
    axeViolations: axe.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.help}`),
  });
  await context.close();
}

// Performance run: real motion settings, throttle-free, LCP + CLS.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.route(/supabase\.co/, (route) => route.abort());
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__vitals = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__vitals.lcp = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__vitals.cls += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.mouse.wheel(0, 4000);
  await page.waitForTimeout(800);
  report.push({ vitals: await page.evaluate(() => window.__vitals) });
  await context.close();
}

// All backend responses are mocked; no signup or email leaves the browser.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  let mode = 'success';
  let inserts = 0;
  await context.route(/supabase\.co/, async (route) => {
    if (!route.request().url().includes('/rest/v1/waitlist_signups')) {
      return route.fulfill({ status: 204 });
    }
    inserts++;
    if (mode === 'network') return route.abort();
    await route.fulfill({
      status: mode === 'duplicate' ? 409 : mode === 'server' ? 500 : 201,
      contentType: 'application/json',
      body: mode === 'duplicate' ? JSON.stringify({ code: '23505' }) : '{}',
    });
  });
  const page = await context.newPage();
  const checks = [];
  const check = (name, pass) => checks.push({ name, pass });
  await page.goto('http://localhost:4173/');
  await page.locator('.menu-toggle').click();
  check('mobile menu opens', await page.locator('.menu-toggle').getAttribute('aria-expanded') === 'true');
  await page.keyboard.press('Escape');
  check('Escape closes menu', await page.locator('.menu-toggle').getAttribute('aria-expanded') === 'false');
  await page.locator('#waitlist-submit').click();
  check('invalid email', await page.locator('#waitlist-form').getAttribute('data-state') === 'invalid');
  check('invalid email never submitted', inserts === 0);
  for (const scenario of ['duplicate', 'server', 'network', 'success']) {
    mode = scenario;
    await page.reload();
    await page.locator('#email').fill('landing-qa@example.com');
    await page.locator('#waitlist-submit').click();
    const expected = ['server', 'network'].includes(scenario) ? 'server_error' : scenario;
    await page.waitForFunction((state) => document.querySelector('#waitlist-form').dataset.state === state, expected);
    check(scenario, true);
    if (scenario === 'success') check('success visible', await page.locator('#waitlist-success').isVisible());
  }
  report.push({ interactionChecks: checks });
  await context.close();
}
{
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://localhost:4173/');
  report.push({ noJavaScriptContentVisible: await page.locator('#creator h2').isVisible() });
  await context.close();
}
await browser.close();
server.close();
console.log(JSON.stringify(report, null, 2));
if (report.some((r) => r.consoleProblems?.length || r.horizontalOverflowPx > 0 || r.axeViolations?.length || r.interactionChecks?.some((c) => !c.pass) || r.noJavaScriptContentVisible === false)) process.exitCode = 1;
