/**
 * The statistical primitives every reported number is derived from.
 *
 * Nothing in this file is a heuristic or a tuned constant standing in for a
 * calculation. If a figure appears on a WatermarkRemoverPro result screen or evidence
 * report, it came through one of these functions from the document's own counts.
 */

/**
 * Standard normal CDF via Abramowitz & Stegun 7.1.26 applied to erf.
 * Absolute error < 1.5e-7, which is far below the precision at which any
 * confidence figure is reported.
 */
export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * ax)
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax)
  return sign * y
}

/** One-sided upper-tail p-value for a z statistic. */
export function upperTailP(z: number): number {
  return 1 - normalCdf(z)
}

/**
 * z statistic for an observed count of successes against a known null rate.
 * the green-list watermark test's statistic.
 *
 * Returns null when there are no trials: an undefined statistic must surface as
 * "not computed", never as a zero that reads like "no signal found".
 */
export function binomialZ(successes: number, trials: number, p0: number): number | null {
  if (trials <= 0) return null
  const sd = Math.sqrt(trials * p0 * (1 - p0))
  if (sd === 0) return null
  return (successes - trials * p0) / sd
}

/**
 * Wilson score interval for a binomial proportion. Preferred over the normal
 * approximation because it stays inside [0, 1] and behaves at small n. The
 * short-document case this product sees constantly.
 */
export function wilsonInterval(
  successes: number,
  trials: number,
  z = 1.959963984540054,
): { low: number; high: number } | null {
  if (trials <= 0) return null
  const phat = successes / trials
  const z2 = z * z
  const denom = 1 + z2 / trials
  const centre = phat + z2 / (2 * trials)
  const margin = z * Math.sqrt((phat * (1 - phat) + z2 / (4 * trials)) / trials)
  return { low: Math.max(0, (centre - margin) / denom), high: Math.min(1, (centre + margin) / denom) }
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return NaN
  let s = 0
  for (const x of xs) s += x
  return s / xs.length
}

/** Sample standard deviation (n-1 denominator). */
export function stdDev(xs: number[]): number {
  if (xs.length < 2) return NaN
  const m = mean(xs)
  let acc = 0
  for (const x of xs) acc += (x - m) ** 2
  return Math.sqrt(acc / (xs.length - 1))
}

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN
  if (sorted.length === 1) return sorted[0]
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

/**
 * mulberry32, a small, fast, fully deterministic PRNG.
 *
 * Determinism is a product requirement, not a convenience: the bootstrap
 * interval printed on a dated evidence report has to be reproducible by whoever
 * receives that report, so resampling may never touch Math.random().
 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Benjamini-Hochberg step-up procedure.
 *
 * A per-passage breakdown runs one test per passage, so a long document will
 * throw up "significant" passages by chance alone. Returning raw per-passage
 * p-values as if each stood on its own would manufacture attribution the data
 * does not support, which is exactly the fabrication this product exists to argue
 * against. Returns the indices whose discoveries survive at the given FDR.
 */
export function benjaminiHochberg(pValues: number[], fdr = 0.05): number[] {
  const indexed = pValues.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p)
  const m = indexed.length
  let maxK = -1
  for (let k = 0; k < m; k++) {
    if (indexed[k].p <= ((k + 1) / m) * fdr) maxK = k
  }
  if (maxK < 0) return []
  return indexed
    .slice(0, maxK + 1)
    .map((e) => e.i)
    .sort((a, b) => a - b)
}
