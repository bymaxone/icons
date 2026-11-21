/**
 * @fileoverview The TypeScript the generator writes: one module per icon variant holding
 * its drawing as data for `createIcon`, one entry per icon (`./icons/<name>`), the root
 * barrel's icon re-exports, the brand modules and their barrel, the flag modules and theirs, and the metadata as data
 * for `./meta`. Every drawing is an element list in a literal; no module holds markup.
 * @layer Pipeline
 */

import { ICON_GRID } from '../grid/icon-grid.ts'
import { drawnVariants } from './icon-set.ts'
import type { BrandEntry, Drawing, FlagEntry, IconEntry, IconSet } from './icon-set.ts'
import type { AliasSource, IconVariantName } from './metadata.ts'
import { componentName, variantName } from './naming.ts'
import type { Variant } from './naming.ts'
import type { DrawingElement } from './svg.ts'

/** Where each generated module is written, relative to the repository root. */
export const GENERATED_DIRECTORIES = [
  'src/icons/generated',
  'src/brands/generated',
  'src/flags/generated',
  'src/native/generated',
  'src/meta/generated'
] as const

/**
 * What differs between the web modules and the React Native ones: where they are written,
 * the runtime they import, the factories they call and the subpaths their barrels use. The
 * drawing, the paint, the aliases and the documentation are shared, so they cannot differ.
 */
export interface Flavour {
  /** Where the icon, brand and flag modules are written, from the repository root. */
  readonly directories: { readonly icons: string; readonly brands: string; readonly flags: string }
  /** The specifier of the runtime the modules import. */
  readonly runtime: string
  /** The factory that creates an icon or brand component. */
  readonly createIcon: string
  /** The factory that creates a flag component. */
  readonly createFlag: string
  /** The specifier prefix of the icon, brand and flag subpaths the barrels re-export through. */
  readonly subpath: string
  /** How the icon barrel's description names the entry that re-exports it. */
  readonly entry: string
  /**
   * The version this flavour began in. A component whose drawing is older reports it, since the
   * component did not exist before; one whose drawing is newer reports its drawing's version.
   */
  readonly since?: string
}

/**
 * The version a component is documented as introduced in: its drawing's, or the one its flavour
 * began in when that is later.
 *
 * @param flavour - The flavour the component is written for.
 * @param drawn - The version the drawing was added in.
 * @returns The later of the two versions, or `drawn` when the flavour has none.
 */
export function sinceOf(flavour: Flavour, drawn: string): string {
  if (flavour.since === undefined) return drawn
  // Each part is padded to the longest part of either version, so the text compares as numbers
  // whatever their size; the schema allows any non-negative integer in a part.
  const fields = (version: string): string[] => version.split('.')
  const width = Math.max(...[flavour.since, drawn].flatMap(fields).map((part) => part.length))
  const key = (version: string): string =>
    fields(version)
      .map((part) => part.padStart(width, '0'))
      .join('.')
  // Stryker disable next-line EqualityOperator: equal versions are the same text either way
  return key(flavour.since) > key(drawn) ? flavour.since : drawn
}

/** The web modules, `createIcon` and `createFlag` from `./runtime`. */
export const WEB_FLAVOUR: Flavour = {
  directories: {
    icons: 'src/icons/generated',
    brands: 'src/brands/generated',
    flags: 'src/flags/generated'
  },
  runtime: '@bymax-one/icons/runtime',
  createIcon: 'createIcon',
  createFlag: 'createFlag',
  subpath: '@bymax-one/icons/',
  entry: 'the root entry'
}

/** The SVG attributes whose React prop name differs from the attribute name. */
const PROP_NAMES: ReadonlyMap<string, string> = new Map([
  ['fill-rule', 'fillRule'],
  ['clip-rule', 'clipRule'],
  ['stroke-width', 'strokeWidth'],
  ['stroke-miterlimit', 'strokeMiterlimit'],
  ['stroke-linejoin', 'strokeLinejoin']
])

/** The attributes whose value is one number; every other value is written as a string. */
const NUMERIC_ATTRIBUTES = new Set([
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'width',
  'height',
  'stroke-width',
  'stroke-miterlimit',
  'opacity'
])

/** Keeps metadata text from closing the JSDoc block it is written into. */
export const docText = (text: string): string => text.replaceAll('*/', '*\\/')

/** One attribute value as a literal: a number when it is one, a string otherwise. */
function valueLiteral(name: string, value: string): string {
  const number = Number(value)
  const numeric = NUMERIC_ATTRIBUTES.has(name) && value.trim() !== '' && Number.isFinite(number)
  return numeric ? String(number) : JSON.stringify(value)
}

