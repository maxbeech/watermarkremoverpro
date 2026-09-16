'use client'

import { useState } from 'react'
import type { RewriteResult } from '@/lib/rewrite'
import type { RunRecord, RunSummary } from '@/lib/workspace/runs'
import { summariseRun } from '@/lib/workspace/runs'
import { detectorLikelihood, overallLikelihood } from '@/lib/detector/composite'
import type { MlClassifierResult } from '@/lib/detector/ml-classifier'
import type { MlClassifierProgress } from '@/components/workspace/use-ml-classifier'
import { ChannelBar, Gauge, GaugePending, Tile, type ChartTone } from './charts'
import { DeepDive, ExtendedLibraryNote, JudgementCalls } from './deep-dive'

/**
 * The right-hand column: what the detector makes of this text, as pictures.
 *
 * Three sections, in the order a reader actually wants them:
 *
 *   Headline     three figures, each with a before/after track: the overall
 *                estimate (every channel this detector ran, combined), how
 *                AI-sounding the surface signals read to a human, and how
 *                AI-sounding the trained classifier and watermark evidence
 *                together read to an automated detector.
 *   What changed a handful of facts about what the rewrite actually did:
 *                how many passages it touched, how many phrase swaps, how
 *                much the wording itself moved, how long it took.
 *   Full analysis everything else, collapsed by default: the trained
 *                detector's own caveats, every individual channel broken
 *                out, the judgement calls and the raw findings.
 *
 * THE OVERALL FIGURE IS NEVER JUST ONE CHANNEL'S NUMBER. A document this
 * detector's own trained classifier scores near 0% can still carry heuristic
 * surface signals the classifier was never trained to catch (GPT-2 output is
 * a very different distribution from a 2026 model's). Showing only the
 * classifier's number as "the" verdict let a document like that read as
 * clean when it wasn't; see src/lib/detector/composite.ts for the actual
 * combination and why it is built the way it is.
 *
 * THE OVERALL AND DETECTOR FIGURES ARE NEVER SHOWN COMPLETE BEFORE THE MODEL
 * CAN ANSWER. Both partly depend on the trained classifier, which downloads
 * and runs on this device. Rather than block the whole headline on it (the
 * heuristic and watermark channels are instant and have nothing to wait
 * for), these figures update the moment they have SOMETHING to show and say
 * plainly when the classifier hasn't weighed in yet, rather than pretending a
 * partial figure is a finished one.
 */
export function AnalysisPanel({
  record,
  mlClassifier,
  mlClassifierBefore,
  mlClassifierLoading,
  mlClassifierPreparing,
  mlClassifierProgress,
}: {
  record: RunRecord | null
  mlClassifier: MlClassifierResult | null
  /** The same classifier, run on the visitor's original draft instead of the rewrite, so the headline figures can show a genuine before/after on this channel rather than only an "after". */
  mlClassifierBefore: MlClassifierResult | null
  mlClassifierLoading: boolean
  mlClassifierPreparing: boolean
  mlClassifierProgress: MlClassifierProgress | null
}) {
  if (!record || !record.result) {
    return (
      <div className="rounded-[var(--radius-panel)] border border-dashed border-ink-300 bg-white px-5 py-10 text-center">
        <p className="text-sm leading-relaxed text-ink-500">
          Rewrite something to see it measured here: the trained detector&apos;s score, the
          provenance-mark test and every surface signal, all computed on your own device.
        </p>
      </div>
    )
  }

  const summary = summariseRun(record.result)
  const modelWaiting = mlClassifierLoading || mlClassifierPreparing
  const modelAfter = mlClassifier?.status === 'ok' ? mlClassifier.aiProbability : null
  const modelBefore = mlClassifierBefore?.status === 'ok' ? mlClassifierBefore.aiProbability : null

  return (
    <div className="@container space-y-4">
      <Headline
        summary={summary}
        modelBefore={modelBefore}
        modelAfter={modelAfter}
        modelWaiting={modelWaiting}
        modelPreparing={mlClassifierPreparing}
        modelProgress={mlClassifierProgress}
      />
      <WhatChanged summary={summary} />
      <FullAnalysis
        record={record}
        result={record.result}
        summary={summary}
        mlClassifier={mlClassifier}
        mlClassifierLoading={mlClassifierLoading}
        mlClassifierPreparing={mlClassifierPreparing}
        mlClassifierProgress={mlClassifierProgress}
      />
    </div>
  )
}

