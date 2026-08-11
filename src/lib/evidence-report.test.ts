import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { buildEvidenceReport } from './evidence-report'
import { checkDocument } from './detector'
import { PUBLIC_DETECTION_KEYS } from './detector/public-keys'
import { generateMarkedText } from './detector/simulate'

/**
 * The evidence report is the paid wedge — the artefact someone hands to whoever
 * accused them. On this deployment it is unreachable through the UI, because it
 * requires a Pro plan and no payment processor is configured, so nothing else
 * exercises it. That makes these tests the only thing standing between "the
 * wedge works" and "the wedge compiles", and the distinction is the whole
 * delivery-honesty question for this product.
 *
 * They therefore build a REAL PDF from a REAL analysis and read the bytes back,
 * rather than asserting that the function returned something.
 */

const HUMAN = `
The committee met on Tuesday evening to consider the revised drainage proposal for the eastern
site. Several members asked whether the survey had been completed in full, and the chair noted
that the report had been circulated only two days beforehand. A decision was deferred until the
next meeting, when the surveyor is expected to attend in person and answer questions directly.
The clerk agreed to write to the applicant setting out the outstanding points, including access
arrangements and the likely effect on the neighbouring lane. Members were broadly sympathetic to
the scheme but felt that the drawings submitted so far did not show enough detail to judge it
properly. One member observed that a similar application had been refused three years ago on
grounds that appeared to still apply, and asked the clerk to retrieve the earlier file.
`.trim()

/**
 * A plain English vocabulary for the positive control. The marked sampler picks
 * green-list continuations from it exactly as the /verify page does, so the
 * "detected" fixture is genuinely marked rather than asserted to be.
 */
const VOCABULARY = [
  'the', 'a', 'and', 'of', 'to', 'in', 'that', 'it', 'for', 'with', 'as', 'was', 'on', 'are',
  'this', 'by', 'from', 'or', 'an', 'be', 'which', 'has', 'have', 'not', 'they', 'their', 'more',
  'report', 'meeting', 'decision', 'members', 'survey', 'proposal', 'evening', 'committee',
  'question', 'answer', 'detail', 'scheme', 'record', 'notice', 'reason', 'result', 'figure',
  'method', 'measure', 'language', 'document', 'passage', 'evidence', 'writing', 'account',
]

/**
 * Read the words back OUT of the finished PDF.
 *
 * pdf-lib flate-compresses its content streams, so searching the raw bytes for
 * a phrase finds nothing whether or not the phrase is there — which would make
 * every assertion below pass or fail for the wrong reason. This inflates every
 * compressed stream and pulls the text-showing operands out, so the tests read
 * what a person opening the report would actually see.
 */
function extractPdfText(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes)
  const chunks: string[] = []

  // Walk stream ... endstream pairs; inflate the ones that are deflated.
  let from = 0
  for (;;) {
    const start = raw.indexOf('stream', from)
    if (start === -1) break
    const bodyStart = raw[start + 6] === 0x0d ? start + 8 : start + 7 // \r\n or \n
    const end = raw.indexOf('endstream', bodyStart)
    if (end === -1) break
    const body = raw.subarray(bodyStart, end)
    try {
      chunks.push(inflateSync(body).toString('latin1'))
    } catch {
      chunks.push(body.toString('latin1')) // stored uncompressed
    }
    from = end + 9
  }

  // pdf-lib writes text as HEX strings — <48656C6C6F> Tj — not as (literal) Tj.
  // Both forms are handled so this keeps working if that ever changes.
  const content = chunks.join('\n')
  const shown: string[] = []
  for (const m of content.matchAll(/(?:<([0-9A-Fa-f\s]*)>|\(((?:[^()\\]|\\.)*)\))\s*Tj/g)) {
    if (m[1] !== undefined) {
      shown.push(Buffer.from(m[1].replace(/\s+/g, ''), 'hex').toString('latin1'))
    } else {
      shown.push(m[2].replace(/\\([()\\])/g, '$1'))
    }
  }
  return shown.join('\n')
}

