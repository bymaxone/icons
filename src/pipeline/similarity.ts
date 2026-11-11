/**
 * @fileoverview The similarity check of spec §3.4: every drawing is compared with every
 * icon of four third-party sets, so a traced, rescaled or renamed copy is flagged for a
 * human to review. Both drawings are normalised before they are compared: the ink's
 * bounds are scaled to one size and centred, and a stroked drawing is redrawn with one
 * stroke width, so neither position, size nor stroke weight hides a copy. The check flags;
 * it never fails a build.
 * @layer Pipeline
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { coverage, renderRgba } from './raster.ts'
import {
  blur,
  chamfer,
  cosine,
  dilate,
  distanceToInk,
  inkBounds,
  inkMask,
  intersectionOverUnion,
  toGrid
} from './shape.ts'
import type { Grid } from './shape.ts'

/** How a drawing is painted: by its stroke, or by filling its shapes. */
export type Paint = 'stroke' | 'fill'

/** A drawing as the check reads it: its coordinate system, its elements and its paint. */
export interface SvgDrawing {
  readonly viewBox: readonly [x: number, y: number, width: number, height: number]
  /** The markup inside the root element. */
  readonly body: string
  readonly paint: Paint
}

/** The side of the normalised canvas every drawing is compared on, in px. */
export const NORMAL_SIDE = 48
/** The side of the first render, which only finds the ink's bounds, in px. */
const PROBE_SIDE = 96
/** The stroke of a 24-unit drawing, in units: the set's own stroke. */
const STROKE_UNITS = 1.5
/** The stroke every stroked drawing is redrawn with on the normalised canvas, in px. */
const NORMAL_STROKE = 3
/** The room left around the ink on the normalised canvas, as a share of its larger side. */
const MARGIN = 1.1
/** The coverage a probe pixel must exceed to count toward the ink's bounds. */
const PROBE_THRESHOLD = 0.1
/** The coverage a normalised pixel must exceed to count as ink. */
export const INK_THRESHOLD = 0.4
/** The radius the ink masks are grown by before their overlap is measured, in px. */
export const MASK_DILATION = 1

/**
 * The chamfer distance, in px of the normalised canvas, at or below which a pair is
 * flagged. It is the largest distance measured between a third-party icon and the same
 * icon perturbed the way a careless copy is (scaled by 0.95, moved by half a unit, redrawn
 * at a 1.5 px stroke), rounded up; the calibration that sets it is in
 * `docs/similarity/calibration.md`.
 */
export const FLAG_DISTANCE = 0.25

/**
 * Reads a drawing out of an SVG document: the `viewBox` (24 x 24 when absent) and the
 * markup inside the root.
 *
 * @param text - An SVG document.
 * @param paint - How the drawing is painted.
 * @returns The drawing.
 */
export function readDrawing(text: string, paint: Paint): SvgDrawing {
  const root = /<svg\b[^>]*>/.exec(text)?.[0] ?? ''
  const box = /\bviewBox="([^"]*)"/.exec(root)?.[1] ?? '0 0 24 24'
  const [x = 0, y = 0, width = 24, height = 24] = box
    .trim()
    .split(/[\s,]+/)
    .map(Number)
  const start = text.indexOf(root) + root.length
  const end = text.lastIndexOf('</svg>')
  return {
    viewBox: [x, y, width, height],
    body: text.slice(start, end === -1 ? text.length : end),
    paint
  }
}

/** The SVG document of a drawing in a given viewBox, drawn in black at `side` px. */
function documentOf(
  drawing: SvgDrawing,
  viewBox: readonly number[],
  side: number,
  strokeWidth: number
): string {
  const paint =
    drawing.paint === 'stroke'
      ? `fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
      : 'fill="currentColor"'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="${viewBox.join(' ')}" color="#000" ${paint}>${drawing.body}</svg>`
}

/** A drawing on the normalised canvas, in the forms the scores read. */
export interface Shape {
  /** Coverage, blurred once, for the cosine. */
  readonly blurred: Grid
  /** The ink mask, grown by `MASK_DILATION`, for the overlap. */
  readonly dilated: Grid
  /** The ink mask and its distance to ink, for the chamfer distance. */
  readonly mask: Grid
  readonly distances: Grid
}

/**
 * Normalises a drawing: a first render finds the ink's bounds, and a second draws those
 * bounds, centred and with a margin, on the `NORMAL_SIDE` canvas. A stroked drawing is
 * redrawn at `NORMAL_STROKE` px whatever its size, so a shrunken copy, whose stroke would
 * otherwise grow with it, still lines up.
 *
 * @param drawing - The drawing.
 * @returns The shape, or `undefined` when the drawing holds no visible ink.
 */
