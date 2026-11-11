/**
 * @fileoverview Measures on a square grid of ink coverage, the form the similarity check
 * compares drawings in: a box blur, an ink mask and its dilation, the distance from every
 * pixel to the nearest ink, and the three scores (cosine, IoU of dilated masks, chamfer).
 * Grids are rows of numbers; a read outside the grid is a read of empty paper.
 * @layer Pipeline
 */

/** A square grid of values, row by row. */
export type Grid = readonly (readonly number[])[]

/** The distance a pixel with no ink anywhere on the grid is given. */
const FAR = 1e9

/** The value at a cell, or `outside` past the grid's edge. */
function cell(grid: Grid, x: number, y: number, outside: number): number {
  // `at` counts a negative index from the end, so the edge is checked first.
  if (x < 0 || y < 0) return outside
  return grid.at(y)?.at(x) ?? outside
}

/**
 * Cuts flat values into a square grid.
 *
 * @param values - One value a pixel, row by row; their count is the side squared.
 * @param side - The grid's side.
 * @returns The rows.
 */
export function toGrid(values: ArrayLike<number>, side: number): number[][] {
  return Array.from({ length: side }, (_, y) =>
    Array.from({ length: side }, (_unused, x) => Number(values[y * side + x]))
  )
}

/**
 * A 3 x 3 box blur; the edge averages only the cells inside the grid.
 *
 * @param grid - The values.
 * @returns The blurred values.
 */
export function blur(grid: Grid): number[][] {
  return grid.map((row, y) =>
    row.map((_, x) => {
      let sum = 0
      let count = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          // The 3 x 3 window is symmetric, so mirrored offsets sum the same cells.
          // Stryker disable next-line ArithmeticOperator: mirrored offsets of a symmetric window
          const value = grid[y + dy]?.[x + dx]
          if (value !== undefined) {
            sum += value
            count++
          }
        }
      }
      return sum / count
    })
  )
}

/**
 * The ink mask: 1 where coverage exceeds the threshold, 0 elsewhere.
 *
 * @param grid - Coverage values from 0 to 1.
 * @param threshold - The coverage a pixel must exceed to count as ink.
 * @returns The mask.
 */
export function inkMask(grid: Grid, threshold: number): number[][] {
  return grid.map((row) => row.map((value) => (value > threshold ? 1 : 0)))
}

/**
 * Grows a mask by a disc: a cell is set when a set cell lies within `radius` of it.
 *
 * @param mask - The mask.
 * @param radius - The disc's radius, in cells.
 * @returns The dilated mask.
 */
export function dilate(mask: Grid, radius: number): number[][] {
  return mask.map((row, y) =>
    row.map((_, x) => {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > radius * radius) continue
          // The disc is symmetric, so reading at `x - dx` or `y - dy` visits the same cells.
          // Stryker disable next-line ArithmeticOperator: mirrored offsets of a symmetric disc
          if (cell(mask, x + dx, y + dy, 0) === 1) return 1
        }
      }
      return 0
    })
  )
}

/**
 * The distance from every cell to the nearest set cell of a mask, by the two-pass 3-4
 * chamfer transform, in cells (a step across costs 1, a diagonal step 4/3).
 *
 * @param mask - The mask.
 * @returns The distances; with no set cell, every distance is far beyond the grid.
 */
export function distanceToInk(mask: Grid): number[][] {
  const steps = mask.map((row) => row.map((value) => (value === 1 ? 0 : FAR)))
  const rows = [...steps.entries()]
  const relax = (row: number[], x: number, y: number, neighbours: Neighbours): void => {
    let best = cell(steps, x, y, FAR)
    for (const [dx, dy, cost] of neighbours) {
      best = Math.min(best, cell(steps, x + dx, y + dy, FAR) + cost)
    }
    row.fill(best, x, x + 1)
  }
  for (const [y, row] of rows) {
    row.forEach((_, x) => relax(row, x, y, FORWARD))
  }
  for (const [y, row] of rows.reverse()) {
    for (const x of [...row.keys()].reverse()) relax(row, x, y, BACKWARD)
  }
  return steps.map((row) => row.map((value) => value / 3))
}

