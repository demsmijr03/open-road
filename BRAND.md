# The Open Road Foundation, design direction

Everything here was derived from `content_intake/content.md`. Where a decision
could have gone either way, the reasoning is recorded so a later change is made
deliberately rather than by drift.

## The idea: mile markers

Three things had to become one design: **a road**, **college**, and
**perspective**.

They already were one thing in the content. The three numbers on the home page
are introduced as *"Here's the problem, from three distances"*, national, then
state, then local. And the founders' story says what they found by leaving was
*"perspective."* Geometric perspective and earned perspective are the same word
because they are the same idea: distance changes what you can see.

So the whole system runs on one rule:

> **Things nearer to home render larger and louder. Things further away recede.**

That rule governs the logo, the three numbers, the dividers, and the lane
markings, which is what makes them feel like one design rather than a set of
motifs.

## Palette

Drawn from the subject's own materials, asphalt, painted lane markings,
highway signage, rather than from nonprofit convention. Defined in
`src/styles/tokens.css`.

| Token | Value | Job |
|---|---|---|
| `--color-asphalt` | `#1c2430` | Dark bands, footer, primary button. Road at dusk. |
| `--color-paper` | `#faf8f5` | The dominant page surface. |
| `--color-concrete` | `#ebe7e0` | Second neutral, alternating bands, cards. |
| `--color-slate` | `#4b5a6b` | Secondary text on light surfaces. |
| `--color-amber` | `#e9a116` | Road paint. The one loud colour. |
| `--color-amber-deep` | `#b87a06` | The text-safe amber, for links on paper. |

### The rule that gets broken by accident

Amber is 2.1:1 on paper. It is the brand's loud colour, so there is a permanent
temptation to set a heading in it on a light surface, and at 2.1:1 that is
unreadable for a lot of people.

**On paper, amber is a rule, a fill, an underline, or a marker. Never a glyph.**
Where amber must carry text on a light surface, use `--color-amber-deep` (4.6:1).
On asphalt, amber is text-safe at 7.0:1.

This is enforced in one place, the `.surface-*` classes set `--accent-text` to
the right amber for their background, so components never choose.

## Type

- **Newsreader**, editorial serif, display only. Warm and characterful without
  the high-contrast Playfair look that reads as a default.
- **Archivo**, a grotesque with **highway signage lineage**, for body and UI.
  The body face is literally drawn from the subject's world.

Self-hosted via `@fontsource-variable`, not the Google CDN. The privacy page
makes claims about who sees visitor data; a font CDN request would undercut them.

## The signature: the lane marking

A road's centre line, used as a divider, a list marker, an active-nav indicator,
and the FAQ's open/close sign. In `recede` mode the dashes shorten and fade
left-to-right, perspective stated in one CSS rule.

Used sparingly. A divider between every block turns a signature into wallpaper.

## The mark

Brief: a road as the base, a small person guided by a hand, fused with college
and perspective.

A mortarboard seen at an angle and a road seen in perspective are the same
trapezoid, that rhyme is the whole mark.

**The first attempt failed and is worth recording.** It put the cap at the far
end of a receding road. At any real size the cap sat wider than the road's
vanishing point and read as a lamp on a tripod. The fix was to invert the
composition: the cap is the fixed point at the top, and the road opens out from
beneath it toward the viewer. The road now widens as it approaches and its lane
markings grow with it, so the drawing is read from the horizon forward, the
same move the three numbers make.

The guiding hand is a cupped palm that stops short of the figure. It never
touches. The figure walks on their own, which is the actual relationship a
scholarship has to a student and the difference between guidance and rescue.

Variants: `mark` (survives 16px), `full` (with wordmark), `scene` (adds the
figure and hand; 120px and up only, because that detail turns to mud smaller).

## Holes are visible on purpose

`content.md` is explicit that `[PLACEHOLDER: …]` "should render visibly on the
page rather than being quietly filled with something plausible."

So `<Placeholder />` reads as an unfinished note rather than as content: a
dashed outline, a quiet tint, and a small label saying what is still owed. It
carries no colour. An earlier version used a roadwork-striped amber edge, which
drew the eye but read as decoration rather than as an open question.

The companion `<Verify />` component is gone. Every `[VERIFY:]` fact was checked
against a primary source on 16 August 2026, and one of them was wrong:
Pennsylvania is not second in the country for in-state tuition. Vermont and New
Hampshire are both above it. The stat now states the verified comparison, 29%
above the national average.

A hero that already looks finished without its photograph never gets the
photograph commissioned. The photo slots therefore hold their real footprint
rather than collapsing to a caption.

Run `npm run audit:holes` for the current count. It exits non-zero while
anything is outstanding.

## What is deliberately not here

- **No invented facts.** Legal name, EIN, addresses and application dates are
  holes. Founder bios are written from what the founders supplied; their
  headshots drop into `src/assets/founders/` and show a placeholder until they do.
- **No EIN in the structured data.** A wrong EIN in machine-readable markup is
  worse than an absent one, so `NGO` schema omits it until it is known.
- **No live form.** No provider is chosen, so the interest form has no `action`
  and says so. A form that looks submittable and silently drops what a student
  types is worse than one that admits it is not ready.
- **No recurring giving.** content.md says one-time only at launch.
- **No mentorship section.** It appears in the mission statement's own words and
  nowhere else, per Appendix A item 4.
