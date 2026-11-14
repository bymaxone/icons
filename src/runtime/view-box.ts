/**
 * @fileoverview Reading an SVG `viewBox` attribute, which a flag keeps from its source
 * and from which its aspect ratio is taken.
 * @layer Runtime
 */

/** A parsed `viewBox`: the origin and the size of the drawing's own coordinate system. */
export interface ViewBox {
  readonly minX: number
  readonly minY: number
  readonly width: number
  readonly height: number
}

/**
 * Parses a `viewBox` of four numbers separated by whitespace or commas.
 *
 * @param text - The attribute value, such as `0 0 513 342`.
 * @returns The box, or `undefined` when there are not four finite numbers or the width or
 *   the height is not positive.
 */
export function parseViewBox(text: string): ViewBox | undefined {
  const numbers = text
    .trim()
    .split(/[\s,]+/)
    .map(Number)
  if (numbers.length !== 4 || !numbers.every(Number.isFinite)) return undefined
  const [minX, minY, width, height] = numbers as [number, number, number, number]
  return width > 0 && height > 0 ? { minX, minY, width, height } : undefined
}
