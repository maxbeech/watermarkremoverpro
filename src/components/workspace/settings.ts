import type { Strength } from '@/lib/rewrite'

/**
 * The rewrite controls, defined once.
 *
 * Both the homepage workspace and the settings sheet render from these arrays,
 * and the copy here is the only copy: a label that appears in the picker and a
 * different one in the summary line is how a control ends up meaning two
 * things to the same person.
 */

export const STRENGTH_OPTIONS: { value: Strength; label: string; description: string }[] = [
  {
    value: 'preserve',
    label: 'Light',
    description: 'Only touches passages a real check would flag as a finding.',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Also touches passages with a notable but uncorrected signal.',
  },
  {
    value: 'aggressive',
    label: 'Strong',
    description: 'Touches any passage the detector could measure at all.',
  },
  {
    value: 'regenerate',
    label: 'Rewrite all',
    description: 'Rewrites every passage, regardless of measured evidence.',
  },
]

export const DEFAULT_STRENGTH: Strength = 'balanced'

/**
 * The two engines, as a visitor experiences them.
 *
 * This collapses what used to be two separate menus, a "model tier" and a
 * "rewrite engine", that could be set to contradictory combinations. There is
 * one choice now, and it is the choice that actually changes the output.
 */
export type EngineId = 'standard' | 'pro'

export const ENGINES: {
  id: EngineId
  label: string
  short: string
  description: string
}[] = [
  {
    id: 'standard',
    label: 'Standard',
    short: 'Instant, no download',
    description:
      'Deterministic substitution against the core AI-tell library. Runs immediately, needs no download, and is unlimited on every plan.',
  },
  {
    id: 'pro',
    label: 'Pro',
    short: 'A real local model',
    description:
      'A small language model that downloads once from the Hugging Face CDN and runs in your browser on WebGPU, plus the extended AI-tell library and more candidate rewrites per passage. Slower on the first run while the weights download.',
  },
]

export const engine = (id: EngineId) => ENGINES.find((e) => e.id === id) ?? ENGINES[0]
