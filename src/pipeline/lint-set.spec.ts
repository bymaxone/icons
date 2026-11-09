/**
 * Unit tests for the rules that read the sources as a set.
 *
 * Layer: unit, through `lintSources` on in-memory sources.
 * Goal: one failing fixture per set rule of spec section 12 (every drawing has metadata
 * and the reverse, declared variants exist, brand names only in brands, categories exist,
 * alias and name uniqueness, component-name uniqueness), each asserted as the exact issue.
 * Mocks: none.
 */

import { brandMeta, CIRCLE, drawing, iconMeta, ONE_ICON, sources } from './__tests__/support.ts'
import type { SourceTree } from './__tests__/support.ts'
import { lintSources } from './lint.ts'
import type { RuleId } from './lint-issue.ts'

const LINE = drawing('line', CIRCLE)
const FILLED = drawing('filled', CIRCLE)
const SM = drawing('sm', CIRCLE)
const BRAND = drawing('brands', '<path d="M4 4h16v16H4z"/>')

/** The issues of one rule, for a source tree. */
const issuesOf = (tree: SourceTree, rule: RuleId) =>
  lintSources(sources(tree)).issues.filter((issue) => issue.rule === rule)

describe('a valid set', () => {
  it('reports nothing for icons with every variant, aliases and a brand', () => {
    /**
     * Scenario: the set rules accept a set that uses every feature they govern.
     */
    const tree: SourceTree = {
      line: { 'ring.svg': LINE, 'dot.svg': LINE },
      filled: { 'ring.svg': FILLED },
      sm: { 'ring.svg': SM },
      brands: { 'acme.svg': BRAND },
      meta: {
        'ring.json': iconMeta({
          variants: ['line', 'filled', 'sm'],
          opticalSizes: [24, 16],
          aliases: [{ name: 'circle', deprecated: false }]
        }),
        'dot.json': iconMeta({ categories: ['status', 'system'] }),
        'acme.json': brandMeta({ aliases: [{ name: 'acme-logo', deprecated: false }] })
      }
    }
    expect(lintSources(sources(tree)).issues).toStrictEqual([])
  })
})

describe('meta-pair', () => {
  it.each([
    ['line', 'icons/line/ring.svg'],
    ['filled', 'icons/filled/ring.svg'],
    ['sm', 'icons/sm/ring.svg'],
    ['brands', 'icons/brands/ring.svg']
  ] as const)('reports a %s drawing with no metadata file', (kind, path) => {
    /**
     * Scenario: every SVG needs its `icons/meta/<name>.json`, whichever directory it is in.
     */
    expect(issuesOf({ [kind]: { 'ring.svg': drawing(kind, CIRCLE) } }, 'meta-pair')).toStrictEqual([
      { file: path, rule: 'meta-pair', message: 'no metadata file icons/meta/ring.json' }
    ])
  })

  it('reports an icon metadata file with no line drawing', () => {
    /**
     * Scenario: the line master is the source of every icon; metadata alone is nothing.
     */
    expect(issuesOf({ meta: { 'ring.json': iconMeta() } }, 'meta-pair')).toStrictEqual([
      { file: 'icons/meta/ring.json', rule: 'meta-pair', message: 'no drawing icons/line/ring.svg' }
    ])
  })

  it('reports a brand metadata file with no brand drawing', () => {
    /**
     * Scenario: a brand's drawing lives in icons/brands.
     */
    expect(issuesOf({ meta: { 'acme.json': brandMeta() } }, 'meta-pair')).toStrictEqual([
      {
        file: 'icons/meta/acme.json',
        rule: 'meta-pair',
        message: 'no drawing icons/brands/acme.svg'
      }
    ])
  })
})

