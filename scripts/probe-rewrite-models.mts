/**
 * Manual, one-off vetting probe for the REWRITE ENGINE's local generation
 * model (src/lib/rewrite/models.ts's `rewriteModel` entries, loaded by
 * src/lib/rewrite/backend/transformers-shared.ts's `generateWithTransformers`
 * via Transformers.js). This is a sibling probe to the detector's
 * scripts/probe-secondary-detector.mts / probe-detector-round2.mts /
 * probe-detector-round3.mts, applying the same discipline to a different
 * channel: never trust a benchmark or a model's reputation, only real output
 * from the exact loading path this app ships.
 *
 * NOT part of `npm test`: it downloads real model weights (multiple
 * candidates, several hundred MB each) and runs real generation, so it is
 * not a tolerance-free CI gate. Run manually:
 *
 *   npx tsx scripts/probe-rewrite-models.mts
 *
 * WHY THIS PROBE EXISTS: the two Qwen2.5 pins (0.5B free-tier, 1.5B pro-tier)
 * were chosen for the rewrite engine when small/fast was the hard constraint,
 * and have never been benchmarked against alternatives for REWRITE QUALITY
 * specifically (round 2 of the detector probes tested small Qwen2.5 models
 * only as a generative *judge* for detection, a completely different task).
 * Now that a bigger download/wait is acceptable if the result is genuinely
 * better, this probe looks for a clear, concrete upgrade for either tier.
 *
 * CANDIDATES: alongside the current pins (baseline), the newer same-family
 * Qwen3 release, at closely comparable sizes, both from onnx-community
 * (actively maintained conversions, Apache-2.0 like the current Qwen2.5
 * pins, confirmed via the HF Hub API at probe time):
 *
 *   - onnx-community/Qwen3-0.6B-ONNX (successor to the free-tier 0.5B pin)
 *   - onnx-community/Qwen3-1.7B-ONNX (successor to the pro-tier 1.5B pin)
 *
 * Other candidates named in the research brief were investigated and
 * excluded before running, for concrete reasons rather than being skipped
 * quietly:
 *
 *   - Llama-3.2-1B/3B-Instruct (onnx-community/Llama-3.2-1B-Instruct-ONNX):
 *     working ONNX export exists, but it ships under Meta's custom "llama3.2"
 *     license (acceptable-use restrictions, a >700M-MAU special-license
 *     clause, mandatory "Built with Llama" attribution), not the permissive
 *     Apache-2.0 the current pins and this repo's other pinned models all
 *     use. A license downgrade is its own cost separate from output quality,
 *     so it was not worth spending a probe run on unless the Apache-2.0
 *     candidates below failed outright.
 *   - Phi-3.5-mini, Gemma-2-2B-it, SmolLM2-1.7B-Instruct: none had a
 *     current, actively-maintained onnx-community Transformers.js conversion
 *     at probe time (search turned up either nothing, or GQA/web-specific
 *     forks not published as plain pipeline()-loadable text-generation
 *     repos); not pursued further given a same-family, same-license, newer
 *     alternative (Qwen3) was already available and current.
 *
 * A GOTCHA specific to Qwen3, found while reading its own
 * chat_template.jinja before running anything (not discovered by trial and
 * error): Qwen3's default chat template unconditionally injects a
 * `<think>...</think>` reasoning block into the assistant turn unless the
 * caller explicitly passes `enable_thinking: false`. transformers-shared.ts's
 * buildMessages()/generateWithTransformers() contract is "reply with ONLY
 * the rewritten passage text: no preamble" - a stray thinking block would
 * silently break that contract for every Qwen3-backed rewrite. Transformers.js's
 * text-generation pipeline forwards `tokenizer_encode_kwargs` straight into
 * `apply_chat_template` (see node_modules/@huggingface/transformers/src/
 * pipelines/text-generation.js), so `enable_thinking: false` is passed as
 * `tokenizer_encode_kwargs: { enable_thinking: false }` below - the same
 * option a real integration would have to add to generateWithTransformers()
 * if Qwen3 were to replace the current pins.
 *
 * METHOD: five genuinely AI-sounding paragraphs (80-150 words), spanning
 * technical explanation, marketing announcement, casual blog, a professional
 * email and a short assistant-style answer (chosen to also cover the
 * registers the detector probes already use, for continuity), each run
 * through every candidate at strengths 'balanced' and 'aggressive' using the
 * *exact* prompt shape buildMessages() in transformers-shared.ts builds
 * (same system prompt, same per-strength instruction text, same user-message
 * shape) and the *exact* generation parameters generateWithTransformers()
 * uses (do_sample: true, top_p: 0.92, repetition_penalty: 1.15; temperature
 * fixed at 0.45, the first-candidate value, since this probe judges typical
 * single-candidate quality rather than diversity across a batch).
 *
 * Judged by eye against generateWithTransformers()'s own job: does the
 * output preserve every fact/number/name in the passage; does it actually
 * read differently from the input; is it grammatical and free of leftover
 * chat-template/thinking artifacts; and download size / load time / per-call
 * latency through this exact loading path.
 *
 * RESULT: see the dated conclusion appended to this comment after the run
 * this probe supports, and the full console output preserved in the
 * PR/commit this script shipped with.
 */
