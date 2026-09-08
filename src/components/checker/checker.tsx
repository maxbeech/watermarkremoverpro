'use client'

import { useCallback, useMemo, useState } from 'react'
import { checkDocument, type AnalysisResult } from '@/lib/detector'
import { PUBLIC_DETECTION_KEYS } from '@/lib/detector/public-keys'
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '@/lib/detector/languages'
import { countWords } from '@/lib/detector/tokenize'
import { PLANS } from '@/lib/site'
import { buttonClass } from '@/components/brand/ui'
import { DocumentInput } from '@/components/workspace/document-input'
import { ResultView } from './result-view'

/**
 * The check on its own, without the rewrite.
 *
 * EVERYTHING HERE RUNS IN THE BROWSER. There is no fetch, no server action and
 * no analytics call carrying document text anywhere in this component or in
 * anything it imports. That is the product's central promise, and it is
 * enforced by a test (tests/product-constraints.test.ts) that fails the build
 * if a network call appears on this path.
 *
 * The input surface is the SAME component the homepage workspace uses, so
 * paste, drag-and-drop and upload behave identically on both, and a fix to one
 * is a fix to both.
 */

type Phase =
  | { kind: 'idle' }
  | { kind: 'measuring' }
  | { kind: 'done'; result: AnalysisResult }
  | { kind: 'error'; message: string }

export function Checker({ wordCap = PLANS.anonymous.wordCap }: { wordCap?: number }) {
  const [text, setText] = useState('')
  const [language, setLanguage] = useState<string>('auto')
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [fileError, setFileError] = useState<string | null>(null)

  const words = useMemo(() => countWords(text), [text])
  const overCap = words > wordCap

  const run = useCallback(async () => {
    setPhase({ kind: 'measuring' })
    // Yield a frame so the measuring state paints before the main thread is
    // occupied. The analysis is genuinely CPU-bound work happening right here.
    await new Promise((r) => setTimeout(r, 16))
    try {
      const result = await checkDocument(text, {
        keys: PUBLIC_DETECTION_KEYS,
        language: language === 'auto' ? undefined : language,
      })
      setPhase({ kind: 'done', result })
    } catch (err) {
      // Surface the real failure. A check that silently produced nothing would
      // be indistinguishable from a check that found nothing.
      setPhase({ kind: 'error', message: (err as Error).message })
    }
  }, [text, language])

  return (
    <div className="space-y-4">
      <DocumentInput
        value={text}
        onChange={setText}
        words={words}
        wordCap={wordCap}
        disabled={phase.kind === 'measuring'}
        onFileError={setFileError}
        placeholder="Paste the writing you want to check. Your own writing, that is. Or drop a file anywhere on this box."
        toolbar={
          <div className="flex items-center gap-2">
            <label htmlFor="check-language" className="sr-only">
              Language
            </label>
            <select
              id="check-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[13px] text-ink-700 transition-colors hover:border-ink-300"
            >
              <option value="auto">Detect language</option>
              {SUPPORTED_LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {LANGUAGE_NAMES[code]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={run}
              disabled={words === 0 || overCap || phase.kind === 'measuring'}
              className={buttonClass('primary', 'disabled:bg-ink-300 disabled:text-white')}
            >
              {phase.kind === 'measuring' ? 'Measuring…' : 'Run the check'}
            </button>
          </div>
        }
        footer={
          overCap ? (
            <p className="border-t border-signal-200 bg-signal-50 px-4 py-3 text-sm leading-relaxed text-signal-800">
              This document is {(words - wordCap).toLocaleString()} words over the{' '}
              {wordCap.toLocaleString()}-word limit for a check without an account. Nothing has been
              truncated or partially analysed, because a result measured on part of a document would
              not describe the document.
            </p>
          ) : null
        }
      />

      {fileError && (
        <p className="rounded-[var(--radius-control)] border border-signal-200 bg-signal-50 px-4 py-3 text-sm text-signal-800">
          {fileError}
        </p>
      )}

      {phase.kind === 'error' && (
        <div className="rounded-[var(--radius-control)] border border-signal-300 bg-signal-50 px-4 py-3 text-sm text-signal-800">
          <p className="font-semibold">The check did not run.</p>
          <p className="mt-1">{phase.message}</p>
        </div>
      )}

      {phase.kind === 'done' && <ResultView result={phase.result} />}
    </div>
  )
}
