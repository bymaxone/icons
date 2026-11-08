/**
 * @fileoverview The drawing grid every Bymax icon is built on: the 24 px master
 * canvas, its live area and padding, and the stroke the line icons are drawn with.
 * These values are the design language as data, so the runtime defaults, the
 * generator and the SVG lint read one source instead of repeating the numbers.
 * @layer Metadata
 */

/**
 * The shape of {@link ICON_GRID}: every value is a literal type, so a consumer that
 * reads `ICON_GRID.size` gets `24`, not `number`.
 */
export interface IconGrid {
  /** The `viewBox` written on every icon's root `<svg>` element. */
  readonly viewBox: '0 0 24 24'
  /** Width and height of the master canvas, in px. */
  readonly size: 24
  /** Width and height of the area a drawing may occupy, in px. */
  readonly liveArea: 20
  /** Empty space between the live area and each canvas edge, in px. */
  readonly padding: 2
  /** Stroke width of a line icon at the 24 px master, in px. */
  readonly strokeWidth: 1.5
  /** Cap applied to the open ends of every stroke. */
  readonly strokeLinecap: 'round'
  /** Join applied where two stroke segments meet. */
  readonly strokeLinejoin: 'round'
}

/**
 * The grid of the 24 px master, frozen so no consumer can rewrite a default the
 * whole set shares.
 *
 * The live area is centred on the canvas, so `padding` is half the difference
 * between `size` and `liveArea`.
 *
 * @example
 * ```ts
 * import { ICON_GRID } from '@bymax-one/icons/meta'
 *
 * const pixelsPerUnit = 48 / ICON_GRID.size // 2 when rendering at 48 px
 * ```
 */
export const ICON_GRID: IconGrid = Object.freeze({
  viewBox: '0 0 24 24',
  size: 24,
  liveArea: 20,
  padding: 2,
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
})
