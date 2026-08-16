/**
 * Generates the brand's binary assets from sources already in the repo, so they
 * never drift from the design system.
 *
 *   npm run dev
 *   node scripts/make-assets.mjs
 *
 * Writes:
 *   public/og-default.png       1200x630 link-preview card, from /og-card
 *   public/apple-touch-icon.png 180x180, from public/favicon.svg
 *   public/favicon-32.png       32x32 fallback for browsers without SVG icons
 *
 * Re-run after any change to the palette, wordmark or mark.
 */
import puppeteer from 'puppeteer';
import { readFile, writeFile } from 'node:fs/promises';

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

  // --- Icons, rasterised from the same SVG the site serves -------------
  const svg = await readFile('public/favicon.svg', 'utf8');
  const svgUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

  for (const [file, size] of [
    ['public/apple-touch-icon.png', 180],
    ['public/favicon-32.png', 32],
  ]) {
    const page = await browser.newPage();
    await page.setViewport({ width: size, height: size });
    await page.setContent(
      `<body style="margin:0"><img src="${svgUrl}" width="${size}" height="${size}"></body>`
    );
    await page.screenshot({ path: file, omitBackground: true });
    console.log(`✔ ${file.padEnd(29)} ${size}x${size}`);
    await page.close();
  }
} finally {
  await browser.close();
}