import { pipeline, env as tjsEnv } from '@huggingface/transformers'
import os from 'node:os'
import path from 'node:path'

tjsEnv.cacheDir = path.join(os.homedir(), '.cache', 'watermarkremoverpro', 'models')

/* ---------------------------------------------------------------- test passages */
// Five genuinely AI-sounding paragraphs (80-150 words), written fresh for this
// probe, spanning registers.

const PASSAGES: Array<[string, string]> = [
  [
    'technical explanation',
    "Caching works by storing a copy of frequently requested data somewhere faster to access than its original " +
      "source. When a request comes in, the system first checks whether a valid cached version already exists. If " +
      "it does, that copy is returned immediately, avoiding the cost of recomputing or refetching the data from a " +
      "slower origin such as a database or a remote API. Cache invalidation, deciding when a cached copy has grown " +
      "stale and must be refreshed, is widely considered one of the hardest problems in computer science, because " +
      "getting it wrong in either direction either serves outdated data or defeats the performance benefit " +
      "entirely. This simple idea underlies everything from browser caches to large-scale content delivery networks.",
  ],
  [
    'marketing announcement',
    "We're thrilled to announce the launch of Horizon 3.0, the biggest update to our platform since it first " +
      "launched in 2021. This release introduces real-time collaboration, a redesigned dashboard, and support for " +
      "over 40 new integrations, all built in direct response to feedback from our community of more than 200,000 " +
      "users. Whether you're a solo freelancer or part of a 500-person team, Horizon 3.0 adapts to your workflow, " +
      "not the other way around. Existing customers get free access to every new feature starting today, and new " +
      "signups receive a 30-day trial with no credit card required. We can't wait to see what you build with it.",
  ],
  [
    'casual blog post',
    "So I finally tried making sourdough bread this weekend, and honestly? It did not go the way the YouTube videos " +
      "promised. My starter, which I'd been feeding for two weeks, looked bubbly and alive right up until the " +
      "moment I actually needed it, at which point it just sort of sat there doing nothing. The loaf came out dense " +
      "enough to use as a doorstop, and I'm fairly sure I could have shattered a window with the crust. Still, there " +
      "was something oddly satisfying about the whole process, flour everywhere and all, and I'm already planning " +
      "to give it another go next weekend with a fresh starter.",
  ],
  [
    'professional email',
    "Hi Priya, I hope this email finds you well. I wanted to follow up on our conversation from last week regarding " +
      "the Q3 roadmap, specifically the proposed timeline for the onboarding redesign. Based on feedback from the " +
      "engineering team, I believe we should prioritize the onboarding improvements before tackling the three new " +
      "integrations originally scheduled for August. This would push the integrations to early Q4, but should " +
      "meaningfully reduce the support tickets we've seen from new users over the past two months. Please let me " +
      "know if you'd like to discuss this further, and I'm happy to set up a call at your convenience.",
  ],
  [
    'assistant-style answer',
    "Great question! There are a few key factors to consider when choosing between renting and buying a home. " +
      "First, think about how long you plan to stay in the area, since buying generally only makes financial sense " +
      "if you'll stay put for at least five to seven years. Second, consider your upfront savings relative to a " +
      "typical 20 percent down payment, plus closing costs, which often run an additional 2 to 5 percent of the " +
      "purchase price. Finally, factor in ongoing costs like property taxes, maintenance, and insurance, which " +
      "renting simply doesn't carry. There's no universally correct answer, only the one that fits your situation.",
  ],
]

/* -------------------------------------------------------------------- candidates */

interface Candidate {
  name: string
  repo: string
  revision?: string
  dtype: 'q4' | 'q4f16' | 'int8' | 'fp16'
  /** Extra tokenizer_encode_kwargs to forward into apply_chat_template (e.g. Qwen3's enable_thinking). */
  tokenizerEncodeKwargs?: Record<string, unknown>
}

