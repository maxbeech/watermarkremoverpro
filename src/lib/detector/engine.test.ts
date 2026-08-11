import { describe, expect, it } from 'vitest'
import { ALPHA, checkDocument, resolveLanguage } from './index'
import { OPEN_REFERENCE_KEY } from './keys'
import { PUBLIC_DETECTION_KEYS } from './public-keys'
import { generateMarkedText } from './simulate'
import { sha256Hex } from './crypto'

const ENGLISH = `
The council met on Tuesday evening to consider the revised drainage proposal for the eastern
site. Several members asked whether the survey had been completed in full, and the chair noted
that the report had been circulated only two days beforehand. A decision was deferred until the
next meeting, when the surveyor is expected to attend in person and answer questions directly.
The clerk agreed to write to the applicant setting out the outstanding points, including access
arrangements and the likely effect on the neighbouring lane. Members were broadly sympathetic to
the scheme but felt that the drawings submitted so far did not show enough detail to judge it
properly. One member observed that a similar application had been refused three years ago on
grounds that appeared to still apply. The meeting closed at half past eight after a short
discussion of other business, including the budget for the coming financial year and the
condition of the footpath along the river. Nothing further was decided, and the matter will
return in its current form unless the applicant chooses to withdraw it in the meantime.
`.trim()

const SPANISH = `
El ayuntamiento se reunió el martes por la tarde para examinar la propuesta revisada de drenaje
del terreno oriental. Varios miembros preguntaron si el estudio se había completado en su
totalidad, y el presidente señaló que el informe se había distribuido apenas dos días antes. La
decisión se aplazó hasta la próxima reunión, cuando se espera que el topógrafo asista en persona
y responda directamente a las preguntas. El secretario acordó escribir al solicitante exponiendo
los puntos pendientes, entre ellos los accesos y el efecto probable sobre el camino vecino. Los
miembros se mostraron en general favorables al proyecto, pero consideraron que los planos
presentados hasta ahora no mostraban suficiente detalle para juzgarlo correctamente. La reunión
se levantó a las ocho y media tras una breve discusión de otros asuntos.
`.trim()

describe('checkDocument', () => {
  it('produces a full result for ordinary English prose', async () => {
    const result = await checkDocument(ENGLISH, { keys: PUBLIC_DETECTION_KEYS })

    expect(result.status).toBe('ok')
    expect(result.language.code).toBe('en')
    expect(result.language.determinedBy).toBe('measurement')
    expect(result.documentHash).toBe(sha256Hex(ENGLISH))
    expect(result.words).toBeGreaterThan(150)

    // The style channel must actually have run against a real baseline.
    expect(result.distribution?.status).toBe('computed')
    expect(result.distribution?.compositeDeviation).toBeTypeOf('number')
    expect(result.distribution?.corpus?.tokens).toBeGreaterThan(50_000)

    // Ordinary prose should not be flagged under the reference key.
    expect(result.watermark.anyDetected).toBe(false)
  })

  it('identifies Spanish and uses the Spanish baseline', async () => {
    const result = await checkDocument(SPANISH, { keys: PUBLIC_DETECTION_KEYS })
    expect(result.language.code).toBe('es')
    expect(result.distribution?.status).toBe('computed')
    expect(result.distribution?.language).toBe('es')
  })

  it('detects a document marked under the reference key, end to end', async () => {
    const vocab = ['record', 'passage', 'evidence', 'report', 'the', 'of', 'and', 'that', 'writing',
      'measure', 'signal', 'review', 'account', 'reason', 'section', 'finding', 'to', 'in', 'a', 'for']
    const marked = generateMarkedText(OPEN_REFERENCE_KEY, vocab, 800)

    const result = await checkDocument(marked, { keys: PUBLIC_DETECTION_KEYS, language: 'en' })
    expect(result.watermark.anyDetected).toBe(true)

    const computed = result.watermark.results.find((r) => r.status === 'computed')
    expect(computed?.pValue as number).toBeLessThan(ALPHA)

    // And the per-passage breakdown must attribute it rather than only scoring
    // the document as a whole.
    expect(result.passageCorrection).not.toBeNull()
    expect(result.passages.some((p) => p.survivesCorrection)).toBe(true)
  })

  it('refuses to guess a language it cannot determine', async () => {
    const result = await checkDocument('zzz qqq xxx yyy zzz qqq xxx yyy', { keys: PUBLIC_DETECTION_KEYS })
    expect(result.status).toBe('language_undetermined')
    expect(result.detail).toContain('could not be determined')
    expect(result.distribution).toBeNull()
  })

  it('rejects an unsupported language instead of substituting a baseline', async () => {
    const result = await checkDocument(ENGLISH, { keys: PUBLIC_DETECTION_KEYS, language: 'it' })
    expect(result.status).toBe('unsupported_language')
    expect(result.detail).toContain('no measured baseline')
  })

  it('returns an empty-document status rather than zeros', async () => {
    const result = await checkDocument('   \n  ', { keys: PUBLIC_DETECTION_KEYS })
    expect(result.status).toBe('empty_document')
    expect(result.watermark.results).toHaveLength(0)
    expect(result.distribution).toBeNull()
  })

  it('attaches the stated limits and coverage notice to every result', async () => {
    const result = await checkDocument(ENGLISH, { keys: PUBLIC_DETECTION_KEYS })
    expect(result.limits.length).toBeGreaterThanOrEqual(4)
    expect(result.limits.join(' ')).toContain('not proof of authorship')
    expect(result.limits.join(' ')).toContain('not proof of human authorship')
    // With no vendor key held, the notice must say so in as many words.
    expect(result.watermark.coverageNotice).toContain('no vendor publishes one')
  })

  it('is reproducible: the same text yields the same figures', async () => {
    const a = await checkDocument(ENGLISH, { keys: PUBLIC_DETECTION_KEYS })
    const b = await checkDocument(ENGLISH, { keys: PUBLIC_DETECTION_KEYS })
    expect(a.documentHash).toBe(b.documentHash)
    expect(a.distribution?.compositeDeviation).toBe(b.distribution?.compositeDeviation)
    expect(a.distribution?.compositeInterval).toEqual(b.distribution?.compositeInterval)
    expect(a.watermark.results[0].z).toBe(b.watermark.results[0].z)
  })
})

describe('resolveLanguage', () => {
  it('honours an explicit supported language', () => {
    expect(resolveLanguage(ENGLISH, 'fr')).toEqual({ language: 'fr', reason: 'caller' })
  })

  it('reports an unsupported explicit language rather than measuring instead', () => {
    expect(resolveLanguage(ENGLISH, 'it')).toEqual({ language: null, reason: 'unsupported' })
  })
})
