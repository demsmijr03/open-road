/**
 * Screenshot harness for the design-critique loop (see CLAUDE.md).
 *
 *   node scripts/screenshot.mjs [url] [label]
 *   node scripts/screenshot.mjs http://localhost:4321/about about
 *
 * Captures mobile / tablet / desktop in one run and writes auto-incremented
 * PNGs to "temporary screenshots/" so earlier passes are never overwritten.
 */
import puppeteer from 'puppeteer';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = 'temporary screenshots';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const url = process.argv[2] ?? 'http://localhost:4321';
const label = process.argv[3] ?? '';

if (url.startsWith('file://')) {
  console.error('Refusing to screenshot a file:// URL. Serve on localhost first (npm run dev).');
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

// Auto-increment: find the highest existing screenshot-N and add one.
const existing = await readdir(OUT_DIR).catch(() => []);
const runIndex =
  existing.reduce((max, file) => {
    const match = file.match(/^screenshot-(\d+)/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0) + 1;

const browser = await puppeteer.launch({ headless: true });

try {
  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: viewport.width, height: viewport.height });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60_000 });
    } catch {
      console.error(`Could not load ${url}. Is the dev server running? (npm run dev)`);
      process.exitCode = 1;
      break;
    }

    // The dev toolbar is injected UI, not the page. It must never appear in a
    // design screenshot or a generated asset.
    await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });

    // A fullPage screenshot does not scroll, so loading="lazy" images below the
    // fold are never fetched and photograph slots come back blank. Flipping them
    // to eager loads the whole page without walking it, which is both faster and
    // steadier than a scroll loop (that one tripped Puppeteer's protocol
    // timeout). Then wait for them to finish.
    await page.evaluate(async () => {
      for (const img of document.images) img.loading = 'eager';

      await Promise.all(
        [...document.images]
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((res) => {
                img.addEventListener('load', res, { once: true });
                img.addEventListener('error', res, { once: true });
              })
          )
      );
    });

    // Same false-negative as the lazy-image fix above, for scroll reveals this
    // time: a fullPage capture never scrolls, so anything below the fold never
    // crosses the IntersectionObserver's threshold and the screenshot would
    // show real content sitting at opacity 0. Reveal it directly instead.
    //
    // The transition itself is a second trap: adding .is-visible starts a
    // 620ms transition with up to a few hundred ms of stagger delay on top, and
    // a screenshot taken right after the class flips lands mid-fade rather than
    // at either end of it. The staggered stats and cards look "half missing" in
    // the capture, not simply invisible. Killing the transition for this pass
    // makes the class change land instantly instead of adding a wait, which
    // would have to guess at the slowest delay on the page.
    await page.addStyleTag({
      content: `.reveal, .reveal.is-visible { transition: none !important; }
        /* .rise and .stagger are the other half of the motion system and were
           never settled here. They animate on load, in CSS, with delays running
           to 690ms, so a capture taken before they finish shows them part way
           through their fade. That is not a hypothetical: the 404 mark was
           photographed at opacity 0.545 during this QA pass and read as a
           washed-out, broken logo, when the page itself was fine. Pin the end
           state rather than waiting on it, exactly as .reveal does above. */
        .rise, .stagger > * {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }`,
    });
    await page.evaluate(() => {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    });

    // Let webfonts settle so type is measured accurately, not in fallback.
    await page.evaluate(() => document.fonts?.ready);

    const suffix = label ? `-${label}` : '';
    const file = path.join(OUT_DIR, `screenshot-${runIndex}${suffix}-${viewport.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`✔ ${file}  (${viewport.width}px wide)`);

    await page.close();
  }
} finally {
  await browser.close();
}
