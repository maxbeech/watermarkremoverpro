/**
 * Manual, one-off vetting probe for a SECOND on-device AI-text-detection model
 * (to sit alongside DETECTOR_MODEL in src/lib/detector/models.ts, whose own
 * doc comment records this exact methodology and its own probe history).
 *
 * NOT part of `npm test`: it downloads real model weights (tens to low
 * hundreds of MB per candidate) and runs real inference, so it isn't a
 * tolerance-free CI gate. Run manually:
 *
 *   npx tsx scripts/probe-secondary-detector.mts
 *
 * Why this exists: the pinned RoBERTa-base-openai-detector (GPT-2 era) is
 * known to score confidently "human" on text from modern (2025/2026-era
 * GPT-4o/GPT-5-class, Claude, Gemini 2.5+) generators. That blind spot is
 * the entire reason to look for a second channel. A high published benchmark
 * number (RAID AUROC, whatever) is NOT evidence a model behaves correctly
 * through this specific Transformers.js loading path: the existing pin's
 * comment documents a model with 99.28% published AUROC that scored every
 * one of six varied human probes as 90-99% "ai" once actually loaded here.
 * So every candidate below is run through the *exact* pipeline() call shape
 * ml-classifier.ts uses, at both dtype 'int8' (what would ship) and 'fp32'
 * (sanity check), against a probe set spanning genuine human writing and
 * genuine modern-LLM writing across several registers.
 *
 * Candidates tried (see the research trail in the PR/commit this script
 * shipped with for the full list of rejected leads): tmr-ai-text-detector-ONNX
 * (already known to fail, not re-attempted), houtini-ai/ai-detect's DeBERTa
 * (desklib/ai-text-detector-v1.01, 1.74GB safetensors, no ONNX export at any
 * commit checked), nicoamoretti/roberta-openai-detector-onnx (literally the
 * same base weights as the model already pinned), onnx-community/chatgpt-
 * detector-roberta-ONNX (Hello-SimpleAI/chatgpt-detector-roberta, HC3, no
 * stated license), SuperAnnotate/ai-detector (SAIPL, non-permissive),
 * diwank/ai-detector (MIT but DeBERTa-v3-large fp32-only, no ONNX),
 * Joshfcooper/ai-text-detector-optimized (Apache-2.0 but a bespoke mean-
 * pooled-hidden-states + external linear-classifier head, not a standard
 * AutoModelForSequenceClassification export, so it cannot run through the
 * shared `pipeline('text-classification', ...)` primitive at all, and its
 * ONNX file is 441MB regardless), Lynote/fakespot-ai-roberta-base-ai-text-
 * detection-v1-browser (Apache-2.0, clean id2label, but ships fp32 only:
 * 499MB, no quantized export)):
 *
 *   - onnx-community/e5-small-lora-ai-generated-detector-ONNX (MIT; base
 *     intfloat/e5-small fine-tuned with LoRA by MayZhou; 33.4M params;
 *     int8 onnx/model_int8.onnx is 34MB; id2label 0=human/1=ai; trained on
 *     RAID-train plus a GPT-4o-mini rewrite set)
 *   - onnx-community/modernbert-ai-detection-raid-mage-ONNX (Apache-2.0;
 *     base GeorgeDrayson/modernbert-ai-detection-raid-mage, itself a
 *     fine-tune of answerdotai/ModernBERT-base; ~150M params; int8
 *     onnx/model_int8.onnx is 150MB; no id2label in config.json, so labels
 *     are the Transformers.js default LABEL_0/LABEL_1, confirmed from the
 *     upstream model card's own usage snippet that index 1 is the
 *     machine-generated probability; trained on RAID + MAGE)
 *
 * RESULT (2026-09-14): both candidates FAILED and neither was integrated.
 * No change was made to models.ts / ml-classifier.ts / use-ml-classifier.ts /
 * workspace-app.tsx.
 *
 *   - modernbert-ai-detection-raid-mage: quantization-unstable, which is
 *     exactly the failure mode this project already treats as disqualifying
 *     (see the HC3 model in models.ts's own comment). Under int8 it got 3/6
 *     human probes wrong (old prose 0.83, real email 0.71, forum post 0.92)
 *     but all 6 AI probes right. Under fp32 the human failures mostly
 *     resolved (5/6 right) but it then missed an AI probe it had caught
 *     under int8 (blog-style paragraph dropped from 0.75 to 0.27, i.e.
 *     flipped to confidently "human"). A model that disagrees with itself
 *     across dtype on which class a given text is isn't trustworthy at
 *     either dtype.
 *   - e5-small-lora-ai-generated-detector: consistent across dtype (unlike
 *     the above) and caught 6/6 of the AI probes at both int8 and fp32,
 *     genuinely solving the "misses modern-generator text" problem the
 *     pinned model has. But it has a severe human false-positive problem:
 *     of the 6 original human probes it missed 2 (old prose 0.66, a short
 *     text message 0.79); a follow-up batch of 6 more human probes in a
 *     different, more formal register (a business report excerpt, recipe
 *     instructions, a complaint letter, a personal blog post, a second
 *     short text, a cover-letter excerpt) missed 5 of 6, all scored
 *     0.73-0.85 "ai". Combined: 7 of 12 varied human probes (58%)
 *     misclassified as AI, with the failures concentrated on anything
 *     written in a formal or structured register: exactly the writing this
 *     product's own users (a memo, a cover letter, a business email) most
 *     need judged correctly. That failure rate is worse than merely "not
 *     convincing": it would flag a majority of certain kinds of ordinary
 *     human writing as AI, and is not shippable as a signal next to a
 *     primary channel whose whole comment insists on 6/6 correctness on
 *     both dtypes before trusting a pin.
 *
 * A third lead, amrita-detectly/detect-ai-text-v1 (MIT, DistilBERT-base,
 * 67MB quantized, clean id2label 0=human/1=AI), was found but never even
 * reached the probe set: it ships only `onnx/model_quantized.onnx`, a
 * filename Transformers.js's dtype-to-filename convention doesn't resolve
 * under any of 'int8' / 'quantized' / 'fp32' / unset, so it is not loadable
 * through the exact `pipeline('text-classification', repo, {dtype})` shape
 * ml-classifier.ts uses without a bespoke file-name override, so it does not
 * fit "generalize the loader minimally" and was dropped without a fairness
 * verdict on its actual detection quality.
 */
