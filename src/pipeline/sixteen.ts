/**
 * @fileoverview The 16 px fusion check: two parts of a drawing fuse when, rendered alone at
 * 16 px and 1x, they leave ink in the same pixel or ink that joins through lighter pixels.
 * A drawing may fuse only through the allowlist, each entry with its written justification.
 * @layer Pipeline
 */

import type { IconSet } from './icon-set.ts'
import { coverage, renderRgba } from './raster.ts'
import { rootAttributes } from './svg-kind.ts'
import type { SvgKind } from './svg-kind.ts'
import { serializeContainer } from './svg.ts'
import type { DrawingElement } from './svg.ts'

/** The size the reading is judged at, in pixels. */
export const SIXTEEN_SIZE = 16

/** The size the vector contact of two parts is measured at: fine enough that a fringe is not a touch. */
export const TOUCH_SIZE = 240

/** The alpha from which a pixel counts as ink of a part. */
export const INK_ALPHA = 0.5

/** The combined alpha from which a pixel joins ink of two parts into one region. */
export const BRIDGE_ALPHA = 0.35

/** The alpha from which a pixel at `TOUCH_SIZE` is covered by a part. */
export const TOUCH_ALPHA = 0.98

/** An icon's drawing as the check reads it: the 16 px master when there is one, else the line drawing. */
export interface SixteenDrawing {
  readonly name: string
  readonly kind: Extract<SvgKind, 'sm' | 'line'>
  /** Where the drawing was read from, from the repository root. */
  readonly path: string
  readonly elements: readonly DrawingElement[]
}

/** Two parts of a drawing that fuse, as the positions of their elements, first before second. */
export type PartPair = readonly [first: number, second: number]

/**
 * The drawings the check covers: each icon's 16 px master, or its line drawing when it has
 * none. Filled variants, brand marks and country flags are out of scope: a flag keeps the
 * drawing of its source, which is no 16 px master and no line drawing.
 *
 * @param set - The icon set.
 * @returns One drawing a non-brand icon, in the set's name order.
 */
export function sixteenDrawings(set: IconSet): SixteenDrawing[] {
  return set.icons.flatMap((icon) => {
    const { sm, line } = icon.drawings
    const kind = sm === undefined ? 'line' : 'sm'
    const drawing = sm ?? line
    return drawing === undefined
      ? []
      : [{ name: icon.name, kind, path: drawing.path, elements: drawing.elements }]
  })
}

/**
 * Whether the two renders of parts fuse at one size: some pixel holds ink of both, or ink of
 * both lies in one 4-connected region of pixels whose combined alpha reaches the bridge.
 *
 * @param first - The alpha of the first part, one value a pixel of a square image.
 * @param second - The alpha of the second part, over the same image.
 * @returns `true` when the parts fuse.
 */
export function rendersFuse(first: Float32Array, second: Float32Array): boolean {
  const alphaOf = (pixels: Float32Array, index: number): number => pixels[index] ?? 0
  const inkAt = (index: number): number => alphaOf(first, index) + alphaOf(second, index)
  // Stryker disable next-line EqualityOperator: alphas are multiples of 1/255 and the bridge is 0.35, so no sum equals it.
  const joined = (index: number): boolean => inkAt(index) >= BRIDGE_ALPHA
  const side = Math.round(Math.sqrt(first.length))
  const seen = new Uint8Array(first.length)
  // Stryker disable next-line EqualityOperator: a start past the last pixel reads as no ink, so it is skipped.
  for (let start = 0; start < first.length; start++) {
    // Stryker disable next-line ConditionalExpression: revisiting a region already judged cannot change the answer.
    if (seen[start] === 1) continue
    if (!joined(start)) continue
    seen[start] = 1
    const stack = [start]
    let inkOfFirst = false
    let inkOfSecond = false
    for (let index = stack.pop(); index !== undefined; index = stack.pop()) {
      inkOfFirst ||= alphaOf(first, index) >= INK_ALPHA
      inkOfSecond ||= alphaOf(second, index) >= INK_ALPHA
      // A row above or below the image reads as no ink, so only the sides need a bound.
      const neighbours = [index - side, index + side]
      if (index % side > 0) neighbours.push(index - 1)
      if (index % side < side - 1) neighbours.push(index + 1)
      for (const next of neighbours) {
        if (seen[next] === 1 || !joined(next)) continue
        seen[next] = 1
        stack.push(next)
      }
    }
    if (inkOfFirst && inkOfSecond) return true
  }
  return false
}

/**
 * Whether two parts touch in the vector: some pixel at `TOUCH_SIZE` is almost fully covered
 * by both. Parts that touch are one shape joined on purpose, so they are never a fusion.
 *
 * @param first - The alpha of the first part at `TOUCH_SIZE`.
 * @param second - The alpha of the second part at `TOUCH_SIZE`.
 * @returns `true` when the parts touch.
 */
export function rendersTouch(first: Float32Array, second: Float32Array): boolean {
  // Stryker disable next-line EqualityOperator: alphas are multiples of 1/255 and the touch alpha is 0.98, so none equals it.
  const covered = (alpha: number): boolean => alpha >= TOUCH_ALPHA
  return first.some((alpha, index) => covered(alpha) && covered(second[index] as number))
}

