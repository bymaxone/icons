/**
 * Unit tests for the SVG rasteriser.
 *
 * Layer: unit, with resvg.
 * Goal: prove an SVG renders to exact RGBA pixels at its own size and that coverage reads
 * the alpha channel alone, scaled to the 0 to 1 range.
 * Mocks: none.
 */

import { coverage, renderRgba, type RgbaImage } from './raster.ts'

const svg = (body: string, size = 4): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${body}</svg>`

describe('renderRgba', () => {
  it('renders a half-covered canvas to exact pixels', () => {
    /** Scenario: a black rect over the left half gives opaque black there and nothing on the right. */
    const image = renderRgba(svg('<rect width="2" height="4"/>'))
    expect(image.width).toBe(4)
    expect(image.height).toBe(4)
    expect(image.pixels).toBeInstanceOf(Uint8Array)
    expect(image.pixels.length).toBe(64)
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const offset = (y * 4 + x) * 4
        const expected = x < 2 ? [0, 0, 0, 255] : [0, 0, 0, 0]
        expect(Array.from(image.pixels.slice(offset, offset + 4))).toEqual(expected)
      }
    }
  })

  it('renders at the size the document declares', () => {
    /** Scenario: a non-square document keeps its own width and height, one pixel per unit. */
    const image = renderRgba(
      '<svg xmlns="http://www.w3.org/2000/svg" width="3" height="2"><rect width="3" height="2" fill="#ff0000"/></svg>'
    )
    expect(image.width).toBe(3)
    expect(image.height).toBe(2)
    expect(image.pixels.length).toBe(24)
    expect(Array.from(image.pixels.slice(0, 4))).toEqual([255, 0, 0, 255])
  })

  it('renders an empty document fully transparent', () => {
    /** Scenario: no shapes leave every byte zero. */
    const image = renderRgba(svg(''))
    expect(image.pixels.every((byte) => byte === 0)).toBe(true)
  })
})

describe('renderRgba fonts', () => {
  it('draws no text, because system fonts are not loaded', () => {
    /** Scenario: a large text element finds no font and leaves the canvas empty. */
    const image = renderRgba(
      svg('<text x="0" y="30" font-size="32" font-family="sans-serif">MWH</text>', 40)
    )
    expect(image.pixels.every((byte) => byte === 0)).toBe(true)
  })
})

describe('coverage', () => {
  it('reads the alpha channel of a rendered image', () => {
    /** Scenario: covered pixels give 1 and empty pixels 0, one value a pixel. */
    const values = coverage(renderRgba(svg('<rect width="2" height="4"/>')))
    expect(values).toBeInstanceOf(Float32Array)
    expect(values.length).toBe(16)
    expect(Array.from(values)).toEqual([1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0])
  })

  it('scales alpha by 255 and ignores the colour channels', () => {
    /** Scenario: a hand-built image with loud colour and varied alpha yields alpha / 255 only. */
    const image: RgbaImage = {
      width: 3,
      height: 1,
      pixels: Uint8Array.from([255, 255, 255, 0, 10, 20, 30, 51, 200, 100, 50, 255])
    }
    const values = coverage(image)
    expect(values.length).toBe(3)
    expect(values[0]).toBe(0)
    expect(values[1]).toBeCloseTo(0.2, 6)
    expect(values[2]).toBe(1)
  })

  it('gives a partial coverage to a translucent fill', () => {
    /** Scenario: a half-opaque fill renders to a coverage near one half. */
    const values = coverage(renderRgba(svg('<rect width="4" height="4" fill-opacity="0.5"/>')))
    expect(values[0]).toBeCloseTo(128 / 255, 5)
  })
})
