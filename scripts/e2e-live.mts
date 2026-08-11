/**
 * End-to-end validation against a real browser and a real deployment.
 *
 * The unit suite proves the engine computes correctly. It cannot prove that the
 * deployed page loads the engine, that the check button produces a result, and,
 * most importantly, that the document is genuinely not transmitted. That last
 * one is the product's central promise and it is only checkable by watching the
 * network from outside the page, which is what this does.
 *
 * Run: npx tsx scripts/e2e-live.mts [baseUrl]
 */
import { chromium, type Request } from 'playwright'

const BASE = (process.argv[2] || 'https://markwitness.helm7.com').replace(/\/$/, '')

/** Distinctive enough that finding it in any request body is unambiguous. */
const CANARY = 'zarquon-beeblebrox-77104 the drainage committee deferred its decision again'
const SAMPLE = `
The committee met on Tuesday evening to consider the revised drainage proposal for the eastern
site. ${CANARY}. Several members asked whether the survey had been completed in full, and the
chair noted that the report had been circulated only two days beforehand. A decision was deferred
until the next meeting, when the surveyor is expected to attend in person and answer questions
directly. The clerk agreed to write to the applicant setting out the outstanding points, including
access arrangements and the likely effect on the neighbouring lane. Members were broadly
sympathetic to the scheme but felt that the drawings submitted so far did not show enough detail
to judge it properly. One member observed that a similar application had been refused three years
ago on grounds that appeared to still apply, and asked the clerk to retrieve the earlier file.
The meeting closed at half past eight after a short discussion of other business, including the
budget for the coming financial year and the condition of the footpath along the river.
`.trim()

let failures = 0
function check(condition: unknown, message: string): void {
  if (condition) {
    console.log(`  ok   ${message}`)
  } else {
    console.error(`  FAIL ${message}`)
    failures++
  }
}

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()

/** Every request the page makes after the check is triggered. */
const outbound: Request[] = []
page.on('request', (req) => outbound.push(req))

