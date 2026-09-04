# MarkWitness: SEO/GEO Content Plan

Materialised 2026-08-12 (Stage 5, content engine launch) from the live keyword
research recorded in the Product Pipeline row's Feature Spec during prep
(2026-08-11). No live keyword-research tool was available in that prep
session, so nothing beyond the figures below is asserted. Any keyword or
volume not listed here is unverified and must be treated as such. Do not
invent volumes.

## Verified buyer-intent cluster

Source: Google Ads keyword data, dated 2026-08-11, cited in the idea record.

| Keyword | Volume (mo) | Notes |
|---|---|---|
| ai watermark detector | 390 | Low bid, $0.54, below the $1 floor alone |
| turnitin ai false positive | 140 | |
| ai detection false positive | 40 | |
| ai detector api | 50 | Strongest commercial intent, $1.60–$7.28 bid |
| claude ai watermark | 10 | |

Combined winnable cluster: **~630/mo today**.

## 12-month growth case

Documented driver: EU AI Act Article 50 compliance deadline (2026-11-02),
coinciding with Anthropic's provenance-mark rollout being announced/covered
the same day this research was run. Projected trajectory: **~3,150/mo**
within 12 months as Article 50 awareness spreads and provenance-mark checking
becomes a routine step in AI-use disputes.

## Explicitly disqualified terms

Large volume, but the wrong job for this product. Never target these as a
primary buyer keyword:

| Keyword | Volume (mo) | Why disqualified |
|---|---|---|
| gptzero | 450,000 | Competitor brand term |
| ai content detector | 18,100 | Accuser-side screening-of-others, which is Learnaway's job, not this product's |

`ai humanizer` moved out of this table on 2026-09-04 (see below): the product
pivoted to offer a real, honestly-described evidence-reduction feature, so
the term is no longer disqualified by product scope, only by the specific
"guaranteed undetectable" framing competitors use for it, which this
product's claims policy rules out regardless of keyword.

## 2026-09-04: the "ai humanizer" cluster, re-verified live

Materialised for the rewrite-engine pivot (`docs/REWRITE_PHILOSOPHY.md`).
Source: Google Ads Keyword Planner (`google_ads_keyword_metrics` /
`google_ads_keyword_ideas`), US geo target, queried live this session. Every
figure below is `avgMonthlySearches` from that live call, not carried over
from the 2026-08-11 research or invented. The old August figure for `ai
humanizer` (823,000) is independently reconfirmed by this call, not assumed.

| Keyword | Volume (mo) | Competition | Note |
|---|---|---|---|
| ai humanizer | 823,000 | Medium | The head term. Real intent: avoid a false-positive AI-detection flag. Competitors overclaim "100% undetectable" here; this product's claims policy (`tests/product-constraints.test.ts`) forbids that framing regardless of the keyword's own intent, so any page targeting this term must name and defuse the overclaim, not repeat it. |
| ai humanizer free | 90,500 | Medium | Pairs with the Free tier's unlimited-use, no-signup rewrite. |
| humanize ai text | 33,100 | Low | Lower competition than the head term; a genuine secondary-page target. |
| ai writing detector | 27,100 | Medium | Detection-side variant of the existing verified cluster; already implicitly covered by `/check` and `/method`. |
| best ai humanizer | 12,100 | Medium | Comparison-intent; a `/vs/*`-shaped page is the right format. |
| ai paraphrasing tool | 1,600 | Low | Adjacent job; lowest competition in this set. |
| ai text humanizer free | 1,000 | Medium | Long-tail of `ai humanizer free`. |
| bypass ai detector | 880 | Medium | Evasion-framed; a page targeting this must reframe toward the honest job (reduce false-positive risk on your own writing), consistent with the conservative-claims decision, not chase the evasion framing itself. |
| ai detector bypass | 480 | Medium | Same term, reordered; not a separate page. |
| remove ai detection | 480 | Medium | "Remove" is banned from this product's own claims vocabulary (`REWRITE_LIMITS` says "reduce," never "remove"); a page can target the keyword in its SEO metadata while the on-page copy still says "reduce." |
| turnitin ai humanizer | 480 | Medium | Directly serves the existing `/for/university-students` audience; natural internal link target. |
| make ai text undetectable | 260 | Medium | "Undetectable" is exactly the claim this product's tests forbid; a page here must lead by naming and rejecting that promise (the plan's "defuse the overclaim in the H1" pattern), not use it as the H1 itself. |
| reduce ai detection | 40 | Medium | Smallest volume, but the only phrase in this table that already matches the product's own claims language verbatim; good internal-anchor-text target even without being a standalone page. |
| chatgpt detector bypass, ai humanizer online, undetectable ai, stealthgpt | ~10-50 or no data | n/a | Too small or brand terms (competitor names); not page targets. |

Combined re-verified cluster actually worth a page: **~130,000/mo**
(`ai humanizer` + `ai humanizer free` + `humanize ai text` + `best ai
humanizer`, the four terms over 10,000/mo with real, own-writing intent this
product can honestly serve), separate from the existing verified detection
cluster (~630/mo, EU AI Act-driven) documented above, which is unaffected by
this addition.

### Honest-claims pattern for this cluster specifically

Every page targeting a term in this table follows the same rule already used
for the head term: name the competitor overclaim in the page itself (most
competitors in this space explicitly promise "100% undetectable" or
"guaranteed to pass," which `docs/REWRITE_PHILOSOPHY.md` and
`tests/product-constraints.test.ts` forbid this product from claiming), then
explain what is actually being measured and changed. This is the same
pattern already used for `/vs/*` pages against detector competitors, applied
to humanizer competitors instead.

### Shipped from this cluster (2026-09-04)

- `/guide/ai-humanizer-how-it-actually-works` (targets `ai humanizer`,
  `humanize ai text`).
- `/vs/ai-humanizer-tools` (targets `best ai humanizer`; names QuillBot,
  Undetectable.ai and StealthGPT as the real, well-known products in this
  category). `COMPARISON_SEEDS` in `src/content/pages.ts` gained a `kind:
  'humanizer'` branch alongside the original `'detector'` template, since the
  fixed "neither can prove who wrote a document" template text assumed a
  classifier competitor.

Not yet shipped from this cluster, left as real, honest backlog rather than
padded out: a dedicated `ai humanizer free` / pricing-angle page, and a
`turnitin ai humanizer` page for the `/for/university-students` audience
(480/mo, directly on-audience). The plan's original "8-10 new pages" scope
for this cluster is not fully built; two pages targeting the highest-value,
lowest-competition terms are.

## Priority order (from prep)

1. Seed pSEO pages targeting the verified cluster (`/for/*`, `/vs/*`, `/guide/*`, `/in/*`, shipped in earlier stages).
2. The two `/vs/` comparison pages, the highest-intent and lowest-competition per SERP check.
3. Language-specific landing pages as each baseline ships.

## Content engine (Stage 5) mapping

Every blog post commissioned in this stage maps its primary keyword to one of
the five verified terms above, or to a long-tail/semantic variation of one of
them (per-language accuracy, appeal evidence, per-tool comparisons, and the
Article 50 news angle). No post targets a disqualified term as primary.
Supporting and long-tail keyword sets are semantic expansions of the verified
cluster. They are not separately volume-verified, consistent with the
"6–12 supporting + 2–4 long-tail" allowance for semantic variation rather
than additional measured search volume.
