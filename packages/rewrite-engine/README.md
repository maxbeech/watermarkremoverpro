# @watermarkremoverpro/rewrite-engine

Reduce detectable AI-style evidence in text, entirely on-device. This is the
same engine [WatermarkRemoverPro](https://watermarkremoverpro.com/rewrite)'s browser UI
and MCP server use, packaged to run in your own process.

There is no REST endpoint for this on watermarkremoverpro.com, on any tier, by
design: this package never sends your document anywhere. Every call is a
local function call or a subprocess you control. See
[docs/REWRITE_PHILOSOPHY.md](https://github.com/maxbeech/watermarkremoverpro/blob/main/docs/REWRITE_PHILOSOPHY.md)
in the main repo for what it does and does not claim.

## What it does

Two mechanisms, run together, targeted at the passages a real per-passage
watermark/style check actually flags (via
[`@watermarkremoverpro/rewrite-engine`](.)'s bundled copy of the same detector
WatermarkRemoverPro's checker uses):

1. **Statistical evidence reduction**: scores candidate rewrites against the
   same watermark arithmetic the checker uses, gated by a fact-lock (numbers,
   negations, named entities must survive) and a similarity floor.
2. **AI-tell removal**: a deterministic pass over punctuation and phrasing
   habits over-represented in LLM output (the em dash used as a clause
   connector, stock phrases like "delve into" or "moreover").

## What it cannot claim

It cannot guarantee defeating a specific model vendor's undisclosed
watermark. Nobody outside that vendor holds the key it was applied with, so
no tool honestly can. Heavier strengths trade fidelity to the original
wording for a larger evidence reduction; review the diff.

## Install

```bash
npm install @watermarkremoverpro/rewrite-engine
```

The "standard" engine (deterministic, rule-based) needs nothing else. For the
"advanced" engine (a real small local LLM, run via Transformers.js), also
install its peer dependency:

```bash
npm install @huggingface/transformers
```

## CLI

```bash
npx @watermarkremoverpro/rewrite-engine --strength balanced input.txt
cat input.txt | npx @watermarkremoverpro/rewrite-engine --strength aggressive --tier pro
npx @watermarkremoverpro/rewrite-engine --model advanced --tier pro input.txt -o output.txt
npx @watermarkremoverpro/rewrite-engine --help
```

`--model advanced` downloads real model weights from the Hugging Face CDN on
first use (cached under `~/.cache/markwitness/models`), never from a
WatermarkRemoverPro-operated server, and never carries your document in that
download.

## Library

```ts
import { reduceEvidence } from '@watermarkremoverpro/rewrite-engine'

const result = await reduceEvidence(
  { text: 'Your document here...', strength: 'balanced', tier: 'free' },
  [], // detection keys; pass [] to use the built-in open reference key
)

console.log(result.revisedText)
console.log(result.limits) // always ships with its own stated limits
```

For the advanced (real local LLM) backend in Node:

```ts
import { rewriteDocument } from '@watermarkremoverpro/rewrite-engine'
import { createTransformersNodeBackend } from '@watermarkremoverpro/rewrite-engine/node'

const backend = createTransformersNodeBackend('pro')
const result = await rewriteDocument({ text, strength: 'balanced', tier: 'pro' }, backend, [])
```

`@watermarkremoverpro/rewrite-engine/node` requires `@huggingface/transformers` as a
peer dependency and is Node-only (it never imports in a browser bundle).

## License

MIT
