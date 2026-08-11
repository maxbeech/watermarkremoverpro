import { describe, expect, it } from 'vitest'
import { hmacSha256, sha256, sha256Hex, toHex, utf8, hmacUnitInterval } from './crypto'

/**
 * Known-answer tests. The whole engine's determinism rests on this file being
 * correct: if SHA-256 were subtly wrong, every green-list partition would still
 * be perfectly self-consistent and every z score would still look plausible,
 * while the product silently computed a different partition from the one it
 * documents.
 */
describe('sha256', () => {
  it('matches the FIPS 180-4 vector for the empty string', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('matches the FIPS 180-4 vector for "abc"', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('matches the FIPS 180-4 two-block vector', () => {
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    )
  })

  it('agrees with the platform implementation across lengths and padding boundaries', async () => {
    // Cross-check against Node's own SHA-256 rather than against more hand-copied
    // constants. This exercises the padding edge cases (55 and 56 bytes straddle
    // the point where the length field forces a second block) and multi-byte
    // UTF-8, and it verifies the implementation against a reference rather than
    // against my own arithmetic.
    const { createHash } = await import('node:crypto')
    const samples = [
      '',
      'a',
      'a'.repeat(55),
      'a'.repeat(56),
      'a'.repeat(63),
      'a'.repeat(64),
      'a'.repeat(65),
      'a'.repeat(1000),
      'çéñüß \u2014 multi-byte characters must hash identically',
      'Le rapport a été déposé le 3 mars.',
    ]
    for (const sample of samples) {
      expect(sha256Hex(sample)).toBe(createHash('sha256').update(sample, 'utf8').digest('hex'))
    }
  })

  it('is deterministic across repeated calls', () => {
    const text = 'The same document must hash identically every time it is checked.'
    expect(sha256Hex(text)).toBe(sha256Hex(text))
  })

  it('produces a 32-byte digest', () => {
    expect(sha256(utf8('anything')).length).toBe(32)
  })
})

describe('hmacSha256', () => {
  // RFC 4231 test case 1.
  it('matches the RFC 4231 vector', () => {
    const key = new Uint8Array(20).fill(0x0b)
    const tag = hmacSha256(key, utf8('Hi There'))
    expect(toHex(tag)).toBe('b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7')
  })

  // RFC 4231 test case 2.
  it('matches the RFC 4231 vector with a short ASCII key', () => {
    const tag = hmacSha256(utf8('Jefe'), utf8('what do ya want for nothing?'))
    expect(toHex(tag)).toBe('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843')
  })

  // Key longer than the 64-byte block, so it must be hashed down first.
  it('agrees with the platform HMAC, including for an over-long key', async () => {
    const { createHmac } = await import('node:crypto')
    const cases: Array<[Uint8Array, string]> = [
      [utf8('short'), 'a message'],
      [new Uint8Array(131).fill(0xaa), 'Test Using Larger Than Block-Size Key - Hash Key First'],
      [utf8('markwitness/open-reference-key/v1'), 'greenlist-bigram-v1|the|record'],
    ]
    for (const [key, message] of cases) {
      expect(toHex(hmacSha256(key, utf8(message)))).toBe(
        createHmac('sha256', Buffer.from(key)).update(message, 'utf8').digest('hex'),
      )
    }
  })
})

describe('hmacUnitInterval', () => {
  it('stays inside [0, 1)', () => {
    for (let i = 0; i < 500; i++) {
      const v = hmacUnitInterval(utf8('k'), `message-${i}`)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('is approximately uniform, which is what makes the null hypothesis hold', () => {
    // The green-list z test assumes each bigram is green with probability gamma.
    // That assumption IS this uniformity. If the PRF were biased, every
    // document would carry a fake signal.
    const n = 4000
    let below = 0
    for (let i = 0; i < n; i++) if (hmacUnitInterval(utf8('key'), `msg-${i}`) < 0.5) below++
    const z = (below - n * 0.5) / Math.sqrt(n * 0.25)
    expect(Math.abs(z)).toBeLessThan(4)
  })

  it('gives unrelated values under different keys', () => {
    const a = hmacUnitInterval(utf8('key-a'), 'same message')
    const b = hmacUnitInterval(utf8('key-b'), 'same message')
    expect(a).not.toBe(b)
  })
})
