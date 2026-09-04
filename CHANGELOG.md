# Changelog

## 2026-09-04: fix /api/v1/calibrate crashing on every call, and repo-wide lint cleanup

Two pre-existing bugs, unrelated to the rewrite-engine pivot, found via
testing during that work and fixed here.

- Fixed: `POST /api/v1/calibrate` crashed with a 500 on every single call.
  Root cause: the route imported `checkDailyBudget`/`recordCalibration`
  from `calibrate/metering.ts`, a browser-only, IndexedDB-backed daily
  budget tracker built for `src/components/calibrator/budget-status.tsx`
  (a client component); `indexedDB` does not exist in the Next.js server
  runtime, so every call threw a `ReferenceError`. Replaced with: a real
  per-request word cap for anonymous callers (`PLANS.anonymous.wordCap`,
  the same 1,500-word cap the browser check uses, since a stateless REST
  call has no caller identity to track cumulative daily usage against),
  and the existing, correct, database-backed `checkAllowance`/`recordUsage`
  ledger (the same one `/api/v1/check` bills against) for API-key callers.
  Also fixed a hardcoded `API_PRICE_PENCE_PER_1K_WORDS = 1 // Placeholder`
  that silently ignored the real configured price, and two error paths
  ("Text is empty" on whitespace-only input, "Dictionary not available"
  for a schema-valid but calibrate-unsupported language) that were wrapped
  in a generic 500 instead of a 400 naming the real, foreseeable cause.
  `tests/calibrator-api.test.ts`: all 18 tests pass against a real running
  dev server (was 0 of 16 before this fix; two new tests added for the
  corrected behavior).
- Fixed: 16 pre-existing ESLint errors across `src/lib/calibrate/*` and
  its callers (unused imports/vars, two unsafe non-null-assertions on an
  optional chain). `npx eslint .` now reports zero problems.

## 2026-09-04: pivot to an on-device rewrite engine

MarkWitness becomes primarily an on-device rewrite tool (reduces detectable
AI-style evidence in text a user wrote themselves), with detection kept as a
complementary, honest entry point. Full reasoning: `docs/REWRITE_PHILOSOPHY.md`
(supersedes `docs/NO_REMOVAL.md`, archived at `docs/archive/NO_REMOVAL.md`).
Claims stay conservative throughout: "reduces detectable evidence," never
"100% undetectable" or "guaranteed to pass," enforced by
`tests/product-constraints.test.ts` scanning the whole source tree.

- Added: `src/lib/rewrite/`, an isomorphic rewrite engine (targeting, scoring,
  fact-lock, orchestrator) reusing the detector's own watermark arithmetic to
  score candidates. Two real backends behind one `RewriteBackend` interface:
  - **Standard** (`backend/rule-based.ts`): deterministic dictionary/AI-tell
    substitution, zero download, ships today on every tier.
  - **Advanced** (`backend/browser.ts`, `backend/node.ts`,
    `backend/transformers-shared.ts`): a real local LLM (Qwen2.5, pinned by
    exact repo + commit revision in `models.ts`) run via Transformers.js,
    WebGPU/WASM in the browser or onnxruntime-node in the MCP server/CLI.
    Downloads weights straight from the Hugging Face CDN on first use, never
    from a MarkWitness-operated server; falls back to Standard automatically,
    with the fallback reason surfaced, if the device can't run it.
- Added: `src/lib/calibrate/ai-tells.ts` + `patterns.ts`, the deterministic
  em-dash/stock-phrase pass shared by the rewrite engine and the existing
  calibrator.
- Added: `/rewrite`, the browser UI (`src/components/rewrite/rewrite-tool.tsx`)
  with a strength slider, tier/model selection, live model-download progress,
  and a trust indicator that splits network calls by destination (same-origin,
  which must always read zero, versus the model-weight CDN when Advanced is
  downloading).
- Added: `reduce_ai_evidence` MCP tool (`mcp/server.ts`), with a `model`
  parameter (`standard`/`advanced`). Unlike `check_document`, this has no
  hosted branch at all, on any tier: always runs in-process.
- Added: `@markwitness/rewrite-engine` (`packages/rewrite-engine`), the
  standalone npm package/CLI (`markwitness-rewrite`) publishing the same
  engine for third-party callers, since rewriting has no REST endpoint by
  design. Built from `src/lib/rewrite` via `npm run build:rewrite-engine`
  (tsup), verified end-to-end against a real file (rule-based) and against
  real downloaded model weights + inference (`npm run test:models`, opt-in,
  not part of default CI).
- Every surface that previously stated the no-removal policy was rewritten,
  not just the code: `README.md`, `llms.txt`, `pricing.json`, `pricing/page`,
  the FAQ, `openapi.json`, `json-ld.tsx`, the evidence-report PDF footer,
  the mirror-banner, and several pSEO/blog pages that argued from the old
  policy. A second sweep, triggered by live-testing a new page and noticing
  a leftover disclaimer, found and fixed several more high-visibility
  survivors: the homepage's "It will never remove a mark" section, a whole
  `/limits` section, `/docs/mcp`, `/docs/api`, the EU AI Act guide, and the
  shared `LimitNote` boilerplate in `long-tail-page.tsx` and
  `blog-post-view.tsx` that rendered on every `/for/*`, `/vs/*`, `/guide/*`,
  `/in/*` and blog page.
