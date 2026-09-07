/**
 * POST /api/v1/calibrate
 *
 * Text calibration endpoint: helps users understand their text's statistical
 * profile and suggest synonym replacements to adjust word frequencies.
 *
 * The lighter, deterministic layer behind the fuller on-device rewrite engine
 * (src/lib/rewrite, exposed as reduce_ai_evidence): suggests substitutions
 * with before/after metrics rather than producing a finished, targeted
 * rewrite. See docs/REWRITE_PHILOSOPHY.md for what the rewrite capability
 * claims and does not claim.
 *
 * Authentication: Optional (same as /check endpoint)
 * Metering: An API key gets real, tracked, database-backed metering
 * (checkAllowance/recordUsage, the same ledger /api/v1/check uses).
 * An anonymous call gets a per-request word cap only: there is no caller
 * identity to track cumulative usage against in a stateless REST call, so
 * this endpoint does not claim to enforce a "daily budget" for anonymous
 * callers (a previous version imported the browser-only, IndexedDB-backed
 * budget tracker from calibrate/metering.ts here, which crashed on every
 * call, since indexedDB does not exist in a server runtime; that tracker is
 * for src/components/calibrator/budget-status.tsx, a client component,
 * only).
 * Rate Limiting: Inherited from API key verification
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { calibrateText, type CalibrationRequest } from '@/lib/calibrate'
import { countWords } from '@/lib/detector/tokenize'
import { SUPPORTED_LANGUAGES } from '@/lib/detector/languages'
import { verifyApiKey, type VerifiedKey } from '@/lib/api-keys'
import { databaseConfigured } from '@/lib/db'
import { checkAllowance, recordUsage, billableUnits, unitsToPence } from '@/lib/metering'
import { PLANS } from '@/lib/site'

export const runtime = 'nodejs'

/**
 * Request body schema
 */
const BodySchema = z.object({
  text: z.string().min(1, 'text is required'),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
  mode: z.enum(['preview', 'apply']).optional().default('preview'),
  config: z
    .object({
      confidenceThreshold: z.number().min(0).max(1).optional(),
      maxRepeats: z.number().int().min(1).optional(),
      targetDiversity: z.number().optional(),
    })
    .optional(),
})

type RequestBody = z.infer<typeof BodySchema>

