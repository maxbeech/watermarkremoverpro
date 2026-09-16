/**
 * Second manual, one-off vetting probe for the detector's model-backed
 * channel (see the module doc comment in ../src/lib/detector/models.ts and
 * the round-1 probe, scripts/probe-secondary-detector.mts, whose own comment
 * records the first round of rejected candidates and this exact
 * methodology). This file does not replace or overwrite that one: its
 * negative result is a real historical record, and this round's result
 * (positive or negative) belongs alongside it, not instead of it.
 *
 * NOT part of `npm test`: it downloads real model weights and runs real
 * inference. Run manually:
 *
 *   npx tsx scripts/probe-detector-round2.mts
 *
 * This round investigates two distinct avenues, per the research brief:
 *
 *   1. Classifier avenue: search the Hugging Face Hub for a fine-tuned
 *      sequence-classification AI-text detector released/updated more
 *      recently than round 1's candidates, small enough to ship, with a
 *      clear permissive license. Vetted the same way as round 1: loaded
 *      through the *exact* pipeline() call shape ml-classifier.ts uses
 *      (pipeline('text-classification', repo, {revision, device, dtype})),
 *      at both dtype 'int8' (what would ship) and 'fp32' (sanity check),
 *      against the same probe set used in round 1 (6 human, 6 AI, spanning
 *      registers) so results are directly comparable.
 *
 *      Search covered: every onnx-community text-classification repo whose
 *      id contains "detect" (14 repos: the pinned model, roberta-large-
 *      openai-detector [same GPT-2-era lineage as the pinned model, so not
 *      re-tested: nothing changes the fundamental "trained to find GPT-2,
 *      not GPT-4/Claude/Gemini" problem], chatgpt-detector-roberta and
 *      answerdotai-ModernBERT-base-ai-detector [both already rejected or
 *      disqualified: the former for no stated license in round 1, the
 *      latter for the same reason confirmed again this round via the HF Hub
 *      API - cardData.license is absent], tmr-ai-text-detector and
 *      modernbert-ai-detection-raid-mage and e5-small-lora-ai-generated-
 *      detector [all three already rejected in round 1], plus five unrelated
 *      detectors for spam/phishing/language/NSFW/emotion, not AI-text); the
 *      HF Hub search API for "RAID detector" (the benchmark both rejected
 *      round-1 candidates were trained/evaluated on), which surfaced one
 *      genuinely new, previously-untried candidate below; and searches for
 *      "ai-text-detect", "ai-detector", "llm-generated detector onnx",
 *      "ai-generated-text onnx" and "human-vs-ai onnx", which turned up
 *      nothing else with both a standard AutoModelForSequenceClassification
 *      ONNX export and a stated permissive license.
 *
 *   2. Generative-judge avenue (the user's alternative idea): a small
 *      general-purpose instruct model, prompted to return a strict-JSON
 *      verdict on whether a passage reads as AI-written, run through the
 *      exact `pipeline('text-generation', repo, {revision, device, dtype})`
 *      shape the rewrite engine's backend/transformers-shared.ts already
 *      uses (see ../src/lib/rewrite/models.ts). Tested: does it discriminate
 *      real human vs. real AI text; does it reliably return parseable JSON
 *      across many runs; rough latency; download size. Candidates: the two
 *      models already pinned for the rewrite engine (onnx-community/
 *      Qwen2.5-0.5B-Instruct, onnx-community/Qwen2.5-1.5B-Instruct) at their
 *      already-pinned revisions and dtypes, since they are already a
 *      cache/bundle cost this app pays for the Pro rewrite engine and so are
 *      the cheapest possible version of this avenue to evaluate honestly.
 *
 * RESULT (2026-09-14): both avenues FAILED. No change was made to
 * models.ts / ml-classifier.ts / use-ml-classifier.ts / workspace-app.tsx /
 * settings.ts.
 *
 *   Avenue 1, BERT-tiny-RAID: degenerate in a way round 1's tmr-ai-text-
 *   detector was degenerate, but more starkly - every one of the 12 probes
 *   (all 6 human, all 6 AI) came back identical: {"label":"LABEL_0","score":1}
 *   at both int8 and fp32. This traces to the model's architecture, not
 *   quantization: its config.json declares num_labels=1 (a single-logit
 *   regression head the model card says outputs "the likelihood the text is
 *   human"), and Transformers.js's generic text-classification pipeline
 *   applies softmax across however many labels a model reports - softmax of
 *   a single value is definitionally always 1.0, regardless of the
 *   underlying logit. So this specific model shape cannot produce a varying
 *   score through the exact `pipeline('text-classification', ...)` primitive
 *   this app's loader uses at all, independent of how good or bad the
 *   underlying RAID-trained weights actually are. Disqualified on loader
 *   incompatibility, the same category of failure (not fit for "generalize
 *   the loader minimally") that dropped amrita-detectly/detect-ai-text-v1 in
 *   round 1.
 *
 *   Avenue 2, generative judge (Qwen2.5-0.5B/1.5B-Instruct, the models
 *   already pinned for the rewrite engine in ../src/lib/rewrite/models.ts,
 *   prompted for a strict {"verdict":"ai"|"human","confidence":...} JSON
 *   reply): both models reliably returned parseable JSON (11/12 and 12/12
 *   respectively - the "does it go off-script" risk was real but small at
 *   this prompt length), but neither discriminated reliably, and each
 *   failed in the OPPOSITE direction:
 *     - Qwen2.5-0.5B: 8/12 (67%) correct. It missed 3 of 6 AI probes,
 *       scoring the blog-style paragraph, marketing copy and LinkedIn post
 *       all confidently "human" (plus one unparseable AI-probe reply), i.e.
 *       it under-flags exactly the polished/promotional register where
 *       AI-generated text is common.
 *     - Qwen2.5-1.5B: 8/12 (67%) correct too, but caught 6/6 AI probes at
 *       the cost of over-flagging: 4 of 6 human probes (the casual diary,
 *       the forum post, the lab notebook, the text message) were called
 *       "ai", i.e. it over-flags exactly the informal/casual register real
 *       people actually write in day to day.
 *   Neither model clears even a plain-accuracy bar (67%, barely above
 *   guessing at 50%) let alone this channel's own established standard of
 *   6/6 correctness on every probe at every tested setting. A directionally-
 *   biased coin flip is not "better than doing nothing beyond the existing
 *   heuristic channel" (aiLikelihood, ./ai-likelihood.ts) - it is worse,
 *   since it would additionally cost a multi-second generation (1.8s/probe
 *   at 0.5B, 3.4s/probe at 1.5B, on CPU) plus, for a visitor who has not
 *   already downloaded either model for the rewrite engine, several hundred
 *   megabytes, in exchange for a signal no more trustworthy than the
 *   existing instant heuristic.
 *
 * Conclusion: no candidate from either avenue is shippable. The current pin
 * (DETECTOR_MODEL in ../src/lib/detector/models.ts) is unchanged. The next
 * person investigating this should not re-attempt BERT-tiny-RAID-ONNX
 * (architecturally incompatible with this pipeline, not a quantization or
 * prompt problem) or a bare zero-shot-prompted Qwen2.5 judge at these sizes
 * (a larger generative model, structured constrained decoding/grammar, or a
 * genuinely different prompting strategy might do better, but that is a
 * different, unproven approach, not a retry of this one).
 */
