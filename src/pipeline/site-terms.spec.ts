/**
 * The Portuguese search terms of the catalog site, checked against the set itself: every icon,
 * brand mark and flag has at least one, so a drawing added without its translation fails here, and
 * the real searches a Brazilian reader types find what they mean.
 *
 * Layer: integration.
 * Goal: hold `site/terms-pt.json` to the set's names, and the search to real cases.
 * Mocks: none; the terms file and the generated metadata are read as they are.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { BRANDS, CATEGORIES, FLAGS, ICONS } from '../meta/generated/metadata.ts'
import { search, searchIndex } from './site-search.ts'
import { catalogFrom } from './site.ts'

const terms = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'site', 'terms-pt.json'), 'utf8')
) as Record<string, string[]>
const categoryTitles = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'site', 'categories-pt.json'), 'utf8')
) as Record<string, string>
const catalog = catalogFrom({ icons: ICONS, brands: BRANDS, flags: FLAGS, categories: CATEGORIES })
const docs = searchIndex(catalog, terms, categoryTitles)

/** Every icon the query finds, best first. */
const all = (query: string): string[] =>
  search(docs, query, { types: [], categories: [] }).map(({ name }) => name)

/** The names a query finds first, best first. */
const top = (query: string, count = 1): string[] =>
  search(docs, query, { types: [], categories: [] })
    .slice(0, count)
    .map((hit) => hit.name)

describe('site/terms-pt.json', () => {
  it('names exactly the icons, brand marks and flags of the set', () => {
    // Scenario: a new drawing without terms, or terms left behind by a rename, fail here.
    const names = catalog.entries.map((entry) => entry.name).sort()
    expect(Object.keys(terms).sort()).toStrictEqual(names)
  })

  it('gives every entry at least one lower-case term', () => {
    // Scenario: an empty list or a blank or capitalised term fails.
    const faulty = Object.entries(terms).filter(
      ([, list]) =>
        list.length === 0 || list.some((term) => term.trim() === '' || term !== term.toLowerCase())
    )
    expect(faulty).toStrictEqual([])
  })
})

describe('site/categories-pt.json', () => {
  it('titles exactly the categories of the catalog, brands and flags included', () => {
    // Scenario: a new category without its Portuguese title, or a title left behind by a
    // removed one, fails here; no title is blank.
    expect(Object.keys(categoryTitles).sort()).toStrictEqual(
      catalog.categories.map((category) => category.name).sort()
    )
    expect(Object.values(categoryTitles).filter((title) => title.trim() === '')).toStrictEqual([])
  })
})

describe('the search over the real set', () => {
  it('finds the icon a Portuguese word names, with or without its accents', () => {
    // Scenario: the founder's examples: "lixeira" is trash, "engrenagem" and
    // "configurações" (typed with or without accents) are settings, "início" is home.
    expect(top('lixeira')).toStrictEqual(['trash'])
    expect(top('engrenagem')).toStrictEqual(['settings'])
    expect(top('configurações')).toStrictEqual(['settings'])
    expect(top('configuracoes')).toStrictEqual(['settings'])
    expect(top('inicio')).toStrictEqual(['home'])
  })

  it('finds an icon by its alias, a misspelling, its category and its type', () => {
    // Scenario: trash's label ("delete"), a typo of settings, the security category and the
    // filled type, which finds every filled drawing.
    expect(top('delete')).toStrictEqual(['trash'])
    expect(top('setings')).toContain('settings')
    expect(all('security')).toContain('lock')
    expect(all('seguranca')).toContain('lock')
    expect(search(docs, 'filled', { types: [], categories: [] }).length).toBe(
      catalog.entries.filter((entry) => entry.drawings.some((d) => d.variant === 'filled')).length
    )
  })

  it('ranks a renamed icon first by its name and by its old name', () => {
    // Scenario: the icon `shapes` shares its name with the `shapes` category, whose every icon
    // matches the word too, and each renamed icon is still found by the name it replaced.
    expect(top('shapes')).toStrictEqual(['shapes'])
    expect(top('formas')).toStrictEqual(['shapes'])
    expect(top('variations')).toStrictEqual(['shapes'])
    expect(top('accent')).toStrictEqual(['droplet'])
    expect(top('agent')).toStrictEqual(['robot'])
    expect(top('plan')).toStrictEqual(['stairs'])
    expect(top('spending cap')).toStrictEqual(['speedometer'])
    expect(top('sort')).toStrictEqual(['arrow-up-down'])
  })
})
