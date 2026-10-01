import { NextResponse } from 'next/server'
import { currentEntitlements } from '@/lib/auth'
import { analyticsIdentityFor } from '@/lib/analytics-identity'

export const runtime = 'nodejs'

/**
 * The signed-in visitor's analytics identity: a hashed reference and a plan,
 * never the id or the email. 204 means nobody is signed in.
 */
export async function GET() {
  const entitlements = await currentEntitlements()
  if (!entitlements.signedIn || !entitlements.userId) {
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  }
  const identity = await analyticsIdentityFor(entitlements.userId, entitlements.plan)
  return NextResponse.json(identity, { headers: { 'Cache-Control': 'no-store' } })
}
