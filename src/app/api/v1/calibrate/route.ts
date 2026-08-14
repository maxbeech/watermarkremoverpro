/**
 * POST /api/v1/calibrate
 *
 * Text calibration endpoint: helps users understand their text's statistical
 * profile and suggest synonym replacements to adjust word frequencies.
 *
 * This is NOT a mark removal tool. It helps writers understand patterns
 * that might trigger statistical AI detection, and suggests natural rewrites.
 *
 * Authentication: Optional (same as /check endpoint)
 * Metering: Counts against user's daily budget
 * Rate Limiting: Inherited from API key verification
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { calibrateText, type CalibrationRequest } from '@/lib/calibrate'
import { checkDailyBudget, recordCalibration } from '@/lib/calibrate/metering'
import { countWords } from '@/lib/detector/tokenize'
import { SUPPORTED_LANGUAGES } from '@/lib/detector/languages'
import { verifyApiKey, type VerifiedKey } from '@/lib/api-keys'
import { databaseConfigured } from '@/lib/db'
import { checkAllowance, recordUsage, billableUnits } from '@/lib/metering'

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
    } catch (err) {
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
              'API key verification failed. Provide a valid MarkWitness API key as "Authorization: Bearer mw_live_...".',
          },
          { status: 401 },
        )
      }
    }

    // Count words for metering
    const wordCount = countWords(text)
    const billableWords = billableUnits(wordCount)

    // Check daily budget (free tier if no API key)
    const budgetStatus = await checkDailyBudget(wordCount, !!apiKey)
    if (!budgetStatus.allowed) {
      return NextResponse.json(
        {
          error: 'daily_limit_exceeded',
          message: `Daily calibration limit reached. You've processed ${budgetStatus.used} of ${budgetStatus.limit} words today. Resets at ${budgetStatus.resetTime}.`,
          usage: {
            used: budgetStatus.used,
            limit: budgetStatus.limit,
            remaining: budgetStatus.remaining,
          },
        },
        { status: 429 },
      )
    }

    // If API key provided, check database metering
    if (apiKey && databaseConfigured()) {
      try {
        const allowance = await checkAllowance(apiKey.accountId, 'free', billableWords)
        if (!allowance.allowed) {
          return NextResponse.json(
            {
              error: 'insufficient_allowance',
              message: allowance.reason || 'Account does not have sufficient calibration allowance. Please check your account plan or contact support.',
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
      return NextResponse.json(
        {
          error: 'calibration_failed',
          message: result.error || 'Calibration could not be completed',
          result,
        },
        { status: 500 },
      )
    }

    // Record usage (local and server-side if API key)
    await recordCalibration(wordCount, result.substitutions.length)

    if (apiKey && databaseConfigured()) {
      try {
        await recordUsage({
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

    // Build response
    const API_PRICE_PENCE_PER_1K_WORDS = 1 // Placeholder; use real value from site config if needed
    const response = {
      result,
      usage: {
        tokens: wordCount,
        billableWords,
        billableCost: apiKey ? `${billableWords * API_PRICE_PENCE_PER_1K_WORDS}p` : null,
      },
      mode: apiKey ? 'authenticated' : 'anonymous',
      limits: {
        daily: budgetStatus.limit,
        used: budgetStatus.used,
        remaining: budgetStatus.remaining,
        resetAt: budgetStatus.resetTime,
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
export async function OPTIONS(request: Request) {
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
