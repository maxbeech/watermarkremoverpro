'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { RewriteResult } from '@/lib/rewrite'
import { Band } from '@/components/brand/band'
import { ResultView } from '@/components/checker/result-view'
import { buttonClass } from '@/components/brand/ui'

/**
 * The output screen.
 *
 * One page carrying both halves of what the visitor came for: the cleaned-up
 * text they can take away, and the detector's own reading of that text. The
 * analysis is not a second run. `documentAfter` is the measurement the
 * rewrite engine already made in order to decide what to target, so what is
 * shown here is exactly the arithmetic that produced the result above it.
 *
 * Deliberately opinionated about ordering: text first, because that is the
 * deliverable, then what changed, then the full analysis for anyone who wants
 * it. The old flow put four panels of statistics above the text.
 */
export function WorkspaceResult({
  result,
  engineUsed,
  downgraded,
  onStartOver,
}: {
  result: RewriteResult
  engineUsed: string
  downgraded: string | null
  onStartOver: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(true)
  const touched = result.passages.filter((p) => p.chosen !== null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.revisedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be denied. The text is selectable below either way.
    }
  }

  const download = () => {
    // A local Blob URL. Nothing is uploaded to produce this file.
    const blob = new Blob([result.revisedText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cleaned-text.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mw-rise space-y-5">
      {/* ------------------------------------------------------ the deliverable */}
      <section className="overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white shadow-[var(--shadow-raised)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
          <div>
            <h2 className="t-heading text-ink-900">Your rewritten text</h2>
            <p className="mt-0.5 text-[13px] text-ink-500">{engineUsed}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className={buttonClass('quiet', '!px-4 !py-2 !text-[13px]')}>
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button type="button" onClick={download} className={buttonClass('quiet', '!px-4 !py-2 !text-[13px]')}>
              Download .txt
            </button>
            <button type="button" onClick={onStartOver} className={buttonClass('primary', '!px-4 !py-2 !text-[13px]')}>
              Start over
            </button>
          </div>
        </header>

        <textarea
          readOnly
          value={result.revisedText}
          rows={14}
          className="w-full resize-y bg-white px-5 py-5 text-[15px] leading-relaxed text-ink-800 outline-none"
        />
      </section>

      {downgraded && (
        <p className="rounded-[var(--radius-control)] border border-signal-200 bg-signal-50 px-4 py-3 text-sm leading-relaxed text-signal-800">
          {downgraded}{' '}
          <Link href="/pricing" className="font-semibold underline underline-offset-2">
            What Pro adds
          </Link>
          .
        </p>
      )}

      {/* --------------------------------------------------------- what changed */}
      <ChangeSummary result={result} touched={touched.length} />

      <JudgementCalls result={result} />

      {touched.length > 0 && (
        <section className="overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white">
          <header className="border-b border-ink-100 px-5 py-3.5">
            <h2 className="t-heading text-ink-900">Every passage that changed ({touched.length})</h2>
          </header>
          <div className="divide-y divide-ink-100">
            {touched.map((p) => (
              <details key={p.index} className="group px-5 py-3.5">
                <summary className="cursor-pointer list-none text-sm font-medium text-ink-800">
                  <span className="mr-2 inline-block text-ink-400 transition-transform group-open:rotate-90">
                    ›
                  </span>
                  Passage {p.index + 1}
                  {p.beforeZ !== null && p.afterZ !== null && (
                    <span className="figure ml-2 font-normal text-ink-500">
                      z {p.beforeZ.toFixed(2)} → {p.afterZ.toFixed(2)}
                    </span>
                  )}
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="t-eyebrow mb-1.5 text-ink-500">Before</p>
                    <p className="rounded-[var(--radius-control)] bg-ink-50 p-3 text-sm leading-relaxed text-ink-600">
                      {p.original}
                    </p>
                  </div>
                  <div>
                    <p className="t-eyebrow mb-1.5 text-mint-700">After</p>
                    <p className="rounded-[var(--radius-control)] bg-mint-100 p-3 text-sm leading-relaxed text-ink-800">
                      {p.chosen}
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------- the check, free */}
      <section className="overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white">
        <button
          type="button"
          onClick={() => setShowAnalysis((v) => !v)}
          aria-expanded={showAnalysis}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <span>
            <h2 className="t-heading text-ink-900">
              Full detector analysis of your rewritten text
            </h2>
            <span className="mt-0.5 block text-[13px] text-ink-500">
              The same check the dedicated page runs, already computed as part of this rewrite.
            </span>
          </span>
          <span className="text-[13px] font-semibold text-seal-700">
            {showAnalysis ? 'Hide' : 'Show'}
          </span>
        </button>

        {showAnalysis && (
          <div className="border-t border-ink-100 bg-ink-50 px-4 py-5 sm:px-5">
            {result.documentAfter ? (
              <ResultView result={result.documentAfter} />
            ) : (
              <p className="text-sm leading-relaxed text-ink-600">
                No analysis was produced for the rewritten text. This happens when the document is
                too short for the detector to measure anything it could stand behind. The rewrite
                above still ran, but there is no measurement to report alongside it.
              </p>
            )}
          </div>
        )}
      </section>

      <div className="space-y-1.5 rounded-[var(--radius-control)] border border-ink-200 bg-ink-50 px-4 py-3.5 text-xs leading-relaxed text-ink-600">
        {result.limits.map((limit) => (
          <p key={limit}>{limit}</p>
        ))}
      </div>
    </div>
  )
}

/**
 * What the pass actually did, as counts measured on this document.
 *
 * Nothing here is an estimate or an illustration; every number is read off the
 * result the engine returned, and a figure that could not be computed is not
 * rendered rather than being shown as zero.
 */
function ChangeSummary({ result, touched }: { result: RewriteResult; touched: number }) {
  const beforeZ = result.documentBefore?.watermark.results[0]?.z ?? null
  const afterZ = result.documentAfter?.watermark.results[0]?.z ?? null
  const beforeSurvived = result.documentBefore?.passageCorrection?.survived ?? null
  const afterSurvived = result.documentAfter?.passageCorrection?.survived ?? null

  const nothingFound =
    touched === 0 &&
    result.tellChangeCount === 0 &&
    result.flaggedStructures.length === 0 &&
    result.elevatedVocabulary.length === 0

  /**
   * How many passages the document HAS, not how many the engine targeted.
   *
   * `result.passages` only ever contains passages that were selected for a
   * full rewrite, so when the targeting picked none this tile used to read
   * "0 of 0" next to a tile saying six AI-tell swaps had happened. A reader
   * has no way to tell whether that means "nothing needed doing" or "the tool
   * is broken". Counting against the document is the number they can check.
   */
  const passagesInDocument =
    result.documentBefore?.passages.length ?? result.documentAfter?.passages.length ?? null

  return (
    <section className="rounded-[var(--radius-panel)] border border-ink-200 bg-white p-5">
      <h2 className="t-heading text-ink-900">What changed</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Metric
          label="Passages rewritten"
          value={passagesInDocument === null ? String(touched) : `${touched} of ${passagesInDocument}`}
          tone="seal"
        />
        <Metric label="AI-tell swaps" value={result.tellChangeCount.toLocaleString()} tone="mint" />
        <Metric
          label="Time on your device"
          value={
            result.processingTimeMs < 1000
              ? `${Math.round(result.processingTimeMs)}ms`
              : `${(result.processingTimeMs / 1000).toFixed(1)}s`
          }
          tone="ink"
        />
      </div>

      {touched === 0 && result.passages.length === 0 && !nothingFound && (
        <p className="mt-4 rounded-[var(--radius-control)] bg-ink-50 px-4 py-3 text-sm leading-relaxed text-ink-600">
          No passage carried enough measurable watermark or style evidence to be worth rewriting at
          this strength, so none was replaced. The AI-tell pass still ran across the whole document,
          and anything it changed is counted above. A higher strength targets more passages.
        </p>
      )}

      {(beforeZ !== null && afterZ !== null) || (beforeSurvived !== null && afterSurvived !== null) ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {beforeZ !== null && afterZ !== null && (
            <div>
              <p className="text-[13px] font-medium text-ink-600">Watermark signal (z)</p>
              <p className="figure mt-1 text-2xl text-ink-900">
                {beforeZ.toFixed(2)} → {afterZ.toFixed(2)}
              </p>
              <Band
                value={afterZ}
                reference={0}
                min={Math.min(-4, beforeZ - 1, afterZ - 1)}
                max={Math.max(4, beforeZ + 1, afterZ + 1)}
                tone={Math.abs(afterZ) > 2 ? 'signal' : 'seal'}
                className="mt-3"
                title={`Watermark z-score after the rewrite: ${afterZ.toFixed(2)}`}
              />
            </div>
          )}
          {beforeSurvived !== null && afterSurvived !== null && (
            <div>
              <p className="text-[13px] font-medium text-ink-600">
                Passages surviving multiple-comparison correction
              </p>
              <p className="figure mt-1 text-2xl text-ink-900">
                {beforeSurvived} → {afterSurvived}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {nothingFound && (
        <p className="mt-4 rounded-[var(--radius-control)] bg-mint-100 px-4 py-3 text-sm leading-relaxed text-mint-700">
          No detectable AI-style evidence was found to reduce at this strength. Either this passage
          already reads as ordinary prose, or a higher strength would find more.
        </p>
      )}

      {touched === 0 && result.passages.length > 0 && (
        <p className="mt-4 rounded-[var(--radius-control)] bg-signal-50 px-4 py-3 text-sm leading-relaxed text-signal-800">
          {result.passages.length} passage{result.passages.length === 1 ? ' was' : 's were'} targeted,
          but no candidate rewrite preserved the numbers, negations and named entities in the
          original while staying close enough in meaning. Nothing unsafe was substituted, so those
          passages are unchanged.
        </p>
      )}

      {result.additionalTellsInExtendedLibrary > 0 && (
        <p className="mt-4 rounded-[var(--radius-control)] bg-seal-50 px-4 py-3 text-sm leading-relaxed text-seal-800">
          The extended AI-tell library would have swapped{' '}
          <span className="figure">{result.additionalTellsInExtendedLibrary}</span> further{' '}
          {result.additionalTellsInExtendedLibrary === 1 ? 'phrase' : 'phrases'} in this document,
          mostly the announcement and marketing register. That library is what Pro adds, and this
          is a count measured on your actual text rather than an estimate.{' '}
          <Link href="/pricing" className="font-semibold underline underline-offset-2">
            See Pro
          </Link>
          .
        </p>
      )}
    </section>
  )
}

const METRIC_TONES = {
  seal: 'bg-seal-50 text-seal-800',
  mint: 'bg-mint-100 text-mint-700',
  ink: 'bg-ink-50 text-ink-700',
} as const

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: keyof typeof METRIC_TONES
}) {
  return (
    <div className={`rounded-[var(--radius-control)] px-4 py-3 ${METRIC_TONES[tone]}`}>
      <p className="text-[13px] font-medium opacity-80">{label}</p>
      <p className="figure mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}

/**
 * What survived the pass, and why.
 *
 * Measured on the FINAL text, so a recurring word the vocabulary pass already
 * fixed does not appear. What is left is what the engine genuinely could not
 * fix on its own: a construction whose rewrite depends on what the sentence is
 * saying, a word with no same-slot plain equivalent, or a single occurrence
 * that is a word choice rather than a tell.
 */
function JudgementCalls({ result }: { result: RewriteResult }) {
  const triadic = result.flaggedStructures.filter((f) => f.kind === 'triadic-list')
  const parallelism = result.flaggedStructures.filter((f) => f.kind === 'negative-parallelism')
  const vocabulary = result.elevatedVocabulary.slice(0, 8)

  // One three-item list is just a sentence. Three of them is a habit.
  const showTriadic = triadic.length >= 3
  const showParallelism = parallelism.length > 0
  const showVocabulary = vocabulary.length >= 2
  if (!showTriadic && !showParallelism && !showVocabulary) return null

  return (
    <section className="rounded-[var(--radius-panel)] border border-ink-200 bg-white p-5">
      <h2 className="t-heading text-ink-900">Left for you to judge</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        Still present after the rewrite. Either the fix depends on what the sentence is actually
        saying, or the word has no plain equivalent that drops into the same slot. A higher strength
        rewrites more of the vocabulary below; the constructions need you, or the Pro engine.
      </p>
      <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-700">
        {showTriadic && (
          <li>
            <span className="font-semibold text-ink-900">{triadic.length} three-item lists</span>{' '}
            <span className="text-ink-500">
              (&ldquo;X, Y, and Z&rdquo;), for example{' '}
              {triadic.slice(0, 2).map((t) => `“${t.text}”`).join(', ')}. Ordinary once; a tic when
              it recurs.
            </span>
          </li>
        )}
        {showParallelism && (
          <li>
            <span className="font-semibold text-ink-900">
              {parallelism.length} &ldquo;not just X, but Y&rdquo; construction
              {parallelism.length === 1 ? '' : 's'}
            </span>{' '}
            <span className="text-ink-500">
              for example &ldquo;{parallelism[0].text.trim()}&rdquo;. One of the most reliable
              structural tells in current model output.
            </span>
          </li>
        )}
        {showVocabulary && (
          <li>
            <span className="font-semibold text-ink-900">Elevated AI-associated vocabulary</span>{' '}
            <span className="text-ink-500">
              {vocabulary.map((v) => `${v.word} (${v.count})`).join(', ')}. Each is ordinary English;
              the density across a document is what reads as generated.
            </span>
          </li>
        )}
      </ul>
    </section>
  )
}