/** Neighbour offsets and the cost of the step to each: 3 across, 4 diagonally. */
type Neighbours = readonly (readonly [dx: number, dy: number, cost: number])[]

/** The neighbours the forward pass has already settled: left, up, up-left, up-right. */
const FORWARD: Neighbours = [
  [-1, 0, 3],
  [0, -1, 3],
  [-1, -1, 4],
  [1, -1, 4]
]

/** The neighbours the backward pass has already settled: right, down, down-right, down-left. */
const BACKWARD: Neighbours = [
  [1, 0, 3],
  [0, 1, 3],
  [1, 1, 4],
  [-1, 1, 4]
]

/**
 * The cosine of the angle between two grids read as vectors: 1 for proportional grids,
 * 0 when they share no value or one is empty.
 *
 * @param a - A grid.
 * @param b - A grid of the same side.
 * @returns The cosine, from 0 to 1 for non-negative values.
 */
export function cosine(a: Grid, b: Grid): number {
  let dot = 0
  let normA = 0
  let normB = 0
  a.forEach((row, y) =>
    row.forEach((value, x) => {
      const other = cell(b, x, y, 0)
      dot += value * other
      normA += value * value
      normB += other * other
    })
  )
  const norm = Math.sqrt(normA * normB)
  return norm === 0 ? 0 : dot / norm
}

/**
 * Intersection over union of two masks: 1 for equal masks, 0 when they share no cell or
 * both are empty.
 *
 * @param a - A mask.
 * @param b - A mask of the same side.
 * @returns The ratio.
 */
export function intersectionOverUnion(a: Grid, b: Grid): number {
  let both = 0
  let either = 0
  a.forEach((row, y) =>
    row.forEach((value, x) => {
      const other = cell(b, x, y, 0)
      if (value === 1 && other === 1) both++
      if (value === 1 || other === 1) either++
    })
  )
  return either === 0 ? 0 : both / either
}

/** The mean distance from the ink of one mask to the ink of another. */
function meanReach(from: Grid, distances: Grid): number {
  let total = 0
  let count = 0
  from.forEach((row, y) =>
    row.forEach((value, x) => {
      if (value === 1) {
        total += cell(distances, x, y, FAR)
        count++
      }
    })
  )
  return count === 0 ? FAR : total / count
}

/**
 * The symmetric chamfer distance between two drawings: how far, on average, the ink of
 * each lies from the ink of the other, taking the larger of the two directions so that a
 * drawing that only adds detail to another is not a match. 0 for the same ink.
 *
 * @param maskA - The ink mask of one drawing.
 * @param distancesA - Its distance to ink.
 * @param maskB - The ink mask of the other.
 * @param distancesB - Its distance to ink.
 * @returns The distance, in cells.
 */
export function chamfer(maskA: Grid, distancesA: Grid, maskB: Grid, distancesB: Grid): number {
  return Math.max(meanReach(maskA, distancesB), meanReach(maskB, distancesA))
}

/**
 * The bounds of the cells above a threshold, inclusive, or `undefined` for a blank grid.
 *
 * @param grid - The values.
 * @param threshold - The value a cell must exceed.
 * @returns The first and last column and row that hold ink.
 */
export function inkBounds(
  grid: Grid,
  threshold: number
): { left: number; top: number; right: number; bottom: number } | undefined {
  let bounds: { left: number; top: number; right: number; bottom: number } | undefined
  grid.forEach((row, y) =>
    row.forEach((value, x) => {
      if (value <= threshold) return
      bounds = {
        left: Math.min(bounds?.left ?? x, x),
        top: Math.min(bounds?.top ?? y, y),
        right: Math.max(bounds?.right ?? x, x),
        bottom: Math.max(bounds?.bottom ?? y, y)
      }
    })
  )
  return bounds
}