import { pipeline, env as tjsEnv } from '@huggingface/transformers'
import os from 'node:os'
import path from 'node:path'

tjsEnv.cacheDir = path.join(os.homedir(), '.cache', 'watermarkremoverpro', 'models')

/* ---------------------------------------------------------------- probe set */
// Identical to scripts/probe-secondary-detector.mts's probe set, so results
// are directly comparable across rounds.

const HUMAN_PROBES: Array<[string, string]> = [
  [
    'old prose (pastiche of an 1880s travelogue)',
    "We reached the village a little after four, the horses spent and the road behind us gone entirely to mud. " +
      "The innkeeper, a stout man with an unfortunate opinion of his own French, showed us to a room under the eaves " +
      "where the rain came through in exactly one place, which we were assured was 'nothing, nothing at all.' I have " +
      "slept in worse, and said so, which seemed to please him more than it ought to have.",
  ],
  [
    'casual diary entry',
    "ok so today was a mess. alarm didnt go off, missed the bus, had to walk half the way in the rain and my shoes " +
      "are STILL wet. work was fine i guess, mike was annoying about the spreadsheet again but whatever. came home, " +
      "ate leftover pasta standing up at the counter bc i couldnt be bothered to sit down. gonna try to sleep early " +
      "for once, we'll see how that goes lol",
  ],
  [
    'real-style email (mundane, a bit clumsy)',
    "Hey Dan, just following up on the invoice from last week, did that ever go through on your end? Accounts said " +
      "they hadn't seen it but I sent it Tuesday so not sure whats going on there. Also can we push the call to " +
      "Thursday, something came up with the kids school. Let me know either way, thanks. Sarah",
  ],
  [
    'forum/reddit-style post',
    "honestly i think people overrate this way too much. like yeah its fine but everyone acts like its the best " +
      "thing ever made and it's just... not? the middle third drags so bad. anyway not trying to start anything just " +
      "curious if anyone else felt this way or if im just missing something lol",
  ],
  [
    'lab notebook entry',
    "Ran the assay again at pH 7.2 instead of 7.0 per Priya's suggestion - yield up slightly but not enough to call " +
      "significant off n=3. Forgot to recalibrate the pipette before starting, which probably explains some of the " +
      "scatter in the second batch. Will redo Thursday with fresh reagent, current stock looks a bit off-colour.",
  ],
  [
    'text message / note',
    "hey running about 10 min late, traffic on the bridge is awful. can you grab a table if theres a wait? sorry!! " +
      "also did you end up hearing back about the apartment thing",
  ],
]

