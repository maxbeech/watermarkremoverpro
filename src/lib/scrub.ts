import type { Breadcrumb, ErrorEvent, EventHint, Log } from '@sentry/nextjs'

/**
 * The one scrubber for everything this app sends to Sentry: events, logs,
 * breadcrumbs and transactions.
 *
 * Three rules, each tested in scrub.test.ts:
 *
 * 1. Fail closed. Every public function catches its own failure and returns
 *    null, so the event, log or breadcrumb is dropped. A scrubber that throws
 *    must never let the raw payload through.
 * 2. Linear time. Every pattern has bounded repetition and no nested or
 *    overlapping quantifiers, and any string over MAX_STRING is truncated
 *    before a pattern sees it, so hostile log text cannot cause ReDoS.
 * 3. Defence in depth. Callers are meant to pass ids, codes and counts only
 *    (see observability.ts). This catches whatever slips past that, including
 *    secrets inside serialised objects.
 *
 * This product's promise is that a document never leaves the browser, so keys
 * that usually carry document text are redacted too.
 */

export const REDACTED = '[redacted]'
const MAX_STRING = 10_000
const MAX_DEPTH = 6
const MAX_ENTRIES = 100

/** Keys whose values never leave the process. Matched as lower-case substrings. */
const SECRET_KEYS = [
  'key',
  'token',
  'secret',
  'password',
  'passwd',
  'authorization',
  'cookie',
  'session',
  'signature',
  'credential',
  'dsn',
  'bearer',
]

/** Personal data and document content. Exact (lower-case) key names. */
const PRIVATE_KEYS = new Set([
  'email',
  'phone',
  'address',
  'name',
  'username',
  'ip_address',
  'text',
  'document',
  'draft',
  'content',
  'body',
  'html',
  'markdown',
  'prompt',
  'input',
  'output',
  'original',
  'rewritten',
  'snippet',
])

const VALUE = `(?:"[^"\\n]{0,500}"|'[^'\\n]{0,500}'|[^\\s,;&"'}\\]]{1,500})`

// Every quantifier below is bounded and every character class is disjoint from
// its neighbour, so matching is O(n) with a small constant.
const EMAIL = /[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63}){1,8}/g
const JWT = /eyJ[A-Za-z0-9_-]{5,2000}\.[A-Za-z0-9_-]{5,2000}\.[A-Za-z0-9_-]{0,2000}/g
const BEARER = /\bBearer\s{1,5}[A-Za-z0-9._~+/=-]{8,2000}/gi
const API_KEY =
  /\b(?:sk|pk|rk|whsec|hlm_sk|sntrys|sntryu|mw_live|mw_test|ghp|github_pat)_[A-Za-z0-9_-]{8,300}|\bAKIA[0-9A-Z]{16}\b/g
const URL_CREDENTIALS = /\b[a-z][a-z0-9+.-]{1,20}:\/\/[^\s/@:]{1,100}:[^\s/@]{1,200}@/gi
const SECRET_PAIR = new RegExp(
  `(?<![A-Za-z0-9])[A-Za-z0-9_-]{0,40}(?:password|passwd|secret|token|api[_-]?key|apikey|authorization|cookie|signature|dsn)["']?\\s{0,3}[:=]\\s{0,3}${VALUE}`,
  'gi',
)
// International (+44 ...), or at least nine digits in separated groups. A bare
// run of digits is left alone: timestamps and ids are not phone numbers.
const PHONE =
  /(?<![\w+])\+\d[\d\s().-]{7,18}\d(?!\w)|(?<![\w+.:-])(?=(?:\D{0,3}\d){9})\(?\d{2,5}\)?(?:[\s.-]\d{2,6}){1,4}(?!\w)/g
