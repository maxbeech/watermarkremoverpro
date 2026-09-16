/**
 * Combines this detector's independent channels into the headline figures.
 *
 * Every other part of this detector keeps its channels deliberately separate
 * (see the module doc comments on ai-likelihood.ts, watermark.ts and
 * ml-classifier.ts): they measure different things and can be wrong in
 * different ways, so folding them into one number too early would hide a
 * disagreement worth seeing. But showing only ONE of them as "the" headline
 * has its own failure mode, and a real one: AI-generated text that the
 * trained classifier alone happened to score near 0% while the heuristic
 * surface-signal channel was already sitting at 17% read, to a user glancing
 * at a single number, as "our system thinks this is human". It wasn't; one
 * channel just missed it.
 *
 * A noisy-OR combination ("how likely is it that AT LEAST ONE of these
 * independent tests would flag this") fixes that without fabricating
 * anything: a document with nothing measured above zero anywhere stays at
 * zero, and a document even one confident channel flags can no longer hide
 * behind the others' silence. Every input is `number | null`, meaning "not
 * measured", and an unmeasured channel is simply excluded from the
 * combination rather than treated as "measured and found nothing" (which
 * would silently pull the composite down). The result is `null` only when
 * every channel offered to it came back null too.
 */

export interface CompositeInputs {
  /** The trained on-device classifier's P(ai), 0-1. Null when not yet scored, unsupported for this language, or errored. */
  modelProbability: number | null
  /** The heuristic surface-signal score, 0-100 (see ai-likelihood.ts). Null when there was too little text to score. */
  heuristicScore: number | null
  /** Best watermark z-score across every key this deployment tested, for this document. Null when not testable. */
  watermarkZ: number | null
}

/**
 * Converts a watermark z-score into a bounded 0-100 "an automated detector
 * holding this key would flag this" figure, on the same asymptotic curve
 * `saturate()` in ai-likelihood.ts already uses for the same reason: rises
 * fastest near zero rather than needing a large z before anything moves, and
 * never claims more than 100. z at or below zero (no evidence at all, or a
 * deviation in the wrong direction) reads as a flat 0, not a small positive
 * number a monotonic curve would otherwise produce.
 */
export function watermarkDetectorScore(z: number | null): number | null {
  if (z === null) return null
  if (z <= 0) return 0
  return Math.round(Math.min(100, 100 * (1 - Math.exp(-z / 3))))
}

/**
 * "How likely is it that at least one of these independent tests would flag
 * this", given each test's own probability of flagging it. Channels that were
 * not measured (`null`) are left out of the combination entirely: they
 * neither raise nor lower the result. `null` only when the list is empty of
 * anything measured.
 */
function noisyOr(scores: Array<number | null>): number | null {
  const measured = scores.filter((s): s is number => s !== null)
  if (measured.length === 0) return null
  const product = measured.reduce((acc, s) => acc * (1 - Math.min(100, Math.max(0, s)) / 100), 1)
  return Math.round(100 * (1 - product))
}

/**
 * Figure: "reads as AI to an AI detector". Combines the trained classifier
 * (a real detector, run on this device) with the watermark evidence this
 * deployment can actually test for, since both represent what an automated
 * system, rather than a human reader, would notice. Deliberately excludes the
 * heuristic surface-signal channel, which models what a human reader would
 * notice, not a detector (see humanLikelihood's caller in analysis-panel.tsx:
 * the heuristic score is shown as its own separate figure for exactly that
 * reason). Null only when neither the classifier nor the watermark test
 * produced anything for this document.
 */
export function detectorLikelihood(
  inputs: Pick<CompositeInputs, 'modelProbability' | 'watermarkZ'>,
): number | null {
  const modelPct = inputs.modelProbability === null ? null : Math.round(inputs.modelProbability * 100)
  return noisyOr([modelPct, watermarkDetectorScore(inputs.watermarkZ)])
}

/**
 * Figure: "overall AI likelihood", the accumulation of every channel this
 * detector ran on this document, not any single one of them alone. This is
 * the headline. Null only when nothing at all was measured (an empty or
 * unscoreable document).
 */
export function overallLikelihood(inputs: CompositeInputs): number | null {
  const modelPct = inputs.modelProbability === null ? null : Math.round(inputs.modelProbability * 100)
  return noisyOr([modelPct, inputs.heuristicScore, watermarkDetectorScore(inputs.watermarkZ)])
}
