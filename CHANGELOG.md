# Changelog

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
