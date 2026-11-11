/**
 * Unit tests for the grid measures of the similarity check.
 *
 * Layer: unit, pure functions.
 * Goal: prove the blur, the ink mask and its dilation, the 3-4 chamfer distance transform
 * and the cosine, IoU, chamfer and bounds measures on small hand-built grids with exactly
 * computed results, including the edges and the empty cases.
 * Mocks: none.
 */

import {
  blur,
  chamfer,
  cosine,
  dilate,
  distanceToInk,
  inkBounds,
  inkMask,
  intersectionOverUnion,
  toGrid
} from './shape.ts'

const FAR = 1e9

/** A side x side mask with ink at the given [x, y] cells. */
const maskOf = (side: number, ink: readonly (readonly [number, number])[]): number[][] =>
  Array.from({ length: side }, (_, y) =>
    Array.from({ length: side }, (_unused, x) =>
      ink.some(([ix, iy]) => ix === x && iy === y) ? 1 : 0
    )
  )

describe('toGrid', () => {
  it('cuts flat values into rows', () => {
    /** Scenario: six values with side 2 read row by row, extra values ignored. */
    expect(toGrid([1, 2, 3, 4, 5, 6], 2)).toEqual([
      [1, 2],
      [3, 4]
    ])
  })

  it('accepts typed arrays', () => {
    /** Scenario: a Float32Array of exact binary fractions cuts the same way. */
    expect(toGrid(Float32Array.from([0.5, 0.25, 0.125, 1]), 2)).toEqual([
      [0.5, 0.25],
      [0.125, 1]
    ])
  })

  it('gives an empty grid for side zero', () => {
    /** Scenario: no rows for a zero side. */
    expect(toGrid([], 0)).toEqual([])
  })
})

describe('blur', () => {
  it('averages the cells inside the grid only', () => {
    /** Scenario: corners average four cells, edges six and the centre nine. */
    const result = blur([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9]
    ])
    const expected = [
      [3, 3.5, 4],
      [4.5, 5, 5.5],
      [6, 6.5, 7]
    ]
    expected.forEach((row, y) =>
      row.forEach((value, x) => expect(result[y]?.[x]).toBeCloseTo(value, 10))
    )
  })

  it('counts zero cells in the average', () => {
    /** Scenario: one lit cell in a 3 x 3 spreads its value over the cells that see it. */
    const result = blur([
      [0, 0, 0],
      [0, 9, 0],
      [0, 0, 0]
    ])
    expect(result[1]?.[1]).toBeCloseTo(1, 10)
    expect(result[0]?.[0]).toBeCloseTo(9 / 4, 10)
    expect(result[0]?.[1]).toBeCloseTo(9 / 6, 10)
    expect(result[1]?.[0]).toBeCloseTo(9 / 6, 10)
  })

  it('does not wrap around the far edge', () => {
    /** Scenario: ink on the far corner does not reach the opposite corner. */
    const result = blur([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 9]
    ])
    expect(result[0]?.[0]).toBe(0)
    expect(result[2]?.[2]).toBeCloseTo(9 / 4, 10)
  })

  it('handles an empty grid', () => {
    /** Scenario: nothing to blur. */
    expect(blur([])).toEqual([])
  })
})

describe('inkMask', () => {
  it('marks only values strictly above the threshold', () => {
    /** Scenario: equal to the threshold is not ink, above is, below is not. */
    expect(inkMask([[0.5, 0.75, 0.25, 1, 0]], 0.5)).toEqual([[0, 1, 0, 1, 0]])
  })

  it('keeps the grid shape', () => {
    /** Scenario: rows and columns carry over. */
    expect(
      inkMask(
        [
          [0, 1],
          [1, 0]
        ],
        0
      )
    ).toEqual([
      [0, 1],
      [1, 0]
    ])
  })
})

