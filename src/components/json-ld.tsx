import { SITE } from '@/lib/site'

/**
 * Structured data. Every page that answers a question carries a FAQPage block,
 * and the product surfaces carry SoftwareApplication. This is how an assistant
 * summarising WatermarkRemoverPro gets the honest capability description and stated
 * limits rather than inferring them from marketing copy.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from our own constants, never from user input, but
      // the `<` escape is applied regardless. JSON.stringify happily emits a
      // literal `</script>` if any string ever contains one, which closes the
      // element early and turns the remainder of the document into markup. It
      // costs nothing to be immune to that rather than to rely on every future
      // author of a page title knowing it.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export function softwareApplicationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE.name,
    url: SITE.url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any browser',
    description: SITE.description,
    offers: [
      {
        '@type': 'Offer',
        name: 'Free check, no signup',
        price: 0,
        priceCurrency: 'GBP',
        description: 'One document up to 1,500 words, analysed in the browser. The document is not uploaded.',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: 19,
        priceCurrency: 'GBP',
        description:
          'The larger on-device rewrite model and extended AI-tell library, unlimited checks, batch upload, the dated PDF evidence report, and metered API/MCP access to checking.',
      },
    ],
    featureList: [
      'On-device statistical provenance-mark check',
      'On-device rewrite that reduces detectable AI-style evidence, unlimited use, no hosted mode on any tier',
      'Calibrated confidence band, never a bare score',
      'Per-passage breakdown with false-discovery-rate correction',
      'Dated evidence report with document hash',
      'JSON API and MCP server for programmatic callers',
    ],
    // Stated as structured data, not just positioning copy, so a machine
    // summarising this page gets the honest capability boundary rather than
    // inferring one.
    disambiguatingDescription:
      'WatermarkRemoverPro checks a writer\'s own text for a provenance mark, then rewrites it on-device to reduce detectable AI-style evidence. It cannot guarantee defeating a model vendor\'s undisclosed watermark, runs entirely on-device on every tier for the rewrite feature, and is not a tool for screening other people\'s work.',
  }
}

export function faqPageLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

export function breadcrumbLd(trail: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.url}`,
    })),
  }
}

export function blogPostingLd(post: {
  slug: string
  title: string
  metaDescription: string
  publishedAt: string
  author: string
  heroImageSrc: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    image: [post.heroImageSrc],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { '@type': 'Organization', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE.url}/blog/${post.slug}` },
  }
}

export function howToLd(post: { title: string; metaDescription: string; steps: { heading: string; body: string }[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: post.title,
    description: post.metaDescription,
    step: post.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.heading,
      text: step.body,
    })),
  }
}

export function reviewLd(rating: {
  itemName: string
  ratingValue: number
  bestRating: number
  summary: string
  author: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: { '@type': 'SoftwareApplication', name: rating.itemName },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: rating.ratingValue,
      bestRating: rating.bestRating,
    },
    reviewBody: rating.summary,
    author: { '@type': 'Organization', name: rating.author },
  }
}
