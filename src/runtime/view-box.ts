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
 * Four numbers joined by a separator, with whitespace allowed at either end. A number is an
 * SVG number, `[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?`: no blank, no hexadecimal, no word,
 * no `Infinity`. The separator is whitespace, or one comma with whitespace around it or none.
 * A literal, not a `RegExp` call, so the module has no top-level call that a bundler must
 * keep when a consumer imports an icon and no flag.
 */
const VIEW_BOX =
  /^\s*([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)(?:\s*,\s*|\s+)([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)(?:\s*,\s*|\s+)([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)(?:\s*,\s*|\s+)([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)\s*$/

/**
 * Parses a `viewBox` of four numbers, each pair separated by whitespace or by a single comma.
 *
 * @param text - The attribute value, such as `0 0 513 342`.
 * @returns The box, or `undefined` when it is not four numbers in that form, when one is too
 *   large to be finite, or when the width or the height is not positive.
 */
export function parseViewBox(text: string): ViewBox | undefined {
  const parts = VIEW_BOX.exec(text)?.slice(1)
  if (parts === undefined) return undefined
  const numbers = parts.map(Number)
  if (!numbers.every(Number.isFinite)) return undefined
  const [minX, minY, width, height] = numbers as [number, number, number, number]
  return width > 0 && height > 0 ? { minX, minY, width, height } : undefined
}
