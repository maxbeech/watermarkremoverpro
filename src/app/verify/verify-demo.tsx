'use client'

import { useState } from 'react'
import { OPEN_REFERENCE_KEY } from '@/lib/detector/keys'
import { utf8 } from '@/lib/detector/crypto'
import { generateMarkedText } from '@/lib/detector/simulate'
import { testWatermark } from '@/lib/detector/watermark'
import { tokenize } from '@/lib/detector/tokenize'
import type { DetectionKey } from '@/lib/detector/keys'
import { buttonClass } from '@/components/brand/ui'

/**
 * The auditability demo.
 *
 * A detector you cannot test is a detector you have to take on faith. This runs
 * the real marker and the real detector, in the visitor's own browser, on text
 * generated in front of them, and crucially shows the SAME text scored under a
 * different key, which is what separates "this tool does arithmetic" from "this
 * tool returns a big number when we tell it to".
 */

const VOCABULARY = [
  'analysis', 'report', 'record', 'evidence', 'passage', 'writing', 'document', 'process',
  'method', 'result', 'measure', 'signal', 'language', 'student', 'author', 'appeal',
  'review', 'panel', 'notice', 'summary', 'section', 'finding', 'account', 'reason',
  'the', 'of', 'and', 'to', 'in', 'that', 'for', 'with', 'this', 'from', 'which', 'their',
]

const DECOY_KEY: DetectionKey = {
  ...OPEN_REFERENCE_KEY,
  id: 'unrelated-demo-key',
  label: 'A different key (not the one the text was marked with)',
  secret: utf8('an unrelated key, for contrast'),
}

interface Outcome {
  text: string
  underCorrectKey: ReturnType<typeof testWatermark>
  underOtherKey: ReturnType<typeof testWatermark>
  wasMarked: boolean
}

export function VerifyDemo() {
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [seed, setSeed] = useState(7)

  const run = (marked: boolean) => {
    const next = seed + 1
    setSeed(next)
    // Marked text is built by preferring green continuations, exactly as a
    // watermarked sampler does. Unmarked text draws from the same vocabulary
    // with no preference, so the only difference between the two is the mark.
    const text = marked
      ? generateMarkedText(OPEN_REFERENCE_KEY, VOCABULARY, 700, next)
      : generateMarkedText(
          { ...OPEN_REFERENCE_KEY, gamma: 0.5, secret: utf8(`neutral-${next}`) },
          VOCABULARY,
          700,
          next,
        )
    const tokens = tokenize(text)
    setOutcome({
      text,
      wasMarked: marked,
      underCorrectKey: testWatermark(tokens, OPEN_REFERENCE_KEY),
      underOtherKey: testWatermark(tokens, DECOY_KEY),
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => run(true)} className={buttonClass('seal')}>
          Generate text marked with the reference key
        </button>
        <button type="button" onClick={() => run(false)} className={buttonClass('quiet')}>
          Generate unmarked text as a control
        </button>
      </div>

      {outcome && (
        <>
          <div className="rounded-[var(--radius-panel)] border border-ink-200 bg-white shadow-[var(--shadow-panel)] p-4">
            <p className="text-[13px] font-semibold text-ink-500">
              {outcome.wasMarked
                ? 'Text generated WITH the reference mark'
                : 'Control text, generated with no mark under the reference key'}
            </p>
            <p className="mt-2 max-h-32 overflow-y-auto text-sm leading-relaxed text-ink-600">
              {outcome.text}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Panel
              title="Tested with the reference key"
              subtitle="the key the marked text was generated under"
              result={outcome.underCorrectKey}
              expectation={
                outcome.wasMarked
                  ? 'Expect a large z and a very small p. The mark is present and the test finds it.'
                  : 'Expect z near zero. There is no mark to find.'
              }
            />
            <Panel
              title="Tested with a different key"
              subtitle="the same text, a key it was not marked with"
              result={outcome.underOtherKey}
              expectation="Expect z near zero either way. This is the control that proves the result depends on the key rather than on the text looking unusual."
            />
          </div>

          <p className="text-sm leading-relaxed text-ink-500">
            Both panels were computed just now, in this browser, by the same functions the real check
            uses. Nothing was sent anywhere and no result was fetched.
          </p>
        </>
      )}
    </div>
  )
}

function Panel({
  title,
  subtitle,
  result,
  expectation,
}: {
  title: string
  subtitle: string
  result: ReturnType<typeof testWatermark>
  expectation: string
}) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-ink-200 bg-white shadow-[var(--shadow-panel)] p-4">
      <h3 className="font-medium text-ink-900">{title}</h3>
      <p className="text-xs text-ink-400">{subtitle}</p>

      {result.status === 'computed' ? (
        <dl className="mt-3 space-y-1 text-sm">
          <Row label="Green-list rate" value={`${((result.greenRate ?? 0) * 100).toFixed(1)}%`} />
          <Row label="Expected by chance" value={`${(result.expectedGreenRate * 100).toFixed(1)}%`} />
          <Row label="z" value={(result.z ?? 0).toFixed(2)} />
          <Row
            label="p"
            value={(result.pValue ?? 1) < 1e-6 ? '< 0.000001' : (result.pValue ?? 1).toFixed(6)}
          />
          <Row label="Word pairs scored" value={String(result.trials ?? 0)} />
        </dl>
      ) : (
        <p className="mt-3 text-sm text-ink-600">{result.detail}</p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-ink-400">{expectation}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd className="figure text-ink-900">{value}</dd>
    </div>
  )
}
