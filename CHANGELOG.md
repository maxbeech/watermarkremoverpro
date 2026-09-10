# Changelog

## 2026-09-10 (later) - the content hook stops checking working notes

The hook fires on every Write and Edit a session makes, and it treated any
`.md` as public content. So a long working session spent its attention
reporting AI-tells in its own internal plan file, over and over: measured on a
real session, the same plan file was reported eleven times in a row while it
was being drafted.

What it DECLINES to check matters as much as what it checks. A check that cries
wolf on notes nobody publishes is one people learn to scroll past, and then it
is not protecting the content that IS published either.

Working notes are now excluded by location (`.claude/` anywhere, `docs/plans/`,
`adr/`, `.github/`) and by basename wherever they sit (`TODO.md`, `notes.md`,
`scratch.md`), alongside the engineering files that merely happen to be
markdown (`CHANGELOG`, `CLAUDE.md`, `AGENTS.md`, `SKILL.md`). A path hint now
beats the extension in both directions, so `/docs/guide.md` is still checked
while `/docs/plans/x.md` is not.

Erring toward NOT checking is deliberate: a missed public file is caught by the
same hook on its next edit, or by running the tool directly, whereas a hook
that interrupts every internal note gets disabled. 8 new tests pin the cases,
including the plan-file regression.


## 2026-09-10: the rename is finished, and the local model is the working default

Two jobs, both of which were left half done by the rebrand in September.

### The local model runs by default when it is actually there

`reduce_ai_evidence` used to default to `model: "standard"`, the deterministic
engine, and reach the real local LLM only when a caller named it. That is the
wrong default in both directions. A machine that had already downloaded the
weights kept getting the weaker engine unless somebody remembered to ask for
the better one, and the obvious alternative (default to `advanced`) would stall
a first call behind several hundred megabytes nobody asked for.

There is now a third value, `auto`, and it is the default: run the local model
when its weights are already cached on this machine, run the deterministic
engine when they are not. One `model: "advanced"` call downloads them; every
call after that gets the model on its own. `standard` and `advanced` still mean
exactly what they meant, so nothing that named an engine changes behaviour.

`src/lib/rewrite/engine-choice.ts` is the whole decision, pure and isomorphic,
and `src/lib/rewrite/backend/node-engine.ts` is the one place that acts on it.
The MCP server and the CLI both go through it; before this they each had their
own copy of the try/catch around the model and already disagreed about what to
tell a caller when it failed.

Configurable rather than special-cased: `WATERMARKREMOVERPRO_REWRITE_MODEL`
sets the default for a machine that should always (or never) use the model, and
a misspelled value throws rather than quietly running a different engine.

### Which engine ran is now part of every answer

The old code reported a downgrade in a prose `model` string. That was not
silent, which is the bar, but it was not usable either: a caller could not
branch on it. Every `reduce_ai_evidence` response now carries an `engine`
object naming the engine requested, the engine used, the backend id, the cache
directory, and the reason in a sentence fit to print. When the local model was
chosen and could not load, `engine.failure` carries the underlying error and
the reason says the deterministic engine finished the job. Verified against the
real bundled server with no `@huggingface/transformers` installed: the response
comes back naming the missing package.

`WATERMARKREMOVERPRO_REWRITE_STRICT=1` turns that reported switch into a thrown
error, for a pipeline that would rather stop than take a weaker result it did
not ask for.

### The model cache moved with the product, and brought the weights with it

`~/.cache/markwitness/models` is now `~/.cache/watermarkremoverpro/models`, and
an existing cache is MOVED rather than left behind: a rename that costs
somebody a multi-gigabyte re-download is a rename that gets reported as a bug.
`rename` first, a copy as the fallback for the cross-filesystem case, the empty
`~/.cache/markwitness` pruned after, and a failure reported (it means a slow
first call, and hiding it would make that call inexplicable). Measured on the
machine this was written on: 2.5 GB of pinned Qwen2.5 and MiniLM weights
relocated in place, nothing re-fetched. `WATERMARKREMOVERPRO_MODEL_CACHE`
overrides the location, and an override is never migrated into, because an
operator who named a directory meant that directory.