/**
 * A drawing as the `IconNode` literal `createIcon` receives.
 *
 * @param elements - The drawing elements.
 * @returns The literal, such as `[["path", { d: "M4 12h16" }]]`.
 */
export function iconNodeLiteral(elements: readonly DrawingElement[]): string {
  const items = elements.map(({ tag, attributes }) => {
    const props = Object.entries(attributes).map(
      ([name, value]) => `${PROP_NAMES.get(name) ?? name}: ${valueLiteral(name, value)}`
    )
    return `[${JSON.stringify(tag)}, { ${props.join(', ')} }]`
  })
  return `[${items.join(', ')}]`
}

/** The file header every generated module opens with. */
export function header(description: string, source: string): string {
  return [
    '/**',
    ` * @fileoverview ${description}`,
    ` * Written by \`pnpm generate\` from ${source}: edit the source, never this file.`,
    ' * @layer Generated',
    ' */',
    ''
  ].join('\n')
}

/** The exports of every alias of one variant. */
export function aliasExports(
  icon: string,
  aliases: readonly AliasSource[],
  variant: Variant
): string[] {
  const target = componentName(icon, variant)
  return aliases.map((alias) => {
    const doc = alias.deprecated
      ? `@deprecated \`${alias.name}\` is a deprecated alias of \`${icon}\`, removed in ${alias.toBeRemovedInVersion}.${alias.deprecationReason === undefined ? '' : ` ${docText(alias.deprecationReason)}`} Use {@link ${target}}.`
      : `\`${alias.name}\`: an alias of {@link ${target}}.`
    return `/** ${doc} */\nexport const ${componentName(alias.name, variant)} = ${target}\n`
  })
}

/**
 * The `createIcon` options each icon variant passes: a filled variant is painted with
 * fill, and a 16 px master declares the size it is made for, so it renders at 16 px with
 * the set's 1.5 px stroke by default.
 */
export function variantOptions(variant: IconVariantName): string {
  switch (variant) {
    case 'line':
      return ''
    case 'filled':
      return `, { paint: 'fill' }`
    case 'sm':
      return `, { masterSize: ${ICON_GRID.smSize} }`
  }
}

/** One variant module: the component, created from its drawing, and its aliases. */
function variantModule(
  icon: IconEntry,
  variant: IconVariantName,
  drawing: Drawing,
  flavour: Flavour
): string {
  const name = componentName(icon.name, variant)
  const options = variantOptions(variant)
  const doc = [
    '/**',
    ` * The \`${icon.name}\` icon, ${variant} variant: ${docText(icon.meta.tags.join(', '))}.`,
    ' *',
    ` * @since ${sinceOf(flavour, icon.meta.since)}`,
    ' */'
  ].join('\n')
  return [
    header(`The \`${icon.name}\` icon, ${variant} variant.`, drawing.path),
    `import { ${flavour.createIcon} } from '${flavour.runtime}'\n`,
    doc,
    `export const ${name} = /* @__PURE__ */ ${flavour.createIcon}(${JSON.stringify(variantName(icon.name, variant))}, ${iconNodeLiteral(drawing.elements)}${options})\n`,
    ...aliasExports(icon.name, icon.meta.aliases ?? [], variant)
  ].join('\n')
}

/** The names a variant module exports: the component and one per alias. */
export function variantExports(icon: IconEntry, variant: Variant): string[] {
  const names = [icon.name, ...(icon.meta.aliases ?? []).map((alias) => alias.name)]
  return names.map((name) => componentName(name, variant)).sort()
}

/** The entry of one icon, `./icons/<name>`: every variant's exports. */
function iconEntryModule(icon: IconEntry): string {
  const lines = drawnVariants(icon).map(
    ([variant]) => `export { ${variantExports(icon, variant).join(', ')} } from './${variant}'`
  )
  return [
    header(`Every component of the \`${icon.name}\` icon.`, icon.metaPath),
    ...lines,
    ''
  ].join('\n')
}

/** The icon re-exports of the root entry, each icon through its own subpath. */
function rootBarrel(set: IconSet, flavour: Flavour): string {
  const lines = set.icons.map((icon) => {
    const names = drawnVariants(icon).flatMap(([variant]) => variantExports(icon, variant))
    return `export { ${names.sort().join(', ')} } from '${flavour.subpath}icons/${icon.name}'`
  })
  const body = lines.length === 0 ? ['export {}'] : lines
  return [
    header(`The icon components ${flavour.entry} re-exports.`, 'icons/meta'),
    ...body,
    ''
  ].join('\n')
}

