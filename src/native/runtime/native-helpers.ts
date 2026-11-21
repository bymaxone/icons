/**
 * @fileoverview The naming, stroke and view box helpers the React Native runtime needs.
 * Each is a copy of the web runtime's, kept here so `./runtime` exposes no extra surface;
 * `helpers-parity.spec.ts` runs the same cases through both and fails if they drift.
 * @layer Runtime
 */

import { ICON_GRID } from '@bymax-one/icons/grid'

/**
 * Kebab-case: lower-case letters and digits in words joined by single hyphens, starting
 * with a letter. Copy of `ICON_NAME` in `src/runtime/create-icon.ts`; keep both in step,
 * the parity spec checks them.
 */
export const ICON_NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

/**
 * The component name for an icon name: each word capitalised, then `Icon`, so
 * `lightning-filled` becomes `LightningFilledIcon`. Copy of `toComponentName` in
 * `src/runtime/create-icon.ts`; keep both in step, the parity spec checks them.
 *
 * @param name - The kebab-case icon name.
 * @returns The component name.
 */
export function toComponentName(name: string): string {
  const words = name.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  return `${words.join('')}Icon`
}

/**
 * Resolves the stroke width a native icon writes: read in dp at the drawing's master size,
 * scaled to the 24-unit grid for a 16 master, or divided by the rendered scale with
 * `absolute` so the stroke is `strokeWidth` dp wide at every size. A width that is not a
 * finite number stays so (`NaN`, `Infinity`). Copy of `resolveStrokeWidth` in
 * `src/runtime/stroke.ts` for numbers; keep both in step, the parity spec checks them.
 *
 * @param strokeWidth - The requested width, in dp at the master size.
 * @param size - The rendered width and height.
 * @param absolute - Whether the visual width stays constant across sizes.
 * @param masterSize - The dp size the drawing is drawn for. Default 24.
 * @returns The width to write on the root.
 */
export function resolveStrokeWidth(
  strokeWidth: number,
  size: number,
  absolute: boolean,
  masterSize: number = ICON_GRID.size
): number {
  if (absolute && Number.isFinite(size) && size > 0) return (strokeWidth * ICON_GRID.size) / size
  if (masterSize === ICON_GRID.size) return strokeWidth
  return (strokeWidth * ICON_GRID.size) / masterSize
}

/** A parsed `viewBox`: the size of the drawing's own coordinate system. */
export interface NativeViewBox {
  readonly width: number
  readonly height: number
}

const NUMBER = '[-+]?(?:\\d*\\.\\d+|\\d+\\.?)(?:[eE][-+]?\\d+)?'
const SEPARATOR = '(?:\\s*,\\s*|\\s+)'

/**
 * Four numbers joined by whitespace or one comma, with whitespace allowed at either end.
 * Same grammar as `VIEW_BOX` in `src/runtime/view-box.ts`; the parity spec checks them.
 */
const VIEW_BOX = new RegExp(
  `^\\s*(${NUMBER})${SEPARATOR}(${NUMBER})${SEPARATOR}(${NUMBER})${SEPARATOR}(${NUMBER})\\s*$`
)

/**
 * Parses a `viewBox` of four numbers. Copy of `parseViewBox` in `src/runtime/view-box.ts`
 * reduced to the size; keep both in step, the parity spec checks them.
 *
 * @param text - The attribute value, such as `0 0 513 342`.
 * @returns The width and height, or `undefined` when it is not four finite numbers with a
 *   positive width and height.
 */
export function parseViewBox(text: string): NativeViewBox | undefined {
  const parts = VIEW_BOX.exec(text)?.slice(1)
  if (parts === undefined) return undefined
  const numbers = parts.map(Number)
  if (!numbers.every(Number.isFinite)) return undefined
  const [, , width, height] = numbers as [number, number, number, number]
  return width > 0 && height > 0 ? { width, height } : undefined
}

/** The height of a flag with no `size`, which makes a 3:2 flag 24 by 16. */
export const FLAG_DEFAULT_SIZE = 16

/**
 * The width of a flag `size` high in a view box of this width and height, rounded to three
 * decimals. Copy of the width maths in `src/runtime/flag.ts`; the parity spec checks the
 * rendered width of both.
 *
 * @param size - The flag height.
 * @param boxWidth - The view box width.
 * @param boxHeight - The view box height.
 * @returns The flag width.
 */
export function flagWidth(size: number, boxWidth: number, boxHeight: number): number {
  return Math.round(((size * boxWidth) / boxHeight) * 1000) / 1000
}
