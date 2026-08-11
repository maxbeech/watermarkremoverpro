import 'server-only'
import { betterAuth } from 'better-auth'
import { Pool } from '@neondatabase/serverless'
import { headers } from 'next/headers'
import { DatabaseUnavailableError, sql } from './db'
import { SITE } from './site'

/**
 * Better Auth over the Neon database.
 *
 * Built lazily so `next build` never needs DATABASE_URL. Calling auth() on a
 * deployment without a database throws rather than starting a half-working auth
 * system that appears to sign people in and silently loses their sessions.
 */

export type Plan = 'free' | 'pro'

export interface Entitlements {
  signedIn: boolean
  pro: boolean
  plan: Plan
  userId: string | null
  email: string | null
}

export const ANONYMOUS: Entitlements = { signedIn: false, pro: false, plan: 'free', userId: null, email: null }

let poolClient: Pool | null = null

function pool(): Pool {
  if (!process.env.DATABASE_URL) throw new DatabaseUnavailableError()
  return (poolClient ??= new Pool({ connectionString: process.env.DATABASE_URL }))
}

function build() {
  return betterAuth({
    database: pool(),
    baseURL: SITE.url,
    secret: requireSecret(),
    emailAndPassword: { enabled: true, minPasswordLength: 10 },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  })
}

let instance: ReturnType<typeof build> | null = null

export function auth(): ReturnType<typeof build> {
  if (!process.env.DATABASE_URL) throw new DatabaseUnavailableError()
  return (instance ??= build())
}

function requireSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'BETTER_AUTH_SECRET must be set to a random value of at least 32 characters. Without it, session tokens could be forged.',
    )
  }
  return secret
}

/**
 * The app-side profile row.
 *
 * Deliberately separate from Better Auth's own user table: plan, Stripe
 * customer and every foreign key in this product point here, so an upgrade to
 * Better Auth that renames or reshapes its tables cannot orphan a user's saved
 * checks or API keys.
 */
export async function ensureAccount(userId: string, email: string, name?: string | null): Promise<Plan> {
  const rows = (await sql()`
    insert into accounts (id, email, name)
    values (${userId}, ${email}, ${name ?? null})
    on conflict (id) do update set email = excluded.email
    returning plan
  `) as Array<{ plan: string }>
  return rows[0]?.plan === 'pro' ? 'pro' : 'free'
}

/**
 * Who is calling, and what they are entitled to.
 *
 * Returns ANONYMOUS when there is no session OR when the database is
 * unavailable. That second case is deliberate: with no database we cannot
 * establish entitlement, and the safe reading of "cannot establish" is "not
 * entitled" — never "assume Pro".
 */
export async function currentEntitlements(): Promise<Entitlements> {
  if (!process.env.DATABASE_URL) return ANONYMOUS

  try {
    const session = await auth().api.getSession({ headers: await headers() })
    if (!session?.user) return ANONYMOUS

    const plan = await ensureAccount(session.user.id, session.user.email, session.user.name)
    return {
      signedIn: true,
      pro: plan === 'pro',
      plan,
      userId: session.user.id,
      email: session.user.email,
    }
  } catch {
    return ANONYMOUS
  }
}