const AI_PROBES: Array<[string, string]> = [
  [
    'blog-style paragraph',
    "Choosing the right project management tool often comes down to a simple trade-off: flexibility versus " +
      "structure. Tools that offer extensive customization can adapt to almost any workflow, but that same " +
      "flexibility can overwhelm teams who just want a clear place to track tasks. The best approach is usually to " +
      "start with your team's actual habits, not the feature list, and work backward from there.",
  ],
  [
    'professional email',
    "Hi Priya, I hope this email finds you well. I wanted to follow up on our conversation from last week regarding " +
      "the Q3 roadmap. Based on the feedback from the engineering team, I believe we should prioritize the " +
      "onboarding improvements before tackling the new integrations. Please let me know if you'd like to discuss " +
      "this further, and I'm happy to set up a call at your convenience.",
  ],
  [
    'short explainer',
    "Caching works by storing a copy of frequently requested data somewhere faster to access than its original " +
      "source. When a request comes in, the system first checks whether a valid cached version already exists. If " +
      "it does, that copy is returned immediately, avoiding the cost of recomputing or refetching the data. This " +
      "simple idea underlies everything from browser caches to large-scale content delivery networks.",
  ],
  [
    'marketing copy',
    "Unlock your team's full potential with a platform built for speed, clarity, and collaboration. Whether you're " +
      "managing a small startup or scaling across departments, our tools adapt to your workflow, not the other way " +
      "around. Join thousands of teams who've already transformed the way they work, and experience the difference " +
      "for yourself today.",
  ],
  [
    'assistant-style answer',
    "Great question! There are a few key factors to consider here. First, think about your budget and how much " +
      "you're willing to invest upfront versus over time. Second, consider the learning curve involved, since some " +
      "options require more technical expertise than others. Finally, it's worth weighing long-term scalability, " +
      "particularly if you expect your needs to grow significantly in the next year or two.",
  ],
  [
    'LinkedIn-style post',
    "Excited to share that our team just wrapped up a major milestone this quarter! None of this would have been " +
      "possible without the incredible dedication of everyone involved. It's a great reminder that when people " +
      "align around a shared vision and support one another, truly remarkable things can happen. Looking forward to " +
      "building on this momentum in the months ahead.",
  ],
]

/* --------------------------------------------------------- avenue 1: classifier */

interface ClassifierCandidate {
  name: string
  repo: string
  aiLabel: string
  humanLabel: string
}

