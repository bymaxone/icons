/**
 * Unit tests for the visual regression primitives.
 *
 * Layer: unit, with resvg for the strip and pngjs for the PNG round trip.
 * Goal: pin the targets a set yields, the strip's layout and colours, the exactness of the
 * PNG round trip, the tolerance and size rules of the pixel comparison, and the layout of
 * the difference image.
 * Mocks: none.
 */

import { brandMeta, drawing, iconMeta, sources } from './__tests__/support.ts'
import { CELL, SHEET_SIZES, SHEET_THEMES, placedDrawing } from './contact-sheet.ts'
import type { SheetRow } from './contact-sheet.ts'
import { lintSources } from './lint.ts'
import type { RgbaImage } from './raster.ts'
import {
  BASELINE_DIRECTORY,
  CHANNEL_TOLERANCE,
  changedPixels,
  decodePng,
  differenceImage,
  encodePng,
  renderStrip,
  stripSvg,
  visualTargets
} from './visual.ts'

const ROW: SheetRow = {
  label: 'ring (line)',
  kind: 'line',
  elements: [{ tag: 'circle', attributes: { cx: '12', cy: '12', r: '7.25' } }]
}

/** An image filled with one colour. */
function solid(width: number, height: number, rgba: readonly number[]): RgbaImage {
  const pixels = new Uint8Array(width * height * 4)
  for (let pixel = 0; pixel < width * height; pixel++) pixels.set(rgba, pixel * 4)
  return { width, height, pixels }
}

/** A copy of an image with one pixel replaced. */
function withPixel(image: RgbaImage, pixel: number, rgba: readonly number[]): RgbaImage {
  const pixels = new Uint8Array(image.pixels)
  pixels.set(rgba, pixel * 4)
  return { ...image, pixels }
}

/** The RGBA of one pixel. */
const pixelAt = (image: RgbaImage, x: number, y: number): number[] =>
  Array.from(image.pixels.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 4))

describe('the constants', () => {
  it('keeps the baselines under visual/ and tolerates 8 of 255 a channel', () => {
    /**
     * Scenario: the baseline directory and the tolerance are part of the committed
     * workflow, so a change to either is deliberate.
     */
    expect(BASELINE_DIRECTORY).toBe('visual')
    expect(CHANNEL_TOLERANCE).toBe(8)
  })
})

describe('visualTargets', () => {
  it('lists icon variants in name order, then the brand marks, each with its baseline file', () => {
    /**
     * Scenario: every drawn variant and every brand is a target, named for the file its
     * baseline lives in.
     */
    const { set } = lintSources(
      sources({
        line: { 'ring.svg': drawing('line', '<circle cx="12" cy="12" r="7.25"/>') },
        filled: { 'ring.svg': drawing('filled', '<circle cx="12" cy="12" r="8"/>') },
        brands: { 'acme.svg': drawing('brands', '<path d="M4 4h16v16H4z"/>') },
        meta: {
          'ring.json': iconMeta({ variants: ['line', 'filled'] }),
          'acme.json': brandMeta()
        }
      })
    )
    const targets = visualTargets(set)
    expect(
      targets.map(({ name, label, kind, file }) => ({ name, label, kind, file }))
    ).toStrictEqual([
      { name: 'ring', label: 'ring (line)', kind: 'line', file: 'line/ring.png' },
      { name: 'ring', label: 'ring (filled)', kind: 'filled', file: 'filled/ring.png' },
      { name: 'acme', label: 'acme (brand)', kind: 'brands', file: 'brands/acme.png' }
    ])
    expect(targets.map((target) => target.elements.map((element) => element.tag))).toStrictEqual([
      ['circle'],
      ['circle'],
      ['path']
    ])
  })

  it('is empty for an empty set', () => {
    /**
     * Scenario: a repository with no drawing has no baseline to hold.
     */
    expect(visualTargets(lintSources(sources({})).set)).toStrictEqual([])
  })
})

