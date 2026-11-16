/**
 * Parity of the generated native modules with the generated web modules.
 *
 * Layer: integration, over every generated icon, brand and flag.
 * Goal: both trees are written from the same drawing literal, so for every module the native
 * component is created from exactly the web component's name, drawing, options and, for a
 * flag, view box. The two runtimes are replaced by recorders that keep what each factory was
 * called with, so the comparison is on data, not on formatted text.
 * Mocks: both runtimes, replaced by recorders.
 */

import { BRAND_METADATA, BRAND_NAMES, FLAG_NAMES, ICON_NAMES } from '@bymax-one/icons/meta'

jest.mock('@bymax-one/icons/runtime', () => ({
  createIcon: (name: string, node: unknown, options: unknown) => ({ name, node, options }),
  createFlag: (name: string, viewBox: string, node: unknown) => ({ name, viewBox, node })
}))
jest.mock('@bymax-one/icons/native/runtime', () => ({
  createNativeIcon: (name: string, node: unknown, options: unknown) => ({ name, node, options }),
  createNativeFlag: (name: string, viewBox: string, node: unknown) => ({ name, viewBox, node })
}))

type Exports = Record<string, unknown>

const iconNames: readonly string[] = ICON_NAMES
const brandNames: readonly string[] = BRAND_NAMES
const flagNames: readonly string[] = FLAG_NAMES

/** Loads the web and the native entry of one icon. */
const iconPair = (name: string): [Exports, Exports] => [
  require(`@bymax-one/icons/icons/${name}`) as Exports,
  require(`@bymax-one/icons/native/icons/${name}`) as Exports
]

/** The aliases the brand metadata declares, which the brand entry exports besides the marks. */
const aliasCount = (): number =>
  Object.values(
    BRAND_METADATA as Readonly<Record<string, { aliases?: readonly unknown[] }>>
  ).reduce((sum, brand) => sum + (brand.aliases?.length ?? 0), 0)

describe('native modules against the web modules', () => {
  it('draws every icon variant and alias from the web literal', () => {
    /**
     * Scenario: for every icon, the native entry exports the same names as the web entry,
     * and each export was created with the same name, drawing and options.
     */
    for (const name of iconNames) {
      const [web, nativeExports] = iconPair(name)
      expect(Object.keys(nativeExports).sort()).toStrictEqual(Object.keys(web).sort())
      expect(nativeExports).toStrictEqual(web)
    }
  })

  it('draws every brand and alias from the web literal', () => {
    /**
     * Scenario: the native brand entry exports the same names as the web one, each created
     * with the same name, drawing and fill paint.
     */
    const web = require('@bymax-one/icons/brands') as Exports
    const nativeExports = require('@bymax-one/icons/native/brands') as Exports
    expect(Object.keys(web)).toHaveLength(brandNames.length + aliasCount())
    expect(Object.keys(nativeExports).sort()).toStrictEqual(Object.keys(web).sort())
    expect(nativeExports).toStrictEqual(web)
  })

  it('draws every flag from the web literal with its own view box', () => {
    /**
     * Scenario: for every flag, the native entry was created with the same name, view box
     * and drawing as the web one.
     */
    expect(Object.keys(require('@bymax-one/icons/native/flags'))).toHaveLength(flagNames.length)
    for (const name of flagNames) {
      const web = require(`@bymax-one/icons/flags/${name}`) as Exports
      const nativeExports = require(`@bymax-one/icons/native/flags/${name}`) as Exports
      expect(nativeExports).toStrictEqual(web)
    }
  })
})
