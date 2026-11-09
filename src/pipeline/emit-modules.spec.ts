/**
 * Unit tests for the TypeScript the generator writes.
 *
 * Layer: unit, on a set built from in-memory sources.
 * Goal: pin every generated module byte for byte before formatting: the drawing as an
 * element-list literal for `createIcon`, the paint, the aliases with `@deprecated`, the
 * per-icon entry, the root and brand barrels, and the empty barrels of a set with no icon.
 * Mocks: none.
 */

import { brandMeta, drawing, iconMeta, sources } from './__tests__/support.ts'
import { componentModules, GENERATED_DIRECTORIES, iconNodeLiteral } from './emit-modules.ts'
import { lintSources } from './lint.ts'

/**
 * Built on first use rather than at load, so a fault in the lint fails the tests that need
 * the set instead of the whole file.
 */
let built: ReturnType<typeof lintSources> | undefined
const build = (): ReturnType<typeof lintSources> =>
  (built ??= lintSources(
    sources({
      line: {
        'ring.svg': drawing(
          'line',
          '<circle cx="12" cy="12" r="7.25"/><circle cx="19" cy="5" r="1" fill="currentColor"/>'
        ),
        'dot.svg': drawing('line', '<path d="M4 12h16"/>')
      },
      filled: { 'ring.svg': drawing('filled', '<path d="M4 4h16v16H4z" fill-rule="evenodd"/>') },
      sm: { 'ring.svg': drawing('sm', '<line x1="4" y1="12" x2="20" y2="12"/>') },
      brands: {
        'acme.svg': drawing('brands', '<polygon points="12 3 21 21 3 21"/>'),
        'beta.svg': drawing('brands', '<rect width="16" height="16" x="4" y="4"/>')
      },
      meta: {
        'ring.json': iconMeta({
          tags: ['circle', 'end */ here'],
          variants: ['line', 'filled', 'sm'],
          opticalSizes: [24, 16],
          aliases: [
            { name: 'circle', deprecated: false },
            {
              name: 'old-ring',
              deprecated: true,
              deprecationReason: 'Renamed */ to ring.',
              toBeRemovedInVersion: '2.0.0'
            },
            { name: 'older-ring', deprecated: true, toBeRemovedInVersion: '3.0.0' }
          ]
        }),
        'dot.json': iconMeta({ since: '1.2.0' }),
        'beta.json': brandMeta({ title: 'Beta' }),
        'acme.json': brandMeta({
          title: 'Acme */ Co',
          aliases: [{ name: 'a-logo', deprecated: false }]
        })
      }
    })
  ))

const HEADER = (description: string, source: string): string =>
  `/**\n * @fileoverview ${description}\n * Written by \`pnpm generate\` from ${source}: edit the source, never this file.\n * @layer Generated\n */\n\n`

const IMPORT = "import { createIcon } from '@bymax-one/icons/runtime'\n\n"

const RING_DOC = (variant: string): string =>
  `/**\n * The \`ring\` icon, ${variant} variant: circle, end *\\/ here.\n *\n * @since 1.0.0\n */\n`

const RING_ALIASES = (variant: string, target: string): string =>
  `\n/** \`circle\`: an alias of {@link ${target}}. */\nexport const ${variant === 'line' ? 'Circle' : `Circle${variant === 'filled' ? 'Filled' : 'Sm'}`}Icon = ${target}\n` +
  `\n/** @deprecated \`old-ring\` is a deprecated alias of \`ring\`, removed in 2.0.0. Renamed *\\/ to ring. Use {@link ${target}}. */\nexport const ${variant === 'line' ? 'OldRing' : `OldRing${variant === 'filled' ? 'Filled' : 'Sm'}`}Icon = ${target}\n` +
  `\n/** @deprecated \`older-ring\` is a deprecated alias of \`ring\`, removed in 3.0.0. Use {@link ${target}}. */\nexport const ${variant === 'line' ? 'OlderRing' : `OlderRing${variant === 'filled' ? 'Filled' : 'Sm'}`}Icon = ${target}\n`

