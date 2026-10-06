import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const setUser = vi.fn()
const open = vi.fn()
const appendToDom = vi.fn()
const createForm = vi.fn()
const getFeedback = vi.fn()

vi.mock('@sentry/nextjs', () => ({
  getFeedback: () => getFeedback(),
  setUser: (...a: unknown[]) => setUser(...a),
}))

const { openFeedbackForm } = await import('./feedback')
const { FeedbackButton } = await import('@/components/feedback/feedback-button')

beforeEach(() => {
  setUser.mockReset()
  open.mockReset()
  appendToDom.mockReset()
  createForm.mockReset().mockResolvedValue({ appendToDom, open })
  getFeedback.mockReset().mockReturnValue({ createForm })
})

describe('openFeedbackForm', () => {
  it('creates, mounts and opens the Sentry form', async () => {
    await expect(openFeedbackForm()).resolves.toBe(true)
    expect(createForm).toHaveBeenCalledTimes(1)
    expect(appendToDom).toHaveBeenCalled()
    expect(open).toHaveBeenCalled()
    expect(setUser).not.toHaveBeenCalled()
  })

  it('pre-fills a signed-in user', async () => {
    await openFeedbackForm({ email: 'a@b.com', name: 'Ann' })
    expect(setUser).toHaveBeenCalledWith({ email: 'a@b.com', username: 'Ann' })
  })

  it('says so when reporting is not configured', async () => {
    getFeedback.mockReturnValue(undefined)
    await expect(openFeedbackForm()).resolves.toBe(false)
    expect(createForm).not.toHaveBeenCalled()
  })
})

describe('FeedbackButton', () => {
  it.each(['link', 'sidebar', 'button'] as const)('renders the %s variant with a visible label', (variant) => {
    const html = renderToStaticMarkup(createElement(FeedbackButton, { variant }))
    expect(html).toContain('Send feedback')
    expect(html).toContain('<button')
  })
})
