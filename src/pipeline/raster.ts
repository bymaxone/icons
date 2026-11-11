/**
 * @fileoverview Rasterising SVG text with resvg for the visual tools: the RGBA pixels the
 * visual regression compares, and the ink coverage the similarity check measures.
 * @layer Pipeline
 */

import { Resvg } from '@resvg/resvg-js'

/** An image as resvg renders it: straight RGBA, four bytes a pixel, row by row. */
export interface RgbaImage {
  readonly width: number
  readonly height: number
  readonly pixels: Uint8Array
}

/**
 * Renders SVG text at its own size, one device pixel per CSS pixel. System fonts are not
 * loaded: the drawings hold no text, and loading them costs a third of a second a render.
 *
 * @param svg - A complete SVG document with a width and a height.
 * @returns The rendered pixels.
 */
export function renderRgba(svg: string): RgbaImage {
  const image = new Resvg(svg, { font: { loadSystemFonts: false } }).render()
  // `pixels` copies the whole buffer on every read, so it is read once.
  return { width: image.width, height: image.height, pixels: new Uint8Array(image.pixels) }
}

/**
 * The ink coverage of every pixel, from the alpha channel: 0 for an empty pixel, 1 for a
 * covered one.
 *
 * @param image - A rendered image.
 * @returns One value a pixel, row by row.
 */
export function coverage(image: RgbaImage): Float32Array {
  const alpha = image.pixels.filter((_, index) => index % 4 === 3)
  return Float32Array.from(alpha, (value) => value / 255)
}
