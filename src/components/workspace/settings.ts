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
 * Optional word-change target, as a share of the original words.
 *
 * Text watermarks that live in word choice (OpenAI's EU textGrain, and the
 * green-list family generally) weaken in proportion to how many words change;
 * OpenAI's own published test (400-token passages) took detection from about
 * 92% to 66% by replacing 10% of words with synonyms, and to about 17% at 25%.
 * That is why 25% is the level to aim for with textGrain text. A target keeps the rewrite going past
 * what the detector flagged until that share of the wording has moved, but
 * every change still has to clear the same meaning and fact checks, so it can
 * be missed on a document that cannot safely move that far. Zero means off.
 */
export const WORD_CHANGE_TARGETS: { value: number; label: string }[] = [
  { value: 0, label: 'Off' },
  { value: 10, label: '10%' },
  { value: 20, label: '20%' },
  { value: 25, label: '25% (textGrain)' },
  { value: 30, label: '30%' },
  { value: 40, label: '40%' },
]

/**
 * The two engines, as a visitor experiences them.
 *
 * This collapses what used to be two separate menus, a "model tier" and a
 * "rewrite engine", that could be set to contradictory combinations. There is
 * one choice now, and it is the choice that actually changes the output.
 *
 * WHICH MODEL BACKS THE PRO ENGINE IS NOT NAMED HERE, and must not be named
 * anywhere a visitor can see. It is an implementation detail that changes when
 * a better one is pinned, and a version string in the interface only invites
 * someone to make a decision on information that will be stale by the time they
 * act on it. What the copy owes them is what the choice does to their text.
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
      'Deterministic substitution against the core AI-tell library. Runs immediately and needs no download.',
  },
  {
    id: 'pro',
    label: 'Pro',
    short: 'A real language model',
    description:
      'A language model that runs in your browser, plus the extended AI-tell library and more candidate rewrites per passage. It downloads once before the first rewrite starts.',
  },
]

export const engine = (id: EngineId) => ENGINES.find((e) => e.id === id) ?? ENGINES[0]
