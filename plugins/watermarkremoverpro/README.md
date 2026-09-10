# WatermarkRemoverPro for Claude Code

Check text for an AI provenance mark and reduce detectable AI-style evidence,
entirely on-device.

```bash
claude plugin marketplace add maxbeech/watermarkremoverpro
claude plugin install watermarkremoverpro@watermarkremoverpro
```

## What you get

**Two MCP tools.** `check_document` measures a keyed green-list watermark
statistic with a confidence band, a style measurement against per-language
reference prose, and an FDR-corrected per-passage breakdown.
`reduce_ai_evidence` rewrites only the passages that actually carry evidence,
behind a hard fact-lock that rejects any candidate changing a number, a
negation or a named entity. `calibrate_text` and `describe_method` are also
exposed.

**A skill** telling the agent when to reach for them, so you don't have to
remember to ask.

**A hook** that checks public-facing content after the agent writes it. If a
markdown file, an HTML page, or anything under `content/`, `posts/` or
`blog/` carries AI tells, three-item-list or "not just X, but Y"
constructions, elevated AI-associated vocabulary, or watermark signal
surviving correction, the agent is told what was found and can act on it.

The hook never edits the file, stays silent on clean prose, ignores source
code, and skips anything under 120 words. A check that fires on every write
gets muted within a day.

## The four strengths, since the differences are not guessable

| Strength | Stock phrases | Em dashes | AI vocabulary | Passages rewritten |
|---|---|---|---|---|
| `preserve` | yes | no | no | only those a real check flags |
| `balanced` (default) | yes | yes | where it recurs | those, plus any carrying a flagged construction |
| `aggressive` | yes | yes | every occurrence | any testable passage |
| `regenerate` | yes | yes | every occurrence | all of them |

A word like "robust" or "comprehensive" is rewritten only once it recurs,
because a single occurrence is a word choice and not a tell. Three-item lists
and "not just X, but Y" are reported rather than find/replaced: the right fix
depends on what the sentence is saying. At `aggressive` and above they route
the passage to the rewriter, which is where `model: "advanced"` (a real local
LLM, downloaded on first use) earns its download.

## Cost per call

`reduce_ai_evidence` returns a summary by default: about 1,500 tokens for a
600-word document. Pass `detail: "full"` for both complete `AnalysisResult`
objects and every scored candidate, which is roughly 14,000 tokens for the same
document. The rewriting itself runs locally and consumes no model tokens at
all; what you pay for is the request and the response passing through your
agent's context.

## The two engines, and which one you get

`reduce_ai_evidence` takes `model: "auto" | "standard" | "advanced"`, and
`auto` is the default.

| Value | What runs | Download |
|---|---|---|
| `auto` (default) | the local model when its weights are already on this machine, the deterministic engine when they are not | none, until you ask |
| `advanced` | a real small local LLM (Qwen2.5, 0.5B on free / 1.5B on pro) via onnxruntime-node | once, on the first call |
| `standard` | deterministic rule-based substitution | none, ever |

`auto` exists because both flat defaults are wrong. Always downloading stalls
a first call behind several hundred megabytes nobody asked for; never
downloading meant a machine that already HAD the model kept getting the weaker
engine unless the caller remembered to name the better one. So: run
`reduce_ai_evidence` once with `model: "advanced"`, and every later call uses
the local model on its own.

Weights are cached under `~/.cache/watermarkremoverpro/models` and fetched from
the Hugging Face CDN, never from a WatermarkRemoverPro-operated server. Set
`WATERMARKREMOVERPRO_MODEL_CACHE` to put them somewhere else, or
`WATERMARKREMOVERPRO_REWRITE_MODEL=advanced` to make the local model the
default without passing `model` on every call.

Every response carries an `engine` object naming which engine ran and why. If
the local model was chosen and could not load, `engine.failure` holds the
reason and the deterministic engine finishes the job rather than the call
returning nothing. Set `WATERMARKREMOVERPRO_REWRITE_STRICT=1` if you would
rather that be a hard error.

## Nothing is transmitted

Rewriting runs on-device or in-process, on every tier, with no hosted mode, on
any value of `model`. `check_document` optionally uses a hosted endpoint if you
set `WATERMARKREMOVERPRO_API_KEY`, which adds detection keys a local process
cannot hold; leave it unset, which is the default, and everything stays local.
That key is the only switch anywhere in this plugin that causes text to leave
your machine.

`MARKWITNESS_API_KEY` is the pre-rename name of the same variable and still
works, so a config written before the rename needs no edit. Keys themselves
still begin `mw_live_`, unchanged. Setting both names to different values is
refused rather than silently resolved.

## What it will not claim

It cannot guarantee defeating a model vendor's undisclosed watermark. Nobody
outside that vendor holds the key it was applied with, so no tool honestly
can. What it reports is a measured reduction in evidence, before and after,
computed with the same arithmetic the checker uses.

## Zero install, deliberately

`dist/mcp-server.mjs` and `dist/hook-check.mjs` are committed, self-contained
bundles that run under plain `node`. That is why installing this is two
commands and not a checkout plus a build. Rebuild them with
`npm run build:plugin` from the repository root after changing anything under
`mcp/` or `src/lib/`.

## Upgrading from the MarkWitness plugin

The product was renamed, and so was the marketplace it publishes from. An
installation of `markwitness@markwitness` is pinned to the old GitHub
repository and will never see an update, however long it sits there. Replace
it:

```bash
claude plugin uninstall markwitness@markwitness
claude plugin marketplace remove markwitness
claude plugin marketplace add maxbeech/watermarkremoverpro
claude plugin install watermarkremoverpro@watermarkremoverpro
```

The MCP server id changes from `markwitness` to `watermarkremoverpro`, so tool
names change with it (`mcp__plugin_markwitness_markwitness__check_document`
becomes `mcp__plugin_watermarkremoverpro_watermarkremoverpro__check_document`).
Nothing else carries over, and nothing needs to: the plugin holds no state.

Full documentation: https://watermarkremoverpro.com/docs/mcp
