import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyApiKey } from '@/lib/api-keys'
import { currentEntitlements } from '@/lib/auth'
import { databaseConfigured, sql } from '@/lib/db'
import { buildEvidenceReport } from '@/lib/evidence-report'
import { analyzeOnServer } from '@/lib/server-engine'
import { billableUnits, checkAllowance, recordUsage } from '@/lib/metering'
import { countWords } from '@/lib/detector/tokenize'
import { SUPPORTED_LANGUAGES } from '@/lib/detector/languages'
import type { AnalysisResult } from '@/lib/detector'

export const runtime = 'nodejs'

/**
 * POST /api/v1/report, the dated PDF evidence report. Pro only.
 *
 * This is the paid wedge, and it is a wedge rather than a wrapper for a specific
 * reason: it is not the free result in a different container. The free check
 * runs in the browser and by design leaves nothing behind, so there is nothing
 * to date, nothing to tie to a stored record, and nothing a third party can be
 * pointed at. This endpoint runs the analysis on the server against every key
 * the deployment holds, including any vendor key that cannot be shipped to a
 * browser without publishing it, records the check, and renders a document
 * anchored to the exact text by its SHA-256.
 *
 * It is reachable by a machine, with an API key, not only by a human clicking.
 */

const BodySchema = z.object({
  text: z.string().min(1).optional(),
  /** Regenerate from a stored check, so the report shows the numbers the user saw. */
  checkId: z.string().min(1).optional(),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
})

export async function POST(request: Request) {
  if (!databaseConfigured()) {
    return NextResponse.json(
      {
        error: 'reports_unavailable',
        message:
          'This deployment has no database configured, so entitlement cannot be established and reports are unavailable.',
      },
      { status: 503 },
    )
  }

  // Either an API key or a signed-in session identifies the caller.
  const key = await verifyApiKey(request.headers.get('authorization'))
  let accountId: string | null = key?.accountId ?? null
  let plan = key?.plan ?? null

  if (!accountId) {
    const entitlements = await currentEntitlements()
    if (entitlements.signedIn) {
      accountId = entitlements.userId
      plan = entitlements.plan
    }
  }

  if (!accountId) {
    return NextResponse.json(
      {
        error: 'unauthorized',
        message: 'Sign in, or present a MarkWitness API key as "Authorization: Bearer mw_live_...".',
      },
      { status: 401 },
    )
  }

  if (plan !== 'pro') {
    return NextResponse.json(
      {
        error: 'pro_required',
        message:
          'The evidence report is a Pro capability. The free check gives you the same measurement on screen; the report is the dated, hash-anchored document you can hand to someone else.',
        pricing: '/pricing',
      },
      { status: 402 },
    )
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || (!parsed.data.text && !parsed.data.checkId)) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Provide either "text" to analyse, or "checkId" of a stored check.' },
      { status: 400 },
    )
  }

  let result: AnalysisResult

  if (parsed.data.checkId) {
    const rows = (await sql()`
      select result from checks where id = ${parsed.data.checkId} and account_id = ${accountId} limit 1
    `) as Array<{ result: AnalysisResult }>
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'not_found', message: 'No stored check with that id belongs to this account.' },
        { status: 404 },
      )
    }
    // Deliberately NOT re-analysed. A report is supposed to document the check
    // that was run, and re-running it could produce different figures from a
    // later engine or baseline than the ones the user is arguing about.
    result = rows[0].result
  } else {
    const text = parsed.data.text as string
    const words = countWords(text)
    const allowance = await checkAllowance(accountId, plan, words)
    if (!allowance.allowed) {
      return NextResponse.json({ error: 'allowance_exceeded', message: allowance.reason }, { status: 402 })
    }

    result = await analyzeOnServer(text, { language: parsed.data.language })
    await recordUsage({
      accountId,
      apiKeyId: key?.id ?? null,
      surface: key ? 'api' : 'web',
      words,
      documentHash: result.documentHash,
    })

    const id = `chk_${result.documentHash.slice(0, 16)}_${Date.now().toString(36)}`
    await sql()`
      insert into checks (id, account_id, document_hash, language, words, result)
      values (${id}, ${accountId}, ${result.documentHash}, ${result.language.code}, ${words}, ${JSON.stringify(result)}::jsonb)
    `
  }

  const pdf = await buildEvidenceReport(result)

  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="markwitness-evidence-${result.documentHash.slice(0, 12)}.pdf"`,
      'X-MarkWitness-Billable-Units': String(billableUnits(result.words)),
      'Cache-Control': 'no-store',
    },
  })
}
