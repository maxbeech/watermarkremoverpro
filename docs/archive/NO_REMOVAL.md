# The no-removal policy

WatermarkRemoverPro does not remove, weaken, paraphrase around, substitute for, or
otherwise reduce a statistical AI provenance mark. Not on the free tier, not on
Pro, not through the JSON API, not through the MCP server, not as an undocumented
parameter, and not in a future version.

This document exists so that the reasoning survives staff turnover, acquisition,
and a quarter where the growth number is bad.

## Why this is not negotiable

A provenance mark is a transparency mechanism. Article 50 of the EU AI Act leans
on marking to let people know when they are reading generated content, and model
vendors are shipping marks specifically to satisfy that class of obligation.

A tool whose function is to strip the mark is a tool for defeating that
mechanism. It does not matter what the marketing calls it, whether "humanizer",
"rewriter" or "style naturaliser". The mechanism is the same and so is the effect.

The demand is real and it is well funded: "ai humanizer" carries roughly 823,000
searches a month, against about 630 a month for the entire honest cluster this
product serves. That asymmetry is exactly why this document is written down
rather than assumed. The pressure to add the feature will not come from a villain;
it will come from a reasonable person pointing at a revenue chart.

## The three signals that turn a diagnostic into an evasion service

Any one of these, on its own, converts this product into something we will not
ship:

1. **Hardening against inspection.** Making the method harder for a mark's owner
   to detect or counter. WatermarkRemoverPro publishes its method in full, at `/method`,
   including its weaknesses.
2. **Deliberate unattributability.** No signup, no logging, no per-user
   accountability *for a circumventing action*. Note the free tier is anonymous
   and stores nothing, and that is fine precisely because the action it performs is
   a measurement, not a circumvention. The distinction is the action, not the
   anonymity.
3. **Bulk or agent-callable circumvention.** Exposing removal through an API or
   MCP tool, which converts an individual remedy into automated laundering at
   scale. WatermarkRemoverPro's API and MCP surfaces expose measurement only.

## What we do instead

Explain the mechanism honestly, including that editing degrades a mark and
translation effectively destroys it. That is in `/guide/does-editing-remove-a-watermark`,
and it is there because it is *load-bearing for the defence*: it is precisely why
an absent mark cannot be treated as proof of human authorship, which is a point a
falsely accused writer needs to be able to make.

Explaining how a mechanism works is not the same as operating it. We decline to
publish a recipe for how much editing defeats a given signal strength, because a
recipe is the evasion guide with extra steps.

## How this is enforced in code

`tests/product-constraints.test.ts` fails the build if:

- any exported function matches a removal, paraphrase, humanise or rewrite
  capability signature;
- any route path suggests removal;
- the policy stops being stated in `llms.txt`, `pricing.json`, the FAQ, the
  OpenAPI document, or the MCP server.

`scripts/mcp-smoke.mts` additionally asserts, against the running MCP server,
that no tool with a removal-shaped name is advertised.

A promise in a README is a promise until someone is under deadline pressure. A
failing test is a conversation that has to happen before the change lands.

## If you are here to ask for the feature

The answer is no, and it will stay no. If a user wants a mark removed,
WatermarkRemoverPro is the wrong product and no configuration of it will be the right
one.
