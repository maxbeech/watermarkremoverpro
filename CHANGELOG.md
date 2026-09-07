# Changelog

## 2026-09-07: privacy policy and terms of service

Added `/privacy` and `/terms`, linked from the footer and listed in the
sitemap at low priority. Neither existed before; both were reachable only as
a 404. Written from what the code actually does rather than a generic
template: the privacy policy is specific about which surfaces never see your
document (the on-device checker and rewriter) versus which do (a saved check
or evidence report persists the analysed passages against your account; a
metered API/MCP check stores only a word count and a document hash), and the
terms describe the real plan limits, billing behaviour and stated detection
limits read from `PLANS` and the engine rather than restated by hand. Both
carry an explicit note that they are not a substitute for a lawyer's review.

## 2026-09-07: production readiness - billing live, repo public

Two gaps recorded in the rebrand entry below are closed:

Stripe billing is live against the product's own account (acct_1UD125Q498dRl0sh,
GB, GBP), not a borrowed one. Created the Pro product and its GBP 19/month
recurring price, registered the production webhook endpoint, and set
`STRIPE_SECRET_KEY` / `STRIPE_PRICE_PRO` / `STRIPE_WEBHOOK_SECRET` in
production. Verified end to end: the dashboard's "Upgrade to Pro" button opens
a real, correctly priced live Stripe Checkout session for the signed-in
account (stopped short of entering card details, deliberately), and the
webhook endpoint rejects a request with a bad signature rather than trusting
it. `stripeConfigured()` still gates every billing path, so a deployment
without these variables keeps degrading to the same honest
"not yet purchasable" state.

The GitHub repo (`maxbeech/watermarkremoverpro`) is now public. It was private,
which silently broke the two install paths this site's own `/docs/mcp` page
documents for agents: `claude plugin marketplace add maxbeech/watermarkremoverpro`
and cloning the repo to run the bundled MCP server, both of which need
anonymous read access. Checked the full history for credentials or secrets
first (none found) before flipping visibility, and confirmed an unauthenticated
clone now succeeds and contains the bundled server at the path the docs name.

Transactional email (`OPENHELM_API_KEY`) remains unconfigured: password-reset
requests still return the same non-account-enumerating message either way, and
the server logs a warning rather than pretending to send. Signup, login,
checking, rewriting, and API-key issuance are unaffected.

## 2026-09-07: rebrand to WatermarkRemoverPro

The product is now WatermarkRemoverPro at watermarkremoverpro.com (was
MarkWitness at markwitness.helm7.com, which stays attached and now serves the
same site rather than breaking old links). Renamed across app copy, metadata,
docs, the `@watermarkremoverpro/rewrite-engine` npm package, and the Claude
Code plugin (moved to `plugins/watermarkremoverpro`, version bumped so
existing installs pick up the update). The GitHub repo moved to
`maxbeech/watermarkremoverpro`.

Left unchanged on purpose: the `MARKWITNESS_API_URL`/`MARKWITNESS_API_KEY`/
`MARKWITNESS_DETECTION_KEYS` env var names, the `mw_live_` API key prefix
(existing customers hold keys with this prefix), the local model cache path,
and the watermark key's cryptographic domain-separation string: all
internal identifiers, not user-facing brand.

Known gap, not fixed here because it needs real credentials: Stripe billing
is still not configured on this deployment (the pricing page already says so
honestly rather than showing a checkout that fails), and neither is
transactional email (`OPENHELM_API_KEY`), so password-reset emails fail
loudly rather than silently. Signup, login, checking, rewriting and API-key
issuance all work normally on every tier without either.

## 2026-09-06: the rewrite engine now acts on what it reports

The engine measured structural tells and AI-associated vocabulary, printed
them, and then did nothing with either. A passage thick with "not just X, but
Y" and six occurrences of "comprehensive" was never sent to the rewriter unless
it independently tripped a watermark or register threshold, which is a
different measurement entirely. Reporting was a dead-end channel.

### Findings now route into the rewrite

