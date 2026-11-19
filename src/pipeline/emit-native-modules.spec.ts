/**
 * Unit tests for the React Native modules the generator writes.
 *
 * Layer: unit, on a set built from in-memory sources.
 * Goal: pin every native module byte for byte before formatting (the import of the native
 * runtime, `createNativeIcon` and `createNativeFlag`, the paint, the aliases, the barrels
 * through the `native` subpaths), and prove that a native module is its web twin in every
 * byte but the flavour, so no drawing can differ.
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
import { componentModules } from './emit-modules.ts'
import { NATIVE_FLAVOUR, nativeComponentModules } from './emit-native-modules.ts'
import { lintSources } from './lint.ts'

/** The set: one icon with three variants and aliases, one without, a brand and a flag. */
const built = lintSources(
  sources({
    line: {
      'ring.svg': drawing('line', '<circle cx="12" cy="12" r="7.25"/>'),
      'dot.svg': drawing('line', '<path d="M4 12h16"/>')
    },
    filled: { 'ring.svg': drawing('filled', '<path d="M4 4h16v16H4z" fill-rule="evenodd"/>') },
    sm: { 'ring.svg': drawing('sm', '<line x1="4" y1="12" x2="20" y2="12"/>') },
    brands: { 'acme.svg': drawing('brands', '<polygon points="12 3 21 21 3 21"/>') },
    flags: { 'se-flag.svg': flagDrawing(BANDS) },
    meta: {
      'ring.json': iconMeta({
        tags: ['circle'],
        variants: ['line', 'filled', 'sm'],
        opticalSizes: [24, 16],
        aliases: [
          { name: 'circle', deprecated: false },
          { name: 'old-ring', deprecated: true, toBeRemovedInVersion: '2.0.0' }
        ]
      }),
      'dot.json': iconMeta({ since: '1.2.0' }),
      'se-flag.json': flagMeta({ title: 'Sweden' }),
      'acme.json': brandMeta({
        title: 'Acme',
        aliases: [{ name: 'a-logo', deprecated: false }]
      })
    }
  })
)

const HEADER = (description: string, source: string): string =>
  `/**\n * @fileoverview ${description}\n * Written by \`pnpm generate\` from ${source}: edit the source, never this file.\n * @layer Generated\n */\n\n`

const IMPORT = "import { createNativeIcon } from '@bymax-one/icons/native/runtime'\n\n"

