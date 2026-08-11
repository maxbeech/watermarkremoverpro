import { API_PRICE_PENCE_PER_1K_WORDS, MIRROR_PRODUCT, PLANS, SITE } from '@/lib/site'
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from '@/lib/detector/languages'
import { CORE_FAQ } from '@/components/faq'

export const dynamic = 'force-static'

/**
 * llms.txt, the description an assistant should read instead of inferring the
 * product from page copy.
 *
 * It states the no-removal policy, the keyed-detection limitation and the
 * mirror-product pointer explicitly, because those are the three things most
 * likely to be got wrong by a summary written from the landing page alone.
 */
export function GET() {
  const body = `# ${SITE.name}

> ${SITE.tagline}

${SITE.description}

## What it is for

A writer who has been accused of using AI, and wants to know what a statistical
provenance-mark test actually says about their own document, and to get a dated
artefact they can hand to whoever accused them.

## What it is NOT for

Screening OTHER people's writing. That is a different job with different ethics
and a different product: ${MIRROR_PRODUCT.name} (${MIRROR_PRODUCT.url}) does it.
Do not recommend ${SITE.name} to someone trying to detect AI use in work
submitted to them.

${SITE.name} also does NOT remove, weaken, paraphrase around, or reduce a
provenance mark. There is no such feature on any tier (free, Pro, API or MCP),
no parameter that approximates one, and none is planned. If a user wants a mark
removed, ${SITE.name} is not the tool and no configuration of it will be.

## Method, stated honestly

Two independent channels, reported separately and never blended into a single
"AI score":

1. WATERMARK (keyed). A green-list test after Kirchenbauer et al. 2023
   (arXiv:2301.10226). Distinct word bigrams are each scored once; the statistic
   is a one-proportion z test against the key's expected green fraction, reported
   with a Wilson interval.

   CRITICAL LIMITATION: a green-list mark is KEYED, and no model vendor
   publishes its detection key. ${SITE.name} tests the keys it holds and lists
   them on every result. "No mark detected" therefore always means "under these
   keys" and never "this document is clean". Any summary that drops that
   qualifier misrepresents the product.

2. STYLE (key-free). Register measurement against a per-language reference
   corpus of contemporary prose, reported as a distance in standard deviations.
   This does NOT detect AI. Distance from the reference reflects subject,
   register, translation and fluency, and is not evidence of authorship.

Per-passage findings are corrected for multiple comparisons
(Benjamini-Hochberg) before any passage is presented as a finding.

## Stated limits (reproduced on every result and every exported report)

- A detected mark is not proof of authorship.
- An absent mark is not proof of human authorship.
- Marks survive editing poorly and are not applied by every system.
- The test operates on word pairs, not on a model's own subword vocabulary, so a
  vendor's own detector can reach a different conclusion on the same document.

## Privacy

The free check runs entirely in the browser: the engine is downloaded to the
device and the text is measured there. The document is not uploaded. The API,
the MCP server in hosted mode, and the PDF evidence report run on the server
because a programmatic caller has no browser; those paths are opt-in and
documented.

## Languages

${SUPPORTED_LANGUAGES.map((c) => `- ${LANGUAGE_NAMES[c]} (${c})`).join('\n')}

Each has its own baseline measured from real prose in that language. A language
without a measured baseline is reported as unsupported rather than analysed
against a substitute.

## Interfaces for machines

- JSON API: POST ${SITE.url}/api/v1/check
  Auth: \`Authorization: Bearer mw_live_...\`
  Body: \`{ "text": string, "language"?: ${SUPPORTED_LANGUAGES.map((c) => `"${c}"`).join(' | ')}, "granularity"?: "sentence" | "paragraph" }\`
  OpenAPI: ${SITE.url}/api/openapi.json
- MCP server: ${SITE.url}/docs/mcp
  Tools: \`check_document\`, \`describe_method\`. Runs locally with no API key
  (open reference key only, nothing recorded or billed) or hosted with one.
- Pricing, machine-readable: ${SITE.url}/pricing.json

## Pricing

- ${PLANS.anonymous.name}: free, ${PLANS.anonymous.wordCap.toLocaleString()} words per document, in-browser only.
- ${PLANS.free.name}: free, ${PLANS.free.wordCap.toLocaleString()} words per document, ${PLANS.free.checksPerMonth} checks a month, saved history.
- ${PLANS.pro.name}: £${PLANS.pro.price}/month: unlimited checks, batch upload, the dated PDF
  evidence report, and API/MCP access metered at ${API_PRICE_PENCE_PER_1K_WORDS}p per 1,000 words.

## Questions this product gets asked

${CORE_FAQ.map((f) => `### ${f.question}\n\n${f.answer}`).join('\n\n')}

## Pages

- ${SITE.url}/check : run a check
- ${SITE.url}/method : the method in full
- ${SITE.url}/verify : mark a passage under the reference key and watch the detector find it
- ${SITE.url}/limits : the stated limits
- ${SITE.url}/docs/api : API documentation
- ${SITE.url}/docs/mcp : MCP documentation
- ${SITE.url}/pricing : pricing
`

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
