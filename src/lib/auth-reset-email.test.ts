import { describe, expect, it, vi, beforeEach } from 'vitest'

/**
 * sendPasswordResetEmail is the only place this product sends outbound email.
 * openhelm-mail is mocked so this asserts what auth.ts actually does with a
 * send result, not the transport contract (covered separately in
 * openhelm-mail.test.ts).
 */

const sendEmail = vi.fn()

vi.mock('@/lib/openhelm-mail', () => ({ sendEmail: (...args: unknown[]) => sendEmail(...args) }))
vi.mock('@neondatabase/serverless', () => ({ Pool: vi.fn() }))
vi.mock('next/headers', () => ({ headers: vi.fn() }))
vi.mock('server-only', () => ({}))

const { sendPasswordResetEmail } = await import('./auth')

beforeEach(() => {
  sendEmail.mockReset()
})

describe('sendPasswordResetEmail', () => {
  const user = { id: 'user_1', email: 'writer@example.com' }
  const url = 'https://markwitness.helm7.com/reset-password?token=abc'

  it('sends the reset link to the account email with an idempotency key', async () => {
    sendEmail.mockResolvedValue({ sent: true, id: 'msg_1', status: 'sent', threadId: null, replyTo: null, suppressed: [] })

    await sendPasswordResetEmail(user, url)

    expect(sendEmail).toHaveBeenCalledTimes(1)
    const call = sendEmail.mock.calls[0][0]
    expect(call.to).toBe(user.email)
    expect(call.markdown).toContain(url)
    expect(call.clientId).toBe(`reset-password:${user.id}:${url}`)
  })

  it('throws rather than reporting success when the send fails', async () => {
    sendEmail.mockResolvedValue({ sent: false, reason: 'not_configured' })

    await expect(sendPasswordResetEmail(user, url)).rejects.toThrow('not_configured')
  })
})
