# The Open Road Foundation, design direction

Everything here was derived from `content_intake/content.md`. Where a decision
could have gone either way, the reasoning is recorded so a later change is made
deliberately rather than by drift.

## The idea: perspective

The foundation funds students to go somewhere unfamiliar and come back seeing
more than they did. That is the subject, and the identity encodes it.

The previous direction ("mile markers") is gone. It leaned on two things the
brand should not lean on: **school**, through a mortarboard, and **road**, which
the name already carries and which every other Open Road organisation uses. The
road metaphor is out of the token names too, because leaving `asphalt` and
`concrete` in place would have kept the old idea alive in every file long after
the logo changed.

The home page once carried three statistics scaled by distance, nearer reading
larger, which encoded that idea in the layout. Those facts have since been split
between two pages, so nothing is left to compare against and the scaling is
gone. The idea now lives in the mark and the writing rather than in a grid. See
"Statistics are standing in for a person" below.

## The mark: Prism

One line goes in, three come out. A single student, and the wider range of what
they can see afterwards.

Chosen from five candidates, all shown at 200 / 96 / 32 / 16px on light and dark
before anything was committed. The bar is the one apricot element, which is
consistent with apricot being graphic-only everywhere else.

The favicon drops one of the three rays. Three diverging strokes turn to mud at
16px; two still say "one in, more out".

## Palette

| Token | Value | Job |
|---|---|---|
| `--color-deep` | `#1f4e4a` | Deep teal. Bands, footer, buttons |
| `--color-surface` | `#ffffff` | The page |
| `--color-panel` | `#eff3f1` | Second surface, cards |
| `--color-quiet` | `#4e5f5b` | Secondary text |
| `--color-accent` | `#e09b4a` | Apricot. The one loud colour |

### The rule that gets broken by accident

**Apricot carries text on nothing.** 2.34:1 on white, 3.99:1 on the deep band,
and white on an apricot button is 2.34:1 as well.

This is the second palette where the loud colour could not carry text, so this
time all three safe variants ship with it rather than being discovered later:

- `--color-accent-strong` `#8f5312`, 6.15:1 on white and 5.50:1 on panel, for links
  and accented text. The earlier `#a9631c` cleared white by 0.18 and failed the
  panel surface outright at 4.18:1, which nothing caught because the cards that
  used it happened to sit on white.
- `--color-accent-soft` `#f0b978`, 5.30:1 on deep, for accented text in a dark band
- `--color-on-accent` `#12302e`, 6.02:1, for labels sitting on an apricot fill

Enforced in one place: the `.surface-*` classes set `--accent-text` to the right
variant for their background, so components never choose.

## Type

- **Source Serif 4**, quiet editorial serif, display only.
- **Figtree**, warm and open, for body and UI.

Figtree's rounded letterforms are the same decision as the 10px panel radius:
light-hearted without loosening the craft. Chosen against three alternatives
shown in full at `/explore/`.

Self-hosted via `@fontsource-variable`, not the Google CDN. The privacy page
makes claims about who sees visitor data; a font CDN request would undercut them.

## The home hero: naming what the foundation gives

The headline used to be a description of the mechanism ("we fund tuition").
`AnimatedHeadline.astro` names the thing itself instead: **"We fund one student
a year to go find [perspective / opportunity / a wider view / their
footing]"**, one word rotating in CSS.

The tagline this replaced, *"Some roads are worth leaving home for,"* was not
cut. It moved to the oversize statement lower on the page, which also removed
a near-duplicate of the same line on the About page.

The hero itself is a full-bleed photograph running to the top and both edges,
with the header floating on it in white, styled after a reference the client
supplied. That reference was
React, framer-motion and shadcn; **none of it was adopted**, because this site
ships zero JavaScript beyond Astro's own router. Every effect (the rotating
word, the load-in, the scroll reveals) is native CSS plus a ~1KB observer. See
`CLAUDE.md`'s Motion section for the operating rules, in particular the
`astro:page-load` requirement that keeps reveals working after a client-side
navigation, not just on first load.

## There is no motif, on purpose

The dashed lane marking was retired with the old logo and **nothing replaced
it**. It did four jobs, and each is now done by the plainest thing that works:
a solid underline for the active nav item, a plain plus for the question toggle,
a round bullet for list markers, a hairline for the timeline connector.

The site already has signatures stronger than a dash: the surface system, the
type pairing, and the mark itself. Restraint
is also the more expensive-looking choice. If a motif is wanted later it should
come out of the mark, so it means something, rather than being added because
removing the old one left a hole.

## Holes are visible on purpose

`content.md` is explicit that `[PLACEHOLDER: …]` "should render visibly on the
page rather than being quietly filled with something plausible."

`<Placeholder />` reads as an unfinished note: a dashed outline, a quiet tint, a
small label. Where the missing thing is an **action** rather than a fact, the
button renders in its real place, correctly sized, outlined rather than filled,
disabled, and labelled `placeholder`. The page gets its true shape while staying
honest that nothing is wired up.

Run `npm run audit:holes` for the current count.

## What is deliberately not here

- **No invented facts.** Legal name, EIN, addresses and application dates are holes.
- **No EIN in the structured data.** A wrong EIN in machine-readable markup is
  worse than an absent one.
- **No live form or donation link.** No provider is chosen.
- **No bento of facts.** The candidates are all still placeholders, and a grid of
  six unknowns is worse than a paragraph.
- **No student story.** There is no funded student yet and inventing one is out
  of the question. Worth stating plainly: **an image, a caption and a quote from
  the first recipient is the single highest-value addition this site will ever
  get**, and it belongs on the home page the week that award is made.

## Statistics are standing in for a person

The home page carries exactly one fact, `1 in 8`, and it is there because the
better option does not exist yet.

The research is consistent: giving falls when a statistic is added to an
appeal about an identifiable person, and response can drop further as the
numbers grow (Small, Loewenstein & Slovic 2007; Slovic on compassion fade).
Three figures stacked near the top of the page were working against the ask, so
the national and state context moved into the About page's narrative, where a
reader who wants the wider case has gone looking for it.

`1 in 8` earns its place because it is local and counterintuitive: a district
with a $137,133 median household income where one in eight students is
economically disadvantaged. That is the fact that makes a West Chester donor
stop.

**When the first student is funded, their story leads the home page and this
statistic becomes supporting.** That is the moment a number stops having to do
a person's job.