describe('stripSvg', () => {
  it('lays the four sizes on the light page, then the four on the dark page, in each ink', () => {
    /**
     * Scenario: the strip is eight CELL squares side by side; each has its page colour
     * behind the drawing and the drawing in the page's ink.
     */
    const [light, dark] = SHEET_THEMES
    const cells = [light, dark].flatMap((theme, t) =>
      SHEET_SIZES.map((size, s) => {
        const x = (t * 4 + s) * CELL
        return [
          `<rect x="${x}" y="0" width="${CELL}" height="${CELL}" fill="${theme?.background}"/>`,
          placedDrawing(ROW, x, 0, size, theme?.colours[0][1] ?? '')
        ].join('')
      })
    )
    expect(stripSvg(ROW)).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="448" height="56" viewBox="0 0 448 56">',
        ...cells,
        '</svg>',
        ''
      ].join('\n')
    )
  })
})

describe('renderStrip', () => {
  it('renders the strip at its own size with the page colours behind the ink', () => {
    /**
     * Scenario: the render is 448 by 56 px; the corner of the light cell is the light page
     * and the corner of the dark cell is the dark page, both opaque.
     */
    const image = renderStrip(ROW)
    expect([image.width, image.height]).toStrictEqual([448, 56])
    expect(pixelAt(image, 0, 0)).toStrictEqual([0xe9, 0xef, 0xf3, 255])
    const dark = SHEET_THEMES[1]?.background ?? ''
    expect(pixelAt(image, 4 * CELL, 0)).toStrictEqual([
      parseInt(dark.slice(1, 3), 16),
      parseInt(dark.slice(3, 5), 16),
      parseInt(dark.slice(5, 7), 16),
      255
    ])
    // The 48 px circle's left stroke crosses the middle row near x=14 of the fourth light cell.
    const middle = pixelAt(image, 3 * CELL + 14, 28)
    expect(middle[3]).toBe(255)
    expect(middle).not.toStrictEqual([0xe9, 0xef, 0xf3, 255])
  })
})

describe('encodePng and decodePng', () => {
  it('round-trips an image exactly, transparency included', () => {
    /**
     * Scenario: a baseline is stored as PNG and read back; the pixels, with straight
     * alpha, must be the ones written.
     */
    const original = withPixel(solid(3, 2, [10, 20, 30, 255]), 4, [200, 100, 50, 7])
    const bytes = encodePng(original)
    expect(bytes.subarray(1, 4).toString()).toBe('PNG')
    const decoded = decodePng(bytes)
    expect([decoded.width, decoded.height]).toStrictEqual([3, 2])
    expect(Array.from(decoded.pixels)).toStrictEqual(Array.from(original.pixels))
    expect(decoded.pixels).toBeInstanceOf(Uint8Array)
  })

  it('does not alias the image it encodes', () => {
    /**
     * Scenario: encoding copies the pixels, so the caller's image is left untouched.
     */
    const original = solid(1, 1, [1, 2, 3, 4])
    encodePng(original)
    expect(Array.from(original.pixels)).toStrictEqual([1, 2, 3, 4])
  })

  it('throws when the bytes are not a PNG', () => {
    /**
     * Scenario: a corrupt baseline is an error, not an empty image.
     */
    expect(() => decodePng(Buffer.from('not a png'))).toThrow()
  })
})

describe('changedPixels', () => {
  const base = solid(2, 2, [100, 100, 100, 255])

  it('is 0 for identical images', () => {
    /**
     * Scenario: rendering the same drawing twice changes nothing.
     */
    expect(changedPixels(base, solid(2, 2, [100, 100, 100, 255]))).toBe(0)
  })

  it('absorbs a move of up to the tolerance on every channel, in either direction', () => {
    /**
     * Scenario: rounding between platforms moves a channel by a few units; that is not a
     * change, whichever image is brighter.
     */
    const near = solid(2, 2, [108, 92, 108, 247])
    expect(changedPixels(base, near)).toBe(0)
    expect(changedPixels(near, base)).toBe(0)
  })

  it.each([0, 1, 2, 3])(
    'counts a pixel whose channel %i moves one unit past the tolerance',
    (channel) => {
      /**
       * Scenario: any one channel, alpha included, past the tolerance marks the pixel.
       */
      const moved = [100, 100, 100, 255]
      moved[channel] = channel === 3 ? 255 - 9 : 100 + 9
      expect(changedPixels(base, withPixel(base, 3, moved))).toBe(1)
      expect(changedPixels(withPixel(base, 3, moved), base)).toBe(1)
    }
  )

  it('counts each changed pixel once, however many channels moved', () => {
    /**
     * Scenario: the count is of pixels, not of channels.
     */
    expect(
      changedPixels(base, withPixel(withPixel(base, 0, [0, 0, 0, 0]), 2, [255, 0, 0, 255]))
    ).toBe(2)
  })

  it('counts every pixel of the larger image when the sizes differ', () => {
    /**
     * Scenario: a baseline of another size is changed everywhere, whichever dimension
     * moved and whichever side is larger.
     */
    expect(changedPixels(solid(2, 2, [0, 0, 0, 0]), solid(3, 2, [0, 0, 0, 0]))).toBe(6)
    expect(changedPixels(solid(3, 2, [0, 0, 0, 0]), solid(2, 2, [0, 0, 0, 0]))).toBe(6)
    expect(changedPixels(solid(2, 2, [0, 0, 0, 0]), solid(2, 3, [0, 0, 0, 0]))).toBe(6)
    expect(changedPixels(solid(2, 3, [0, 0, 0, 0]), solid(2, 2, [0, 0, 0, 0]))).toBe(6)
  })
})