describe('nativeComponentModules', () => {
  const modules = nativeComponentModules(built.set)

  it('writes the barrels, one entry per icon, one module per variant, brand and flag', () => {
    /**
     * Scenario: the native tree is laid out under src/native/generated in the folders
     * icons, brands and flags, with the same files as the web tree; only what is drawn is
     * written.
     */
    expect(built.issues).toStrictEqual([])
    expect([...modules.keys()]).toStrictEqual([
      'src/native/generated/icons/index.ts',
      'src/native/generated/brands/index.ts',
      'src/native/generated/flags/index.ts',
      'src/native/generated/icons/dot/index.ts',
      'src/native/generated/icons/dot/line.ts',
      'src/native/generated/icons/ring/index.ts',
      'src/native/generated/icons/ring/line.ts',
      'src/native/generated/icons/ring/filled.ts',
      'src/native/generated/icons/ring/sm.ts',
      'src/native/generated/brands/acme.ts',
      'src/native/generated/flags/se-flag.ts'
    ])
  })

  it('writes each variant as a createNativeIcon call with its paint and its aliases', () => {
    /**
     * Scenario: the line variant has no options, the filled one passes the fill paint, the
     * 16 px master passes its size, and every alias is the same component, a deprecated one
     * marked as such.
     */
    const doc = (variant: string): string =>
      `/**\n * The \`ring\` icon, ${variant} variant: circle.\n *\n * @since 1.0.0\n */\n`
    const aliases = (suffix: string, target: string): string =>
      `\n/** \`circle\`: an alias of {@link ${target}}. */\nexport const Circle${suffix}Icon = ${target}\n` +
      `\n/** @deprecated \`old-ring\` is a deprecated alias of \`ring\`, removed in 2.0.0. Use {@link ${target}}. */\nexport const OldRing${suffix}Icon = ${target}\n`
    expect(modules.get('src/native/generated/icons/ring/line.ts')).toBe(
      HEADER('The `ring` icon, line variant.', 'icons/line/ring.svg') +
        IMPORT +
        doc('line') +
        'export const RingIcon = /* @__PURE__ */ createNativeIcon("ring", [["circle", { cx: 12, cy: 12, r: 7.25 }]])\n' +
        aliases('', 'RingIcon')
    )
    expect(modules.get('src/native/generated/icons/ring/filled.ts')).toBe(
      HEADER('The `ring` icon, filled variant.', 'icons/filled/ring.svg') +
        IMPORT +
        doc('filled') +
        'export const RingFilledIcon = /* @__PURE__ */ createNativeIcon("ring-filled", [["path", { fillRule: "evenodd", d: "M4 4h16v16H4z" }]], { paint: \'fill\' })\n' +
        aliases('Filled', 'RingFilledIcon')
    )
    expect(modules.get('src/native/generated/icons/ring/sm.ts')).toBe(
      HEADER('The `ring` icon, sm variant.', 'icons/sm/ring.svg') +
        IMPORT +
        doc('sm') +
        'export const RingSmIcon = /* @__PURE__ */ createNativeIcon("ring-sm", [["line", { x1: 4, x2: 20, y1: 12, y2: 12 }]], { masterSize: 16 })\n' +
        aliases('Sm', 'RingSmIcon')
    )
  })

  it('writes the per-icon entries and the icon barrel through the native subpaths', () => {
    /**
     * Scenario: an icon entry reaches its variants by relative path, while the barrel the
     * `./native` entry re-exports reaches each icon through `native/icons/<name>`, so the
     * package holds each native icon once.
     */
    expect(modules.get('src/native/generated/icons/dot/index.ts')).toBe(
      HEADER('Every component of the `dot` icon.', 'icons/meta/dot.json') +
        "export { DotIcon } from './line'\n"
    )
    expect(modules.get('src/native/generated/icons/index.ts')).toBe(
      HEADER('The icon components the `./native` entry re-exports.', 'icons/meta') +
        "export { DotIcon } from '@bymax-one/icons/native/icons/dot'\n" +
        "export { CircleFilledIcon, CircleIcon, CircleSmIcon, OldRingFilledIcon, OldRingIcon, OldRingSmIcon, RingFilledIcon, RingIcon, RingSmIcon } from '@bymax-one/icons/native/icons/ring'\n"
    )
  })

  it('writes a brand as a filled createNativeIcon call, and the brand barrel', () => {
    /**
     * Scenario: a brand is painted with fill, keeps its provenance doc and its aliases, and
     * the brand barrel reaches each brand by relative path.
     */
    expect(modules.get('src/native/generated/brands/acme.ts')).toBe(
      HEADER('The Acme brand mark.', 'icons/brands/acme.svg') +
        IMPORT +
        '/**\n * The Acme brand mark, from https://example.com/acme (CC0-1.0, retrieved 2026-11-08).\n' +
        ' * The mark belongs to its owner and is not covered by the MIT grant; see TRADEMARKS.md and https://example.com/acme/brand.\n' +
        ' *\n * @since 1.0.0\n */\n' +
        'export const AcmeBrandIcon = /* @__PURE__ */ createNativeIcon("acme-brand", [["polygon", { points: "12 3 21 21 3 21" }]], { paint: \'fill\' })\n' +
        '\n/** `a-logo`: an alias of {@link AcmeBrandIcon}. */\nexport const ALogoBrandIcon = AcmeBrandIcon\n'
    )
    expect(modules.get('src/native/generated/brands/index.ts')).toBe(
      HEADER('Every brand mark component.', 'icons/brands') +
        "export { ALogoBrandIcon, AcmeBrandIcon } from './acme'\n"
    )
  })

  it('writes a flag as a createNativeFlag call over its own view box, and the flag barrel', () => {
    /**
     * Scenario: a flag keeps the view box of its source and its own paint; the barrel
     * reaches each flag through `native/flags/<name>`.
     */
    expect(modules.get('src/native/generated/flags/se-flag.ts')).toBe(
      HEADER('The Sweden flag.', 'icons/flags/se-flag.svg') +
        "import { createNativeFlag } from '@bymax-one/icons/native/runtime'\n\n" +
        '/**\n * The Sweden flag, from https://example.com/flags/SE.svg (MIT, retrieved 2026-11-15).\n' +
        ' * It is reproduced as published by its source; see TRADEMARKS.md.\n' +
        ' *\n * @since 1.0.0\n */\n' +
        'export const SeFlagIcon = /* @__PURE__ */ createNativeFlag("se-flag", "0 0 513 342", [["path", { fill: "#004f8e", d: "M0 0h513v342H0z" }], ["path", { fill: "#f6c500", d: "M0 171h513v57H0z" }]])\n'
    )
    expect(modules.get('src/native/generated/flags/index.ts')).toBe(
      HEADER('Every country flag component.', 'icons/flags') +
        "export { SeFlagIcon } from '@bymax-one/icons/native/flags/se-flag'\n"
    )
  })

  it('writes empty barrels for a set with nothing drawn', () => {
    /**
     * Scenario: before the first drawing the native entries still build; their generated
     * part exports nothing.
     */
    const empty = nativeComponentModules({ icons: [], brands: [], flags: [], categories: [] })
    expect(empty).toStrictEqual(
      new Map([
        [
          'src/native/generated/icons/index.ts',
          `${HEADER('The icon components the `./native` entry re-exports.', 'icons/meta')}export {}\n`
        ],
        [
          'src/native/generated/brands/index.ts',
          `${HEADER('Every brand mark component.', 'icons/brands')}export {}\n`
        ],
        [
          'src/native/generated/flags/index.ts',
          `${HEADER('Every country flag component.', 'icons/flags')}export {}\n`
        ]
      ])
    )
  })

  it('differs from the web modules only by the flavour', () => {
    /**
     * Scenario: undoing the flavour (directory, runtime specifier, factory names, subpath)
     * in each native module gives its web twin byte for byte, so a drawing, a paint or an
     * alias cannot differ between the two trees. The version is the one thing the flavour
     * sets apart, so both sides name it alike here and the specs below pin each value.
     */
    const sinceless = (text: string | undefined): string | undefined =>
      text?.replace(/@since \S+/, '@since X')
    const web = componentModules(built.set)
    expect(modules.size).toBe(web.size)
    for (const [path, text] of modules) {
      const twin = path
        .replace('src/native/generated/icons/', 'src/icons/generated/')
        .replace('src/native/generated/brands/', 'src/brands/generated/')
        .replace('src/native/generated/flags/', 'src/flags/generated/')
      const undone = text
        .replaceAll('createNativeIcon', 'createIcon')
        .replaceAll('createNativeFlag', 'createFlag')
        .replaceAll('@bymax-one/icons/native/runtime', '@bymax-one/icons/runtime')
        .replaceAll('@bymax-one/icons/native/', '@bymax-one/icons/')
        .replaceAll('the `./native` entry', 'the root entry')
      expect(sinceless(undone)).toBe(sinceless(web.get(twin)))
    }
  })

  it('declares the native flavour', () => {
    /**
     * Scenario: the flavour is the single place the native layout and runtime are named.
     */
    expect(NATIVE_FLAVOUR).toStrictEqual({
      directories: {
        icons: 'src/native/generated/icons',
        brands: 'src/native/generated/brands',
        flags: 'src/native/generated/flags'
      },
      runtime: '@bymax-one/icons/native/runtime',
      createIcon: 'createNativeIcon',
      createFlag: 'createNativeFlag',
      subpath: '@bymax-one/icons/native/',
      entry: 'the `./native` entry',
      since: '1.0.0'
    })
  })
})