/**
 * POST /api/v1/calibrate
 *
 * Calibrates text for statistical profile adjustment.
 * Returns substitution suggestions and before/after metrics.
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          error: 'invalid_json',
          message: 'Request body must be valid JSON',
        },
        { status: 400 },
      )
    }

    // Validate request schema
    let validated: RequestBody
    try {
      validated = BodySchema.parse(body)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'validation_error',
            message: err.issues[0]?.message || 'Invalid request body',
            details: err.issues,
          },
          { status: 400 },
        )
      }
      throw err
    }

    const { text, language, mode, config } = validated

    // Check if authentication is required (optional, like /check)
    let apiKey: VerifiedKey | null = null
    const authHeader = request.headers.get('authorization')

    if (authHeader) {
      try {
        apiKey = await verifyApiKey(authHeader)
      } catch (err) {
        return NextResponse.json(
          {
            error: 'verification_failed',
            message: (err as Error).message,
          },
          { status: 403 },
        )
      }

      if (!apiKey) {
        return NextResponse.json(
          {
            error: 'unauthorized',
            message:
              'API key verification failed. Provide a valid WatermarkRemoverPro API key as "Authorization: Bearer mw_live_...".',
          },
          { status: 401 },
        )
      }
    }

    // Count words for metering
    const wordCount = countWords(text)
    const billableWords = billableUnits(wordCount)

    // Anonymous calls get a per-request word cap, the same no-account cap
    // the browser check uses (PLANS.anonymous.wordCap), not a tracked daily
    // budget: there is no caller identity in a stateless REST call to track
    // cumulative usage against, so this is the honest limit this endpoint
    // can actually enforce without an API key.
    const anonymousWordCap = PLANS.anonymous.wordCap
    if (!apiKey && wordCount > anonymousWordCap) {
      return NextResponse.json(
        {
          error: 'request_too_large',
          message: `Anonymous requests are capped at ${anonymousWordCap.toLocaleString()} words per call; this text is ${wordCount.toLocaleString()} words. Provide a WatermarkRemoverPro API key for a higher, metered limit.`,
          limit: anonymousWordCap,
        },
        { status: 413 },
      )
    }

    // Real, database-backed allowance for API-key callers, the same
    // checkAllowance/recordUsage ledger /api/v1/check uses.
    let allowance: Awaited<ReturnType<typeof checkAllowance>> | null = null
    if (apiKey && databaseConfigured()) {
      try {
        allowance = await checkAllowance(apiKey.accountId, 'free', billableWords)
        if (!allowance.allowed) {
          return NextResponse.json(
            {
              error: 'insufficient_allowance',
              message: allowance.reason || 'Account does not have sufficient calibration allowance. Please check your account plan or contact support.',
              plan: allowance.plan,
              wordCap: allowance.wordCap,
              checksThisMonth: allowance.checksThisMonth,
              checksPerMonth: allowance.checksPerMonth,
            },
            { status: 402 },
          )
        }
      } catch (err) {
        console.error('Allowance check failed:', err)
        // Don't fail the request, but log it
      }
    }

    // Run calibration engine
    const result = await calibrateText({
      text,
      language,
      mode,
      config,
    } as CalibrationRequest)

    if (result.status !== 'ok') {
      // These are foreseeable, documented conditions (whitespace-only text
      // that passed the schema's non-empty check; a language the calibrate
      // dictionary doesn't cover yet, currently English only, see
      // calibrate/dictionary.ts), not an unexpected server malfunction, so
      // they get a 4xx that names the real cause rather than an opaque 500.
      const isEmptyText = result.error === 'Text is empty'
      const isUnsupportedLanguage = result.error?.startsWith('Dictionary not available for language')
      return NextResponse.json(
        {
          error: isEmptyText ? 'validation_error' : isUnsupportedLanguage ? 'language_not_supported' : 'calibration_failed',
          message: result.error || 'Calibration could not be completed',
          result,
        },
        // Matches the 400 this route already uses for every other input
        // problem (invalid JSON, schema failures): these are foreseeable
        // input issues too, not an unexpected server-side failure.
        { status: isEmptyText || isUnsupportedLanguage ? 400 : 500 },
      )
    }

    let billableUnitsRecorded = 0
    if (apiKey && databaseConfigured()) {
      try {
        billableUnitsRecorded = await recordUsage({
          accountId: apiKey.accountId,
          apiKeyId: apiKey.id,
          surface: 'api',
          words: wordCount,
          documentHash: text.substring(0, 32), // Simple hash approximation
        })
      } catch (err) {
        console.error('Failed to record usage:', err)
        // Don't fail the request
      }
    }

    // Build response. Every figure here is real: computed from this
    // request, or (for an API-key caller) read back from the same ledger
    // /api/v1/check bills against, never a fabricated placeholder.
    const response = {
      result,
      usage: {
        tokens: wordCount,
        billableWords,
        billableCost: apiKey ? `${unitsToPence(billableUnitsRecorded || billableWords)}p` : null,
      },
      mode: apiKey ? 'authenticated' : 'anonymous',
      limits: apiKey
        ? {
            plan: allowance?.plan ?? null,
            wordCap: allowance?.wordCap ?? null,
            checksThisMonth: allowance?.checksThisMonth ?? null,
            checksPerMonth: allowance?.checksPerMonth ?? null,
          }
        : {
            requestWordCap: anonymousWordCap,
            note: 'Anonymous calls are capped per request; daily usage is not tracked server-side without an API key.',
          },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (err) {
    console.error('Calibrate endpoint error:', err)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An unexpected error occurred during calibration',
      },
      { status: 500 },
    )
  }
}

/**
 * OPTIONS /api/v1/calibrate
 *
 * CORS preflight
 */
export async function OPTIONS(_request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Length': '0',
    },
  })
}