- Fixed a real correctness bug in `effectiveRewriteModel` (`models.ts`):
  the Node/MCP/CLI advanced backend was silently downgrading every Pro-tier
  call to the Free-tier model, because the "no WebGPU, use the smaller
  model" rule (correct for a weak browser) was also firing for
  `onnxruntime-node`, which never reports WebGPU. Fixed by making the rule
  environment-aware (`device: 'webgpu' | 'wasm' | 'cpu'`); verified live
  that Pro now genuinely resolves to the 1.5B model on Node.
- Re-verified the "ai humanizer" keyword cluster live via Google Ads
  (`docs/seo_geo_content_plan.md`) and shipped two pages grounded in that
  data: `/guide/ai-humanizer-how-it-actually-works` and
  `/vs/ai-humanizer-tools` (a new `kind: 'humanizer'` branch in the
  `/vs/*` comparison template, alongside the original detector-competitor
  shape).

## 2026-08-12: content engine launch (15 blog posts)

Stage 5: SEO/GEO content, aligned to the product's own verified keyword
research (`docs/seo_geo_content_plan.md`, materialised this stage from the
prep-stage research recorded in the Product Pipeline row, no invented volumes).

- Added: `/blog`, a data-driven blog matching the site's existing pSEO
  pattern (`src/content/blog-types.ts`, `src/content/blog-posts-{a,b,c}.ts`,
  `src/components/blog-post-view.tsx`, `src/components/blog-index.tsx`).
  Category filtering (Academy / News / Reviews) via `?category=`.
- Added: `blogPostingLd`, `howToLd`, `reviewLd` to `src/components/json-ld.tsx`.
  Every post carries BlogPosting + FAQPage; how-to and review posts add the
  matching schema type.
- Added: 15 posts, published dates spread across 2026-08-06 to 2026-08-12,
  varied across category, format (how-to, deep-dive, listicle, review,
  data-study, case-study, skyscraper) and intent. Each carries a featured
  image (Unsplash, keyword-bearing alt text), a TL;DR box, a table of
  contents, 3-5 FAQs, a data table, one attributed quote (role-based or
  clearly-anonymised, never a fabricated quote from a named real company),
  common pitfalls, and internal/external links. External links are drawn only
  from a pool of independently verified sources (EUR-Lex, the European
  Commission's AI Act page, NIST, the ICAI, two arXiv papers, and the
  detector vendors' own published figures).
  Zero content anywhere describes detector evasion, "humanising", or
  paraphrase-to-evade techniques: the product's own permanent no-removal
  constraint extends to the blog's editorial line, not just the product
  surface.
- `src/app/sitemap.ts` now includes all 15 post URLs, read from `BLOG_POSTS`
  rather than a hand-maintained list, so a future post cannot ship unlisted.
- `next.config.ts`: added `images.remotePatterns` for `images.unsplash.com`
  (blog hero images only; does not touch the free check's privacy contract).

## 2026-08-12: hardening pass (functionality, not design)

Stage 4 QA: ruthlessly critical about whether it works, not how it looks.
Full findings and journey-by-journey evidence: `docs/hardening_review.md`.

- Fixed: `/docs` 404'd on the live deployment (`src/app/docs/{api,mcp}`
  existed with no index). Added `src/app/docs/page.tsx` and listed it in
  `sitemap.ts`.
- Fixed: `/favicon.ico` 404'd (an operator change request from 2026-08-11
  that had gone unaddressed). Generated a real icon from the product's own
  measurement-band shape in its own brand colours, not a placeholder.
- Fixed: `scripts/e2e-live.mts` asserted stale copy ("band 50.8%–55.6%") left
  over from before the premium polish pass intentionally reworded it to
  "interval 50.8% to 55.6%", and did so case-sensitively even though the text
  renders uppercase via CSS. That is the same class of bug fixed once before,
  in the 2026-08-11 entry below. The product was correct; the
  live-verification script was stale.
- Fixed: a comment in `checker.tsx` pointed at a test file
  (`privacy-contract.test.ts`) that no longer exists under that name. The
  real test is `tests/product-constraints.test.ts`.
- Added: `src/lib/billing.test.ts`, 8 tests covering the Stripe
  webhook's plan-change logic (upgrade on checkout, retain pro while
  active/trialing, downgrade to free on cancellation or lapse, and the two
  no-accountId no-op paths). This was real, untested business logic that
  didn't require live Stripe credentials to verify.
- Proved for the first time end-to-end: **hosted-mode MCP** (a real API key,
  the real MCP protocol, against the live deployment). Previously only
  local-mode MCP and the raw HTTP API had been proven separately.
- Re-verified live, with fresh evidence rather than trusting prior-stage
  notes: the zero-upload free check, signup/login/saved-history, the
  signed-up free-tier word cap, the 402/400/405 API error contract, and the
  Stripe-gated revenue path (still correctly blocked on credentials for this
  product specifically, and not worked around).

