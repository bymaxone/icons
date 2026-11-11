/**
 * @fileoverview The four kinds of source SVG (`icons/line`, `icons/filled`, `icons/sm`,
 * `icons/brands`) and what each kind fixes: the paint, the variant it becomes, and the
 * root attributes the formatter writes on every file of the kind.
 * @layer Pipeline
 */

import { ICON_GRID } from '../meta/icon-grid.ts'
import type { Variant } from './naming.ts'

/** A source directory under `icons/`, named for the drawings it holds. */
export type SvgKind = 'line' | 'filled' | 'sm' | 'brands'

/** Every source SVG directory, in the order outputs list them. */
export const SVG_KINDS: readonly SvgKind[] = ['line', 'filled', 'sm', 'brands']

/**
 * Maps a record with one value per kind into another, kind by kind.
 *
 * @param record - The values, keyed by kind.
 * @param value - The new value of a kind, from its old one.
 * @returns The new record.
 */
export function mapKinds<T, U>(
  record: Readonly<Record<SvgKind, T>>,
  value: (item: T, kind: SvgKind) => U
): Record<SvgKind, U> {
  return {
    line: value(record.line, 'line'),
    filled: value(record.filled, 'filled'),
    sm: value(record.sm, 'sm'),
    brands: value(record.brands, 'brands')
  }
}

/**
 * The entries of a record with one value per kind, in {@link SVG_KINDS} order.
 *
 * @param record - The values, keyed by kind.
 * @returns The kind and value pairs.
 */
export function kindEntries<T>(record: Readonly<Record<SvgKind, T>>): [SvgKind, T][] {
  return [
    ['line', record.line],
    ['filled', record.filled],
    ['sm', record.sm],
    ['brands', record.brands]
  ]
}

/** The variant each kind of drawing becomes. */
export const KIND_VARIANT: Readonly<Record<SvgKind, Variant>> = {
  line: 'line',
  filled: 'filled',
  sm: 'sm',
  brands: 'brand'
}

/**
 * Whether a kind is drawn with strokes. The line icons and the 16 px masters are; filled
 * icons and brand marks are filled shapes with no stroke at all.
 *
 * @param kind - The source directory.
 * @returns True for `line` and `sm`.
 */
export function isStrokeKind(kind: SvgKind): boolean {
  return kind === 'line' || kind === 'sm'
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

/** Root attributes every drawing shares: the namespace, the master size and its viewBox. */
const CANVAS: Readonly<Record<string, string>> = {
  xmlns: SVG_NAMESPACE,
  width: String(ICON_GRID.size),
  height: String(ICON_GRID.size),
  viewBox: ICON_GRID.viewBox
}

const STROKE_ROOT: Readonly<Record<string, string>> = {
  ...CANVAS,
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': String(ICON_GRID.strokeWidth),
  'stroke-linecap': ICON_GRID.strokeLinecap,
  'stroke-linejoin': ICON_GRID.strokeLinejoin
}

/**
 * A 16 px master: the same grid and paint, made for 16 px. Its stroke is the set's
 * 1.5 px at that size, written in units of the shared grid.
 */
const SM_ROOT: Readonly<Record<string, string>> = {
  ...STROKE_ROOT,
  width: String(ICON_GRID.smSize),
  height: String(ICON_GRID.smSize),
  'stroke-width': String((ICON_GRID.strokeWidth * ICON_GRID.size) / ICON_GRID.smSize)
}

const FILL_ROOT: Readonly<Record<string, string>> = { ...CANVAS, fill: 'currentColor' }

/**
 * The root attributes of a kind, in the order they are written. They match what the
 * `Icon` base renders for the same drawing, so a raw SVG file, a sprite symbol and a
 * component paint alike.
 *
 * @param kind - The source directory.
 * @returns The attribute names and values of the `<svg>` element.
 */
export function rootAttributes(kind: SvgKind): Readonly<Record<string, string>> {
  if (kind === 'sm') return SM_ROOT
  return isStrokeKind(kind) ? STROKE_ROOT : FILL_ROOT
}
