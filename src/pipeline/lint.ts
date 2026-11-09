/**
 * @fileoverview The icon lint as one call: every rule over every source, and the icon set
 * built from the sources that passed. The generator writes outputs only from a set whose
 * lint found nothing, so every rule here guards every output.
 * @layer Pipeline
 */

import { byName } from './icon-set.ts'
import type { BrandEntry, Drawing, IconEntry, IconSet } from './icon-set.ts'
import type { LintIssue } from './lint-issue.ts'
import {
  brandScopeIssues,
  categoryIssues,
  pairIssues,
  uniquenessIssues,
  variantIssues
} from './lint-set.ts'
import type { Catalog, Described } from './lint-set.ts'
import { lintSvg } from './lint-svg.ts'
import {
  BRAND_SCHEMA_REF,
  createValidators,
  ICON_SCHEMA_REF,
  parseJson,
  validationErrors
} from './metadata.ts'
import type {
  BrandMetaSource,
  CategorySource,
  IconMetaSource,
  MetadataValidators
} from './metadata.ts'
import { KEBAB_CASE } from './naming.ts'
import type { IconSources, SourceFile } from './sources.ts'
import { mapKinds } from './svg-kind.ts'
import type { SvgKind } from './svg-kind.ts'

/** The outcome of the lint: every issue, and the set built from what passed. */
export interface LintResult {
  readonly issues: readonly LintIssue[]
  readonly set: IconSet
}

/** Files named `<kebab-case>.<extension>`, keyed by name; the others become issues. */
function byFileName(
  files: readonly SourceFile[],
  extension: string,
  issues: LintIssue[]
): Map<string, SourceFile> {
  const named = new Map<string, SourceFile>()
  for (const file of files) {
    const name = file.fileName.slice(0, -extension.length)
    if (file.fileName.endsWith(extension) && KEBAB_CASE.test(name)) named.set(name, file)
    else {
      const message = `file names are kebab-case and end in ${extension}`
      issues.push({ file: file.path, rule: 'file-name', message })
    }
  }
  return named
}

/** The `$schema` a parsed metadata file names, if it is an object that names one. */
function schemaOf(value: unknown): unknown {
  return typeof value === 'object' && value !== null && '$schema' in value
    ? value.$schema
    : undefined
}

/** Parses and validates every metadata file, sorting icons from brands by `$schema`. */
function readMetadata(
  files: ReadonlyMap<string, SourceFile>,
  validators: MetadataValidators,
  issues: LintIssue[]
): Pick<Catalog, 'icons' | 'brands'> {
  const icons = new Map<string, Described<IconMetaSource>>()
  const brands = new Map<string, Described<BrandMetaSource>>()
  for (const [name, file] of files) {
    const at = (message: string): void => {
      issues.push({ file: file.path, rule: 'meta-schema', message })
    }
    const parsed = parseJson(file.text)
    if (!parsed.ok) {
      issues.push({ file: file.path, rule: 'meta-json', message: parsed.error })
      continue
    }
    const { value } = parsed
    const schema = schemaOf(value)
    if (schema === ICON_SCHEMA_REF) {
      if (validators.icon(value)) icons.set(name, { meta: value, file })
      else validationErrors(validators.icon).forEach(at)
    } else if (schema === BRAND_SCHEMA_REF) {
      if (validators.brand(value)) brands.set(name, { meta: value, file })
      else validationErrors(validators.brand).forEach(at)
    } else at(`$schema must be "${ICON_SCHEMA_REF}" or "${BRAND_SCHEMA_REF}"`)
  }
  return { icons, brands }
}

/** Parses and validates `categories.json`; its names must be unique. */
function readCategories(
  file: SourceFile,
  validators: MetadataValidators,
  issues: LintIssue[]
): readonly CategorySource[] {
  const at = (message: string): void => {
    issues.push({ file: file.path, rule: 'category', message })
  }
  const parsed = parseJson(file.text)
  if (!parsed.ok) at(parsed.error)
  else if (!validators.categories(parsed.value)) validationErrors(validators.categories).forEach(at)
  else {
    const names = parsed.value.categories.map((category) => category.name)
    for (const name of new Set(names.filter((value, index) => names.indexOf(value) !== index))) {
      at(`the category ${name} is listed more than once`)
    }
    return parsed.value.categories
  }
  return []
}

/** Lints every drawing of one kind, collecting the drawings that parse. */
function readDrawings(
  kind: SvgKind,
  files: ReadonlyMap<string, SourceFile>,
  brands: Catalog['brands'],
  issues: LintIssue[]
): Map<string, Drawing> {
  const drawings = new Map<string, Drawing>()
  for (const [name, file] of files) {
    const multicolor = kind === 'brands' && brands.get(name)?.meta.multicolor === true
    const report = lintSvg({ file, kind, multicolor })
    issues.push(...report.issues)
    if (report.elements !== undefined) {
      drawings.set(name, { path: file.path, text: file.text, elements: report.elements })
    }
  }
  return drawings
}

/** Builds the icon set from the valid metadata and the drawings that parsed. */
function buildSet(
  catalog: Catalog,
  drawings: Readonly<Record<SvgKind, ReadonlyMap<string, Drawing>>>,
  categories: readonly CategorySource[]
): IconSet {
  const icons: IconEntry[] = [...catalog.icons].map(([name, { meta, file }]) => ({
    name,
    metaPath: file.path,
    meta,
    drawings: {
      line: drawings.line.get(name),
      filled: drawings.filled.get(name),
      sm: drawings.sm.get(name)
    }
  }))
  const brands: BrandEntry[] = [...catalog.brands].flatMap(([name, { meta, file }]) => {
    const drawing = drawings.brands.get(name)
    return drawing === undefined ? [] : [{ name, metaPath: file.path, meta, drawing }]
  })
  return { icons: byName(icons), brands: byName(brands), categories }
}

/**
 * Runs every rule of the icon lint over the sources.
 *
 * @param sources - The sources, as read from disk or built by a test.
 * @returns Every issue, and the icon set built from what passed. The set is complete only
 *   when there is no issue.
 */
export function lintSources(sources: IconSources): LintResult {
  const issues: LintIssue[] = sources.strays.map((path) => ({
    file: path,
    rule: 'file-name',
    message: 'not part of the icons layout: icons/{line,filled,sm,brands,meta}/ and README.md'
  }))
  const validators = createValidators(sources.schemas)
  const svg = mapKinds(sources.svg, (files) => byFileName(files, '.svg', issues))
  const metaFiles = byFileName(sources.meta, '.json', issues)
  const categories = readCategories(sources.categories, validators, issues)
  const metadata = readMetadata(metaFiles, validators, issues)
  const catalog: Catalog = {
    svg,
    metaFiles,
    ...metadata,
    categories: new Set(categories.map((category) => category.name))
  }
  const drawings = mapKinds(svg, (files, kind) =>
    readDrawings(kind, files, metadata.brands, issues)
  )
  issues.push(
    ...pairIssues(catalog),
    ...brandScopeIssues(catalog),
    ...variantIssues(catalog),
    ...categoryIssues(catalog),
    ...uniquenessIssues(catalog)
  )
  return { issues, set: buildSet(catalog, drawings, categories) }
}