### Nothing about the on-device guarantee changed, and it is now guarded harder

No path in the rewrite feature transmits anything, on any engine, on any tier.
The only switch in the whole MCP server that sends document text anywhere is
`WATERMARKREMOVERPRO_API_KEY`, which opts `check_document` in to the hosted
endpoint; unset, which is the default, everything is local.
`tests/product-constraints.test.ts` now asserts that directly rather than by
implication: the server has exactly one `fetch`, it targets
`/api/v1/check`, it is reachable from exactly one line guarded by `if
(API_KEY)`, no tool argument can switch modes, every response labels the mode
it was computed in, the content hook (which fires unattended on every write)
has no network call at all, and the new engine-selection modules have none
either.

### The rename, finished

Renamed: the `MARKWITNESS_*` configuration variables (to
`WATERMARKREMOVERPRO_*`), the model cache path, and every remaining mention in
the site copy, the docs pages, the plugin README, the package README and the
main README. The plugin is at 0.4.0 in both manifests, and the committed
bundles are rebuilt from the renamed source.

Deliberately NOT renamed, and each one now pinned by `tests/rename.test.ts` so
a future sweep has to read the reason before taking it:

- **The `mw_live_` API key prefix.** Live customer keys carry it. It is stored
  in `api_keys.key_prefix`, shown in the dashboard, and matched on every
  authenticated request, so a new prefix invalidates keys that are in use
  today. The reasoning recorded on 2026-09-07 still holds.
- **The open reference key's domain-separation string,**
  `markwitness/open-reference-key/v1`. It is hashed into the green-list PRF, so
  it is an input to every statistic rather than a label on one. A new value is
  a new key: text marked under the published scheme would stop being detected
  and every evidence report issued under it would become unreproducible.
- **The `MARKWITNESS_*` variable names as ALIASES.** The 09-07 entry left them
  as the only names, which finished nothing; deleting them would have been
  worse. They are now the pre-rename names of variables that have current ones,
  still read, and their use reported at startup. A deployment or an MCP client
  config written before the rename keeps working and loses nothing. Setting a
  variable under both names with different values throws, naming both, rather
  than picking one and leaving the operator looking at a value the process is
  ignoring.

Dated historical entries (this changelog, `docs/BUILD_LOG.md`,
`docs/hardening_review.md`, `docs/domain_shortlist.md`) keep the old name,
because they record what was true when they were written. The rename guard
exempts them by name.

### If you installed the plugin before the rename

An installation of `markwitness@markwitness` is pinned to the retired GitHub
repository and will never see an update, however long it sits there. It cannot
be fixed from this side. Replace it:

```bash
claude plugin uninstall markwitness@markwitness
claude plugin marketplace remove markwitness
claude plugin marketplace add maxbeech/watermarkremoverpro
claude plugin install watermarkremoverpro@watermarkremoverpro
```

The MCP server id changes with it, so tool names go from
`mcp__plugin_markwitness_markwitness__*` to
`mcp__plugin_watermarkremoverpro_watermarkremoverpro__*`. The plugin holds no
state, so nothing else needs carrying over.

### Also

`.env.local` on the development machine still pointed `NEXT_PUBLIC_SITE_URL` at
the pre-rename domain while `.env.example` had the current one. Better Auth
signs callbacks against that value, and `llms.txt`, `pricing.json`, the OpenAPI
document and the JSON-LD all advertise it, so a local run was advertising an
address the product no longer calls itself.

## 2026-09-08: the workspace, and the brand mark in the browser tab

**The result screen is now an application.** Pressing "Clean up my text"
used to swap the homepage's input box for a result panel, which left the most
involved screen in the product (a rewritten document, an analysis, a diff,
per-paragraph controls) sitting halfway down a landing page with a marketing
footer under it. It now opens `/app`: a full-height workspace with its own
sidebar. The draft travels there in memory
(`src/lib/workspace/handoff.ts`) with a copy in the browser's own database, so
it never touches a URL, a referrer header or a server.

