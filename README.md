# The Open Road Foundation

Website for a scholarship fund in West Chester, Pennsylvania. Year one: raise
$10,000 and make one award to a West Chester Area School District student.

Astro 7 (static, zero JS shipped) · Tailwind 4 · deployed on Vercel.

## Getting started

```bash
npm install
npm run dev          # http://localhost:4321
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :4321 (`astro dev --background` to detach) |
| `npm run build` | Static build into `dist/` |
| `npm run audit:a11y` | WCAG 2.2 AA across every page at 390px and 1440px. Must be zero. |
| `npm run audit:holes` | Counts unfinished content. Exits non-zero until launch-ready. |
| `npm run assets` | Regenerates the OG card and icons from the design system |
| `npm run shot -- <url> <label>` | Screenshots a page at three viewports |

`audit:a11y`, `assets` and `shot` need the dev server running.

## How this repo is organised

```
content_intake/content.md   Source of truth for every word (gitignored)
src/styles/tokens.css       The only place raw values live
src/components/             Logo, Lane, Placeholder, Verify, DistanceStat, …
src/pages/                  index, award, who-we-are, get-involved, privacy, 404
scripts/                    Screenshot harness and the two audits
BRAND.md                    Design direction and the reasoning behind it
CLAUDE.md                   Working rules for this project
```

## Two conventions worth knowing

**Unfinished content is visible, not hidden.** `content.md` marks gaps with
`[PLACEHOLDER: …]` and unconfirmed facts with `[VERIFY: …]`. Those render on the
page as loud roadwork-striped blocks and dotted underlines. That is deliberate —
a page that already looks finished never gets the missing thing commissioned.
`npm run audit:holes` reports what is still outstanding.

**Colour comes from the surface, not the component.** The `.surface-paper`,
`.surface-concrete` and `.surface-asphalt` classes set the foreground, rule,
button and accent variables. Components read those variables and never pick a
colour themselves. This is what keeps the one rule that is easy to break —
*amber is 2.1:1 on paper, so it can be a line but never a letter* — true in one
place instead of in every component. See `BRAND.md`.

## Before launch

Everything `npm run audit:holes` lists, plus:

- Legal name, EIN, contact email, mailing address
- Confirm the two `[VERIFY:]` facts against primary sources
- Choose a donation provider and a form provider, then name them on `/privacy/`
- Set the real domain in `astro.config.mjs` (`site`), then re-run `npm run assets`
- Founder bios and headshots; hero and founders photographs, with rights cleared
- Decide whether the award figure and the fundraising goal stay the same number
