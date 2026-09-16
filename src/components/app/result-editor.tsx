'use client'

import { useEffect, useRef, useState } from 'react'
import type { ParagraphAlignment } from '@/lib/diff/words'
import {
  describeVersionAge,
  VERSION_SOURCE_LABELS,
  VERSION_SOURCE_SHORT,
  type RunRecord,
  type RunVersion,
} from '@/lib/workspace/runs'
import { buttonClass } from '@/components/brand/ui'
import { DiffView, type DiffLayout } from './diff-view'

/** How long to wait after the last keystroke before persisting. */
const EDIT_DEBOUNCE_MS = 800

type Tab = 'result' | 'changes'

/**
 * The middle column: your text, and the history of your text.
 *
 * This was three views behind one switcher (Split, Unified, New) plus a version
 * strip plus two paragraphs of instructions, and the effect was that the actual
 * deliverable, the rewritten text, was one of three equal-looking options and
 * not the one selected by default. A reader who pasted a draft and pressed the
 * button landed on a paragraph-by-paragraph diff of a document they had not
 * read yet.
 *
 * It is two tabs now, and the deliverable is the first one:
 *
 *   Result    the rewritten text, editable in place. Where you land.
 *   Changes   the paragraph-by-paragraph comparison against your draft, with
 *             side-by-side or inline as a small setting inside it rather than
 *             as a peer of the text itself.
 *
 * The version strip sits directly under the tabs, one chip per distinct text
 * this run has held (see appendVersion in lib/workspace/runs.ts). Tapping an
 * earlier one PREVIEWS it, read-only, with its own Restore action: the point of
 * keeping a history is to look at an earlier pass before deciding to go back to
 * it, not to undo blind. The instructions that used to explain all of this in
 * prose are gone, because the arrangement now says it.
 */
