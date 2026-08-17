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

// page.hover() scrolls the target into view and aims at its centre, which is
// not safe here: the header is sticky from 62rem up, so depending on where the
// scroll lands the pointer can come down on the bar instead of the row. That
// made this check fail approximately one run in three, always reporting
// "0px to 0px", which reads as the hover styling being broken rather than as
// the pointer having missed. Centring the row in the viewport puts it well
// clear of a 65px bar, and elementFromPoint proves the pointer actually landed
// on it before anything is measured.
// Two things made this check fail roughly one run in three, both timing.
//
// The rail rows carry .reveal, so scrolling them into view starts a 900ms
// transform. Coordinates measured during that go stale before the pointer
// arrives, and the hover lands on empty space. So wait until the row's own
// rect stops changing rather than guessing at a delay.
//
// Then move the pointer twice. A single mouse.move to a fresh position does not
// always produce a mousemove Chrome treats as a hover, and a one-pixel second
// move makes it deterministic.
await desk.evaluate(() => {
  document.querySelector('.rail-item').scrollIntoView({ block: 'center', behavior: 'instant' });
});
await desk.waitForFunction(
  () => {
    const el = document.querySelector('.rail-item');
    const y = Math.round(el.getBoundingClientRect().top);
    const settled = window.__lastY === y;
    window.__lastY = y;
    return settled;
  },
  { polling: 120, timeout: 8000 }
);

const target = await desk.evaluate(() => {
  const el = document.querySelector('.rail-item');
  const r = el.getBoundingClientRect();
  const x = Math.round(r.x + r.width / 2);
  const y = Math.round(r.y + r.height / 2);
  const hit = document.elementFromPoint(x, y);
  return { x, y, onTarget: !!hit && (el === hit || el.contains(hit)), hit: hit ? hit.className : null };
});

const beforeHover = await desk.evaluate(
  () => document.querySelector('.rail-detail').getBoundingClientRect().height
);
await desk.mouse.move(target.x - 1, target.y - 1);
await desk.mouse.move(target.x, target.y);

// Poll instead of sampling once after a sleep. The pointer event updates
// hit-testing straight away, so the row matches :hover immediately, but with no
// compositor activity in headless the descendant restyle can lag: measured once
// after a fixed delay this read the stale collapsed value about one run in
// three and reported "0px to 0px", which looks like broken CSS rather than a
// harness artefact. Reading getComputedStyle forces the recalculation, so
// polling is both the wait and the fix.
await desk
  .waitForFunction(
    () => {
      const d = document.querySelector('.rail-detail');
      return getComputedStyle(d).maxBlockSize !== '0px' && d.getBoundingClientRect().height > 0;
    },
    { polling: 100, timeout: 3000 }
  )
  .catch(() => {}); // a real failure falls through and is reported below

const afterHover = await desk.evaluate(
  () => document.querySelector('.rail-detail').getBoundingClientRect().height
);

console.log(
  `${target.onTarget ? 'PASS' : 'FAIL'}  timeline row is reachable by pointer  (${target.onTarget ? 'clear' : 'obscured by ' + target.hit})`
);
if (!target.onTarget) failures++;

const expands = afterHover > beforeHover;
console.log(
  `${expands ? 'PASS' : 'FAIL'}  timeline detail expands on hover  (${Math.round(beforeHover)}px to ${Math.round(afterHover)}px)`
);
if (!expands) failures++;
await desk.close();

await browser.close();
console.log(failures === 0 ? '\nLayout guarantees hold.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
