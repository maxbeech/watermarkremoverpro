import { NextResponse } from 'next/server'
import { z } from 'zod'
import { issueApiKey, listApiKeys, revokeApiKey } from '@/lib/api-keys'
import { currentEntitlements } from '@/lib/auth'
import { databaseConfigured } from '@/lib/db'

export const runtime = 'nodejs'

/** API key management for a signed-in account. Session-authenticated only,
 *  an API key may not mint further API keys, so a leaked key cannot be used to
 *  establish persistence beyond its own revocation. */
async function requireAccount() {
  if (!databaseConfigured()) {
    return {
      error: NextResponse.json(
        { error: 'accounts_unavailable', message: 'This deployment has no database configured.' },
        { status: 503 },
      ),
    }
  }
  const entitlements = await currentEntitlements()
  if (!entitlements.signedIn || !entitlements.userId) {
    return { error: NextResponse.json({ error: 'unauthorized', message: 'Sign in first.' }, { status: 401 }) }
  }
  return { accountId: entitlements.userId }
}

export async function GET() {
  const ctx = await requireAccount()
  if (ctx.error) return ctx.error
  return NextResponse.json({ keys: await listApiKeys(ctx.accountId) })
}

export async function POST(request: Request) {
  const ctx = await requireAccount()
  if (ctx.error) return ctx.error

  const parsed = z
    .object({ label: z.string().min(1).max(80) })
    .safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request', message: 'A label of 1-80 characters is required.' }, { status: 400 })
  }

  const { secret, ...key } = await issueApiKey(ctx.accountId, parsed.data.label)
  // The secret is returned exactly once and never stored in clear.
  return NextResponse.json({ key, secret }, { status: 201 })
}

export async function DELETE(request: Request) {
  const ctx = await requireAccount()
  if (ctx.error) return ctx.error

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'invalid_request', message: 'Pass ?id=<key id>.' }, { status: 400 })

  const revoked = await revokeApiKey(ctx.accountId, id)
  if (!revoked) {
    return NextResponse.json(
      { error: 'not_found', message: 'No active key with that id belongs to this account.' },
      { status: 404 },
    )
  }
  return NextResponse.json({ revoked: true })
}
