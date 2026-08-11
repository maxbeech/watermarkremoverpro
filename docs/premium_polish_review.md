# Premium polish review: MarkWitness

Stage 3b design and brand elevation pass. Design quality only; correctness, business
logic and functional testing belong to Harden, which runs next.

---

## Review 2026-08-12

Audited the live deployment at `https://markwitness.helm7.com` in a real Chromium
browser at 1440x900 and 390x844, full-page screenshots of `/`, `/check`, a real
`/check` result state, `/pricing`, `/method`, `/limits`, `/for`,
`/for/university-students`, `/vs/gptzero`, `/guide`, `/signup`. Screenshots kept
under `.polish-shots/before/`. Every finding below is against what a visitor
actually sees, not against what the source implies.

Prior operator verdict on the last review: "We need this still very significantly
improved." The findings agree with that verdict.

### 1. Not premium enough: CONFIRMED

- **Colour is effectively unused.** `globals.css` defines a considered three-family
  palette (`ink` neutrals, `seal` blue, `signal` amber) with a written rationale.
  The pages then use `ink` almost exclusively. `seal-*` and `signal-*` appear on
  essentially nothing a visitor sees, so the rendered site is black text on
  off-white with a single black button. The system exists on paper and is absent
  on screen. This is worse than a template blue, because it reads as unfinished
  rather than as restraint.
- **No elevation, no depth, no surface hierarchy.** Every card is
  `rounded-lg border border-ink-200 bg-white`. There is one surface treatment for
  every level of the page: nav, feature card, result panel, CTA block. Nothing
  recedes and nothing advances.
- **Type scale is flat and unconsidered.** The homepage runs `text-4xl/5xl` for h1
  then drops straight to `text-2xl`, `text-lg`, `text-[15px]`, `text-sm`, `text-xs`
  with no consistent ratio and one arbitrary pixel value spliced in. There is no
  eyebrow/label tier at all, so measured figures and prose sit at the same visual
  weight. Weight is almost entirely a single regular with occasional `font-medium`.
- **Spacing is ad hoc.** Section padding across the homepage alone: `pt-14 pb-8`,
  `pb-6`, `py-12`, `py-12`, `pb-16`. Card padding alternates `p-5` and `p-6` with
  no rule. There is no spacing scale being followed, only per-section guesses.
- **Zero interaction feedback beyond colour on text links.** Buttons have no hover,
  no active, no focus-visible ring. Cards have no hover state. Nav items shift text
  colour and nothing else. Nothing on the page responds to a cursor, which is the
  single loudest "unfinished" signal against the Linear/Stripe/Vercel/Arc benchmark.
- **Everything is 720px, centred, stacked.** `max-w-3xl` on every homepage section
  and `max-w-5xl` on the chrome. One column, one rhythm, top to bottom, on all 45
  pages.

### 2. Reads as AI-generated: CONFIRMED (mechanical), copy prose is better than expected

- **Em dashes are everywhere: 251 across 68 tracked files**, including 44 in the
  main marketing copy source `src/content/pages.ts`, 12 in `/method`, 10 in
  `llms.txt`, 4 in the layout chrome, and one in the `package.json` description.
  They appear in the h1 subhead, the mirror banner, the footer, and the majority of
  pSEO body paragraphs. This alone is a failed pass.
- **The three-card feature grid is the canonical AI-generated shape**: three equal
  cards, identical treatment, no visual variation between them, no imagery, sitting
  directly under the hero.
- **Centred-everything layout with no asymmetry** anywhere on the site.
- Prose itself is a genuine bright spot and mostly needs leaving alone. There is no
  "unlock/elevate/supercharge/seamless/effortless" register, no gradient hero, no
  stock imagery, and the copy is specific about what the tool measures rather than
  abstract about benefits. The copy problem here is punctuation and structure, not
  voice. Rewrites should preserve the existing voice and only remove the em dashes
  and restructure the layout around the copy.

### 3. Illustrations do not represent the product: CONFIRMED, by absence

There is not a single illustration, diagram, graphic, icon or image anywhere on the
marketing site. The site ships zero SVG and zero raster assets. This fails the test
in its strongest form: there is nothing to echo the app UI because there is nothing
at all. The product has an unusually strong visual language available to it and
unused, namely a confidence band with an uncertainty interval, a per-passage
signal breakdown and a z-statistic against a chance line, and none of it appears
anywhere except as plain text inside the result panel.

### 4. Not enough UI mockups: CONFIRMED

Real product screens shown on the marketing site: **zero framed mockups**. The
homepage embeds the live `Checker` in its empty state, which is a text box and a
disabled button, so the one place a visitor could see what the product produces
shows them nothing until they act. `/pricing`, `/method`, `/limits`, and all 35+
pSEO pages under `/for`, `/vs`, `/guide`, `/in` are text-only from top to bottom.
Nobody arriving on `/for/university-students` from search ever sees a result screen,
a confidence band, or a per-passage breakdown before deciding whether to trust the
tool.

### 5. Does not draw the eye, not unique: CONFIRMED

The site currently has no art direction a visitor could describe afterwards. The
serif-for-argument, mono-for-measurement idea in the stylesheet comment is a good
instinct and the right seed, but it is stated in a comment and never executed with
enough conviction to register.

**The one distinctive choice this brand should own: the measurement band.** A
horizontal band with a hatched uncertainty interval, a hard marker at the measured
value, and a chance line to read it against. It is the literal output of the
product, it is unlike anything competitors show, and it works at every scale: as
the hero graphic, as a section rule, as the result display, as the per-passage
heatmap, and as the shape inside the logo lockup. Paired with the archival
ink-on-paper palette, the seal blue used only for what was measured, and the amber
signal used only where a mark was actually found, that is a design language nobody
else in AI detection is using. The competitors all reach for the same gradient
classifier dashboard.

### Out of scope, noted for Harden (not fixed here)

- `/docs` returns 404 on the live deployment. The real routes are `/docs/api` and
  `/docs/mcp`, and nothing links to a `/docs` index. This is a routing correctness
  issue, not a design one.

---

## Fixes applied 2026-08-12

Recorded after implementation; see `CHANGELOG.md` for the shipped commits.

1. **Design system landed** (`src/app/globals.css`, `src/components/brand/*`). A
   real type scale with a display tier, an eyebrow/label tier and tabular measured
   figures; a spacing rhythm applied through shared section primitives; the
   `seal`/`signal` families put to work with an assigned meaning each (`seal` =
   measured, `signal` = a mark was found, `ink` = everything else); three surface
   elevations instead of one; and hover, active and `focus-visible` states on every
   interactive element.
2. **Every em dash removed** across all 68 files, rewriting each sentence rather
   than substituting a semicolon or a colon crutch, preserving the existing voice.
   Guarded by a test so a future edit cannot reintroduce one.
3. **The measurement band became the signature.** New `Band`, `Hatch`, `Eyebrow`
   and `Rule` brand primitives, used in the hero, in section dividers, in the
   result view and in the per-passage breakdown, so the marketing site and the app
   share one shape language.
4. **Real framed product mockups** on the homepage hero, on each feature section and
   at the foot of every pSEO page, rendered from the real result components against
   a real analysis rather than pasted-in images, inside a browser chrome frame.
5. **Light interactivity**: parallax drift on the hero exhibit, hover-reactive
   passage rows, and a band that settles into position on first paint, all disabled
   under `prefers-reduced-motion`.
