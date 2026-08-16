/**
 * Accessibility audit — WCAG 2.2 A/AA across every page, at mobile and desktop.
 *
 *   npm run dev
 *   node scripts/audit-a11y.mjs
 *
 * Drives axe-core through Puppeteer rather than @axe-core/cli, which needs a
 * separate chromedriver; Puppeteer is already here for screenshots.
 *
 * Both widths are checked because several rules are layout-dependent — target
 * size and reflow can pass at 1440 and fail at 390.
 *
 * Exits 1 on any violation.
 */
import puppeteer from 'puppeteer';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');

const BASE = process.argv[2] ?? 'http://localhost:4321';
const PAGES = ['/', '/award/', '/who-we-are/', '/get-involved/', '/privacy/', '/404'];
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

const browser = await puppeteer.launch({ headless: true });
let total = 0;

try {
  for (const route of PAGES) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });

      try {
        await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2', timeout: 60_000 });
      } catch {
        console.error(`  could not load ${route} — is the dev server running?`);
        process.exitCode = 1;
        await page.close();
        continue;
      }

      await page.addScriptTag({ path: axePath });
      const results = await page.evaluate(async () =>
        await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
        })
      );

      const violations = results.violations ?? [];
      total += violations.length;

      const label = `${route} @ ${vp.name}`;
      if (violations.length === 0) {
        console.log(`PASS  ${label}`);
      } else {
        console.log(`FAIL  ${label}`);
        for (const v of violations) {
          console.log(`      [${v.impact}] ${v.id} — ${v.help}`);
          for (const node of v.nodes.slice(0, 3)) {
            console.log(`         ${node.target.join(' ')}`);
            const detail = node.failureSummary?.split('\n').filter(Boolean).slice(1, 3) ?? [];
            for (const line of detail) console.log(`           ${line.trim()}`);
          }
          if (v.nodes.length > 3) console.log(`         …and ${v.nodes.length - 3} more`);
        }
      }

      await page.close();
    }
  }
} finally {
  await browser.close();
}

console.log(`\n${total === 0 ? 'No violations.' : `${total} violation group(s).`}`);
if (total > 0) process.exit(1);