- Added: `measureStyleTells()`, a weighted per-passage score. Negative
  parallelism counts 2 (a single occurrence is already a tell), a three-item
  list counts 1 (one is ordinary English), every two elevated words count 1.
- Changed: `targetPassages()` takes that score, so a passage whose only problem
  is how it reads gets rewritten at `balanced` and above. `preserve` is
  deliberately unchanged: it promises to touch only what a real check flags.
- Changed: candidate scoring rewards a candidate for removing the findings the
  passage was targeted for. Previously the ranking was blind to them and could
  pick a candidate that reproduced the construction faithfully.

### Recurring AI vocabulary is now rewritten, not just counted

- Added: `REGISTER_DOWNSHIFT`, 23 same-slot plain-English replacements
  ("robust" -> "strong", "comprehensive" -> "complete"). `balanced` rewrites a
  word once it RECURS, since a single occurrence is a word choice rather than a
  tell; `aggressive` rewrites single occurrences too; `preserve` leaves all of
  it alone.
- Seven counted words are deliberately absent from that table, because no
  context-free replacement is safe: "delve", "leverage", "align", "resonate"
  and "illuminate" govern a preposition, and "tapestry" and "testament" are
  metaphors. They stay reported.

### Two real defects found by running the engine on its own output

- Fixed: the synonym dictionary substituted articles, conjunctions and
  prepositions. "a reliable set" came back as "some reliable set", "for the
  modern enterprise" as "for that modern enterprise", and "to run" would have
  become "toward run". Same failure mode as the auxiliary-verb fix: a flat
  word-list substituter cannot see the slot it is writing into. All 15 function
  words removed, with a test asserting they stay out.
- Fixed: `use` -> `utilize` was in that dictionary, so the tool installed one
  of the best-known marks of machine prose while claiming to remove them. Every
  register-raising variant is gone, now asserted against the elevated-vocabulary
  list itself.