try {
  console.log(`E2E against ${BASE}\n`)

  // ---- The free check, driven as a user ---------------------------------
  console.log('free on-device check')
  await page.goto(`${BASE}/check`, { waitUntil: 'networkidle' })
  check(await page.locator('h1').first().textContent() !== null, 'the check page renders')

  await page.locator('textarea').fill(SAMPLE)
  const wordCounter = await page.locator('text=/\\d+ \\/ 1,500 words/').first().textContent()
  check(Boolean(wordCounter), `the word counter updates (${wordCounter?.trim()})`)

  // Everything from here is what we watch the network for.
  outbound.length = 0
  await page.getByRole('button', { name: /run the check/i }).click()

  await page.waitForSelector('text=/Provenance mark/', { timeout: 30_000 })
  check(true, 'a result is rendered')

  // innerText returns text AFTER CSS text-transform, and the stat labels are
  // rendered uppercase, so these two must be case-insensitive or they assert
  // against a stylesheet rather than against the product.
  const body = await page.locator('body').innerText()
  check(/Green-list rate/i.test(body), 'the green-list rate is reported')
  check(/Expected by chance/i.test(body), 'the null expectation is shown beside it')
  check(/band \d/.test(body), 'the rate is reported as a band, not a bare number')
  check(/no vendor publishes one/.test(body), 'the coverage notice is attached to the result')
  check(/Style measurement/.test(body), 'the style channel is reported')
  check(/measure of register, not of provenance/.test(body), 'the style caveat travels with the number')
  check(/Per-passage breakdown/.test(body), 'the per-passage breakdown is rendered')
  check(/false-discovery-rate correction/.test(body), 'the multiple-comparison correction is disclosed')
  check(/Stated limits/.test(body), 'the stated limits are on the result')
  check(/not proof of authorship/.test(body), 'the authorship limit is stated verbatim')
  check(/Document SHA-256/.test(body), 'the document hash is shown')

  // ---- THE CENTRAL PROMISE ----------------------------------------------
  console.log('\non-device promise (the document must not leave the browser)')
  await page.waitForTimeout(1500) // let any late beacon fire

  const withBodies = outbound.filter((r) => ['POST', 'PUT', 'PATCH'].includes(r.method()))
  check(withBodies.length === 0, `no POST/PUT/PATCH was made during the check (saw ${withBodies.length})`)

  const leaked = outbound.filter((r) => {
    const post = r.postData() ?? ''
    return post.includes(CANARY) || decodeURIComponent(r.url()).includes(CANARY)
  })
  check(leaked.length === 0, 'the document text appears in no request body or URL')

  const offOrigin = outbound
    .map((r) => new URL(r.url()).origin)
    .filter((origin) => origin !== new URL(BASE).origin)
  check(offOrigin.length === 0, `no third-party request was made (saw ${[...new Set(offOrigin)].join(', ') || 'none'})`)

  // ---- Explicit failure states rather than fabricated numbers -----------
  console.log('\nexplicit failure states')
  await page.locator('textarea').fill('zzz qqq xxx yyy zzz qqq xxx yyy zzz qqq')
  await page.getByRole('button', { name: /run the check/i }).click()
  await page.waitForSelector('text=/No result was produced/', { timeout: 20_000 })
  const undetermined = await page.locator('body').innerText()
  check(/could not be determined/.test(undetermined), 'an undeterminable language refuses rather than guessing')

  // ---- The auditability demo -------------------------------------------
  console.log('\nverify page (the detector demonstrably detects)')
  await page.goto(`${BASE}/verify`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /marked with the reference key/i }).click()
  await page.waitForSelector('text=/Tested with the reference key/', { timeout: 20_000 })

  const panels = await page.locator('body').innerText()
  const zMatches = [...panels.matchAll(/\bz\s*\n?\s*(-?\d+\.\d+)/g)].map((m) => Number(m[1]))
  check(zMatches.length >= 2, `both key panels reported a z (${zMatches.join(', ')})`)
  check(Math.abs(zMatches[0]) > 5, `marked text scores high under the correct key (z=${zMatches[0]})`)
  check(Math.abs(zMatches[1]) < 4, `the same text sits at chance under a different key (z=${zMatches[1]})`)

  // ---- Machine surfaces --------------------------------------------------
  console.log('\nmachine-readable surfaces')
  for (const [path, test] of [
    ['/llms.txt', (t: string) => t.includes('no vendor publishes') || t.includes('KEYED')],
    ['/pricing.json', (t: string) => JSON.parse(t).notOffered?.markRemoval?.length > 0],
    ['/api/openapi.json', (t: string) => JSON.parse(t).openapi === '3.1.0'],
    ['/sitemap.xml', (t: string) => (t.match(/<url>/g) ?? []).length >= 30],
    ['/robots.txt', (t: string) => t.includes('Sitemap:')],
  ] as Array<[string, (t: string) => boolean]>) {
    const res = await page.request.get(`${BASE}${path}`)
    const text = await res.text()
    check(res.status() === 200 && test(text), `${path} serves and is well-formed`)
  }

  // ---- API refuses correctly --------------------------------------------
  console.log('\nAPI authentication and error contract')
  const unauth = await page.request.post(`${BASE}/api/v1/check`, { data: { text: 'hello' } })
  check(unauth.status() === 401, `unauthenticated check is refused (${unauth.status()})`)
  check((await unauth.json()).error === 'unauthorized', 'the refusal names the reason')

  const badKey = await page.request.post(`${BASE}/api/v1/check`, {
    data: { text: 'hello' },
    headers: { authorization: 'Bearer mw_live_notarealkey000000000000000000' },
  })
  check(badKey.status() === 401, `an unknown key is refused (${badKey.status()})`)

  const reportUnauth = await page.request.post(`${BASE}/api/v1/report`, { data: { text: 'hello' } })
  check(reportUnauth.status() === 401, `the report endpoint requires identity (${reportUnauth.status()})`)

  // ---- Pages that must exist --------------------------------------------
  console.log('\npage coverage')
  const paths = [
    '/', '/check', '/method', '/verify', '/limits', '/pricing', '/docs/api', '/docs/mcp',
    '/for', '/vs', '/guide', '/in',
    '/for/university-students', '/for/non-native-english-writers', '/vs/gptzero',
    '/vs/turnitin-ai-detector', '/guide/claude-ai-watermark', '/guide/ai-detection-false-positive',
    '/in/spanish', '/signup', '/login',
  ]
  let bad = 0
  for (const path of paths) {
    const res = await page.request.get(`${BASE}${path}`)
    if (res.status() !== 200) {
      console.error(`     ${path} -> ${res.status()}`)
      bad++
    }
  }
  check(bad === 0, `all ${paths.length} sampled pages return 200`)

  // ---- The mirror-product pointer on every page -------------------------
  const homeHtml = await (await page.request.get(BASE)).text()
  const guideHtml = await (await page.request.get(`${BASE}/guide/claude-ai-watermark`)).text()
  check(
    homeHtml.includes('learnaway.ai') && guideHtml.includes('learnaway.ai'),
    'the Learnaway pointer ships on the home page and long-tail pages',
  )
  check(
    homeHtml.includes('application/ld+json') && guideHtml.includes('FAQPage'),
    'JSON-LD is present, including FAQPage on long-tail pages',
  )
} catch (err) {
  console.error(`\nUNCAUGHT: ${(err as Error).message}`)
  failures++
} finally {
  await browser.close()
}

console.log(failures === 0 ? '\nE2E passed.' : `\nE2E FAILED with ${failures} problem(s).`)
process.exit(failures === 0 ? 0 : 1)