export function ResultEditor({
  record,
  alignment,
  selected,
  onSelectedChange,
  busy,
  busyParagraph,
  onRerunAll,
  onRephrase,
  onRestore,
  onSwapWord,
  onEditText,
  onRestoreVersion,
}: {
  record: RunRecord
  alignment: ParagraphAlignment
  selected: number[]
  onSelectedChange: (next: number[]) => void
  busy: boolean
  busyParagraph: number | null
  onRerunAll: () => void
  onRephrase: (indices: number[]) => void
  onRestore: (index: number) => void
  /** Replace one changed word/phrase in the Changes tab. See DiffView's own doc comment. */
  onSwapWord: (start: number, end: number, replacement: string) => void
  /** Called (debounced while typing, immediately on blur) with the edited text. */
  onEditText: (text: string) => void
  /** Makes an earlier version from the history strip the run's current text. */
  onRestoreVersion: (version: RunVersion) => void
}) {
  const [tab, setTab] = useState<Tab>('result')
  const [layout, setLayout] = useState<DiffLayout>('split')
  const [copied, setCopied] = useState(false)
  const [draft, setDraft] = useState(record.revisedText)
  const [previewedId, setPreviewedId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onEditTextRef = useRef(onEditText)
  /*
    The last text this textarea itself sent upstream.

    This is what tells an incoming `record.revisedText` apart from an echo of
    the visitor's own typing. Without it the editor has to choose between two
    broken behaviours: re-syncing on every revisedText change (which yanks the
    caret back mid-sentence every time a debounced save lands) or never
    re-syncing (which was the bug this replaced: restoring an earlier version
    updated the record, the strip and the analysis, while the textarea kept
    showing the text that had just been replaced, and the next blur wrote that
    stale text back over the restore).
  */
  const sentRef = useRef(record.revisedText)

  useEffect(() => {
    onEditTextRef.current = onEditText
  }, [onEditText])

  // Adopt any change to the current text that this textarea did not make: a
  // full rerun, a paragraph rephrase, a restore, or opening a different run.
  useEffect(() => {
    if (record.revisedText !== sentRef.current) {
      sentRef.current = record.revisedText
      setDraft(record.revisedText)
    }
  }, [record.revisedText])

  // Any change to the current text drops an active preview: previewing a
  // version whose text a restore just made current would show the same text
  // twice for two different reasons.
  useEffect(() => {
    setPreviewedId(null)
  }, [record.revisedText])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const scheduleSave = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      sentRef.current = text
      onEditTextRef.current(text)
    }, EDIT_DEBOUNCE_MS)
  }

  const flush = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (draft !== record.revisedText) {
      sentRef.current = draft
      onEditTextRef.current(draft)
    }
  }

  const currentText = () => (tab === 'result' ? draft : record.revisedText)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be denied. The text is selectable either way.
    }
  }

  const download = () => {
    // A local Blob URL. Nothing is uploaded to produce this file.
    const blob = new Blob([currentText()], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cleaned-text.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const previewed = previewedId ? (record.versions.find((v) => v.id === previewedId) ?? null) : null
  const changedCount = alignment.aligned ? alignment.pairs.filter((p) => p.changed).length : null

  return (
    // No overflow-hidden here: the Changes tab's word-swap popovers (see
    // DiffView) are floating, absolutely-positioned elements that would get
    // clipped by it near the top or bottom edge. Every child that touches
    // this section's own edge (the header, the result textarea/footer) is
    // already the same background as the section itself, so the rounded
    // corners stay clean without relying on this to clip them.
    <section className="@container rounded-[var(--radius-panel)] border border-ink-200 bg-white shadow-[var(--shadow-raised)]">
      {/* ------------------------------------------------------------ header */}
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="t-heading truncate text-ink-900">Your rewritten text</h1>
          <span className="figure shrink-0 text-[12px] text-ink-400">
            {record.words.toLocaleString()} words
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={copy} className={buttonClass('quiet', '!px-3 !py-1.5 !text-[12px]')}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" onClick={download} className={buttonClass('quiet', '!px-3 !py-1.5 !text-[12px]')}>
            Download
          </button>
          <button
            type="button"
            onClick={onRerunAll}
            disabled={busy}
            className={buttonClass('primary', '!px-3 !py-1.5 !text-[12px]')}
          >
            {busy && busyParagraph === null ? 'Rewriting…' : 'Rewrite again'}
          </button>
        </div>
      </header>

      {/* -------------------------------------------------------------- tabs */}
      <div className="flex items-center gap-4 border-b border-ink-200 px-4">
        <TabButton active={tab === 'result'} onClick={() => setTab('result')}>
          Result
        </TabButton>
        <TabButton
          active={tab === 'changes'}
          onClick={() => {
            flush()
            setTab('changes')
          }}
        >
          Changes
          {changedCount !== null && (
            <span className="figure ml-1.5 rounded-full bg-ink-100 px-1.5 py-px text-[10px] font-semibold text-ink-600">
              {changedCount}
            </span>
          )}
        </TabButton>

        {tab === 'changes' && alignment.aligned && (
          <div
            role="group"
            aria-label="Comparison layout"
            className="ml-auto hidden items-center gap-1 py-1.5 @sm:flex"
          >
            {(
              [
                ['split', 'Side by side'],
                ['unified', 'Inline'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={layout === value}
                onClick={() => setLayout(value)}
                className={
                  'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ' +
                  (layout === value ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-100')
                }
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- history */}
      {record.versions.length > 1 && (
        <VersionHistory
          versions={record.versions}
          currentId={record.versions[record.versions.length - 1]?.id ?? null}
          previewedId={previewedId}
          onPreview={setPreviewedId}
        />
      )}

      {/* ----------------------------------------------------------- content */}
      {previewed ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-seal-200 bg-seal-50 px-4 py-2.5">
            <p className="text-[12px] leading-relaxed text-seal-800">
              Read-only preview of{' '}
              <span className="font-semibold">{VERSION_SOURCE_LABELS[previewed.source]}</span>,{' '}
              {describeVersionAge(previewed.createdAt)}. Your current text is unchanged.
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewedId(null)}
                className={buttonClass('ghost', '!px-2.5 !py-1 !text-[12px]')}
              >
                Back to current
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  onRestoreVersion(previewed)
                  setPreviewedId(null)
                }}
                className={buttonClass('primary', '!px-3 !py-1 !text-[12px]')}
              >
                Restore this
              </button>
            </div>
          </div>
          <p className="whitespace-pre-wrap bg-ink-50/40 px-5 py-5 text-[15px] leading-relaxed text-ink-800">
            {previewed.text}
          </p>
        </>
      ) : tab === 'result' ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              scheduleSave(e.target.value)
            }}
            onBlur={flush}
            rows={16}
            aria-label="Your rewritten text, editable"
            className="w-full resize-y bg-white px-5 py-5 text-[15px] leading-relaxed text-ink-800 outline-none"
          />
          <p className="border-t border-ink-100 px-5 py-2 text-[11px] text-ink-400">
            Edit here and it saves to this run automatically, then gets measured again.
          </p>
        </>
      ) : (
        <DiffView
          layout={layout}
          alignment={alignment}
          selected={selected}
          onSelectedChange={onSelectedChange}
          rephrased={record.rephrased}
          busyParagraph={busyParagraph}
          onRephrase={(indices) => {
            onSelectedChange([])
            onRephrase(indices)
          }}
          onRestore={onRestore}
          onSwapWord={onSwapWord}
          disabled={busy}
        />
      )}
    </section>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        'relative -mb-px border-b-2 px-0.5 py-2.5 text-[13px] font-semibold transition-colors ' +
        (active
          ? 'border-ink-900 text-ink-900'
          : 'border-transparent text-ink-500 hover:text-ink-800')
      }
    >
      {children}
    </button>
  )
}

