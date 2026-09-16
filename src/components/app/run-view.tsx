'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { alignParagraphs } from '@/lib/diff/words'
import type { RunRecord, RunVersion } from '@/lib/workspace/runs'
import { buttonClass } from '@/components/brand/ui'
import { AdvancedSettings, type WorkspaceSettings } from '@/components/workspace/advanced-settings'
import { ResultEditor } from './result-editor'

/**
 * The center column, once a run exists.
 *
 * One panel that matters, and everything else folded down under it. This used
 * to be the result panel followed by a free-floating paragraph explaining how
 * rerunning works, then the settings sheet, then an always-open list of the
 * detector's stated limits: three blocks of standing text under the one thing
 * the visitor came for. The explanation now lives where the action is (the
 * rerun button's own title) and the limits are a disclosure, still one click
 * away and still complete, just not permanently in the way.
 *
 * The full analysis lives in the right-hand column (see ./analysis-panel.tsx),
 * so nothing here is a measurement.
 */
export function RunView({
  record,
  settings,
  onSettingsChange,
  onRerunAll,
  onRephrase,
  onRestore,
  onSwapWord,
  onEditText,
  onRestoreVersion,
  busy,
  busyParagraph,
  subscriber,
  progressNote,
}: {
  record: RunRecord
  settings: WorkspaceSettings
  onSettingsChange: (next: WorkspaceSettings) => void
  onRerunAll: () => void
  onRephrase: (indices: number[]) => void
  onRestore: (index: number) => void
  onSwapWord: (start: number, end: number, replacement: string) => void
  onEditText: (text: string) => void
  onRestoreVersion: (version: RunVersion) => void
  busy: boolean
  busyParagraph: number | null
  subscriber: boolean
  progressNote: string | null
}) {
  const [selected, setSelected] = useState<number[]>([])
  const [limitsOpen, setLimitsOpen] = useState(false)

  const alignment = useMemo(
    () => alignParagraphs(record.originalText, record.revisedText),
    [record.originalText, record.revisedText],
  )

  if (record.status === 'error') {
    return (
      <div className="space-y-4">
        <div className="rounded-[var(--radius-panel)] border border-signal-300 bg-signal-50 px-5 py-4 text-sm text-signal-800">
          <p className="font-semibold">The rewrite did not run.</p>
          <p className="mt-1 leading-relaxed">{record.error}</p>
        </div>
        <button type="button" onClick={onRerunAll} disabled={busy} className={buttonClass('primary')}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {progressNote && (
        <p
          role="status"
          className="rounded-[var(--radius-control)] border border-ink-200 bg-white px-4 py-2.5 text-[13px] text-ink-600"
        >
          {progressNote}
        </p>
      )}

      {record.downgraded && (
        <p className="rounded-[var(--radius-control)] border border-signal-200 bg-signal-50 px-4 py-2.5 text-[13px] leading-relaxed text-signal-800">
          {record.downgraded}{' '}
          <Link href="/pricing" className="font-semibold underline underline-offset-2">
            What Pro adds
          </Link>
          .
        </p>
      )}

      <ResultEditor
        record={record}
        alignment={alignment}
        selected={selected}
        onSelectedChange={setSelected}
        busy={busy}
        busyParagraph={busyParagraph}
        onRerunAll={onRerunAll}
        onRephrase={onRephrase}
        onRestore={onRestore}
        onSwapWord={onSwapWord}
        onEditText={onEditText}
        onRestoreVersion={onRestoreVersion}
      />

      <AdvancedSettings
        settings={settings}
        onChange={onSettingsChange}
        disabled={busy}
        subscriber={subscriber}
      />

      {record.result && record.result.limits.length > 0 && (
        <div className="rounded-[var(--radius-panel)] border border-ink-200 bg-white">
          <button
            type="button"
            aria-expanded={limitsOpen}
            onClick={() => setLimitsOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
          >
            <span className="text-sm font-semibold text-ink-800">
              What this cannot tell you
            </span>
            <span className="text-[13px] text-ink-500">{limitsOpen ? 'Hide' : 'Show'}</span>
          </button>
          {limitsOpen && (
            <div className="space-y-2 border-t border-ink-100 px-4 py-3.5 text-[13px] leading-relaxed text-ink-600">
              {record.result.limits.map((limit) => (
                <p key={limit}>{limit}</p>
              ))}
              <p className="border-t border-ink-100 pt-2.5 text-ink-500">
                Rewriting the whole document again starts from your original draft, so passes never
                stack up. Rewriting a single paragraph under Changes starts from the version shown
                there, which is what makes a second pass produce something different.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
