/**
 * Unit tests for the data the generator writes.
 *
 * Layer: unit, on a set built from in-memory sources.
 * Goal: pin the published metadata records (no `$schema`, every optional list present, a
 * fixed key order), the `./meta` data module, the sprite (which holds no flag) and the static
 * file list.
 * Mocks: none.
 */

import {
  BANDS,
  brandMeta,
  drawing,
  flagDrawing,
  flagMeta,
  iconMeta,
  sources
} from './__tests__/support.ts'
import { metadataModule, metadataRecords, sprite, staticFiles } from './emit-data.ts'
import { lintSources } from './lint.ts'

const RING = drawing('line', '<circle cx="12" cy="12" r="7.25"/>')
const RING_FILLED = drawing('filled', '<circle cx="12" cy="12" r="8"/>')
const RING_SM = drawing('sm', '<circle cx="12" cy="12" r="6"/>')
const ACME = drawing('brands', '<polygon points="12 3 21 21 3 21"/>')
const SE_FLAG = flagDrawing(BANDS)

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
      flags: { 'se-flag.svg': SE_FLAG, 'no-flag.svg': SE_FLAG },
      meta: {
        'no-flag.json': flagMeta({ title: 'Norway', code: 'NO' }),
        'se-flag.json': JSON.stringify(
          Object.fromEntries(
            Object.entries(JSON.parse(flagMeta({ tags: ['sweden'] })) as object).reverse()
          )
        ),
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
  label: 'Ring',
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
    expect(JSON.stringify(records.flags)).toBe(
      JSON.stringify({
        'no-flag': {
          title: 'Norway',
          code: 'NO',
          source: 'https://example.com/flags/SE.svg',
          license: 'MIT',
          retrievedAt: '2026-11-15',
          tags: [],
          since: '1.0.0'
        },
        'se-flag': {
          title: 'Sweden',
          code: 'SE',
          source: 'https://example.com/flags/SE.svg',
          license: 'MIT',
          retrievedAt: '2026-11-15',
          tags: ['sweden'],
          since: '1.0.0'
        }
      })
    )
    expect(records.categories[0]).toStrictEqual({ name: 'arrows', title: 'Arrows' })
    expect(records.categories).toHaveLength(32)
  })
})

describe('metadataModule', () => {
  it('writes the records as as-const data with no import', () => {
    /**
     * Scenario: `./meta` loads without React or any module; the names, the categories
     * and the records are literal data the typed module gives their types.
     */
    const empty = metadataModule({
      icons: [],
      brands: [],
      flags: [],
      categories: [{ name: 'a', title: 'A' }]
    })
    expect(empty).toBe(
      [
        '/**',
        ' * @fileoverview The metadata of every icon, brand mark and country flag, as data.',
        ' * Written by `pnpm generate` from icons/meta and categories.json: edit the sources, never this file.',
        ' * @layer Generated',
        ' */',
        '',
        '/** Every icon name, in name order. */\nexport const ICON_NAMES = [] as const\n',
        '/** Every brand name, in name order. */\nexport const BRAND_NAMES = [] as const\n',
        '/** Every flag name, in name order. */\nexport const FLAG_NAMES = [] as const\n',
        '/** Every category name, in the order of categories.json. */\nexport const CATEGORY_NAMES = ["a"] as const\n',
        '/** The categories, in the order of categories.json. */\nexport const CATEGORIES = [{"name":"a","title":"A"}] as const\n',
        '/** The metadata of every icon, keyed by name. */\n// prettier-ignore\nexport const ICONS = {} as const\n',
        '/** The metadata of every brand mark, keyed by name. */\n// prettier-ignore\nexport const BRANDS = {} as const\n',
        '/** The metadata of every country flag, keyed by name. */\n// prettier-ignore\nexport const FLAGS = {} as const\n'
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
    expect(text).toContain('export const FLAG_NAMES = ["no-flag","se-flag"] as const\n')
    const keyed = (records: Record<string, unknown>): string =>
      `{\n${Object.entries(records)
        .map(([key, record]) => `  ${JSON.stringify(key)}: ${JSON.stringify(record)},\n`)
        .join('')}}`
    expect(text).toContain(
      `// prettier-ignore\nexport const ICONS = ${keyed(records.icons)} as const\n`
    )
    expect(text).toContain(
      `// prettier-ignore\nexport const BRANDS = ${keyed(records.brands)} as const\n`
    )
    expect(text).toContain(
      `// prettier-ignore\nexport const FLAGS = ${keyed(records.flags)} as const\n`
    )
  })

  it('writes one record per line, so the module grows by a line per icon', () => {
    /**
     * Scenario: the generated module stays under the repository's file-length limit at the
     * size of the full set; each record is one line, whatever its tags and use cases hold.
     */
    const text = metadataModule(build().set)
    const icons = text.slice(
      text.indexOf('export const ICONS'),
      text.indexOf('/** The metadata of every brand')
    )
    expect(icons.trimEnd().split('\n')).toHaveLength(
      2 + Object.keys(metadataRecords(build().set).icons).length
    )
    expect(icons).toMatch(
      /^export const ICONS = \{\n {2}"dot": \{.*\},\n {2}"ring": \{.*\},\n\} as const\n/
    )
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
    const SM = STROKE.replace('stroke-width="1.5"', 'stroke-width="2.25"')
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
        `  <symbol id="bx-ring-sm" ${SM}>`,
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
    expect(sprite({ icons: [], brands: [], flags: [], categories: [] })).toBe(
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
      'svg/flags/no-flag.svg',
      'svg/flags/se-flag.svg',
      'sprite.svg',
      'metadata.json'
    ])
    expect(files.get('svg/line/ring.svg')).toBe(RING)
    expect(files.get('svg/filled/ring.svg')).toBe(RING_FILLED)
    expect(files.get('svg/sm/ring.svg')).toBe(RING_SM)
    expect(files.get('svg/brands/acme.svg')).toBe(ACME)
    expect(files.get('svg/flags/se-flag.svg')).toBe(SE_FLAG)
    expect(files.get('sprite.svg')).toBe(sprite(build().set))
    expect(files.get('metadata.json')).toBe(
      `${JSON.stringify(metadataRecords(build().set), null, 2)}\n`
    )
  })
})
