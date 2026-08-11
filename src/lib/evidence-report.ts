import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { AnalysisResult } from '@/lib/detector'
import { SITE } from '@/lib/site'

/**
 * The evidence report.
 *
 * This is the artefact someone hands to whoever accused them, so it is built to
 * be read by a sceptical third party rather than to look impressive:
 *
 *  - Every figure carries the count it was computed from.
 *  - Anything not computed is printed as the REASON it was not computed. There
 *    is no dash, no blank, and above all no zero standing in for a missing
 *    measurement.
 *  - The stated limits are printed in full, on the report, not linked. A limit
 *    that only exists on a website is a limit that gets separated from the
 *    document it qualifies.
 *  - The keys tested are listed by name, because "no mark detected" is
 *    meaningless without them.
 *  - The document SHA-256 is printed so the report is tied to one exact file and
 *    cannot be waved at a different draft.
 *
 * It deliberately does NOT print a verdict, a percentage "AI score", or a
 * recommendation. Those would be the report making a claim the measurement does
 * not support, in a document designed to be believed.
 */

const A4 = { width: 595.28, height: 841.89 }
const MARGIN = 56
const INK = rgb(0.13, 0.13, 0.12)
const MUTED = rgb(0.42, 0.42, 0.38)
const RULE = rgb(0.8, 0.8, 0.76)

interface Cursor {
  page: PDFPage
  y: number
}

export interface ReportFonts {
  body: PDFFont
  bold: PDFFont
  mono: PDFFont
}

