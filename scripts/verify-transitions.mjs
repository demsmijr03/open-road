/**
 * Confirms the one failure mode astro:page-load exists to prevent: with
 * <ClientRouter /> doing client-side navigation, a reveal script bound to
 * DOMContentLoaded fires once, on the very first page, and never again. Every
 * page navigated to afterwards would arrive with its .reveal content stuck at
 * opacity 0, because nothing ever adds `is-visible`.
 *
 * This clicks an actual nav link (a real client-side transition, not
 * page.goto) and checks the destination page for the js-reveal class and at
 * least one revealed element.
 */
import puppeteer from 'puppeteer';

const BASE = process.argv[2] ?? 'http://localhost:4321';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
// Puppeteer defaults to an 800x600 viewport when none is set, which is short
// enough to push above-fold content below the fold on a page with a tall
// masthead, and produced a false failure here on first run.
await page.setViewport({ width: 1440, height: 900 });

await page.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 60_000 });

// A real in-app navigation, so the router intercepts it rather than a full
// load. ClientRouter does a soft (History API) navigation, which
// page.waitForNavigation() does not reliably observe, so wait on the router's
// own completion signal instead: the next astro:page-load event.
await page.evaluate(() => {
  window.__navigated = new Promise((resolve) => {
    document.addEventListener('astro:page-load', resolve, { once: true });
  });
});
await page.click('a[href="/award/"]');
await page.evaluate(() => window.__navigated);
await new Promise((r) => setTimeout(r, 100)); // let the observer's own handler run

const result = await page.evaluate(() => ({
  onAwardPage: location.pathname.startsWith('/award'),
  armed: document.documentElement.classList.contains('js-reveal'),
  anyRevealed: document.querySelectorAll('.reveal.is-visible').length > 0,
  headerPresent: !!document.querySelector('.header'),
}));

console.log(`${result.onAwardPage ? 'PASS' : 'FAIL'}  navigated via client-side transition`);
console.log(`${result.armed ? 'PASS' : 'FAIL'}  reveal system re-armed on the destination page`);
console.log(`${result.anyRevealed ? 'PASS' : 'FAIL'}  above-fold content revealed on arrival`);
console.log(`${result.headerPresent ? 'PASS' : 'FAIL'}  header persisted across the transition`);

await browser.close();

const ok = result.onAwardPage && result.armed && result.anyRevealed && result.headerPresent;
console.log(ok ? '\nTransitions re-arm correctly.' : '\nSomething did not re-arm.');
process.exit(ok ? 0 : 1);