const CLASSIFIER_CANDIDATES: ClassifierCandidate[] = [
  {
    // New find this round: MIT-licensed, base prajjwal1/bert-tiny (2 layers,
    // 128 hidden, ~4.4M params), fine-tuned on RAID by ShantanuT01. Published
    // int8 onnx/model_int8.onnx. Its config.json declares a single output
    // label (id2label {"0": "LABEL_0"}, num_labels=1), i.e. a regression-
    // style single logit the model card describes as "the likelihood that
    // the text is human" (not a standard 2-class softmax) - untested whether
    // that shape even comes back sanely through Transformers.js's generic
    // text-classification pipeline, which is itself part of what this probe
    // is for.
    name: 'BERT-tiny-RAID',
    repo: 'onnx-community/BERT-tiny-RAID-ONNX',
    aiLabel: 'LABEL_1', // will fall back to 1-humanLabel if absent; see scoreOf
    humanLabel: 'LABEL_0',
  },
]

async function runClassifierCandidate(candidate: ClassifierCandidate, dtype: 'int8' | 'fp32') {
  console.log(`\n=== [classifier] ${candidate.name} (${candidate.repo}) dtype=${dtype} ===`)
  const start = Date.now()
  const classifier = await pipeline('text-classification', candidate.repo, {
    device: 'cpu',
    dtype,
  })
  console.log(`loaded in ${Date.now() - start}ms`)

  const scoreOf = async (text: string): Promise<{ score: number | null; raw: unknown }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = (await (classifier as any)(text, { top_k: null })) as Array<{ label: string; score: number }>
    const scores = Array.isArray(output[0]) ? (output[0] as unknown as Array<{ label: string; score: number }>) : output
    const aiScore = scores.find((s) => s.label === candidate.aiLabel)?.score ?? null
    const humanScore = scores.find((s) => s.label === candidate.humanLabel)?.score ?? null
    // This model's card says its single raw score IS "probability of human",
    // so if neither named label is present, treat the lone score as a human
    // probability (1 - that = ai probability), not the reverse.
    if (aiScore === null && humanScore === null && scores.length === 1) {
      return { score: 1 - scores[0].score, raw: scores }
    }
    return { score: aiScore ?? (humanScore !== null ? 1 - humanScore : null), raw: scores }
  }

  const humanScores: number[] = []
  for (const [label, text] of HUMAN_PROBES) {
    const { score, raw } = await scoreOf(text)
    humanScores.push(score ?? NaN)
    console.log(`  human  [${label.padEnd(38)}] aiProbability=${score?.toFixed(4) ?? 'null'} raw=${JSON.stringify(raw)}`)
  }

  const aiScores: number[] = []
  for (const [label, text] of AI_PROBES) {
    const { score, raw } = await scoreOf(text)
    aiScores.push(score ?? NaN)
    console.log(`  ai     [${label.padEnd(38)}] aiProbability=${score?.toFixed(4) ?? 'null'} raw=${JSON.stringify(raw)}`)
  }

  const humanCorrect = humanScores.filter((s) => s < 0.5).length
  const aiCorrect = aiScores.filter((s) => s >= 0.5).length
  const avgHuman = humanScores.reduce((a, b) => a + b, 0) / humanScores.length
  const avgAi = aiScores.reduce((a, b) => a + b, 0) / aiScores.length

  console.log(
    `  summary: human correctly-below-0.5 ${humanCorrect}/${humanScores.length}, ` +
      `ai correctly-above-0.5 ${aiCorrect}/${aiScores.length}, ` +
      `avg(human)=${avgHuman.toFixed(4)} avg(ai)=${avgAi.toFixed(4)} separation=${(avgAi - avgHuman).toFixed(4)}`,
  )
}

/* ------------------------------------------------------ avenue 2: generative judge */

interface GenerativeCandidate {
  name: string
  repo: string
  revision: string
  dtype: 'q4' | 'q4f16' | 'int8' | 'fp16'
}

// The two models already pinned for the rewrite engine (src/lib/rewrite/models.ts),
// at their already-pinned revisions/dtypes - the cheapest honest version of this
// avenue to test, since this app already pays their download/cache cost for Pro
// rewrite users.
const GENERATIVE_CANDIDATES: GenerativeCandidate[] = [
  {
    name: 'Qwen2.5-0.5B-Instruct (free-tier rewrite pin)',
    repo: 'onnx-community/Qwen2.5-0.5B-Instruct',
    revision: 'cc5cc01a65cc3ff17bdb73a7de33d879f62599b0',
    dtype: 'q4',
  },
  {
    name: 'Qwen2.5-1.5B-Instruct (pro-tier rewrite pin)',
    repo: 'onnx-community/Qwen2.5-1.5B-Instruct',
    revision: '6287331f475a3e20e8c879be8fd4bf3551ad9d34',
    dtype: 'q4',
  },
]

