/**
 * Which rewrite engine runs, and why.
 *
 * Pure and isomorphic: it takes a request and a fact about the machine, and
 * returns a decision plus the sentence explaining it. Every surface that
 * chooses an engine calls this, so the MCP tool, the CLI and anything built on
 * the package cannot answer the question differently.
 *
 * There are two engines, both entirely on-device:
 *
 *   standard  the deterministic rule-based pass. Instant, no download, always
 *             available. It varies wording; it cannot restructure a sentence.
 *   advanced  a real small language model (Qwen2.5) run in this process. It
 *             produces genuinely different sentences, which is what the
 *             heavier strengths need, at the cost of a one-time download of
 *             the weights and a slower run.
 *
 * The default is `auto`, and auto is the whole point of this module. Making
 * `advanced` the flat default would stall a first call behind a several
 * hundred megabyte download nobody asked for. Making `standard` the flat
 * default, which is what shipped before, meant a machine that had ALREADY
 * downloaded the model kept getting the weaker engine unless the caller
 * remembered to name the better one. Auto resolves that with the only fact
 * that matters: are the weights already here.
 *
 * Whatever it decides, `reason` is populated and every caller reports it. A
 * caller can always see which engine ran and what made that happen.
 */

export type ModelChoice = 'auto' | 'standard' | 'advanced'

export const MODEL_CHOICES: ModelChoice[] = ['auto', 'standard', 'advanced']

export const DEFAULT_MODEL_CHOICE: ModelChoice = 'auto'

export const isModelChoice = (value: unknown): value is ModelChoice =>
  typeof value === 'string' && (MODEL_CHOICES as string[]).includes(value)

export interface EngineChoiceInput {
  requested: ModelChoice
  /** Whether the pinned local model's weights are already in this machine's cache. */
  modelCached: boolean
  /** Where those weights live, so the reason can name a real path. */
  cacheDir: string
}

export interface EngineChoice {
  engine: 'standard' | 'advanced'
  requested: ModelChoice
  reason: string
}

export function decideRewriteEngine({ requested, modelCached, cacheDir }: EngineChoiceInput): EngineChoice {
  if (requested === 'standard') {
    return {
      engine: 'standard',
      requested,
      reason:
        'The deterministic engine was requested by name. It runs instantly, downloads nothing, and varies wording rather than restructuring sentences.',
    }
  }

  if (requested === 'advanced') {
    return {
      engine: 'advanced',
      requested,
      reason: modelCached
        ? `The local model was requested by name and its weights are already cached under ${cacheDir}.`
        : `The local model was requested by name and its weights are not cached yet, so this call downloads them to ${cacheDir} first. Later calls reuse them.`,
    }
  }

  return modelCached
    ? {
        engine: 'advanced',
        requested,
        reason: `The local model's weights are already cached under ${cacheDir}, so this ran on the local model rather than the deterministic engine.`,
      }
    : {
        engine: 'standard',
        requested,
        reason:
          `The local model's weights are not in ${cacheDir} yet, so this ran on the deterministic engine rather than stalling the call behind a download nobody asked for. ` +
          'Pass model "advanced" once to fetch them; after that every call defaults to the local model.',
      }
}

/**
 * The engine choice a caller that names none gets, read from configuration.
 *
 * An unrecognised value throws rather than being ignored. A machine configured
 * to always use the local model, running the deterministic one because of a
 * typo, is exactly the quiet wrong answer this product refuses elsewhere.
 */
export function configuredModelChoice(
  raw: string | undefined,
  variableName: string,
): ModelChoice {
  if (typeof raw !== 'string' || raw.trim().length === 0) return DEFAULT_MODEL_CHOICE
  const value = raw.trim().toLowerCase()
  if (!isModelChoice(value)) {
    throw new Error(`${variableName} is "${raw}"; it must be one of: ${MODEL_CHOICES.join(', ')}.`)
  }
  return value
}
