import { describe, expect, it } from 'vitest'
import { OPEN_REFERENCE_KEY, loadDetectionKeys } from './keys'
import { utf8 } from './crypto'

const VENDOR = JSON.stringify([
  { id: 'vendor-1', label: 'A vendor key', secret: 'shhh', provenance: 'Under agreement.' },
])

describe('loadDetectionKeys', () => {
  it('always includes the open reference key, and nothing else by default', () => {
    const keys = loadDetectionKeys({})
    expect(keys.map((k) => k.id)).toEqual([OPEN_REFERENCE_KEY.id])
  })

  it('loads deployment keys from the canonical variable', () => {
    const keys = loadDetectionKeys({ WATERMARKREMOVERPRO_DETECTION_KEYS: VENDOR })
    expect(keys.map((k) => k.id)).toEqual([OPEN_REFERENCE_KEY.id, 'vendor-1'])
  })

  it('still loads them from the pre-rename variable', () => {
    // A deployment configured before the rename must not quietly lose its
    // vendor keys and keep answering every request as though nothing changed.
    const keys = loadDetectionKeys({ MARKWITNESS_DETECTION_KEYS: VENDOR })
    expect(keys.map((k) => k.id)).toEqual([OPEN_REFERENCE_KEY.id, 'vendor-1'])
  })

  it('names the variable the operator actually set when the JSON is bad', () => {
    expect(() => loadDetectionKeys({ MARKWITNESS_DETECTION_KEYS: '{oops' })).toThrow(
      /MARKWITNESS_DETECTION_KEYS is set but is not valid JSON/,
    )
    expect(() => loadDetectionKeys({ WATERMARKREMOVERPRO_DETECTION_KEYS: '{oops' })).toThrow(
      /WATERMARKREMOVERPRO_DETECTION_KEYS is set but is not valid JSON/,
    )
  })

  it('refuses a gamma outside the open unit interval', () => {
    const bad = JSON.stringify([{ id: 'x', secret: 's', gamma: 1 }])
    expect(() => loadDetectionKeys({ WATERMARKREMOVERPRO_DETECTION_KEYS: bad })).toThrow(/gamma/)
  })
})

describe('the open reference key is a fixed cryptographic input', () => {
  /**
   * Pinned because the value spells the pre-rename brand and therefore looks
   * like something a rename sweep should have caught. It is hashed into the
   * green-list PRF, so changing it silently invalidates every result the
   * published scheme has ever produced.
   */
  it('keeps its domain-separation secret across the rename', () => {
    expect(OPEN_REFERENCE_KEY.secret).toEqual(utf8('markwitness/open-reference-key/v1'))
  })

  it('is not a vendor key and says so', () => {
    expect(OPEN_REFERENCE_KEY.vendorPublished).toBe(false)
    expect(OPEN_REFERENCE_KEY.provenance).toMatch(/not a model vendor key/i)
  })
})
