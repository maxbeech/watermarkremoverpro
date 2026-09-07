# Stage 4: post-build hardening & QA

**2026-09-04 note:** this review predates the pivot to an on-device rewrite
engine (`docs/REWRITE_PHILOSOPHY.md`). Every reference below to "the
permanent no-removal constraint" or "no mark-removal tool exposed" describes
the product as it stood on 2026-08-12, not its current state: WatermarkRemoverPro now
ships a real, honestly-described evidence-reduction feature (`/rewrite`,
`reduce_ai_evidence`), with a different, narrower absolute (strictly
on-device, no unverifiable guarantee) replacing the old one. Kept as-is
below for an accurate historical record of what was checked at the time,
rather than silently edited to look prescient.

Run started 2026-08-12T00:00Z. Product: WatermarkRemoverPro. Workspace resolved per the
Product Pipeline Notes pointer (list_products carries a stale, non-existent
`/cloud/...` workspacePath for this slug): `/Users/maxbeech/Documents/Beech/Development/ProductFactory/watermarkremoverpro`.
Claimed from Stage `built-live`, Notes carrying `S3b-polished 2026-08-12` and no
`S4-hardened` marker.

This is a pure correctness pass. Design and brand quality were Premium Polish
Pass's job (docs/premium_polish_review.md) and are not re-reviewed here.

## What was checked and how

- Full static read of `src/` against every MUST-HAVE in the Feature Spec:
  on-device engine, confidence interval (not a bare score), per-passage
  attribution, stated-limits notice, five-language baselines, no-signup free
  check, signed-up free tier, Pro wedge (evidence report), API + MCP moat,
  the permanent no-removal constraint, and the Learnaway mirror-banner
  requirement. All present in code with real logic behind them, not stubs.
- `npm run check` (typecheck, lint, 57 unit/integration tests across 7 files,
  MCP local-mode smoke test, `next build`, 46 static/dynamic routes).
- `scripts/e2e-live.mts` run against the live deployment (real Chromium via
  Playwright, already part of this repo from the build stage): the free
  on-device check, the zero-upload network canary, the `/verify` detector
  demo, machine-readable surfaces, API auth/error contract, and page
  coverage. 33/33 assertions pass against `https://watermarkremoverpro.com`.
- Three additional ad-hoc Playwright scripts written for this pass to cover
  journeys the existing harness didn't (signup/login, saved history, the
  signed-up free-tier word cap, API allowance/error-shape edge cases, and
  hosted-mode MCP against a real API key), run against the live deployment,
  then deleted once their findings were folded into this document. They were
  throwaway verification tools, not permanent product code.

## Findings and fixes

1. **`/docs` 404'd on the live deployment (flagged by S3b, left for Harden).**
   `src/app/docs/{api,mcp}` existed with no `src/app/docs/page.tsx` index.
   **Fixed:** added a docs index page in the existing design vocabulary
   (`PageHeader`/`Section`/`Panel`), linking to `/docs/api` and `/docs/mcp`,
   and added `/docs` to `sitemap.ts`. Verified 200 locally and rebuilt
   (`/docs` now appears as a static route in the build route table).
   Severity: medium. A real 404 on a linked-to surface.

2. **`/favicon.ico` 404'd on the live deployment (flagged by the operator in
   Change Requests on 2026-08-11T23:59Z, not yet addressed).** No favicon
   file existed anywhere in the repo. **Fixed:** generated a real,
   brand-consistent icon (`scripts/gen-favicon.mts`) reproducing the
   product's own signature shape, the measurement band's track, hatched
   interval and marker, in the exact `--color-seal-*` tokens from
   `globals.css`, rasterized at 16/32/48px and packed into a spec-valid
   multi-resolution `src/app/favicon.ico` (verified with `file`: a genuine
   MS Windows icon resource with embedded PNGs, not a renamed PNG or a
   placeholder). Verified 200 with the correct `image/x-icon` content type,
   locally and live. Severity: low (cosmetic, browser-tab/bookmark surface
   only), but it was an explicit, dated operator request that had gone
   unaddressed for one stage, so it is fixed here rather than left again.

