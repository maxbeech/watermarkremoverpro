/**
 * Apply the schema in src/lib/db.ts to the configured database.
 *
 * Every statement is `create table if not exists` / `create index if not
 * exists`, so this is safe to re-run and will not drop anything. Destructive
 * changes are deliberately not automated here, because a migration that can delete a
 * user's saved checks should be a decision someone makes on purpose.
 *
 * Run: npm run db:push
 */
import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'
import { SCHEMA_SQL } from '../src/lib/db'

function loadEnv() {
  if (process.env.DATABASE_URL) return
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const match = line.match(/^([A-Z0-9_]+)="?([^"\n]*)"?$/)
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2]
    }
  } catch {
    // No .env.local is fine if DATABASE_URL is already in the environment.
  }
}

async function main() {
  loadEnv()
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Run `vercel env pull .env.local` first.')
  }

  const sql = neon(process.env.DATABASE_URL)

  // Strip `--` line comments BEFORE splitting on semicolons. A prose comment
  // that happens to contain a semicolon would otherwise cut a statement in half
  // and the half would be sent to Postgres as SQL.
  const statements = SCHEMA_SQL.split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const statement of statements) {
    await sql.query(statement)
    console.log(`  ok: ${statement.split('\n')[0].slice(0, 72)}…`)
  }

  const tables = (await sql.query(
    `select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
  )) as Array<{ table_name: string }>
  console.log(`\nTables now present: ${tables.map((t) => t.table_name).join(', ')}`)
}

main().catch((err) => {
  console.error(`\nSchema push failed: ${err.message}`)
  process.exit(1)
})
