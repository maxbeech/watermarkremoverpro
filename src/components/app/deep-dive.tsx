'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { RewriteResult } from '@/lib/rewrite'
import type { MlClassifierResult } from '@/lib/detector/ml-classifier'
import { ResultView } from '@/components/checker/result-view'

/**
 * The full arithmetic, folded away until it is asked for.
 *
 * Nothing here is a summary or a simplification: it is the same `ResultView`
 * the dedicated check page renders, over the analysis this rewrite already
 * computed in order to decide what to target. It is collapsed by default
 * because the question someone arrives with is "is my draft still going to
 * read as generated", not "what is the function-word distance in standard
 * deviations", and the second question deserves a complete answer rather than
 * a permanent seat at the top of the screen.
 */
export function DeepDive({
  result,
  mlClassifier = null,
  mlClassifierLoading = false,
}: {
  result: RewriteResult
  /**
   * The model classifier only ever runs on the final rewritten text (see
   * useMlClassifier), never on the pre-rewrite draft, so this is shown only
   * when `side` is 'after'. Otherwise ResultView's own `result.mlClassifier`
   * (always null on an orchestrator-internal analysis) is the honest answer.
   */
  mlClassifier?: MlClassifierResult | null
  mlClassifierLoading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [side, setSide] = useState<'after' | 'before'>('after')
  const analysis = side === 'after' ? result.documentAfter : result.documentBefore

  return (
    <section className="overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-ink-50"
      >
        <span>
          <span className="t-heading block text-ink-900">The full analysis</span>
          <span className="mt-0.5 block text-[12px] text-ink-500">
            Every test, every signal, per passage, before and after.
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-semibold text-seal-700">
          {open ? 'Hide' : 'Show'}
        </span>
      </button>

      {open && (
        <div className="border-t border-ink-100 bg-ink-50 px-4 py-5 sm:px-5">
          <div
            role="group"
            aria-label="Which version to analyse"
            className="mb-5 inline-flex rounded-full border border-ink-200 bg-white p-0.5"
          >
            {(
              [
                ['after', 'The rewrite'],
                ['before', 'Your draft'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={side === value}
                onClick={() => setSide(value)}
                className={
                  'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ' +
                  (side === value ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50')
                }
              >
                {label}
              </button>
            ))}
          </div>

          {analysis ? (
            <ResultView
              result={analysis}
              mlClassifier={side === 'after' ? mlClassifier : null}
              mlClassifierLoading={side === 'after' && mlClassifierLoading}
            />
          ) : (
            <p className="rounded-[var(--radius-control)] border border-ink-200 bg-white px-4 py-3 text-sm leading-relaxed text-ink-600">
              No analysis was produced for this version. That happens when the document is too short
              for the detector to measure anything it could stand behind. The rewrite still ran;
              there is simply no measurement to report next to it.
            </p>
          )}
        </div>
      )}
    </section>
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
export function JudgementCalls({ result }: { result: RewriteResult }) {
  const triadic = result.flaggedStructures.filter((f) => f.kind === 'triadic-list')
  const parallelism = result.flaggedStructures.filter((f) => f.kind === 'negative-parallelism')
  const vocabulary = result.elevatedVocabulary.slice(0, 8)

  // One three-item list is just a sentence. Three of them is a habit.
  const showTriadic = triadic.length >= 3
  const showParallelism = parallelism.length > 0
  const showVocabulary = vocabulary.length >= 2
  if (!showTriadic && !showParallelism && !showVocabulary) return null

  return (
    <section className="rounded-[var(--radius-panel)] border border-ink-200 bg-white px-5 py-5">
      <h2 className="t-eyebrow text-ink-500">Left for you to judge</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-400">
        Still here after the rewrite, because the fix depends on what the sentence means.
      </p>
      <ul className="mt-3 space-y-2">
        {showTriadic && (
          <Leftover count={triadic.length} label="three-item lists" example={triadic[0].text} />
        )}
        {showParallelism && (
          <Leftover
            count={parallelism.length}
            label={`“not just X, but Y” construction${parallelism.length === 1 ? '' : 's'}`}
            example={parallelism[0].text.trim()}
          />
        )}
        {showVocabulary && (
          <li className="rounded-[var(--radius-control)] bg-ink-50 px-3 py-2">
            <p className="text-[12px] font-semibold text-ink-700">AI-associated vocabulary</p>
            <p className="mt-1 flex flex-wrap gap-1">
              {vocabulary.map((v) => (
                <span
                  key={v.word}
                  className="rounded-full bg-white px-2 py-0.5 text-[11px] text-ink-600 ring-1 ring-ink-200"
                >
                  {v.word} <span className="figure text-ink-400">{v.count}</span>
                </span>
              ))}
            </p>
          </li>
        )}
      </ul>
    </section>
  )
}

function Leftover({ count, label, example }: { count: number; label: string; example: string }) {
  return (
    <li className="rounded-[var(--radius-control)] bg-ink-50 px-3 py-2">
      <p className="text-[12px] font-semibold text-ink-700">
        <span className="figure">{count}</span> {label}
      </p>
      <p className="mt-0.5 truncate text-[11px] italic text-ink-500">{example}</p>
    </li>
  )
}

/** What Pro would additionally have caught here, counted on this document. */
export function ExtendedLibraryNote({ result }: { result: RewriteResult }) {
  if (result.additionalTellsInExtendedLibrary <= 0) return null
  return (
    <Link
      href="/pricing"
      className="flex items-center gap-3 rounded-[var(--radius-panel)] border border-seal-200 bg-seal-50 px-4 py-3 text-seal-800 transition-colors hover:bg-seal-100"
    >
      <span className="figure text-2xl font-semibold leading-none">
        +{result.additionalTellsInExtendedLibrary}
      </span>
      <span className="text-[12px] leading-relaxed">
        more {result.additionalTellsInExtendedLibrary === 1 ? 'phrase' : 'phrases'} the extended
        library would have swapped here. Counted on your text, not estimated.
      </span>
    </Link>
  )
}