/** One brand module. */
function brandModule(brand: BrandEntry, flavour: Flavour): string {
  const { meta } = brand
  const doc = [
    '/**',
    ` * The ${docText(meta.title)} brand mark, from ${docText(meta.source)} (${docText(meta.license)}, retrieved ${meta.retrievedAt}).`,
    ` * The mark belongs to its owner and is not covered by the MIT grant; see TRADEMARKS.md and ${docText(meta.guidelines)}.`,
    ' *',
    ` * @since ${sinceOf(flavour, meta.since)}`,
    ' */'
  ].join('\n')
  return [
    header(`The ${docText(meta.title)} brand mark.`, brand.drawing.path),
    `import { ${flavour.createIcon} } from '${flavour.runtime}'\n`,
    doc,
    `export const ${componentName(brand.name, 'brand')} = /* @__PURE__ */ ${flavour.createIcon}(${JSON.stringify(variantName(brand.name, 'brand'))}, ${iconNodeLiteral(brand.drawing.elements)}, { paint: 'fill' })\n`,
    ...aliasExports(brand.name, meta.aliases ?? [], 'brand')
  ].join('\n')
}

/** The brand barrel, each mark through its own subpath, so it exists once in the package. */
function brandsBarrel(set: IconSet, flavour: Flavour): string {
  const lines = set.brands.map((brand) => {
    const names = [brand.name, ...(brand.meta.aliases ?? []).map((alias) => alias.name)]
    return `export { ${names
      .map((name) => componentName(name, 'brand'))
      .sort()
      .join(', ')} } from '${flavour.subpath}brands/${brand.name}'`
  })
  const body = lines.length === 0 ? ['export {}'] : lines
  return [header('Every brand mark component.', 'icons/brands'), ...body, ''].join('\n')
}

/** One flag module: the component, created from its drawing and its own view box. */
function flagModule(flag: FlagEntry, flavour: Flavour): string {
  const { meta } = flag
  const doc = [
    '/**',
    ` * The ${docText(meta.title)} flag, from ${docText(meta.source)} (${docText(meta.license)}, retrieved ${meta.retrievedAt}).`,
    ' * It is reproduced as published by its source; see TRADEMARKS.md.',
    ' *',
    ` * @since ${sinceOf(flavour, meta.since)}`,
    ' */'
  ].join('\n')
  const view = JSON.stringify(flag.viewBox)
  return [
    header(`The ${docText(meta.title)} flag.`, flag.drawing.path),
    `import { ${flavour.createFlag} } from '${flavour.runtime}'\n`,
    doc,
    `export const ${componentName(flag.name, 'flag')} = /* @__PURE__ */ ${flavour.createFlag}(${JSON.stringify(variantName(flag.name, 'flag'))}, ${view}, ${iconNodeLiteral(flag.drawing.elements)})\n`
  ].join('\n')
}

/** The flag barrel, each flag through its own subpath, so it exists once in the package. */
function flagsBarrel(set: IconSet, flavour: Flavour): string {
  const lines = set.flags.map(
    (flag) =>
      `export { ${componentName(flag.name, 'flag')} } from '${flavour.subpath}flags/${flag.name}'`
  )
  const body = lines.length === 0 ? ['export {}'] : lines
  return [header('Every country flag component.', 'icons/flags'), ...body, ''].join('\n')
}

/**
 * The component modules of one flavour, keyed by path from the repository root.
 *
 * @param set - The icon set.
 * @param flavour - Where the modules go and which runtime they use.
 * @returns The modules' unformatted text.
 */
export function flavouredModules(set: IconSet, flavour: Flavour): Map<string, string> {
  const { icons, brands, flags } = flavour.directories
  const files = new Map<string, string>([
    [`${icons}/index.ts`, rootBarrel(set, flavour)],
    [`${brands}/index.ts`, brandsBarrel(set, flavour)],
    [`${flags}/index.ts`, flagsBarrel(set, flavour)]
  ])
  for (const icon of set.icons) {
    files.set(`${icons}/${icon.name}/index.ts`, iconEntryModule(icon))
    for (const [variant, drawing] of drawnVariants(icon)) {
      files.set(
        `${icons}/${icon.name}/${variant}.ts`,
        variantModule(icon, variant, drawing, flavour)
      )
    }
  }
  for (const brand of set.brands)
    files.set(`${brands}/${brand.name}.ts`, brandModule(brand, flavour))
  for (const flag of set.flags) files.set(`${flags}/${flag.name}.ts`, flagModule(flag, flavour))
  return files
}

/**
 * Every web component module, keyed by path from the repository root.
 *
 * @param set - The icon set.
 * @returns The modules' unformatted text.
 */
export function componentModules(set: IconSet): Map<string, string> {
  return flavouredModules(set, WEB_FLAVOUR)
}
