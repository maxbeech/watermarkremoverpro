import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Both brands run on Helm7, not Vercel. Anything that names Vercel either does
 * nothing there or changes behaviour without saying so: a `VERCEL_*` check is
 * always unset so the branch it guards is dead, an `x-vercel-*` header never
 * arrives, and a `maxDuration` export is ignored. Keep them out.
 *
 * Files marked GENERATED are copies of the shared service clients. Their
 * canonical source is edited elsewhere and the next install overwrites them,
 * so they are not policed here.
 */

const ROOT = join(__dirname, '..')

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) sourceFiles(full, found)
    else if (/\.(ts|tsx|mts|mjs|js)$/.test(entry)) found.push(full)
  }
  return found
}

const files = [
  ...sourceFiles(join(ROOT, 'src')),
  ...sourceFiles(join(ROOT, 'scripts')),
  join(ROOT, 'next.config.ts'),
].filter((f) => !/GENERATED/.test(readFileSync(f, 'utf8').slice(0, 600)))

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

describe('nothing in the app depends on Vercel', () => {
  it('finds the source to police', () => {
    expect(files.length).toBeGreaterThan(50)
  })

  it('names Vercel nowhere in application code or scripts', () => {
    const offenders = files.filter((f) => /vercel/i.test(readFileSync(f, 'utf8')))
    expect(offenders, `These mention Vercel: ${offenders.join(', ')}`).toEqual([])
  })

  it('exports no maxDuration', () => {
    const durations = files.filter((f) => /export const maxDuration/.test(readFileSync(f, 'utf8')))
    expect(durations, `maxDuration is a Vercel-only setting: ${durations.join(', ')}`).toEqual([])
  })

  it('has no Vercel package, CLI script or vercel.json', () => {
    const packages = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter(
      (n) => n === 'vercel' || n.startsWith('@vercel/'),
    )
    expect(packages).toEqual([])
    const scripts = Object.entries(pkg.scripts ?? {}).filter(([, cmd]) => /\bvercel\b/.test(cmd))
    expect(scripts).toEqual([])
    expect(existsSync(join(ROOT, 'vercel.json'))).toBe(false)
  })

  it('starts on the port Helm7 assigns', () => {
    // Helm7 runs `npm start` with PORT set. A hard-coded port leaves the health
    // check probing one nothing listens on.
    expect(pkg.scripts?.start).toContain('${PORT')
  })
})
