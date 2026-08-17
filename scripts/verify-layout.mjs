/**
 * Point-in-time checks for this round's two layout guarantees:
 *
 *   1. The hero fills the viewport on a laptop, with no page background
 *      visible below it before scrolling.
 *   2. The timeline detail is readable without hovering on touch and narrow
 *      screens, and expands on hover where hovering is possible.
 */
import puppeteer from 'puppeteer';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const browser = await puppeteer.launch({ headless: true });
let failures = 0;

// --- 1. Hero fills a laptop viewport ---------------------------------------
for (const [w, h] of [
  [1440, 800],
  [1280, 720],
  [1512, 982],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 60_000 });

  const heroHeight = await page.evaluate(
    () => document.querySelector('.hero').getBoundingClientRect().height
  );
  const fills = heroHeight >= h - 1;
  console.log(
    `${fills ? 'PASS' : 'FAIL'}  hero fills ${w}x${h}  (hero is ${Math.round(heroHeight)}px)`
  );
  if (!fills) failures++;
  await page.close();
}

// --- 2. Timeline detail on a touch device ----------------------------------
const touch = await browser.newPage();
await touch.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
await touch.goto(`${BASE}/get-involved/`, { waitUntil: 'networkidle2', timeout: 60_000 });

const touchVisible = await touch.evaluate(() => {
  const details = [...document.querySelectorAll('.rail-detail')];
  if (details.length === 0) return { count: 0, hidden: 0 };
  const hidden = details.filter((d) => {
    const s = getComputedStyle(d);
    return s.opacity === '0' || s.maxBlockSize === '0px' || d.getBoundingClientRect().height === 0;
  }).length;
  return { count: details.length, hidden };
});
const touchOk = touchVisible.count > 0 && touchVisible.hidden === 0;
console.log(
  `${touchOk ? 'PASS' : 'FAIL'}  timeline detail readable on touch  (${touchVisible.hidden} of ${touchVisible.count} hidden)`
);
if (!touchOk) failures++;
await touch.close();

// --- 3. Timeline detail expands on hover ------------------------------------
const desk = await browser.newPage();
await desk.setViewport({ width: 1440, height: 900 });
await desk.goto(`${BASE}/get-involved/`, { waitUntil: 'networkidle2', timeout: 60_000 });

const beforeHover = await desk.evaluate(
  () => document.querySelector('.rail-detail').getBoundingClientRect().height
);
await desk.hover('.rail-item');
await new Promise((r) => setTimeout(r, 600));
const afterHover = await desk.evaluate(
  () => document.querySelector('.rail-detail').getBoundingClientRect().height
);

const expands = afterHover > beforeHover;
console.log(
  `${expands ? 'PASS' : 'FAIL'}  timeline detail expands on hover  (${Math.round(beforeHover)}px to ${Math.round(afterHover)}px)`
);
if (!expands) failures++;
await desk.close();

await browser.close();
console.log(failures === 0 ? '\nLayout guarantees hold.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
