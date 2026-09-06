/**
 * The rewrite orchestrator.
 *
 * Isomorphic, with no DOM or Node-only API, so it runs unchanged in a browser
 * Worker, in the MCP server process, and in the published CLI/package. Only
 * the RewriteBackend passed in differs by environment.
 *
 * Loop, per round: run the deterministic tell-pass once at the start, target
 * the passages worth touching (from the detector's own per-passage findings),
 * generate + score candidates for each, replace the best survivor, re-run the
 * real detector on the assembled result, and stop when there's no more
 * targetable evidence or MAX_ROUNDS is reached, whichever comes first. A
 * passage with no candidate that clears both the fact-lock and the similarity
 * floor is left completely unchanged, on purpose: an unsafe rewrite is worse
 * than no rewrite.
 */

import { checkDocument } from '@/lib/detector'
import type { DetectionKey } from '@/lib/detector/keys'
import type { PassageFinding } from '@/lib/detector'
import { applyDeterministicPass } from '@/lib/calibrate/ai-tells'
import type { RewriteBackend } from './backend/types'
import { candidateCount, minSimilarity, targetPassages, MAX_ROUNDS } from './targeting'
import { scoreCandidates, pickBest } from './scoring'
import type { PassageRewrite, RewriteRequest, RewriteResult } from './types'

export const REWRITE_LIMITS: string[] = [
  'This reduces detectable AI-style evidence. It cannot guarantee defeating a model vendor\'s undisclosed watermark. No tool can, since nobody outside that vendor holds the key it was applied with.',
  'Heavier rewriting (the "aggressive" and "regenerate" strengths) trades fidelity to your original wording for a larger reduction in evidence. Review the diff before using the result.',
  'The evidence scores shown use the same detector arithmetic as MarkWitness\'s own check, tested against the keys this deployment holds, not a specific vendor\'s undisclosed detector.',
  'All processing happens on this device or process. No document text is ever sent anywhere by this feature, on any tier.',
]

function replacePassages(text: string, replacements: Array<{ start: number; end: number; text: string }>): string {
  const sorted = [...replacements].sort((a, b) => a.start - b.start)
  let result = ''
  let cursor = 0
  for (const r of sorted) {
    result += text.slice(cursor, r.start) + r.text
    cursor = r.end
  }
  result += text.slice(cursor)
  return result
}