/* --------------------------------------------------------------- headline */

function toneFor(score: number | null): ChartTone {
  return score !== null && score >= 50 ? 'signal' : 'mint'
}

/**
 * Below this many points, a change in a composite figure is treated as
 * within the test's own noise rather than a genuine improvement or
 * regression. The watermark channel these figures partly depend on is a
 * fresh statistical draw on whatever text is measured, not a continuation of
 * the same measurement, so a short document can move a point or two between
 * two honest runs with nothing about the rewrite having gotten worse. Coloring
 * that as a red "+1" claims a confidence the underlying test doesn't have.
 */
const OVERALL_DEAD_ZONE = 3

function Headline({
  summary,
  modelBefore,
  modelAfter,
  modelWaiting,
  modelPreparing,
  modelProgress,
}: {
  summary: RunSummary
  modelBefore: number | null
  modelAfter: number | null
  modelWaiting: boolean
  modelPreparing: boolean
  modelProgress: MlClassifierProgress | null
}) {
  const overallAfter = overallLikelihood({
    modelProbability: modelAfter,
    heuristicScore: summary.likelihoodAfter,
    watermarkZ: summary.watermarkAfter,
  })
  const overallBefore = overallLikelihood({
    modelProbability: modelBefore,
    heuristicScore: summary.likelihoodBefore,
    watermarkZ: summary.watermarkBefore,
  })
  const detectorAfter = detectorLikelihood({ modelProbability: modelAfter, watermarkZ: summary.watermarkAfter })
  const detectorBefore = detectorLikelihood({ modelProbability: modelBefore, watermarkZ: summary.watermarkBefore })

  return (
    <section className="rounded-[var(--radius-panel)] border border-ink-200 bg-white px-5 py-5">
      <h2 className="t-eyebrow text-ink-500">Overview</h2>

      <div className="mt-3 flex justify-center">
        {overallAfter === null && modelWaiting ? (
          <GaugePending
            caption={modelPreparing ? 'downloading' : 'scoring'}
            percent={typeof modelProgress?.progress === 'number' ? modelProgress.progress : null}
          />
        ) : (
          <Gauge value={overallAfter} suffix="%" tone={toneFor(overallAfter)} caption="Overall AI likelihood" />
        )}
      </div>

      {overallBefore !== null && overallAfter !== null && overallBefore !== overallAfter && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-ink-500">
          <span>Was {overallBefore}% before this rewrite</span>
          <span
            title={
              Math.abs(overallAfter - overallBefore) < OVERALL_DEAD_ZONE
                ? 'Within this test’s normal sampling noise, not a meaningful change.'
                : undefined
            }
            className={
              'figure rounded-full px-1.5 py-px text-[10px] font-semibold ' +
              (Math.abs(overallAfter - overallBefore) < OVERALL_DEAD_ZONE
                ? 'bg-ink-100 text-ink-500'
                : overallAfter < overallBefore
                  ? 'bg-mint-100 text-mint-700'
                  : 'bg-signal-100 text-signal-700')
            }
          >
            {overallAfter > overallBefore ? '+' : ''}
            {overallAfter - overallBefore}
          </span>
        </p>
      )}

      <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-500">
        The accumulation of every check this page ran: the trained detector, the surface-signal
        heuristic and the provenance-mark test together, not any single one of them alone.
        {modelWaiting && ' The trained detector is still loading and will refine this once it answers.'}
      </p>

      <div className="mt-5 space-y-3.5 border-t border-ink-100 pt-4">
        <ChannelBar
          label="Reads as AI to a human reader"
          value={summary.likelihoodAfter}
          before={summary.likelihoodBefore}
          max={100}
          tone={toneFor(summary.likelihoodAfter)}
          display={summary.likelihoodAfter === null ? 'n/a' : `${summary.likelihoodAfter}%`}
          note="Surface habits common in current AI output: punctuation, phrasing, word choice, sentence rhythm. Too little text to measure this yet."
          deadZone={OVERALL_DEAD_ZONE}
        />
        <ChannelBar
          label="Reads as AI to an AI detector"
          value={detectorAfter}
          before={detectorBefore}
          max={100}
          tone={toneFor(detectorAfter)}
          display={detectorAfter === null ? 'n/a' : `${detectorAfter}%`}
          deadZone={OVERALL_DEAD_ZONE}
          note={
            modelWaiting
              ? 'The trained detector is still loading; this is based on the watermark test alone for now.'
              : 'Neither the trained detector nor the watermark test produced a result for this document.'
          }
        />
        {detectorRoseOnUnmarkedText(summary, detectorBefore, detectorAfter) && (
          <p className="rounded-[var(--radius-control)] bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-500">
            No provenance mark was found either before or after this rewrite, so this figure&apos;s
            movement is mostly the provenance test itself: a statistical proportion test on the
            document&apos;s own word pairs, which can shift either direction on any unmarked text
            purely from wording changing, not evidence the rewrite made anything worse.
          </p>
        )}
      </div>
    </section>
  )
}

