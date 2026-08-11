/**
 * Site-wide constants. Single source of truth for anything that appears in more
 * than one place: metadata, JSON-LD, llms.txt, the OpenAPI document and the
 * evidence report all read from here, so a change to the product's name or
 * pricing cannot end up half-applied.
 */

export const SITE = {
  name: 'MarkWitness',
  tagline: 'Check your own writing for an AI provenance mark, on your device.',
  description:
    'MarkWitness tells you whether your own text carries a statistical AI provenance mark, how strong the signal is, and which passages carry it. The free check runs entirely in your browser: the document never leaves your device.',
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

export const PLANS = {
  anonymous: {
    id: 'anonymous',
    name: 'No signup',
    price: 0,
    wordCap: 1500,
    checksPerMonth: null,
    features: [
      'One document at a time, up to 1,500 words',
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
    features: [
      'Up to 5,000 words per document, 20 checks a month',
      'All five supported languages',
      'Saved check history you can return to',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19,
    currency: 'GBP',
    wordCap: 100_000,
    checksPerMonth: null,
    features: [
      'Unlimited checks and batch upload',
      'The dated evidence report as a PDF: signal strength, per-passage breakdown, stated limits, document hash',
      'API and MCP access with metered credits',
    ],
  },
} as const

/** Metered price for programmatic callers, in pence per 1,000 words. */
export const API_PRICE_PENCE_PER_1K_WORDS = 2

export const SUPPORTED_LANGUAGE_NAMES = ['English', 'Spanish', 'French', 'German', 'Portuguese'] as const
