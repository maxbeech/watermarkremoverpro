/**
 * Site-wide constants. Single source of truth for anything that appears in more
 * than one place: metadata, JSON-LD, llms.txt, the OpenAPI document and the
 * evidence report all read from here, so a change to the product's name or
 * pricing cannot end up half-applied.
 */

export const SITE = {
  name: 'MarkWitness',
  tagline: 'Reduce detectable AI-style evidence in your writing, on your device, honestly.',
  description:
    'MarkWitness checks your own text for a statistical AI provenance mark, then rewrites it on your device to reduce detectable AI-style evidence: both statistical watermark signal, where structurally possible, and human-perceptible AI tells like em dashes and stock phrasing. Every step runs entirely on your device; the document never leaves it, on either feature, on any tier.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://markwitness.helm7.com',
  contactEmail: 'hello@markwitness.helm7.com',
} as const

/**
 * The mirror-image product. MarkWitness checks YOUR OWN writing; anyone who
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
 * Two axes now, not one. `wordCap`/`checksPerMonth` etc. describe CHECKING,
 * which still costs server compute on the Pro/API/MCP hosted paths and keeps
 * its existing word-cap shape unchanged. `rewrite` describes the on-device
 * REWRITE feature, which is unlimited-use on every plan (the computation runs
 * on the caller's own device or process, so there is no server cost to gate)
 * and differentiates purely by model tier and AI-tell library depth.
 */
export const PLANS = {
  anonymous: {
    id: 'anonymous',
    name: 'No signup',
    price: 0,
    wordCap: 1500,
    checksPerMonth: null,
    rewrite: { modelTier: 'standard', unlimited: true, tellLibrary: 'core' },
    features: [
      'Unlimited on-device rewriting, standard model, core AI-tell library',
      'One document at a time to check, up to 1,500 words',
      'Runs entirely in your browser, and the document is never uploaded',
      'Confidence band, per-passage breakdown and stated limits on screen',
    ],
  },
  free: {
    id: 'free',
    name: 'Free account',
    price: 0,
    wordCap: 5000,
    checksPerMonth: 20,
    rewrite: { modelTier: 'standard', unlimited: true, tellLibrary: 'core' },
    features: [
      'Unlimited on-device rewriting, standard model, core AI-tell library, saved history',
      'Up to 5,000 words per document to check, 20 checks a month',
      'All five supported languages',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19,
    currency: 'GBP',
    wordCap: 100_000,
    checksPerMonth: null,
    rewrite: { modelTier: 'advanced', unlimited: true, tellLibrary: 'extended' },
    features: [
      'Unlimited on-device rewriting: more candidates per passage and the extended AI-tell library',
      'Unlimited checks and batch upload',
      'The dated evidence report as a PDF: signal strength, per-passage breakdown, stated limits, document hash',
      'API and MCP access to checking, metered; rewriting is always on-device, unlimited, on every tier',
    ],
  },
} as const

/** Metered price for programmatic callers, in pence per 1,000 words. */
export const API_PRICE_PENCE_PER_1K_WORDS = 2

export const SUPPORTED_LANGUAGE_NAMES = ['English', 'Spanish', 'French', 'German', 'Portuguese'] as const
