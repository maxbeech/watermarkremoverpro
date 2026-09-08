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
          rewrite: { ...PLANS.anonymous.rewrite, onDevice: true },
          notes:
            'Checking runs entirely in the browser and the document is not uploaded, so there is no server-side path for a programmatic caller to use. Rewriting is always on-device on every plan, and unlimited on the Standard engine; the Pro engine is limited to a weekly free allowance unless you subscribe.',
        },
        {
          id: PLANS.free.id,
          name: PLANS.free.name,
          price: 0,
          interval: null,
          wordsPerDocument: PLANS.free.wordCap,
          checksPerMonth: PLANS.free.checksPerMonth,
          machineCallable: false,
          rewrite: { ...PLANS.free.rewrite, onDevice: true },
        },
        {
          id: PLANS.pro.id,
          name: PLANS.pro.name,
          price: PLANS.pro.price,
          interval: 'month',
          wordsPerDocument: PLANS.pro.wordCap,
          checksPerMonth: null,
          machineCallable: true,
          rewrite: { ...PLANS.pro.rewrite, onDevice: true },
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
      // Stated here as well as in llms.txt and the FAQ so an agent reading
      // pricing to decide what it can buy learns the honest limits in the
      // same document, not just the capability.
      rewriteCapability: {
        summary:
          'Reduces detectable AI-style evidence (statistical watermark signal, where structurally possible, and human-perceptible AI tells). Always on-device, unlimited use, on every plan.',
        limitations: [
          'Cannot guarantee defeating a model vendor\'s undisclosed watermark. Nobody outside that vendor holds the key it was applied with.',
          'Heavier rewriting trades fidelity to the original wording for a larger evidence reduction.',
          'No server ever receives the document for this feature, on any tier or surface. There is no hosted endpoint for it.',
        ],
        interfaces: {
          mcp: `${SITE.url}/docs/mcp`,
          note: 'No REST endpoint exists for rewriting, by design (see limitations above). Use the MCP server or the local package/CLI, both of which run the identical engine in the caller\'s own process.',
        },
      },
    },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}
