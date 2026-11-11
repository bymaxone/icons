/**
 * Unit tests for the icon lint as one call.
 *
 * Layer: unit, on in-memory sources and on the repository's own directories.
 * Goal: pin the file-name rule and the strays, the metadata parse and schema dispatch,
 * the categories file, the multicolour exception's link to the metadata, and the icon set
 * built from what passed; prove the repository and its fixtures lint clean.
 * Mocks: none.
 */

import {
  brandMeta,
  CATEGORIES_TEXT,
  CIRCLE,
  drawing,
  iconMeta,
  ONE_ICON,
  REPO_ROOT,
  sources
} from './__tests__/support.ts'
import type { SourceTree } from './__tests__/support.ts'
import { lintSources } from './lint.ts'
import type { RuleId } from './lint-issue.ts'
import { readSources } from './sources.ts'

const LINE = drawing('line', CIRCLE)
const BRAND = drawing('brands', '<path d="M4 4h16v16H4z"/>')

const issuesOf = (tree: SourceTree, rule: RuleId) =>
  lintSources(sources(tree)).issues.filter((issue) => issue.rule === rule)

const categories = (text: string) =>
  lintSources(
    sources(ONE_ICON, {
      categories: { fileName: 'categories.json', path: 'categories.json', text }
    })
  ).issues

describe('lintSources: file-name', () => {
  it.each([
    ['line', 'Ring.svg', '.svg'],
    ['filled', 'ring_2.svg', '.svg'],
    ['sm', 'ring.png', '.svg'],
    ['brands', '-acme.svg', '.svg'],
    ['meta', 'ring.JSON', '.json'],
    ['meta', 'ring.svg', '.json']
  ] as const)('reports %s/%s', (directory, fileName, extension) => {
    /**
     * Scenario: a file name is the icon name in kebab-case with its directory's extension;
     * anything else is reported and not read further.
     */
    expect(issuesOf({ [directory]: { [fileName]: '<svg/>' } }, 'file-name')).toStrictEqual([
      {
        file: `icons/${directory}/${fileName}`,
        rule: 'file-name',
        message: `file names are kebab-case and end in ${extension}`
      }
    ])
  })

  it('reports every stray of the icons directory', () => {
    /**
     * Scenario: whatever the reader found outside the layout is an issue, so nothing is
     * silently left out of the outputs.
     */
    const result = lintSources(sources({}, { strays: ['icons/notes.txt', 'icons/line/nested'] }))
    const message =
      'not part of the icons layout: icons/{line,filled,sm,brands,meta}/ and README.md'
    expect(result.issues).toStrictEqual([
      { file: 'icons/notes.txt', rule: 'file-name', message },
      { file: 'icons/line/nested', rule: 'file-name', message }
    ])
  })

  it('reads a well-named file and leaves a misnamed one out of the set', () => {
    /**
     * Scenario: only files that pass the name rule are paired with metadata and built.
     */
    const result = lintSources(
      sources({ line: { 'ring.svg': LINE, 'Ring.svg': LINE }, meta: { 'ring.json': iconMeta() } })
    )
    expect(result.set.icons.map((icon) => icon.name)).toStrictEqual(['ring'])
  })
})

describe('lintSources: meta-json and meta-schema', () => {
  it('reports a metadata file that is not JSON', () => {
    /**
     * Scenario: the parser's message points at the broken position.
     */
    expect(
      issuesOf({ line: { 'ring.svg': LINE }, meta: { 'ring.json': '{"tags":' } }, 'meta-json')
    ).toStrictEqual([
      {
        file: 'icons/meta/ring.json',
        rule: 'meta-json',
        message: expect.stringMatching(/^SyntaxError: /)
      }
    ])
  })

  it.each([
    ['an unknown $schema', JSON.stringify({ $schema: 'x.json' })],
    ['no $schema', JSON.stringify({ tags: ['a'] })],
    ['an array', '[]'],
    ['null', 'null'],
    ['a string', '"ring"']
  ])('reports %s', (_label, text) => {
    /**
     * Scenario: `$schema` decides whether a file is an icon or a brand; a file that names
     * neither schema is refused before validation.
     */
    expect(issuesOf({ meta: { 'ring.json': text } }, 'meta-schema')).toStrictEqual([
      {
        file: 'icons/meta/ring.json',
        rule: 'meta-schema',
        message:
          '$schema must be "../../schemas/icon.schema.json" or "../../schemas/brand.schema.json"'
      }
    ])
  })

  it('validates an icon file against the icon schema, one issue per error', () => {
    /**
     * Scenario: every schema error is reported, located in the file.
     */
    const text = iconMeta({ tags: [], useCases: ['one'] })
    expect(
      issuesOf({ line: { 'ring.svg': LINE }, meta: { 'ring.json': text } }, 'meta-schema')
    ).toStrictEqual([
      {
        file: 'icons/meta/ring.json',
        rule: 'meta-schema',
        message: '/tags must NOT have fewer than 1 items'
      },
      {
        file: 'icons/meta/ring.json',
        rule: 'meta-schema',
        message: '/useCases must NOT have fewer than 2 items'
      }
    ])
  })

  it('validates a brand file against the brand schema', () => {
    /**
     * Scenario: a brand's provenance fields are required.
     */
    const text = brandMeta({ license: undefined, source: 'ftp://x' })
    expect(
      issuesOf({ brands: { 'acme.svg': BRAND }, meta: { 'acme.json': text } }, 'meta-schema')
    ).toStrictEqual([
      {
        file: 'icons/meta/acme.json',
        rule: 'meta-schema',
        message: "/ must have required property 'license'"
      },
      {
        file: 'icons/meta/acme.json',
        rule: 'meta-schema',
        message: '/source must match pattern "^https://\\S+$"'
      }
    ])
  })

  it('leaves an icon or a brand whose metadata is invalid out of the set', () => {
    /**
     * Scenario: the outputs are written only from valid metadata.
     */
    const tree: SourceTree = {
      line: { 'ring.svg': LINE },
      brands: { 'acme.svg': BRAND },
      meta: { 'ring.json': iconMeta({ tags: [] }), 'acme.json': brandMeta({ title: '' }) }
    }
    const { set } = lintSources(sources(tree))
    expect(set.icons).toStrictEqual([])
    expect(set.brands).toStrictEqual([])
  })
})