/**
 * One chip per distinct text this run has held, oldest first, scrolling
 * horizontally rather than wrapping: a long editing session builds up more
 * versions than a fixed-width row can show at once, and a wrapped grid of
 * timestamps reads worse than a strip that scrolls.
 *
 * Each chip carries the version number, what produced it and the score measured
 * on that exact text, so the strip answers "did that edit help" without opening
 * anything. The full label and age go in the accessible name rather than on the
 * chip, where they cost two lines each.
 */
function VersionHistory({
  versions,
  currentId,
  previewedId,
  onPreview,
}: {
  versions: RunVersion[]
  /** The last entry in `versions` is always the current text (see appendVersion): passed by id, not by text, so restoring back to text an earlier version already held does not mark two chips current at once. */
  currentId: string | null
  previewedId: string | null
  onPreview: (id: string | null) => void
}) {
  return (
    <div
      role="group"
      aria-label="Version history"
      className="flex items-center gap-1.5 overflow-x-auto border-b border-ink-100 bg-ink-50/70 px-4 py-2"
    >
      <span className="shrink-0 pr-1 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
        History
      </span>
      {versions.map((version, index) => {
        const isCurrent = previewedId === null && version.id === currentId
        const isPreviewed = version.id === previewedId
        const active = isCurrent || isPreviewed
        return (
          <button
            key={version.id}
            type="button"
            aria-pressed={active}
            aria-label={`Version ${index + 1}, ${VERSION_SOURCE_LABELS[version.source]}, ${describeVersionAge(
              version.createdAt,
            )}${version.likelihood === null ? ', score not measured' : `, AI-style ${version.likelihood}`}`}
            title={`${VERSION_SOURCE_LABELS[version.source]} · ${describeVersionAge(version.createdAt)}`}
            onClick={() => onPreview(isPreviewed ? null : version.id)}
            className={
              'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors duration-150 ' +
              (active
                ? 'border-seal-400 bg-seal-50 text-seal-800'
                : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-50')
            }
          >
            <span className="figure font-semibold">v{index + 1}</span>
            <span>{VERSION_SOURCE_SHORT[version.source]}</span>
            {version.likelihood !== null && (
              <span className="figure rounded-full bg-ink-100 px-1.5 text-[10px] font-semibold text-ink-600">
                {version.likelihood}
              </span>
            )}
            {isCurrent && (
              <span className="h-1.5 w-1.5 rounded-full bg-seal-600" aria-hidden="true" />
            )}
          </button>
        )
      })}
    </div>
  )
}