**What the workspace shows, in order.** The rewritten text first, because that
is what the visitor came to collect. Then the summary of how much AI evidence
is left, four figures wide: the heuristic AI-style likelihood before and after,
whether a provenance mark was found under the keys this deployment holds, how
many passages survive correction, and the watermark z-score, each rendering as
the reason it is null where it could not be measured. Then a
paragraph-by-paragraph comparison. Then the complete analysis, collapsed: the
identical `ResultView` the dedicated check page renders, over the analysis this
rewrite already computed, with a toggle between the draft and the rewrite.

**The comparison.** `src/lib/diff/words.ts` is a word-level diff over
whitespace-preserving atoms (common prefix and suffix peeled off first, then
longest-common-subsequence over what is left, with a size guard that falls back
to a whole-block replace), plus a paragraph alignment between the draft and the
rewrite. Split and unified are two renderings of the same computed
`DiffPart[]`, so they cannot disagree about what changed. Where a rewrite did
not preserve the paragraph count, the alignment refuses to guess and the
comparison says why instead of pointing the per-paragraph controls at the wrong
text.

**Running it again, whole or in part.** The whole document re-runs from the
original draft, so passes never stack on top of one another; when a re-run at
the same settings produces byte-identical text (the Standard engine is
deterministic) it says so and points at the strength control rather than
looking broken. Any paragraph, or any selection of them, re-runs on its own
from the version currently shown, which is what makes a second pass produce
something new, at whatever strength is currently set. A rephrased paragraph can
be restored to exactly what the writer wrote. After a paragraph edit the
document is re-measured with `checkDocument` so the summary above is about the
text on screen; the counts the rewrite earned on its own pass are left alone,
because a paragraph edit does not change them.

**An anonymous identity, and a history.** `src/lib/workspace/identity.ts`
mints an opaque id in the browser on first use;
`src/lib/workspace/history.ts` keeps the newest 25 runs in that browser's
IndexedDB. There is no account behind it and there is not going to be one for
drafts: a server-side copy of someone's documents would contradict the single
promise this product makes. The sidebar says exactly that, and offers a delete
per run and a delete-everything. Every storage call resolves rather than
rejecting where a browser refuses IndexedDB, and the sidebar reports that state
instead of the rewrite failing.

**Chrome split into a route group.** The marketing header and footer moved from
the root layout into `src/app/(site)/layout.tsx`; the root layout is now the
document shell (html, fonts, analytics) and nothing else; `/app` sits outside
the group with its own sidebar. Route groups do not appear in URLs, so nothing
changed address. The mirror-product pointer follows the visitor into the
workspace via the sidebar, and `tests/product-constraints.test.ts` now asserts
it in both places rather than only in the footer it used to live in.

**`/app` is a static route.** The run id is a query parameter, not a dynamic
segment: the entire page comes out of the visitor's own browser, so a dynamic
segment would spend a function invocation per open document to return the same
empty shell. It is `noindex` through its own metadata and absent from the
sitemap, and deliberately NOT disallowed in `robots.txt`: a crawler told not to
fetch a page never reads the noindex tag on it, and a `/app` prefix rule would
also have matched `/apple-icon.png`.

**Favicon.** `npm run logos` now also generates `src/app/favicon.ico` (16, 32
and 48px, packed by hand as PNG-in-ICO), `icon.png` and `apple-icon.png` from
the same brand mark the header and footer render, fitted inside a white square
so it reads on a light or a dark tab strip. The `icons` block in the root
layout's metadata is gone: the files are picked up by Next.js file convention,
so there is one place the icon is declared rather than two that can disagree.

**Two contrast fixes found by the e2e probe.** A disabled solid button dropped
to a mid fill and kept white text, which lands at 1.6:1 and reads as broken
rather than inactive; the disabled treatment now lives once in `buttonClass`
and clears AA. The trusted-by marquee's logos were `loading="lazy"` inside a
track that moves by a CSS transform inside an `overflow-hidden` box: a browser
does not re-evaluate lazy loading as a transform carries an element into view,
so every icon past the first screen-width never loaded at all, which is what
the probe was actually reporting. They now load eagerly at
`fetchPriority="low"`, the low priority being what keeps Next.js from emitting
forty-five `<link rel="preload">` tags into the head to race the hero.