describe('dilate', () => {
  it('returns the mask itself at radius zero', () => {
    /** Scenario: a zero radius grows nothing. */
    const mask = maskOf(3, [[1, 1]])
    expect(dilate(mask, 0)).toEqual(mask)
  })

  it('grows a cell to a plus at radius one', () => {
    /** Scenario: radius 1 reaches the four orthogonal neighbours but not the diagonals. */
    expect(dilate(maskOf(5, [[2, 2]]), 1)).toEqual([
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0]
    ])
  })

  it('grows a cell to a disc at radius two', () => {
    /** Scenario: radius 2 reaches distance 2 on the axes and the (1, 1) diagonal, not (2, 1). */
    expect(dilate(maskOf(7, [[3, 3]]), 2)).toEqual([
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0]
    ])
  })

  it('does not wrap around any edge', () => {
    /** Scenario: ink on the bottom-right corner does not appear on the top-left, and the reverse. */
    expect(dilate(maskOf(3, [[2, 2]]), 1)).toEqual([
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1]
    ])
    expect(dilate(maskOf(3, [[0, 0]]), 1)).toEqual([
      [1, 1, 0],
      [1, 0, 0],
      [0, 0, 0]
    ])
  })

  it('does not wrap a row onto the one above or below', () => {
    /** Scenario: ink on the top-right and bottom-left corners stays at its own corner. */
    expect(dilate(maskOf(3, [[2, 0]]), 1)).toEqual([
      [0, 1, 1],
      [0, 0, 1],
      [0, 0, 0]
    ])
    expect(dilate(maskOf(3, [[0, 2]]), 1)).toEqual([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0]
    ])
  })

  it('leaves an empty mask empty', () => {
    /** Scenario: no ink, nothing to grow. */
    expect(dilate(maskOf(3, []), 2)).toEqual(maskOf(3, []))
  })
})

describe('distanceToInk', () => {
  it('gives exact chamfer distances from a corner cell', () => {
    /** Scenario: ink at (0, 0) of a 3 x 3; steps cost 3 across and 4 on the diagonal, over 3. */
    const d = distanceToInk(maskOf(3, [[0, 0]]))
    const expected = [
      [0, 1, 2],
      [1, 4 / 3, 7 / 3],
      [2, 7 / 3, 8 / 3]
    ]
    expected.forEach((row, y) =>
      row.forEach((value, x) => expect(d[y]?.[x]).toBeCloseTo(value, 10))
    )
  })

  it.each([
    ['top-left', [0, 0]],
    ['top-right', [4, 0]],
    ['bottom-left', [0, 4]],
    ['bottom-right', [4, 4]],
    ['centre', [2, 2]],
    ['off-centre', [1, 3]]
  ] as const)('matches the 3-4 distance from a single ink cell at the %s', (_name, [ix, iy]) => {
    /** Scenario: from one ink cell the transform is (3 * longer offset + shorter offset) / 3 everywhere. */
    const d = distanceToInk(maskOf(5, [[ix, iy]]))
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const a = Math.max(Math.abs(x - ix), Math.abs(y - iy))
        const b = Math.min(Math.abs(x - ix), Math.abs(y - iy))
        expect(d[y]?.[x]).toBeCloseTo((3 * a + b) / 3, 10)
      }
    }
  })

  it('takes the nearest of several ink cells', () => {
    /** Scenario: two ink cells on a row, each cell reads the closer one. */
    const d = distanceToInk(
      maskOf(5, [
        [0, 0],
        [4, 0]
      ])
    )
    expect(d[0]).toEqual([0, 1, 2, 1, 0])
    expect(d[2]?.[2]).toBeCloseTo((3 * 2 + 2) / 3, 10)
  })

  it('gives every cell the far distance when there is no ink', () => {
    /** Scenario: an empty mask has no nearest ink, so every distance is FAR / 3. */
    expect(distanceToInk(maskOf(2, []))).toEqual([
      [FAR / 3, FAR / 3],
      [FAR / 3, FAR / 3]
    ])
  })

  it('gives zero on the ink itself', () => {
    /** Scenario: a full mask is at distance zero everywhere. */
    expect(
      distanceToInk([
        [1, 1],
        [1, 1]
      ])
    ).toEqual([
      [0, 0],
      [0, 0]
    ])
  })

  it('treats only the value 1 as ink', () => {
    /** Scenario: a cell holding 2 is not ink. */
    const d = distanceToInk([[2, 1]])
    expect(d[0]?.[0]).toBeCloseTo(1, 10)
    expect(d[0]?.[1]).toBe(0)
  })
})

