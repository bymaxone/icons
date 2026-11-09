/**
 * @fileoverview The data the generator writes: the metadata module behind `./meta`, and
 * the static outputs `dist/svg/<kind>/<name>.svg`, `dist/sprite.svg` and
 * `dist/metadata.json`. The metadata module and `metadata.json` hold the same records.
 * @layer Pipeline
 */

import { drawnVariants } from './icon-set.ts'
import type { IconSet } from './icon-set.ts'
import type { AliasSource, BrandMetaSource, IconMetaSource } from './metadata.ts'
import { symbolId } from './naming.ts'
import { KIND_VARIANT, rootAttributes } from './svg-kind.ts'
import type { SvgKind } from './svg-kind.ts'
import { serializeContainer } from './svg.ts'
import type { DrawingElement } from './svg.ts'

/** An alias with its keys in the published order. */
function aliasRecord(alias: AliasSource): AliasSource {
  if (!alias.deprecated) return { name: alias.name, deprecated: false }
  const { name, deprecationReason, toBeRemovedInVersion } = alias
  return deprecationReason === undefined
    ? { name, deprecated: true, toBeRemovedInVersion }
    : { name, deprecated: true, deprecationReason, toBeRemovedInVersion }
}

/** One icon's published record: its metadata without `$schema`, in a fixed key order. */
function iconRecord(meta: IconMetaSource): Record<string, unknown> {
  const { tags, categories, useCases, aliases = [], variants, opticalSizes, since } = meta
  return {
    tags,
    categories,
    useCases,
    aliases: aliases.map(aliasRecord),
    variants,
    opticalSizes,
    since
  }
}

/** One brand's published record, in a fixed key order with every optional field present. */
function brandRecord(meta: BrandMetaSource): Record<string, unknown> {
  const {
    title,
    source,
    guidelines,
    license,
    retrievedAt,
    tags = [],
    aliases = [],
    multicolor = false,
    since
  } = meta
  return {
    title,
    source,
    guidelines,
    license,
    retrievedAt,
    tags,
    aliases: aliases.map(aliasRecord),
    multicolor,
    since
  }
}

/**
 * The published records: every icon and brand keyed by name, and the categories. The key
 * order is fixed, so reordering the keys of a source file changes no output.
 *
 * @param set - The icon set.
 * @returns The records `./meta` and `metadata.json` publish.
 */
export function metadataRecords(set: IconSet): {
  icons: Record<string, unknown>
  brands: Record<string, unknown>
  categories: { name: string; title: string }[]
} {
  return {
    icons: Object.fromEntries(set.icons.map(({ name, meta }) => [name, iconRecord(meta)])),
    brands: Object.fromEntries(set.brands.map(({ name, meta }) => [name, brandRecord(meta)])),
    categories: set.categories.map(({ name, title }) => ({ name, title }))
  }
}

/**
 * The module behind the typed metadata of `./meta`: the records as `as const` data, with
 * no import, so the entry stays free of React and of every other module.
 *
 * @param set - The icon set.
 * @returns The module's unformatted text.
 */
export function metadataModule(set: IconSet): string {
  const { icons, brands, categories } = metadataRecords(set)
  const constant = (doc: string, name: string, value: unknown): string =>
    `/** ${doc} */\nexport const ${name} = ${JSON.stringify(value)} as const\n`
  return [
    '/**',
    ' * @fileoverview The metadata of every icon and brand mark, as data.',
    ' * Written by `pnpm generate` from icons/meta and categories.json: edit the sources, never this file.',
    ' * @layer Generated',
    ' */',
    '',
    constant('Every icon name, in name order.', 'ICON_NAMES', Object.keys(icons)),
    constant('Every brand name, in name order.', 'BRAND_NAMES', Object.keys(brands)),
    constant(
      'Every category name, in the order of categories.json.',
      'CATEGORY_NAMES',
      categories.map((category) => category.name)
    ),
    constant('The categories, in the order of categories.json.', 'CATEGORIES', categories),
    constant('The metadata of every icon, keyed by name.', 'ICONS', icons),
    constant('The metadata of every brand mark, keyed by name.', 'BRANDS', brands)
  ].join('\n')
}

/** The attributes of a sprite symbol: the kind's root attributes without the document ones. */
function symbolAttributes(id: string, kind: SvgKind): Record<string, string> {
  const { xmlns: _xmlns, width: _width, height: _height, ...paint } = rootAttributes(kind)
  return { id, ...paint }
}

/**
 * The sprite: one `<symbol id="bx-<variant name>">` per drawing, icons in name order with
 * their variants, then the brand marks.
 *
 * @param set - The icon set.
 * @returns The sprite file, ending with a newline.
 */
export function sprite(set: IconSet): string {
  const symbols: { id: string; kind: SvgKind; elements: readonly DrawingElement[] }[] = [
    ...set.icons.flatMap((icon) =>
      drawnVariants(icon).map(([variant, drawing]) => ({
        id: symbolId(icon.name, variant),
        kind: variant,
        elements: drawing.elements
      }))
    ),
    ...set.brands.map((brand) => ({
      id: symbolId(brand.name, KIND_VARIANT.brands),
      kind: 'brands' as const,
      elements: brand.drawing.elements
    }))
  ]
  const body = symbols.map(({ id, kind, elements }) =>
    serializeContainer('symbol', symbolAttributes(id, kind), elements, '  ')
  )
  return ['<svg xmlns="http://www.w3.org/2000/svg">', ...body, '</svg>', ''].join('\n')
}

/**
 * Every static output, keyed by path inside the output directory: each raw SVG, the
 * sprite and `metadata.json`.
 *
 * @param set - The icon set.
 * @returns The files' text.
 */
export function staticFiles(set: IconSet): Map<string, string> {
  const files = new Map<string, string>()
  for (const icon of set.icons) {
    for (const [variant, drawing] of drawnVariants(icon)) {
      files.set(`svg/${variant}/${icon.name}.svg`, drawing.text)
    }
  }
  for (const brand of set.brands) files.set(`svg/brands/${brand.name}.svg`, brand.drawing.text)
  files.set('sprite.svg', sprite(set))
  files.set('metadata.json', `${JSON.stringify(metadataRecords(set), null, 2)}\n`)
  return files
}
