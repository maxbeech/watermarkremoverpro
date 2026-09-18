# NeverPrompted.com: launch strategy

Materialised 2026-09-18, during the Stage 6 second-brand build. Companion to
`docs/seo_geo_content_plan_neverprompted.md` (the keyword matrix) and
`docs/seo_geo_content_plan.md` (WatermarkRemoverPro's own plan, which this one
deliberately does not duplicate).

## Why this exists

WatermarkRemoverPro already does more than its name suggests: on-device
checking for a statistical AI-provenance watermark, plus an on-device rewrite
that reduces detectable AI-style evidence. The verified keyword research in
`docs/seo_geo_content_plan.md` shows the "watermark" framing the brand name
implies is a small cluster, around 630 searches a month, driven by the EU AI
Act's Article 50 deadline. The "make my AI-flavoured writing sound like me"
framing the product actually serves sits in a cluster roughly two hundred
times larger, and the brand name works against it: nobody searching "ai
humanizer" thinks to try a site called WatermarkRemoverPro.

NeverPrompted.com was bought, via Vercel, to fix that mismatch. Same product,
same features, same pricing (Free at £0, Pro at £19/month), but a brand built
to be found by people who want their own writing to stop sounding like a
prompt output. The name itself came out of a mechanically generated shortlist
of 875 candidates (`docs/domain_shortlist_unai_dump.md`) built by negating
words people actually use for AI-sounding prose. "Prompted" negated by
"never" reads as "this was never generated from a prompt", which is a
stronger brand story than any direct competitor's domain in this space:
walterwrites.ai, gpthuman.ai, stealthwriter.ai, undetectable.ai are all
literal, descriptive domains, and most of them compete on "bypass rate" and
"undetectable" claims that this product's own claims policy forbids
repeating (`docs/REWRITE_PHILOSOPHY.md`, enforced in
`tests/product-constraints.test.ts`).

## The two problems this document, and the code changes alongside it, solve

1. The codebase had no multi-brand infrastructure: one hardcoded `SITE`
   constant, one Vercel project, no host-based routing, and the brand name
   baked directly into hundreds of lines of marketing prose.
2. Running the same product on two domains risks Google reading the new site
   as thin or duplicate content, if its pages are just the old ones with the
   brand name swapped. The fix isn't hiding one site from Google, or
   canonicalising one into the other. It's giving each domain genuinely
   different on-page text serving a genuinely different angle.

## Part A: technical architecture

### A1. One brand config, not two codebases

`src/lib/site.ts` now holds a `BRANDS` registry keyed by `BrandId`
(`'watermarkremoverpro' | 'neverprompted'`), resolved once at build time from
`NEXT_PUBLIC_BRAND` (unset reproduces the original single-brand behaviour
exactly, since it defaults to `'watermarkremoverpro'`). Everything that used
to read a flat `SITE` object still does; it just resolves to whichever
brand's values were chosen at build time.

`PLANS`, `MIRROR_PRODUCT` (the pointer to the sibling product, Learnaway, for
anyone wanting to screen someone else's writing rather than their own), and
the shared detection/rewrite engine are never brand-specific. Pricing and
features are identical on both brands by requirement, and any future feature
added to that shared layer, a tone-of-voice memory capability or anything
else, ships to both brands automatically, the same way today's rewrite
engine and pricing already do. There is no per-brand flag to remember to
flip.

### A2. Content is selected per brand, not templated

`src/content/pages.ts` and `src/content/blog.ts` were restructured from
single files into per-brand modules behind a thin selector:

```
src/content/
  pages-types.ts                    # shared types, unchanged
  watermarkremoverpro/pages.ts      # the original content, moved verbatim
  neverprompted/pages.ts            # NeverPrompted's own long-tail content
  pages.ts                          # picks the array by brand, re-exports the same functions
  watermarkremoverpro/blog-posts-{a,b,c}.ts
  neverprompted/blog-posts.ts
  blog.ts                           # same selector pattern
```

None of the four route files that render `/for/*`, `/vs/*`, `/guide/*` and
`/in/*` needed to change, since they only ever call `pagesInGroup`/`findPage`
from `@/content/pages`, and that module's public shape is unchanged. Neither
did `sitemap.ts` or `robots.ts`.

`tests/product-constraints.test.ts`, the test that enforces the claims policy
(no "remove", no "undetectable", must disclose the on-device guarantee),
walks the whole `src/` tree rather than an explicit file list, so
NeverPrompted's content is checked automatically the moment it exists.
`tests/rename.test.ts` needed no change either: it pins the underlying
package, plugin and MCP server identity to `watermarkremoverpro`, which is
correct to keep exactly as it is. NeverPrompted is a marketing brand in front
of one product, one repository, one package; it is not a second package
identity.

A new `tests/brand.test.ts` asserts that `NEXT_PUBLIC_BRAND` resolution
throws on an unrecognised value rather than falling back silently, and that
neither brand's rendered content (not source comments, which are allowed to
cross-reference the sibling brand to explain why the split exists) mentions
the other brand's name. This is the guard against the actual risk here: not
a typo, but a page written for one brand and reused for the other without
being rewritten.

