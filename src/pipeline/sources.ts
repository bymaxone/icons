/**
 * @fileoverview The drawing and metadata sources as the rest of the generator reads them,
 * and the one function that reads them from disk: `icons/{line,filled,sm,brands,flags}/*.svg`,
 * `icons/meta/*.json`, `categories.json` and the schemas. Everything after this module
 * works on the in-memory value, so the rules and the outputs are tested without a disk.
 * @layer Pipeline
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import type { Schemas } from './metadata.ts'
import { SVG_KINDS } from './svg-kind.ts'
import type { SvgKind } from './svg-kind.ts'

/** One source file: its name in its directory, its path from the repository root, its text. */
export interface SourceFile {
  /** The file name, extension included, such as `lightning.svg`. */
  readonly fileName: string
  /** The path from the repository root with `/` separators, used in every message. */
  readonly path: string
  readonly text: string
}

/** Every source the generator reads. */
export interface IconSources {
  /** The files of each SVG directory, sorted by name. */
  readonly svg: Readonly<Record<SvgKind, readonly SourceFile[]>>
  /** The files of `icons/meta`, sorted by name. */
  readonly meta: readonly SourceFile[]
  readonly categories: SourceFile
  readonly schemas: Schemas
  /** Paths under the icons directory that are not part of its layout. */
  readonly strays: readonly string[]
}

/** Where the sources live, relative to the repository root. */
export interface SourceLayout {
  /** The repository root, absolute. */
  readonly root: string
  /** The icons directory relative to the root: `icons`, or a fixture directory. */
  readonly icons: string
}

/** The directories the icons directory holds. */
const SOURCE_DIRECTORIES = new Set<string>([...SVG_KINDS, 'meta'])

/** The files the icons directory may hold beside its source directories. */
const ICONS_DIR_FILES = new Set(['README.md'])

/**
 * Lists a directory's entries in the order the file system returns them, or none when it
 * does not exist or is not a directory (a file in its place is reported as a stray by the
 * caller). Nothing downstream depends on the order: the outputs sort by name.
 */
function entries(path: string): { name: string; isFile: boolean }[] {
  if (statSync(path, { throwIfNoEntry: false })?.isDirectory() !== true) return []
  return readdirSync(path, { withFileTypes: true }).map((entry) => ({
    name: entry.name,
    isFile: entry.isFile()
  }))
}

/** Reads one source directory; anything in it that is not a file is a stray. */
function readDirectory(
  layout: SourceLayout,
  directory: string,
  strays: string[]
): readonly SourceFile[] {
  const files: SourceFile[] = []
  for (const entry of entries(join(layout.root, layout.icons, directory))) {
    const path = `${layout.icons}/${directory}/${entry.name}`
    if (!entry.isFile) strays.push(path)
    else
      files.push({
        fileName: entry.name,
        path,
        text: readFileSync(join(layout.root, path), 'utf8')
      })
  }
  return files
}

/** Reads and parses one schema file. */
function readSchema(root: string, name: string): object {
  const path = join(root, 'schemas', `${name}.schema.json`)
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (typeof parsed !== 'object' || parsed === null) {
    throw new TypeError(`schemas/${name}.schema.json is not a JSON object.`)
  }
  return parsed
}

/**
 * Reads every source from disk. A missing source directory is an empty one, so a set
 * with no filled variant or no brand mark needs no placeholder directory.
 *
 * @param layout - The repository root and the icons directory.
 * @returns The sources.
 */
export function readSources(layout: SourceLayout): IconSources {
  const strays: string[] = []
  for (const { name, isFile } of entries(join(layout.root, layout.icons))) {
    const expected = isFile ? ICONS_DIR_FILES.has(name) : SOURCE_DIRECTORIES.has(name)
    if (!expected) strays.push(`${layout.icons}/${name}`)
  }
  return {
    svg: {
      line: readDirectory(layout, 'line', strays),
      filled: readDirectory(layout, 'filled', strays),
      sm: readDirectory(layout, 'sm', strays),
      brands: readDirectory(layout, 'brands', strays),
      flags: readDirectory(layout, 'flags', strays)
    },
    meta: readDirectory(layout, 'meta', strays),
    categories: {
      fileName: 'categories.json',
      path: 'categories.json',
      text: readFileSync(join(layout.root, 'categories.json'), 'utf8')
    },
    schemas: {
      icon: readSchema(layout.root, 'icon'),
      brand: readSchema(layout.root, 'brand'),
      flag: readSchema(layout.root, 'flag'),
      category: readSchema(layout.root, 'category')
    },
    strays
  }
}
