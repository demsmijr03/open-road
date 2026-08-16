# Open Road — Project Rules

Nonprofit website. Astro + Tailwind, Git-based CMS, deployed on Vercel.
Ported from `frontend.md`, with mechanics corrected for this stack and machine.

## Always Do First

- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.
- **Query `ui-ux-pro-max` with `--stack astro`** before implementing any component.

## Tooling paths (this machine)

Python is installed but the **Microsoft Store alias shadows it on PATH**. Bare `python` returns the
Store stub, not an interpreter. Always use the absolute path:

```bash
PY="/c/Users/demsm/AppData/Local/Programs/Python/Python313/python.exe"   # Python 3.13.15
S="$HOME/.claude/skills/ui-ux-pro-max/scripts/search.py"

"$PY" "$S" "<query>" --domain color        # domains: product style typography color landing
                                           #          chart ux gsap react web icons google-fonts
"$PY" "$S" "<query>" --stack astro         # Astro-specific implementation guidance
```

If the aliases get disabled (Settings → Apps → Advanced app settings → App execution aliases),
plain `python` will work and these paths can be shortened.

## Local Server

- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start: `npm run dev` → **http://localhost:4321** (Astro's port, not 3000)
- Background mode: `astro dev --background`, managed with `astro dev stop|status|logs`
- If the server is already running, do not start a second instance.

## Checks

```bash
npm run build          # must pass before any commit
npm run audit:a11y     # WCAG 2.2 AA, every page, mobile + desktop. Must be zero.
npm run audit:holes    # counts [PLACEHOLDER] and [VERIFY]. Non-zero until launch-ready.
npm run shot -- http://localhost:4321/award/ award
```

`audit:a11y` needs the dev server running. It is the gate — a page is not done
until it passes at both 390px and 1440px.

## Content rules

`content_intake/content.md` is the single source of truth for every word.
Do not use the old `Documents/open-road-foundation` repo for anything.

- Copy is written to the page **verbatim**. The voice is set in that file:
  plain, first person plural, sentence case, active voice. No "empower", no
  "impact" as a verb, no "journey", no "passionate about".
- `[PLACEHOLDER: …]` → `<Placeholder note="…" />`. **Never** fill one with
  something plausible. It must render visibly.
- `[VERIFY: …]` → `<Verify>` around the claim, `<VerifyNote note="…" />` after
  the paragraph. Never inside it — that cuts the sentence in half.
- See `BRAND.md` for the design direction and the amber contrast rule.

## Screenshot Workflow

- **Always screenshot from localhost:** `node scripts/screenshot.mjs http://localhost:4321`
- Captures three viewports per run: 390 (mobile), 768 (tablet), 1440 (desktop).
- Saved to `temporary screenshots/screenshot-N-<viewport>.png`, auto-incremented, never overwritten.
- Optional label: `node scripts/screenshot.mjs http://localhost:4321/about about`
- After screenshotting, read the PNG back with the Read tool and analyze it directly.
- When comparing, be specific: "heading is 32px but should be ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius,
  shadows, image sizing.
- **Do at least 2 comparison rounds.** Stop only when no visible differences remain or the user says so.

## Output Defaults

- **`.astro` components with scoped styles** — never a single monolithic `index.html`.
- **Tailwind via the Astro integration**, purged at build. **Never the CDN script** (no purge,
  ~3MB payload, FOUC — it would sink the Lighthouse scores this project is judged on).
- Every color and spacing value comes from `src/styles/tokens.css`. **No raw hex in components.**
- Images via `<Image />` from `astro:assets` (auto WebP/AVIF, correct width/height, no layout shift).
- Mobile-first responsive.

## Token rules (Tailwind v4)

Tokens live in `src/styles/tokens.css`. Tailwind v4 derives utilities from the `@theme` block, so
defining `--color-ink-500` there automatically yields `text-ink-500`, `bg-ink-500`, etc.

**Never define `--spacing-<name>` in `@theme`.** That namespace feeds *both* padding and sizing
utilities, so a `--spacing-3xl` token silently makes `max-w-3xl` resolve to it instead of
`--container-3xl` — which collapsed the page container from 768px to 96px during setup. Named rhythm
tokens therefore live in the `:root` block as `--space-*`, which Tailwind ignores.

- Utilities in markup: Tailwind's numeric scale (`px-6`, `py-24`, `gap-4`)
- Custom CSS: named tokens (`var(--space-lg)`, `var(--radius-md)`, `var(--shadow-elevated)`)
- After changing tokens, rebuild and confirm the utility still resolves as intended:
  `grep -o "\.max-w-3xl{[^}]*}" dist/_astro/*.css`

## Astro Architecture

- **Zero JS by default.** Static `.astro` components; add `client:*` only where interaction truly requires it.
- Prefer `client:visible` over `client:load` for anything below the fold.
- Content lives in **content collections with Zod schemas**, so malformed content fails the build
  instead of shipping broken pages.

## Brand Assets

- Always check `brand_assets/` before designing. It holds the logo, favicons, and `palette.json`.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a color palette is defined, use those exact values — do not invent brand colors.

## Anti-Generic Guardrails

- **Colors:** Never use the default Tailwind palette (indigo-500, blue-600, etc.). Derive from the brand color.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans.
  Tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer
  with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces need a layering system (base → elevated → floating), not all on one z-plane.

## Quality Floor (non-negotiable — WCAG 2.2 AA)

- Contrast 4.5:1 normal text, 3:1 large text
- Visible focus rings — **never** remove them
- Touch targets ≥ 44×44px, 8px+ spacing
- Sequential heading hierarchy, no level skips
- Skip-to-content link, descriptive alt text
- `prefers-reduced-motion` respected

## Hard Rules

- Do not add sections, features, or content not requested
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
- Do not use emoji as icons — use SVG
- Do not commit anything from `content_intake/` that lacks photo consent/rights

## Documentation

Full docs: https://docs.astro.build

- [Routing & dynamic pages](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Styling & Tailwind](https://docs.astro.build/en/guides/styling/)
