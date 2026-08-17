/**
 * One-off verification for the two guarantees the motion system depends on:
 *
 *   1. With JavaScript disabled, every .reveal element must still be visible.
 *      The CSS only hides them once `js-reveal` is on <html>, and only the
 *      reveal script adds that class, so a page that never runs JS should
 *      never end up with anything hidden.
 *   2. Under prefers-reduced-motion: reduce, nothing animates and the first
 *      rotating word is pinned rather than left blank.
 *
 * Not part of the regular audit scripts: this is a point-in-time check for one
 * feature, not a recurring gate.
 */
import puppeteer from 'puppeteer';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const PAGES = ['/', '/award/', '/about/', '/get-involved/'];

const browser = await puppeteer.launch({ headless: true });
let failures = 0;

// --- 1. JavaScript disabled -------------------------------------------------
for (const route of PAGES) {
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2', timeout: 60_000 });

  const hidden = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.reveal')];
    return els.filter((el) => getComputedStyle(el).opacity === '0').length;
  });

  console.log(`${hidden === 0 ? 'PASS' : 'FAIL'}  no-js   ${route.padEnd(16)} ${hidden} hidden of reveal set`);
  if (hidden > 0) failures++;
  await page.close();
}

// --- 2. Reduced motion -------------------------------------------------------
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 60_000 });

const { animName, firstWordOpacity, otherWordsOpacity } = await page.evaluate(() => {
  const words = [...document.querySelectorAll('.ah-word')];
  const first = words[0];
  const rest = words.slice(1);
  return {
    animName: first ? getComputedStyle(first).animationName : 'missing',
    firstWordOpacity: first ? getComputedStyle(first).opacity : 'missing',
    otherWordsOpacity: rest.map((w) => getComputedStyle(w).opacity),
  };
});

const motionOff = animName === 'none';
const firstShown = firstWordOpacity === '1';
console.log(`${motionOff ? 'PASS' : 'FAIL'}  reduced-motion   animation disabled (was: ${animName})`);
console.log(`${firstShown ? 'PASS' : 'FAIL'}  reduced-motion   first word visible (opacity: ${firstWordOpacity})`);
if (!motionOff || !firstShown) failures++;
await page.close();

await browser.close();

console.log(failures === 0 ? '\nAll motion guarantees hold.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
