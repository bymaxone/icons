/**
 * @fileoverview Stroke maths: the stroke width an icon writes on its root, given
 * the requested width, the rendered size and whether the visual width should stay
 * constant across sizes.
 * @layer Runtime
 */

import { ICON_GRID } from '@bymax-one/icons/meta'

/**
 * Resolves the `stroke-width` an icon writes.
 *
 * A drawing is scaled from its 24 px master, so a stroke of 1.5 renders 3 px wide
 * at 48 px. With `absolute` the width is divided by that scale, `strokeWidth * 24
 * / size`, and the stroke renders `strokeWidth` px wide at every size.
 *
 * The division needs a pixel size, so it applies only when both values are numbers
 * or numeric strings and the size is above zero. A CSS length (`'1em'`, `'100%'`)
 * or a non-numeric width is returned as given, never as `NaN` or `Infinity`. A
 * blank string is not numeric, although `Number('')` is `0`.
 *
 * @param strokeWidth - The requested width at the 24 px master.
 * @param size - The rendered width and height.
 * @param absolute - Whether the visual width stays constant across sizes.
 * @returns The width to write on the root element.
 */
export function resolveStrokeWidth(
  strokeWidth: number | string,
  size: number | string,
  absolute: boolean
): number | string {
  if (!absolute) return strokeWidth
  const width = toNumber(strokeWidth)
  const pixels = toNumber(size)
  if (!Number.isFinite(width) || !Number.isFinite(pixels) || pixels <= 0) return strokeWidth
  return (width * ICON_GRID.size) / pixels
}

/**
 * Parses a width or size, treating a blank string as non-numeric.
 * @param value - A number or a string from props.
 * @returns The parsed number, or `NaN` when the string is blank.
 */
function toNumber(value: number | string): number {
  return typeof value === 'string' && value.trim() === '' ? Number.NaN : Number(value)
}
