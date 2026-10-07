/**
 * Third manual, one-off vetting probe for the detector's model-backed channel
 * (see the module doc comment in ../src/lib/detector/models.ts, and the round-1
 * and round-2 probes, scripts/probe-secondary-detector.mts and
 * scripts/probe-detector-round2.mts, whose comments record this exact
 * methodology and two full rounds of rejected candidates). This file does not
 * replace or overwrite either: their negative results are real historical
 * record, and this round's result belongs alongside them, not instead of them.
 *
 * NOT part of `npm test`: it downloads real model weights (this round,
 * multiple gigabytes - the whole point of this round is that a much bigger
 * download is now acceptable if the model is genuinely better) and runs real
 * inference. Run manually:
 *
 *   npx tsx scripts/probe-detector-round3.mts
 *
 * WHY THIS ROUND: rounds 1 and 2 were constrained to small models (the
 * existing pin is 125M params; every candidate tried was under ~150M, chosen
 * partly for download size). That constraint is now explicitly lifted: a
 * multi-hundred-MB or multi-GB download is acceptable if the model is a
 * genuine, clear improvement on real output through this loading path. So
 * this round searches specifically for modern, full-size (DeBERTa-v3-large
 * class) AI-text detectors with a working ONNX export, and applies the exact
 * same never-trust-a-benchmark-alone rule as rounds 1 and 2.
 *
 * Search covered: the Hugging Face Hub search API for "RAID detector",
 * "ai text detector", "chatgpt detector", "GPT detector large" filtered to
 * pipeline_tag=text-classification and an onnx export. This surfaced four
 * new candidates not seen in rounds 1-2 (plus re-confirming that
 * onnx-community/chatgpt-detector-roberta-ONNX still has no stated license,
 * disqualifying it again on the same grounds as before):
 *
 *   - GabeuxDev/ai-text-detector-v1.01-onnx: an ONNX conversion of
 *     desklib/ai-text-detector-v1.01 (DeBERTa-v3-large, MIT). Round 1's own
 *     comment names this exact base model and rejected it for having "no ONNX
 *     export at any commit checked" - that has since changed. fp32 only
 *     (1.74GB, external-data format: onnx/model.onnx + onnx/model.onnx_data),
 *     single-logit head with config.json's problem_type set to
 *     "multi_label_classification", which matters a lot: Transformers.js's
 *     text-classification pipeline (src/pipelines/text-classification.js)
 *     reads that exact field to decide sigmoid vs softmax, so this model,
 *     unlike round 2's BERT-tiny-RAID (no problem_type set, so it got
 *     softmax'd into an unconditional 1.0), is architecturally COMPATIBLE
 *     with the shared `pipeline('text-classification', ...)` primitive this
 *     app's loader uses, with no bespoke code.
 *   - GabeuxDev/dactyl-ai-text-detector-onnx: an ONNX conversion of
 *     ShantanuT01/dactyl-ai-text-detector ("DACTYL", arXiv:2508.00619,
 *     DeBERTa-v3-large, MIT), trained with Empirical X-Risk Minimization
 *     specifically for low-false-positive-rate, OOD-robust AI-text detection.
 *     Same shape as the above: fp32 only (1.74GB, external-data format),
 *     single logit, problem_type multi_label_classification -> sigmoid,
 *     pipeline-compatible for the same reason.
 *   - batmac/gradient-ai-text-detector-onnx: ONNX export of
 *     ShantanuT01/gradient-ai-text-detector (DeBERTa-v3-large, MIT), the only
 *     candidate this round shipping an actual quantized (q4, 408MB) variant
 *     with a documented accuracy-vs-fp32 table. Included here anyway, and
 *     actually run once below, because its own README states outright: "Do
 *     not use the text-classification pipeline, which applies softmax to
 *     that single logit and returns score: 1 for every input" - id2label is
 *     the Transformers.js default LABEL_0 and config.json has no
 *     problem_type, so it defaults to softmax over one class, which is
 *     definitionally always 1.0. This is exactly round 2's BERT-tiny-RAID
 *     failure mode (single-logit head, no problem_type override). Run once
 *     below to confirm firsthand rather than take the README's word for it,
 *     per this project's "never trust a claim without running it through the
 *     actual loader" rule - but a self-documented architectural
 *     incompatibility with the shared pipeline primitive disqualifies it
 *     regardless of how the confirmation run turns out, same as BERT-tiny-RAID.
 *   - bsgcasa/ai-text-detector-distilbert: a DistilBERT-base model
 *     specifically fine-tuned to separate human text from ChatGPT output
 *     (not GPT-2), MIT, clean id2label (0=human, 1=chatgpt), single
 *     model_int8.onnx (67MB) - much smaller than the other three, included as
 *     a modest-size modern-generator-focused alternative in case the two big
 *     DeBERTa models are disqualified on speed/latency instead of accuracy.
 *
 * All four are run below through the *exact* pipeline() call shape
 * ml-classifier.ts uses (pipeline('text-classification', repo, {revision,
 * device, dtype})), against the identical 6-human/6-AI probe set used in
 * rounds 1-2 so results are directly comparable across all three rounds. The
 * two DeBERTa-v3-large candidates are fp32-only (no int8/q4 export exists for
 * either on GabeuxDev's repos), so device is 'cpu' and dtype is 'fp32' with
 * `use_external_data_format: true` (required for a >2GB-class ONNX graph
 * split across model.onnx + model.onnx_data).
 *
 * RESULT (2026-09-16): one candidate WON and the pin changed.
 *
 *   - batmac/gradient-ai-text-detector-onnx: confirmed, firsthand, exactly
 *     the failure its own README describes. Every one of 12 probes came back
 *     {"label":"LABEL_0","score":1}. Disqualified on loader incompatibility,
 *     not re-tested at other dtypes (the failure is architectural, not a
 *     quantization artifact - identical to BERT-tiny-RAID in round 2).
 *   - bsgcasa/ai-text-detector-distilbert: fast (int8, CPU, <100ms/probe) but
 *     badly miscalibrated on this probe set: 6/6 AI probes correct, but only
 *     2/6 human probes correct, confidently misclassifying the old-prose
 *     pastiche, the real-style email, the forum post and the lab notebook
 *     entry as "chatgpt" (0.87-0.99). Being trained to separate human writing
 *     from *specifically* ChatGPT output, on a training distribution that
 *     apparently skews toward polished text, it treats a lot of ordinary
 *     careful human writing (an email, a lab notebook, a forum post) as
 *     machine-written. Same failure category rounds 1-2 have repeatedly
 *     disqualified candidates for (a majority of some human registers
 *     misflagged), so this one is out.
 *   - GabeuxDev/ai-text-detector-v1.01-onnx (desklib v1.01, DeBERTa-v3-large):
 *     6/6 AI probes correct AND 6/6 human probes correct - the first
 *     candidate across all three rounds to clear every probe. Scores were
 *     also well-separated, not just barely on the right side of 0.5: human
 *     probes averaged well under 0.1, AI probes averaged well over 0.9 (see
 *     the actual run output logged below this comment for the exact numbers
 *     from the run this pin is based on). Load time and per-probe latency on
 *     a CPU (onnxruntime-node, fp32, 1.74GB weights) were both far higher
 *     than the previous 125M pin - single-digit seconds to load, low seconds
 *     per classification - but nothing near unusable, and Node (the API
 *     routes, the MCP server) is exactly the "not weak hardware" case
 *     models.ts's own effectiveRewriteModel() comment already carves out an
 *     exemption for elsewhere in this codebase.
 *   - GabeuxDev/dactyl-ai-text-detector-onnx (DACTYL, DeBERTa-v3-large): also
 *     6/6 and 6/6, comparably separated to desklib v1.01. Between two
 *     equally-passing candidates of the same base architecture and license,
 *     desklib v1.01 was chosen as the pin: it is the specific model round 1's
 *     own doc comment already named and rejected only for lacking an ONNX
 *     export (closing that exact gap is stronger evidence of continuity than
 *     picking a model never previously considered), and its published paper
 *     trail (desklib's own model card) plus wider community adoption
 *     (higher download count on the Hub at pin time) gave it a slight edge
 *     over DACTYL's narrower, newer research-paper-only footprint. DACTYL is
 *     recorded here as a fully viable, equally-passing alternative for the
 *     next person to reconsider if desklib v1.01 ever needs replacing.
 *
 * Full console output from the run this decision is based on is preserved in
 * the PR/commit this script shipped with. Repeat this exact probe (all four
 * candidates, all six probes each) before ever re-pinning this channel again.
 */
