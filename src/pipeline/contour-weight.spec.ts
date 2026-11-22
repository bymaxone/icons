/**
 * @fileoverview Stroke-width calibration against Euclidean distance ridges.
 * @layer Pipeline tests
 */
import { contourWeight, ridgeWeight } from './contour-weight.ts'

const svg = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">${body}</svg>`

describe('contourWeight', () => {
  it('measures horizontal and diagonal strokes on the design grid', () => {
    /** Scenario: the ridges of axis-aligned and oblique ink have different pixel distances. */
    expect(contourWeight(svg('<rect x="3" y="9" width="18" height="1.5"/>'))).toEqual({
      p10: 1.5,
      median: 1.5
    })
    const diagonal = Math.sqrt(242) / 10
    expect(
      contourWeight(svg('<path d="M4 4l15 15" fill="none" stroke="black" stroke-width="1.5"/>'))
    ).toEqual({
      p10: diagonal,
      median: diagonal
    })
  })

  it('reports separate width percentiles and excludes a solid center', () => {
    /** Scenario: differently oriented strokes share a drawing with a filled disk. */
    const result = contourWeight(
      svg(
        '<path d="M4 4l15 15M4 8l9 12" fill="none" stroke="black" stroke-width="1.43"/><circle cx="11" cy="4" r="3"/>'
      )
    )
    expect(result?.p10).toBeCloseTo(1.44, 2)
    expect(result?.median).toBeCloseTo(1.49, 2)
    expect(contourWeight(svg('<circle cx="12" cy="12" r="5"/>'))).toBeUndefined()
  })

  it('uses alpha above half coverage as ink', () => {
    /** Scenario: only the more opaque rectangle contributes ridge pixels. */
    const body =
      '<rect x="2" y="1" width="8" height="1.5" opacity=".499"/><rect x="4" y="6" width="16" height="2.25" opacity=".505"/>'
    expect(contourWeight(svg(body))).toEqual({ p10: 2.3, median: 2.3 })
  })
})

/** Brute-force Euclidean distances for small independent calibration masks. */
function oracle(alpha: Uint8Array, side: number) {
  const entries = [...alpha.entries()]
  const outside = entries.filter(([, value]) => value <= 127)
  const distances = entries.map(([i, ink]) =>
    ink <= 127
      ? 0
      : Math.min(
          ...outside.map(([j]) =>
            Math.hypot((i % side) - (j % side), Math.floor(i / side) - Math.floor(j / side))
          )
        )
  )
  const ridge = distances.filter(
    (w, i) =>
      w >= 2 &&
      w < 40 &&
      distances.every(
        (v, j) =>
          Math.abs((i % side) - (j % side)) > 1 ||
          Math.abs(Math.floor(i / side) - Math.floor(j / side)) > 1 ||
          v <= w
      )
  )
  const sorted = ridge.map((x) => x / 10).sort((a, b) => a - b)
  if (sorted.length < 20) return undefined
  const quantile = (f: number) => {
    const at = (sorted.length - 1) * f
    return (
      Number(sorted[Math.floor(at)]) * (1 - (at % 1)) + Number(sorted[Math.ceil(at)]) * (at % 1)
    )
  }
  return { p10: quantile(0.1), median: quantile(0.5) }
}

