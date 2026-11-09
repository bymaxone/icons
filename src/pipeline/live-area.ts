/**
 * @fileoverview The live-area bound of the grid: every drawing's geometry stays inside the
 * centred 21 x 21 square that large round shapes may reach (spec: a 20 x 20 live area,
 * 21 x 21 for large round shapes). resvg measures the geometry, so a path's curves and arcs
 * are bounded exactly rather than by their control points.
 * @layer Pipeline
 */

import { Resvg } from '@resvg/resvg-js'

import { ICON_GRID } from '../meta/icon-grid.ts'
import { serializeContainer } from './svg.ts'
import type { DrawingElement } from './svg.ts'

/** The extent of a drawing's geometry, in grid units. */
export interface Bounds {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

/**
 * The square every drawing's geometry must fit in: the 20 px live area grown by half a
 * pixel on each side, which is the 21 x 21 allowance for large round shapes.
 */
export const LIVE_AREA_LIMIT: Bounds = {
  left: ICON_GRID.padding - 0.5,
  top: ICON_GRID.padding - 0.5,
  right: ICON_GRID.size - ICON_GRID.padding + 0.5,
  bottom: ICON_GRID.size - ICON_GRID.padding + 0.5
}

/**
 * The stroke the drawing is measured with. resvg reports the painted extent as the
 * geometry's box grown by half the stroke width on every side, whatever the caps, joins
 * and fills, so the geometry is the painted box shrunk by half this width.
 */
const PROBE_STROKE = 1

/** resvg measures in single precision; a bound is compared at the grid's three decimals. */
const round = (value: number): number => Math.round(value * 1000) / 1000

/**
 * Measures the geometry of a drawing: the stroke centre lines and the filled shapes,
 * without the stroke width. Filled and stroked elements are measured alike.
 *
 * @param elements - The drawing elements.
 * @returns The geometry's extent, or `undefined` when the drawing paints nothing.
 */
export function geometryBounds(elements: readonly DrawingElement[]): Bounds | undefined {
  const svg = serializeContainer(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: ICON_GRID.viewBox,
      width: String(ICON_GRID.size),
      height: String(ICON_GRID.size),
      stroke: '#000',
      'stroke-width': String(PROBE_STROKE)
    },
    elements
  )
  const box = new Resvg(svg).getBBox()
  if (box === undefined) return undefined
  const half = PROBE_STROKE / 2
  return {
    left: round(box.x + half),
    top: round(box.y + half),
    right: round(box.x + box.width - half),
    bottom: round(box.y + box.height - half)
  }
}

/**
 * Whether a drawing's geometry stays inside {@link LIVE_AREA_LIMIT}.
 *
 * @param bounds - The geometry's extent.
 * @returns True when every side is inside the limit or on it.
 */
export function isInsideLiveArea(bounds: Bounds): boolean {
  return (
    bounds.left >= LIVE_AREA_LIMIT.left &&
    bounds.top >= LIVE_AREA_LIMIT.top &&
    bounds.right <= LIVE_AREA_LIMIT.right &&
    bounds.bottom <= LIVE_AREA_LIMIT.bottom
  )
}
