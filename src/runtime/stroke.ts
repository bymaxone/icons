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
 * Every drawing is on the 24-unit grid. A width is read in px at the drawing's
 * master size: at the 24 px master one px is one unit and the width is written as
 * given; a 16 px master is drawn on the same grid, so its width is written
 * `strokeWidth * 24 / 16` units and renders `strokeWidth` px wide at 16 px. The
 * stroke then scales with the drawing, so a stroke of 1.5 at the 24 master renders
 * 3 px wide at 48 px. With `absolute` the width is divided by the rendered scale
 * instead, `strokeWidth * 24 / size`, and the stroke renders `strokeWidth` px wide
 * at every size, whatever the master.
 *
 * The divisions need numbers. An absolute stroke applies only when both values are
 * numbers or numeric strings and the size is above zero; otherwise the stroke
 * scales with the drawing. A width that does not parse to a finite number (`'2px'`,
 * a blank string, `Infinity`) is returned as given, never as `NaN`, `0` or
 * `Infinity`. A blank string is not numeric, although `Number('')` is `0`.
 *
 * @param strokeWidth - The requested width, in px at the master size.
 * @param size - The rendered width and height.
 * @param absolute - Whether the visual width stays constant across sizes.
 * @param masterSize - The px size the drawing is drawn for. Default 24.
 * @returns The width to write on the root element.
 */
export function resolveStrokeWidth(
  strokeWidth: number | string,
  size: number | string,
  absolute: boolean,
  masterSize: number = ICON_GRID.size
): number | string {
  const width = toNumber(strokeWidth)
  if (!Number.isFinite(width)) return strokeWidth
  const pixels = toNumber(size)
  if (absolute && Number.isFinite(pixels) && pixels > 0) return (width * ICON_GRID.size) / pixels
  if (masterSize === ICON_GRID.size) return strokeWidth
  return (width * ICON_GRID.size) / masterSize
}

/**
 * Parses a width or size, treating a blank string as non-numeric.
 * @param value - A number or a string from props.
 * @returns The parsed number, or `NaN` when the string is blank.
 */
function toNumber(value: number | string): number {
  return typeof value === 'string' && value.trim() === '' ? Number.NaN : Number(value)
}
