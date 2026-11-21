/**
 * @fileoverview What a built package must export, read from its own `dist/metadata.json`:
 * the exact export list of every subpath (icons, brands and flags), every component with the
 * class it renders, every sprite symbol (a flag has none) and every raw SVG file. Shared by `check-consumer-runtime.mjs` and
 * `dogfood-smoke-test.mjs`.
 * @layer scripts
 *
 * The naming rules are written out again here rather than imported from the generator, so
 * a gate that inspects the generator's output does not share its code: a wrong component
 * name, a missing alias or a stray export fails on the packed tarball.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** The name a variant is created under: the bare name for the line master, `<name>-<variant>` otherwise. */
const created = (name, variant) => (variant === 'line' ? name : `${name}-${variant}`)

/** `lightning-filled` → `LightningFilledIcon`. */
const component = (kebab) =>
  `${kebab
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')}Icon`

/** The kebab names an icon or a brand publishes: its own and every alias's. */
const namesOf = (name, record) => [name, ...record.aliases.map((alias) => alias.name)]

/** The runtime names the root re-exports, whatever icons the build holds. */
const ROOT_RUNTIME = ['Icon', 'createIcon']
/** The runtime names every build exports: the root's and the country flag base and factory. */
const RUNTIME = ['Flag', 'Icon', 'createFlag', 'createIcon']
/** The runtime names the React Native entries export: the bases and their factories. */
const NATIVE_RUNTIME = ['NativeFlag', 'NativeIcon', 'createNativeFlag', 'createNativeIcon']
/** The names `./grid` exports: the grid and nothing else. */
const GRID = ['ICON_GRID']
const META = [
  'BRAND_METADATA',
  'BRAND_NAMES',
  'FLAG_METADATA',
  'FLAG_NAMES',
  'ICON_CATEGORIES',
  'ICON_GRID',
  'ICON_METADATA',
  'ICON_NAMES'
]

/**
 * Reads the expectations of the package unpacked (or built) at `packageDir`.
 *
 * @param {string} packageDir - A directory holding the package's `dist/`.
 * @returns {{
 *   metadata: { icons: Record<string, any>, brands: Record<string, any>, flags: Record<string, any> },
 *   exports: Record<string, string[]>,
 *   nativeExports: Record<string, string[]>,
 *   components: { subpath: string, name: string, className: string }[],
 *   symbols: string[],
 *   svgFiles: string[]
 * }} The exact export list per subpath (sorted), and the rendered surface.
 */
export function packageExpectations(packageDir) {
  const metadata = JSON.parse(readFileSync(join(packageDir, 'dist', 'metadata.json'), 'utf8'))
  const exports = new Map([
    ['./runtime', RUNTIME],
    ['./grid', GRID],
    ['./meta', META]
  ])
  const brandExports = []
  const components = []
  const symbols = []
  const svgFiles = []
  const iconExports = []
  for (const [name, record] of Object.entries(metadata.icons)) {
    const subpath = `./icons/${name}`
    const names = namesOf(name, record)
      .flatMap((kebab) => record.variants.map((variant) => component(created(kebab, variant))))
      .sort()
    exports.set(subpath, names)
    iconExports.push(...names)
    for (const variant of record.variants) {
      const variantName = created(name, variant)
      components.push({
        subpath,
        name: component(variantName),
        className: `bx-icon bx-icon-${variantName}`
      })
      symbols.push(`bx-${variantName}`)
      svgFiles.push(`svg/${variant}/${name}.svg`)
    }
  }
  for (const [name, record] of Object.entries(metadata.brands)) {
    const brandNames = namesOf(name, record).map((kebab) => component(created(kebab, 'brand')))
    brandExports.push(...brandNames)
    exports.set(`./brands/${name}`, [...brandNames].sort())
    const variantName = created(name, 'brand')
    components.push({
      subpath: './brands',
      name: component(variantName),
      className: `bx-icon bx-icon-${variantName}`
    })
    symbols.push(`bx-${variantName}`)
    svgFiles.push(`svg/brands/${name}.svg`)
  }
  exports.set('./brands', brandExports.sort())
  const flagExports = []
  for (const name of Object.keys(metadata.flags)) {
    const subpath = `./flags/${name}`
    const flagComponent = component(name)
    exports.set(subpath, [flagComponent])
    flagExports.push(flagComponent)
    components.push({ subpath, name: flagComponent, className: `bx-icon bx-icon-${name}` })
    svgFiles.push(`svg/flags/${name}.svg`)
  }
  exports.set('./flags', flagExports.sort())
  exports.set('.', ['ICON_GRID', ...ROOT_RUNTIME, ...iconExports].sort())
  // The React Native entries export the same component names as the web ones. They are kept
  // apart from `exports` because they cannot be loaded under Node: `react-native-svg` is Flow
  // source that only Metro compiles, so the gates resolve them and read their export names from
  // the bundle text instead (see `native-bundle-names.mjs`).
  const nativeExports = new Map([['./native/runtime', NATIVE_RUNTIME]])
  for (const [subpath, names] of exports) {
    if (subpath.startsWith('./icons/')) nativeExports.set(`./native${subpath.slice(1)}`, names)
    if (subpath.startsWith('./brands/')) nativeExports.set(`./native${subpath.slice(1)}`, names)
    if (subpath.startsWith('./flags/')) nativeExports.set(`./native${subpath.slice(1)}`, names)
  }
  nativeExports.set('./native/brands', exports.get('./brands'))
  nativeExports.set('./native/flags', exports.get('./flags'))
  nativeExports.set('./native', [...NATIVE_RUNTIME, ...iconExports].sort())
  return {
    metadata,
    exports: Object.fromEntries(exports),
    nativeExports: Object.fromEntries(nativeExports),
    components,
    symbols,
    svgFiles
  }
}
