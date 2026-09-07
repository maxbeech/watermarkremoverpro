# MarkWitness for Claude Code

Check text for an AI provenance mark and reduce detectable AI-style evidence,
entirely on-device.

```bash
claude plugin marketplace add maxbeech/markwitness
claude plugin install markwitness@markwitness
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

## Nothing is transmitted

Rewriting runs on-device or in-process, on every tier, with no hosted mode.
`check_document` optionally uses a hosted endpoint if you set
`MARKWITNESS_API_KEY`, which adds detection keys a local process cannot hold;
leave it unset and everything stays local.

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

Full documentation: https://markwitness.helm7.com/docs/mcp
