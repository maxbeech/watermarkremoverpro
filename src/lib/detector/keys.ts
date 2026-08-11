/**
 * Detection keys.
 *
 * READ THIS BEFORE CHANGING ANYTHING IN THIS FILE.
 *
 * A green-list provenance mark is a KEYED construction. Whoever generated the
 * text partitioned the vocabulary with a secret, and without that secret the
 * partition is unknowable, and no amount of analysis recovers it. That is the
 * point of the design, and it is not a limitation MarkWitness can engineer
 * around.
 *
 * So: MarkWitness tests the keys it actually holds, and says exactly which ones
 * those were. It does not hold Anthropic's key, OpenAI's key, or any other
 * model vendor's key, because none of them are public. A result of "no mark
 * detected" from this product means "no mark detected UNDER THE KEYS LISTED",
 * and every surface that reports a watermark result is required to carry that
 * qualifier.
 *
 * Inventing a key and reporting the resulting z score as though it tested for a
 * vendor's mark would be the single most dishonest thing this product could do.
 * It would produce a real-looking number, computed by real code, that is
 * evidence of nothing at all, and it would be indistinguishable from a working
 * detector right up until someone relied on it in an appeal.
 */

import { utf8 } from './crypto'

export interface DetectionKey {
  id: string
  label: string
  /** Partition scheme identifier, part of the PRF input, so schemes never collide. */
  scheme: 'greenlist-bigram-v1'
  /** Expected green-list fraction under the null hypothesis. */
  gamma: number
  secret: Uint8Array
  /** Where this key came from, shown to the user and printed on evidence reports. */
  provenance: string
  /** True only for a key published by the party that generates the mark. */
  vendorPublished: boolean
}

/**
 * The open reference key.
 *
 * This is PUBLIC and deliberately so. It exists to make the detector auditable:
 * anyone can generate text marked under it (see simulate.ts), run it through
 * MarkWitness, and watch the statistic move. It is how a user checks that the
 * tool does arithmetic rather than theatre.
 *
 * It is NOT a vendor key and detects no real model's output.
 */
export const OPEN_REFERENCE_KEY: DetectionKey = {
  id: 'openmark-ref-1',
  label: 'MarkWitness open reference scheme',
  scheme: 'greenlist-bigram-v1',
  gamma: 0.5,
  secret: utf8('markwitness/open-reference-key/v1'),
  provenance:
    'Published by MarkWitness for verification and self-test. Not a model vendor key. It detects text marked under this published scheme only.',
  vendorPublished: false,
}

export interface KeyRegistryEntry {
  id: string
  label: string
  gamma: number
  provenance: string
  vendorPublished: boolean
}

/**
 * Keys available to a given deployment.
 *
 * Additional keys are supplied through MARKWITNESS_DETECTION_KEYS as a JSON
 * array of { id, label, secret, gamma?, provenance }. This is the path a model
 * vendor publishing a detection key, or an institution issued one under NDA,
 * plugs into. The engine needs no change to test against it.
 */
export function loadDetectionKeys(env: Record<string, string | undefined> = {}): DetectionKey[] {
  const keys: DetectionKey[] = [OPEN_REFERENCE_KEY]
  const raw = env.MARKWITNESS_DETECTION_KEYS
  if (!raw) return keys

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Surface the misconfiguration rather than silently running with fewer keys
    // than the operator believes are active.
    throw new Error(
      'MARKWITNESS_DETECTION_KEYS is set but is not valid JSON. Expected an array of {id,label,secret,gamma?,provenance}.',
    )
  }
  if (!Array.isArray(parsed)) {
    throw new Error('MARKWITNESS_DETECTION_KEYS must be a JSON array.')
  }

  for (const entry of parsed) {
    const e = entry as Record<string, unknown>
    if (typeof e.id !== 'string' || typeof e.secret !== 'string') {
      throw new Error('Each MARKWITNESS_DETECTION_KEYS entry needs at least a string id and secret.')
    }
    const gamma = typeof e.gamma === 'number' ? e.gamma : 0.5
    if (!(gamma > 0 && gamma < 1)) {
      throw new Error(`Detection key "${e.id}" has gamma ${gamma}; it must be strictly between 0 and 1.`)
    }
    keys.push({
      id: e.id,
      label: typeof e.label === 'string' ? e.label : e.id,
      scheme: 'greenlist-bigram-v1',
      gamma,
      secret: utf8(e.secret),
      provenance: typeof e.provenance === 'string' ? e.provenance : 'Supplied by deployment configuration.',
      vendorPublished: e.vendorPublished === true,
    })
  }
  return keys
}

export const describeKey = (k: DetectionKey): KeyRegistryEntry => ({
  id: k.id,
  label: k.label,
  gamma: k.gamma,
  provenance: k.provenance,
  vendorPublished: k.vendorPublished,
})

/**
 * True when this deployment holds at least one key published by the party that
 * generates the mark. Every "no mark found" message is worded off this: with no
 * vendor key, the honest phrasing is "we cannot test for vendor marks", not
 * "your document is clean".
 */
export const hasVendorPublishedKey = (keys: DetectionKey[]): boolean =>
  keys.some((k) => k.vendorPublished)
