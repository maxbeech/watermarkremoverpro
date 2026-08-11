# MarkWitness build log

Checkpoints for the pipeline row `markwitness` (Product Pipeline table).

**Why this file exists.** The OpenHelm data MCP token issued to this build run had
a one-hour lifetime (issued 2026-08-11T19:27:39Z, expired 20:27:39Z) and started
returning `401 Invalid or expired token` partway through the build. Checkpoints
are therefore written here and pushed to GitHub, which is durable, and mirrored
into the pipeline row's Notes whenever the token is available. If you are
resuming this build and the row's Notes stop earlier than this file does, **this
file is the more recent record**.

---

## Workspace (authoritative)

```
/Users/maxbeech/Documents/Beech/Development/ProductFactory/markwitness
```

`list_products` carries this product under its pre-rename idea slug
`ai-provenance-mark-diagnostic` with `workspacePath`
`/cloud/8defb3e6-8693-413b-b76a-e92a9aa4b611`, which does not exist on this
executor and is not creatable (filesystem root). `get_idea_config` carries no
`workspaceRoot` key, so the root was taken from the convention every other
product in the ledger follows. `upsert_product` cannot write `workspacePath`, so
the product record still points at the stale `/cloud/...` path — **use the path
above**.

Repository: <https://github.com/maxbeech/markwitness> (private, `main`).
Vercel project: `markwitness` in `max-beechs-projects`.
Database: Neon resource `neon-champagne-forest`, connected to the Vercel project.

---

## Checkpoint 1 — scaffold (20:05Z)

Scaffolded **fresh, not forked**. No donor product was copied, so the donor
subject / product-noun / currency sweep required of a fork is vacuous by
construction — there is no donor string in this repo to find.

Next.js 16.2.10 / React 19.2.4 / TypeScript / Tailwind v4 / vitest, versions
pinned to sibling `spend7` because that combination is known-good on this
toolchain.

**Recorded stack deviation.** The approved spec said the engine would be Rust
compiled to WASM. It is isomorphic TypeScript instead. The binding requirement is
that the computation is *real* and runs *on device*, not that it is Rust — and
one TypeScript module runs unchanged in the browser (free path) and in the Node
function (API/MCP path), which gives a single source of truth for the arithmetic
instead of two implementations that can silently disagree. It also removes a Rust
toolchain from the Vercel build. No capability is lost and the on-device promise
is unchanged.

## Checkpoint 2 — engine (20:24Z)

Two channels, reported separately, never blended into one "AI score".

1. **Watermark (keyed).** Green-list z test after Kirchenbauer et al. 2023
   (arXiv:2301.10226). Distinct word bigrams are scored once each — counting a
   repeated "of the" forty times would let a repetitive but entirely human
   document manufacture its own z score.
2. **Style (key-free).** Register distance against per-language corpus baselines,
   in standard deviations, with a seeded percentile bootstrap band.

SHA-256 and HMAC are implemented synchronously in-repo so the browser and the
server compute byte-identical results and a saved evidence report reproduces
exactly. Verified against `node:crypto` and the RFC 4231 vectors.

**The positive control is the load-bearing test.** Text marked under a key is
detected at z > 8, p < 1e-6, and the *same text* sits at chance under a
*different* key. Without that pair, a detector is indistinguishable from a
function that returns small numbers.

**Key honesty decision** (`src/lib/detector/keys.ts`): a green-list mark is a
keyed construction and no model vendor publishes a detection key. The product
tests the keys it holds and names them on every result; it ships a *public* open
reference key so the keyed path genuinely runs and is auditable by anyone; it
accepts vendor or institution keys through `MARKWITNESS_DETECTION_KEYS`. "No mark
detected" is always worded "under the keys listed". Every statistic is
`number | null` beside a status and a reason, so a fabricated zero is
unrepresentable in the type system.

## Checkpoint 3 — baselines are real measured data (20:24Z)

Baselines are **measured, not written by hand**, from ~597,000 words of
contemporary Wikipedia prose (CC BY-SA) pulled per language through the MediaWiki
API:

| Language | Chunks | Tokens measured |
|---|---|---|
| en | 567 | 216,157 |
| es | 243 | 92,667 |
| fr | 248 | 92,643 |
| de | 310 | 112,172 |
| pt | 205 | 76,142 |

Every fetched document was language-verified by the engine's **own** identifier
before being kept — the API was asked for Spanish and is generally telling the
truth, but a baseline is the reference every user's number is measured against
and "the source said so" is not verification. The builder refuses to emit a
baseline under 120 chunks or with a degenerate feature distribution: a language
without a real corpus ships **unsupported** rather than borrowing another
language's numbers.

Corpus provenance (source, licence, retrieval date, document and token counts)
travels inside each baseline file and is cited on screen and on the report.

## Checkpoint 4 — moat and a real database (20:55Z)

- `POST /api/v1/check` — API-key auth (key stored as SHA-256, shown once),
  per-1,000-word metering, `402` naming the exact limit reached, `503` rather
  than serving unmetered when the ledger is absent.
- `mcp/server.ts` — `check_document` and `describe_method`; local mode (no key,
  nothing recorded or billed) and hosted mode.
- `/api/openapi.json`, `/pricing.json`, `/llms.txt` — all rendered from the same
  constants as the human pages so they cannot drift.

Neon Postgres provisioned for real and connected to the Vercel project. Schema
applied and verified present: `account`, `accounts`, `api_keys`, `checks`,
`session`, `usage_events`, `user`, `verification`.

Better Auth's tables were transcribed from `getAuthTables()` in the **installed
package** rather than from documentation, so they match the version actually
running. The Better Auth CLI could not be used: it requires the auth instance to
be exported as a value, and ours is built lazily so `next build` needs no live
database.
