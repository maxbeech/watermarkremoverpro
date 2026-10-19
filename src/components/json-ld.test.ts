import { describe, expect, it } from 'vitest'
import { organizationLd, serializeJsonLd, websiteLd } from './json-ld'
import { SITE } from '@/lib/site'

describe('home page publisher and site nodes', () => {
  it('describes the publisher as an Organization on the site origin', () => {
    expect(organizationLd()).toEqual({ '@context': 'https://schema.org', '@type': 'Organization', name: SITE.name, url: SITE.url })
  })
  it('describes the site as a WebSite with the same name and origin', () => {
    const node = websiteLd()
    expect(node['@type']).toBe('WebSite')
    expect(node.name).toBe(SITE.name)
    expect(node.url).toBe(SITE.url)
    expect(node.description).toBe(SITE.description)
  })
  it('serialises alongside the existing nodes as one graph', () => {
    const document = JSON.parse(serializeJsonLd([organizationLd(), websiteLd()]))
    expect(document['@graph'].map((node: { '@type': string }) => node['@type'])).toEqual(['Organization', 'WebSite'])
  })
})

describe('structured data document compatibility', () => {
  it('gives multi-node data a root context without discarding any schema', () => {
    const nodes = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'NeverPrompted' }, { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] }]
    const document = JSON.parse(serializeJsonLd(nodes))
    expect(document['@context'].toLowerCase()).toBe('https://schema.org')
    expect(document['@graph']).toEqual(nodes)
  })
  it('preserves single-node documents', () => {
    const node = { '@context': 'https://schema.org', '@type': 'WebSite' }
    expect(JSON.parse(serializeJsonLd(node))).toEqual(node)
  })
  it('cannot close the script element through either shape', () => {
    for (const data of [{ name: '</script>' }, [{ name: '</script>' }]]) {
      const json = serializeJsonLd(data)
      expect(json).not.toContain('<')
      const decoded = JSON.parse(json)
      expect(Array.isArray(data) ? decoded['@graph'][0].name : decoded.name).toBe('</script>')
    }
  })
})
