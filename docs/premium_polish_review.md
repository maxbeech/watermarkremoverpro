# Premium polish review: WatermarkRemoverPro

Stage 3b design and brand elevation pass. Design quality only; correctness, business
logic and functional testing belong to Harden, which runs next.

---

## Review 2026-08-12

Audited the live deployment at `https://watermarkremoverpro.com` in a real Chromium
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

Verified on the redeployed live site, not just locally. Before and after
screenshots of the same routes are under `.polish-shots/before/` and
`.polish-shots/after/` (git-ignored; evidence for this pass, not source).

**1. A design system, landed rather than described** (`src/app/globals.css`,
`src/components/brand/ui.tsx`). Five type tiers with real ratios, including a
monospace letterspaced eyebrow tier that labels measurements and a display tier
for the hero. One vertical rhythm applied through a shared `Section`, so no page
picks its own padding. Three surface elevations instead of one. One
`focus-visible` treatment across every interactive element. Hover and active
states on every button, card, nav item, FAQ row, index row and passage row.
`seal` and `signal` now carry an assigned meaning each: `seal` = something was
measured, `signal` = a mark was actually found, `ink` = everything else. A
reader who learns those three on the homepage can read a result.

**2. Every em dash removed: 251 across 68 files**, each sentence rewritten rather
than patched with a semicolon or a colon, preserving the existing voice. The two
places the code genuinely needs the code point (the dash-rate feature the
detector measures on submitted documents, and the WinAnsi fold in the PDF
writer) now use `\u2014` escapes, so behaviour is identical and no literal glyph
remains. `tests/house-style.test.ts` fails the build if one returns, and also
bans the promotional filler vocabulary.

**3. The measurement band is now the signature** (`src/components/brand/band.tsx`).
Track, hatched uncertainty interval, chance line, hard marker. It appears in the
logo lockup, as the rule under every heading, in the pricing tiers, in the app
result view, in the per-passage breakdown and in every marketing exhibit, so the
marketing site and the product are visibly the same object at two distances.
`BandField` is the abstract graphic: the same marks, read against one shared
chance line, hover-reactive per row.

**4. Real product mockups, built from the real components.**
`src/components/checker/measures.tsx` is now the single rendering vocabulary for
a measurement, used by BOTH the app result view and the marketing exhibits. The
homepage hero is the same paragraph measured twice: one copy rewritten to prefer
green-list continuations under the open reference key this product publishes,
one untouched, both analysed by the real engine at build time. Nothing on the
page is a screenshot and no figure was typed by hand. Every long-tail page now
carries a real result screen in a browser frame, so somebody arriving from search
sees what the tool produces before deciding whether to trust it. A constraint
test asserts the shared formatters still refuse to render a null as a number.

**5. Light interactivity**: scroll-linked drift separating the two hero panels in
depth, hover lift on exhibits and panels, hover-reactive rows in the abstract
graphic and in the passage breakdown, and a band that settles into position on
first paint. All of it disabled under `prefers-reduced-motion`.

### One bug this pass introduced and fixed

The reveal-on-scroll wrapper started hidden and waited for an
`IntersectionObserver`, which meant anything the observer never reported stayed
invisible. Screenshotting the deployed homepage caught the second hero panel
missing entirely. It now starts visible, hides itself only once mounted
JavaScript has confirmed the element is below the fold, and carries a timeout
backstop. Motion is allowed to add something to a page; it is never allowed to be
the reason content is not there. The screenshot harness was also wrong: a
full-page screenshot does not scroll, so it photographs any observer-revealed
element as a blank gap. It now browses the page before capturing.