describe('lintSources: categories.json', () => {
  it('accepts the repository categories', () => {
    /**
     * Scenario: the committed list is valid and every name in it is unique.
     */
    expect(categories(CATEGORIES_TEXT)).toStrictEqual([])
  })

  it('reports a categories file that is not JSON, and treats every category as unknown', () => {
    /**
     * Scenario: with no readable list, no category an icon names can be checked against
     * it, so each is reported.
     */
    expect(categories('{')).toStrictEqual([
      {
        file: 'categories.json',
        rule: 'category',
        message: expect.stringMatching(/^SyntaxError: /)
      },
      {
        file: 'icons/meta/ring.json',
        rule: 'category',
        message: 'the category system is not in categories.json'
      }
    ])
  })

  it('reports a categories file that does not match its schema', () => {
    /**
     * Scenario: each schema error is one issue on categories.json.
     */
    const text = JSON.stringify({
      $schema: './schemas/category.schema.json',
      categories: [{ name: 'system' }]
    })
    expect(categories(text)[0]).toStrictEqual({
      file: 'categories.json',
      rule: 'category',
      message: "/categories/0 must have required property 'title'"
    })
  })

  it('reports a category listed more than once, once', () => {
    /**
     * Scenario: a category name is a key; a repeated one is reported once however many
     * times it repeats.
     */
    const text = JSON.stringify({
      $schema: './schemas/category.schema.json',
      categories: [
        { name: 'system', title: 'System' },
        { name: 'status', title: 'Status' },
        { name: 'system', title: 'System again' },
        { name: 'system', title: 'System thrice' }
      ]
    })
    expect(categories(text)).toStrictEqual([
      {
        file: 'categories.json',
        rule: 'category',
        message: 'the category system is listed more than once'
      }
    ])
  })
})

describe('lintSources: the multicolour exception', () => {
  const COLOURED = drawing('brands', '<path d="M4 4h16v16H4z" fill="#4285f4"/>')

  it('allows brand colours only when the brand metadata says multicolor', () => {
    /**
     * Scenario: the exception belongs to the mark, so it is read from the mark's own
     * metadata; without it the same drawing must be monochrome.
     */
    const tree = (multicolor: boolean | undefined): SourceTree => ({
      brands: { 'acme.svg': COLOURED },
      meta: { 'acme.json': brandMeta(multicolor === undefined ? {} : { multicolor }) }
    })
    expect(issuesOf(tree(true), 'svg-fill')).toStrictEqual([])
    expect(issuesOf(tree(false), 'svg-fill')).toHaveLength(1)
    expect(issuesOf(tree(undefined), 'svg-fill')).toHaveLength(1)
  })

  it('does not extend the exception to a non-brand drawing of the same name', () => {
    /**
     * Scenario: a multicolour brand's name on a filled drawing is still held to
     * currentColor.
     */
    const tree: SourceTree = {
      brands: { 'acme.svg': COLOURED },
      filled: { 'acme.svg': drawing('filled', '<path d="M4 4h16v16H4z" fill="#4285f4"/>') },
      meta: { 'acme.json': brandMeta({ multicolor: true }) }
    }
    expect(issuesOf(tree, 'svg-fill').map((issue) => issue.file)).toStrictEqual([
      'icons/filled/acme.svg'
    ])
  })
})