3. **Stale assertion in `scripts/e2e-live.mts`: "the rate is reported as a
   band" failed against the live site.** The Premium Polish pass (commit
   `02276ab`) deliberately rewrote the confidence-interval copy from
   `band 50.8%-55.6%` to `interval 50.8% to 55.6%` as part of the design
   pass. `scripts/e2e-live.mts` isn't part of `npm run check` (it's a
   manual live-verification script), so nobody re-ran it after the copy
   changed, and its regex still looked for the old wording. Confirmed via
   `git show` on the pre-polish commit that the wording change was real and
   intentional, not a functional regression: the interval is still
   genuinely computed and rendered, both visually (the `Band` component) and
   as text. **Fixed:** updated the assertion to match the current wording,
   case-insensitively (the eyebrow-styled text renders as
   `INTERVAL 35.5% TO 50.6%` under `text-transform: uppercase`, which the
   original regex also didn't account for). Re-ran against the live site:
   passes. Severity: low. Test-suite drift, not a live-user-facing bug, but
   worth fixing because this script is this stage's primary tool for proving
   the on-device promise, and a stale assertion in it undermines that proof.

4. **Stale comment in `src/components/checker/checker.tsx`** claimed the
   zero-upload promise was "enforced by a test
   (`src/lib/detector/privacy-contract.test.ts`)". That file doesn't exist;
   the real, working test lives at `tests/product-constraints.test.ts`
   (confirmed it genuinely scans the on-device path for network calls and
   fails if one appears). **Fixed:** corrected the comment to point at the
   real file. Severity: trivial. Comment accuracy only, no behavior change.

5. **`applyBillingEvent` (the Stripe webhook's plan-upgrade/downgrade
   decision) had no test coverage.** It's pure business logic, an event in,
   a plan written out, that doesn't require a live Stripe account to test,
   and the CLAUDE-truths "all code needs test coverage" rule applies
   regardless of whether Stripe credentials exist yet. **Fixed:** added
   `src/lib/billing.test.ts` (8 tests, `sql()` mocked) covering: checkout
   promotes to pro, a session with no accountId is a no-op, an active or
   trialing subscription keeps pro, a cancelled or past-due subscription
   downgrades to free, a subscription event with no accountId is a no-op,
   and unrelated Stripe event types are ignored. One test bug surfaced and
   fixed along the way: a JS default-parameter gotcha, where passing
   `undefined` explicitly still triggers the default, so the "no accountId"
   case wasn't actually being tested until the helper was changed to use
   `null`.

No other functional bugs, broken flows, or security gaps were found. See
"Deliberately not changed" below for two things that looked like findings but
weren't.

## Deliberately not changed (checked, found correct)

- **Pricing page shows no clickable "Upgrade" button while billing is
  unconfigured.** It shows a disabled "Billing not configured" label
  instead. This is the correct, honest behavior (`stripeConfigured()` gates
  it), not a missing feature. Verified in `src/app/pricing/page.tsx` and
  `src/app/dashboard/upgrade-button.tsx`, and live.
- **`verifyApiKey` accepts a bare token as well as `Authorization: Bearer
  <token>`** (`src/lib/api-keys.ts:73`). Initially looked like a spec
  deviation from the documented `Bearer` scheme; confirmed by reading the
  code and testing live that this is deliberate lenient parsing, not a
  security weakening. The security boundary is the SHA-256-hashed secret
  itself, not the scheme prefix. Left as-is.

## Journeys proven, with evidence

### FREE journeys: PASS

- **Free on-device check.** `scripts/e2e-live.mts` against the live site:
  paste text, get a real computed green-list rate, confidence interval,
  z/p, style-channel measurement, per-passage breakdown with
  Benjamini-Hochberg correction, stated limits, and a real SHA-256 document
  hash. Watched via the network layer (Playwright request listener): **0
  POST/PUT/PATCH requests**, the canary phrase appears in **no request body
  or URL**, and **no third-party origin** is contacted during the check.
  This is the product's central promise and it is independently reproduced,
  not assumed from the build-stage notes.
- **Explicit failure states.** An undeterminable-language document refuses
  with an explicit message rather than guessing (verified live).
- **Detector genuinely detects.** `/verify` live: reference-key text scores
  z=20.45 under the correct key and z=0.1 under a different key, in the
  same run.
- **Signup to dashboard.** A fresh account signed up live against the real
  Neon DB, redirected to `/dashboard`.
- **Signed-up free-tier word cap.** A 5,200-word document (over the
  5,000-word free-account cap) is refused with a message naming the exact
  limit, both in the UI (`/check`) and via the API (402, see below).
- **API key issuance and saved history.** A real `mw_live_...` key issued
  from the live dashboard; a signed-in UI check completed and the dashboard
  showed a check-history surface afterward.
- **Sign-out and sign-in.** Sign-out gates `/dashboard`; signing back in with
  the same credentials redirects to `/dashboard` again.
- **Mirror-product pointer.** `learnaway.ai` banner present on the home page
  and every long-tail page sampled, live.

### REVENUE journeys: code-complete, blocked on Stripe credentials

Unchanged from the build stage: this deployment has no
`STRIPE_SECRET_KEY` / `STRIPE_PRICE_PRO` / `STRIPE_WEBHOOK_SECRET`. The only
Stripe account visible to this workspace (`acct_1TgA9kLTQj9uV5dz`) is
Learnaway's livemode account. Using another product's live account to test
WatermarkRemoverPro billing would be the wrong call, and is exactly the
already-flagged, human-gated task "Credentials needed before WatermarkRemoverPro can
launch", so it was not touched.

Verified as far as the code path goes:

- `POST /api/billing/checkout` returns **503** live with an honest message
  ("no payment processor is configured... Free and account-tier checks are
  unaffected") rather than a broken button.
- The pricing page and dashboard both gate the upgrade CTA behind
  `stripeConfigured()`, confirmed live: no dead button is shown.
- `src/lib/billing.ts` (checkout-session creation and the
  upgrade/downgrade webhook handler) is real, typechecked, and now has full
  unit-test coverage (8 tests, this pass) proving the plan-change logic:
  checkout completion promotes to pro; active/trialing subscriptions stay
  pro; a cancelled or past-due subscription downgrades to free. The
  **downgrade/cancel path required by this stage is code-complete and
  tested**, just not exercisable end-to-end without live Stripe credentials.
- The webhook route fails closed on a missing signature or an unverified
  event (503/400), so an unconfigured or misconfigured deployment cannot be
  tricked into upgrading an account for free.
- The Pro wedge itself, the dated PDF evidence report, is proven with
  real computed data in `src/lib/evidence-report.test.ts` (6 tests, unchanged
  from the build stage, still passing): a real PDF is built from a real
  analysis, reopened, and checked for the document hash, the stated limits,
  and a genuinely different rendering for a detected vs. undetected mark.
  This is the artefact Pro sells; it's proven at the code level even though
  it's unreachable through the live UI without a paid account.
- The API's Pro-gating was exercised live: a free-tier key calling
  `POST /api/v1/report` gets **402 `pro_required`** with an explanation,
  not a silent failure or a 500.

**Not claimed as passing, and won't be until Stripe credentials for this
product specifically are provided:** an actual Stripe Checkout session, a
real card charge (even in test mode), the webhook firing against a real
Stripe event, or a real downgrade after cancellation. See the existing task
"Credentials needed before WatermarkRemoverPro can launch."

### AGENT/MACHINE journeys: PASS

- **Public JSON API, live:**
  - Unauthenticated and unknown-key requests refused with 401 and a named
    reason.
  - A real signed-up account's key made a real authenticated call: 200,
    real document hash, real metered billing figure.
  - **402 allowance-exceeded**, live: a document over the free plan's
    5,000-word cap is refused with the exact limit named in the message.
  - **400** on a malformed body, with per-field `issues`.
  - **405** on `GET /api/v1/check`, which self-documents instead of
    erroring.
  - `/llms.txt`, `/pricing.json`, `/api/openapi.json`, `/sitemap.xml`,
    `/robots.txt` all serve live and are well-formed (openapi.json is valid
    3.1.0, pricing.json's `notOffered.markRemoval` is populated,
    sitemap.xml carries 30+ URLs).
- **MCP server, both modes, live:**
  - Local mode: full protocol smoke test (part of `npm run check`): both
    tools advertised, no mark-removal tool exposed, `check_document` and
    `describe_method` both return real computed results with nulls kept as
    nulls, not coerced to zero.
  - **Hosted mode (new for this pass, not previously proven end-to-end):**
    spawned the real MCP server as a subprocess with a real
    `MARKWITNESS_API_KEY` (issued from the live dashboard) and
    `MARKWITNESS_API_URL` pointed at the live deployment, spoke the real
    MCP protocol to it. `describe_method` correctly reports
    `"mode": "hosted"` and the live endpoint; `check_document` returned a
    real result with a real document hash and a real metered billing
    figure, routed through `POST /api/v1/check` on the live site. The build
    stage's notes only ever proved local-mode MCP and the raw HTTP API
    separately. Hosted-mode MCP, the actual "agent assembling a
    deliverable" moat scenario the Feature Spec describes, had not been
    exercised end-to-end before this pass.
- **No-removal constraint, live and in source:** confirmed no exported
  function, route, or MCP tool matching remove/strip/humanize/paraphrase
  patterns exists anywhere in `src/` or `mcp/` (this is also enforced by
  `tests/product-constraints.test.ts`, which is part of `npm run check`).

## Accessibility (functional-blocker gate only)

Checked as part of driving every journey above via Playwright's role-based
locators (`getByRole('button', { name: ... })`, `input[type=email]`, etc.)
rather than CSS selectors. Every control exercised in this pass (signup,
login, sign-out, run-the-check, create-API-key, file upload) was reachable
by accessible role/name, which is a reasonable proxy for keyboard/AT
reachability. No nontrivial-scope screen-reader pass beyond that was run;
nothing found that blocks operating any control.

## Result

All PASS journeys above are genuinely proven with reproducible evidence, not
inherited from prior-stage notes. The one REVENUE journey group remains
honestly reported as code-complete, blocked on credentials, per this stage's
own contract, rather than fabricated. Five real defects found and fixed (one
medium: the `/docs` 404; three low: the operator-flagged `/favicon.ico` 404,
a stale live-verification assertion, and a stale comment; one test-coverage
gap: billing plan-change logic). Stage left at `built-live` per instruction
(not regressed or advanced).