New tests: `src/lib/diff/words.test.ts` (round-trip, size guard, alignment
refusal), `src/lib/workspace/runs.test.ts` (titles, storage trimming, the
summary keeping nulls as nulls, pruning), `src/lib/workspace/identity.test.ts`
(minting, reuse, blocked storage). `tests/product-constraints.test.ts` extends
the on-device network-call walk over `src/components/app`,
`src/lib/workspace` and `src/lib/diff`, and asserts that the history layer is
IndexedDB and that no document or run id is put in a URL.
`scripts/e2e-journey.mts` now drives the whole workspace journey.

The journey instrumentation below landed in parallel and is preserved: the
rewrite events moved with the code, from the homepage component into
`src/components/workspace/use-rewrite-runner.ts` where the rewrite now actually
runs, and pressing the button on a marketing page emits `workspace_opened`
instead. Every property is still an engine id, a device name or a boolean.

## 2026-09-08: journey instrumentation - analytics events and Sentry capture across every material user path

A product-specific journey review found instrumentation at essentially zero:
the GA4 tag and Sentry SDK were both initialized but almost nothing in the app
called into them beyond automatic page views. Added `track()` calls (browser,
via `src/lib/openhelm-analytics.tsx`) and Measurement Protocol events (server,
via `src/lib/openhelm-analytics-mp.ts`) across signup/login, password reset,
the primary check-and-rewrite workspace, the weekly Pro-engine trial, Stripe
checkout and the subscription webhook, dashboard API-key management, and the
metered `/api/v1/check` API surface. Every event carries only non-PII,
product-metadata parameters (engine id, plan, word-cap-hit booleans, status
strings) - never document text, email or name, consistent with
`sendDefaultPii: false`.

