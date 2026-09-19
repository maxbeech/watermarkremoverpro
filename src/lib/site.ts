import { REWRITE_TOKENS_PER_WINDOW, REWRITE_WINDOW_DAYS } from '@/lib/entitlements/rewrite-budget'

/**
 * Site-wide constants. Single source of truth for anything that appears in more
 * than one place: metadata, JSON-LD, llms.txt, the OpenAPI document and the
 * evidence report all read from here, so a change to the product's name or
 * pricing cannot end up half-applied.
 *
 * Two brands, one product. WatermarkRemoverPro and NeverPrompted are the same
 * app, same detector, same rewrite engine, same pricing: only which door a
 * visitor walked through differs. `NEXT_PUBLIC_BRAND` is a build-time choice
 * (each brand is its own Vercel project), read once here rather than per
 * request, so nothing below needs to know which brand it's serving.
 */

export type BrandId = 'watermarkremoverpro' | 'neverprompted'

interface Brand {
  id: BrandId
  name: string
  tagline: string
  description: string
  /** Used if NEXT_PUBLIC_SITE_URL is unset for this deployment. */
  defaultUrl: string
  contactEmail: string
  /** Canonical apex domain this brand's build redirects to www on (next.config.ts). */
  domain: string
}

const BRANDS: Record<BrandId, Brand> = {
  watermarkremoverpro: {
    id: 'watermarkremoverpro',
    name: 'WatermarkRemoverPro',
    tagline: 'Reduce detectable AI-style evidence in your writing, on your device, honestly.',
    description:
      'WatermarkRemoverPro checks your own text for a statistical AI provenance mark, then rewrites it on your device to reduce detectable AI-style evidence: both statistical watermark signal, where structurally possible, and human-perceptible AI tells like em dashes and stock phrasing. Every step runs entirely on your device; the document never leaves it, on either feature, on any tier.',
    defaultUrl: 'https://www.watermarkremoverpro.com',
    contactEmail: 'hello@watermarkremoverpro.com',
    domain: 'watermarkremoverpro.com',
  },
  neverprompted: {
    id: 'neverprompted',
    name: 'NeverPrompted',
    tagline: 'The free AI humanizer that helps your writing sound human again.',
    description:
      'NeverPrompted is a free AI humanizer: paste in a draft that reads like it came out of a prompt box, and get back a version with the stock phrasing, hedging and flat rhythm gone, so it sounds like you wrote it. It also checks for a statistical AI watermark and reduces it where the technique allows. Every step runs entirely on your device; the document never leaves it, on either feature, on any tier.',
    defaultUrl: 'https://www.neverprompted.com',
    contactEmail: 'hello@neverprompted.com',
    domain: 'neverprompted.com',
  },
}

function resolveBrand(): Brand {
  const id = (process.env.NEXT_PUBLIC_BRAND?.trim() || 'watermarkremoverpro') as BrandId
  const brand = BRANDS[id]
  if (!brand) {
    throw new Error(`NEXT_PUBLIC_BRAND="${id}" is not a known brand. Valid values: ${Object.keys(BRANDS).join(', ')}.`)
  }
  return brand
}

const ACTIVE_BRAND = resolveBrand()

/** The active build's brand id. Only needed where identity itself matters (content selection, next.config.ts, asset selection); everything else should read SITE. */
export const BRAND_ID: BrandId = ACTIVE_BRAND.id

export const SITE = {
  name: ACTIVE_BRAND.name,
  tagline: ACTIVE_BRAND.tagline,
  description: ACTIVE_BRAND.description,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? ACTIVE_BRAND.defaultUrl,
  contactEmail: ACTIVE_BRAND.contactEmail,
} as const

/**
 * The mirror-image product. WatermarkRemoverPro checks YOUR OWN writing; anyone who
 * wants to screen other people's work is looking for Learnaway, and every page
 * says so. Keeping this pointer in one constant means the operator requirement
 * cannot rot on one page while holding on another.
 */