describe('lintSources: the icon set', () => {
  it('builds every icon and brand in name order, with its drawings and metadata path', () => {
    /**
     * Scenario: the outputs are written from this set, so it holds each icon once, sorted,
     * with the drawing of each variant and the file its metadata came from.
     */
    const tree: SourceTree = {
      line: { 'zeta.svg': LINE, 'alpha.svg': LINE },
      filled: { 'alpha.svg': drawing('filled', CIRCLE) },
      brands: { 'beta.svg': BRAND, 'acme.svg': BRAND },
      meta: {
        'zeta.json': iconMeta(),
        'alpha.json': iconMeta({ variants: ['line', 'filled'] }),
        'beta.json': brandMeta(),
        'acme.json': brandMeta()
      }
    }
    const { issues, set } = lintSources(sources(tree))
    expect(issues).toStrictEqual([])
    expect(set.icons.map((icon) => [icon.name, icon.metaPath])).toStrictEqual([
      ['alpha', 'icons/meta/alpha.json'],
      ['zeta', 'icons/meta/zeta.json']
    ])
    const [alpha] = set.icons
    expect(alpha?.drawings).toStrictEqual({
      line: {
        path: 'icons/line/alpha.svg',
        text: LINE,
        elements: [{ tag: 'circle', attributes: { cx: '12', cy: '12', r: '7.25' } }]
      },
      filled: {
        path: 'icons/filled/alpha.svg',
        text: drawing('filled', CIRCLE),
        elements: [{ tag: 'circle', attributes: { cx: '12', cy: '12', r: '7.25' } }]
      },
      sm: undefined
    })
    expect(alpha?.meta).toStrictEqual(JSON.parse(iconMeta({ variants: ['line', 'filled'] })))
    expect(
      set.brands.map((brand) => [brand.name, brand.metaPath, brand.drawing.path])
    ).toStrictEqual([
      ['acme', 'icons/meta/acme.json', 'icons/brands/acme.svg'],
      ['beta', 'icons/meta/beta.json', 'icons/brands/beta.svg']
    ])
    expect(set.categories.map((category) => category.name)).toContain('system')
  })

  it('leaves out a brand whose drawing does not parse, and keeps the icon whose line does not', () => {
    /**
     * Scenario: a brand without a drawing cannot be built; an icon is kept with its
     * missing drawing absent, and its issue blocks the generation.
     */
    const tree: SourceTree = {
      line: { 'ring.svg': '<svg>' },
      brands: { 'acme.svg': '<svg>' },
      meta: { 'ring.json': iconMeta(), 'acme.json': brandMeta() }
    }
    const { issues, set } = lintSources(sources(tree))
    expect(issues.map((issue) => issue.rule)).toStrictEqual(['svg-parse', 'svg-parse'])
    expect(set.brands).toStrictEqual([])
    expect(set.icons.map((icon) => icon.drawings.line)).toStrictEqual([undefined])
  })
})

describe('lintSources: the repository', () => {
  it.each(['icons', 'fixtures/icons'])('finds no issue in %s', (icons) => {
    /**
     * Scenario: the committed sources and the test fixtures are clean, so `pnpm lint:icons`
     * and the fixture build start green.
     */
    expect(lintSources(readSources({ root: REPO_ROOT, icons })).issues).toStrictEqual([])
  })
})

describe('lintSources: svg-ink', () => {
  /** Thirteen strokes across the live area: a drawing far over the ink ceiling. */
  const HEAVY = Array.from(
    { length: 13 },
    (_, k) => `<path d="M2.75 ${2.75 + 1.5 * k}h18.5"/>`
  ).join('')

  it('reports a line drawing over the ink ceiling', () => {
    /**
     * Scenario: a drawing that passes every rule of its own file is measured, and one that
     * covers far more than 21.5% of the canvas is reported against the rule.
     */
    const issues = issuesOf(
      { line: { 'ring.svg': drawing('line', HEAVY) }, meta: { 'ring.json': iconMeta() } },
      'svg-ink'
    )
    expect(issues).toHaveLength(1)
    expect(issues[0]?.file).toBe('icons/line/ring.svg')
  })

  it('does not measure a drawing that fails a rule of its own file', () => {
    /**
     * Scenario: a drawing with another issue may not render, so its ink is not measured; only
     * its own issue is reported. A sound drawing under the ceiling raises nothing.
     */
    const flawed = drawing('line', HEAVY).replace('<path ', '<path transform="scale(1)" ')
    const tree = { line: { 'ring.svg': flawed }, meta: { 'ring.json': iconMeta() } }
    expect(issuesOf(tree, 'svg-ink')).toStrictEqual([])
    expect(issuesOf(tree, 'svg-attribute').length).toBeGreaterThan(0)
    expect(issuesOf(ONE_ICON, 'svg-ink')).toStrictEqual([])
  })
})
