---
name: markwitness
description: Check text for a statistical AI provenance mark (watermark) and reduce detectable AI-style evidence, entirely on-device. Use before publishing agent-written prose to a website, blog, docs site, README, or anywhere a reader or screening tool will see it; when asked whether text carries an AI watermark or "reads as AI"; when asked to make writing sound less like ChatGPT, remove em dashes and stock AI phrasing, or reduce AI-detector false-positive risk on the user's own writing.
---

# MarkWitness: check and reduce AI-style evidence, on-device

Two MCP tools, both of which run in this process and transmit nothing.

## Which tool, when

**`check_document`**: measure first. Returns a keyed green-list watermark
statistic with a confidence band, a style measurement against per-language
reference prose, an FDR-corrected per-passage breakdown, and the stated
limits. Call this before publishing generated prose, and before deciding
whether any rewrite is warranted.

**`reduce_ai_evidence`**: rewrite, on-device. Targets only the passages a
real check flags. Takes `strength` (`preserve` | `balanced` | `aggressive` |
`regenerate`) and `model` (`standard`, the default deterministic engine, or
`advanced`, a real local LLM that downloads on first use).

Start at `preserve`. It only touches passages the checker actually flags,
which is almost always what a user editing their own writing wants; higher
strengths trade fidelity to the original wording for a larger reduction.
`preserve` deliberately leaves dash punctuation alone, so use `balanced` when
em dashes used as clause connectors are among what you want fixed.

### The `tier` parameter, which is easy to miss

`tier` defaults to `"free"`, which runs the core AI-tell library. `"pro"`
runs the extended one, and that is where the announcement and marketing
register lives ("we're thrilled to announce", "serves as a", promotional
vocabulary). If a result comes back with `tellChangeCount: 0` but a non-zero
`additionalTellsInExtendedLibrary`, that number is exactly how many further
phrases `tier: "pro"` would have swapped on this document. Re-running with
`tier: "pro"` is usually what the user wants at that point.

## The publishing workflow this is for

1. Write the copy.
2. `check_document` on the prose.
3. If passages survive correction, or the AI-tell count is high, run
   `reduce_ai_evidence` at `preserve` on that prose.
4. `check_document` again and show the before/after delta.
5. Report what changed. Never present the result as "now undetectable".

## What to tell the user, and what never to claim

Pass the `limits` array through. Two of its entries change what a result
means:

- A detected mark is **not** proof of authorship. Marks survive quoting,
  translation and editing.
- An absent mark is **not** proof of human authorship. The test is keyed and
  no model vendor publishes its detection key, so "no mark detected" always
  means "under the keys tested".

Never claim a rewrite makes text undetectable, guaranteed to pass, or safe
from a specific detector. Nobody outside a vendor holds the key their mark
was applied with, so no tool can honestly promise that. State the measured
reduction instead.

## Scope

This is for checking and editing **the user's own writing**, or prose this
agent generated for them. It is not for screening other people's submitted
work, and it is not a way to conceal AI use where a policy requires it to be
disclosed.
