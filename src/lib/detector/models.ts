/**
 * The detector's model registry.
 *
 * Every other channel in this detector (watermark, distributional, ai-likelihood
 * in ./ai-likelihood.ts) is deterministic arithmetic: no model, no download. This
 * is the one channel that is a genuine trained classifier, run entirely
 * on-device via Transformers.js (see ./ml-classifier.ts), the same library
 * already used for the rewrite engine's local model
 * (src/lib/rewrite/models.ts). Pinned to an exact repo id and commit revision,
 * the same pin-don't-trust-a-moving-target discipline used there and for
 * detection keys in ./keys.ts, so an upstream change to the named repo can
 * never silently change what a deployed build downloads and runs.
 *
 * Model: onnx-community/roberta-base-openai-detector-ONNX, an ONNX conversion
 * of openai-community/roberta-base-openai-detector, MIT-licensed. OpenAI's own
 * RoBERTa-base (125M parameter) classifier, released alongside GPT-2, fine-tuned
 * to separate GPT-2 (1.5B, top-k 40) output from human WebText. OpenAI reports
 * approximately 95% accuracy on that task and cautions it may be less reliable
 * on text from other or newer generators (including ChatGPT-era models); this
 * channel's own copy repeats that caution rather than a stronger claim the
 * model was never evaluated against.
 *
 * A different model, onnx-community/tmr-ai-text-detector-ONNX, was pinned here
 * before this revision on the strength of its published RAID-benchmark numbers
 * (99.28% AUROC), but produced degenerate output through this exact loading
 * path: six varied hand-written probes spanning an 1813 novel excerpt, a casual
 * diary entry and a real short email were all scored 90-99% "ai" regardless of
 * dtype (int8, fp32, q8), i.e. it did not discriminate at all in this pipeline.
 * The current pin was chosen after the same probe set, plus a second
 * HC3-trained ChatGPT detector, both ran cleanly through this loader: the
 * OpenAI detector discriminated correctly on every probe under both fp32 and
 * int8, while the HC3 model misclassified the diary entry once quantized to
 * int8 (this repo's shipped default) and carries no stated license. Repeat that
 * probe before ever changing this pin again; a model's published benchmark
 * number is not evidence it behaves correctly through this specific loader.
 */

import type { PinnedModel } from '../rewrite/models'

export const DETECTOR_MODEL: PinnedModel = {
  repo: 'onnx-community/roberta-base-openai-detector-ONNX',
  // Verified reachable at pin time (2026-09-10) via the Hugging Face Hub API:
  // RobertaForSequenceClassification, id2label {0: "Real", 1: "Fake"}, MIT license.
  revision: '54895bd11f34b47a01369d25b2255224717409b8',
}

/**
 * This repo's own label text for its two classes (its config.json id2label),
 * mapped to the app's stable 'human' / 'ai' vocabulary. Every candidate model
 * probed for this channel used different label strings ("human"/"ai",
 * "Real"/"Fake", "Human"/"ChatGPT"), so this indirection is the one place a
 * future re-pin has to touch instead of every call site that reads a score.
 */
export const DETECTOR_MODEL_LABELS = { ai: 'Fake', human: 'Real' } as const

/** Languages this classifier is trusted to run on: it was trained and evaluated on English only. */
export const DETECTOR_MODEL_LANGUAGES = ['en'] as const
