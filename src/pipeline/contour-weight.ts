/**
 * @fileoverview Optical stroke width on the Euclidean distance ridges of a contour.
 * @layer Pipeline
 */
import { Resvg } from '@resvg/resvg-js'

/** Sample widths in units of the 24-unit design grid. */
export interface ContourWeight {
  readonly p10: number
  readonly median: number
}

const SCALE = 20
const SIDE = 24 * SCALE
const MAX_RADIUS = 2 * SCALE

/** Horizontal distances to background, capped where the ink is already a solid area. */
function horizontalDistances(alpha: Uint8Array, side: number): Uint8Array {
  const result = Uint8Array.from(alpha, (value) => (value > 127 ? MAX_RADIUS : 0))
  // Stryker disable next-line EqualityOperator: a row after the canvas is an empty subarray and writes no distances.
  for (let row = 0; row < side; row++) {
    const start = row * side
    const values = result.subarray(start, start + side)
    let left = MAX_RADIUS
    values.forEach((distance, x) => {
      left = Math.min(distance, left + 1)
      values.fill(left, x, x + 1)
    })
    values.reduceRight((right, distance, x) => {
      const nearest = Math.min(distance, right + 1)
      values.fill(nearest, x, x + 1)
      return nearest
    }, MAX_RADIUS)
  }
  return result
}

/** Minimum squared distance over rows whose vertical distance can improve the answer. */
function squaredDistances(horizontal: Uint8Array, side: number): Uint16Array {
  return Uint16Array.from(horizontal, (radius, i) => {
    let best = radius * radius
    // Stryker disable next-line EqualityOperator,UpdateOperator: a row at the current radius cannot lower it, and the symmetric row pair is identical for either sign of dy.
    for (let dy = 1; dy * dy < best; dy++) {
      const stride = dy * side
      const dx = Math.min(
        horizontal[i - stride] ?? MAX_RADIUS,
        horizontal[i + stride] ?? MAX_RADIUS
      )
      best = Math.min(best, dy * dy + dx * dx)
    }
    return best
  })
}

/** Widths at local maxima, including every pixel of a flat ridge. */
function widths(alpha: Uint8Array, side: number): number[] {
  const field = squaredDistances(horizontalDistances(alpha, side), side)
  const samples: number[] = []
  field.forEach((distance, i) => {
    if (distance < 4 || distance >= MAX_RADIUS ** 2) return
    const x = i % side
    for (let dy = -1; dy <= 1; dy++) {
      const rowOffset = dy * side
      // Stryker disable next-line ArithmeticOperator: reversing the vertical step visits the same three rows.
      const rowIndex = i + rowOffset
      for (let dx = Math.max(-1, -x); dx <= Math.min(1, side - x - 1); dx++) {
        if (Number(field[rowIndex + dx]) > distance) return
      }
    }
    samples.push((2 * Math.sqrt(distance)) / SCALE)
  })
  return samples.sort((a, b) => a - b)
}

/** Linear percentile between adjacent order statistics. */
function percentile(samples: readonly number[], fraction: number): number {
  const position = (samples.length - 1) * fraction
  const low = Number(samples[Math.floor(position)])
  return low + (Number(samples[Math.ceil(position)]) - low) * (position % 1)
}

/** Measure a drawing at twenty device pixels per design unit. Solid dots have no stroke sample. */
export function contourWeight(svg: string): ContourWeight | undefined {
  const raster = new Resvg(svg, {
    fitTo: { mode: 'width', value: SIDE },
    font: { loadSystemFonts: false }
  }).render()
  const pixels = raster.pixels
  const alpha = Uint8Array.from({ length: SIDE * SIDE }, (_, i) => Number(pixels[i * 4 + 3]))
  return ridgeWeight(alpha, SIDE)
}

/** Measure a square alpha mask sampled at twenty pixels per design unit. */
export function ridgeWeight(alpha: Uint8Array, side: number): ContourWeight | undefined {
  const samples = widths(alpha, side)
  if (samples.length < 20) return undefined
  return { p10: percentile(samples, 0.1), median: percentile(samples, 0.5) }
}
