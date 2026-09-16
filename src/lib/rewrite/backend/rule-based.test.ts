import { describe, expect, it } from 'vitest'
import { createRuleBasedBackend } from './rule-based'

const DICTIONARY_HEAVY =
  'We make a plan, then we get the data, then we go to the meeting. ' +
  'We think about it, we see the result, and we come to a conclusion. ' +
  'We take the feedback, we give an answer, and we find the fix. ' +
  'We tell the team, we ask a question, and we call it done.'

function countChangedWords(a: string, b: string): number {
  const aw = a.split(/\s+/)
  const bw = b.split(/\s+/)
  let changed = 0
  for (let i = 0; i < Math.max(aw.length, bw.length); i++) {
    if (aw[i] !== bw[i]) changed++
  }
  return changed
}

describe('createRuleBasedBackend strength differentiation', () => {
  it('changes noticeably more words at "regenerate" than at "aggressive"', async () => {
    const backend = createRuleBasedBackend('en', 'core')
    // Many seeds, since the gate is probabilistic per word: comparing the
    // busiest candidate at each strength is a fair, low-flake way to check
    // the rate actually moved rather than getting unlucky with one seed.
    const aggressive = await backend.generate(DICTIONARY_HEAVY, { count: 6, strength: 'aggressive' })
    const regenerate = await backend.generate(DICTIONARY_HEAVY, { count: 6, strength: 'regenerate' })

    const maxChanged = (candidates: string[]) =>
      Math.max(...candidates.map((c) => countChangedWords(DICTIONARY_HEAVY, c)))

    expect(maxChanged(regenerate)).toBeGreaterThan(maxChanged(aggressive))
  })

  it('escalates strictly across all four strengths on the same passage', async () => {
    const backend = createRuleBasedBackend('en', 'core')
    const changedAt = async (strength: 'preserve' | 'balanced' | 'aggressive' | 'regenerate') => {
      const candidates = await backend.generate(DICTIONARY_HEAVY, { count: 8, strength })
      return Math.max(...candidates.map((c) => countChangedWords(DICTIONARY_HEAVY, c)))
    }

    const preserve = await changedAt('preserve')
    const balanced = await changedAt('balanced')
    const aggressive = await changedAt('aggressive')
    const regenerate = await changedAt('regenerate')

    expect(balanced).toBeGreaterThanOrEqual(preserve)
    expect(aggressive).toBeGreaterThan(balanced)
    expect(regenerate).toBeGreaterThan(aggressive)
  })
})

describe('createRuleBasedBackend proper-noun protection', () => {
  it('never substitutes a capitalised proper noun even when it collides with a dictionary entry', async () => {
    // "Think" and "Move" are both real dictionary keys (think -> ['believe',
    // 'reckon'], move -> ['shift', 'relocate']). Capitalised mid-sentence
    // here, they stand for product names, not the verbs "think"/"move", and
    // must survive every candidate untouched at every strength.
    const passage = 'Everyone agreed that Think should ship before Move launches next week, and Think shipped first.'
    const backend = createRuleBasedBackend('en', 'core')
    const candidates = await backend.generate(passage, { count: 8, strength: 'regenerate' })
    for (const candidate of candidates) {
      expect(candidate).toContain('Think')
      expect(candidate).toContain('Move')
    }
  })
})

describe('createRuleBasedBackend English-variant awareness', () => {
  it('never introduces an American spelling into a British-spelled document', async () => {
    // "know" -> "realize"/"understand" in the dictionary; a British document
    // must only ever see "realise" from that pair, never "realize".
    const passage =
      'We know the plan will work because we organised the launch and realised the risk early. We know it.'
    const backend = createRuleBasedBackend('en', 'core')
    const candidates = await backend.generate(passage, {
      count: 8,
      strength: 'regenerate',
      englishVariant: 'en-GB',
    })
    for (const candidate of candidates) {
      expect(candidate).not.toMatch(/realize/i)
    }
  })

  it('never introduces a British spelling into an American-spelled document', async () => {
    const passage =
      'We know the plan will work because we organized the launch and realized the risk early. We know it.'
    const backend = createRuleBasedBackend('en', 'core')
    const candidates = await backend.generate(passage, {
      count: 8,
      strength: 'regenerate',
      englishVariant: 'en-US',
    })
    for (const candidate of candidates) {
      expect(candidate).not.toMatch(/realise/i)
    }
  })
})