## 0.1.0, 2026-08-11

First build. Everything below was verified by the checks in `npm run check`
unless explicitly marked otherwise.

### Detection engine

- Keyed green-list watermark test (Kirchenbauer et al. 2023) with a Wilson
  interval on the green rate, one-sided p, and a refusal below 40 distinct word
  pairs rather than a z score the normal approximation cannot support.
- Repeated word bigrams scored once, so a repetitive human document cannot
  manufacture its own signal.
- Key-free style channel: 14 register features against per-language corpus
  baselines, in standard deviations, with a seeded percentile bootstrap band.
- Benjamini-Hochberg correction across per-passage tests before any passage is
  presented as a finding.
- Synchronous SHA-256 / HMAC-SHA256 in-repo, verified against `node:crypto` and
  the RFC 4231 vectors, so browser and server produce byte-identical results and
  a saved evidence report reproduces exactly.
- Every statistic typed `number | null` beside a status and a reason, so "not
  computed" is unrepresentable as a number.
- **Positive control in the test suite:** text marked under a key is detected at
  z > 8, p < 1e-6, and the same text sits at chance under a different key.

### Reference baselines

- Measured from ~597,000 words of contemporary Wikipedia prose (CC BY-SA) across
  English, Spanish, French, German and Portuguese.
- Every fetched document language-verified by the engine's own identifier before
  inclusion; corpus provenance travels inside each baseline and is cited on
  screen and on the report.
- Build fails rather than emitting a baseline under 120 measurement chunks or
  with a degenerate feature distribution.

### Surfaces

- Free no-signup check running entirely in the browser, capped at 1,500 words,
  with confidence band, per-passage heatmap and stated limits.
- `/verify`: mark a passage under the published reference key in your own
  browser and watch the detector find it, with a different-key control.
- `/method`, `/limits`: the full method and the stated limits, read from the
  engine so they cannot drift from what a result says.
- 20 long-tail pages across audience, comparison, guide and language axes, each
  with FAQPage and SoftwareApplication JSON-LD.
- `llms.txt`, `pricing.json`, OpenAPI 3.1, sitemap and robots.
- Accounts (Better Auth + Neon), saved check history, API key issue/revoke.
- `POST /api/v1/check`: API-key authenticated, metered per 1,000 words, 402
  naming the exact limit reached, 503 rather than serving unmetered.
- MCP server with `check_document` and `describe_method`, local or hosted mode,
  smoke-tested over the real protocol in `npm test`.
- `POST /api/v1/report`: the dated PDF evidence report, anchored to the document
  by SHA-256, with the stated limits printed in full on the document itself.

### Constraints enforced as tests

- No mark removal, paraphrase or score-reduction capability anywhere, on any
  surface. See `docs/NO_REMOVAL.md`.
- No network call anywhere on the on-device path.
- The Learnaway mirror-product pointer ships in the root layout, so no page can
  omit it.

### Not verified live in this build

- **Stripe billing.** No payment processor is configured on this deployment (the
  only available Stripe connection belonged to a different product). The billing
  code is real and typechecked, not a stub, but no end-to-end purchase has been
  made, so the pricing page shows paid plans as unavailable rather than a button
  that fails, and `/api/billing/checkout` returns 503.

## 2026-08-12: premium polish pass (design and brand only)

Design quality only. No functional, pricing or business-logic change.

- A real design system in `globals.css` and `components/brand`: five type tiers,
  one vertical rhythm, three surface elevations, one focus treatment, hover and
  active states everywhere. `seal` now means "measured" and `signal` means "a
  mark was found", so colour carries meaning rather than decoration.
- The measurement band is the signature shape, used in the logo lockup, under
  every heading, in the pricing tiers, in the result view and in every exhibit.
- `components/checker/measures.tsx` is the single rendering vocabulary for a
  measurement, shared by the app and the marketing site, so a marketing panel
  cannot show something the product does not produce.
- The homepage hero is the same paragraph measured twice, marked and unmarked,
  analysed by the real engine at build time. Every long-tail page carries a real
  result screen.
- 251 em dashes removed across 68 files by rewriting the sentences.
  `tests/house-style.test.ts` guards that and the filler vocabulary.
- Fixed: the reveal-on-scroll wrapper could leave content permanently invisible
  if its observer never fired. It now starts visible and only ever adds motion.
- Full review, with findings and evidence: `docs/premium_polish_review.md`.

## 2026-08-11: deployed

- Live at <https://markwitness.helm7.com>; every sampled route returns 200
  serving this product.
- `src/lib/evidence-report.test.ts`: the paid wedge is now covered by tests that
  build real PDFs and read the text back out of the compressed content streams,
  rather than asserting the function returned bytes. It is unreachable through
  the UI while billing is off, so nothing else exercised it.
- Fixed two live E2E assertions that searched for stat labels case-sensitively
  while `innerText` returns them uppercased by CSS. The product was correct; the
  assertions were checking a stylesheet.
