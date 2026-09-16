import { describe, expect, it } from 'vitest'
import { analyzeAiLikelihood, MIN_WORDS_FOR_LIKELIHOOD } from './ai-likelihood'

// Genuinely bursty: short fragments next to long compound sentences, the way
// people actually write, rather than the uniform sentence lengths a committee
// minute (or an LLM) tends to produce. That variation is itself one of the
// signals this module measures, so the fixture needs to carry it honestly.
const HUMAN = `
The council met on Tuesday. Nobody expected much. The drainage proposal for the eastern site had
already been through two rounds of consultation, and most of the room assumed it would simply be
waved through with a handful of minor conditions attached to the final approval. It wasn't. A
member asked, almost as an afterthought, whether the survey had actually been completed, and the
room went quiet. It hadn't. The chair admitted the report had only been circulated two days
before, which under the council's own rules was not enough notice for members to prepare
properly, and after a short, slightly awkward exchange about whose fault that was, the item was
deferred to next month. The surveyor will attend in person then. The clerk will write to the
applicant in the meantime, setting out access arrangements and the likely effect on the
neighbouring lane, a lane that residents have complained about for years without much happening.
Members were broadly sympathetic. But the drawings just weren't detailed enough to judge properly,
and everyone in the room seemed to know it, even the applicant's own agent, who said little.
`.trim()

/**
 * Deliberately built from the exact habits this channel is designed to catch:
 * dash-clause connectors, stock phrases, elevated vocabulary, negative
 * parallelism and uniform sentence length. The dash is written as a \u2014
 * escape rather than a literal glyph, per this repo's house-style rule
 * (tests/house-style.test.ts).
 */
const AI_STYLE =
  'It is important to note that this approach plays a crucial role in the process \u2014 it helps ' +
  'teams move faster. This is not just a minor improvement, it is a fundamental shift in how work ' +
  'gets done. The system offers a robust, comprehensive, and holistic solution to a complex problem. ' +
  'Furthermore, the results underscore the pivotal nature of the change. The team must delve into ' +
  'the intricacies of the rollout \u2014 careful review is required. Moreover, the rollout showcases ' +
  'a meticulous approach to a nuanced and multifaceted challenge. In conclusion, this represents a ' +
  'significant step forward for the organisation and its many stakeholders across the board.'

describe('analyzeAiLikelihood', () => {
  it('reports insufficient_data below the minimum word count', () => {
    const result = analyzeAiLikelihood('Too short to score.', 'en')
    expect(result.status).toBe('insufficient_data')
    expect(result.score).toBeNull()
    expect(result.detail).toContain(String(MIN_WORDS_FOR_LIKELIHOOD))
  })

  it('does not run outside English', () => {
    const result = analyzeAiLikelihood(HUMAN, 'es')
    expect(result.status).toBe('insufficient_data')
    expect(result.detail).toContain('English only')
  })

  it('does not run when the language is undetermined', () => {
    const result = analyzeAiLikelihood(HUMAN, null)
    expect(result.status).toBe('insufficient_data')
    expect(result.detail).toContain('No language was determined')
  })

  it('scores ordinary human prose low', () => {
    const result = analyzeAiLikelihood(HUMAN, 'en')
    expect(result.status).toBe('computed')
    expect(result.score).not.toBeNull()
    expect(result.band).toBe('low')
    expect(result.score as number).toBeLessThan(25)
  })

  it('scores text dense with dash-clauses, stock phrases and elevated vocabulary much higher', () => {
    const human = analyzeAiLikelihood(HUMAN, 'en')
    const ai = analyzeAiLikelihood(AI_STYLE, 'en')
    expect(ai.status).toBe('computed')
    expect(ai.score as number).toBeGreaterThan(human.score as number)
    expect(ai.band === 'elevated' || ai.band === 'high').toBe(true)
  })

  it('is biased toward flagging: a couple of habits already leave "low"', () => {
    const mild = `${HUMAN} It is important to note that this detail matters \u2014 it really does.`
    const result = analyzeAiLikelihood(mild, 'en')
    expect(result.status).toBe('computed')
    expect(result.band).not.toBe('low')
  })

  it('is reproducible', () => {
    const a = analyzeAiLikelihood(AI_STYLE, 'en')
    const b = analyzeAiLikelihood(AI_STYLE, 'en')
    expect(a.score).toBe(b.score)
    expect(a.signals).toEqual(b.signals)
  })

  it('every computed signal carries a non-negative rate and contribution', () => {
    const result = analyzeAiLikelihood(AI_STYLE, 'en')
    for (const s of result.signals) {
      expect(s.ratePer500).toBeGreaterThanOrEqual(0)
      expect(s.contribution).toBeGreaterThanOrEqual(0)
    }
  })

  it('does not flag ordinary human prose for repeating "the" as a sentence-opener', () => {
    // HUMAN legitimately opens five of its eleven sentences with "The" and two
    // with "It" (ordinary English), which is exactly what a naive "repeated
    // opener" heuristic would over-flag. DISCOURSE_OPENERS deliberately
    // excludes plain articles/pronouns for this reason.
    const result = analyzeAiLikelihood(HUMAN, 'en')
    const opener = result.signals.find((s) => s.id === 'opener-repetition')
    expect(opener?.contribution).toBe(0)
  })

  it('flags a document that repeatedly opens sentences on the same discourse marker', () => {
    const repeated = `
      This approach improves throughput across the whole pipeline. This method reduces latency for
      every request that passes through the system. This design simplifies operations for the whole
      team, cutting the on-call load significantly. This change lowers cost across every environment
      the service runs in. The team shipped it last week to good results, and the rollout went
      smoothly across every region. Another release is planned for next quarter once feedback comes
      in from early users of the current build.
    `.trim()
    const result = analyzeAiLikelihood(repeated, 'en')
    const opener = result.signals.find((s) => s.id === 'opener-repetition')
    expect(opener?.contribution).toBeGreaterThan(0)
  })

  it('flags a document dense with decorative emoji', () => {
    const decorated = `${HUMAN} Huge news ✅ the proposal is finally moving forward \u{1F680} and the
      whole team is thrilled about it ✨ which is a great result for everyone involved today.`
    const plain = analyzeAiLikelihood(HUMAN, 'en')
    const result = analyzeAiLikelihood(decorated, 'en')
    const emoji = result.signals.find((s) => s.id === 'emoji-density')
    expect(emoji?.count).toBe(3)
    expect(result.score as number).toBeGreaterThan(plain.score as number)
  })

  it('flags a document dense with emphasis/connective adverbs', () => {
    const dense = `${HUMAN} Notably, the outcome was significantly different than expected. Arguably,
      this was fundamentally undoubtedly the right call, and importantly, essentially everyone
      particularly agreed, especially the chair, who was ultimately satisfied with the result.`
    const plain = analyzeAiLikelihood(HUMAN, 'en')
    const result = analyzeAiLikelihood(dense, 'en')
    const connective = result.signals.find((s) => s.id === 'connective-density')
    expect(connective?.count).toBeGreaterThan(0)
    expect(result.score as number).toBeGreaterThan(plain.score as number)
  })
})
