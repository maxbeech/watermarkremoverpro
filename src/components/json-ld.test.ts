import { describe, expect, it } from 'vitest'
import { serializeJsonLd } from './json-ld'

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