export const MIRROR_PRODUCT = {
  name: 'Learnaway',
  url: 'https://learnaway.ai',
  reason: 'checking someone else’s work for AI use',
} as const

/**
 * Two axes, not one, and they are metered differently on purpose.
 *
 * CHECKING is free and unlimited on every plan when it runs in the visitor's
 * own browser, because it costs this product nothing to serve. `wordCap` and
 * `checksPerMonth` describe only the HOSTED checking paths (the API, the MCP
 * server and the signed-in server-side check), which do cost server compute.
 *
 * CORRECTION is the feature this product sells. It also runs on the visitor's
 * device, so the limit below is a commercial boundary rather than a capacity
 * one, and it is set generously: REWRITE_TOKENS_PER_WINDOW tokens every
 * REWRITE_WINDOW_DAYS days on the free plan, unlimited on Pro. The Pro rewrite
 * engine is not metered at all on the free plan, it is simply not included:
 * a taste of it that runs out mid-session teaches someone less about whether
 * to buy it than an honest description does.
 *
 * TWO PLANS, NOT THREE. There used to be a third, "Free account", between
 * anonymous and Pro. It existed to sell an account rather than a capability,
 * and reading down the pricing table the difference between the first two
 * columns was a sentence about where a counter is stored. It is gone, and
 * signing in now means exactly one thing: you are on Pro.
 *
 * The numbers are read from lib/entitlements/rewrite-budget rather than
 * retyped, so the pricing page, the machine-readable pricing document and the
 * code that actually enforces the budget cannot disagree.
 */
const correctionLine = `${REWRITE_TOKENS_PER_WINDOW.toLocaleString('en-GB')} tokens of rewriting every ${REWRITE_WINDOW_DAYS} days`

export const PLANS = {
  anonymous: {
    id: 'anonymous',
    name: 'Free',
    price: 0,
    wordCap: 1500,
    checksPerMonth: null,
    rewrite: {
      modelTier: 'standard',
      unlimited: false,
      tellLibrary: 'core',
      tokensPerWindow: REWRITE_TOKENS_PER_WINDOW,
      windowDays: REWRITE_WINDOW_DAYS,
    },
    features: [
      'Unlimited checking, in your browser, with no account and no word limit',
      `${correctionLine}, on the Standard engine`,
      'Confidence band, per-passage breakdown and stated limits on screen',
      'Your document is never uploaded, on any feature',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19,
    currency: 'GBP',
    wordCap: 100_000,
    checksPerMonth: null,
    rewrite: {
      modelTier: 'advanced',
      unlimited: true,
      tellLibrary: 'extended',
      tokensPerWindow: null,
      windowDays: null,
    },
    features: [
      'Unlimited rewriting, with no weekly token budget',
      'The Pro rewrite engine: a real language model in your browser, more candidates per passage, and the extended AI-tell library',
      'The dated evidence report as a PDF: signal strength, per-passage breakdown, stated limits, document hash',
      'API and MCP access to checking, metered; rewriting is always on-device, on every tier',
    ],
  },
} as const

/** Metered price for programmatic callers, in pence per 1,000 words. */
export const API_PRICE_PENCE_PER_1K_WORDS = 2

/**
 * Revalidation window for prerendered marketing/content routes, in seconds.
 *
 * One week. Every page using this is generated from typed data in
 * src/content, so it only actually changes on a deploy; a long window keeps
 * these served from the CDN rather than re-rendered on a function
 * invocation, which is the difference between free-tier Fast Origin
 * Transfer and paid compute on a page nobody edited.
 *
 * Next.js requires `export const revalidate` to be statically analysable, so
 * route files write the literal and cite this constant. The value here is
 * the documented source of truth, and sitemap.ts reads it so the two cannot
 * drift apart silently.
 */
export const STATIC_REVALIDATE_SECONDS = 604_800

export const SUPPORTED_LANGUAGE_NAMES = ['English', 'Spanish', 'French', 'German', 'Portuguese'] as const
