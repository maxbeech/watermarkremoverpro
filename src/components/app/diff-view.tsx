'use client'

import { useEffect, useMemo, useState } from 'react'
import { diffStats, diffWords, type DiffPart, type ParagraphAlignment } from '@/lib/diff/words'
import { lookupWordAlternatives, withEdgePunctuationOf } from '@/lib/diff/word-alternatives'
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
 * The editable view of the rewritten text on its own is not here: it has
 * nothing to do with the computed diff. See ./result-editor.tsx, which owns the
 * tabs, the header and Copy/Download/rewrite-again, and renders this component
 * only under the tab that is actually a comparison.
 *
 * Selection lives here too, because the thing a reader wants to rewrite again
 * is the paragraph they are looking at, and making them scroll to a separate
 * list of paragraph numbers to say so is how a good idea becomes an unused
 * feature.
 */

/** How the two sides are arranged. Not a mode of the panel: the panel's tabs are text or changes. */
export type DiffLayout = 'split' | 'unified'

export function DiffView({
  layout,
  alignment,
  selected,
  onSelectedChange,
  rephrased,
  busyParagraph,
  onRephrase,
  onRestore,
  onSwapWord,
  disabled,
}: {
  layout: DiffLayout
  alignment: ParagraphAlignment
  selected: number[]
  onSelectedChange: (next: number[]) => void
  /** Paragraph index to how many extra passes it has had. */
  rephrased: Record<number, number>
  /** The paragraph currently being rewritten, if any. */
  busyParagraph: number | null
  onRephrase: (indices: number[]) => void
  onRestore: (index: number) => void
  /**
   * Replace one changed span in the rewritten text with `replacement`
   * (the original word, or one of its listed alternatives). `start`/`end`
   * are absolute offsets into the full revised text, not the paragraph.
   * Goes through the same save path a hand edit in the Result tab already
   * uses (see ResultEditor's onEditText), so a word swap is measured again
   * exactly like any other edit.
   */
  onSwapWord: (start: number, end: number, replacement: string) => void
  disabled: boolean
}) {
  const diffs = useMemo(
    () => alignment.pairs.map((pair) => diffWords(pair.before, pair.after)),
    [alignment.pairs],
  )

  const changedIndexes = useMemo(
    () => alignment.pairs.filter((p) => p.changed).map((p) => p.index),
    [alignment.pairs],
  )

  // Most documents have far more unchanged paragraphs than changed ones, and a
  // full wall of "Unchanged" rows is exactly what buried the one thing worth
  // reading. Changed paragraphs show by default; the rest are a click away,
  // not scrolled past.
  const [showUnchanged, setShowUnchanged] = useState(false)
  // Which changed span currently has its alternatives open, as
  // `${paragraphIndex}:${unitIndex}`. One at a time: opening a second one
  // closes whichever was open, the same way a menu would.
  const [openUnit, setOpenUnit] = useState<string | null>(null)
  // The word-swap popover now floats (see WordSwap below) instead of sitting
  // inline in the text, so a click anywhere else in the document no longer
  // lands on it by accident the way clicking past an inline panel did. A
  // click that did not land on ANY word-swap trigger or popover (both carry
  // `data-word-swap`, see WordSwap) closes whichever one is open. A click on
  // a different word's own trigger is left alone: that trigger's own
  // onClick already handles switching which unit is open, and closing it
  // here first would just fight that.
  useEffect(() => {
    if (!openUnit) return
    const closeIfOutside = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target?.closest?.('[data-word-swap]')) setOpenUnit(null)
    }
    document.addEventListener('mousedown', closeIfOutside)
    return () => document.removeEventListener('mousedown', closeIfOutside)
  }, [openUnit])
  const rows = useMemo(
    () => alignment.pairs.map((pair, i) => ({ pair, diff: diffs[i] })),
    [alignment.pairs, diffs],
  )
  const unchangedCount = rows.length - changedIndexes.length
  const visibleRows = showUnchanged ? rows : rows.filter((r) => r.pair.changed)

  if (!alignment.aligned) {
    return (
      <p className="px-5 py-5 text-sm leading-relaxed text-ink-600">
        {alignment.reason} A paragraph-by-paragraph comparison would have to guess which paragraph
        became which, and a wrong guess would point the per-paragraph controls at the wrong text, so
        neither is offered for this document. The Result tab has the full rewrite, editable as
        usual.
      </p>
    )
  }

  const toggle = (index: number) => {
    onSelectedChange(
      selected.includes(index) ? selected.filter((i) => i !== index) : [...selected, index].sort((a, b) => a - b),
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-ink-100 bg-ink-50 px-5 py-2.5 text-[12px]">
        <p className="text-ink-500">
          <span className="figure font-semibold text-ink-800">{changedIndexes.length}</span> of{' '}
          <span className="figure">{alignment.pairs.length}</span> changed
          {changedIndexes.length > 0 && (
            <span className="text-ink-400"> · click a changed word to see the original or another option</span>
          )}
        </p>

        {selected.length > 0 ? (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRephrase(selected)}
              className={buttonClass('primary', '!px-3 !py-1.5 !text-[12px]')}
            >
              Rewrite {selected.length} again
            </button>
            <button
              type="button"
              onClick={() => onSelectedChange([])}
              className="font-medium text-ink-500 underline underline-offset-2 hover:text-ink-800"
            >
              Clear
            </button>
          </>
        ) : (
          changedIndexes.length > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectedChange(changedIndexes)}
              className="font-medium text-seal-700 underline underline-offset-2 disabled:opacity-50"
            >
              Select all changed
            </button>
          )
        )}

        {unchangedCount > 0 && (
          <button
            type="button"
            onClick={() => setShowUnchanged((v) => !v)}
            className="ml-auto font-medium text-ink-500 underline underline-offset-2 hover:text-ink-800"
          >
            {showUnchanged ? 'Hide unchanged' : `Show ${unchangedCount} unchanged`}
          </button>
        )}
      </div>

      {visibleRows.length === 0 ? (
        <p className="px-5 py-5 text-sm leading-relaxed text-ink-600">
          No paragraph changed in this pass.{' '}
          <button
            type="button"
            onClick={() => setShowUnchanged(true)}
            className="font-semibold text-seal-700 underline underline-offset-2"
          >
            Show all {rows.length} paragraphs
          </button>{' '}
          to compare them anyway.
        </p>
      ) : (
        <ol className="divide-y divide-ink-100">
          {visibleRows.map(({ pair, diff }) => (
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
                  Paragraph {pair.index + 1}
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip changed={pair.changed} passes={rephrased[pair.index] ?? 0} parts={diff} />
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
                {layout === 'split' ? (
                  <div className="grid gap-3 @md:grid-cols-2">
                    <Pane label="Your draft" tone="ink">
                      <Rendered parts={diff} side="before" />
                    </Pane>
                    <Pane label="Rewritten" tone="mint">
                      <Rendered
                        parts={diff}
                        side="after"
                        pairStart={pair.start}
                        openKey={openUnit}
                        keyPrefix={`${pair.index}`}
                        onToggle={setOpenUnit}
                        onSwapWord={onSwapWord}
                      />
                    </Pane>
                  </div>
                ) : (
                  <Pane label="Removed and added, in one flow" tone="ink">
                    <Rendered
                      parts={diff}
                      side="unified"
                      pairStart={pair.start}
                      openKey={openUnit}
                      keyPrefix={`${pair.index}`}
                      onToggle={setOpenUnit}
                      onSwapWord={onSwapWord}
                    />
                  </Pane>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
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

interface ChangeUnit {
  kind: 'change'
  /** The word/phrase as it stood in the draft. Empty for a pure insertion. */
  original: string
  /** What the rewrite has there now. Empty for a pure deletion. */
  current: string
  /** Offsets of `current` in the paragraph's rewritten text (a zero-width point when `current` is empty). */
  afterStart: number
  afterEnd: number
}
type RenderUnit = { kind: 'equal'; text: string } | ChangeUnit

/**
 * Turns a flat `DiffPart[]` into equal runs and "changed span" units, pairing
 * an adjacent delete and insert (in either order, since the LCS diff can emit
 * either first) into one unit standing for a single word or phrase that
 * became another, and tracking each unit's offset range in the rewritten
 * paragraph along the way. That range is what a click on the unit later
 * splices, via `onSwapWord`, so it has to be computed once, here, rather than
 * re-derived from rendered DOM text at click time.
 */
function buildUnits(parts: DiffPart[]): RenderUnit[] {
  const units: RenderUnit[] = []
  let afterCursor = 0
  let i = 0
  while (i < parts.length) {
    const part = parts[i]
    if (part.op === 'equal') {
      units.push({ kind: 'equal', text: part.text })
      afterCursor += part.text.length
      i++
      continue
    }

    let original = part.op === 'delete' ? part.text : ''
    let current = part.op === 'insert' ? part.text : ''
    const next = parts[i + 1]
    let consumed = 1
    if (next && next.op !== 'equal' && next.op !== part.op) {
      if (next.op === 'insert') current = next.text
      else original = next.text
      consumed = 2
    }

    const afterStart = afterCursor
    afterCursor += current.length
    units.push({ kind: 'change', original, current, afterStart, afterEnd: afterCursor })
    i += consumed
  }
  return units
}

const DEL_CLASS = {
  unified: 'bg-rose-100 text-rose-700 no-underline line-through decoration-rose-500',
  plain: 'rounded bg-rose-100 px-0.5 text-rose-700 no-underline',
}
const INS_CLASS = 'rounded bg-mint-200 px-0.5 text-mint-700 no-underline'

/**
 * One diff, rendered for one of three columns.
 *
 * `before` hides insertions, `after` hides deletions, and `unified` shows both
 * with removals struck through. Colour carries the same meaning it does
 * everywhere else in the product: mint for what the rewrite produced, rose for
 * what it took out.
 *
 * In `after` and `unified`, every changed span is also a button: clicking one
 * reveals what it used to be (`original`) and, where the rewrite's own tables
 * know one, up to two real alternatives (see `word-alternatives.ts`). Only one
 * span is ever open at a time, so `openKey`/`onToggle` are lifted to the
 * caller rather than kept as local state here.
 */
function Rendered({
  parts,
  side,
  pairStart = 0,
  openKey = null,
  keyPrefix = '',
  onToggle,
  onSwapWord,
}: {
  parts: DiffPart[]
  side: 'before' | 'after' | 'unified'
  /** Absolute offset of this paragraph in the full rewritten text. Unused (and omittable) for `before`, which is read-only. */
  pairStart?: number
  openKey?: string | null
  keyPrefix?: string
  onToggle?: (key: string | null) => void
  onSwapWord?: (start: number, end: number, replacement: string) => void
}) {
  const units = useMemo(() => buildUnits(parts), [parts])
  const interactive = side !== 'before' && Boolean(onToggle) && Boolean(onSwapWord)

  return (
    <>
      {units.map((unit, i) => {
        if (unit.kind === 'equal') return <span key={i}>{unit.text}</span>

        const { original, current, afterStart, afterEnd } = unit

        if (side === 'before') {
          return original.length === 0 ? null : (
            <del key={i} className={DEL_CLASS.plain}>
              {original}
            </del>
          )
        }
        if (side === 'after' && current.length === 0) return null // nothing left here to show or click

        const deleteEl =
          original.length === 0 ? null : (
            <del className={side === 'unified' ? DEL_CLASS.unified : DEL_CLASS.plain}>{original}</del>
          )
        const insertEl = current.length === 0 ? null : <ins className={INS_CLASS}>{current}</ins>
        const content = (
          <>
            {side === 'unified' ? deleteEl : null}
            {insertEl}
          </>
        )

        if (!interactive) return <span key={i}>{content}</span>

        const unitKey = `${keyPrefix}:${i}`
        return (
          <WordSwap
            key={i}
            unitKey={unitKey}
            original={original}
            current={current}
            open={openKey === unitKey}
            onToggle={onToggle as (key: string | null) => void}
            onChoose={(replacement) =>
              (onSwapWord as (start: number, end: number, replacement: string) => void)(
                pairStart + afterStart,
                pairStart + afterEnd,
                replacement,
              )
            }
          >
            {content}
          </WordSwap>
        )
      })}
    </>
  )
}

/**
 * A clickable changed span. The button is the rendered del/ins content
 * itself (with a dotted underline added so "this is clickable" survives
 * without a color of its own); the panel that opens is a floating popover
 * anchored under it (`position: absolute`, no portal needed since the diff
 * pane below it is not `overflow: hidden`, see ResultEditor's outer
 * section), so opening it never reflows the surrounding paragraph the way an
 * inline panel inserted mid-sentence did. It is kept mounted at all times and
 * toggled with opacity/scale/pointer-events rather than conditionally
 * rendered, which is what lets the open/close transition actually animate:
 * an element that only exists once `open` is already true has nothing to
 * transition from.
 */
function WordSwap({
  unitKey,
  original,
  current,
  open,
  onToggle,
  onChoose,
  children,
}: {
  unitKey: string
  original: string
  current: string
  open: boolean
  onToggle: (key: string | null) => void
  onChoose: (replacement: string) => void
  children: React.ReactNode
}) {
  const alternatives = useMemo(
    () => (original.length > 0 ? lookupWordAlternatives(original, current) : []),
    [original, current],
  )
  const choose = (replacement: string) => {
    onChoose(replacement)
    onToggle(null)
  }

  return (
    <span className="relative inline-block align-baseline" data-word-swap={unitKey}>
      <button
        type="button"
        onClick={() => onToggle(open ? null : unitKey)}
        aria-expanded={open}
        aria-label={
          original.length > 0 && current.length > 0
            ? `Changed from "${original}" to "${current}". See alternatives.`
            : original.length > 0
              ? `Removed: "${original}". See options.`
              : `Added: "${current}". See options.`
        }
        className="rounded underline decoration-dotted decoration-ink-400 underline-offset-4 outline-none transition-colors hover:decoration-seal-600 focus-visible:decoration-seal-600"
      >
        {children}
      </button>
      <span
        aria-hidden={!open}
        className={
          // Anchored to the word's own LEFT edge, growing rightward, rather
          // than centered under it: a centered popover on a word near the
          // left edge of a narrow (mobile-width) pane, which is exactly
          // where the first word of a paragraph usually sits, pushed half
          // its own width off the left of the screen. Anchoring left never
          // does that; the max-width below keeps it from doing the same on
          // the right for a word near that edge instead.
          'absolute left-0 top-full z-20 mt-2 w-max max-w-[min(16rem,calc(100vw-2.5rem))] origin-top-left rounded-[var(--radius-control)] border border-ink-200 bg-white p-2 shadow-[var(--shadow-raised)] transition-[opacity,transform] duration-150 ease-out ' +
          (open ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-1 scale-95 opacity-0')
        }
      >
        <span className="flex flex-wrap items-center gap-1">
          {original.length > 0 && (
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => choose(original)}
              className="rounded-full border border-ink-300 bg-white px-2 py-0.5 text-[11px] font-medium text-ink-700 transition-colors hover:border-ink-400"
            >
              {current.length === 0 ? `Restore: ${original}` : `Original: ${original}`}
            </button>
          )}
          {original.length === 0 && current.length > 0 && (
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => choose('')}
              className="rounded-full border border-ink-300 bg-white px-2 py-0.5 text-[11px] font-medium text-ink-700 transition-colors hover:border-ink-400"
            >
              Remove this
            </button>
          )}
          {alternatives.map((alt) => (
            <button
              key={alt}
              type="button"
              tabIndex={open ? 0 : -1}
              // Alternatives come back as bare words with no punctuation of
              // their own (see lookupWordAlternatives); wrap with whatever
              // the current span carries so a trailing comma or period on
              // the word being replaced survives the swap.
              onClick={() => choose(withEdgePunctuationOf(alt, current || original))}
              className="rounded-full border border-seal-300 bg-seal-50 px-2 py-0.5 text-[11px] font-medium text-seal-800 transition-colors hover:border-seal-400"
            >
              {alt}
            </button>
          ))}
          {alternatives.length === 0 && original.length > 0 && (
            <span className="text-[11px] text-ink-400">No other listed alternative for this word.</span>
          )}
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={() => onToggle(null)}
            className="text-[11px] font-medium text-ink-400 underline underline-offset-2 hover:text-ink-600"
          >
            Close
          </button>
        </span>
      </span>
    </span>
  )
}
