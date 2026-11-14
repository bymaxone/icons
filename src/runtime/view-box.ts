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

/** A number as SVG writes it: no blank, no hexadecimal, no word, no `Infinity`. */
const NUMBER = '[-+]?(?:\\d*\\.\\d+|\\d+\\.?)(?:[eE][-+]?\\d+)?'

/** The separator of two numbers: whitespace, or one comma with whitespace around it or none. */
const SEPARATOR = '(?:\\s*,\\s*|\\s+)'

/** Four numbers joined by the separator, with whitespace allowed at either end. */
const VIEW_BOX = new RegExp(
  `^\\s*${Array.from({ length: 4 }, () => `(${NUMBER})`).join(SEPARATOR)}\\s*$`
)

/**
 * Parses a `viewBox` of four numbers, each pair separated by whitespace or by a single comma.
 *
 * @param text - The attribute value, such as `0 0 513 342`.
 * @returns The box, or `undefined` when it is not four numbers in that form, or when the width
 *   or the height is not positive.
 */
export function parseViewBox(text: string): ViewBox | undefined {
  const parts = VIEW_BOX.exec(text)?.slice(1)
  if (parts === undefined) return undefined
  const [minX, minY, width, height] = parts.map(Number) as [number, number, number, number]
  return width > 0 && height > 0 ? { minX, minY, width, height } : undefined
}
