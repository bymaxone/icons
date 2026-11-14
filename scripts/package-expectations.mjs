/**
 * @fileoverview What a built package must export, read from its own `dist/metadata.json`:
 * the exact export list of every subpath, every component with the class it renders, every
 * sprite symbol and every raw SVG file. Shared by `check-consumer-runtime.mjs` and
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
const META = [
  'BRAND_METADATA',
  'BRAND_NAMES',
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
 *   metadata: { icons: Record<string, any>, brands: Record<string, any> },
 *   exports: Record<string, string[]>,
 *   components: { subpath: string, name: string, className: string }[],
 *   symbols: string[],
 *   svgFiles: string[]
 * }} The exact export list per subpath (sorted), and the rendered surface.
 */
export function packageExpectations(packageDir) {
  const metadata = JSON.parse(readFileSync(join(packageDir, 'dist', 'metadata.json'), 'utf8'))
  const exports = new Map([
    ['./runtime', RUNTIME],
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
    brandExports.push(...namesOf(name, record).map((kebab) => component(created(kebab, 'brand'))))
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
  exports.set('.', ['ICON_GRID', ...ROOT_RUNTIME, ...iconExports].sort())
  return { metadata, exports: Object.fromEntries(exports), components, symbols, svgFiles }
}