describe('iconNodeLiteral', () => {
  it('writes numbers as numbers and everything else as strings', () => {
    /**
     * Scenario: each numeric geometry attribute becomes a number literal; path data, points,
     * colours and the fill controls stay strings even when they look numeric, as do values
     * that are blank or not finite numbers.
     */
    expect(
      iconNodeLiteral([
        {
          tag: 'rect',
          attributes: { x: '.5', y: '-2', width: '50%', height: ' ', rx: 'Infinity' }
        },
        {
          tag: 'path',
          attributes: { d: '1', fill: '1', 'fill-rule': 'evenodd', 'clip-rule': 'nonzero' }
        },
        { tag: 'polygon', attributes: { points: '1 2 3' } },
        { tag: 'line', attributes: { x1: '1', y1: '2', x2: '3', y2: '4' } },
        { tag: 'ellipse', attributes: { cx: '5', cy: '6', rx: '7', ry: '3' } },
        { tag: 'circle', attributes: { r: '8', points: '9' } }
      ])
    ).toBe(
      '[["rect", { x: 0.5, y: -2, width: "50%", height: " ", rx: "Infinity" }], ' +
        '["path", { d: "1", fill: "1", fillRule: "evenodd", clipRule: "nonzero" }], ' +
        '["polygon", { points: "1 2 3" }], ' +
        '["line", { x1: 1, y1: 2, x2: 3, y2: 4 }], ' +
        '["ellipse", { cx: 5, cy: 6, rx: 7, ry: 3 }], ' +
        '["circle", { r: 8, points: "9" }]]'
    )
  })

  it('writes an empty drawing as an empty list', () => {
    /**
     * Scenario: nothing is invented for an element list with no element.
     */
    expect(iconNodeLiteral([])).toBe('[]')
  })
})