export async function buildEvidenceReport(result: AnalysisResult): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`${SITE.name} evidence report — ${result.documentHash.slice(0, 16)}`)
  pdf.setSubject('Statistical AI provenance-mark analysis')
  pdf.setProducer(SITE.name)
  pdf.setCreationDate(new Date(result.analyzedAt))

  const fonts: ReportFonts = {
    body: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    mono: await pdf.embedFont(StandardFonts.Courier),
  }

  const cursor: Cursor = { page: pdf.addPage([A4.width, A4.height]), y: A4.height - MARGIN }

  heading(cursor, pdf, fonts, `${SITE.name} evidence report`, 20)
  text(cursor, pdf, fonts, `Generated ${result.analyzedAt} · engine ${result.engineVersion}`, 9, MUTED)
  gap(cursor, 10)
  rule(cursor, pdf)
  gap(cursor, 12)

  // ---- Document ----------------------------------------------------------
  heading(cursor, pdf, fonts, 'The document analysed', 12)
  keyValue(cursor, pdf, fonts, 'SHA-256', result.documentHash, true)
  keyValue(cursor, pdf, fonts, 'Length', `${result.words.toLocaleString()} words, ${result.characters.toLocaleString()} characters`)
  keyValue(
    cursor,
    pdf,
    fonts,
    'Language',
    result.language.name
      ? `${result.language.name} (${result.language.determinedBy === 'caller' ? 'specified by the submitter' : 'identified from the text'})`
      : 'not determined',
  )
  gap(cursor, 12)

  if (result.status !== 'ok') {
    heading(cursor, pdf, fonts, 'No analysis was produced', 12)
    text(cursor, pdf, fonts, result.detail ?? 'The document could not be analysed.', 10)
    return pdf.save()
  }

  // ---- Watermark ---------------------------------------------------------
  heading(cursor, pdf, fonts, 'Provenance-mark test', 12)
  text(
    cursor,
    pdf,
    fonts,
    'A keyed green-list test (Kirchenbauer et al., 2023). Distinct word pairs are each scored once; the statistic is a one-proportion z test against the expected green-list fraction for the key.',
    9,
    MUTED,
  )
  gap(cursor, 8)

  for (const r of result.watermark.results) {
    keyValue(cursor, pdf, fonts, 'Key', `${r.keyLabel}${r.vendorPublished ? ' (vendor-published)' : ' (not a vendor key)'}`)
    if (r.status === 'computed') {
      keyValue(
        cursor,
        pdf,
        fonts,
        'Green-list rate',
        `${pct(r.greenRate)} (95% interval ${pct(r.greenRateInterval?.low)} to ${pct(r.greenRateInterval?.high)}), expected ${pct(r.expectedGreenRate)} by chance`,
      )
      keyValue(cursor, pdf, fonts, 'z / p', `${num(r.z, 3)} / ${pval(r.pValue)}`)
      keyValue(cursor, pdf, fonts, 'Measured over', `${r.trials?.toLocaleString()} distinct word pairs`)
    } else {
      keyValue(cursor, pdf, fonts, 'Result', r.detail ?? 'not computed')
    }
    gap(cursor, 8)
  }

  text(cursor, pdf, fonts, result.watermark.coverageNotice, 9)
  gap(cursor, 14)

  // ---- Style -------------------------------------------------------------
  heading(cursor, pdf, fonts, 'Style measurement', 12)
  const dist = result.distribution
  if (dist && dist.status === 'computed') {
    keyValue(
      cursor,
      pdf,
      fonts,
      'Distance from reference',
      `${num(dist.compositeDeviation, 2)} SD${
        dist.compositeInterval
          ? ` (90% bootstrap interval ${num(dist.compositeInterval.low, 2)} to ${num(dist.compositeInterval.high, 2)})`
          : ', no interval — too few sentences to resample'
      }`,
    )
    keyValue(cursor, pdf, fonts, 'Function-word distance', `${num(dist.functionWordDeviation, 2)} SD`)
    keyValue(cursor, pdf, fonts, 'Measured over', `${dist.tokens.toLocaleString()} words in ${dist.chunks} chunks`)
    if (dist.corpus) {
      keyValue(
        cursor,
        pdf,
        fonts,
        'Reference corpus',
        `${dist.corpus.documents.toLocaleString()} documents / ${dist.corpus.tokens.toLocaleString()} words, ${dist.corpus.source}, ${dist.corpus.license}, retrieved ${dist.corpus.retrievedAt.slice(0, 10)}`,
      )
    }
    gap(cursor, 4)
    text(
      cursor,
      pdf,
      fonts,
      'This is a measure of register, not of provenance. It does not detect AI and is not evidence of who wrote the document. Technical writing, fiction, translated text and non-native prose all sit far from an encyclopaedic reference for ordinary reasons.',
      9,
      MUTED,
    )
  } else {
    text(cursor, pdf, fonts, dist?.detail ?? 'No style measurement was made.', 10)
  }
  gap(cursor, 14)

  // ---- Passages ----------------------------------------------------------
  heading(cursor, pdf, fonts, 'Per-passage findings', 12)
  if (result.passageCorrection) {
    text(
      cursor,
      pdf,
      fonts,
      `${result.passageCorrection.tested} passages were tested. ${result.passageCorrection.survived} survived false-discovery-rate correction at ${result.passageCorrection.fdr} (${result.passageCorrection.method}). Only corrected findings are listed; uncorrected per-passage results would flag passages of any document by chance.`,
      9,
      MUTED,
    )
    gap(cursor, 8)

    const flagged = result.passages.filter((p) => p.survivesCorrection)
    if (flagged.length === 0) {
      text(cursor, pdf, fonts, 'No passage carried a signal that survived correction.', 10)
    } else {
      for (const p of flagged.slice(0, 25)) {
        text(
          cursor,
          pdf,
          fonts,
          `Passage ${p.index + 1} (${p.words} words) — z ${num(p.watermarkZ, 2)}, p ${pval(p.watermarkP)}`,
          9,
          INK,
          fonts.bold,
        )
        text(cursor, pdf, fonts, truncate(p.text, 400), 9, MUTED)
        gap(cursor, 6)
      }
    }
  } else {
    text(cursor, pdf, fonts, 'No passage was long enough to carry its own test. Nothing is attributed.', 10)
  }
  gap(cursor, 14)

  // ---- Limits ------------------------------------------------------------
  heading(cursor, pdf, fonts, 'Stated limits of this analysis', 12)
  for (const limit of result.limits) {
    text(cursor, pdf, fonts, `• ${limit}`, 9)
    gap(cursor, 4)
  }

  gap(cursor, 12)
  rule(cursor, pdf)
  gap(cursor, 8)
  text(
    cursor,
    pdf,
    fonts,
    `${SITE.name} reports what it measured and names what it could not measure. It does not remove, weaken or reduce provenance marks, on any tier. ${SITE.url}`,
    8,
    MUTED,
  )

  return pdf.save()
}