export async function rewriteDocument(
  request: RewriteRequest,
  backend: RewriteBackend,
  keys: DetectionKey[],
): Promise<RewriteResult> {
  const startTime = Date.now()

  if (!request.text || request.text.trim().length === 0) {
    return {
      status: 'error',
      error: 'Text is empty.',
      documentBefore: null,
      documentAfter: null,
      passages: [],
      revisedText: '',
      tellChangeCount: 0,
      flaggedStructures: [],
      elevatedVocabulary: [],
      additionalTellsInExtendedLibrary: 0,
      roundsUsed: 0,
      tier: request.tier,
      strength: request.strength,
      processingTimeMs: Date.now() - startTime,
      limits: REWRITE_LIMITS,
    }
  }

  // Pro gets the extended AI-tell library (PLANS.pro.rewrite.tellLibrary in
  // src/lib/site.ts). This is the tier difference the product actually
  // promises, applied here rather than described in marketing copy only.
  const {
    text: afterTells,
    changes: tellChanges,
    flaggedStructures,
    elevatedVocabulary,
  } = applyDeterministicPass(
    request.text,
    request.strength,
    request.tier === 'pro' ? 'extended' : 'core',
  )

  // What the extended library would additionally have caught here. Measured
  // on this document rather than claimed in the abstract, so the free tier
  // can be told the truth about what it is and isn't catching instead of
  // being shown a marketing number.
  const additionalTellsInExtendedLibrary =
    request.tier === 'pro'
      ? 0
      : Math.max(
          0,
          applyDeterministicPass(request.text, request.strength, 'extended').changes.length -
            tellChanges.length,
        )

  let currentText = afterTells
  let analysis = await checkDocument(currentText, { keys, language: request.language })
  const documentBefore = analysis

  const passageResults = new Map<number, PassageRewrite>()
  // A passage is attempted at most once, ever. The rule-based backend is
  // deterministic per (passage text, seed), so feeding an already-rewritten
  // passage back through generate() in a later round doesn't produce a
  // better result, it re-applies substitutions on top of the last round's
  // output and compounds (this was a real bug: at "regenerate" strength,
  // which retargets every passage every round by design, a passage could be
  // rewritten five times over, turning a single "with" into a chain of
  // repeated words). Once attempted, successfully or not, a passage is done.
  const attempted = new Set<number>()
  let round = 0

  for (; round < MAX_ROUNDS; round++) {
    const targets = targetPassages(analysis.passages, request.strength).filter((p) => !attempted.has(p.index))
    if (targets.length === 0) break

    const replacements: Array<{ start: number; end: number; text: string; index: number }> = []

    for (const passage of targets) {
      attempted.add(passage.index)
      const candidateTexts = await backend.generate(passage.text, {
        count: candidateCount(request.tier),
        strength: request.strength,
        language: request.language ?? analysis.language.code ?? undefined,
      })

      const scored = await scoreCandidates(passage.text, candidateTexts, backend, {
        minSimilarity: minSimilarity(request.strength),
        keys,
      })

      const best = pickBest(scored)
      const chosenText = best?.text ?? passage.text

      if (best) {
        replacements.push({ start: passage.start, end: passage.end, text: chosenText, index: passage.index })
      }

      passageResults.set(passage.index, mergeExisting(passageResults.get(passage.index), {
        index: passage.index,
        original: passageResults.get(passage.index)?.original ?? passage.text,
        chosen: best ? chosenText : null,
        candidates: scored,
        beforeZ: passageResults.get(passage.index)?.beforeZ ?? passage.watermarkZ,
        afterZ: best?.evidenceZ ?? passage.watermarkZ,
        beforeStyleDeviation: passageResults.get(passage.index)?.beforeStyleDeviation ?? passage.styleDeviation,
        reason: best ? 'llm-rewrite' : 'unchanged-no-safe-candidate',
      }))
    }

    if (replacements.length === 0) break // every targeted passage had no safe candidate, so there is nothing more to do

    currentText = replacePassages(currentText, replacements)
    const next = await checkDocument(currentText, { keys, language: request.language })

    const survivedBefore = analysis.passageCorrection?.survived ?? 0
    const survivedAfter = next.passageCorrection?.survived ?? 0
    analysis = next
    if (survivedAfter >= survivedBefore && replacements.length < targets.length) break
    if (survivedAfter === 0 && survivedBefore === 0 && request.strength !== 'regenerate') break
  }

  return {
    status: 'ok',
    documentBefore,
    documentAfter: analysis,
    passages: [...passageResults.values()].sort((a, b) => a.index - b.index),
    revisedText: currentText,
    tellChangeCount: tellChanges.length,
    flaggedStructures: flaggedStructures.map((f) => ({ kind: f.kind, text: f.text, note: f.note })),
    elevatedVocabulary: elevatedVocabulary.filter((v) => v.count >= 2),
    additionalTellsInExtendedLibrary,
    roundsUsed: round,
    tier: request.tier,
    strength: request.strength,
    processingTimeMs: Date.now() - startTime,
    limits: REWRITE_LIMITS,
  }
}

function mergeExisting(existing: PassageRewrite | undefined, next: PassageRewrite): PassageRewrite {
  if (!existing) return next
  // A later round re-targeting the same passage index should accumulate
  // candidates for review, but the displayed "chosen" text is always the
  // most recent round's pick.
  return { ...next, candidates: [...existing.candidates, ...next.candidates] }
}

export type { PassageFinding }