### A3. What stays fixed regardless of brand

A handful of identifiers are shared infrastructure, not display names, and
must not be forked per brand:

- The `WATERMARKREMOVERPRO_*` environment variable names that hold the
  detection keys and model configuration. These feed the actual
  cryptographic watermark scheme; both brands must use identical values, or
  a "check" would mean a different thing on each site.
- The pre-rename product-name string used as the domain-separation secret in
  `src/lib/detector/keys.ts` (see that file, and `tests/rename.test.ts`,
  for why it is pinned forever). It is hashed into the green-list
  construction; a new value would be a new key, and every evidence report
  issued under the old one would stop verifying.
- The `mw_live_` API key prefix, the npm package name, the MCP server id and
  the plugin marketplace identity. Customers already hold API keys with that
  prefix, and an agent already has that MCP server installed under that
  name.

### A4. Logo, favicon and colour

NeverPrompted needs its own mark, restructured so `src/components/brand/
logo.tsx` selects between `public/brand/watermarkremoverpro/` and
`public/brand/neverprompted/` by brand id, and the favicon/apple-icon
convention files (currently filesystem-based with no brand awareness at all)
converted to Next's dynamic icon generation so a NeverPrompted build does not
silently ship WatermarkRemoverPro's favicon. Colour palette stays shared at
launch: same tokens, different logo, "same product, different door". A
distinct accent colour is a reasonable follow-up, not a launch requirement.

Commissioning the actual mark is outside the scope of this document; this
section only describes the code hook for it.

### A5. Two Vercel projects, one repository

Each brand is built and deployed as its own Vercel project from the same
GitHub repository and branch, with brand selection as a build-time
environment variable. This fits the codebase's heavy use of static
generation (`dynamicParams = false`, one-week ISR everywhere) far better
than request-time host-based routing would, and needs no new middleware,
since none exists today.

Per-project environment variables: `NEXT_PUBLIC_BRAND` and
`NEXT_PUBLIC_SITE_URL` differ; `BETTER_AUTH_SECRET`, `DATABASE_URL`,
`STRIPE_PRICE_PRO`, `STRIPE_WEBHOOK_SECRET` and
`NEXT_PUBLIC_GA_MEASUREMENT_ID` are each new and separate; the
`WATERMARKREMOVERPRO_*` backend secrets and `STRIPE_SECRET_KEY` are copied
verbatim, since they are shared infrastructure (A3).

Billing: one Stripe account, a separate Price object for NeverPrompted at
the identical £19/month, not a second account (real onboarding overhead for
no benefit, since pricing is intentionally identical) and not one shared
Price (loses the clean per-brand accounting a separate Price gives for free).
`createProCheckout` already references the price purely by environment
variable, so this needed no code change beyond tagging the checkout session
with the brand for good measure.

Accounts: NeverPrompted gets its own signups and its own database, not a
shared login across both domains. Browser cookies cannot be shared between
two unrelated domains without building a real cross-domain token exchange,
which does not exist today and was not judged worth building for this
launch; a customer buying Pro on one brand does not expect it to appear on
the other, and this matches how every other product in this factory is
already run.

### A6. Sequencing, so the live site is never at risk

1. Land the brand config with `NEXT_PUBLIC_BRAND` unset in production; the
   default reproduces today's exact output.
2. Land the confirmed pre-existing bug fixes (the JSON-LD description, the
   email sender name, the FAQ) on their own, since they are real bugs today,
   independent of NeverPrompted.
3. Land the content-selector restructure with NeverPrompted's arrays still
   empty, to prove the plumbing without yet writing real copy.
4. Fix the apex-to-www redirect to read the active brand's domain.
5. Land the logo/icon restructuring.
6. Run the whole stack in production, still serving WatermarkRemoverPro, for
   a few days before touching anything brand-specific.
7. Author NeverPrompted's real content. No deploy risk to WatermarkRemoverPro
   while this is in progress, since it lives in files nothing imports yet
   under the default brand.
