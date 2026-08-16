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
  console.error('Refusing to screenshot a file:// URL — serve on localhost first (npm run dev).');
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
      console.error(`Could not load ${url} — is the dev server running? (npm run dev)`);
      process.exitCode = 1;
      break;
    }

    // The dev toolbar is injected UI, not the page. It must never appear in a
    // design screenshot or a generated asset.
    await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });

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
