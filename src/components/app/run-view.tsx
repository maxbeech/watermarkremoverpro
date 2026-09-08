'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { alignParagraphs } from '@/lib/diff/words'
import type { RunRecord } from '@/lib/workspace/runs'
import { buttonClass } from '@/components/brand/ui'
import { AdvancedSettings, type WorkspaceSettings } from '@/components/workspace/advanced-settings'
import type { ProTrialHandle } from '@/components/workspace/use-pro-trial'
import { DeepDive, ExtendedLibraryNote, JudgementCalls } from './deep-dive'
import { DetectionSummary } from './detection-summary'
import { DiffView } from './diff-view'

/**
 * One run, from the deliverable down to the arithmetic.
 *
 * Ordering is the whole design here. The rewritten text is first, because it is
 * what the visitor came to collect. Then how much AI evidence is left, in four
 * figures. Then the comparison, which is also where a paragraph gets sent back
 * through the engine on its own. The complete analysis is last and collapsed.
 */
export function RunView({
  record,
  settings,
  onSettingsChange,
  onRerunAll,
  onRephrase,
  onRestore,
  busy,
  busyParagraph,
  trial,
  subscriber,
  progressNote,
}: {
  record: RunRecord
  settings: WorkspaceSettings
  onSettingsChange: (next: WorkspaceSettings) => void
  onRerunAll: () => void
  onRephrase: (indices: number[]) => void
  onRestore: (index: number) => void
  busy: boolean
  busyParagraph: number | null
  trial: ProTrialHandle
  subscriber: boolean
  progressNote: string | null
}) {
  const [copied, setCopied] = useState(false)
  const [selected, setSelected] = useState<number[]>([])

  const alignment = useMemo(
    () => alignParagraphs(record.originalText, record.revisedText),
    [record.originalText, record.revisedText],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(record.revisedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be denied. The text is selectable below either way.
    }
  }

  const download = () => {
    // A local Blob URL. Nothing is uploaded to produce this file.
    const blob = new Blob([record.revisedText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cleaned-text.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (record.status === 'error') {
    return (
      <div className="space-y-4">
        <div className="rounded-[var(--radius-panel)] border border-signal-300 bg-signal-50 px-5 py-4 text-sm text-signal-800">
          <p className="font-semibold">The rewrite did not run.</p>
          <p className="mt-1 leading-relaxed">{record.error}</p>
        </div>
        <button
          type="button"
          onClick={onRerunAll}
          disabled={busy}
          className={buttonClass('primary')}
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------ the deliverable */}
      <section className="overflow-hidden rounded-[var(--radius-panel)] border border-ink-200 bg-white shadow-[var(--shadow-raised)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
          <div className="min-w-0">
            <h1 className="t-heading truncate text-ink-900">Your rewritten text</h1>
            <p className="mt-0.5 text-[13px] text-ink-500">
              {record.engineUsed}
              {record.revision > 0 && ` · rewritten ${record.revision + 1} times`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className={buttonClass('quiet', '!px-4 !py-2 !text-[13px]')}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={download}
              className={buttonClass('quiet', '!px-4 !py-2 !text-[13px]')}
            >
              Download .txt
            </button>
            <button
              type="button"
              onClick={onRerunAll}
              disabled={busy}
              className={buttonClass('primary', '!px-4 !py-2 !text-[13px]')}
            >
              {busy && busyParagraph === null ? 'Rewriting…' : 'Rewrite the whole thing again'}
            </button>
          </div>
        </header>

        <textarea
          readOnly
          value={record.revisedText}
          rows={14}
          aria-label="Your rewritten text"
          className="w-full resize-y bg-white px-5 py-5 text-[15px] leading-relaxed text-ink-800 outline-none"
        />

        <p className="border-t border-ink-100 bg-ink-50/60 px-5 py-2.5 text-xs leading-relaxed text-ink-500">
          Rewriting the whole document again starts from your original draft, so passes never stack
          up on top of one another. Rewriting a single paragraph below starts from the version shown
          there, which is what makes a second pass produce something different.
        </p>
      </section>

      {progressNote && (
        <p
          role="status"
          className="rounded-[var(--radius-control)] border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600"
        >
          {progressNote}
        </p>
      )}

      {record.downgraded && (
        <p className="rounded-[var(--radius-control)] border border-signal-200 bg-signal-50 px-4 py-3 text-sm leading-relaxed text-signal-800">
          {record.downgraded}{' '}
          <Link href="/pricing" className="font-semibold underline underline-offset-2">
            What Pro adds
          </Link>
          .
        </p>
      )}

      {/* ------------------------------------------------------------ summary */}
      {record.result && <DetectionSummary result={record.result} />}

      {/* --------------------------------------------------------- comparison */}
      <DiffView
        alignment={alignment}
        selected={selected}
        onSelectedChange={setSelected}
        rephrased={record.rephrased}
        busyParagraph={busyParagraph}
        onRephrase={(indices) => {
          setSelected([])
          onRephrase(indices)
        }}
        onRestore={onRestore}
        disabled={busy}
      />

      {/* ------------------------------------------------------------ the rest */}
      {record.result && <JudgementCalls result={record.result} />}
      {record.result && <ExtendedLibraryNote result={record.result} />}

      <AdvancedSettings
        settings={settings}
        onChange={onSettingsChange}
        disabled={busy}
        trial={trial.status}
        subscriber={subscriber}
        trialLoading={trial.loading}
      />

      {record.result && <DeepDive result={record.result} />}

      {record.result && (
        <div className="space-y-1.5 rounded-[var(--radius-control)] border border-ink-200 bg-ink-50 px-4 py-3.5 text-xs leading-relaxed text-ink-600">
          {record.result.limits.map((limit) => (
            <p key={limit}>{limit}</p>
          ))}
        </div>
      )}
    </div>
  )
}
