import { describe, it, expect } from 'vitest'
import { isPublicContent } from '../mcp/hook-check'

/*
 * The hook fires on every Write and Edit a session makes, so what it DECLINES
 * to check matters as much as what it checks. Before 2026-09-10 it treated any
 * `.md` as public content, so a long working session spent its attention
 * reporting AI-tells in its own internal plan file, repeatedly. A check that
 * cries wolf on notes nobody publishes is one people learn to scroll past.
 */
describe('isPublicContent: what actually ships', () => {
  it('checks published prose', () => {
    for (const p of [
      '/repo/content/blog/how-to-x.md',
      '/repo/src/content/posts/2026-09-10-launch.mdx',
      '/repo/docs/guide.md',
      '/repo/app/pages/about.html',
      '/repo/marketing/landing.txt',
    ]) {
      expect(isPublicContent(p), p).toBe(true)
    }
  })

  it('declines agent and session scratch space', () => {
    // The regression: this session's own plan file, checked over and over.
    for (const p of [
      '/Users/x/.claude/plans/some-plan.md',
      '/Users/x/.claude/projects/p/memory/MEMORY.md',
      '/repo/.claude/settings.json',
      '/repo/.claude/worktrees/wt/content/post.md',
    ]) {
      expect(isPublicContent(p), p).toBe(false)
    }
  })

  it('declines engineering notes that merely happen to be markdown', () => {
    for (const p of [
      '/repo/CHANGELOG.md',
      '/repo/CLAUDE.md',
      '/repo/AGENTS.md',
      '/repo/docs/plans/plan_48_absorb/progress.md',
      '/repo/.github/PULL_REQUEST_TEMPLATE.md',
    ]) {
      expect(isPublicContent(p), p).toBe(false)
    }
  })

  it('declines working-note basenames wherever they sit', () => {
    // A convention, not a location: TODO.md is TODO.md at any depth.
    expect(isPublicContent('/repo/TODO.md')).toBe(false)
    expect(isPublicContent('/repo/src/content/notes.md')).toBe(false)
    expect(isPublicContent('/repo/a/b/c/scratch.md')).toBe(false)
  })

  it('lets a path hint beat the extension, in both directions', () => {
    // /docs/ is published; /docs/plans/ is not.
    expect(isPublicContent('/repo/docs/api.md')).toBe(true)
    expect(isPublicContent('/repo/docs/plans/x.md')).toBe(false)
  })

  it('still declines build output and vendored code', () => {
    expect(isPublicContent('/repo/node_modules/pkg/readme.md')).toBe(false)
    expect(isPublicContent('/repo/dist/index.html')).toBe(false)
    expect(isPublicContent('/repo/.next/server/page.html')).toBe(false)
  })

  it('declines source code', () => {
    expect(isPublicContent('/repo/src/lib/thing.ts')).toBe(false)
    expect(isPublicContent('/repo/src/app/page.tsx')).toBe(false)
  })

  it('normalises Windows separators before matching', () => {
    expect(isPublicContent('C:\\repo\\.claude\\plans\\x.md')).toBe(false)
  })
})