const CANDIDATES: Candidate[] = [
  {
    name: 'Qwen2.5-0.5B-Instruct (CURRENT free-tier pin)',
    repo: 'onnx-community/Qwen2.5-0.5B-Instruct',
    revision: 'cc5cc01a65cc3ff17bdb73a7de33d879f62599b0',
    dtype: 'q4',
  },
  {
    name: 'Qwen2.5-1.5B-Instruct (CURRENT pro-tier pin)',
    repo: 'onnx-community/Qwen2.5-1.5B-Instruct',
    revision: '6287331f475a3e20e8c879be8fd4bf3551ad9d34',
    dtype: 'q4',
  },
  {
    name: 'Qwen3-0.6B-ONNX (candidate free-tier replacement)',
    repo: 'onnx-community/Qwen3-0.6B-ONNX',
    dtype: 'q4',
    tokenizerEncodeKwargs: { enable_thinking: false },
  },
  {
    name: 'Qwen3-1.7B-ONNX (candidate pro-tier replacement)',
    repo: 'onnx-community/Qwen3-1.7B-ONNX',
    dtype: 'q4',
    tokenizerEncodeKwargs: { enable_thinking: false },
  },
]

/* ------------------------------------------------------------- prompt (from transformers-shared.ts) */
// Copied verbatim from buildMessages()/STRENGTH_INSTRUCTION in
// src/lib/rewrite/backend/transformers-shared.ts so this probe exercises the
// real production prompt shape, not an approximation of it.

const STRENGTH_INSTRUCTION: Record<'balanced' | 'aggressive', string> = {
  balanced:
    'Rewrite this in your own words while keeping the same meaning, structure and level of detail. Vary sentence length and word choice naturally.',
  aggressive:
    'Rewrite this substantially: restructure sentences, change word choice throughout, and write as a person would, while keeping every fact, number, name and claim exactly as given.',
}

function buildMessages(passage: string, strength: 'balanced' | 'aggressive'): Array<{ role: string; content: string }> {
  const system =
    'You are a careful copy editor reducing statistical AI-writing patterns in a passage the user wrote themselves. ' +
    'Strictly preserve every fact, number, date, name and negation in the passage. ' +
    'Reply with ONLY the rewritten passage text: no preamble, no quotation marks, no explanation.'
  return [
    { role: 'system', content: system },
    { role: 'user', content: `${STRENGTH_INSTRUCTION[strength]}\n\nPassage:\n${passage}` },
  ]
}

function extractReply(output: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const first = Array.isArray(output) ? (output[0] as any) : output
  const generated = first?.generated_text
  if (Array.isArray(generated)) {
    const last = generated[generated.length - 1]
    return typeof last?.content === 'string' ? last.content : ''
  }
  return typeof generated === 'string' ? generated : ''
}

/* -------------------------------------------------------------------- runner */

async function runCandidate(candidate: Candidate) {
  console.log(`\n\n########## ${candidate.name} (${candidate.repo}) dtype=${candidate.dtype} ##########`)
  const loadStart = Date.now()
  const generator = await pipeline('text-generation', candidate.repo, {
    ...(candidate.revision ? { revision: candidate.revision } : {}),
    device: 'cpu',
    dtype: candidate.dtype,
  })
  console.log(`loaded in ${Date.now() - loadStart}ms`)

  let totalLatency = 0
  let count = 0

  for (const [label, passage] of PASSAGES) {
    for (const strength of ['balanced', 'aggressive'] as const) {
      const messages = buildMessages(passage, strength)
      const start = Date.now()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const output = await (generator as any)(messages, {
        max_new_tokens: Math.min(500, Math.max(60, Math.ceil(passage.length / 3) + 40)),
        do_sample: true,
        temperature: 0.45,
        top_p: 0.92,
        repetition_penalty: 1.15,
        ...(candidate.tokenizerEncodeKwargs ? { tokenizer_encode_kwargs: candidate.tokenizerEncodeKwargs } : {}),
      })
      const latency = Date.now() - start
      totalLatency += latency
      count++
      const reply = extractReply(output).trim().replace(/^["'"]|["'"]$/g, '')
      console.log(`\n--- [${label} / ${strength}] (${latency}ms) ---`)
      console.log(`INPUT:  ${passage}`)
      console.log(`OUTPUT: ${reply}`)
    }
  }

  console.log(`\n  summary: avg latency ${(totalLatency / count).toFixed(0)}ms/generation over ${count} generations`)
}

async function main() {
  for (const candidate of CANDIDATES) {
    try {
      await runCandidate(candidate)
    } catch (err) {
      console.log(`  FAILED to load/run ${candidate.name}: ${(err as Error).message}`)
    }
  }
}

main().catch((err) => {
  console.error('Probe crashed:', err)
  process.exit(1)
})
