import { NextResponse } from 'next/server'
import { API_PRICE_PENCE_PER_1K_WORDS, PLANS, SITE } from '@/lib/site'

export const dynamic = 'force-static'

/**
 * Machine-readable pricing.
 *
 * An agent deciding whether to call this capability should not have to read a
 * marketing page to find out what it costs. Everything here is derived from the
 * same constants the human pricing page renders from, so the two cannot drift.
 */
export function GET() {
  return NextResponse.json(
    {
      product: SITE.name,
      url: SITE.url,
      currency: 'GBP',
      updated: '2026-08-11',
      plans: [
        {
          id: PLANS.anonymous.id,
          name: PLANS.anonymous.name,
          price: 0,
          interval: null,
          wordsPerDocument: PLANS.anonymous.wordCap,
          checksPerMonth: null,
          machineCallable: false,
          notes:
            'Runs entirely in the browser. The document is not uploaded, so there is no server-side path for a programmatic caller to use.',
        },
        {
          id: PLANS.free.id,
          name: PLANS.free.name,
          price: 0,
          interval: null,
          wordsPerDocument: PLANS.free.wordCap,
          checksPerMonth: PLANS.free.checksPerMonth,
          machineCallable: false,
        },
        {
          id: PLANS.pro.id,
          name: PLANS.pro.name,
          price: PLANS.pro.price,
          interval: 'month',
          wordsPerDocument: PLANS.pro.wordCap,
          checksPerMonth: null,
          machineCallable: true,
          includes: [...PLANS.pro.features],
        },
      ],
      metered: {
        endpoint: `${SITE.url}/api/v1/check`,
        mcp: `${SITE.url}/docs/mcp`,
        unit: 'words',
        unitSize: 1000,
        rounding: 'up',
        pencePerUnit: API_PRICE_PENCE_PER_1K_WORDS,
        authentication: 'Authorization: Bearer mw_live_...',
        billingNote:
          'Metered on words submitted. A document too short for a statistic to be computed still consumes one unit, because the work of measuring it was still done.',
      },
      // Stated here as well as in llms.txt because an agent reading pricing to
      // decide what it can buy should learn in the same document that the
      // obvious adjacent capability is not for sale here at any price.
      notOffered: {
        markRemoval:
          'MarkWitness does not remove, weaken, paraphrase around or reduce a provenance mark. There is no tier, endpoint, MCP tool or parameter that does this, and none will be added.',
      },
    },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}
