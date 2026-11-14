/**
 * @fileoverview Builders the pipeline specs share: in-memory sources with the repository's
 * real schemas and categories, normalised drawings, valid metadata, and scratch copies of
 * the repository layout on disk.
 * @layer Tests
 */

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import type { Schemas } from '../metadata.ts'
import type { IconSources, SourceFile } from '../sources.ts'
import type { SvgKind } from '../svg-kind.ts'
import { normalizeSvg } from '../svg.ts'

/** The repository root. */
export const REPO_ROOT = join(__dirname, '..', '..', '..')

const readJson = (path: string): object => JSON.parse(readFileSync(join(REPO_ROOT, path), 'utf8'))

/** The repository's schemas. */
export const SCHEMAS: Schemas = {
  icon: readJson('schemas/icon.schema.json'),
  brand: readJson('schemas/brand.schema.json'),
  flag: readJson('schemas/flag.schema.json'),
  category: readJson('schemas/category.schema.json')
}

/** The repository's `categories.json`. */
export const CATEGORIES_TEXT = readFileSync(join(REPO_ROOT, 'categories.json'), 'utf8')

/** A drawing body in its normalised file form for a kind. */
export const drawing = (kind: SvgKind, body: string): string =>
  normalizeSvg(`<svg>${body}</svg>`, kind)

/** A flag drawing in its normalised file form: its own 3:2 view box around the body. */
export const flagDrawing = (body: string, viewBox = '0 0 513 342'): string =>
  normalizeSvg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`,
    'flags'
  )

/** Two bands, the least a flag needs to be a drawing. */
export const BANDS =
  '<path fill="#004f8e" d="M0 0h513v342H0z"/><path fill="#f6c500" d="M0 171h513v57H0z"/>'

/** A stroked circle well inside the live area. */
export const CIRCLE = '<circle cx="12" cy="12" r="7.25"/>'

/** Valid metadata of an icon, with overrides. */
export function iconMeta(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    $schema: '../../schemas/icon.schema.json',
    label: 'Ring',
    tags: ['circle'],
    categories: ['system'],
    useCases: ['First use', 'Second use'],
    variants: ['line'],
    opticalSizes: [24],
    since: '1.0.0',
    ...overrides
  })
}

/** Valid metadata of a brand, with overrides. */
export function brandMeta(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    $schema: '../../schemas/brand.schema.json',
    title: 'Acme',
    source: 'https://example.com/acme',
    guidelines: 'https://example.com/acme/brand',
    license: 'CC0-1.0',
    retrievedAt: '2026-11-08',
    since: '1.0.0',
    ...overrides
  })
}

/** Valid metadata of a country flag, with overrides. */
export function flagMeta(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    $schema: '../../schemas/flag.schema.json',
    title: 'Sweden',
    code: 'SE',
    source: 'https://example.com/flags/SE.svg',
    license: 'MIT',
    retrievedAt: '2026-11-15',
    since: '1.0.0',
    ...overrides
  })
}

/** The files of an in-memory icons directory, by directory and file name. */
export type SourceTree = Partial<Record<SvgKind | 'meta', Record<string, string>>>

const files = (directory: string, entries: Record<string, string> = {}): SourceFile[] =>
  Object.entries(entries).map(([fileName, text]) => ({
    fileName,
    path: `icons/${directory}/${fileName}`,
    text
  }))

/** In-memory sources with the repository's schemas and categories. */
export function sources(tree: SourceTree, overrides: Partial<IconSources> = {}): IconSources {
  return {
    svg: {
      line: files('line', tree.line),
      filled: files('filled', tree.filled),
      sm: files('sm', tree.sm),
      brands: files('brands', tree.brands),
      flags: files('flags', tree.flags)
    },
    meta: files('meta', tree.meta),
    categories: { fileName: 'categories.json', path: 'categories.json', text: CATEGORIES_TEXT },
    schemas: SCHEMAS,
    strays: [],
    ...overrides
  }
}

/** One flag with two bands, valid in every respect. */
export const ONE_FLAG: SourceTree = {
  flags: { 'se-flag.svg': flagDrawing(BANDS) },
  meta: { 'se-flag.json': flagMeta() }
}

/** One icon with a line circle, valid in every respect. */
export const ONE_ICON: SourceTree = {
  line: { 'ring.svg': drawing('line', CIRCLE) },
  meta: { 'ring.json': iconMeta() }
}

/**
 * A scratch repository: `categories.json`, `schemas/` and `.prettierrc` copied from this
 * one, plus the given files. The caller removes it.
 */
export function scratchRepository(extra: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'bymax-icons-'))
  cpSync(join(REPO_ROOT, 'schemas'), join(root, 'schemas'), { recursive: true })
  for (const file of ['categories.json', '.prettierrc']) {
    cpSync(join(REPO_ROOT, file), join(root, file))
  }
  for (const [path, text] of Object.entries(extra)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}

/** Removes a scratch repository. */
export const removeScratch = (root: string): void => rmSync(root, { recursive: true, force: true })