describe('brand-scope', () => {
  it.each(['line', 'filled', 'sm'] as const)('reports a brand name in icons/%s', (kind) => {
    /**
     * Scenario: brand names appear only in icons/brands (spec section 12); a line,
     * filled or 16 px drawing under a brand's name is a restyled logo.
     */
    const tree: SourceTree = {
      brands: { 'acme.svg': BRAND },
      [kind]: { 'acme.svg': drawing(kind, CIRCLE) },
      meta: { 'acme.json': brandMeta() }
    }
    expect(issuesOf(tree, 'brand-scope')).toStrictEqual([
      {
        file: `icons/${kind}/acme.svg`,
        rule: 'brand-scope',
        message: 'acme is a brand: its drawing belongs in icons/brands only'
      }
    ])
  })

  it('reports an icon name in icons/brands', () => {
    /**
     * Scenario: icons/brands holds brand marks only; a drawing there described by icon
     * metadata would ship as a brand.
     */
    const tree: SourceTree = { ...ONE_ICON, brands: { 'ring.svg': BRAND } }
    expect(issuesOf(tree, 'brand-scope')).toStrictEqual([
      {
        file: 'icons/brands/ring.svg',
        rule: 'brand-scope',
        message: 'ring is an icon, not a brand: icons/brands holds brand marks only'
      }
    ])
  })
})

describe('meta-variants', () => {
  it.each(['filled', 'sm'] as const)('reports a declared %s variant with no drawing', (variant) => {
    /**
     * Scenario: a variant listed in the metadata must exist as a file.
     */
    const meta = iconMeta({
      variants: ['line', variant],
      opticalSizes: variant === 'sm' ? [24, 16] : [24]
    })
    expect(
      issuesOf({ line: { 'ring.svg': LINE }, meta: { 'ring.json': meta } }, 'meta-variants')
    ).toStrictEqual([
      {
        file: 'icons/meta/ring.json',
        rule: 'meta-variants',
        message: `declares the ${variant} variant, but icons/${variant}/ring.svg does not exist`
      }
    ])
  })

  it.each([
    ['filled', FILLED],
    ['sm', SM]
  ] as const)('reports a %s drawing its metadata does not declare', (kind, text) => {
    /**
     * Scenario: a drawing that the metadata does not list would never be generated.
     */
    const tree: SourceTree = { ...ONE_ICON, [kind]: { 'ring.svg': text } }
    expect(issuesOf(tree, 'meta-variants')).toStrictEqual([
      {
        file: `icons/${kind}/ring.svg`,
        rule: 'meta-variants',
        message: 'is not declared in the variants of icons/meta/ring.json'
      }
    ])
  })

  it.each([
    ['16 without sm', { opticalSizes: [24, 16] }, {}],
    ['sm without 16', { variants: ['line', 'sm'] }, { sm: { 'ring.svg': SM } }]
  ])('reports opticalSizes with %s', (_label, overrides, extra) => {
    /**
     * Scenario: the 16 px master is the sm variant, so the two fields agree.
     */
    const tree: SourceTree = {
      line: { 'ring.svg': LINE },
      meta: { 'ring.json': iconMeta(overrides) },
      ...extra
    }
    expect(issuesOf(tree, 'meta-variants')).toStrictEqual([
      {
        file: 'icons/meta/ring.json',
        rule: 'meta-variants',
        message: 'opticalSizes lists 16 exactly when the sm variant is declared'
      }
    ])
  })
})

describe('category', () => {
  it('reports every category that is not in categories.json', () => {
    /**
     * Scenario: an icon may only name categories the list defines.
     */
    const tree: SourceTree = {
      line: { 'ring.svg': LINE },
      meta: { 'ring.json': iconMeta({ categories: ['system', 'weather', 'sports'] }) }
    }
    expect(issuesOf(tree, 'category')).toStrictEqual([
      {
        file: 'icons/meta/ring.json',
        rule: 'category',
        message: 'the category weather is not in categories.json'
      },
      {
        file: 'icons/meta/ring.json',
        rule: 'category',
        message: 'the category sports is not in categories.json'
      }
    ])
  })
})

