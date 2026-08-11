import { neon } from '@neondatabase/serverless'

/**
 * Postgres access.
 *
 * The rule this file exists to enforce: when DATABASE_URL is absent, every
 * database-backed capability returns an explicit, named failure. It does not
 * fall back to an in-memory store, it does not pretend a quota was checked, and
 * it does not let an API call through unmetered. A billing surface that quietly
 * works without its ledger is worse than one that is plainly switched off,
 * because it bills nobody while looking healthy.
 */

export class DatabaseUnavailableError extends Error {
  readonly code = 'database_unavailable'
  constructor() {
    super(
      'This deployment has no DATABASE_URL configured, so accounts, API keys and usage metering are unavailable. The on-device check is unaffected.',
    )
    this.name = 'DatabaseUnavailableError'
  }
}

export const databaseConfigured = (): boolean => Boolean(process.env.DATABASE_URL)

type Sql = ReturnType<typeof neon>
let client: Sql | null = null

export function sql(): Sql {
  if (!process.env.DATABASE_URL) throw new DatabaseUnavailableError()
  if (!client) client = neon(process.env.DATABASE_URL)
  return client
}

/**
 * The schema, applied by scripts/db-push.ts.
 *
 * Kept as plain SQL in one place rather than behind a migration framework: this
 * product has one small schema, and a single readable statement list is easier
 * to audit than a directory of generated diffs.
 */
export const SCHEMA_SQL = `
-- ---------------------------------------------------------------------------
-- Better Auth's own tables.
--
-- Transcribed from getAuthTables() in the installed better-auth package rather
-- than from documentation, so they match the version actually running. Column
-- names are quoted camelCase because that is what Better Auth's query builder
-- emits; unquoted identifiers would fold to lowercase and every lookup would
-- miss.
--
-- The Better Auth CLI is not used to create these: it requires the auth
-- instance to be exported as a value, and ours is a lazily-built function so
-- that \`next build\` does not need a live database.
-- ---------------------------------------------------------------------------
create table if not exists "user" (
  id              text primary key,
  name            text not null,
  email           text not null unique,
  "emailVerified" boolean not null default false,
  image           text,
  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now()
);

create table if not exists session (
  id           text primary key,
  "expiresAt"  timestamptz not null,
  token        text not null unique,
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now(),
  "ipAddress"  text,
  "userAgent"  text,
  "userId"     text not null references "user"(id) on delete cascade
);

create table if not exists account (
  id                      text primary key,
  "accountId"             text not null,
  "providerId"            text not null,
  "userId"                text not null references "user"(id) on delete cascade,
  "accessToken"           text,
  "refreshToken"          text,
  "idToken"               text,
  "accessTokenExpiresAt"  timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope                   text,
  password                text,
  "createdAt"             timestamptz not null default now(),
  "updatedAt"             timestamptz not null default now()
);

create table if not exists verification (
  id           text primary key,
  identifier   text not null,
  value        text not null,
  "expiresAt"  timestamptz not null,
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now()
);

-- Index names avoid session_user / current_user style identifiers: SESSION_USER
-- is a reserved SQL keyword and Postgres rejects it as a relation name.
create index if not exists session_user_idx on session ("userId");
create index if not exists account_user_idx on account ("userId");
create index if not exists verification_identifier_idx on verification (identifier);

-- ---------------------------------------------------------------------------
-- Application tables.
-- ---------------------------------------------------------------------------
create table if not exists accounts (
  id            text primary key,
  email         text unique not null,
  name          text,
  plan          text not null default 'free',
  stripe_customer_id text,
  created_at    timestamptz not null default now()
);

create table if not exists api_keys (
  id            text primary key,
  account_id    text not null references accounts(id) on delete cascade,
  label         text not null,
  -- Only the SHA-256 of the key is stored. The key itself is shown once at
  -- creation and is unrecoverable afterwards, so a database disclosure does not
  -- hand over working credentials.
  key_hash      text unique not null,
  key_prefix    text not null,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);

create table if not exists usage_events (
  id            bigserial primary key,
  account_id    text not null references accounts(id) on delete cascade,
  api_key_id    text references api_keys(id) on delete set null,
  surface       text not null,
  words         integer not null,
  billable_units integer not null,
  document_hash text not null,
  created_at    timestamptz not null default now()
);

create index if not exists usage_events_account_created
  on usage_events (account_id, created_at desc);

create table if not exists checks (
  id            text primary key,
  account_id    text not null references accounts(id) on delete cascade,
  document_hash text not null,
  language      text,
  words         integer not null,
  -- The analysis result as returned by the engine. Stored so a saved check can
  -- be reopened and an evidence report regenerated from the same numbers the
  -- user originally saw, rather than from a fresh run that might differ.
  result        jsonb not null,
  created_at    timestamptz not null default now()
);

create index if not exists checks_account_created
  on checks (account_id, created_at desc);
`