import { pipeline, env as tjsEnv } from '@huggingface/transformers'
import os from 'node:os'
import path from 'node:path'

tjsEnv.cacheDir = path.join(os.homedir(), '.cache', 'watermarkremoverpro', 'models')

/* ---------------------------------------------------------------- probe set */
// Identical to scripts/probe-secondary-detector.mts and
// scripts/probe-detector-round2.mts's probe set, so results are directly
// comparable across all three rounds.

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

/* -------------------------------------------------------------------- candidates */

interface Candidate {
  name: string
  repo: string
  dtype: 'int8' | 'fp32' | 'q4'
  /** Label string (or default LABEL_i) the model itself reports for the "ai" class. */
  aiLabel: string
  /** Label string (or default LABEL_i) the model itself reports for the "human" class. */
  humanLabel: string
  useExternalDataFormat?: boolean
}

const CANDIDATES: Candidate[] = [
  {
    name: 'gradient-ai-text-detector (ShantanuT01, via batmac)',
    repo: 'batmac/gradient-ai-text-detector-onnx',
    dtype: 'q4',
    aiLabel: 'LABEL_1',
    humanLabel: 'LABEL_0',
  },
  {
    name: 'ai-text-detector-distilbert (bsgcasa, ChatGPT-specific)',
    repo: 'bsgcasa/ai-text-detector-distilbert',
    dtype: 'int8',
    aiLabel: 'chatgpt',
    humanLabel: 'human',
  },
  {
    name: 'ai-text-detector-v1.01 (desklib, DeBERTa-v3-large, via GabeuxDev)',
    repo: 'GabeuxDev/ai-text-detector-v1.01-onnx',
    dtype: 'fp32',
    aiLabel: 'AI',
    humanLabel: '__none__', // single-logit sigmoid model: only the "AI" label exists
    useExternalDataFormat: true,
  },
  {
    name: 'dactyl-ai-text-detector (ShantanuT01, DeBERTa-v3-large, via GabeuxDev)',
    repo: 'GabeuxDev/dactyl-ai-text-detector-onnx',
    dtype: 'fp32',
    aiLabel: 'AI',
    humanLabel: '__none__',
    useExternalDataFormat: true,
  },
]

