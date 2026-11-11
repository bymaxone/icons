/**
 * Unit tests for the catalog site's model, escaping and search.
 *
 * Layer: unit.
 * Goal: pin the escaping every page relies on, the catalog built from the merged metadata
 * (order, components, categories and search words), and the query and category matching
 * the browser script applies.
 * Mocks: none.
 */

import type { BrandMetadata, IconMetadata } from '../meta/icon-metadata.ts'
import { BRAND_CATEGORY, catalogFrom, escapeHtml, inCategory, matchesQuery } from './site.ts'
import type { BuiltMetadata } from './site.ts'

const ICON: IconMetadata = {
  label: 'Loop',
  tags: ['Ring', 'loop'],
  categories: ['status'],
  useCases: ['Marks a loop', 'Filled: a loop that runs'],
  aliases: [{ name: 'circle', deprecated: false }],
  variants: ['line', 'filled'],
  opticalSizes: [24],
  since: '0.1.0'
}

const BRAND: BrandMetadata = {
  title: 'Acme Corp',
  source: 'https://example.com/acme.svg',
  guidelines: 'https://example.com/brand',
  license: 'CC0-1.0',
  retrievedAt: '2026-11-11',
  tags: ['acme'],
  aliases: [],
  multicolor: false,
  since: '0.2.0'
}

const METADATA: BuiltMetadata = {
  icons: { zeta: { ...ICON, aliases: [], variants: ['line'] }, ring: ICON },
  brands: { zed: { ...BRAND, title: 'Zed' }, acme: BRAND },
  categories: [{ name: 'status', title: 'Status' }]
}

describe('escapeHtml', () => {
  it('writes the five markup characters as entities', () => {
    /**
     * Scenario: a metadata text can hold any character; as element content or a quoted
     * attribute value it must never close a tag, open one or end the attribute.
     */
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
    )
  })

  it('escapes an ampersand once, before the other entities are written', () => {
    /**
     * Scenario: a text that already holds an entity is shown as written, so its `&` is
     * escaped and the result is not escaped a second time.
     */
    expect(escapeHtml('&lt; &amp;')).toBe('&amp;lt; &amp;amp;')
  })

  it('leaves every other character, and an empty text, as it is', () => {
    /**
     * Scenario: only the five characters change; letters, digits, spaces and non-ASCII
     * text are written as given.
     */
    expect(escapeHtml('Polvi 16 px · olá')).toBe('Polvi 16 px · olá')
    expect(escapeHtml('')).toBe('')
  })
})

describe('catalogFrom', () => {
  const catalog = catalogFrom(METADATA)

  it('lists the icons in name order, then the brand marks', () => {
    /**
     * Scenario: the grid shows icons alphabetically and the brand marks after them, whatever
     * the order of the metadata records.
     */
    expect(catalog.entries.map((entry) => [entry.kind, entry.name])).toEqual([
      ['icon', 'ring'],
      ['icon', 'zeta'],
      ['brand', 'acme'],
      ['brand', 'zed']
    ])
  })

  it('describes an icon with its drawings, metadata and search words', () => {
    /**
     * Scenario: each drawn variant names the component that renders it; the label is the
     * metadata's; the search words hold the name, the label, the tags and the alias names in
     * lower case.
     */
    expect(catalog.entries[0]).toEqual({
      name: 'ring',
      kind: 'icon',
      title: 'ring',
      label: 'Loop',
      drawings: [
        { variant: 'line', component: 'RingIcon' },
        { variant: 'filled', component: 'RingFilledIcon' }
      ],
      categories: ['status'],
      tags: ['Ring', 'loop'],
      aliases: [{ name: 'circle', deprecated: false }],
      useCases: ['Marks a loop', 'Filled: a loop that runs'],
      since: '0.1.0',
      words: 'ring loop ring loop circle'
    })
  })

  it('describes a brand mark under the brands category, with its title', () => {
    /**
     * Scenario: a brand mark has one drawing, its brand component, is listed under Brands,
     * shows its owner's title, takes it as its label and is found by it.
     */
    expect(catalog.entries[2]).toEqual({
      name: 'acme',
      kind: 'brand',
      title: 'Acme Corp',
      label: 'Acme Corp',
      drawings: [{ variant: 'brand', component: 'AcmeBrandIcon' }],
      categories: ['brands'],
      tags: ['acme'],
      aliases: [],
      useCases: [],
      since: '0.2.0',
      words: 'acme acme corp acme'
    })
  })

  it('lists the metadata categories, then the brands category', () => {
    /**
     * Scenario: the category filter offers every category of the set and, last, Brands.
     */
    expect(catalog.categories).toEqual([{ name: 'status', title: 'Status' }, BRAND_CATEGORY])
    expect(BRAND_CATEGORY).toEqual({ name: 'brands', title: 'Brands' })
  })
})

describe('matchesQuery', () => {
  it('matches every entry with an empty or blank query', () => {
    /**
     * Scenario: before the reader types, or after clearing the field, nothing is hidden.
     */
    expect(matchesQuery('ring loop', '')).toBe(true)
    expect(matchesQuery('ring loop', '   ')).toBe(true)
  })

  it('needs every word of the query, in any case and order', () => {
    /**
     * Scenario: words narrow the result; case does not matter and extra spaces between
     * words are ignored.
     */
    expect(matchesQuery('ring loop circle', 'LOOP  ring')).toBe(true)
    expect(matchesQuery('ring loop circle', 'loop square')).toBe(false)
  })

  it('matches a word inside a longer one', () => {
    /**
     * Scenario: typing the start of a word, or part of it, finds the entry.
     */
    expect(matchesQuery('lightning-stack credit pack', 'stack')).toBe(true)
    expect(matchesQuery('lightning-stack credit pack', 'cred')).toBe(true)
  })
})

describe('inCategory', () => {
  it('keeps every entry for the empty category', () => {
    /**
     * Scenario: "All categories" is the empty value.
     */
    expect(inCategory(['status'], '')).toBe(true)
    expect(inCategory([], '')).toBe(true)
  })

  it('keeps an entry only in a category it is listed under', () => {
    /**
     * Scenario: an icon may sit in several categories; any one of them selects it.
     */
    expect(inCategory(['status', 'actions'], 'actions')).toBe(true)
    expect(inCategory(['status'], 'files')).toBe(false)
  })
})
