import { toNextJsHandler } from 'better-auth/next-js'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { databaseConfigured } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * Better Auth's handler.
 *
 * Wrapped so that a deployment with no database returns an explicit 503 saying
 * accounts are unavailable, rather than a stack trace from the auth library.
 */
async function handle(request: Request) {
  if (!databaseConfigured()) {
    return NextResponse.json(
      {
        error: 'accounts_unavailable',
        message:
          'This deployment has no database configured, so accounts are unavailable. The on-device check at /check works without an account.',
      },
      { status: 503 },
    )
  }
  const handler = toNextJsHandler(auth())
  return request.method === 'GET' ? handler.GET(request) : handler.POST(request)
}

export const GET = handle
export const POST = handle
