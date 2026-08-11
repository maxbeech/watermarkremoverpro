'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { checkDocument, type AnalysisResult } from '@/lib/detector'
import { PUBLIC_DETECTION_KEYS } from '@/lib/detector/public-keys'
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '@/lib/detector/languages'
import { countWords } from '@/lib/detector/tokenize'
import { PLANS } from '@/lib/site'
import { ResultView } from './result-view'

/**
 * The free check.
 *
 * EVERYTHING HERE RUNS IN THE BROWSER. There is no fetch, no server action and
 * no analytics call carrying document text anywhere in this component or in
 * anything it imports — that is the product's central promise, and it is
 * enforced by a test (src/lib/detector/privacy-contract.test.ts) that fails the
 * build if a network call appears on this path.
 */

type Phase = { kind: 'idle' } | { kind: 'measuring' } | { kind: 'done'; result: AnalysisResult } | { kind: 'error'; message: string }

export function Checker({ wordCap = PLANS.anonymous.wordCap }: { wordCap?: number }) {
  const [text, setText] = useState('')
  const [language, setLanguage] = useState<string>('auto')
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const fileInput = useRef<HTMLInputElement>(null)

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

  const readFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => setText(String(reader.result ?? ''))
    reader.onerror = () => setPhase({ kind: 'error', message: `Could not read ${file.name}.` })
    // readAsText is a local operation. The file is not uploaded.
    reader.readAsText(file)
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-ink-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <ShieldIcon />
            <span>
              Runs on your device. Open your browser’s network tab and watch — nothing is sent.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-ink-500" htmlFor="language">
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded border border-ink-200 bg-white px-2 py-1 text-sm text-ink-800"
            >
              <option value="auto">Detect automatically</option>
              {SUPPORTED_LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {LANGUAGE_NAMES[code]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          spellCheck={false}
          placeholder="Paste the writing you want to check. Your own writing — this tool is not for screening other people’s work."
          className="w-full resize-y bg-transparent px-4 py-4 font-serif text-[15px] leading-relaxed text-ink-800 outline-none placeholder:text-ink-300"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-4 py-3">
          <div className="flex items-center gap-4 text-sm">
            <span className={overCap ? 'figure text-signal-700' : 'figure text-ink-500'}>
              {words.toLocaleString()} / {wordCap.toLocaleString()} words
            </span>
            <input
              ref={fileInput}
              type="file"
              accept=".txt,.md,.markdown,text/plain,text/markdown"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) readFile(file)
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="text-ink-500 underline underline-offset-2 hover:text-ink-800"
            >
              Open a .txt or .md file
            </button>
          </div>

          <button
            type="button"
            onClick={run}
            disabled={words === 0 || overCap || phase.kind === 'measuring'}
            className="rounded bg-ink-900 px-5 py-2 text-sm font-medium text-ink-50 disabled:cursor-not-allowed disabled:bg-ink-300"
          >
            {phase.kind === 'measuring' ? 'Measuring…' : 'Run the check'}
          </button>
        </div>

        {overCap && (
          <p className="border-t border-signal-100 bg-signal-100/50 px-4 py-3 text-sm text-signal-700">
            This document is {(words - wordCap).toLocaleString()} words over the {wordCap.toLocaleString()}-word
            limit for a check without an account. Nothing has been truncated or partially analysed —
            a result measured on part of a document would not describe the document.
          </p>
        )}
      </div>

      {phase.kind === 'error' && (
        <div className="rounded-lg border border-signal-500 bg-signal-100 px-4 py-3 text-sm text-signal-700">
          <p className="font-medium">The check did not run.</p>
          <p className="mt-1">{phase.message}</p>
        </div>
      )}

      {phase.kind === 'done' && <ResultView result={phase.result} />}
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3l7 3v6c0 4.5-3 7.9-7 9-4-1.1-7-4.5-7-9V6l7-3z" />
    </svg>
  )
}