Also strengthened Sentry capture on async failures that previously left no
trace beyond a passive console log: a broken billing-webhook handler (the
highest-priority gap - it silently meant "customer paid, plan didn't
update"), a Pro-engine load failure that falls back to Standard, a failed
password-reset send (a live, known-broken path as of this deployment - see
`THREADCAMP_API_KEY` in the environment), and API-key verification failures
on the metered check endpoint.

`src/lib/billing.ts`'s `applyBillingEvent` now returns `accountId` and a
`transition` (`subscription_created` / `subscription_cancelled` /
`subscription_reactivated`) so the webhook route can emit one telemetry event
per real plan change without re-parsing the Stripe event a second time.

Also fixed a real delivery bug found while verifying this against production:
none of these Route Handlers are wrapped by `withSentryConfig` (this app uses
manual `instrumentation.ts`/`instrumentation-client.ts` setup instead), so a
`Sentry.captureException`/`captureMessage` call made just before a response
has no guarantee of completing its send before the serverless function
freezes. A live test against the deployed webhook (an intentionally invalid
Stripe signature) confirmed the event never reached Sentry. Every manual
capture added here is now followed by `await Sentry.flush(2000)` before the
response returns, and the two server-side GA4 events on `/api/v1/check` were
changed from fire-and-forget to awaited for the same reason.

Found but not fixed here, because it is a product decision rather than an
instrumentation gap: `src/app/terms/page.tsx` tells users they can cancel
"from your dashboard", but the dashboard has no cancel/manage-subscription
control - only an upgrade button for non-Pro accounts. Flagged for the
product owner. (That page is now `src/app/(site)/terms/page.tsx`; the route
group changed no URLs.)

## 2026-09-08: a third channel, AI-style likelihood, biased to flag

The provenance-mark channel is deliberately conservative: it only tests keys
this deployment actually holds, and no model vendor (Anthropic included)
publishes one, so ordinary AI-written text that carries no detectable mark
under our keys correctly reads "no mark detected". That is honest, but it
left a real gap: text that is obviously AI-written by ear got no signal at
all. `src/lib/detector/ai-likelihood.ts` adds a third, separate, key-free
channel that scores surface habits common in current LLM output (dash-clause
connectors, stock phrasing, elevated vocabulary, templated structures,
sentence-length uniformity) on a 0-100 scale, reusing the same pattern tables
`reduce_ai_evidence` already rewrites so the two can never disagree about
what counts as a tell. Unlike the other two channels it is deliberately
tuned to flag: the score saturates quickly on just a couple of habits,
trading false positives for fewer false negatives, and every surface that
shows it says so in as many words. Wired into `analyzeDocument` as
`result.aiLikelihood`, so it is present in the browser check, the API, the
MCP `check_document` tool and the PDF evidence report without a second
implementation anywhere. English only for now; the phrase and vocabulary
tables are English-specific.

Also added a Claude/ChatGPT-specific entry to `CORE_FAQ`
(`src/components/faq.tsx`), which ships on the homepage, `/check`, and
`llms.txt`, explaining plainly why no third-party tool (this one included)
can detect a named vendor's watermark without that vendor's key, and pointing
at the new heuristic channel and the existing `/guide/claude-ai-watermark`
explainer as the honest alternative for someone asking that exact question.

## 2026-09-08: www is now the canonical domain

`SITE.url` (`src/lib/site.ts`) now reads `https://www.watermarkremoverpro.com`
instead of the bare apex, so it's what Better Auth signs callbacks against, what
the Stripe checkout success/cancel URLs point at, and what every page's
`metadataBase`/canonical/JSON-LD advertise. All of that already read from this
one constant, so nothing else needed to change to follow it.

The apex domain stays registered on the Vercel project alongside www (nothing
to change there), but `next.config.ts` now 308-redirects any request whose
`Host` is `watermarkremoverpro.com` to the same path on `www`. 308 preserves
the request method, so a POST to `/api/billing/webhook` on the apex still
reaches the handler as a POST rather than being turned into a GET, verified
against a local production build with a spoofed `Host` header. The Stripe
webhook endpoint itself is registered against the apex URL in the Stripe
dashboard; re-pointing it at `www.watermarkremoverpro.com/api/billing/webhook`
directly (rather than relying on the redirect) is a follow-up, not done here:
it needs dashboard access this session didn't have.

## 2026-09-08: one journey, one input box, and a brand that is not a lab report

The largest change to this product's surface since launch. Three things were
wrong and all three are addressed here.

**The visual identity.** The old design was deliberately ink-on-paper, serif
headings, letterspaced monospace eyebrows, hairline "measurement band"
graphics under every heading on forty pages that carry no measurement. It
read as a court exhibit, which is defensible for a result screen and wrong
for everything around it. The palette is retuned in one place
(`src/app/globals.css`) to a clean, modern, pastel set built around the
product's own logo blue, with Plus Jakarta Sans throughout and JetBrains
Mono kept for anything measured. Token NAMES (`ink-*`, `seal-*`,
`signal-*`) are unchanged on purpose, so every one of the forty-odd pages
picked up the new identity without a find-and-replace, and a future retune
is one file again. Corner radii collapse to three shared tokens
(`--radius-control`, `--radius-panel`, `--radius-hero`); `BandRule` becomes
a plain accent rule while `Band` stays the one component that draws a real
statistic. `src/components/brand/logo.tsx` is the single source of truth for
the logo.

**The user journey.** Rewriting and checking were two features on two pages
reached by two nav items, and a visitor had to work out for themselves that
they probably wanted both. There is now one flow. `Workspace`
(`src/components/workspace/`) sits in the homepage hero: one input area that
accepts paste, drag-and-drop and an upload button, one button, and an output
screen carrying the rewritten text AND the detector's full reading of it.
That analysis costs nothing extra: `documentAfter` is the measurement the
rewrite engine already made in order to decide what to target. Language,
engine and strength moved behind an Advanced settings disclosure with
sensible defaults, and the two contradictory menus ("model tier" and
"rewrite engine", which could be set to combinations that meant nothing)
collapse into one engine choice.

`/check` remains a dedicated page for its own search intent, and `/rewrite`
remains for its own; both render the same components as the homepage rather
than reimplementing them, so the three cannot drift. `DocumentInput` is now
the only way text enters this product on any surface.

**Model tiers.** Everyone, signed in or not, now gets one free run of the Pro
rewrite engine every seven days and unlimited use of the Standard engine
forever. `src/lib/entitlements/pro-trial.ts` holds the arithmetic as pure
functions over a list of timestamps (rolling window, not a calendar week: "one
a week" measured from Sunday hands someone two runs in twenty minutes if they
arrive on a Sunday evening). Signed-in visitors are counted per account in a
new `pro_trial_runs` table through `/api/v1/pro-trial`; anonymous visitors are
counted in localStorage. A Pro subscriber never touches the ledger. The
endpoint accepts no request body on either verb and the client sends none,
which `tests/product-constraints.test.ts` now asserts: the one network call
anywhere near the document flow provably cannot carry a document.

**The Learnaway banner** is no longer a full-width interruption above the
header on every page. It is a footer note in the root layout (so no page can
ship without it) plus a proper homepage section explaining the split. The
constraint test was rewritten rather than deleted, and is stricter than
before: it now also asserts the banner component has not been reinstated and
that the homepage carries the section.

Also in this change:

- `SiteHeader` replaces the old header. The previous one hid Method, Verify,
  Blog and the API docs behind `hidden sm:inline-block`, which meant a phone
  visitor could not reach them at all; there is a real mobile menu now.
- `scripts/build-logos.ts` generates web-sized derivatives of the master
  artwork (264 KB to 31 KB for the lockup) and the logo is served
  `unoptimized`, because a fixed brand asset gains nothing from a per-request
  image transformation and every transformation is billable Vercel quota.
- `src/lib/documents/accepted-files.ts` names which formats can be read on
  the device and refuses .docx/.pdf/.odt BY NAME with what to do instead,
  rather than producing mojibake from a zip container.
- `npm run e2e` (`scripts/e2e-journey.mts`) drives the real journey in a real
  browser: paste, upload, a refused PDF, a full rewrite, the check page, every
  nav page, and mobile, asserting no console errors, no horizontal overflow
  and no undecoded images on any of them.
- Deleted: `mirror-banner.tsx`, `band-field.tsx`, `rewrite-tool.tsx`, and the
  `Drift` scroll-parallax component. All superseded, none left in the tree for
  someone to reinstate on a hunch.

Pricing copy, `llms.txt`, `pricing.json`, the FAQ and the CLI help all read
the trial numbers from the same constants the enforcement code does, so the
weekly allowance cannot be described differently in three places.

The homepage stays statically prerendered: the workspace resolves subscriber
status client-side from the allowance endpoint rather than reading a session
cookie on the server, which would have turned the most-visited page into a
per-request function invocation.

Found and fixed during the browser review that followed:

- **Blog posts scrolled sideways on a phone.** A `grid` with only an
  `lg:grid-cols-…` template falls back to one IMPLICIT column, and an implicit
  column is `auto`-sized: it takes its widest child's max-content width rather
  than the viewport's. The article rendered at 592px inside a 350px column and
  took the whole page, sticky header included, with it. `grid-cols-1` and
  `min-w-0` on both two-column content templates.
- **"Passages rewritten: 0 of 0" beside "AI-tell swaps: 6".** `result.passages`
  only ever holds passages the engine TARGETED, so when the targeting picked
  none the tile read as a bug. It now counts against the passages the document
  actually has, and says in a sentence when nothing was worth targeting.
- **Raw identifiers shown to visitors.** The marketing exhibit printed
  `hapaxRatio`, `commaRate` and friends, because the plain-English label map
  was private to the app's result view while the exhibit renders the same
  analysis object. Moved into `checker/measures.tsx` with the rest of the
  shared measurement vocabulary.
- **Illustrative `Band`s on the homepage's honesty cards.** Hand-typed numbers
  drawn with the graphic this product reserves for real measurements, on the
  section arguing it never does that. Replaced with numbered pastel badges.
- **The header CTA appeared on phones anyway.** `buttonClass` sets
  `inline-flex`, and adding `hidden sm:inline-flex` to the same element is a
  tie between two display utilities of equal specificity, settled by
  stylesheet order rather than class-string order. Hidden by a wrapper now,
  and the E2E asserts the outcome rather than the class list.
- **Contrast.** `ink-400` measured 2.8:1 on white and was carrying figure
  captions, timestamps and the per-passage measurement lines; the "carries
  signal after correction" badge was 2.8:1 white-on-amber. The muted ramp is
  retuned so 400 and below clear 4.5:1 on white AND on the tinted panel
  grounds, the badge moved to `signal-700`, and `ink-300` is now a
  borders-and-dividers tone that is never text. `npm run e2e` now walks every
  page template computing real contrast against the painted backdrop, so this
  cannot come back quietly.
- Long file paths in inline `<code>` scrolled `/docs/mcp` sideways on a phone;
  inline code wraps anywhere now, block code keeps its own scroll so a command
  is never broken mid-token.
- The blog index put a full section's padding between the category filter and
  the posts it filters. Auth pages painted their page background onto a narrow
  centred column, which drew a grey stripe down a white page; there is one
  `AuthShell` for all four now. Bespoke buttons on `/verify` and `/dashboard`
  now use `buttonClass`. `CATEGORY_TONE` had drifted into two copies in two
  different shapes and is now one, in `src/content/blog.ts`.

## 2026-09-07: ThreadCamp on its own domain, and a Stripe key rotation

Two follow-ups from the same day's earlier entries:

Verified watermarkremoverpro.com with ThreadCamp (the DKIM, SPF, MX and
DMARC records ThreadCamp asked for, added via `vercel dns add` since Vercel
holds this domain's nameservers, and confirmed by ThreadCamp's own real DNS
check). Mail now sends from `hello@watermarkremoverpro.com` rather than the
shared `relay.threadcamp.com` address, and the ThreadCamp account's own
contact email was moved off a personal Gmail alias onto that same inbox.
Verified with a real send, and with a real password-reset email through the
app itself, both landing with ThreadCamp reporting `status: "delivered"`.

Separately: the production `STRIPE_SECRET_KEY` was rolled (the prior key had
briefly appeared in a terminal transcript). While updating it, a first pasted
value turned out to be a different ProductFactory product's key (Vouchity's,
pasted into the wrong `.env.local`); caught it by checking which Stripe
account the key actually belonged to before deploying anything, corrected
both products' `.env.local` and Vercel production env separately, and
reverified checkout on this product against the new key.

