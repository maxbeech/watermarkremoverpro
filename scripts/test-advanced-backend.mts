/**
 * Real-model smoke test for the advanced (Transformers.js-backed) rewrite
 * backend, against actual downloaded weights and real inference. This is NOT
 * part of `npm test` because it downloads real model weights on first run
 * (hundreds of MB) and inference isn't bit-deterministic across hardware, so
 * it can't be a tolerance-free CI gate. Run manually before a release, or
 * whenever backend/node.ts, backend/transformers-shared.ts, or the model
 * pins in models.ts change:
 *
 *   npx tsx scripts/test-advanced-backend.mts
 *
 * It exercises the exact same code path the MCP server's
 * reduce_ai_evidence(model: "advanced") and the local CLI/package use.
 */
import { createTransformersNodeBackend } from '../src/lib/rewrite/backend/node'
import { cosineSimilarity } from '../src/lib/rewrite/backend/types'

const PASSAGE =
  'The committee reviewed the proposal and concluded that further evidence was needed before ' +
  'a final decision could be made. It is important to note that the timeline remains uncertain.'

async function main() {
  let failures = 0
  const check = (label: string, cond: boolean) => {
    console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`)
    if (!cond) failures++
  }

  for (const tier of ['free', 'pro'] as const) {
    console.log(`\n--- tier: ${tier} ---`)
    const backend = createTransformersNodeBackend(tier)
    console.log(`backend id: ${backend.id}`)

    const start = Date.now()
    const candidates = await backend.generate(PASSAGE, { count: 2, strength: 'balanced', language: 'en' })
    const generateMs = Date.now() - start
    console.log(`generate() in ${generateMs}ms:`)
    candidates.forEach((c, i) => console.log(`  [${i}] ${c}`))

    check(`${tier}: generate() returns at least one candidate`, candidates.length >= 1)
    check(
      `${tier}: every candidate is non-empty and differs from the input passage`,
      candidates.every((c) => c.trim().length > 0 && c.trim() !== PASSAGE.trim()),
    )
    check(
      `${tier}: every candidate preserves the word "committee" (a real fact-preservation smoke check, not the fact-lock module itself)`,
      candidates.every((c) => /committee/i.test(c)),
    )

    const embedStart = Date.now()
    const [vecA, vecB, vecUnrelated] = await Promise.all([
      backend.embed(PASSAGE),
      backend.embed(candidates[0] ?? PASSAGE),
      backend.embed('Bananas are a good source of potassium and grow best in tropical climates.'),
    ])
    console.log(`embed() x3 in ${Date.now() - embedStart}ms, dims: ${vecA.length}`)

    check(`${tier}: embed() returns a fixed-length numeric vector`, vecA.length > 0 && vecA.every((v) => Number.isFinite(v)))
    const selfSim = cosineSimilarity(vecA, vecA)
    check(`${tier}: a vector is maximally similar to itself (${selfSim.toFixed(4)})`, selfSim > 0.999)

    const relatedSim = cosineSimilarity(vecA, vecB)
    const unrelatedSim = cosineSimilarity(vecA, vecUnrelated)
    console.log(`similarity(original, rewrite) = ${relatedSim.toFixed(4)}; similarity(original, unrelated) = ${unrelatedSim.toFixed(4)}`)
    check(
      `${tier}: a real rewrite of the passage embeds more similarly to it than an unrelated sentence does`,
      relatedSim > unrelatedSim,
    )
  }

  console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('Advanced backend smoke test crashed:', err)
  process.exit(1)
})
