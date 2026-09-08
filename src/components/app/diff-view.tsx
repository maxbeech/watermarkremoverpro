'use client'

import { useMemo, useState } from 'react'
import { diffStats, diffWords, type DiffPart, type ParagraphAlignment } from '@/lib/diff/words'
import { buttonClass } from '@/components/brand/ui'

/**
 * The comparison, paragraph by paragraph.
 *
 * Two views of the same computed diff. Split puts the draft and the rewrite
 * side by side, which is what someone reviewing a change wants; unified puts
 * removals and insertions in one flow, which is what someone reading for sense
 * wants. Neither is a separate calculation: both render the same `DiffPart[]`,
 * so they can never disagree about what changed.
 *
 * Selection lives here too, because the thing a reader wants to rewrite again
 * is the paragraph they are looking at, and making them scroll to a separate
 * list of paragraph numbers to say so is how a good idea becomes an unused
 * feature.
 */

export type DiffMode = 'split' | 'unified'

export function DiffView({
  alignment,
  selected,
  onSelectedChange,
  rephrased,
  busyParagraph,
  onRephrase,
  onRestore,
  disabled,
}: {
  alignment: ParagraphAlignment
  selected: number[]
  onSelectedChange: (next: number[]) => void
  /** Paragraph index to how many extra passes it has had. */
  rephrased: Record<number, number>
  /** The paragraph currently being rewritten, if any. */
  busyParagraph: number | null
  onRephrase: (indices: number[]) => void
  onRestore: (index: number) => void
  disabled: boolean
}) {
  const [mode, setMode] = useState<DiffMode>('split')

  const diffs = useMemo(
    () => alignment.pairs.map((pair) => diffWords(pair.before, pair.after)),
    [alignment.pairs],
  )

  const changedIndexes = useMemo(
    () => alignment.pairs.filter((p) => p.changed).map((p) => p.index),
    [alignment.pairs],
  )

  if (!alignment.aligned) {
    return (
      <section className="rounded-[var(--radius-panel)] border border-ink-200 bg-white p-5">
        <h2 className="t-heading text-ink-900">Comparison</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          {alignment.reason} A paragraph-by-paragraph comparison would have to guess which paragraph
          became which, and a wrong guess would point the per-paragraph controls at the wrong text,
          so neither is offered for this document. The full draft and the full rewrite are both
          above.
        </p>
      </section>
    )
  }

  const toggle = (index: number) => {
    onSelectedChange(
      selected.includes(index) ? selected.filter((i) => i !== index) : [...selected, index].sort((a, b) => a - b),
    )
  }

  return (
    <section className="overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
        <div>
          <h2 className="t-heading text-ink-900">Comparison</h2>
          <p className="mt-0.5 text-[13px] text-ink-500">
            <span className="figure">{changedIndexes.length}</span> of{' '}
            <span className="figure">{alignment.pairs.length}</span> paragraph
            {alignment.pairs.length === 1 ? '' : 's'} changed. Pick any of them to rewrite again on
            its own.
          </p>
        </div>

        <div
          role="group"
          aria-label="Comparison layout"
          className="inline-flex rounded-full border border-ink-200 p-0.5"
        >
          {(['split', 'unified'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={
                'rounded-full px-3.5 py-1.5 text-[13px] font-semibold capitalize transition-colors ' +
                (mode === value ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50')
              }
            >
              {value}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 bg-ink-50 px-5 py-3">
        <button
          type="button"
          disabled={disabled || selected.length === 0}
          onClick={() => onRephrase(selected)}
          className={buttonClass('primary', '!px-4 !py-2 !text-[13px]')}
        >
          Rewrite {selected.length === 0 ? 'selected paragraphs' : `${selected.length} selected again`}
        </button>
        <button
          type="button"
          disabled={disabled || changedIndexes.length === 0}
          onClick={() => onSelectedChange(changedIndexes)}
          className={buttonClass('quiet', '!px-4 !py-2 !text-[13px]')}
        >
          Select every changed paragraph
        </button>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectedChange([])}
            className={buttonClass('ghost', '!px-3 !py-2 !text-[13px]')}
          >
            Clear selection
          </button>
        )}
      </div>

      <ol className="divide-y divide-ink-100">
        {alignment.pairs.map((pair, index) => (
          <li key={pair.index} className={busyParagraph === pair.index ? 'bg-seal-50' : undefined}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-ink-700">
                <input
                  type="checkbox"
                  checked={selected.includes(pair.index)}
                  onChange={() => toggle(pair.index)}
                  disabled={disabled}
                  className="h-4 w-4 accent-[var(--color-seal-600)]"
                />
                Paragraph {index + 1}
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <StatusChip
                  changed={pair.changed}
                  passes={rephrased[pair.index] ?? 0}
                  parts={diffs[index]}
                />
                {(rephrased[pair.index] ?? 0) > 0 && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRestore(pair.index)}
                    className={buttonClass('ghost', '!px-3 !py-1.5 !text-[13px]')}
                  >
                    Restore my original
                  </button>
                )}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRephrase([pair.index])}
                  className={buttonClass('quiet', '!px-3.5 !py-1.5 !text-[13px]')}
                >
                  {busyParagraph === pair.index ? 'Rewriting…' : 'Rewrite again'}
                </button>
              </div>
            </div>

            <div className="px-5 pb-4">
              {mode === 'split' ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <Pane label="Your draft" tone="ink">
                    <Rendered parts={diffs[index]} side="before" />
                  </Pane>
                  <Pane label="Rewritten" tone="mint">
                    <Rendered parts={diffs[index]} side="after" />
                  </Pane>
                </div>
              ) : (
                <Pane label="Removed and added, in one flow" tone="ink">
                  <Rendered parts={diffs[index]} side="unified" />
                </Pane>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function StatusChip({
  changed,
  passes,
  parts,
}: {
  changed: boolean
  passes: number
  parts: DiffPart[]
}) {
  if (!changed) {
    return (
      <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[12px] font-medium text-ink-600">
        Unchanged
      </span>
    )
  }
  const { added, removed } = diffStats(parts)
  return (
    <span className="figure rounded-full bg-mint-100 px-2.5 py-1 text-[12px] font-medium text-mint-700">
      +{added} / -{removed} words{passes > 0 ? ` · ${passes + 1} passes` : ''}
    </span>
  )
}

const PANE_TONES = {
  ink: 'border-ink-200 bg-ink-50',
  mint: 'border-mint-200 bg-mint-100/50',
} as const

function Pane({
  label,
  tone,
  children,
}: {
  label: string
  tone: keyof typeof PANE_TONES
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-[var(--radius-control)] border p-3.5 ${PANE_TONES[tone]}`}>
      <p className="t-eyebrow mb-2 text-ink-500">{label}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">{children}</p>
    </div>
  )
}

/**
 * One diff, rendered for one of three columns.
 *
 * `before` hides insertions, `after` hides deletions, and `unified` shows both
 * with removals struck through. Colour carries the same meaning it does
 * everywhere else in the product: mint for what the rewrite produced, rose for
 * what it took out.
 */
function Rendered({ parts, side }: { parts: DiffPart[]; side: 'before' | 'after' | 'unified' }) {
  return (
    <>
      {parts.map((part, i) => {
        if (part.op === 'equal') return <span key={i}>{part.text}</span>
        if (part.op === 'delete') {
          if (side === 'after') return null
          return (
            <del
              key={i}
              className={
                side === 'unified'
                  ? 'bg-rose-100 text-rose-700 no-underline line-through decoration-rose-500'
                  : 'rounded bg-rose-100 px-0.5 text-rose-700 no-underline'
              }
            >
              {part.text}
            </del>
          )
        }
        if (side === 'before') return null
        return (
          <ins key={i} className="rounded bg-mint-200 px-0.5 text-mint-700 no-underline">
            {part.text}
          </ins>
        )
      })}
    </>
  )
}