## 2026-09-07: Stripe cross-product ownership gate

`src/lib/gate.ts` and `src/lib/stripe-guard.ts` arrived from the shared
`ProductFactory/_services/stripe-guard` install (not written for this
product specifically): before the webhook acts on an event, it now confirms
by Stripe price id, never by metadata or customer, that the event actually
belongs to WatermarkRemoverPro rather than another product on a shared
Stripe account. The installed copy had a syntax error (an `import` placed
inside the handler body instead of at the top of the file), which broke
`tsc` and would have broken the build; fixed that and added the usual
generated-file carve-outs to the house-style test and eslint config, without
touching the gate's own logic. All 229 tests plus typecheck, lint and build
pass with it in place.

## 2026-09-07: transactional email moved to ThreadCamp

OpenHelm Mail is replaced with ThreadCamp (threadcamp.com), a mail platform we
also own, following the wider portfolio's move off the Helm7-managed OpenHelm
Mail setup. `src/lib/openhelm-mail.ts` is deleted; `src/lib/threadcamp-mail.ts`
is the new client, same shape (`sendEmail`, `emailEnabled`, `sendingAddress`),
same no-silent-success contract. `src/lib/auth.ts` now imports from it, and
`.env.example` documents `THREADCAMP_API_KEY` / `THREADCAMP_FROM_ADDRESS` in
place of the old `OPENHELM_*` variables.

A real ThreadCamp account and inbox were provisioned for this product
(`hello@relay.threadcamp.com`, on the shared relay domain rather than a
verified watermarkremoverpro.com subdomain for now), and both variables are
set in production. Verified end to end: a real test send through the account
returned `status: "sent"` and arrived. Password-reset email, previously a
known, disclosed gap, now works.

Follow-up, not done here: verifying watermarkremoverpro.com's own DNS with
ThreadCamp so mail sends from `hello@watermarkremoverpro.com` instead of the
shared relay domain.

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
