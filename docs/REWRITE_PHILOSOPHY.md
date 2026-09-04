# What Rewrite does, and what it does not claim

MarkWitness reduces detectable AI-style evidence in a document. This document
replaces `docs/NO_REMOVAL.md` (kept at `docs/archive/NO_REMOVAL.md` for
history) as the source of truth for what that means, why, and where the line
still sits.

## What changed, and why

MarkWitness launched as a detection-only diagnostic with a permanent
no-removal policy. That policy was reconsidered deliberately, not eroded by
drift: the product now offers on-device rewriting as its primary feature,
alongside detection, which continues as a complementary, honest entry point
("see your evidence, then reduce it"). This document is written with the same
care the old one was, because the goal (a promise that survives a bad quarter)
did not change, only its content did.

## What the rewrite feature actually does

Two mechanisms, run together:

1. **Statistical evidence reduction.** Targets the passages the detector's own
   per-passage findings flag, and generates candidate rewrites scored against
   the same watermark arithmetic the checker uses. Only replaces a passage
   with a candidate that passes a fact-lock (numbers, negations, named
   entities preserved) and stays above a similarity floor for the requested
   strength.
2. **AI-tell removal.** A fast, deterministic pass over punctuation and
   phrasing habits over-represented in LLM output: the em dash used as a
   clause connector, and a maintained list of stock phrases ("delve into",
   "moreover", "it's important to note that"). Runs before the statistical
   pass and needs no model.

## The two backends behind "on-device"

"On-device" names a guarantee, not one specific implementation, and this
product ships two real ones behind the same `RewriteBackend` interface
(`src/lib/rewrite/backend/`):

- **Standard**, the always-available default: deterministic dictionary
  substitution and AI-tell pattern swaps (`backend/rule-based.ts`). No
  download, instant, needs no model.
- **Advanced**, opt-in: a real small local language model (Qwen2.5, pinned by
  exact repo and commit revision in `models.ts`), run via Transformers.js,
  WebGPU or WASM in the browser (`backend/browser.ts`), onnxruntime-node in
  the MCP server and CLI (`backend/node.ts`). Weights are downloaded straight
  from the Hugging Face CDN and cached locally on first use, never from a
  MarkWitness-operated server, and this download never carries the document
  being rewritten. If the device can't run it (no WebGPU/WASM support, a
  blocked download, insufficient memory), every caller falls back to
  Standard automatically and says so, rather than failing silently or
  fabricating a result.

## What it does NOT claim

- **No guarantee against an undisclosed vendor watermark.** A keyed
  green-list mark cannot be defeated with certainty by anyone who does not
  hold the key it was applied with, symmetric to the detector's own stated
  limitation that "no mark detected" only ever means "under the keys this
  deployment holds." Any tool claiming otherwise is overselling a
  probabilistic process.
- **No "100%", "undetectable", or "guaranteed to pass" language, anywhere.**
  Enforced by `tests/product-constraints.test.ts`, which scans the whole
  source tree for exactly this class of claim.
- **Heavier rewriting trades fidelity for evidence reduction.** The
  "aggressive" and "regenerate" strengths touch more of the document and
  allow more semantic drift from the original wording. Review the diff.
- **Not a claim about detectors trained after today, or not in the tested
  set.** The evidence scores shown are computed with MarkWitness's own
  detector arithmetic, against the keys this deployment holds.

"Reduce" is the honest verb. It is falsifiable (you can measure a before/after
delta) and it does not misrepresent a probabilistic process as a certainty the
way "remove" or "undetectable" would.

## The one absolute that survived unchanged

**Rewriting runs entirely on-device or in-process, on every tier, on every
surface, with no exception.** Free and Pro alike. Browser, MCP server, and the
published local package/CLI alike. No server MarkWitness operates ever
receives the document text for this feature. Unlike checking, which does
have an opt-in hosted mode for API/MCP callers. This is the direct
replacement for the old "permanent constraint," carrying the same weight:
this is not negotiable, and it is enforced in code, not just written down.

## How this is enforced in code

`tests/product-constraints.test.ts` fails the build if:

- any unverifiable-guarantee language (100%/guaranteed/undetectable-style
  claims) appears anywhere in the source tree;
- the surfaces a user or agent actually reads (`llms.txt`, `pricing.json`,
  the FAQ, `mcp/server.ts`, the OpenAPI document) fail to state that the
  rewrite feature cannot guarantee a result;
- a network call appears anywhere in `src/lib/rewrite`.

`scripts/mcp-smoke.mts` additionally asserts, against the running MCP server,
that the rewrite tool is advertised, that its description discloses the
limitation, that a real rewrite call returns the same limits in its result
payload (not just in static copy), and that both the standard and advanced
model options are advertised in its schema.

`scripts/test-advanced-backend.mts` (`npm run test:models`) is a real,
opt-in integration test against the advanced backend's actual downloaded
weights and inference: not part of `npm test` because it downloads real
model weights on first run and quantized inference isn't bit-deterministic
across hardware, so it can't be a tolerance-free CI gate. Run it manually
before a release, or after touching `backend/node.ts`,
`backend/transformers-shared.ts`, or the model pins in `models.ts`.

## If you are here to ask for a "100% guaranteed" claim

The answer is no, and it will stay no. A claim we cannot verify is not a
feature; it is a liability with good marketing.