8. Provision the second Vercel project, database, Stripe price and analytics
   property; deploy.
9. Smoke-test end to end before pointing DNS at it.

Steps 1 to 5 are complete and verified as of this document's date: typecheck
clean, all tests passing, and both a `watermarkremoverpro` and a
`neverprompted` production build succeed, the latter with empty content
placeholders and no crash. Step 8, provisioning actual external accounts,
needs the account holder, not code, and is tracked separately.

## Part B: content and positioning

### B1. The split

Same two features on both brands; only which one leads changes.

WatermarkRemoverPro leads with watermark and AI-detection defence: prove you
did not use undisclosed AI, check for a provenance mark, understand an
accusation. It keeps its existing statistical, evidentiary register: z
scores, confidence bands, the honest catch stated on every result.

NeverPrompted leads with sounding human: get your own voice back, stop
reading like a prompt output. Plain-English register, not the jargon of
"humanizer" as the only voice, though that term still carries almost all of
the volume (see B3).

Both brands disclose the same limits (never "remove", never "undetectable",
always on-device, cannot guarantee defeating an undisclosed vendor
watermark) and carry the same pointer to Learnaway for anyone wanting to
screen someone else's writing. The claims policy is shared, not
brand-specific, and is enforced automatically on any new content either
brand ships.

### B2. What needs genuinely new copy, and what can share

| Surface | Treatment |
|---|---|
| Homepage, retitled product page | Fully distinct copy required |
| `/for/*` (audience pages) | New audience set, not the same five with the name swapped |
| `/vs/*` (comparisons) | Same competitor set is fine; the argument (tone preservation and on-device privacy, not "we're more honest than they are") needs to be written fresh |
| `/guide/*` | NeverPrompted's own plain-English guide family is the distinctive core; link out to WatermarkRemoverPro's deep forensic explainers rather than duplicate them |
| `/in/*` (languages) | Light variation is enough; the underlying fact, that a style baseline is measured per language, is not a positioning claim |
| Blog | Its own editorial calendar from day one, not reskinned posts |
| Pricing, legal pages | Shared in substance; these are utility pages, not content competing for search terms |
| Workspace/app UI | Fully shared; not indexed content |

### B3. The plain-English niche

Live-checked this session via Google Ads Keyword Planner, US, low confidence
given the small absolute numbers involved: "does my writing sound like ai"
averages 140 searches a month, low competition, stable across the last
twelve months. Adjacent natural-language phrasings returned no measurable
volume at all, meaning the real volume in this space sits almost entirely in
the industry term "ai humanizer" itself (823,000 a month), which
WatermarkRemoverPro has already partly claimed with two existing pages.

NeverPrompted should still own the plain-English cluster deliberately,
alongside, not instead of, going after the higher-volume humanizer terms as
its actual revenue pages. It is uncontested, it is a natural fit for a brand
named NeverPrompted, and it is the shape an AI answer engine prefers to cite
directly. Where WatermarkRemoverPro has already shipped into the humanizer
cluster, its pages stay as they are; new investment in that cluster from
here moves to NeverPrompted, so the two brands are not writing competing
pages for the same terms.

### B4. Disclosure

One honest, low-key mention of common ownership per site, in the footer or a
short About page each brand holds itself rather than both pointing at one
shared hub. No heavy cross-linking of commercial content pages between the
two domains: under this split they target different terms anyway, so there
is no legitimate reason to link them, and doing so risks reading as a
manipulative link network rather than two honest disclosures.

### B5. The keyword and content matrix

See `docs/seo_geo_content_plan_neverprompted.md` for the full Content
Production Prioritisation Matrix, built the same way the WatermarkRemoverPro
one was: Google Ads Keyword Planner data, seeded from the existing site, the
two live humanizer-cluster pages already shipped, and four named
competitors (QuillBot, Undetectable.ai, StealthGPT and HIX Bypass).

## What is still open

- Commissioning NeverPrompted's actual logo and, if wanted later, a distinct
  accent colour.
- Provisioning the second Vercel project, Neon database, Stripe price, GA4
  property and email sending domain; this needs account access this build
  process does not have.
- Writing the full pSEO catalogue, homepage and launch blog posts, tracked
  as its own body of work rather than in this document, since content
  quality cannot be verified by a test suite the way the code above can.
- Cleaning up an unrelated stray worktree directory found during this build
  (`.claude/worktrees/portfolio/`) that is not excluded from the project's
  lint configuration and floods `npm run lint` with several thousand
  pre-existing errors unconnected to this work. Not touched here in case it
  is someone's in-progress work.