const JUDGE_SYSTEM_PROMPT =
  'You are a text-forensics classifier. Given a passage, decide whether it reads as written by an AI language ' +
  'model (like ChatGPT, Claude or Gemini) or by a human. Reply with ONLY a single-line JSON object of the exact ' +
  'shape {"verdict":"ai"|"human","confidence":0.0-1.0}. No other text, no markdown fences, no explanation.'

function buildJudgeMessages(text: string): Array<{ role: string; content: string }> {
  return [
    { role: 'system', content: JUDGE_SYSTEM_PROMPT },
    { role: 'user', content: `Passage:\n"""\n${text}\n"""` },
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

function tryParseVerdict(raw: string): { verdict: 'ai' | 'human'; confidence: number } | null {
  // Strip markdown code fences if the model added them anyway.
  const cleaned = raw.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    if ((parsed.verdict === 'ai' || parsed.verdict === 'human') && typeof parsed.confidence === 'number') {
      return { verdict: parsed.verdict, confidence: parsed.confidence }
    }
    return null
  } catch {
    return null
  }
}

async function runGenerativeCandidate(candidate: GenerativeCandidate) {
  console.log(`\n=== [generative judge] ${candidate.name} (${candidate.repo}) dtype=${candidate.dtype} ===`)
  const loadStart = Date.now()
  const generator = await pipeline('text-generation', candidate.repo, {
    revision: candidate.revision,
    device: 'cpu',
    dtype: candidate.dtype,
  })
  console.log(`loaded in ${Date.now() - loadStart}ms`)

  const allProbes: Array<['human' | 'ai', string, string]> = [
    ...HUMAN_PROBES.map(([label, text]) => ['human', label, text] as ['human' | 'ai', string, string]),
    ...AI_PROBES.map(([label, text]) => ['ai', label, text] as ['human' | 'ai', string, string]),
  ]

  let correct = 0
  let parseable = 0
  let totalLatencyMs = 0

  for (const [truth, label, text] of allProbes) {
    const messages = buildJudgeMessages(text)
    const start = Date.now()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = await (generator as any)(messages, {
      max_new_tokens: 40,
      do_sample: false,
      return_full_text: false,
    })
    const latency = Date.now() - start
    totalLatencyMs += latency
    const reply = extractReply(output)
    const parsed = tryParseVerdict(reply)
    if (parsed) parseable++
    const gotItRight = parsed?.verdict === truth
    if (gotItRight) correct++
    console.log(
      `  truth=${truth.padEnd(5)} [${label.padEnd(38)}] latency=${latency}ms reply=${JSON.stringify(reply).slice(0, 140)} ` +
        `parsed=${parsed ? JSON.stringify(parsed) : 'UNPARSEABLE'} ${gotItRight ? 'OK' : parsed ? 'WRONG' : ''}`,
    )
  }

  console.log(
    `  summary: correct ${correct}/${allProbes.length}, parseable ${parseable}/${allProbes.length}, ` +
      `avg latency ${(totalLatencyMs / allProbes.length).toFixed(0)}ms/probe`,
  )
}

/* -------------------------------------------------------------------- runner */

async function main() {
  console.log('########## AVENUE 1: purpose-built classifier ##########')
  for (const candidate of CLASSIFIER_CANDIDATES) {
    for (const dtype of ['int8', 'fp32'] as const) {
      try {
        await runClassifierCandidate(candidate, dtype)
      } catch (err) {
        console.log(`  FAILED to load/run ${candidate.name} at ${dtype}: ${(err as Error).message}`)
      }
    }
  }

  console.log('\n\n########## AVENUE 2: generative judge (small instruct model) ##########')
  for (const candidate of GENERATIVE_CANDIDATES) {
    try {
      await runGenerativeCandidate(candidate)
    } catch (err) {
      console.log(`  FAILED to load/run ${candidate.name}: ${(err as Error).message}`)
    }
  }
}

main().catch((err) => {
  console.error('Probe crashed:', err)
  process.exit(1)
})