/**
 * Whether the "reads as AI to an AI detector" figure rose enough to look like
 * a regression, on a document where neither pass found an actual provenance
 * mark. That combination means most of the rise traces to the watermark
 * channel's own sampling noise (see watermarkDetectorScore in composite.ts):
 * a proportion test over word-pair choices has no reason to trend in either
 * direction on text nobody's generator actually marked, so a real, honestly
 * measured swing here still deserves the context, not just the number.
 */
function detectorRoseOnUnmarkedText(
  summary: RunSummary,
  detectorBefore: number | null,
  detectorAfter: number | null,
): boolean {
  if (detectorBefore === null || detectorAfter === null) return false
  if (summary.markDetected || summary.markDetectedBefore) return false
  return detectorAfter - detectorBefore >= OVERALL_DEAD_ZONE
}

/* ----------------------------------------------------------- what changed */

function WhatChanged({ summary }: { summary: RunSummary }) {
  const rewrittenOf = summary.passagesInDocument ?? summary.passagesRewritten

  return (
    <section className="rounded-[var(--radius-panel)] border border-ink-200 bg-white px-5 py-5">
      <h2 className="t-eyebrow text-ink-500">What changed</h2>
      <div className="mt-4 grid gap-2 @xs:grid-cols-2">
        <Tile label="Passages rewritten" value={`${summary.passagesRewritten}/${rewrittenOf}`} tone="seal" />
        <Tile label="Phrase swaps" value={summary.tellSwaps.toLocaleString()} />
        <Tile label="Word-pattern shift" value={`${summary.lexicalShift}%`} />
        <Tile
          label="Time on device"
          value={
            summary.processingTimeMs < 1000
              ? `${Math.round(summary.processingTimeMs)}ms`
              : `${(summary.processingTimeMs / 1000).toFixed(1)}s`
          }
        />
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- full analysis */

function disagreementNote(
  scored: boolean,
  readsAsAi: boolean,
  heuristicBand: RunSummary['band'],
): string | null {
  if (!scored || heuristicBand === null) return null
  const heuristicElevated = heuristicBand === 'elevated' || heuristicBand === 'high'
  if (!readsAsAi && heuristicElevated) {
    return 'Note: this model reads the text as human, but the surface-signal channel still rates it elevated. They measure different things and can disagree, so it is worth a look either way.'
  }
  if (readsAsAi && heuristicBand === 'low') {
    return 'Note: this model reads the text as AI, but the surface-signal channel found little to flag. They measure different things and can disagree.'
  }
  return null
}

function FullAnalysis({
  record,
  result,
  summary,
  mlClassifier,
  mlClassifierLoading,
  mlClassifierPreparing,
  mlClassifierProgress,
}: {
  record: RunRecord
  result: RewriteResult
  summary: RunSummary
  mlClassifier: MlClassifierResult | null
  mlClassifierLoading: boolean
  mlClassifierPreparing: boolean
  mlClassifierProgress: MlClassifierProgress | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <section className="rounded-[var(--radius-panel)] border border-ink-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-ink-800">Full analysis</span>
        <span className="text-[12px] font-medium text-seal-700">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-ink-100 px-5 py-5">
          <TrainedDetectorDetail
            record={record}
            result={mlClassifier}
            loading={mlClassifierLoading}
            preparing={mlClassifierPreparing}
            progress={mlClassifierProgress}
            heuristicBand={summary.band}
          />
          <ChannelsDetail result={result} summary={summary} />
          <JudgementCalls result={result} />
          <ExtendedLibraryNote result={result} />
          <DeepDive result={result} mlClassifier={mlClassifier} mlClassifierLoading={mlClassifierLoading} />
        </div>
      )}
    </section>
  )
}