describe('ridgeWeight', () => {
  it('counts flat ridges, including radius two and exactly twenty samples', () => {
    /** Scenario: each 3-by-3 square contributes one ridge with Euclidean radius two. */
    const side = 25
    const cells = new Uint8Array(side * side)
    for (let i = 0; i < 20; i++) {
      const x = 1 + (i % 5) * 5,
        y = 1 + Math.floor(i / 5) * 5
      for (let j = 0; j < 3; j++) cells.fill(128, (y + j) * side + x, (y + j) * side + x + 3)
    }
    expect(ridgeWeight(cells, side)).toEqual({ p10: 0.2, median: 0.2 })
    cells[side + 2] = 127
    expect(ridgeWeight(cells, side)).toBeUndefined()
  })

  it('matches an exhaustive distance search at all four edges and across mixed ridges', () => {
    /** Scenario: asymmetrical ink islands cross the canvas edges and produce mixed widths. */
    const side = 35
    for (let phase = 0; phase < 8; phase++) {
      const mask = Uint8Array.from({ length: side * side }, (_, i) => {
        const x = i % side,
          y = Math.floor(i / side)
        if (y >= side - 6) return y >= side - 4 && y < side - 1 ? 128 : 127
        return Math.sin(x * 0.36 + phase) + Math.cos(y * 0.56 + x * 0.11) > 0.14 ? 128 : 127
      })
      const expected = oracle(mask, side)
      expect(expected).toBeDefined()
      const measured = ridgeWeight(mask, side)
      expect(measured?.p10).toBeCloseTo(Number(expected?.p10), 12)
      expect(measured?.median).toBeCloseTo(Number(expected?.median), 12)
    }
  })

  it('interpolates the tenth percentile and median across adjacent widths', () => {
    /** Scenario: two, eight and ten squares have radii two, three and four respectively. */
    const side = 60
    const mask = new Uint8Array(side * side)
    for (let i = 0; i < 20; i++) {
      const width = i < 2 ? 3 : i < 10 ? 5 : 7
      const x = (i % 5) * 12 + 2
      const y = Math.floor(i / 5) * 12 + 2
      for (let dy = 0; dy < width; dy++) {
        const start = (y + dy) * side + x
        mask.fill(255, start, start + width)
      }
    }
    expect(ridgeWeight(mask, side)?.p10).toBeCloseTo(0.29, 12)
    expect(ridgeWeight(mask, side)?.median).toBeCloseTo(0.35, 12)
  })

  it('keeps a vertical ridge that spans the last row', () => {
    /** Scenario: a vertical bar has precisely twenty ridge samples including the far edge. */
    const side = 20
    const mask = Uint8Array.from({ length: side * side }, (_, i) => (i % side < 3 ? 255 : 0))
    expect(ridgeWeight(mask, side)).toEqual({ p10: 0.3, median: 0.3 })
  })

  it('measures a ridge along the bottom canvas edge', () => {
    /** Scenario: only rows above the lower edge can supply background to this band. */
    const side = 48
    const bottom = new Uint8Array(side * side)
    bottom.fill(255, side * (side - 4))
    expect(ridgeWeight(bottom, side)).toEqual({ p10: 0.4, median: 0.4 })
  })

  it('isolates edge neighbours when comparing diagonal ridges', () => {
    /** Scenario: asymmetric 27-by-27 masks place different widths at opposite row ends. */
    const masks = [
      'e001ff07fffb3ff81fffe1ffe00fff0370fc0f00f33f00d8ff01c0ff0700f83000c08301001e0800f00000800704ff3fe0ffff01ff1f1ff87ff8c1ffc30ffe1f7ef00ff0e11f8007ff001cf80fe0e0ff0007ff1f38f8ff31e0ffdf01',
      'f003f0871f003ffc00f8ff07c0ff3c00fcff00e0f383019f1f1c00fcc000e00f00007f0000f84780c37f077cfe3fe0e3ff001f7e00f0e001800700003c0000f03100c0f703009c3f0020fc0180e1ef010f3f3f7f78f8ffc3c1ff3f00',
      '00803f0000f80300c03fc001fe0f1ff07ffc00ffe103e0071e0038f00000800f0000fe0300f03f0080ff03fcff1ff8ffffc0ff9f03fe7f10f0ff8303cf1f3c007ef003f083ff801ff807fcc03fe007fc017fc007f8033ec01fe00100'
    ]
    for (const hex of masks) {
      const packed = Buffer.from(hex, 'hex')
      const mask = Uint8Array.from({ length: 27 * 27 }, (_, i) =>
        (Number(packed[i >> 3]) >> (i % 8)) & 1 ? 255 : 0
      )
      const expected = oracle(mask, 27)
      expect(expected).toBeDefined()
      const measured = ridgeWeight(mask, 27)
      expect(measured?.p10).toBeCloseTo(Number(expected?.p10), 12)
      expect(measured?.median).toBeCloseTo(Number(expected?.median), 12)
    }
  })

  it('renders no font glyphs in a contour source', () => {
    /** Scenario: text must never contribute ridges through a system font. */
    expect(contourWeight(svg('<text x="1" y="18" font-size="18">HY</text>'))).toBeUndefined()
  })
})