const URL_QUERY = /(https?:\/\/[^\s?#"'<>]{1,500})\?[^\s"'<>#]{0,1000}/g

/** Redact secrets and personal data inside a string. Throws only on a bug; callers fail closed. */
export function scrubText(input: string, opts: { keepEmails?: boolean } = {}): string {
  let s = input.length > MAX_STRING ? `${input.slice(0, MAX_STRING)}[truncated]` : input
  s = s.replace(URL_CREDENTIALS, `${REDACTED}@`)
  s = s.replace(SECRET_PAIR, REDACTED)
  s = s.replace(BEARER, `Bearer ${REDACTED}`)
  s = s.replace(JWT, REDACTED)
  s = s.replace(API_KEY, REDACTED)
  if (!opts.keepEmails) s = s.replace(EMAIL, REDACTED)
  s = s.replace(PHONE, REDACTED)
  s = s.replace(URL_QUERY, '$1')
  return s
}

/** Drop the query string and fragment from a URL or path. */
export function stripQuery(url: string): string {
  const cut = url.search(/[?#]/)
  const base = cut === -1 ? url : url.slice(0, cut)
  return base.length > 2000 ? `${base.slice(0, 2000)}[truncated]` : base
}

function isSensitiveKey(key: string, keep?: ReadonlySet<string>): boolean {
  const k = key.toLowerCase()
  if (keep?.has(k)) return false
  return PRIVATE_KEYS.has(k) || SECRET_KEYS.some((s) => k.includes(s))
}

/** Sentry's own contexts use `name` for os, browser and runtime names, which are not personal. */
const CONTEXT_KEEP: ReadonlySet<string> = new Set(['name'])

function isUrlKey(key: string): boolean {
  return /^(url|to|from|href|http\.url|url\.full|http\.query|url\.query|query_string|query)$/i.test(key)
}

/** Recursively scrub a value, preserving structure. Throws only on a bug; callers fail closed. */
export function scrubValue(value: unknown, depth = 0, keep?: ReadonlySet<string>): unknown {
  if (value == null) return value
  if (typeof value === 'string') return scrubText(value)
  if (typeof value !== 'object') return value
  if (depth >= MAX_DEPTH) return REDACTED
  if (Array.isArray(value)) return value.slice(0, MAX_ENTRIES).map((v) => scrubValue(v, depth + 1, keep))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, MAX_ENTRIES)) {
    if (isSensitiveKey(k, keep)) out[k] = REDACTED
    else if (isUrlKey(k) && /^(query|query_string|url\.query|http\.query)$/i.test(k)) out[k] = REDACTED
    else if (isUrlKey(k) && typeof v === 'string') out[k] = scrubText(stripQuery(v))
    else out[k] = scrubValue(v, depth + 1, keep)
  }
  return out
}

function isFeedback(event: { type?: string; contexts?: Record<string, unknown> }): boolean {
  return event.type === 'feedback' || Boolean(event.contexts && 'feedback' in event.contexts)
}

function scrubEventUnsafe(event: ErrorEvent): ErrorEvent {
  // A person typing into the feedback form chose to share their name and email.
  const feedback = isFeedback(event as { type?: string; contexts?: Record<string, unknown> })

  if (typeof event.message === 'string') event.message = scrubText(event.message)
  if (event.logentry) {
    const l = event.logentry
    if (l.message) l.message = scrubText(l.message)
    if (l.params) l.params = scrubValue(l.params) as typeof l.params
  }
  for (const ex of event.exception?.values ?? []) {
    if (typeof ex.value === 'string') ex.value = scrubText(ex.value)
  }
  if (event.transaction) event.transaction = scrubText(stripQuery(event.transaction))

  if (event.request) {
    const r = event.request
    if (r.url) r.url = scrubText(stripQuery(r.url))
    delete r.cookies
    delete r.data
    delete r.query_string
    if (r.headers) r.headers = scrubValue(r.headers) as Record<string, string>
  }

  if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>
  if (event.tags) event.tags = scrubValue(event.tags) as typeof event.tags

  if (event.contexts) {
    if (feedback) {
      // Keep name and email and the message the person wrote; scrub secrets in it.
      const { feedback: fb, ...rest } = event.contexts as Record<string, Record<string, unknown> | undefined>
      const kept: Record<string, unknown> = { ...(fb ?? {}) }
      if (typeof kept.message === 'string') kept.message = scrubText(kept.message, { keepEmails: true })
      event.contexts = { ...(scrubValue(rest, 0, CONTEXT_KEEP) as object), feedback: kept } as typeof event.contexts
    } else {
      event.contexts = scrubValue(event.contexts, 0, CONTEXT_KEEP) as typeof event.contexts
    }
  }

  if (!feedback) {
    // Ids only. No email, username or address ever rides along with an error.
    event.user = event.user?.id ? { id: String(event.user.id) } : undefined
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .map((b) => scrubBreadcrumb(b))
      .filter((b): b is Breadcrumb => b !== null)
  }
  return event
}

/** Sentry `beforeSend`. Returns null (drops the event) if scrubbing fails. */
export function scrubEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  try {
    return scrubEventUnsafe(event)
  } catch {
    return null
  }
}

/** Sentry `beforeBreadcrumb`. Message and data scrubbed; query strings stripped from url/to/from. */
export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb | null {
  try {
    const out: Breadcrumb = { ...crumb }
    if (typeof out.message === 'string') out.message = scrubText(out.message)
    if (out.data) out.data = scrubValue(out.data) as Breadcrumb['data']
    return out
  } catch {
    return null
  }
}

/** Sentry `beforeSendLog`. Message and attributes scrubbed; null if scrubbing fails. */
export function scrubLog(log: Log): Log | null {
  try {
    const message = typeof log.message === 'string' ? scrubText(log.message) : log.message
    const attributes = log.attributes ? (scrubValue(log.attributes) as Log['attributes']) : log.attributes
    return { ...log, message, attributes }
  } catch {
    return null
  }
}

interface SpanLike {
  description?: string
  data?: Record<string, unknown>
}
interface TransactionLike {
  transaction?: string
  request?: { url?: string; query_string?: unknown; cookies?: unknown; data?: unknown; headers?: Record<string, string> }
  spans?: SpanLike[]
  breadcrumbs?: Breadcrumb[]
  contexts?: Record<string, unknown>
  extra?: Record<string, unknown>
  user?: { id?: string | number }
}

/** Sentry `beforeSendTransaction`. Strips query strings from request and span urls; null on failure. */
export function scrubTransaction<T extends object>(event: T): T | null {
  try {
    const t = event as unknown as TransactionLike
    if (t.transaction) t.transaction = scrubText(stripQuery(t.transaction))
    if (t.request) {
      if (t.request.url) t.request.url = scrubText(stripQuery(t.request.url))
      delete t.request.query_string
      delete t.request.cookies
      delete t.request.data
      if (t.request.headers) t.request.headers = scrubValue(t.request.headers) as Record<string, string>
    }
    for (const span of t.spans ?? []) {
      if (span.description) span.description = scrubText(stripQuery(span.description))
      if (span.data) {
        delete span.data['url.query']
        delete span.data['http.query']
        delete span.data['url.fragment']
        span.data = scrubValue(span.data) as Record<string, unknown>
      }
    }
    if (t.extra) t.extra = scrubValue(t.extra) as Record<string, unknown>
    if (t.contexts) t.contexts = scrubValue(t.contexts, 0, CONTEXT_KEEP) as Record<string, unknown>
    if (t.breadcrumbs) {
      t.breadcrumbs = t.breadcrumbs.map((b) => scrubBreadcrumb(b)).filter((b): b is Breadcrumb => b !== null)
    }
    t.user = t.user?.id ? { id: String(t.user.id) } : undefined
    return event
  } catch {
    return null
  }
}