describe('evidence report', () => {
  it('produces a structurally valid PDF that reopens', async () => {
    const result = await checkDocument(HUMAN, { keys: PUBLIC_DETECTION_KEYS })
    const bytes = await buildEvidenceReport(result)

    expect(bytes.byteLength).toBeGreaterThan(1_000)
    expect(Buffer.from(bytes.slice(0, 5)).toString('latin1')).toBe('%PDF-')

    // Reopening is the real check: a byte blob that starts with %PDF- but does
    // not parse is not a document anyone can file with an appeal.
    const reopened = await PDFDocument.load(bytes)
    expect(reopened.getPageCount()).toBeGreaterThanOrEqual(1)
    expect(reopened.getTitle()).toContain(result.documentHash.slice(0, 16))
  })

  it('carries the document hash, so the report is tied to one exact document', async () => {
    const result = await checkDocument(HUMAN, { keys: PUBLIC_DETECTION_KEYS })
    const pdf = extractPdfText(await buildEvidenceReport(result))

    // The hash is what makes the artefact evidence rather than an assertion.
    // A 64-character hash wraps across lines in the layout, so the line breaks
    // come out before comparing — the bytes on the page are what matter.
    expect(result.documentHash).toMatch(/^[0-9a-f]{64}$/)
    expect(pdf.replace(/\s+/g, '')).toContain(result.documentHash)
  })

  it('states the limits of the method on the artefact itself', async () => {
    const result = await checkDocument(HUMAN, { keys: PUBLIC_DETECTION_KEYS })
    const pdf = extractPdfText(await buildEvidenceReport(result))

    // A report that shows a number without its limits is the thing this product
    // exists to argue against, so the limits must travel ON the export.
    expect(pdf).toMatch(/not proof of authorship/i)
  })

  it('reports the measured figures rather than a canned verdict', async () => {
    const result = await checkDocument(HUMAN, { keys: PUBLIC_DETECTION_KEYS })
    const computed = result.watermark.results.find((r) => r.status === 'computed')
    expect(computed, 'the fixture must actually compute for this test to mean anything').toBeDefined()

    const pdf = extractPdfText(await buildEvidenceReport(result))
    expect(pdf).toMatch(/Green-list rate/)
    expect(pdf).toContain(computed!.trials!.toLocaleString())
  })

  it('reports a DETECTED mark differently from an undetected one', async () => {
    // Without this pair the report is indistinguishable from one that always
    // prints the same paragraph.
    const marked = await checkDocument(generateMarkedText(PUBLIC_DETECTION_KEYS[0], VOCABULARY, 700), {
      keys: PUBLIC_DETECTION_KEYS,
    })
    const plain = await checkDocument(HUMAN, { keys: PUBLIC_DETECTION_KEYS })

    const markedZ = marked.watermark.results[0].z
    const plainZ = plain.watermark.results[0].z
    expect(markedZ).not.toBeNull()
    expect(plainZ).not.toBeNull()
    expect(markedZ!).toBeGreaterThan(plainZ!)
    expect(marked.watermark.anyDetected).toBe(true)
    expect(plain.watermark.anyDetected).toBe(false)

    const markedPdf = extractPdfText(await buildEvidenceReport(marked))
    const plainPdf = extractPdfText(await buildEvidenceReport(plain))
    expect(markedPdf).not.toBe(plainPdf)
  })

  it('says so plainly when there is nothing to report, instead of inventing a figure', async () => {
    const result = await checkDocument('Short.', { keys: PUBLIC_DETECTION_KEYS })
    expect(result.status).not.toBe('ok')

    const pdf = extractPdfText(await buildEvidenceReport(result))
    expect(pdf).toMatch(/No analysis was produced/)
  })
})
