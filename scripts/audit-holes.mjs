/**
 * Counts every unfinished thing in the built site.
 *
 * content.md marks a known gap as [PLACEHOLDER: …], which renders visibly via
 * <Placeholder />. Each one is a launch blocker, so this reads dist/ after a
 * build and reports what is still open, per page. Run it before any deploy that
 * claims to be finished.
 *
 * The [VERIFY: …] facts were all resolved against primary sources, so the
 * companion component and its column here are gone.
 *
 *   node scripts/audit-holes.mjs
 *
 * Exits 1 when anything is outstanding, so CI can gate a production deploy on
 * it later without further work.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';

async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

const countOf = (html, attr) => html.split(attr).length - 1;

let files;
try {
  files = await htmlFiles(DIST);
} catch {
  console.error(`No ${DIST}/ directory. Run "npm run build" first.`);
  process.exit(1);
}

let placeholders = 0;
const rows = [];

for (const file of files.sort()) {
  const html = await readFile(file, 'utf8');
  const count = countOf(html, 'data-placeholder');
  if (count) rows.push({ file: path.relative(DIST, file), count });
  placeholders += count;
}

const pad = (s, n) => String(s).padEnd(n);
console.log('\nOutstanding before launch\n');
console.log(`${pad('Page', 34)}Placeholders`);
console.log('-'.repeat(48));
for (const row of rows) {
  console.log(`${pad(row.file, 34)}${row.count}`);
}
console.log('-'.repeat(48));
console.log(`${pad('Total', 34)}${placeholders}\n`);

if (placeholders) {
  console.log('Not ready to launch. Every row above is a decision someone still owes.\n');
  process.exit(1);
}

console.log('No holes left.\n');
