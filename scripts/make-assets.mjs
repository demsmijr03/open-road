/**
 * Generates the brand's binary assets from sources already in the repo, so they
 * never drift from the design system.
 *
 *   npm run dev
 *   node scripts/make-assets.mjs
 *
 * Writes:
 *   public/og-default.png       1200x630 link-preview card, from /og-card
 *
 * Re-run after any change to the palette, wordmark or mark. The favicons are
 * supplied by design and are not generated here.
 */
import puppeteer from 'puppeteer';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const browser = await puppeteer.launch({ headless: true });

try {
  // --- OG card ---------------------------------------------------------
  const og = await browser.newPage();
  await og.setViewport({ width: 1200, height: 630 });
  await og.goto(`${BASE}/og-card/`, { waitUntil: 'networkidle2', timeout: 60_000 });
  await og.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
  await og.evaluate(() => document.fonts?.ready);
  await og.screenshot({ path: 'public/og-default.png' });
  console.log('✔ public/og-default.png        1200x630');
  await og.close();

  // Icons are NOT generated here any more. favicon.ico, favicon-16.png,
  // favicon-32.png and apple-touch-icon-180.png are finished files supplied by
  // design and committed as-is. This script used to rasterise apple-touch-icon
  // and favicon-32 from public/favicon.svg, which would now quietly overwrite
  // two of them with a re-render every time it ran.
} finally {
  await browser.close();
}
