import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyApiKey } from '@/lib/api-keys'
import { databaseConfigured } from '@/lib/db'
import { analyzeOnServer } from '@/lib/server-engine'
import { billableUnits, checkAllowance, recordUsage, unitsToPence } from '@/lib/metering'
import { countWords } from '@/lib/detector/tokenize'
import { SUPPORTED_LANGUAGES } from '@/lib/detector/languages'

export const runtime = 'nodejs'

/**
 * POST /api/v1/check — the metered capability.
 *
 * This is the surface an agent buys. It is the same engine the browser runs, so
 * the numbers an agent gets are the numbers a person would get on the same text,
 * plus the keys only a server can hold.
 *
 * Note what this endpoint does NOT offer, on any plan: any form of mark removal,
 * reduction, paraphrase or rewrite. There is no parameter for it and no sibling
 * route that does it.
 */

const BodySchema = z.object({
  text: z.string().min(1, 'text is required'),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
  granularity: z.enum(['sentence', 'paragraph']).optional(),
  fdr: z.number().gt(0).lt(1).optional(),
})

export async function POST(request: Request) {
  if (!databaseConfigured()) {
    // Metered access cannot be granted without the ledger that meters it.
    return NextResponse.json(
      {
        error: 'metering_unavailable',
        message:
          'This deployment has no database configured, so API keys cannot be verified and usage cannot be metered. The on-device check at /check is unaffected.',
      },
      { status: 503 },
    )
  }

  let key
  try {
    key = await verifyApiKey(request.headers.get('authorization'))
  } catch (err) {
    return NextResponse.json(
      { error: 'verification_failed', message: (err as Error).message },
      { status: 503 },
    )
  }

  if (!key) {
    return NextResponse.json(
      {
        error: 'unauthorized',
        message: 'Provide a MarkWitness API key as "Authorization: Bearer mw_live_...".',
        documentation: '/docs/api',
      },
      { status: 401 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'The request body is not valid JSON.' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'invalid_request',
        message: 'The request body did not validate.',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
      { status: 400 },
    )
  }

  const words = countWords(parsed.data.text)
  const allowance = await checkAllowance(key.accountId, key.plan, words)
  if (!allowance.allowed) {
    return NextResponse.json(
      {
        error: 'allowance_exceeded',
        message: allowance.reason,
        plan: allowance.plan,
        wordCap: allowance.wordCap,
        checksThisMonth: allowance.checksThisMonth,
        checksPerMonth: allowance.checksPerMonth,
      },
      { status: 402 },
    )
  }

  const result = await analyzeOnServer(parsed.data.text, {
    language: parsed.data.language,
    granularity: parsed.data.granularity,
    fdr: parsed.data.fdr,
  })

  // Metered on words submitted, whether or not a statistic could be computed —
  // a document too short to score still costs a call. That is stated in the
  // pricing document rather than being a surprise on an invoice.
  const units = await recordUsage({
    accountId: key.accountId,
    apiKeyId: key.id,
    surface: 'api',
    words,
    documentHash: result.documentHash,
  })

  return NextResponse.json(
    {
      result,
      billing: {
        words,
        billableUnits: units,
        unitWords: 1000,
        pence: unitsToPence(units),
        currency: 'GBP',
      },
    },
    {
      status: 200,
      headers: {
        'X-MarkWitness-Billable-Units': String(units),
        'Cache-Control': 'no-store',
      },
    },
  )
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'method_not_allowed',
      message: 'POST a JSON body of { text, language?, granularity?, fdr? } to this endpoint.',
      documentation: '/docs/api',
      pricing: '/pricing.json',
      unitPreview: { unitWords: 1000, pencePerUnit: unitsToPence(billableUnits(1000)), currency: 'GBP' },
    },
    { status: 405 },
  )
}