/** Renders one element alone, on the drawing's own root, as alpha at a pixel size. */
function renderPart(kind: SvgKind, element: DrawingElement, size: number): Float32Array {
  const root = { ...rootAttributes(kind), width: String(size), height: String(size) }
  return coverage(renderRgba(serializeContainer('svg', root, [element])))
}

/**
 * The pairs of parts of a drawing that fuse at 16 px and do not touch in the vector.
 *
 * @param drawing - The drawing.
 * @returns The fusing pairs in element order, empty when the drawing is clean.
 */
export function fusedPairs(drawing: SixteenDrawing): PartPair[] {
  const small = drawing.elements.map((element) => renderPart(drawing.kind, element, SIXTEEN_SIZE))
  const atTouchSize = (index: number): Float32Array =>
    renderPart(drawing.kind, drawing.elements[index] as DrawingElement, TOUCH_SIZE)
  const pairs: PartPair[] = []
  small.forEach((first, i) => {
    small.slice(i + 1).forEach((second, offset) => {
      const j = i + 1 + offset
      if (rendersFuse(first, second) && !rendersTouch(atTouchSize(i), atTouchSize(j))) {
        pairs.push([i, j])
      }
    })
  })
  return pairs
}

/** The icons that fuse, with the pairs, in the order given. */
export function fusingIcons(drawings: readonly SixteenDrawing[]): Map<string, PartPair[]> {
  const fusing = new Map<string, PartPair[]>()
  for (const drawing of drawings) {
    const pairs = fusedPairs(drawing)
    if (pairs.length > 0) fusing.set(drawing.name, pairs)
  }
  return fusing
}

/** What the allowlist records for an icon: the pairs of parts that may fuse, and why. */
export interface AllowedFusion {
  /** The pairs as `i-j`, element positions counted from 0 with i below j. */
  readonly pairs: readonly string[]
  /** The written justification. */
  readonly why: string
}

/** A pair as the allowlist writes it: `i-j`, element positions counted from 0. */
export function pairKey(pair: PartPair): string {
  return `${pair[0]}-${pair[1]}`
}

/** A pair string is well formed when it is two canonical indices, the first below the second. */
const PAIR_FORMAT = /^(0|[1-9]\d*)-(0|[1-9]\d*)$/

/** Whether a pair string is not `i-j` with i below j. */
function malformed(pair: string): boolean {
  const match = PAIR_FORMAT.exec(pair)
  return match === null || Number(match[1]) >= Number(match[2])
}

const unlistedMessage = (name: string, pair: string): string =>
  `${name}: pair ${pair} fuses at 16 px. Redraw it, or list the pair in scripts/sixteen-allowlist.json with a justification.`

/** The problems of one allowlist entry against the pairs its icon fuses on. */
function entryIssues(name: string, entry: AllowedFusion, fused: ReadonlySet<string>): string[] {
  const problems: string[] = []
  if (fused.size === 0) {
    problems.push(`${name}: on the allowlist but no longer fuses at 16 px. Remove its entry.`)
  }
  if (entry.pairs.length === 0) {
    problems.push(`${name}: on the allowlist without any pair. Remove its entry or list the pairs.`)
  }
  for (const pair of entry.pairs) {
    if (malformed(pair)) {
      problems.push(
        `${name}: the pair ${JSON.stringify(pair)} is malformed. Write it as "i-j" with i below j, counted from 0.`
      )
    } else if (fused.size > 0 && !fused.has(pair)) {
      problems.push(
        `${name}: pair ${pair} is on the allowlist but no longer fuses at 16 px. Remove it.`
      )
    }
  }
  if (entry.why.trim() === '') problems.push(`${name}: on the allowlist without a justification.`)
  return problems
}

/**
 * Compares the fusing icons with the allowlist, pair by pair, so the list stays honest from
 * both sides: a pair that fuses and is not listed fails, even in a listed icon, and so does an
 * entry that no longer fuses, a listed pair that no longer fuses, an entry that names no
 * drawing, has no pair or a malformed one, or has no justification.
 *
 * @param drawings - The drawings the check covers.
 * @param fusing - The icons that fuse and their pairs.
 * @param allowlist - The allowed pairs and the justification of each allowed icon, by name.
 * @returns One message per problem.
 */
export function sixteenIssues(
  drawings: readonly SixteenDrawing[],
  fusing: ReadonlyMap<string, readonly PartPair[]>,
  allowlist: Readonly<Record<string, AllowedFusion>>
): string[] {
  const known = new Set(drawings.map((drawing) => drawing.name))
  const listed = (name: string): Set<string> => new Set(allowlist[name]?.pairs)
  const unlisted = [...fusing].flatMap(([name, pairs]) =>
    pairs
      .map(pairKey)
      .filter((pair) => !listed(name).has(pair))
      .map((pair) => unlistedMessage(name, pair))
  )
  const entries = Object.entries(allowlist).flatMap(([name, entry]) =>
    known.has(name)
      ? entryIssues(name, entry, new Set((fusing.get(name) ?? []).map(pairKey)))
      : [`${name}: on the allowlist but there is no such icon. Remove its entry.`]
  )
  return [...unlisted, ...entries]
}
