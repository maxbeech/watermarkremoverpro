import { describe, expect, it } from 'vitest'
import {
  ENV_API_KEY,
  ENV_DETECTION_KEYS,
  describeLegacyEnvUse,
  readAliasedEnv,
} from './env-names'

describe('renamed configuration variables', () => {
  it('reads the canonical name', () => {
    const read = readAliasedEnv({ WATERMARKREMOVERPRO_API_KEY: 'mw_live_abc' }, ENV_API_KEY)
    expect(read).toEqual({ value: 'mw_live_abc', nameUsed: 'WATERMARKREMOVERPRO_API_KEY', legacy: false })
  })

  it('still reads the pre-rename name, and says that is what it did', () => {
    // The whole point: an MCP client config or a Vercel project set before the
    // rename keeps working, and the surface reading it can tell the operator.
    const read = readAliasedEnv({ MARKWITNESS_API_KEY: 'mw_live_abc' }, ENV_API_KEY)
    expect(read).toEqual({ value: 'mw_live_abc', nameUsed: 'MARKWITNESS_API_KEY', legacy: true })
  })

  it('prefers the canonical name when both hold the same value', () => {
    const read = readAliasedEnv(
      { WATERMARKREMOVERPRO_API_KEY: 'same', MARKWITNESS_API_KEY: 'same' },
      ENV_API_KEY,
    )
    expect(read.nameUsed).toBe('WATERMARKREMOVERPRO_API_KEY')
    expect(read.legacy).toBe(false)
  })

  it('throws, naming both variables, when they disagree', () => {
    // A guess here would leave an operator staring at a value in their own
    // config that the running process is ignoring.
    expect(() =>
      readAliasedEnv(
        { WATERMARKREMOVERPRO_API_KEY: 'new', MARKWITNESS_API_KEY: 'old' },
        ENV_API_KEY,
      ),
    ).toThrow(/WATERMARKREMOVERPRO_API_KEY and MARKWITNESS_API_KEY are both set/)
  })

  it('treats an empty value as unset, under either name', () => {
    // `MARKWITNESS_API_KEY=""` is how the smoke test forces local mode. It has
    // to keep meaning "no key" rather than becoming a value that conflicts.
    expect(readAliasedEnv({ MARKWITNESS_API_KEY: '' }, ENV_API_KEY).value).toBeUndefined()
    expect(readAliasedEnv({ WATERMARKREMOVERPRO_API_KEY: '   ' }, ENV_API_KEY).value).toBeUndefined()
    expect(() =>
      readAliasedEnv({ WATERMARKREMOVERPRO_API_KEY: '', MARKWITNESS_API_KEY: 'set' }, ENV_API_KEY),
    ).not.toThrow()
    expect(
      readAliasedEnv({ WATERMARKREMOVERPRO_API_KEY: '', MARKWITNESS_API_KEY: 'set' }, ENV_API_KEY).value,
    ).toBe('set')
  })

  it('reports nothing configured as nothing configured', () => {
    expect(readAliasedEnv({}, ENV_DETECTION_KEYS)).toEqual({
      value: undefined,
      nameUsed: null,
      legacy: false,
    })
  })

  it('describes the legacy name in one sentence naming both', () => {
    const sentence = describeLegacyEnvUse(ENV_DETECTION_KEYS)
    expect(sentence).toContain('MARKWITNESS_DETECTION_KEYS')
    expect(sentence).toContain('WATERMARKREMOVERPRO_DETECTION_KEYS')
  })
})