describe('differenceImage', () => {
  const RED = [220, 38, 38, 255]
  const base = solid(2, 2, [10, 20, 30, 255])

  it('stacks the baseline, the render and the render with the changed pixels in red', () => {
    /**
     * Scenario: for equal sizes the image is three panels tall; only the last marks the
     * one pixel that changed, and the first two show the images as they are.
     */
    const current = withPixel(base, 3, [200, 20, 30, 255])
    const image = differenceImage(base, current)
    expect([image.width, image.height]).toStrictEqual([2, 6])
    expect(pixelAt(image, 1, 1)).toStrictEqual([10, 20, 30, 255])
    expect(pixelAt(image, 1, 3)).toStrictEqual([200, 20, 30, 255])
    expect(pixelAt(image, 1, 5)).toStrictEqual(RED)
    expect(pixelAt(image, 0, 0)).toStrictEqual([10, 20, 30, 255])
    expect(pixelAt(image, 0, 2)).toStrictEqual([10, 20, 30, 255])
    expect(pixelAt(image, 0, 4)).toStrictEqual([10, 20, 30, 255])
    expect(pixelAt(image, 1, 4)).toStrictEqual([10, 20, 30, 255])
  })

  it('does not mark a pixel that moved within the tolerance', () => {
    /**
     * Scenario: the marks follow the same tolerance as the count.
     */
    const image = differenceImage(base, withPixel(base, 0, [18, 20, 30, 255]))
    expect(pixelAt(image, 0, 4)).toStrictEqual([18, 20, 30, 255])
  })

  it.each([
    ['wider', solid(3, 1, [200, 200, 200, 255]), 3, 6],
    ['taller', solid(1, 3, [200, 200, 200, 255]), 2, 9]
  ])('fits both images on one canvas when the render is %s', (_name, current, width, height) => {
    /**
     * Scenario: sizes differ, so the canvas is as wide as the wider and each panel as
     * tall as the taller; nothing is marked, and the render shows as it is.
     */
    const image = differenceImage(base, current)
    expect([image.width, image.height]).toStrictEqual([width, height])
    const panel = height / 3
    expect(pixelAt(image, 0, 0)).toStrictEqual([10, 20, 30, 255])
    expect(pixelAt(image, 0, panel)).toStrictEqual([200, 200, 200, 255])
    expect(pixelAt(image, 0, panel * 2)).toStrictEqual([200, 200, 200, 255])
    // Beyond the baseline's 2 by 2 and the render's own size the canvas stays empty.
    expect(pixelAt(image, width - 1, 0)).toStrictEqual(
      width === 3 ? [0, 0, 0, 0] : [10, 20, 30, 255]
    )
  })

  it('marks nothing when only the width differs, nor when only the height differs', () => {
    /**
     * Scenario: a different size is a different drawing, so neither dimension alone may
     * enable the pixel marks, even where the first pixels differ.
     */
    const wide = differenceImage(solid(2, 1, [0, 0, 0, 255]), solid(1, 1, [255, 255, 255, 255]))
    expect(pixelAt(wide, 0, 2)).toStrictEqual([255, 255, 255, 255])
    const tall = differenceImage(solid(1, 1, [0, 0, 0, 255]), solid(1, 2, [255, 255, 255, 255]))
    expect(pixelAt(tall, 0, 4)).toStrictEqual([255, 255, 255, 255])
  })
})