function TrainedDetectorDetail({
  record,
  result,
  loading,
  preparing,
  progress,
  heuristicBand,
}: {
  record: RunRecord
  result: MlClassifierResult | null
  loading: boolean
  preparing: boolean
  progress: MlClassifierProgress | null
  heuristicBand: RunSummary['band']
}) {
  const waiting = loading || preparing || (result === null && !loading)
  const scored = !waiting && result?.status === 'ok' && result.aiProbability !== null
  const percent = scored ? Math.round(((result as MlClassifierResult).aiProbability as number) * 100) : null
  const readsAsAi = scored && (result as MlClassifierResult).label === 'ai'
  const note = disagreementNote(Boolean(scored), readsAsAi, heuristicBand)

  return (
    <div>
      <h3 className="t-eyebrow text-ink-500">Trained detector</h3>

      <div className="mt-3 flex justify-center">
        {waiting ? (
          <GaugePending
            caption={preparing ? 'downloading' : 'scoring'}
            percent={typeof progress?.progress === 'number' ? progress.progress : null}
          />
        ) : scored ? (
          <Gauge value={percent} suffix="%" tone={readsAsAi ? 'signal' : 'mint'} caption="AI likelihood" />
        ) : (
          <Gauge value={null} tone="ink" caption="not scored" />
        )}
      </div>

      {scored && (
        <>
          <div className="mx-auto flex max-w-[12rem] items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
            <span>Human</span>
            <span>AI</span>
          </div>
          <p className="mt-2.5 text-center text-[13px] text-ink-700">
            Reads as{' '}
            <span className={'font-semibold ' + (readsAsAi ? 'text-signal-700' : 'text-mint-700')}>
              {readsAsAi ? 'AI-written' : 'human-written'}
            </span>{' '}
            to this model.
          </p>
        </>
      )}

      <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
        {waiting
          ? preparing
            ? 'The detector is downloading into this tab. It runs on your device, so your text is never uploaded, and the score above waits for it rather than guessing ahead of it.'
            : 'Scoring your rewritten text on this device.'
          : result?.status === 'ok'
            ? 'The percentage above is always how likely this model thinks the text is AI-written: 0% is confidently human, 100% is confidently AI, and it never flips meaning based on the verdict.'
            : (result?.detail ?? 'No score was produced for this text.')}
      </p>

      {!waiting && result?.status === 'ok' && (
        <p className="mt-2 text-[12px] leading-relaxed text-ink-400">
          Trained on 2019-era generator output (GPT-2), and its own publisher cautions it may be
          less reliable on newer or frontier models. A low score here is not proof of anything on
          its own, which is why it feeds the Overview figures above alongside the other channels
          rather than standing in for them. See the surface signals below, which look for
          different things and can catch what this misses.
        </p>
      )}

      {note && (
        <p className="mt-2 rounded-[var(--radius-control)] bg-ink-50 px-3 py-2 text-[12px] leading-relaxed text-ink-600">
          {note}
        </p>
      )}

      <p className="mt-3 border-t border-ink-100 pt-3 text-[12px] text-ink-500">
        {record.engineUsed}
        {record.revision > 0 && ` · pass ${record.revision + 1}`}
      </p>
    </div>
  )
}