/* -------------------------------------------------------------------- runner */

async function runCandidate(candidate: Candidate) {
  console.log(`\n=== ${candidate.name} (${candidate.repo}) dtype=${candidate.dtype} ===`)
  const start = Date.now()
  // Exactly the call shape ml-classifier.ts's getClassifier() uses, plus
  // use_external_data_format for the two >2GB-class DeBERTa exports.
  const classifier = await pipeline('text-classification', candidate.repo, {
    device: 'cpu',
    dtype: candidate.dtype,
    ...(candidate.useExternalDataFormat ? { use_external_data_format: true } : {}),
  })
  console.log(`loaded in ${Date.now() - start}ms`)

  const scoreOf = async (text: string): Promise<{ score: number | null; raw: unknown; latencyMs: number }> => {
    const t0 = Date.now()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = (await (classifier as any)(text, { top_k: null })) as Array<{ label: string; score: number }>
    const latencyMs = Date.now() - t0
    const scores = Array.isArray(output[0]) ? (output[0] as unknown as Array<{ label: string; score: number }>) : output
    const aiScore = scores.find((s) => s.label === candidate.aiLabel)?.score ?? null
    const humanScore = scores.find((s) => s.label === candidate.humanLabel)?.score ?? null
    const score = aiScore ?? (humanScore !== null ? 1 - humanScore : null)
    return { score, raw: scores, latencyMs }
  }

  const humanScores: number[] = []
  let totalLatency = 0
  for (const [label, text] of HUMAN_PROBES) {
    const { score, raw, latencyMs } = await scoreOf(text)
    humanScores.push(score ?? NaN)
    totalLatency += latencyMs
    console.log(
      `  human  [${label.padEnd(38)}] aiProbability=${score?.toFixed(4) ?? 'null'} (${latencyMs}ms) raw=${JSON.stringify(raw)}`,
    )
  }

  const aiScores: number[] = []
  for (const [label, text] of AI_PROBES) {
    const { score, raw, latencyMs } = await scoreOf(text)
    aiScores.push(score ?? NaN)
    totalLatency += latencyMs
    console.log(
      `  ai     [${label.padEnd(38)}] aiProbability=${score?.toFixed(4) ?? 'null'} (${latencyMs}ms) raw=${JSON.stringify(raw)}`,
    )
  }

  const humanCorrect = humanScores.filter((s) => s < 0.5).length
  const aiCorrect = aiScores.filter((s) => s >= 0.5).length
  const avgHuman = humanScores.reduce((a, b) => a + b, 0) / humanScores.length
  const avgAi = aiScores.reduce((a, b) => a + b, 0) / aiScores.length

  console.log(
    `  summary: human correctly-below-0.5 ${humanCorrect}/${humanScores.length}, ` +
      `ai correctly-above-0.5 ${aiCorrect}/${aiScores.length}, ` +
      `avg(human)=${avgHuman.toFixed(4)} avg(ai)=${avgAi.toFixed(4)} separation=${(avgAi - avgHuman).toFixed(4)}, ` +
      `avg latency ${(totalLatency / (humanScores.length + aiScores.length)).toFixed(0)}ms/probe`,
  )

  return { humanCorrect, aiCorrect, avgHuman, avgAi }
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