describe('name-unique', () => {
  it('reports an alias that is another icon name, on both files', () => {
    /**
     * Scenario: an alias exports the same components under another name, so it must not
     * be a name already published (spec section 12).
     */
    const tree: SourceTree = {
      line: { 'ring.svg': LINE, 'dot.svg': LINE },
      meta: {
        'ring.json': iconMeta({ aliases: [{ name: 'dot', deprecated: false }] }),
        'dot.json': iconMeta()
      }
    }
    const message = 'the name dot is used by more than one icon, brand or alias'
    expect(issuesOf(tree, 'name-unique')).toStrictEqual([
      { file: 'icons/meta/ring.json', rule: 'name-unique', message },
      { file: 'icons/meta/dot.json', rule: 'name-unique', message }
    ])
  })

  it('reports an alias shared by an icon and a brand', () => {
    /**
     * Scenario: icons and brands share one namespace of names.
     */
    const tree: SourceTree = {
      ...ONE_ICON,
      brands: { 'acme.svg': BRAND },
      meta: {
        'ring.json': iconMeta({ aliases: [{ name: 'logo', deprecated: false }] }),
        'acme.json': brandMeta({ aliases: [{ name: 'logo', deprecated: false }] })
      }
    }
    const message = 'the name logo is used by more than one icon, brand or alias'
    expect(issuesOf(tree, 'name-unique')).toStrictEqual([
      { file: 'icons/meta/ring.json', rule: 'name-unique', message },
      { file: 'icons/meta/acme.json', rule: 'name-unique', message }
    ])
  })

  it('reports an alias equal to its own icon name, once', () => {
    /**
     * Scenario: one file claiming the same name twice is one issue on that file.
     */
    const tree: SourceTree = {
      line: { 'ring.svg': LINE },
      meta: { 'ring.json': iconMeta({ aliases: [{ name: 'ring', deprecated: false }] }) }
    }
    expect(issuesOf(tree, 'name-unique')).toStrictEqual([
      {
        file: 'icons/meta/ring.json',
        rule: 'name-unique',
        message: 'the name ring is used by more than one icon, brand or alias'
      }
    ])
  })

  it('reports distinct names that export the same component', () => {
    /**
     * Scenario: `ring-filled` (a line icon) and the filled variant of `ring` would both be
     * `RingFilledIcon`; `aspect-16-9` and `aspect-169` would both be `Aspect169Icon`.
     */
    const tree: SourceTree = {
      line: {
        'ring.svg': LINE,
        'ring-filled.svg': LINE,
        'aspect-16-9.svg': LINE,
        'aspect-169.svg': LINE
      },
      filled: { 'ring.svg': FILLED },
      meta: {
        'ring.json': iconMeta({ variants: ['line', 'filled'] }),
        'ring-filled.json': iconMeta(),
        'aspect-16-9.json': iconMeta(),
        'aspect-169.json': iconMeta()
      }
    }
    expect(issuesOf(tree, 'name-unique')).toStrictEqual([
      {
        file: 'icons/meta/ring.json',
        rule: 'name-unique',
        message: 'the component name RingFilledIcon is exported more than once'
      },
      {
        file: 'icons/meta/ring-filled.json',
        rule: 'name-unique',
        message: 'the component name RingFilledIcon is exported more than once'
      },
      {
        file: 'icons/meta/aspect-16-9.json',
        rule: 'name-unique',
        message: 'the component name Aspect169Icon is exported more than once'
      },
      {
        file: 'icons/meta/aspect-169.json',
        rule: 'name-unique',
        message: 'the component name Aspect169Icon is exported more than once'
      }
    ])
  })

  it('reports a brand component that collides with an icon named like a brand variant', () => {
    /**
     * Scenario: an icon named `acme-brand` would export `AcmeBrandIcon`, the component
     * and the class name of the brand `acme`.
     */
    const tree: SourceTree = {
      line: { 'acme-brand.svg': LINE },
      brands: { 'acme.svg': BRAND },
      meta: { 'acme-brand.json': iconMeta(), 'acme.json': brandMeta() }
    }
    expect(issuesOf(tree, 'name-unique').map((issue) => issue.message)).toStrictEqual([
      'the component name AcmeBrandIcon is exported more than once',
      'the component name AcmeBrandIcon is exported more than once'
    ])
  })
})
