/**
 * @fileoverview The rules that read the sources as a set (spec section 12): every drawing
 * has its metadata and the reverse, the declared variants exist, brand names stay in
 * `icons/brands`, categories exist, and no two names or component names collide.
 * @layer Pipeline
 */

import type { LintIssue } from './lint-issue.ts'
import type { BrandMetaSource, IconMetaSource } from './metadata.ts'
import { componentName } from './naming.ts'
import type { Variant } from './naming.ts'
import type { SourceFile } from './sources.ts'
import type { SvgKind } from './svg-kind.ts'

/** Valid metadata and the file it was read from. */
export interface Described<T> {
  readonly meta: T
  readonly file: SourceFile
}

/** The sources whose names and metadata are valid, keyed by icon name. */
export interface Catalog {
  readonly svg: Readonly<Record<SvgKind, ReadonlyMap<string, SourceFile>>>
  /** Every metadata file with a valid name, whether or not its content is valid. */
  readonly metaFiles: ReadonlyMap<string, SourceFile>
  readonly icons: ReadonlyMap<string, Described<IconMetaSource>>
  readonly brands: ReadonlyMap<string, Described<BrandMetaSource>>
  readonly categories: ReadonlySet<string>
}

/** Every drawing has a metadata file, and every metadata file the drawing it describes. */
export function pairIssues(catalog: Catalog): LintIssue[] {
  const issues: LintIssue[] = []
  for (const [name, file] of Object.values(catalog.svg).flatMap((files) => [...files])) {
    if (!catalog.metaFiles.has(name)) {
      issues.push({
        file: file.path,
        rule: 'meta-pair',
        message: `no metadata file icons/meta/${name}.json`
      })
    }
  }
  const missing = (name: string, file: SourceFile, kind: SvgKind, drawn: boolean): void => {
    if (drawn) return
    const message = `no drawing icons/${kind}/${name}.svg`
    issues.push({ file: file.path, rule: 'meta-pair', message })
  }
  for (const [name, { file }] of catalog.icons) {
    missing(name, file, 'line', catalog.svg.line.has(name))
  }
  for (const [name, { file }] of catalog.brands) {
    missing(name, file, 'brands', catalog.svg.brands.has(name))
  }
  return issues
}

/** A brand's drawings live only in `icons/brands`, and only a brand's live there. */
export function brandScopeIssues(catalog: Catalog): LintIssue[] {
  const issues: LintIssue[] = []
  for (const files of [catalog.svg.line, catalog.svg.filled, catalog.svg.sm]) {
    for (const [name, file] of files) {
      if (catalog.brands.has(name)) {
        const message = `${name} is a brand: its drawing belongs in icons/brands only`
        issues.push({ file: file.path, rule: 'brand-scope', message })
      }
    }
  }
  for (const [name, file] of catalog.svg.brands) {
    if (catalog.icons.has(name)) {
      const message = `${name} is an icon, not a brand: icons/brands holds brand marks only`
      issues.push({ file: file.path, rule: 'brand-scope', message })
    }
  }
  return issues
}

/** The variants an icon declares are the drawings that exist, and 16 px goes with `sm`. */
export function variantIssues(catalog: Catalog): LintIssue[] {
  const issues: LintIssue[] = []
  for (const [name, { meta, file }] of catalog.icons) {
    const at = file.path
    const optional = [
      ['filled', catalog.svg.filled],
      ['sm', catalog.svg.sm]
    ] as const
    for (const [variant, files] of optional) {
      const declared = meta.variants.includes(variant)
      const drawn = files.get(name)
      if (declared && drawn === undefined) {
        const message = `declares the ${variant} variant, but icons/${variant}/${name}.svg does not exist`
        issues.push({ file: at, rule: 'meta-variants', message })
      }
      if (!declared && drawn !== undefined) {
        const message = `is not declared in the variants of icons/meta/${name}.json`
        issues.push({ file: drawn.path, rule: 'meta-variants', message })
      }
    }
    if (meta.opticalSizes.includes(16) !== meta.variants.includes('sm')) {
      const message = 'opticalSizes lists 16 exactly when the sm variant is declared'
      issues.push({ file: at, rule: 'meta-variants', message })
    }
  }
  return issues
}

/** Every category an icon names exists in `categories.json`. */
export function categoryIssues(catalog: Catalog): LintIssue[] {
  return [...catalog.icons.values()].flatMap(({ meta, file }) =>
    meta.categories
      .filter((category) => !catalog.categories.has(category))
      .map((category) => ({
        file: file.path,
        rule: 'category' as const,
        message: `the category ${category} is not in categories.json`
      }))
  )
}

/** One name an icon or a brand publishes, with the kebab name it comes from and its file. */
interface Claim {
  readonly value: string
  readonly name: string
  readonly file: string
}

/** The kebab names and the component names one icon or brand publishes. */
function claims(
  name: string,
  described: Described<{ readonly aliases?: readonly { readonly name: string }[] }>,
  variants: readonly Variant[]
): { names: Claim[]; components: Claim[] } {
  const file = described.file.path
  const all = [name, ...(described.meta.aliases ?? []).map((alias) => alias.name)]
  return {
    names: all.map((value) => ({ value, name: value, file })),
    components: all.flatMap((value) =>
      variants.map((variant) => ({ value: componentName(value, variant), name: value, file }))
    )
  }
}

/** The claims of every value claimed more than once. */
function collisions(list: readonly Claim[]): Map<string, Claim[]> {
  const byValue = new Map<string, Claim[]>()
  for (const claim of list) byValue.set(claim.value, [...(byValue.get(claim.value) ?? []), claim])
  return new Map([...byValue].filter(([, claimed]) => claimed.length > 1))
}

/** One issue per file that takes part in a collision. */
function collisionIssues(
  found: ReadonlyMap<string, readonly Claim[]>,
  describe: (value: string) => string
): LintIssue[] {
  return [...found].flatMap(([value, claimed]) =>
    [...new Set(claimed.map((claim) => claim.file))].map((file) => ({
      file,
      rule: 'name-unique' as const,
      message: describe(value)
    }))
  )
}

/**
 * No icon, brand or alias name, and no component name, is published twice. A component
 * collision is reported only between distinct names (`foo-filled` against the filled
 * variant of `foo`, `aspect-16-9` against `aspect-169`); a repeated name is reported once,
 * as a name.
 */
export function uniquenessIssues(catalog: Catalog): LintIssue[] {
  const all = [
    ...[...catalog.icons].map(([name, described]) =>
      claims(name, described, described.meta.variants)
    ),
    ...[...catalog.brands].map(([name, described]) => claims(name, described, ['brand']))
  ]
  const names = collisions(all.flatMap((claim) => claim.names))
  const components = collisions(
    all.flatMap((claim) => claim.components).filter((claim) => !names.has(claim.name))
  )
  return [
    ...collisionIssues(
      names,
      (value) => `the name ${value} is used by more than one icon, brand or alias`
    ),
    ...collisionIssues(
      components,
      (value) => `the component name ${value} is exported more than once`
    )
  ]
}