describe('cosine', () => {
  it('is 1 for equal grids', () => {
    /** Scenario: identical vectors point the same way. */
    const grid = [
      [1, 2],
      [3, 4]
    ]
    expect(cosine(grid, grid)).toBeCloseTo(1, 10)
  })

  it('is 1 for proportional grids', () => {
    /** Scenario: scaling one grid does not change the angle. */
    expect(cosine([[1, 2, 3]], [[2, 4, 6]])).toBeCloseTo(1, 10)
  })

  it('is 0 for grids that share no cell', () => {
    /** Scenario: orthogonal vectors give zero. */
    expect(cosine([[1, 0]], [[0, 1]])).toBe(0)
  })

  it('computes the exact ratio for overlapping grids', () => {
    /** Scenario: dot 2 over sqrt(3 * 3) is 2/3. */
    expect(
      cosine(
        [
          [1, 0],
          [1, 1]
        ],
        [
          [1, 1],
          [0, 1]
        ]
      )
    ).toBeCloseTo(2 / 3, 10)
  })

  it('uses both norms', () => {
    /** Scenario: dot 9 over sqrt(25 * 9) is 0.6, which differs if either norm is dropped. */
    expect(cosine([[3, 4]], [[3, 0]])).toBeCloseTo(0.6, 10)
  })

  it('is 0 when either grid is all zero', () => {
    /** Scenario: a zero vector has no direction, in either position. */
    expect(cosine([[0, 0]], [[1, 1]])).toBe(0)
    expect(cosine([[1, 1]], [[0, 0]])).toBe(0)
    expect(cosine([[0, 0]], [[0, 0]])).toBe(0)
  })

  it('reads cells of a smaller second grid beyond its edge as empty', () => {
    /** Scenario: a 1 x 1 second grid against a 2 x 2 first one: dot 1 over sqrt(4 * 1). */
    expect(
      cosine(
        [
          [1, 1],
          [1, 1]
        ],
        [[1]]
      )
    ).toBeCloseTo(0.5, 10)
  })

  it('does not wrap a negative index in the second grid', () => {
    /** Scenario: a second grid with ink only at its end shares nothing with a first grid at the start. */
    expect(cosine([[1, 0, 0]], [[0, 0, 1]])).toBe(0)
  })
})

describe('intersectionOverUnion', () => {
  it('is 1 for equal masks', () => {
    /** Scenario: the same masks overlap completely. */
    const mask = maskOf(3, [
      [0, 0],
      [2, 1]
    ])
    expect(intersectionOverUnion(mask, mask)).toBe(1)
  })

  it('is the shared over the covered cells', () => {
    /** Scenario: one shared cell out of three covered is 1/3. */
    expect(
      intersectionOverUnion(
        [
          [1, 1],
          [0, 0]
        ],
        [
          [1, 0],
          [1, 0]
        ]
      )
    ).toBeCloseTo(1 / 3, 10)
  })

  it('is 0 for disjoint masks', () => {
    /** Scenario: no shared cell. */
    expect(intersectionOverUnion([[1, 0]], [[0, 1]])).toBe(0)
  })

  it('is 0 when both masks are empty', () => {
    /** Scenario: an empty union gives 0, not NaN. */
    expect(intersectionOverUnion(maskOf(2, []), maskOf(2, []))).toBe(0)
  })

  it('counts a cell set in only the first mask or only the second', () => {
    /** Scenario: the union takes either side: 0 shared out of 2 for each direction, and a shared one of 2. */
    expect(intersectionOverUnion([[1, 1]], [[1, 0]])).toBe(0.5)
    expect(intersectionOverUnion([[1, 0]], [[1, 1]])).toBe(0.5)
  })

  it('treats only the value 1 as set', () => {
    /** Scenario: cells holding other values are not set in either mask. */
    expect(intersectionOverUnion([[2, 1]], [[2, 0]])).toBe(0)
    expect(intersectionOverUnion([[1, 0]], [[0.5, 0]])).toBe(0)
  })

  it('reads beyond a smaller second mask as empty', () => {
    /** Scenario: the first mask's cells outside the second count in the union only. */
    expect(intersectionOverUnion([[1, 1]], [[1]])).toBe(0.5)
  })

  it('does not wrap a negative index in the second mask', () => {
    /** Scenario: ink at the end of one mask is not found at the start of the other. */
    expect(intersectionOverUnion([[1, 0, 0]], [[0, 0, 1]])).toBe(0)
  })
})