// ---------------------------------------------------------------------------
// Layout primitives. Deliberately small — a report that silently drops a limit
// off the bottom of a page would be worse than an ugly one.

function ensureRoom(cursor: Cursor, pdf: PDFDocument, needed: number): void {
  if (cursor.y - needed < MARGIN) {
    cursor.page = pdf.addPage([A4.width, A4.height])
    cursor.y = A4.height - MARGIN
  }
}

function heading(cursor: Cursor, pdf: PDFDocument, fonts: ReportFonts, value: string, size: number): void {
  ensureRoom(cursor, pdf, size + 12)
  cursor.page.drawText(value, { x: MARGIN, y: cursor.y - size, size, font: fonts.bold, color: INK })
  cursor.y -= size + 8
}

function text(
  cursor: Cursor,
  pdf: PDFDocument,
  fonts: ReportFonts,
  value: string,
  size: number,
  color = INK,
  font?: PDFFont,
): void {
  const used = font ?? fonts.body
  const maxWidth = A4.width - MARGIN * 2
  for (const line of wrap(value, used, size, maxWidth)) {
    ensureRoom(cursor, pdf, size + 4)
    cursor.page.drawText(line, { x: MARGIN, y: cursor.y - size, size, font: used, color })
    cursor.y -= size + 3
  }
}

function keyValue(
  cursor: Cursor,
  pdf: PDFDocument,
  fonts: ReportFonts,
  label: string,
  value: string,
  monospace = false,
): void {
  const size = 9.5
  const labelWidth = 120
  const maxWidth = A4.width - MARGIN * 2 - labelWidth
  const font = monospace ? fonts.mono : fonts.body
  const lines = wrap(value, font, size, maxWidth)

  ensureRoom(cursor, pdf, (size + 3) * lines.length)
  cursor.page.drawText(label, { x: MARGIN, y: cursor.y - size, size, font: fonts.bold, color: MUTED })
  lines.forEach((line, i) => {
    if (i > 0) ensureRoom(cursor, pdf, size + 3)
    cursor.page.drawText(line, { x: MARGIN + labelWidth, y: cursor.y - size, size, font, color: INK })
    cursor.y -= size + 3
  })
}

function rule(cursor: Cursor, pdf: PDFDocument): void {
  ensureRoom(cursor, pdf, 6)
  cursor.page.drawLine({
    start: { x: MARGIN, y: cursor.y },
    end: { x: A4.width - MARGIN, y: cursor.y },
    thickness: 0.5,
    color: RULE,
  })
  cursor.y -= 4
}

const gap = (cursor: Cursor, amount: number): void => {
  cursor.y -= amount
}

/**
 * Word wrap against the real font metrics.
 *
 * The standard PDF fonts are not monospaced, so wrapping on a character count
 * overflows the page for wide text and wastes half the line for narrow text.
 * Sanitised to WinAnsi first: pdf-lib throws on characters the standard fonts
 * cannot encode, and a curly quote in a user's passage must not be able to fail
 * the whole report.
 */
function wrap(value: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const safe = sanitize(value)
  const words = safe.split(/\s+/).filter((w) => w.length > 0)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate
      continue
    }
    if (current.length > 0) lines.push(current)
    // A single word longer than the line (a hash, a URL) is hard-split.
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      let chunk = ''
      for (const char of word) {
        if (font.widthOfTextAtSize(chunk + char, size) > maxWidth) {
          lines.push(chunk)
          chunk = char
        } else {
          chunk += char
        }
      }
      current = chunk
    } else {
      current = word
    }
  }
  if (current.length > 0) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

function sanitize(value: string): string {
  return value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
}

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max)}…`

const num = (value: number | null | undefined, digits: number): string =>
  value === null || value === undefined || !Number.isFinite(value) ? 'not computed' : value.toFixed(digits)

const pct = (value: number | null | undefined): string =>
  value === null || value === undefined || !Number.isFinite(value) ? 'not computed' : `${(value * 100).toFixed(1)}%`

const pval = (value: number | null | undefined): string =>
  value === null || value === undefined || !Number.isFinite(value)
    ? 'not computed'
    : value < 1e-6
      ? '< 0.000001'
      : value.toFixed(6)
