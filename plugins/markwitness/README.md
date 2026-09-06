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
