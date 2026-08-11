'use client'

import type { AnalysisResult } from '@/lib/detector'
import { ALPHA } from '@/lib/detector'
import { PassageBreakdown } from './passage-breakdown'

/**
 * Rendering rules, which are product rules and not styling preferences:
 *
 *  - A null statistic renders as the reason it is null. Never as 0, never as
 *    "—", never omitted. The user has to be able to tell "we measured this and
 *    it was zero" from "we could not measure this".
 *  - The watermark verdict is always shown with its coverage notice attached.
 *  - The style figure is always shown with the sentence saying it is not a
 *    provenance mark. It is the single most misreadable number in the product.
 */
export function ResultView({ result }: { result: AnalysisResult }) {
  if (result.status !== 'ok') {
    return (
      <section className="rounded-lg border border-ink-200 bg-white p-5">
        <h2 className="font-serif text-lg text-ink-900">No result was produced</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{result.detail}</p>
        {result.status === 'language_undetermined' && (
          <p className="mt-3 text-sm text-ink-500">
            Pick the language from the menu above and run the check again.
          </p>
        )}
      </section>
    )
  }

  const computed = result.watermark.results.filter((r) => r.status === 'computed')
  const detections = computed.filter((r) => r.pValue !== null && r.pValue < ALPHA)
  const dist = result.distribution

  return (
    <div className="space-y-5">
      {/* ---------------------------------------------------------------- */}
      <section className="rounded-lg border border-ink-200 bg-white">
        <header className="border-b border-ink-100 px-5 py-4">
          <h2 className="font-serif text-lg text-ink-900">Provenance mark</h2>
          <p className="mt-1 text-sm text-ink-500">
            A keyed statistical test, run once for each detection key this page holds.
          </p>
        </header>

        <div className="px-5 py-4">
          <p className="font-serif text-xl text-ink-900">
            {detections.length > 0
              ? `A mark was detected under ${detections.length === 1 ? 'one key' : `${detections.length} keys`}.`
              : computed.length > 0
                ? 'No mark was detected under the keys tested.'
                : 'The test could not run on this document.'}
          </p>

          <div className="mt-4 space-y-4">
            {result.watermark.results.map((r) => (
              <div key={r.keyId} className="rounded border border-ink-100 bg-ink-50/60 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-ink-800">{r.keyLabel}</p>
                  <p className="text-xs text-ink-400">
                    {r.vendorPublished ? 'vendor-published key' : 'not a vendor key'}
                  </p>
                </div>

                {r.status === 'computed' ? (
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                    <Stat label="Green-list rate">
                      <span className="figure">{fmtPct(r.greenRate)}</span>
                      <span className="block text-xs text-ink-400">
                        band {fmtPct(r.greenRateInterval?.low)}–{fmtPct(r.greenRateInterval?.high)}
                      </span>
                    </Stat>
                    <Stat label="Expected by chance">
                      <span className="figure">{fmtPct(r.expectedGreenRate)}</span>
                    </Stat>
                    <Stat label="z">
                      <span className="figure">{fmt(r.z, 2)}</span>
                    </Stat>
                    <Stat label="p (one-sided)">
                      <span className="figure">{fmtP(r.pValue)}</span>
                    </Stat>
                    <div className="col-span-2 sm:col-span-4">
                      <p className="text-xs text-ink-500">
                        Measured over{' '}
                        <span className="figure">{r.trials?.toLocaleString()}</span> distinct word
                        pairs. Repeated pairs are counted once.
                      </p>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-ink-600">{r.detail}</p>
                )}
              </div>
            ))}
          </div>

          <p className="mt-4 rounded border-l-2 border-seal-300 bg-seal-50 px-4 py-3 text-sm leading-relaxed text-seal-700">
            {result.watermark.coverageNotice}
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="rounded-lg border border-ink-200 bg-white">
        <header className="border-b border-ink-100 px-5 py-4">
          <h2 className="font-serif text-lg text-ink-900">Style measurement</h2>
          <p className="mt-1 text-sm text-ink-500">
            How far this document sits from contemporary reference prose in the same language.
          </p>
        </header>

        <div className="px-5 py-4">
          {dist && dist.status === 'computed' ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
                <Stat label="Distance from reference">
                  <span className="figure text-lg">{fmt(dist.compositeDeviation, 2)} SD</span>
                  {dist.compositeInterval ? (
                    <span className="block text-xs text-ink-400">
                      band {fmt(dist.compositeInterval.low, 2)}–{fmt(dist.compositeInterval.high, 2)}
                    </span>
                  ) : (
                    <span className="block text-xs text-ink-400">
                      too few sentences to resample for a band
                    </span>
                  )}
                </Stat>
                <Stat label="Function-word distance">
                  <span className="figure text-lg">{fmt(dist.functionWordDeviation, 2)} SD</span>
                </Stat>
                <Stat label="Measured over">
                  <span className="figure text-lg">{dist.tokens.toLocaleString()}</span>
                  <span className="block text-xs text-ink-400">words in {dist.chunks} chunks</span>
                </Stat>
              </div>

              <h3 className="mt-5 text-sm font-medium text-ink-700">Largest deviations</h3>
              <ul className="mt-2 divide-y divide-ink-100 text-sm">
                {dist.features.slice(0, 5).map((f) => (
                  <li key={f.feature} className="flex items-baseline justify-between gap-4 py-2">
                    <span className="text-ink-600">{featureLabel(f.feature)}</span>
                    <span className="figure text-ink-800">
                      {f.observed.toFixed(2)}{' '}
                      <span className="text-ink-400">
                        (reference {f.baselineMean.toFixed(2)}, {f.z > 0 ? '+' : ''}
                        {f.z.toFixed(2)} SD)
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              {dist.corpus && (
                <p className="mt-4 text-xs leading-relaxed text-ink-400">
                  Reference: {dist.corpus.documents.toLocaleString()} documents /{' '}
                  {dist.corpus.tokens.toLocaleString()} words of {dist.corpus.source}, {dist.corpus.license},
                  retrieved {dist.corpus.retrievedAt.slice(0, 10)}.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-600">{dist?.detail ?? 'No style measurement was made.'}</p>
          )}

          <p className="mt-4 rounded border-l-2 border-ink-300 bg-ink-50 px-4 py-3 text-sm leading-relaxed text-ink-600">
            This is a measure of register, not of provenance. It does not detect AI and it is not
            evidence of who wrote the document. Technical writing, fiction, translated text and
            non-native prose all sit far from an encyclopaedic reference for entirely ordinary reasons.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <PassageBreakdown result={result} />

      {/* ---------------------------------------------------------------- */}
      <section className="rounded-lg border border-ink-200 bg-white">
        <header className="border-b border-ink-100 px-5 py-4">
          <h2 className="font-serif text-lg text-ink-900">Stated limits</h2>
        </header>
        <ul className="space-y-3 px-5 py-4 text-sm leading-relaxed text-ink-600">
          {result.limits.map((limit, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-300" />
              <span>{limit}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-ink-100 px-5 py-4 text-xs text-ink-400">
          <p>
            Document SHA-256 <span className="figure break-all">{result.documentHash}</span>
          </p>
          <p className="mt-1">
            Analysed {result.analyzedAt} · engine {result.engineVersion} · language{' '}
            {result.language.name} ({result.language.determinedBy === 'caller' ? 'you chose it' : 'measured'})
          </p>
        </div>
      </section>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-ink-800">{children}</dd>
    </div>
  )
}

const FEATURE_LABELS: Record<string, string> = {
  meanWordLength: 'Mean word length (characters)',
  mattr: 'Vocabulary variety (moving-average TTR)',
  hapaxRatio: 'Share of words used exactly once',
  meanSentenceLength: 'Mean sentence length (words)',
  sentenceLengthCv: 'Sentence-length variability',
  functionWordRate: 'Function words per 1,000 words',
  commaRate: 'Commas per 1,000 words',
  semicolonRate: 'Semicolons per 1,000 words',
  colonRate: 'Colons per 1,000 words',
  dashRate: 'Dashes per 1,000 words',
  quoteRate: 'Quotation marks per 1,000 words',
  parenthesisRate: 'Parentheses per 1,000 words',
  exclamationRate: 'Exclamation marks per 1,000 words',
  questionRate: 'Question marks per 1,000 words',
}

const featureLabel = (name: string) => FEATURE_LABELS[name] ?? name

/** A null figure never renders as a number. */
function fmt(value: number | null | undefined, digits: number): string {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'not computed'
    : value.toFixed(digits)
}

function fmtPct(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'not computed'
    : `${(value * 100).toFixed(1)}%`
}

function fmtP(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'not computed'
  if (value < 1e-6) return '< 0.000001'
  return value.toFixed(6)
}
