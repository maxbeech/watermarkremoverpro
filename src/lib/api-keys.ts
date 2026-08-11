import { sha256Hex } from '@/lib/detector/crypto'
import { sql } from '@/lib/db'

/**
 * API key issuance and verification.
 *
 * Keys are stored as a SHA-256 hash and shown to the user exactly once. The
 * prefix is stored in clear so a key can be identified in a list without being
 * recoverable from the database.
 */

const KEY_PREFIX = 'mw_live_'

export interface ApiKeyRecord {
  id: string
  accountId: string
  label: string
  keyPrefix: string
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

export interface IssuedKey extends ApiKeyRecord {
  /** The only time the full key exists outside the caller's hands. */
  secret: string
}

function randomToken(bytes = 24): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function issueApiKey(accountId: string, label: string): Promise<IssuedKey> {
  const secret = `${KEY_PREFIX}${randomToken()}`
  const id = `key_${randomToken(8)}`
  const keyHash = sha256Hex(secret)
  const keyPrefix = secret.slice(0, KEY_PREFIX.length + 6)

  await sql()`
    insert into api_keys (id, account_id, label, key_hash, key_prefix)
    values (${id}, ${accountId}, ${label}, ${keyHash}, ${keyPrefix})
  `

  return {
    id,
    accountId,
    label,
    keyPrefix,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    revokedAt: null,
    secret,
  }
}

export interface VerifiedKey {
  id: string
  accountId: string
  plan: string
}

/**
 * Verify a presented key.
 *
 * Returns null for absent, unknown and revoked keys alike, so the caller gets one
 * 401 either way, because telling an attacker that a key exists but is revoked
 * is free information.
 */
export async function verifyApiKey(presented: string | null): Promise<VerifiedKey | null> {
  if (!presented) return null
  const token = presented.startsWith('Bearer ') ? presented.slice(7).trim() : presented.trim()
  if (!token.startsWith(KEY_PREFIX)) return null

  const rows = (await sql()`
    select k.id, k.account_id, a.plan
    from api_keys k
    join accounts a on a.id = k.account_id
    where k.key_hash = ${sha256Hex(token)} and k.revoked_at is null
    limit 1
  `) as Array<{ id: string; account_id: string; plan: string }>

  if (rows.length === 0) return null

  await sql()`update api_keys set last_used_at = now() where id = ${rows[0].id}`
  return { id: rows[0].id, accountId: rows[0].account_id, plan: rows[0].plan }
}

export async function listApiKeys(accountId: string): Promise<ApiKeyRecord[]> {
  const rows = (await sql()`
    select id, account_id, label, key_prefix, created_at, last_used_at, revoked_at
    from api_keys where account_id = ${accountId} order by created_at desc
  `) as Array<Record<string, unknown>>

  return rows.map((r) => ({
    id: String(r.id),
    accountId: String(r.account_id),
    label: String(r.label),
    keyPrefix: String(r.key_prefix),
    createdAt: String(r.created_at),
    lastUsedAt: r.last_used_at ? String(r.last_used_at) : null,
    revokedAt: r.revoked_at ? String(r.revoked_at) : null,
  }))
}

export async function revokeApiKey(accountId: string, keyId: string): Promise<boolean> {
  const rows = (await sql()`
    update api_keys set revoked_at = now()
    where id = ${keyId} and account_id = ${accountId} and revoked_at is null
    returning id
  `) as Array<{ id: string }>
  return rows.length > 0
}
