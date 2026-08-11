import { SITE } from '@/lib/site'

/**
 * Structured data. Every page that answers a question carries a FAQPage block,
 * and the product surfaces carry SoftwareApplication — this is how an assistant
 * summarising MarkWitness gets the no-removal policy and the stated limits
 * rather than inferring them from marketing copy.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from our own constants, never from user input — but
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
          'Unlimited checks, batch upload, the dated PDF evidence report, and metered API/MCP access.',
      },
    ],
    featureList: [
      'On-device statistical provenance-mark check',
      'Calibrated confidence band, never a bare score',
      'Per-passage breakdown with false-discovery-rate correction',
      'Dated evidence report with document hash',
      'JSON API and MCP server for programmatic callers',
    ],
    // Stated as structured data because it is a permanent product constraint,
    // not a positioning line.
    disambiguatingDescription:
      'MarkWitness is a diagnostic for a writer checking their own text. It does not remove, weaken, paraphrase around or reduce a provenance mark on any tier, and it is not a tool for screening other people’s work.',
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