describe('chamfer', () => {
  it('is the larger of the two mean reaches', () => {
    /** Scenario: A is two cells, B one; A reaches B by a mean 0.5, B reaches A by 0, so 0.5 in either order. */
    const maskA = [
      [1, 1],
      [0, 0]
    ]
    const maskB = [
      [1, 0],
      [0, 0]
    ]
    const distancesA = [
      [0, 0],
      [1, 1.5]
    ]
    const distancesB = [
      [0, 1],
      [1, 1.5]
    ]
    expect(chamfer(maskA, distancesA, maskB, distancesB)).toBeCloseTo(0.5, 10)
    expect(chamfer(maskB, distancesB, maskA, distancesA)).toBeCloseTo(0.5, 10)
  })

  it('is 0 for the same ink', () => {
    /** Scenario: drawings with equal ink are at distance zero. */
    const mask = maskOf(3, [[1, 1]])
    const distances = distanceToInk(mask)
    expect(chamfer(mask, distances, mask, distances)).toBe(0)
  })

  it('averages the distance over the ink cells only', () => {
    /** Scenario: B's ink lies at distance 1 and 2 from A's single ink cell; the mean 1.5 is the larger reach. */
    const maskA = maskOf(3, [[0, 0]])
    const maskB = maskOf(3, [
      [1, 0],
      [2, 0]
    ])
    expect(chamfer(maskA, distanceToInk(maskA), maskB, distanceToInk(maskB))).toBeCloseTo(1.5, 10)
  })

  it('is far when either mask is empty', () => {
    /** Scenario: an empty drawing has no ink to reach, in either position, and both empty is far too. */
    const some = maskOf(3, [[1, 1]])
    const none = maskOf(3, [])
    const dSome = distanceToInk(some)
    const dNone = distanceToInk(none)
    expect(chamfer(some, dSome, none, dNone)).toBe(FAR)
    expect(chamfer(none, dNone, some, dSome)).toBe(FAR)
    expect(chamfer(none, dNone, none, dNone)).toBe(FAR)
  })

  it('reads a missing distance as far', () => {
    /** Scenario: ink with no distance cell under it counts as far. */
    expect(chamfer([[1]], [[0]], [[1]], [])).toBe(FAR)
  })
})

describe('inkBounds', () => {
  it('is undefined for a blank grid', () => {
    /** Scenario: no value above the threshold means no bounds. */
    expect(
      inkBounds(
        [
          [0, 0],
          [0, 0]
        ],
        0
      )
    ).toBeUndefined()
    expect(inkBounds([], 0)).toBeUndefined()
  })

  it('does not count a value equal to the threshold', () => {
    /** Scenario: only strictly greater values are ink. */
    expect(inkBounds([[0.5, 0.5]], 0.5)).toBeUndefined()
    expect(inkBounds([[0.5, 0.6]], 0.5)).toEqual({ left: 1, top: 0, right: 1, bottom: 0 })
  })

  it('bounds a single cell by itself', () => {
    /** Scenario: one lit cell gives a one-cell box. */
    expect(inkBounds(maskOf(4, [[2, 1]]), 0)).toEqual({ left: 2, top: 1, right: 2, bottom: 1 })
  })

  it('takes the extremes over scattered ink in any order', () => {
    /** Scenario: ink met first at the far right then at the left, and the lowest row last. */
    const grid = maskOf(5, [
      [3, 1],
      [1, 2],
      [4, 1],
      [2, 3]
    ])
    expect(inkBounds(grid, 0)).toEqual({ left: 1, top: 1, right: 4, bottom: 3 })
  })

  it('tracks a top row met after a lower one', () => {
    /** Scenario: the bounds start at the first ink and then move up only if a later cell is higher in a row scan order of columns. */
    const grid = [
      [0, 0, 0],
      [0, 1, 0],
      [1, 0, 1]
    ]
    expect(inkBounds(grid, 0)).toEqual({ left: 0, top: 1, right: 2, bottom: 2 })
  })
})
