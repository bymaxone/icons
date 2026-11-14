/**
 * @fileoverview The TypeScript the generator writes: one module per icon variant holding
 * its drawing as data for `createIcon`, one entry per icon (`./icons/<name>`), the root
 * barrel's icon re-exports, the brand modules and their barrel, the flag modules and theirs, and the metadata as data
 * for `./meta`. Every drawing is an element list in a literal; no module holds markup.
 * @layer Pipeline
 */

import { ICON_GRID } from '../meta/icon-grid.ts'
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
  'src/meta/generated'
] as const

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
const docText = (text: string): string => text.replaceAll('*/', '*\\/')

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
function header(description: string, source: string): string {
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
function aliasExports(icon: string, aliases: readonly AliasSource[], variant: Variant): string[] {
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
const VARIANT_OPTIONS: Readonly<Record<IconVariantName, string>> = {
  line: '',
  filled: `, { paint: 'fill' }`,
  sm: `, { masterSize: ${ICON_GRID.smSize} }`
}

/** One variant module: the component, created from its drawing, and its aliases. */
function variantModule(icon: IconEntry, variant: IconVariantName, drawing: Drawing): string {
  const name = componentName(icon.name, variant)
  const options = VARIANT_OPTIONS[variant]
  const doc = [
    '/**',
    ` * The \`${icon.name}\` icon, ${variant} variant: ${docText(icon.meta.tags.join(', '))}.`,
    ' *',
    ` * @since ${icon.meta.since}`,
    ' */'
  ].join('\n')
  return [
    header(`The \`${icon.name}\` icon, ${variant} variant.`, drawing.path),
    "import { createIcon } from '@bymax-one/icons/runtime'\n",
    doc,
    `export const ${name} = /* @__PURE__ */ createIcon(${JSON.stringify(variantName(icon.name, variant))}, ${iconNodeLiteral(drawing.elements)}${options})\n`,
    ...aliasExports(icon.name, icon.meta.aliases ?? [], variant)
  ].join('\n')
}

/** The names a variant module exports: the component and one per alias. */
function variantExports(icon: IconEntry, variant: Variant): string[] {
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
function rootBarrel(set: IconSet): string {
  const lines = set.icons.map((icon) => {
    const names = drawnVariants(icon).flatMap(([variant]) => variantExports(icon, variant))
    return `export { ${names.sort().join(', ')} } from '@bymax-one/icons/icons/${icon.name}'`
  })
  const body = lines.length === 0 ? ['export {}'] : lines
  return [header('The icon components the root entry re-exports.', 'icons/meta'), ...body, ''].join(
    '\n'
  )
}

/** One brand module. */
function brandModule(brand: BrandEntry): string {
  const { meta } = brand
  const doc = [
    '/**',
    ` * The ${docText(meta.title)} brand mark, from ${docText(meta.source)} (${docText(meta.license)}, retrieved ${meta.retrievedAt}).`,
    ` * The mark belongs to its owner and is not covered by the MIT grant; see TRADEMARKS.md and ${docText(meta.guidelines)}.`,
    ' *',
    ` * @since ${meta.since}`,
    ' */'
  ].join('\n')
  return [
    header(`The ${docText(meta.title)} brand mark.`, brand.drawing.path),
    "import { createIcon } from '@bymax-one/icons/runtime'\n",
    doc,
    `export const ${componentName(brand.name, 'brand')} = /* @__PURE__ */ createIcon(${JSON.stringify(variantName(brand.name, 'brand'))}, ${iconNodeLiteral(brand.drawing.elements)}, { paint: 'fill' })\n`,
    ...aliasExports(brand.name, meta.aliases ?? [], 'brand')
  ].join('\n')
}

/** The brand barrel. */
function brandsBarrel(set: IconSet): string {
  const lines = set.brands.map((brand) => {
    const names = [brand.name, ...(brand.meta.aliases ?? []).map((alias) => alias.name)]
    return `export { ${names
      .map((name) => componentName(name, 'brand'))
      .sort()
      .join(', ')} } from './${brand.name}'`
  })
  const body = lines.length === 0 ? ['export {}'] : lines
  return [header('Every brand mark component.', 'icons/brands'), ...body, ''].join('\n')
}

/** One flag module: the component, created from its drawing and its own view box. */
function flagModule(flag: FlagEntry): string {
  const { meta } = flag
  const doc = [
    '/**',
    ` * The ${docText(meta.title)} flag, from ${docText(meta.source)} (${docText(meta.license)}, retrieved ${meta.retrievedAt}).`,
    ' * It is reproduced as published by its source; see TRADEMARKS.md.',
    ' *',
    ` * @since ${meta.since}`,
    ' */'
  ].join('\n')
  const view = JSON.stringify(flag.viewBox)
  return [
    header(`The ${docText(meta.title)} flag.`, flag.drawing.path),
    "import { createFlag } from '@bymax-one/icons/runtime'\n",
    doc,
    `export const ${componentName(flag.name, 'flag')} = /* @__PURE__ */ createFlag(${JSON.stringify(variantName(flag.name, 'flag'))}, ${view}, ${iconNodeLiteral(flag.drawing.elements)})\n`
  ].join('\n')
}

/** The flag barrel, each flag through its own subpath, so it exists once in the package. */
function flagsBarrel(set: IconSet): string {
  const lines = set.flags.map(
    (flag) =>
      `export { ${componentName(flag.name, 'flag')} } from '@bymax-one/icons/flags/${flag.name}'`
  )
  const body = lines.length === 0 ? ['export {}'] : lines
  return [header('Every country flag component.', 'icons/flags'), ...body, ''].join('\n')
}

/**
 * Every generated module except the metadata, keyed by path from the repository root.
 *
 * @param set - The icon set.
 * @returns The modules' unformatted text.
 */
export function componentModules(set: IconSet): Map<string, string> {
  const files = new Map<string, string>([
    ['src/icons/generated/index.ts', rootBarrel(set)],
    ['src/brands/generated/index.ts', brandsBarrel(set)],
    ['src/flags/generated/index.ts', flagsBarrel(set)]
  ])
  for (const icon of set.icons) {
    files.set(`src/icons/generated/${icon.name}/index.ts`, iconEntryModule(icon))
    for (const [variant, drawing] of drawnVariants(icon)) {
      files.set(
        `src/icons/generated/${icon.name}/${variant}.ts`,
        variantModule(icon, variant, drawing)
      )
    }
  }
  for (const brand of set.brands)
    files.set(`src/brands/generated/${brand.name}.ts`, brandModule(brand))
  for (const flag of set.flags) files.set(`src/flags/generated/${flag.name}.ts`, flagModule(flag))
  return files
}