import { pipeline, env as tjsEnv } from '@huggingface/transformers'
import os from 'node:os'
import path from 'node:path'

tjsEnv.cacheDir = path.join(os.homedir(), '.cache', 'watermarkremoverpro', 'models')

interface Candidate {
  name: string
  repo: string
  /** Label string (or default LABEL_i) the model itself reports for the "ai" class. */
  aiLabel: string
  /** Label string (or default LABEL_i) the model itself reports for the "human" class. */
  humanLabel: string
}

const CANDIDATES: Candidate[] = [
  {
    name: 'e5-small-lora-ai-generated-detector',
    repo: 'onnx-community/e5-small-lora-ai-generated-detector-ONNX',
    aiLabel: 'LABEL_1',
    humanLabel: 'LABEL_0',
  },
  {
    name: 'modernbert-ai-detection-raid-mage',
    repo: 'onnx-community/modernbert-ai-detection-raid-mage-ONNX',
    aiLabel: 'LABEL_1',
    humanLabel: 'LABEL_0',
  },
]

/* ---------------------------------------------------------------- probe set */

// Six genuine (freshly hand-written for this probe, not reused from any other
// comment) human samples, spanning registers.
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

// Six representative samples of current-generation (2025/2026-era GPT-4o/
// GPT-5-class, Claude, Gemini 2.5+) LLM output, spanning registers. Written by
// hand to be genuinely representative fluent AI prose, not a caricature of it.
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

/* -------------------------------------------------------------------- runner */

async function runCandidate(candidate: Candidate, dtype: 'int8' | 'fp32') {
  console.log(`\n=== ${candidate.name} (${candidate.repo}) dtype=${dtype} ===`)
  const start = Date.now()
  // Exactly the call shape ml-classifier.ts's getClassifier() uses.
  const classifier = await pipeline('text-classification', candidate.repo, {
    device: 'cpu',
    dtype,
  })
  console.log(`loaded in ${Date.now() - start}ms`)

  const scoreOf = async (text: string): Promise<number | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = (await (classifier as any)(text, { top_k: null })) as Array<{ label: string; score: number }>
    const scores = Array.isArray(output[0]) ? (output[0] as unknown as Array<{ label: string; score: number }>) : output
    const aiScore = scores.find((s) => s.label === candidate.aiLabel)?.score ?? null
    const humanScore = scores.find((s) => s.label === candidate.humanLabel)?.score ?? null
    return aiScore ?? (humanScore !== null ? 1 - humanScore : null)
  }

  const humanScores: number[] = []
  for (const [label, text] of HUMAN_PROBES) {
    const score = await scoreOf(text)
    humanScores.push(score ?? NaN)
    console.log(`  human  [${label.padEnd(38)}] aiProbability=${score?.toFixed(4) ?? 'null'}`)
  }

  const aiScores: number[] = []
  for (const [label, text] of AI_PROBES) {
    const score = await scoreOf(text)
    aiScores.push(score ?? NaN)
    console.log(`  ai     [${label.padEnd(38)}] aiProbability=${score?.toFixed(4) ?? 'null'}`)
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

  return { humanCorrect, aiCorrect, avgHuman, avgAi }
}

async function main() {
  for (const candidate of CANDIDATES) {
    for (const dtype of ['int8', 'fp32'] as const) {
      try {
        await runCandidate(candidate, dtype)
      } catch (err) {
        console.log(`  FAILED to load/run ${candidate.name} at ${dtype}: ${(err as Error).message}`)
      }
    }
  }
}

main().catch((err) => {
  console.error('Probe crashed:', err)
  process.exit(1)
})
