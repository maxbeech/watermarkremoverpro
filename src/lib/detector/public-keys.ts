import { OPEN_REFERENCE_KEY, type DetectionKey } from './keys'

/**
 * The keys the BROWSER can test with.
 *
 * This is deliberately only the published reference key, and the reason is
 * structural rather than a scoping decision: a detection key is a secret, and a
 * secret shipped to a browser is not a secret. Any vendor or institution key
 * this deployment holds can therefore only ever be applied on the server path
 * (API, MCP, signed-in check), never on the anonymous on-device path.
 *
 * The check screen states which keys ran, so the user can see this rather than
 * assume the browser tested everything the product knows about.
 */
export const PUBLIC_DETECTION_KEYS: DetectionKey[] = [OPEN_REFERENCE_KEY]
