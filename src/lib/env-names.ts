/**
 * Configuration variable names, and how a renamed one is read.
 *
 * The product was renamed from MarkWitness to WatermarkRemoverPro. Renaming a
 * variable that somebody has already set in a Vercel project, a shell profile
 * or an MCP client config is not free: the deployment keeps starting, and the
 * capability the variable enabled quietly stops existing. That is exactly the
 * silent degradation this codebase refuses everywhere else.
 *
 * So a renamed variable has TWO accepted names. The canonical one carries the
 * current brand and is what every document tells a new reader to set. The
 * legacy one keeps working for as long as somebody has it set, and its use is
 * reported rather than hidden. Setting both to different values is a
 * misconfiguration and throws, naming both variables, rather than silently
 * picking one and leaving the operator to wonder which.
 *
 * NOT renamed, and deliberately absent from this file:
 *   - the `mw_live_` API key prefix, which live customer keys already carry
 *     (see src/lib/api-keys.ts). It is stored in the database, printed in the
 *     dashboard, and matched at the door on every authenticated request, so a
 *     new prefix would invalidate keys that are in use today.
 *   - the watermark key's cryptographic domain-separation string (see
 *     src/lib/detector/keys.ts). It is an input to the hash, so changing it
 *     changes every verdict the open reference key has ever produced, and
 *     text marked with the published scheme would stop being detected.
 * Both are identifiers rather than brand, and both are covered by the rename
 * guard in tests/rename.test.ts so that neither drifts by accident.
 */

/** A configuration variable that has been renamed, and the name it used to have. */
export interface AliasedEnvName {
  canonical: string
  legacy: string
}

export const ENV_DETECTION_KEYS: AliasedEnvName = {
  canonical: 'WATERMARKREMOVERPRO_DETECTION_KEYS',
  legacy: 'MARKWITNESS_DETECTION_KEYS',
}

export const ENV_API_KEY: AliasedEnvName = {
  canonical: 'WATERMARKREMOVERPRO_API_KEY',
  legacy: 'MARKWITNESS_API_KEY',
}

export const ENV_API_URL: AliasedEnvName = {
  canonical: 'WATERMARKREMOVERPRO_API_URL',
  legacy: 'MARKWITNESS_API_URL',
}

/**
 * Where the on-device model weights are cached. Never had a MarkWitness-era
 * name (the path was hardcoded), so it is a plain name rather than an alias
 * pair. The PATH it defaults to did move, and that move is handled by
 * src/lib/rewrite/backend/model-cache.ts, which relocates an existing cache
 * instead of making the user download the weights again.
 */
export const ENV_MODEL_CACHE = 'WATERMARKREMOVERPRO_MODEL_CACHE'

/**
 * Which rewrite engine a caller that names none gets. One of the values in
 * src/lib/rewrite/engine-choice.ts. Set it to "advanced" on a machine that
 * should always use the local model, or "standard" on one that must never
 * download anything.
 */
export const ENV_REWRITE_MODEL = 'WATERMARKREMOVERPRO_REWRITE_MODEL'

/**
 * Whether an advanced-engine failure is fatal. Unset (the default), a failure
 * is reported to the caller and the deterministic engine finishes the job.
 * Set to "1", the failure is thrown instead, for a pipeline that would rather
 * stop than produce a weaker result it did not ask for.
 */
export const ENV_REWRITE_STRICT = 'WATERMARKREMOVERPRO_REWRITE_STRICT'

export interface AliasedEnvValue {
  /** The configured value, or undefined when neither name is set to anything. */
  value: string | undefined
  /** Which variable the value came from, or null when there is no value. */
  nameUsed: string | null
  /** True when the value came from the pre-rename name, so a caller can say so. */
  legacy: boolean
}

/**
 * An unset variable and one set to the empty string mean the same thing here.
 *
 * That is not a shortcut: `MARKWITNESS_API_KEY=""` is how the MCP smoke test
 * and every "run this locally, ignore my ambient config" invocation force
 * local mode, and it has always been read as "no key" by the `|| ''` this
 * function replaces. Treating it as a set value would turn that into a
 * conflict against the canonical name and break the exact escape hatch it is.
 */
const present = (raw: string | undefined): string | undefined => {
  if (typeof raw !== 'string') return undefined
  return raw.trim().length > 0 ? raw : undefined
}

/**
 * Reads a renamed variable under either name.
 *
 * @throws when both names are set to different values. There is no correct
 * guess to make there, and picking the canonical one would leave an operator
 * looking at a legacy value they can see in their own config and cannot
 * explain.
 */
export function readAliasedEnv(
  env: Record<string, string | undefined>,
  name: AliasedEnvName,
): AliasedEnvValue {
  const canonical = present(env[name.canonical])
  const legacy = present(env[name.legacy])

  if (canonical !== undefined && legacy !== undefined && canonical !== legacy) {
    throw new Error(
      `${name.canonical} and ${name.legacy} are both set to different values. ` +
        `${name.legacy} is the pre-rename name of the same setting; remove it, or set the two to the same value.`,
    )
  }

  if (canonical !== undefined) {
    return { value: canonical, nameUsed: name.canonical, legacy: false }
  }
  if (legacy !== undefined) {
    return { value: legacy, nameUsed: name.legacy, legacy: true }
  }
  return { value: undefined, nameUsed: null, legacy: false }
}

/** The one sentence every surface uses to report that a pre-rename name is in play. */
export function describeLegacyEnvUse(name: AliasedEnvName): string {
  return `${name.legacy} is the pre-rename name of ${name.canonical} and still works. Rename it when convenient.`
}