export function normalisedShape(drawing: SvgDrawing): Shape | undefined {
  const [x, y, width] = drawing.viewBox
  const unit = width / 24
  const probe = toGrid(
    coverage(renderRgba(documentOf(drawing, drawing.viewBox, PROBE_SIDE, STROKE_UNITS * unit))),
    PROBE_SIDE
  )
  const bounds = inkBounds(probe, PROBE_THRESHOLD)
  if (bounds === undefined) return undefined
  const scale = width / PROBE_SIDE
  const side =
    Math.max(bounds.right - bounds.left + 1, bounds.bottom - bounds.top + 1) * scale * MARGIN
  const centreX = x + ((bounds.left + bounds.right + 1) / 2) * scale
  const centreY = y + ((bounds.top + bounds.bottom + 1) / 2) * scale
  const box = [centreX - side / 2, centreY - side / 2, side, side]
  const strokeWidth = (NORMAL_STROKE * side) / NORMAL_SIDE
  const values = toGrid(
    coverage(renderRgba(documentOf(drawing, box, NORMAL_SIDE, strokeWidth))),
    NORMAL_SIDE
  )
  const mask = inkMask(values, INK_THRESHOLD)
  return {
    blurred: blur(values),
    dilated: dilate(mask, MASK_DILATION),
    mask,
    distances: distanceToInk(mask)
  }
}

/** How close two normalised drawings are. */
export interface Scores {
  /** The cosine of the blurred coverage: 1 for the same drawing. */
  readonly cosine: number
  /** The overlap of the dilated ink masks: 1 for the same drawing. */
  readonly overlap: number
  /** The symmetric chamfer distance, in px: 0 for the same drawing; this one flags. */
  readonly distance: number
}

/**
 * Scores two normalised drawings.
 *
 * @param a - One shape.
 * @param b - The other.
 * @returns The three scores.
 */
export function compareShapes(a: Shape, b: Shape): Scores {
  return {
    cosine: cosine(a.blurred, b.blurred),
    overlap: intersectionOverUnion(a.dilated, b.dilated),
    distance: chamfer(a.mask, a.distances, b.mask, b.distances)
  }
}

/**
 * Whether a pair is close enough to be reviewed as a possible copy.
 *
 * @param scores - The pair's scores.
 * @returns True at or below `FLAG_DISTANCE`.
 */
export function isFlagged(scores: Scores): boolean {
  return scores.distance <= FLAG_DISTANCE
}

/** A third-party set the drawings are compared with. */
export interface ReferenceSet {
  readonly name: string
  /** The directory of its 24 px SVG files, from the repository root. */
  readonly directory: string
  readonly paint: Paint
}

/**
 * The sets of spec §3.4, installed as development dependencies for this check only and
 * never shipped: Lucide (ISC), Tabler and Heroicons (MIT) in their outline style, and
 * Phosphor (MIT) in its regular weight, which draws its strokes as filled outlines.
 */
export const REFERENCE_SETS: readonly ReferenceSet[] = [
  { name: 'lucide', directory: 'node_modules/lucide-static/icons', paint: 'stroke' },
  { name: 'tabler', directory: 'node_modules/@tabler/icons/icons/outline', paint: 'stroke' },
  {
    name: 'phosphor',
    directory: 'node_modules/@phosphor-icons/core/assets/regular',
    paint: 'fill'
  },
  { name: 'heroicons', directory: 'node_modules/heroicons/24/outline', paint: 'stroke' }
]

/** One third-party icon, normalised. */
export interface Reference {
  /** `<set>/<name>`. */
  readonly id: string
  readonly set: string
  readonly name: string
  readonly drawing: SvgDrawing
  readonly shape: Shape
}

/**
 * Reads and normalises every icon of the reference sets.
 *
 * @param root - The repository root.
 * @param sets - The sets to read.
 * @returns Every icon with visible ink, set by set, in file-name order.
 */
export function loadReferences(
  root: string,
  sets: readonly ReferenceSet[] = REFERENCE_SETS
): Reference[] {
  return sets.flatMap((set) => {
    const directory = join(root, set.directory)
    const files = readdirSync(directory)
      .filter((file) => file.endsWith('.svg'))
      .sort()
    return files.flatMap((file) => {
      const drawing = readDrawing(readFileSync(join(directory, file), 'utf8'), set.paint)
      const shape = normalisedShape(drawing)
      if (shape === undefined) return []
      const name = file.slice(0, -'.svg'.length)
      return [{ id: `${set.name}/${name}`, set: set.name, name, drawing, shape }]
    })
  })
}

/** A reference and how close a drawing is to it. */
export interface Match {
  readonly reference: Reference
  readonly scores: Scores
}

/**
 * The references closest to a shape, by chamfer distance, nearest first; a tie keeps the
 * reference order.
 *
 * @param shape - The drawing's shape.
 * @param references - Every reference.
 * @param count - How many to return.
 * @returns The nearest matches.
 */
export function nearest(shape: Shape, references: readonly Reference[], count: number): Match[] {
  return references
    .map((reference) => ({ reference, scores: compareShapes(shape, reference.shape) }))
    .sort((a, b) => a.scores.distance - b.scores.distance)
    .slice(0, count)
}

/**
 * Whether an icon is a primitive glyph that every set draws the same way (spec §3.5):
 * plus, minus, close, check, and every chevron and arrow. A flag on one is expected and
 * says nothing about copying, but it is still reported.
 *
 * @param name - The icon's name.
 * @returns True for a primitive.
 */
export function isPrimitive(name: string): boolean {
  return PRIMITIVES.has(name) || /^(?:chevron|arrow)-/.test(name)
}

const PRIMITIVES: ReadonlySet<string> = new Set(['plus', 'minus', 'close', 'check'])
