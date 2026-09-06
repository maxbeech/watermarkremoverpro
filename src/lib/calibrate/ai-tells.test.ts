import { describe, expect, it } from 'vitest'
import { applyDeterministicPass } from './ai-tells'

describe('applyDeterministicPass', () => {
  it('swaps an em dash clause connector for a comma or period', () => {
    const { text, changes } = applyDeterministicPass('The result was clear \u2014 nobody objected.', 'balanced')
    expect(text).not.toContain('\u2014')
    expect(changes.some((c) => c.category === 'punctuation')).toBe(true)
  })

  it('leaves dashes untouched at "preserve" strength', () => {
    const { text } = applyDeterministicPass('The result was clear \u2014 nobody objected.', 'preserve')
    expect(text).toContain('\u2014')
  })

  it('replaces a stock phrase with a natural alternative, preserving sentence-initial capitalisation', () => {
    const { text, changes } = applyDeterministicPass('Moreover, the data supports this.', 'balanced')
    expect(text).not.toMatch(/^Moreover/)
    expect(changes.some((c) => c.category === 'phrase')).toBe(true)
  })

  it('rotates through alternatives so a repeated stock phrase does not just install a new tic', () => {
    const input = 'In conclusion, it works. In conclusion, it scales.'
    const { text } = applyDeterministicPass(input, 'balanced')
    const [first, second] = text.split('.').filter((s) => s.trim().length > 0)
    expect(first.trim().toLowerCase()).not.toBe(second.trim().toLowerCase())
  })

  it('is deterministic: identical input produces identical output', () => {
    const input = 'The system \u2014 designed carefully \u2014 plays a crucial role in the outcome.'
    const a = applyDeterministicPass(input, 'aggressive')
    const b = applyDeterministicPass(input, 'aggressive')
    expect(a.text).toBe(b.text)
    expect(a.changes).toEqual(b.changes)
  })

  it('flags a templated triadic list without rewriting it', () => {
    const input = 'The plan was bold, ambitious, and risky.'
    const { text, flaggedStructures } = applyDeterministicPass(input, 'balanced')
    expect(text).toBe(input) // no phrase/dash patterns here, so the sentence itself is untouched
    expect(flaggedStructures.length).toBeGreaterThan(0)
  })

  it('leaves text with no tells completely unchanged', () => {
    const input = 'The cat sat on the mat because it was warm.'
    const { text, changes } = applyDeterministicPass(input, 'aggressive')
    expect(text).toBe(input)
    expect(changes).toEqual([])
  })
})

describe('tell library tiers', () => {
  // The announcement register is the single most recognisable block of
  // generated copy on the public web, and it is what an assistant actually
  // produces when asked for a launch post. The core library deliberately
  // does not carry it; the extended (Pro) library does. This is the tier
  // difference the pricing page promises, asserted rather than described.
  const ANNOUNCEMENT = "We're thrilled to announce our new platform."

  it('core leaves the announcement register alone', () => {
    const { changes } = applyDeterministicPass(ANNOUNCEMENT, 'balanced', 'core')
    expect(changes).toEqual([])
  })

  it('extended catches the announcement register', () => {
    const { text, changes } = applyDeterministicPass(ANNOUNCEMENT, 'balanced', 'extended')
    expect(changes.length).toBeGreaterThan(0)
    expect(text.toLowerCase()).not.toContain('thrilled to announce')
  })

  it('extended is a superset of core, never a replacement for it', () => {
    const coreOnlyTell = 'We should delve into the data.'
    const core = applyDeterministicPass(coreOnlyTell, 'balanced', 'core')
    const extended = applyDeterministicPass(coreOnlyTell, 'balanced', 'extended')
    expect(core.changes.length).toBeGreaterThan(0)
    expect(extended.changes.length).toBeGreaterThanOrEqual(core.changes.length)
  })

  it('defaults to core when no library is named', () => {
    const withDefault = applyDeterministicPass(ANNOUNCEMENT, 'balanced')
    const withCore = applyDeterministicPass(ANNOUNCEMENT, 'balanced', 'core')
    expect(withDefault.changes.length).toBe(withCore.changes.length)
  })
})

describe('structural tells and elevated vocabulary', () => {
  it('flags negative parallelism without rewriting it', () => {
    const input = "It's not just a database, it's a platform for your whole team."
    const { text, flaggedStructures } = applyDeterministicPass(input, 'balanced', 'extended')
    expect(text).toBe(input) // structure is reported, never auto-rewritten
    expect(flaggedStructures.some((f) => f.kind === 'negative-parallelism')).toBe(true)
  })

  it('labels what kind of structure each flag is', () => {
    const input = 'The plan was bold, ambitious, and risky.'
    const { flaggedStructures } = applyDeterministicPass(input, 'balanced')
    expect(flaggedStructures[0].kind).toBe('triadic-list')
    expect(flaggedStructures[0].note.length).toBeGreaterThan(0)
  })

  it('counts elevated vocabulary without replacing any of it', () => {
    const input =
      'The robust framework offers a robust approach. This pivotal work is meticulous in its detail.'
    const { text, elevatedVocabulary } = applyDeterministicPass(input, 'aggressive', 'extended')
    expect(text).toBe(input) // ordinary English; counted, never swapped
    const robust = elevatedVocabulary.find((v) => v.word === 'robust')
    expect(robust?.count).toBe(2)
    expect(elevatedVocabulary.map((v) => v.word)).toContain('pivotal')
  })

  it('reports nothing for prose that carries none of these habits', () => {
    const input = 'The committee met on Tuesday and asked whether the survey had been completed.'
    const { flaggedStructures, elevatedVocabulary } = applyDeterministicPass(input, 'balanced', 'extended')
    expect(flaggedStructures).toEqual([])
    expect(elevatedVocabulary).toEqual([])
  })
})