- Fixed: negative parallelism written out in full ("It is not just a tool, it
  is a platform") went unflagged. The pattern only closed on "but", "it's" or
  "its".

### The hook now recommends a strength that can fix what it reported

This has failed twice. The first version recommended `preserve` after
reporting em dashes, and `preserve` deliberately leaves dash punctuation
alone. The second knew about punctuation but not about the vocabulary swaps
added in this same release, and recommended `preserve` after reporting 24 of
them. The report was right both times and the advice attached to it was not,
which is worse than saying nothing.

- Changed: the recommendation is derived from what was found. A construction
  escalates to `aggressive` (the lowest strength that routes a passage to the
  rewriter on style-tell pressure alone), a dash or a recurring word to
  `balanced`, nothing to `preserve`.
- Changed: the closing paragraph matches the strength. At `aggressive` it says
  the constructions go to the rewriter and that `model: "advanced"` is what
  actually restructures them, rather than repeating the "not rewritten" line.
- Added: `recommendStrength()` is exported and covered by
  `tests/hook-recommendation.test.ts`, including a property test asserting the
  hook never names a strength that skips something it just reported. Verified
  end to end: on a document the hook escalated to `aggressive`, `preserve`
  applied 0 swaps and left all five elevated words, while `aggressive` applied
  24 and rewrote 12 of 12 targeted passages.

### The MCP response no longer costs 14,000 tokens a call

Measured on a 612-word document: the full result was about 40 KB of JSON, 31 KB
of it the before/after `AnalysisResult` pair whose per-passage arrays a caller
almost never reads. A tool meant to run on every document in a publishing
pipeline cannot cost that much context.

- Added: `detail` on `reduce_ai_evidence`, defaulting to `summary`. Same
  document now returns about 1,500 tokens, a 9.5x reduction, keeping the
  revised text, the change counts, the before/after headline numbers and what
  is still present. `detail: "full"` returns the complete object unchanged.

## 2026-09-06: zero-install distribution, a real AI-tell library, and ISR

Three gaps against the original brief, closed.

### The MCP server is now installable in one command

Using it previously meant cloning the repository, running `npm install`, and
pointing a client at `npx tsx /absolute/path/to/mcp/server.ts`. That is not a
thing anyone adds to a workflow, and it ruled out every agent not already
holding a checkout.

- Added: `plugins/watermarkremoverpro`, a Claude Code plugin carrying the MCP server,
  a skill telling the agent when to use it, and a `PostToolUse` hook.
  `claude plugin marketplace add maxbeech/watermarkremoverpro` then
  `claude plugin install watermarkremoverpro@watermarkremoverpro`. Verified installed and
  `✔ Connected` on a real machine.
- Added: `tsup.mcp.config.ts` (`npm run build:plugin`) bundling the server to
  one committed 704 KB file that runs under plain `node` with nothing
  installed. Verified by running it in an empty directory with no
  `node_modules` anywhere and calling `check_document` against the bundled
  language baselines.
- Fixed: the MCP server statically imported the advanced (local LLM) backend,
  dragging 1.3 MB of onnxruntime native binaries into the bundle and slowing
  every cold start for a code path most calls never reach. Now imported
  lazily, inside the one branch that uses it.
- Added: a hook that measures public-facing content the agent writes
  (markdown, HTML, anything under `content/`, `posts/`, `blog/`) and reports
  what it found. It never edits the file, ignores source code, and stays
  silent on clean prose and on anything under 120 words.

### The AI-tell library now covers how models actually write

A headless Claude Code session was asked to write a launch post; the hook
found nothing in it. The copy was full of tells ("we're thrilled to
announce", three-item lists throughout), but the library only carried the
2023-era set: "delve into", "moreover", em dashes.

- Added: the extended library, grounded in published work rather than
  invented (Wikipedia's "Signs of AI writing", the Science Advances excess
  vocabulary study, the systematic analysis of verbal tics across frontier
  models). Announcement register, copula avoidance ("serves as a" for "is
  a"), and promotional vocabulary.
- Added: structural detection for negative parallelism ("not just X, but Y")
  and three-item lists, and frequency counts for AI-associated vocabulary
  ("robust", "pivotal", "meticulous"). All reported, none auto-rewritten:
  each is ordinary English on its own and the right fix depends on what the
  sentence is saying.
- Added: `core` / `extended` tiering, wired to `PLANS.*.rewrite.tellLibrary`.
  This is the tier difference the pricing page promises, now applied in code
  and asserted in tests rather than described in copy.
- Added: `additionalTellsInExtendedLibrary`, which measures on the user's
  actual document how many further phrases the Pro library would have
  swapped. An upgrade prompt that is a real count, not an estimate.
- Fixed: the result panel could say "No detectable AI-style evidence found"
  directly above a list of findings.

### Vercel: ISR, and `/blog` no longer costs a function call per visit

- Fixed: `/blog` read `searchParams` for its category filter, making it
  dynamic. Every visit invoked a function to render a page that only changes
  at deploy time. Categories now have prerendered routes at
  `/blog/category/[category]`, which is cheaper to serve and separately
  indexable. Listed in the sitemap.
- Added: one-week `revalidate` on every prerendered content route, with
  `STATIC_REVALIDATE_SECONDS` in `src/lib/site.ts` as the documented source
  of truth.

## 2026-09-04: close out the humanizer-cluster SEO backlog

- Added: `/guide/does-an-ai-humanizer-help-with-turnitin` (targets
  `turnitin ai humanizer`, 480/mo; serves `/for/university-students`
  directly). Careful on the framing: answers the legitimate "will my own
  honest writing get flagged" question, and is explicit that reducing
  detectable evidence is not the same question as academic-integrity
  compliance, consistent with the existing disclosure guidance on the
  university-students audience page.
- Retitled `/rewrite` to target `ai humanizer free` (90,500/mo, the
  cluster's second-highest-volume term) directly, rather than building a
  near-duplicate second guide page that would risk cannibalising
  `/guide/ai-humanizer-how-it-actually-works`'s near-identical intent: the
  free, unlimited, on-device tool the search intent actually wants is
  `/rewrite` itself.
- Fixed: `/rewrite` and `/calibrator` page titles rendered a doubled
  "WatermarkRemoverPro" suffix (`"X | WatermarkRemoverPro · WatermarkRemoverPro"`), since the root
  layout's title template already appends `· WatermarkRemoverPro` and both pages'
  own titles redundantly included it too.

## 2026-09-04: fix ungrammatical rewrite output from auxiliary-verb substitution

Real, reported bug: at higher rewrite strength, "no final decision has
been made" became "no final decision possesses existed made". Root cause:
`src/lib/calibrate/dictionary.ts`'s `EN_SYNONYMS` treated auxiliary/modal
verbs (is/was/have/has/been/can/would/...) as plain substitutable words
("has" -> "possesses", "been" -> "existed"), but this is a flat word-list
substituter with no grammar model, so swapping an auxiliary out of its
verb phrase produces a broken double-verb construction. Removed all 19
auxiliary/modal entries from the dictionary (documented in place: a
future part-of-speech-aware substituter could safely reintroduce them; a
flat one cannot); ordinary content-word verbs (make, get, go, ...) are
unaffected. This is the shared dictionary behind both `/calibrator` and
the rewrite engine's rule-based backend, so the fix applies to both.

Added `src/lib/calibrate/dictionary.test.ts` (20 tests asserting every
removed word has no dictionary entry) and an engine-level regression test
reproducing the exact reported sentence. Verified live via the
`@watermarkremoverpro/rewrite-engine` CLI at "aggressive" strength: the sentence
now survives intact.

## 2026-09-04: zero npm audit vulnerabilities

Next.js bumped 16.2.10 -> 16.3.4 (patch-level within the same major;
resolves the postcss XSS/path-traversal and several Next.js CVEs:
middleware/proxy bypass, SSRF in Server Actions, cache confusion, DoS).
Verified with a full typecheck/lint/test/build pass plus a live browser
check of `/check` (paste text, run a real check, confirm the honest
"insufficient data" result for a short passage) since a framework version
bump is exactly the kind of change that needs more than a green CI run.

`sharp` (libvips CVEs, no next/`@huggingface/transformers` fix yet in
their own declared ranges), `adm-zip` (a 4GB-allocation DoS via
`onnxruntime-node`, pulled in by this session's `@huggingface/transformers`
addition) and `esbuild` (a Windows-only dev-server file-read, pulled in by
`tsup`) needed `package.json` `overrides` entries rather than a version
bump, since none of their parent packages had moved their own declared
range yet. `npm audit` now reports 0 vulnerabilities (was 9).

Next.js 16.3 auto-generates `AGENTS.md`/`CLAUDE.md` on `next dev`/`next
build` (agent-guidance boilerplate). Gitignored rather than committed,
consistent with how this project already treats other tool-generated
files (`next-env.d.ts`); excluded from `tests/house-style.test.ts`'s scan
via the existing `SKIP_FILES` mechanism, since the generated text isn't
this product's writing.

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

WatermarkRemoverPro becomes primarily an on-device rewrite tool (reduces detectable
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
    from a WatermarkRemoverPro-operated server; falls back to Standard automatically,
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
- Added: `@watermarkremoverpro/rewrite-engine` (`packages/rewrite-engine`), the
  standalone npm package/CLI (`watermarkremoverpro-rewrite`) publishing the same
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

- Live at <https://watermarkremoverpro.com>; every sampled route returns 200
  serving this product.
- `src/lib/evidence-report.test.ts`: the paid wedge is now covered by tests that
  build real PDFs and read the text back out of the compressed content streams,
  rather than asserting the function returned bytes. It is unreachable through
  the UI while billing is off, so nothing else exercised it.
- Fixed two live E2E assertions that searched for stat labels case-sensitively
  while `innerText` returns them uppercased by CSS. The product was correct; the
  assertions were checking a stylesheet.
