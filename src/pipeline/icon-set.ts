/**
 * @fileoverview The icon set every output is written from: each icon with its metadata
 * and its drawings, each brand mark, and the categories, in name order so every output is
 * deterministic.
 * @layer Pipeline
 */

import type {
  BrandMetaSource,
  CategorySource,
  IconMetaSource,
  IconVariantName
} from './metadata.ts'
import type { DrawingElement } from './svg.ts'

/** One drawing: its source file, its normalised text and its elements. */
export interface Drawing {
  /** The source path from the repository root. */
  readonly path: string
  /** The normalised file, which is also the published raw SVG. */
  readonly text: string
  readonly elements: readonly DrawingElement[]
}

/** A non-brand icon: its metadata and the drawing of each declared variant. */
export interface IconEntry {
  readonly name: string
  /** The metadata file's path from the repository root. */
  readonly metaPath: string
  readonly meta: IconMetaSource
  /** The drawing of each variant; absent for a variant the icon does not have. */
  readonly drawings: Readonly<Record<IconVariantName, Drawing | undefined>>
}

/** A brand mark. */
export interface BrandEntry {
  readonly name: string
  /** The metadata file's path from the repository root. */
  readonly metaPath: string
  readonly meta: BrandMetaSource
  readonly drawing: Drawing
}

/** Everything the outputs are written from. */
export interface IconSet {
  readonly icons: readonly IconEntry[]
  readonly brands: readonly BrandEntry[]
  readonly categories: readonly CategorySource[]
}

/**
 * Orders entries by name, comparing code units, so the order does not depend on a locale
 * or on the order the file system listed the files in.
 *
 * @param entries - Entries with unique names.
 * @returns A new array in name order.
 */
export function byName<T extends { readonly name: string }>(entries: readonly T[]): T[] {
  const names = entries.map((entry) => entry.name).sort()
  return names.flatMap((name) => entries.filter((entry) => entry.name === name))
}

/**
 * The variants of an icon that have a drawing, with the drawing, in the order the outputs
 * list them.
 *
 * @param icon - The icon.
 * @returns `line` first, then `filled` and `sm` when drawn.
 */
export function drawnVariants(icon: IconEntry): [IconVariantName, Drawing][] {
  const { line, filled, sm } = icon.drawings
  const all = [
    ['line', line],
    ['filled', filled],
    ['sm', sm]
  ] as const
  return all.flatMap(([variant, drawing]) => (drawing === undefined ? [] : [[variant, drawing]]))
}
