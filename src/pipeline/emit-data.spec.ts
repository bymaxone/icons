/**
 * Unit tests for the data the generator writes.
 *
 * Layer: unit, on a set built from in-memory sources.
 * Goal: pin the published metadata records (no `$schema`, every optional list present, a
 * fixed key order), the `./meta` data module, the sprite and the static file list.
 * Mocks: none.
 */

import { brandMeta, drawing, iconMeta, sources } from './__tests__/support.ts'
import { metadataModule, metadataRecords, sprite, staticFiles } from './emit-data.ts'
import { lintSources } from './lint.ts'

const RING = drawing('line', '<circle cx="12" cy="12" r="7.25"/>')
const RING_FILLED = drawing('filled', '<circle cx="12" cy="12" r="8"/>')
const RING_SM = drawing('sm', '<circle cx="12" cy="12" r="6"/>')
const ACME = drawing('brands', '<polygon points="12 3 21 21 3 21"/>')

/** The source JSON written with its keys in an order the outputs must not follow. */
const reordered = (text: string): string =>
  JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(text) as object).reverse()))

let built: ReturnType<typeof lintSources> | undefined
/** Built on first use rather than at load, so a fault fails tests instead of the file. */
const build = (): ReturnType<typeof lintSources> =>
  (built ??= lintSources(
    sources({
      line: { 'ring.svg': RING, 'dot.svg': RING },
      filled: { 'ring.svg': RING_FILLED },
      sm: { 'ring.svg': RING_SM },
      brands: { 'acme.svg': ACME, 'beta.svg': ACME },
      meta: {
        'ring.json': reordered(
          iconMeta({
            variants: ['line', 'filled', 'sm'],
            opticalSizes: [24, 16],
            aliases: [
              { deprecated: false, name: 'circle' },
              {
                toBeRemovedInVersion: '2.0.0',
                deprecated: true,
                name: 'old-ring',
                deprecationReason: 'Renamed.'
              },
              { toBeRemovedInVersion: '3.0.0', name: 'older-ring', deprecated: true }
            ]
          })
        ),
        'dot.json': iconMeta(),
        'acme.json': reordered(
          brandMeta({
            multicolor: true,
            tags: ['a'],
            aliases: [{ name: 'acme-logo', deprecated: false }]
          })
        ),
        'beta.json': brandMeta({ title: 'Beta' })
      }
    })
  ))

const RING_RECORD = {
  tags: ['circle'],
  categories: ['system'],
  useCases: ['First use', 'Second use'],
  aliases: [
    { name: 'circle', deprecated: false },
    {
      name: 'old-ring',
      deprecated: true,
      deprecationReason: 'Renamed.',
      toBeRemovedInVersion: '2.0.0'
    },
    { name: 'older-ring', deprecated: true, toBeRemovedInVersion: '3.0.0' }
  ],
  variants: ['line', 'filled', 'sm'],
  opticalSizes: [24, 16],
  since: '1.0.0'
}

const BRAND_BASE = {
  source: 'https://example.com/acme',
  guidelines: 'https://example.com/acme/brand',
  license: 'CC0-1.0',
  retrievedAt: '2026-11-08'
}

describe('metadataRecords', () => {
  it('publishes each record without $schema, defaults filled in, keys in a fixed order', () => {
    /**
     * Scenario: a consumer reads the same fields for every icon and every brand, whatever
     * the source file left out and in whatever order it wrote its keys.
     */
    expect(build().issues).toStrictEqual([])
    const records = metadataRecords(build().set)
    expect(JSON.stringify(records.icons)).toBe(
      JSON.stringify({
        dot: { ...RING_RECORD, aliases: [], variants: ['line'], opticalSizes: [24] },
        ring: RING_RECORD
      })
    )
    expect(JSON.stringify(records.brands)).toBe(
      JSON.stringify({
        acme: {
          title: 'Acme',
          ...BRAND_BASE,
          tags: ['a'],
          aliases: [{ name: 'acme-logo', deprecated: false }],
          multicolor: true,
          since: '1.0.0'
        },
        beta: {
          title: 'Beta',
          ...BRAND_BASE,
          tags: [],
          aliases: [],
          multicolor: false,
          since: '1.0.0'
        }
      })
    )
    expect(records.categories[0]).toStrictEqual({ name: 'navigation', title: 'Navigation' })
    expect(records.categories).toHaveLength(12)
  })
})

