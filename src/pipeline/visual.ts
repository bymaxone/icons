/**
 * @fileoverview Visual regression: every drawing is rendered at 16, 20, 24 and 48 px on the
 * light and the dark Studio page, as one strip, and compared pixel by pixel with the strip
 * committed under `visual/`. A drawing that changes, appears or disappears without its
 * baseline changing too fails the check; the difference is written as an image.
 * @layer Pipeline
 */

import { PNG } from 'pngjs'

import { CELL, SHEET_SIZES, SHEET_THEMES, placedDrawing } from './contact-sheet.ts'
import type { SheetRow } from './contact-sheet.ts'
import { drawnVariants } from './icon-set.ts'
import type { IconSet } from './icon-set.ts'
import { renderRgba } from './raster.ts'
import type { RgbaImage } from './raster.ts'

/** The directory the baselines are committed in, from the repository root. */
export const BASELINE_DIRECTORY = 'visual'

/**
 * How far a channel may move before a pixel counts as changed, out of 255. Rendering the
 * same drawing twice gives the same bytes; the margin absorbs rounding between platforms,
 * while a moved or reshaped stroke changes whole pixels by far more.
 */
export const CHANNEL_TOLERANCE = 8

/** One drawing the check renders, and the baseline it is held to. */
export interface VisualTarget extends SheetRow {
  /** The icon's or brand's name. */
  readonly name: string
  /** `<kind>/<name>.png`, under the baseline directory. */
  readonly file: string
}

/**
 * Every drawing of a set, icon variants in name order and then brand marks.
 *
 * @param set - The icon set.
 * @returns The targets.
 */
export function visualTargets(set: IconSet): VisualTarget[] {
  return [
    ...set.icons.flatMap((icon) =>
      drawnVariants(icon).map(([variant, drawing]) => ({
        name: icon.name,
        label: `${icon.name} (${variant})`,
        kind: variant,
        elements: drawing.elements,
        file: `${variant}/${icon.name}.png`
      }))
    ),
    ...set.brands.map((brand) => ({
      name: brand.name,
      label: `${brand.name} (brand)`,
      kind: 'brands' as const,
      elements: brand.drawing.elements,
      file: `brands/${brand.name}.png`
    }))
  ]
}

/**
 * The strip a drawing is held to: each size on the light page, then each size on the dark
 * page, painted in each page's ink, one `CELL` square apiece.
 *
 * @param target - The drawing.
 * @returns The strip's SVG text.
 */
export function stripSvg(target: SheetRow): string {
  const cells = SHEET_THEMES.flatMap((theme, t) =>
    SHEET_SIZES.map((size, s) => {
      const x = (t * SHEET_SIZES.length + s) * CELL
      const ink = theme.colours[0][1]
      return [
        `<rect x="${x}" y="0" width="${CELL}" height="${CELL}" fill="${theme.background}"/>`,
        placedDrawing(target, x, 0, size, ink)
      ].join('')
    })
  )
  const width = SHEET_THEMES.length * SHEET_SIZES.length * CELL
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${CELL}" viewBox="0 0 ${width} ${CELL}">`,
    ...cells,
    '</svg>',
    ''
  ].join('\n')
}

/**
 * Renders a drawing's strip.
 *
 * @param target - The drawing.
 * @returns The rendered strip.
 */
export function renderStrip(target: SheetRow): RgbaImage {
  return renderRgba(stripSvg(target))
}

/**
 * Encodes an image as PNG.
 *
 * @param image - The image.
 * @returns The PNG bytes.
 */
export function encodePng(image: RgbaImage): Buffer {
  const png = new PNG({ width: image.width, height: image.height })
  png.data = Buffer.from(image.pixels)
  return PNG.sync.write(png)
}

/**
 * Decodes PNG bytes into straight RGBA.
 *
 * @param bytes - The PNG file.
 * @returns The image.
 * @throws {Error} When the bytes are not a PNG.
 */
export function decodePng(bytes: Buffer): RgbaImage {
  const png = PNG.sync.read(bytes)
  return { width: png.width, height: png.height, pixels: new Uint8Array(png.data) }
}

/** Whether a pixel differs between two images of the same size beyond the tolerance. */
function pixelDiffers(a: RgbaImage, b: RgbaImage, pixel: number): boolean {
  for (let channel = 0; channel < 4; channel++) {
    const index = pixel * 4 + channel
    if (Math.abs(Number(a.pixels.at(index)) - Number(b.pixels.at(index))) > CHANNEL_TOLERANCE) {
      return true
    }
  }
  return false
}

/**
 * Counts the pixels that differ between a baseline and a fresh render. Images of different
 * sizes differ everywhere.
 *
 * @param baseline - The committed image.
 * @param current - The fresh render.
 * @returns The number of changed pixels.
 */
export function changedPixels(baseline: RgbaImage, current: RgbaImage): number {
  if (baseline.width !== current.width || baseline.height !== current.height) {
    return Math.max(baseline.width * baseline.height, current.width * current.height)
  }
  let changed = 0
  for (let pixel = 0; pixel < current.width * current.height; pixel++) {
    if (pixelDiffers(baseline, current, pixel)) changed++
  }
  return changed
}

/** The marker colour of a changed pixel in the difference panel. */
const CHANGED = [220, 38, 38, 255] as const

/**
 * The difference as one image: the baseline on top, the fresh render in the middle, and
 * the render again at the bottom with every changed pixel in red. Images of different sizes
 * are placed on a canvas that fits both, and the panel shows the render alone.
 *
 * @param baseline - The committed image.
 * @param current - The fresh render.
 * @returns The difference image.
 */
export function differenceImage(baseline: RgbaImage, current: RgbaImage): RgbaImage {
  const width = Math.max(baseline.width, current.width)
  const panel = Math.max(baseline.height, current.height)
  const pixels = new Uint8Array(width * panel * 3 * 4)
  const sameSize = baseline.width === current.width && baseline.height === current.height
  const paste = (image: RgbaImage, top: number, mark: boolean): void => {
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const from = (y * image.width + x) * 4
        const to = ((top + y) * width + x) * 4
        const changed = mark && sameSize && pixelDiffers(baseline, current, y * image.width + x)
        const colour = changed ? CHANGED : image.pixels.subarray(from, from + 4)
        pixels.set(colour, to)
      }
    }
  }
  paste(baseline, 0, false)
  paste(current, panel, false)
  paste(current, panel * 2, true)
  return { width, height: panel * 3, pixels }
}