function ChannelsDetail({ result, summary }: { result: RewriteResult; summary: RunSummary }) {
  const keysTested = result.documentAfter?.watermark.keysTested.length ?? 0
  const likelihoodTone: ChartTone =
    summary.band === 'high' || summary.band === 'elevated' ? 'signal' : 'mint'

  const flaggedMax = Math.max(
    1,
    summary.survivedBefore ?? 0,
    summary.survivedAfter ?? 0,
    summary.passagesInDocument ?? 0,
  )

  return (
    <div className="border-t border-ink-100 pt-4">
      <h3 className="t-eyebrow text-ink-500">Surface signals</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-400">
        The channels the rewrite steers by, and the raw figures the Overview above is built from.
      </p>

      <div className="mt-4 space-y-3.5">
        <ChannelBar
          label="AI-style likelihood"
          value={summary.likelihoodAfter}
          before={summary.likelihoodBefore}
          max={100}
          tone={likelihoodTone}
          display={summary.likelihoodAfter === null ? 'n/a' : `${summary.likelihoodAfter}/100`}
          deadZone={OVERALL_DEAD_ZONE}
          note={
            result.documentAfter?.aiLikelihood?.detail ??
            'Too short for the sentence-rhythm rates this channel is built on.'
          }
        />
        <ChannelBar
          label="Passages a detector would flag"
          value={summary.survivedAfter}
          before={summary.survivedBefore}
          max={flaggedMax}
          tone={summary.survivedAfter ? 'signal' : 'mint'}
          display={summary.survivedAfter === null ? 'n/a' : String(summary.survivedAfter)}
          note="No passage-level correction was computed for this document."
        />
      </div>

      <div className="mt-4 grid gap-2 @xs:grid-cols-2">
        <Tile
          label="Provenance mark"
          value={result.documentAfter ? (summary.markDetected ? 'found' : 'none found') : 'n/a'}
          tone={summary.markDetected ? 'signal' : 'mint'}
        />
        <Tile
          label="Watermark z"
          value={summary.watermarkAfter === null ? 'n/a' : summary.watermarkAfter.toFixed(2)}
        />
      </div>

      <dl className="mt-4 space-y-2.5 border-t border-ink-100 pt-3 text-[12px] leading-relaxed text-ink-500">
        <div>
          <dt className="font-semibold text-ink-700">AI-style likelihood</dt>
          <dd>
            A count of surface habits common in current model output, tuned to flag rather than to
            clear. A prompt to look closer, not a verdict about how anything was written.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink-700">Passages a detector would flag</dt>
          <dd>
            Passages whose signal survives correction for multiple comparisons across the whole
            document, so a long text does not accumulate flags simply by being long.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink-700">Provenance mark and watermark z</dt>
          <dd>
            A real statistical test over the order and frequency of word pairs in the document,
            not a search for one fixed signature: it checks whether word pairs favour a
            &quot;green&quot; list a marked generator would have biased its sampling toward, under
            the <span className="figure">{keysTested}</span> key{keysTested === 1 ? '' : 's'} this
            page holds. Zero is where that statistic sits when there is nothing to find. No model
            vendor publishes their key, so this can only test the keys listed here. It cannot rule
            out a mark applied with a key nobody outside that vendor holds, which is exactly why
            &quot;Word-pattern shift&quot; (see What changed above) exists: a hedge that varies
            word choice regardless of whether this test finds anything.
          </dd>
        </div>
      </dl>
    </div>
  )
}