describe('metadataModule', () => {
  it('writes the records as as-const data with no import', () => {
    /**
     * Scenario: `./meta` loads without React or any module; the names, the categories
     * and the records are literal data the typed module gives their types.
     */
    const empty = metadataModule({ icons: [], brands: [], categories: [{ name: 'a', title: 'A' }] })
    expect(empty).toBe(
      [
        '/**',
        ' * @fileoverview The metadata of every icon and brand mark, as data.',
        ' * Written by `pnpm generate` from icons/meta and categories.json: edit the sources, never this file.',
        ' * @layer Generated',
        ' */',
        '',
        '/** Every icon name, in name order. */\nexport const ICON_NAMES = [] as const\n',
        '/** Every brand name, in name order. */\nexport const BRAND_NAMES = [] as const\n',
        '/** Every category name, in the order of categories.json. */\nexport const CATEGORY_NAMES = ["a"] as const\n',
        '/** The categories, in the order of categories.json. */\nexport const CATEGORIES = [{"name":"a","title":"A"}] as const\n',
        '/** The metadata of every icon, keyed by name. */\nexport const ICONS = {} as const\n',
        '/** The metadata of every brand mark, keyed by name. */\nexport const BRANDS = {} as const\n'
      ].join('\n')
    )
  })

  it('lists the names in name order and holds the same records as metadata.json', () => {
    /**
     * Scenario: `./meta` and `metadata.json` describe the same set.
     */
    const text = metadataModule(build().set)
    const records = metadataRecords(build().set)
    expect(text).toContain('export const ICON_NAMES = ["dot","ring"] as const\n')
    expect(text).toContain('export const BRAND_NAMES = ["acme","beta"] as const\n')
    expect(text).toContain(`export const ICONS = ${JSON.stringify(records.icons)} as const\n`)
    expect(text).toContain(`export const BRANDS = ${JSON.stringify(records.brands)} as const\n`)
  })
})

describe('sprite', () => {
  it('writes one symbol per drawing, icons with their variants first, then brands', () => {
    /**
     * Scenario: `<use href="sprite.svg#bx-ring-filled">` finds the filled ring; each
     * symbol carries its kind's paint and the grid's viewBox, with no document attribute.
     */
    const STROKE =
      'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"'
    const FILL = 'viewBox="0 0 24 24" fill="currentColor"'
    expect(sprite(build().set)).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg">',
        `  <symbol id="bx-dot" ${STROKE}>`,
        '    <circle cx="12" cy="12" r="7.25"/>',
        '  </symbol>',
        `  <symbol id="bx-ring" ${STROKE}>`,
        '    <circle cx="12" cy="12" r="7.25"/>',
        '  </symbol>',
        `  <symbol id="bx-ring-filled" ${FILL}>`,
        '    <circle cx="12" cy="12" r="8"/>',
        '  </symbol>',
        `  <symbol id="bx-ring-sm" ${STROKE}>`,
        '    <circle cx="12" cy="12" r="6"/>',
        '  </symbol>',
        `  <symbol id="bx-acme-brand" ${FILL}>`,
        '    <polygon points="12 3 21 21 3 21"/>',
        '  </symbol>',
        `  <symbol id="bx-beta-brand" ${FILL}>`,
        '    <polygon points="12 3 21 21 3 21"/>',
        '  </symbol>',
        '</svg>',
        ''
      ].join('\n')
    )
  })

  it('writes an empty sprite for an empty set', () => {
    /**
     * Scenario: `./sprite.svg` exists before the first drawing.
     */
    expect(sprite({ icons: [], brands: [], categories: [] })).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg">\n</svg>\n'
    )
  })
})

describe('staticFiles', () => {
  it('writes each raw SVG as its normalised source, the sprite and metadata.json', () => {
    /**
     * Scenario: `dist/svg/<kind>/<name>.svg` is the source file with the root attributes
     * applied, which the normalised source already is.
     */
    const files = staticFiles(build().set)
    expect([...files.keys()]).toStrictEqual([
      'svg/line/dot.svg',
      'svg/line/ring.svg',
      'svg/filled/ring.svg',
      'svg/sm/ring.svg',
      'svg/brands/acme.svg',
      'svg/brands/beta.svg',
      'sprite.svg',
      'metadata.json'
    ])
    expect(files.get('svg/line/ring.svg')).toBe(RING)
    expect(files.get('svg/filled/ring.svg')).toBe(RING_FILLED)
    expect(files.get('svg/sm/ring.svg')).toBe(RING_SM)
    expect(files.get('svg/brands/acme.svg')).toBe(ACME)
    expect(files.get('sprite.svg')).toBe(sprite(build().set))
    expect(files.get('metadata.json')).toBe(
      `${JSON.stringify(metadataRecords(build().set), null, 2)}\n`
    )
  })
})
