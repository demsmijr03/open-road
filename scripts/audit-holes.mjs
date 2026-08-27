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
 * ## Two columns, and why only one of them fails the build
 *
 * The second column is not a bug and not a relaxed rule. <ComingSoon /> marks a
 * real thing that is not open yet, addressed to a visitor, where <Placeholder />
 * marks work we have not done, addressed to us. Donations are a coming-soon
 * item because there is no bank account, not because nobody has got round to
 * wiring the button.
 *
 * So placeholders exit 1 and coming-soon items do not. They are still listed,
 * every time, because the whole point of counting them is that a temporary
 * state stays visible until somebody ends it. A coming-soon note that nobody is
 * tracking is just a placeholder wearing better clothes.
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
let soon = 0;
const rows = [];

for (const file of files.sort()) {
  const html = await readFile(file, 'utf8');
  const count = countOf(html, 'data-placeholder');
  const soonCount = countOf(html, 'data-coming-soon');
  if (count || soonCount) rows.push({ file: path.relative(DIST, file), count, soonCount });
  placeholders += count;
  soon += soonCount;
}

const pad = (s, n) => String(s).padEnd(n);
console.log('\nOutstanding before launch\n');
console.log(`${pad('Page', 34)}${pad('Placeholders', 16)}Coming soon`);
console.log('-'.repeat(62));
for (const row of rows) {
  console.log(`${pad(row.file, 34)}${pad(row.count, 16)}${row.soonCount}`);
}
console.log('-'.repeat(62));
console.log(`${pad('Total', 34)}${pad(placeholders, 16)}${soon}\n`);

if (placeholders) {
  console.log('Not ready to launch. Every placeholder above is a decision someone still owes.\n');
  process.exit(1);
}

if (soon) {
  console.log(
    `No placeholders left. ${soon} coming-soon ${soon === 1 ? 'note' : 'notes'} still render, which is\n` +
      'allowed at launch but is a temporary state, not a finished one. Each one ends\n' +
      'when the thing behind it exists.\n'
  );
} else {
  console.log('No holes left.\n');
}
