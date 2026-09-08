# WatermarkRemoverPro

**Reduce detectable AI-style evidence in your writing, on your device, honestly.**

WatermarkRemoverPro checks a writer's own text for a statistical AI provenance mark,
then rewrites it on-device to reduce detectable AI-style evidence: both
statistical watermark signal, where structurally possible, and human
perceptible AI tells like em dashes and stock phrasing. Every step runs
entirely on the device; the document never leaves it, on either feature, on
any tier.

Checking remains the mirror image of an AI detector. Detectors are bought by
the person doing the accusing; WatermarkRemoverPro is for the person on the other end
of it, and now also for that same person editing their own draft before
anyone accuses them of anything.

> Checking **someone else's** work for AI use is a different job with different
> ethics. [Learnaway](https://learnaway.ai) does that. WatermarkRemoverPro checks and
> edits writing you wrote yourself, not work someone else handed you to
> submit. Every page of this product says so.

---

## The permanent constraint

**Rewriting runs entirely on-device or in-process, on every tier, on every
surface.** Free and Pro alike. Browser, MCP server, and the local package/CLI
alike. No server WatermarkRemoverPro operates ever receives the document text for
this feature; unlike checking, there is no opt-in hosted mode for it at all.

**No unverifiable guarantee, anywhere.** "Reduces detectable evidence" is the
honest, falsifiable claim; "removes" or "undetectable" is not, because no tool
can honestly promise to defeat a model vendor's undisclosed watermark when
nobody outside that vendor holds the key it was applied with. This is enforced
by tests in `tests/product-constraints.test.ts`, not just stated here. See
[`docs/REWRITE_PHILOSOPHY.md`](docs/REWRITE_PHILOSOPHY.md) for the full
reasoning, including why the product's original no-removal policy
(`docs/archive/NO_REMOVAL.md`) was deliberately reversed rather than eroded by
drift.

## How you use it

One flow, on the homepage. Paste your draft into the box (or drop a file on it,
or use the upload button), press one button, and get back the rewritten text
together with the detector's full reading of it. The check is not a separate
trip: the rewrite engine already measures the document before and after in
order to decide what to target, so the analysis it shows you is the exact
arithmetic that produced the result above it.

Language, engine and strength sit behind an **Advanced settings** disclosure
with defaults that suit almost everyone. `/check` and `/rewrite` remain as
their own pages for their own search intent, and both render the same
components as the homepage rather than reimplementing them.

### Engines and the weekly allowance

| Engine | What it is | Who gets it |
|---|---|---|
| Standard | Deterministic substitution against the core AI-tell library. Instant, no download. | Everyone, unlimited, forever |
| Pro | A real small language model (Qwen2.5), downloaded once from the Hugging Face CDN and run in your browser on WebGPU, plus the extended AI-tell library and more candidates per passage. | One free run every 7 days for everyone; unlimited on a Pro subscription |

The Pro engine costs this product nothing to run, so that allowance is a
commercial boundary rather than a capacity one, and it is set to be generous
enough that anyone can see what they would be paying for on their own text
before deciding. The arithmetic is
[`src/lib/entitlements/pro-trial.ts`](src/lib/entitlements/pro-trial.ts): pure
functions over a list of timestamps, with a **rolling** window rather than a
calendar week. Signed-in visitors are counted per account through
`/api/v1/pro-trial`; anonymous visitors are counted in that browser. Neither
verb on that endpoint accepts a request body, and the client sends none, so
the one network call anywhere near the document flow provably cannot carry a
document. A test asserts it.

## Design system

Everything visual lives in two files and every page composes from them:

- [`src/app/globals.css`](src/app/globals.css) holds the palette, the type
  scale, the spacing rhythm, three corner-radius tokens and three elevation
  levels. Colour has exactly three jobs: `ink` for structure and prose, `seal`
  for anything interactive, `signal` for evidence of a mark actually being
  found. The remaining pastels (`mint`, `sky`, `rose`, `butter`, `peach`) are
  illustrative only and never encode a result, so a reader who learns those
  three rules can read any result on the site.
- [`src/components/brand/ui.tsx`](src/components/brand/ui.tsx) holds the
  section, wrapper, heading, button, panel and eyebrow primitives.

`Band` is the one component that draws a real statistic and it is the same
component on the marketing pages and inside a result. The logo has one source
of truth in [`src/components/brand/logo.tsx`](src/components/brand/logo.tsx);
`npm run logos` regenerates the web-sized derivatives from the master artwork
in `public/`, which are then served unoptimised, because a fixed brand asset
gains nothing from a per-request image transformation.

## What it measures

Three channels, reported separately and never blended into a single "AI score".

### 1. Provenance mark (keyed)

A green-list watermark test after Kirchenbauer et al., *A Watermark for Large
Language Models* (ICML 2023, [arXiv:2301.10226](https://arxiv.org/abs/2301.10226)).
A keyed pseudorandom function seeded by the preceding token partitions the
vocabulary; a marked generator prefers the green half; detection is the
one-proportion z test on the excess.

Two decisions matter for honesty:

- **Repeated word pairs are scored once.** The z test assumes independent trials.
  A document that repeats "of the" forty times supplies one bit of evidence, not
  forty. Counting repeats would let a repetitive but entirely human document
  manufacture its own signal.
- **Word-level, not subword.** We do not have any model's tokenizer, so we
  partition word bigrams. A vendor's own detector can reach a different
  conclusion on the same document, and every result says so.

**The limitation that matters most:** a green-list mark is *keyed*, and no model
vendor publishes a detection key. WatermarkRemoverPro tests the keys it holds and names
them on every result. "No mark detected" therefore always means *under those
keys*, never "this document is clean". Any tool claiming to detect a named
vendor's mark without a key from that vendor is not doing what it says.

A **published open reference key** ships with the product so the machinery is
auditable: mark a passage under it at `/verify` and watch the statistic move,
then watch the same text sit at chance under a different key.

### 2. Style (key-free)

Fourteen subject-independent register features measured against a per-language
reference corpus, reported as a distance in standard deviations with a seeded
percentile bootstrap band.

**This channel does not detect AI.** It measures register. Technical writing,
fiction, translated text and non-native prose all sit far from an encyclopaedic
reference for entirely ordinary reasons, and every surface that shows the number
says so beside it.

### 3. AI-style likelihood (heuristic, key-free)

[`src/lib/detector/ai-likelihood.ts`](src/lib/detector/ai-likelihood.ts). A
0-100 score for surface habits common in current LLM output: dash-clause
connectors, stock phrasing and elevated vocabulary (both from the same
pattern tables `reduce_ai_evidence` rewrites, so the two can never disagree
about what counts as a tell), templated structures (three-item lists,
negative parallelism), and sentence-length uniformity. English only for now,
since the phrase and vocabulary tables are English-specific.

Unlike the two channels above, this one is deliberately biased toward
flagging: it is read as a prompt to look closer, not as a scientific finding,
so it is tuned to minimise false negatives rather than false positives, and
every surface that shows the score says so. It is not a statistical test and
it is not a provenance mark; a high score does not mean a vendor mark is
present, and a low score does not mean the text is clean.

### Per-passage findings are corrected

A long document runs one test per passage, so some will look significant by
chance. A Benjamini-Hochberg false-discovery-rate correction is applied across
all passages before any is presented as a finding. An uncorrected highlighter
will confidently colour in sentences of any document you give it.

## Reference baselines are measured, not written

`src/lib/detector/baselines/*.ts` are **generated** from ~597,000 words of
contemporary Wikipedia prose (CC BY-SA), pulled per language through the
MediaWiki API. Every document was language-verified by the engine's own
identifier before being kept, because "the source said so" is not verification when the
result is what every user's number gets compared against.

| Language | Documents | Words | Chunks |
|---|---|---|---|
| English | 219 | 219,493 | 567 |
| Spanish | 113 | 93,981 | 243 |
| French | 113 | 94,265 | 248 |
| German | 157 | 113,858 | 310 |
| Portuguese | 96 | 77,307 | 205 |

A language whose corpus is missing or too thin **fails the build** and ships as
unsupported. It is never given another language's numbers.

```bash
npm run corpus      # fetch the corpora (resumable, backs off on 429)
npm run baselines   # measure them into typed modules
```

## No fabricated figures

Every statistic in the result type is `number | null` beside a `status` and a
human-readable reason. "Not computed" is unrepresentable as a number, so a caller
cannot render a fabricated zero by accident. They have to handle the null. The
UI renders null as the reason it is null, never as `0` or a bare dash.

## Development

```bash
npm install
vercel env pull .env.local   # DATABASE_URL, BETTER_AUTH_SECRET
npm run db:push              # apply the schema (idempotent)
npm run dev                  # http://localhost:3540

npm run check                # typecheck + lint + tests + MCP smoke + build
npm run mcp                  # run the MCP server over stdio

npm run e2e                  # drive the real journey in a real browser (needs `npm run dev` up)
npm run logos                # regenerate web-sized logo assets from public/logo*.png
```

`npm test` runs the unit suite **and** connects to the MCP server over the real
protocol. A claim that a product "has an MCP server" is worth exactly as much as
the last time someone actually connected to it.

`npm run e2e` is the same argument applied to the interface. It drives a real
Chromium against a running dev server: paste, drag-and-drop, upload, a refused
PDF, a full rewrite through to the output screen, the dedicated check page,
every page in the nav and a mobile viewport, asserting on each that there are
no console errors, nothing overflows horizontally and every image actually
decoded. Screenshots land in `.e2e-shots/` for a human to look at.

## Content

`/blog` is 15 posts across three categories (Academy, News, Reviews), sourced
entirely from `docs/seo_geo_content_plan.md`. Posts are data, not MDX files:
one typed schema in `src/content/blog-types.ts`, three content files
(`src/content/blog-posts-{a,b,c}.ts`), and one renderer
(`src/components/blog-post-view.tsx`), the same pattern the pSEO pages in
`src/content/pages.ts` already use. Every post ships BlogPosting + FAQPage
JSON-LD (plus HowTo or Review where the format calls for it), a featured image
with keyword-bearing alt text, and is listed in `sitemap.ts` automatically
because the sitemap reads from `BLOG_POSTS` rather than a hand-maintained list.

## Interfaces for machines

Adding this to an agent workflow is two commands:

```bash
claude plugin marketplace add maxbeech/watermarkremoverpro
claude plugin install watermarkremoverpro@watermarkremoverpro
```

That installs the MCP server, a skill telling the agent when to use it, and a
`PostToolUse` hook that checks public-facing content the agent writes before
it ships. The server is one committed, self-contained file
(`plugins/watermarkremoverpro/dist/mcp-server.mjs`) that runs under plain `node` with
nothing installed, which is what makes the two-command version possible;
rebuild it with `npm run build:plugin` after changing `mcp/` or `src/lib/`.

For any other MCP client:

```bash
claude mcp add watermarkremoverpro -- node /path/to/plugins/watermarkremoverpro/dist/mcp-server.mjs
```

| Surface | Path |
|---|---|
| Claude Code plugin (MCP + skill + hook) | `plugins/watermarkremoverpro`, listed by `.claude-plugin/marketplace.json` |
| JSON API (checking only) | `POST /api/v1/check` |
| Evidence report | `POST /api/v1/report` (Pro) |
| OpenAPI 3.1 | `/api/openapi.json` |
| Machine-readable pricing | `/pricing.json` |
| Agent description | `/llms.txt` |
| MCP server | `mcp/server.ts`: `check_document`/`describe_method` local or hosted; `calibrate_text`/`reduce_ai_evidence` always local, no hosted mode |
| Rewrite engine (no REST API by design; see docs/REWRITE_PHILOSOPHY.md) | `src/lib/rewrite`, published standalone as `@watermarkremoverpro/rewrite-engine` (`packages/rewrite-engine`) with a `watermarkremoverpro-rewrite` CLI, same engine as the MCP tool |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Neon Postgres ·
Better Auth · Stripe · pdf-lib · vitest · Vercel.

The detection engine is **isomorphic TypeScript**, not WASM. The binding
requirement is that the computation is real and runs on-device, not that it is
compiled from Rust, and one module running unchanged in the browser and in the
Node function gives a single source of truth for the arithmetic rather than two
implementations that can silently disagree.

## Status

See [`docs/BUILD_LOG.md`](docs/BUILD_LOG.md) for what is built, what is verified
live, and what is explicitly deferred, including the payment-processor gap that
keeps paid plans switched off rather than shown as a button that fails.