describe('componentModules', () => {
  let modules: Map<string, string>

  beforeAll(() => {
    modules = componentModules(build().set)
  })

  it('writes the barrels, one entry per icon, one module per variant and per brand', () => {
    /**
     * Scenario: the paths are the layout tsup and the export map read; only what is drawn
     * is written.
     */
    expect([...modules.keys()]).toStrictEqual([
      'src/icons/generated/index.ts',
      'src/brands/generated/index.ts',
      'src/icons/generated/dot/index.ts',
      'src/icons/generated/dot/line.ts',
      'src/icons/generated/ring/index.ts',
      'src/icons/generated/ring/line.ts',
      'src/icons/generated/ring/filled.ts',
      'src/icons/generated/ring/sm.ts',
      'src/brands/generated/acme.ts',
      'src/brands/generated/beta.ts'
    ])
    expect(build().issues).toStrictEqual([])
  })

  it('writes a line variant as one createIcon call over its drawing, with every alias', () => {
    /**
     * Scenario: the element list is data, annotated pure so a bundler drops an unused
     * icon; each alias is the same component, a deprecated one marked `@deprecated` with
     * its version and reason, and metadata text cannot close the JSDoc block.
     */
    expect(modules.get('src/icons/generated/ring/line.ts')).toBe(
      HEADER('The `ring` icon, line variant.', 'icons/line/ring.svg') +
        IMPORT +
        RING_DOC('line') +
        'export const RingIcon = /* @__PURE__ */ createIcon("ring", [["circle", { cx: 12, cy: 12, r: 7.25 }], ["circle", { cx: 19, cy: 5, r: 1, fill: "currentColor" }]])\n' +
        RING_ALIASES('line', 'RingIcon')
    )
  })

  it('paints a filled variant with fill and a 16 px master with stroke', () => {
    /**
     * Scenario: the filled variant passes `{ paint: 'fill' }`; the sm master is stroked
     * like the line icon and passes no option.
     */
    expect(modules.get('src/icons/generated/ring/filled.ts')).toBe(
      HEADER('The `ring` icon, filled variant.', 'icons/filled/ring.svg') +
        IMPORT +
        RING_DOC('filled') +
        'export const RingFilledIcon = /* @__PURE__ */ createIcon("ring-filled", [["path", { fillRule: "evenodd", d: "M4 4h16v16H4z" }]], { paint: \'fill\' })\n' +
        RING_ALIASES('filled', 'RingFilledIcon')
    )
    expect(modules.get('src/icons/generated/ring/sm.ts')).toBe(
      HEADER('The `ring` icon, sm variant.', 'icons/sm/ring.svg') +
        IMPORT +
        RING_DOC('sm') +
        'export const RingSmIcon = /* @__PURE__ */ createIcon("ring-sm", [["line", { x1: 4, x2: 20, y1: 12, y2: 12 }]])\n' +
        RING_ALIASES('sm', 'RingSmIcon')
    )
  })

  it('writes an icon without aliases as its component alone', () => {
    /**
     * Scenario: no alias, no extra export; the version comes from the metadata.
     */
    expect(modules.get('src/icons/generated/dot/line.ts')).toBe(
      HEADER('The `dot` icon, line variant.', 'icons/line/dot.svg') +
        IMPORT +
        '/**\n * The `dot` icon, line variant: circle.\n *\n * @since 1.2.0\n */\n' +
        'export const DotIcon = /* @__PURE__ */ createIcon("dot", [["path", { d: "M4 12h16" }]])\n'
    )
  })

  it('writes the per-icon entry as the exports of each drawn variant, sorted', () => {
    /**
     * Scenario: `./icons/<name>` holds every component of one icon; each variant module is
     * reached by a relative path, so it is bundled into that entry only.
     */
    expect(modules.get('src/icons/generated/ring/index.ts')).toBe(
      HEADER('Every component of the `ring` icon.', 'icons/meta/ring.json') +
        "export { CircleIcon, OldRingIcon, OlderRingIcon, RingIcon } from './line'\n" +
        "export { CircleFilledIcon, OldRingFilledIcon, OlderRingFilledIcon, RingFilledIcon } from './filled'\n" +
        "export { CircleSmIcon, OldRingSmIcon, OlderRingSmIcon, RingSmIcon } from './sm'\n"
    )
    expect(modules.get('src/icons/generated/dot/index.ts')).toBe(
      HEADER('Every component of the `dot` icon.', 'icons/meta/dot.json') +
        "export { DotIcon } from './line'\n"
    )
  })

  it('re-exports every icon from its own subpath in the root barrel', () => {
    /**
     * Scenario: the root reaches each icon by package specifier, so the published package
     * holds each icon once, in its `./icons/<name>` entry.
     */
    expect(modules.get('src/icons/generated/index.ts')).toBe(
      HEADER('The icon components the root entry re-exports.', 'icons/meta') +
        "export { DotIcon } from '@bymax-one/icons/icons/dot'\n" +
        "export { CircleFilledIcon, CircleIcon, CircleSmIcon, OldRingFilledIcon, OldRingIcon, OldRingSmIcon, OlderRingFilledIcon, OlderRingIcon, OlderRingSmIcon, RingFilledIcon, RingIcon, RingSmIcon } from '@bymax-one/icons/icons/ring'\n"
    )
  })

  it('writes a brand as a filled createIcon call with its provenance, and the brand barrel', () => {
    /**
     * Scenario: a brand mark is filled, names where its geometry came from and that it is
     * outside the MIT grant; its aliases are BrandIcon components too.
     */
    expect(modules.get('src/brands/generated/acme.ts')).toBe(
      HEADER('The Acme *\\/ Co brand mark.', 'icons/brands/acme.svg') +
        IMPORT +
        '/**\n * The Acme *\\/ Co brand mark, from https://example.com/acme (CC0-1.0, retrieved 2026-11-08).\n' +
        ' * The mark belongs to its owner and is not covered by the MIT grant; see TRADEMARKS.md and https://example.com/acme/brand.\n' +
        ' *\n * @since 1.0.0\n */\n' +
        'export const AcmeBrandIcon = /* @__PURE__ */ createIcon("acme-brand", [["polygon", { points: "12 3 21 21 3 21" }]], { paint: \'fill\' })\n' +
        '\n/** `a-logo`: an alias of {@link AcmeBrandIcon}. */\nexport const ALogoBrandIcon = AcmeBrandIcon\n'
    )
    expect(modules.get('src/brands/generated/beta.ts')).toBe(
      HEADER('The Beta brand mark.', 'icons/brands/beta.svg') +
        IMPORT +
        '/**\n * The Beta brand mark, from https://example.com/acme (CC0-1.0, retrieved 2026-11-08).\n' +
        ' * The mark belongs to its owner and is not covered by the MIT grant; see TRADEMARKS.md and https://example.com/acme/brand.\n' +
        ' *\n * @since 1.0.0\n */\n' +
        'export const BetaBrandIcon = /* @__PURE__ */ createIcon("beta-brand", [["rect", { width: 16, height: 16, x: 4, y: 4 }]], { paint: \'fill\' })\n'
    )
    expect(modules.get('src/brands/generated/index.ts')).toBe(
      HEADER('Every brand mark component.', 'icons/brands') +
        "export { ALogoBrandIcon, AcmeBrandIcon } from './acme'\n" +
        "export { BetaBrandIcon } from './beta'\n"
    )
  })

  it('writes empty barrels for a set with no icon and no brand', () => {
    /**
     * Scenario: before the first drawing the root and `./brands` still build; their
     * generated part exports nothing.
     */
    const empty = componentModules({ icons: [], brands: [], categories: [] })
    expect(empty).toStrictEqual(
      new Map([
        [
          'src/icons/generated/index.ts',
          `${HEADER('The icon components the root entry re-exports.', 'icons/meta')}export {}\n`
        ],
        [
          'src/brands/generated/index.ts',
          `${HEADER('Every brand mark component.', 'icons/brands')}export {}\n`
        ]
      ])
    )
  })

  it('names the three generated directories', () => {
    /**
     * Scenario: a generation replaces these directories, and the stale-copy check reads
     * them; nothing else under `src` is generated.
     */
    expect(GENERATED_DIRECTORIES).toStrictEqual([
      'src/icons/generated',
      'src/brands/generated',
      'src/meta/generated'
    ])
  })
})
