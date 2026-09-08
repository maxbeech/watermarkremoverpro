'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { RewriteResult } from '@/lib/rewrite'
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
export function DeepDive({ result }: { result: RewriteResult }) {
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
          <span className="mt-0.5 block text-[13px] text-ink-500">
            Every keyed watermark test, the style-distance channel, each AI-style signal and the
            per-passage breakdown, before and after. The same check the dedicated page runs.
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
            <ResultView result={analysis} />
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

/** What Pro would additionally have caught here, counted on this document. */
export function ExtendedLibraryNote({ result }: { result: RewriteResult }) {
  if (result.additionalTellsInExtendedLibrary <= 0) return null
  return (
    <p className="rounded-[var(--radius-control)] border border-seal-200 bg-seal-50 px-4 py-3 text-sm leading-relaxed text-seal-800">
      The extended AI-tell library would have swapped{' '}
      <span className="figure">{result.additionalTellsInExtendedLibrary}</span> further{' '}
      {result.additionalTellsInExtendedLibrary === 1 ? 'phrase' : 'phrases'} in this document, mostly
      the announcement and marketing register. That library is what Pro adds, and this is a count
      measured on your actual text rather than an estimate.{' '}
      <Link href="/pricing" className="font-semibold underline underline-offset-2">
        See Pro
      </Link>
      .
    </p>
  )
}
