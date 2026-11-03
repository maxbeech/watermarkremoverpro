import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import type { ErrorEvent, EventHint } from '@sentry/nextjs'
import { sharedSentryOptions } from '@/lib/sentry-options'

const beforeSend = sharedSentryOptions().beforeSend as (e: ErrorEvent, h: EventHint) => unknown
const withError = (value: string) => ({ exception: { values: [{ type: 'Error', value }] } }) as unknown as ErrorEvent

// The rules themselves are covered in sentry-client-noise.test.ts; this proves
// they sit in the hook every Sentry.init uses.
describe('sharedSentryOptions browser noise', () => {
  it("drops an extension's wallet failure", async () => {
    expect(await beforeSend(withError('Failed to connect to MetaMask'), {})).toBeNull()
  })

  it('still sends an unrelated error', async () => {
    expect(await beforeSend(withError('Could not load the page'), {})).not.toBeNull()
  })
})

describe('workspace sidebar and page translation (NEVERPROMPTED_WEB-3)', () => {
  const sidebar = readFileSync(new URL('../components/app/sidebar.tsx', import.meta.url), 'utf8')

  it("marks the person's own run title as untranslatable", () => {
    expect(sidebar).toMatch(/<span translate="no"[^>]*>\s*\{run\.title\}/)
  })

  it('renders the AI figure as a single text node', () => {
    expect(sidebar).toContain('{`AI ${summary.likelihoodAfter}`}')
  })
})
