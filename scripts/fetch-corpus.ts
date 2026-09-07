/**
 * Fetch the reference corpora the language baselines are measured from.
 *
 * Source: Wikipedia article prose, pulled per language from that language's own
 * wiki through the MediaWiki API, licensed CC BY-SA 4.0.
 *
 * Why Wikipedia rather than Project Gutenberg, which is the more usual choice:
 * the baseline's job is to describe the register WatermarkRemoverPro users actually
 * check, meaning essays, reports, applications and articles, against a corpus of 19th century
 * novels describes something else. A student's coursework compared against Moby
 * Dick would show a large "distance" that says nothing except that they are not
 * Melville. Contemporary expository prose is the honest comparison class, and
 * per-language wikis give it in all five launch languages from one interface.
 *
 * Every fetched document is checked against the engine's OWN language
 * identifier before it is kept. The API is asked for Spanish and is generally
 * telling the truth, but a baseline is the reference every user's number is
 * measured against, and "the source said so" is not verification.
 *
 * Output: corpus/<lang>/*.txt plus corpus/<lang>/manifest.json recording page
 * ids, revision ids and the retrieval date, so a baseline can be traced to the
 * exact revisions it came from.
 *
 * Run: npm run corpus
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tokenize } from '../src/lib/detector/tokenize'
import { identifyLanguage, SUPPORTED_LANGUAGES, type LanguageCode } from '../src/lib/detector/languages'

const USER_AGENT = 'WatermarkRemoverPro-baseline-builder/0.1 (https://github.com/maxbeech/watermarkremoverpro; maxedbeech@gmail.com)'
const TARGET_TOKENS_PER_LANGUAGE = 220_000
const MIN_DOC_CHARS = 1_500
const BATCH = 20
const MAX_BATCHES = 220

interface WikiPage {
  pageid: number
  title: string
  revid?: number
  extract?: string
}

interface ManifestEntry {
  pageid: number
  title: string
  revid: number | null
  tokens: number
  file: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchBatch(lang: LanguageCode): Promise<WikiPage[]> {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&generator=random&grnnamespace=0` +
    `&grnlimit=${BATCH}&prop=extracts|revisions&explaintext=1&exlimit=max&rvprop=ids&format=json`

  // Wikipedia rate-limits politely and expects the caller to back off rather
  // than give up: a 429 means "slower", not "no". Retrying it is not papering
  // over a failure, it is the documented way to use the API. A hard failure
  // after the last attempt still stops the run, because a short corpus must be visible.
  let res: Response | null = null
  for (let attempt = 0; attempt < 5; attempt++) {
    res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (res.status !== 429 && res.status !== 503) break
    await sleep(2000 * 2 ** attempt)
  }
  if (!res || !res.ok) throw new Error(`${lang}: MediaWiki API returned ${res?.status} ${res?.statusText} after retries`)

  const json = (await res.json()) as { query?: { pages?: Record<string, WikiPage & { revisions?: { revid: number }[] }> } }
  const pages = json.query?.pages
  if (!pages) return []

  return Object.values(pages).map((p) => ({
    pageid: p.pageid,
    title: p.title,
    revid: p.revisions?.[0]?.revid,
    extract: p.extract,
  }))
}

/**
 * Strip the artefacts that would bias the measured features: section headings
 * (no verbs, no punctuation, and they deflate mean sentence length), and the
 * reference/see-also tails, which are lists rather than prose.
 */
function cleanExtract(text: string): string {
  const cut = text.split(/\n=+ ?(References|Referencias|Références|Einzelnachweise|Referências|See also|Véase también|Voir aussi|Siehe auch|Ver também|Bibliography|Bibliografía|Bibliographie|Literatur|External links|Enlaces externos|Liens externes|Weblinks|Ligações externas) ?=+/i)[0]
  return cut
    .split('\n')
    .filter((line) => !/^\s*=+.*=+\s*$/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function collect(lang: LanguageCode): Promise<void> {
  const dir = join(process.cwd(), 'corpus', lang)
  await mkdir(dir, { recursive: true })

  // Resume from whatever a previous run already fetched. Rate limits and
  // transient failures are normal here, and re-downloading a corpus from zero
  // each time both wastes Wikipedia's bandwidth and makes the target unreachable.
  const manifest: ManifestEntry[] = []
  const seen = new Set<number>()
  let tokensTotal = 0
  let rejectedLanguage = 0
  let rejectedShort = 0

  const existingRaw = await readFile(join(dir, 'manifest.json'), 'utf8').catch(() => null)
  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw) as { entries?: ManifestEntry[] }
      for (const entry of existing.entries ?? []) {
        manifest.push(entry)
        seen.add(entry.pageid)
        tokensTotal += entry.tokens
      }
      console.log(`  ${lang}: resuming from ${manifest.length} documents / ${tokensTotal.toLocaleString()} tokens`)
    } catch {
      console.error(`  ! ${lang}: existing manifest.json is unreadable; starting this language from scratch.`)
    }
  }

  for (let batch = 0; batch < MAX_BATCHES && tokensTotal < TARGET_TOKENS_PER_LANGUAGE; batch++) {
    let pages: WikiPage[]
    try {
      pages = await fetchBatch(lang)
    } catch (err) {
      // A transient API failure must not silently truncate a baseline. Report
      // and stop; a short corpus is a visible problem, a quietly short one is not.
      console.error(`  ! ${(err as Error).message}`)
      break
    }

    for (const page of pages) {
      if (seen.has(page.pageid)) continue
      seen.add(page.pageid)

      const text = cleanExtract(page.extract ?? '')
      if (text.length < MIN_DOC_CHARS) {
        rejectedShort++
        continue
      }

      const tokens = tokenize(text)
      const id = identifyLanguage(tokens)
      if (id.language !== lang) {
        rejectedLanguage++
        continue
      }

      const file = `${page.pageid}.txt`
      await writeFile(join(dir, file), text, 'utf8')
      manifest.push({ pageid: page.pageid, title: page.title, revid: page.revid ?? null, tokens: tokens.length, file })
      tokensTotal += tokens.length
      if (tokensTotal >= TARGET_TOKENS_PER_LANGUAGE) break
    }

    if (batch % 20 === 0) {
      console.log(`  ${lang}: batch ${batch}: ${tokensTotal.toLocaleString()} tokens from ${manifest.length} documents`)
    }
    await new Promise((r) => setTimeout(r, 120))
  }

  await writeFile(
    join(dir, 'manifest.json'),
    JSON.stringify(
      {
        language: lang,
        source: 'Wikipedia article prose via the MediaWiki API (action=query&generator=random)',
        license: 'CC BY-SA 4.0',
        retrievedAt: new Date().toISOString(),
        documents: manifest.length,
        tokens: tokensTotal,
        rejectedForLanguageMismatch: rejectedLanguage,
        rejectedAsTooShort: rejectedShort,
        entries: manifest,
      },
      null,
      2,
    ),
    'utf8',
  )

  console.log(
    `\n  ${lang}: kept ${manifest.length} documents / ${tokensTotal.toLocaleString()} tokens ` +
      `(rejected ${rejectedLanguage} for language mismatch, ${rejectedShort} as too short)`,
  )
}

async function main() {
  const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  const languages = (requested.length > 0 ? requested : [...SUPPORTED_LANGUAGES]) as LanguageCode[]

  for (const lang of languages) {
    if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(lang)) {
      throw new Error(`Unknown language "${lang}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}`)
    }
    console.log(`Fetching ${lang} corpus...`)
    await collect(lang)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
