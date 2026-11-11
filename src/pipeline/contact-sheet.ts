/**
 * @fileoverview The contact sheet a drawing batch is reviewed on: every drawing at 16, 20,
 * 24 and 48 px, on the light and the dark Studio page, in the ink colour and in each of
 * the six Studio accents, rendered to PNG with resvg at one device pixel per CSS pixel.
 * @layer Pipeline
 */

import { Resvg } from '@resvg/resvg-js'

import { ICON_GRID } from '../meta/icon-grid.ts'
import { drawnVariants } from './icon-set.ts'
import type { IconSet } from './icon-set.ts'
import { rootAttributes } from './svg-kind.ts'
import type { SvgKind } from './svg-kind.ts'
import { serializeContainer, tagBody } from './svg.ts'
import type { DrawingElement } from './svg.ts'

/** The sizes every drawing is shown at, in px. */
export const SHEET_SIZES = [16, 20, 24, 48] as const

/** A page the drawings are shown on: its background and the colours drawn on it. */
export interface SheetTheme {
  readonly name: string
  readonly background: string
  /** The colour name, then its value: the ink first, then the six accents. */
  readonly colours: readonly [ink: SheetColour, ...accents: SheetColour[]]
  /** The colour a drawing under review is outlined in on the family sheet. */
  readonly outline: string
}

/** A colour's name and value. */
export type SheetColour = readonly [name: string, value: string]

/**
 * The Studio's two pages and the colours drawn on each, from the Studio design system
 * (`bymax-studio-web` `docs/preview/frontend/design-system.html`, direction A): the page
 * and ink tokens, and per accent the light `--accent` and the dark `--vivid` value of the
 * tinted-button variants, which are the ones the Studio paints with.
 */
export const SHEET_THEMES: readonly SheetTheme[] = [
  {
    name: 'light',
    background: '#e9eff3',
    colours: [
      ['ink', '#0d1b24'],
      ['yellow', '#f2c200'],
      ['orange', '#c2461c'],
      ['red', '#c0283a'],
      ['green', '#2f5a24'],
      ['blue', '#2450b8'],
      ['lilac', '#5e3fb0']
    ],
    outline: '#2450b8'
  },
  {
    name: 'dark',
    background: '#101114',
    colours: [
      ['ink', '#ecf3f7'],
      ['yellow', '#ffd84d'],
      ['orange', '#ff8a5c'],
      ['red', '#ff6b78'],
      ['green', '#8fd67a'],
      ['blue', '#7fa6ff'],
      ['lilac', '#c2a4ff']
    ],
    outline: '#7fa6ff'
  }
]

/** One row of the sheet: a label and a drawing. */
export interface SheetRow {
  readonly label: string
  readonly kind: SvgKind
  readonly elements: readonly DrawingElement[]
}

/** The side of the square cell each drawing is centred in, in px. */
export const CELL = 56
/** The width of the label column, in px. */
export const LABEL_WIDTH = 200
/** The height of the two header rows together, in px. */
export const HEADER_HEIGHT = 48

const FONT = 'font-family="Helvetica, Arial, sans-serif" font-size="12"'
/** The ink and the six accents, which every theme lists in this order. */
const COLOURS_PER_THEME = 7
const CELLS_PER_THEME = SHEET_SIZES.length * COLOURS_PER_THEME

/** The x of a cell's left edge, by theme, colour and size index. */
const cellX = (theme: number, colour: number, size: number): number =>
  LABEL_WIDTH + (theme * CELLS_PER_THEME + colour * SHEET_SIZES.length + size) * CELL

/** A text element, with its content escaped. */
function text(x: number, y: number, fill: string, content: string): string {
  const escaped = content.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  return `<text x="${x}" y="${y}" fill="${fill}" ${FONT}>${escaped}</text>`
}

/** The rows of the sheet: every icon variant in name order, then every brand mark. */
export function sheetRows(set: IconSet): SheetRow[] {
  return [
    ...set.icons.flatMap((icon) =>
      drawnVariants(icon).map(([variant, drawing]) => ({
        label: `${icon.name} (${variant})`,
        kind: variant,
        elements: drawing.elements
      }))
    ),
    ...set.brands.map((brand) => ({
      label: `${brand.name} (brand)`,
      kind: 'brands' as const,
      elements: brand.drawing.elements
    }))
  ]
}

/** The theme panels behind every row, and the two header rows above them. */
function panels(height: number): string[] {
  return SHEET_THEMES.flatMap((theme, t) => [
    `<rect x="${cellX(t, 0, 0)}" y="0" width="${CELLS_PER_THEME * CELL}" height="${height}" fill="${theme.background}"/>`,
    ...theme.colours.flatMap(([name, value], c) => [
      text(cellX(t, c, 0) + 4, 18, value, `${theme.name} ${name}`),
      ...SHEET_SIZES.map((size, s) => text(cellX(t, c, s) + 4, 40, value, String(size)))
    ])
  ])
}

/**
 * One drawing at one size and colour, centred in a `CELL` square: a group moved into place
 * and scaled from the 24 px master, which scales the stroke as a rendered icon does. A
 * group rather than a nested `<svg>`: resvg aborts the whole process, instead of throwing,
 * on a nested `<svg>` that lies outside the sheet.
 *
 * @param row - The drawing.
 * @param x - The cell's left edge.
 * @param y - The cell's top edge.
 * @param size - The size the drawing is shown at, in px.
 * @param colour - The colour it is painted in.
 * @returns The group's SVG text.
 */
export function placedDrawing(
  row: SheetRow,
  x: number,
  y: number,
  size: number,
  colour: string
): string {
  const {
    xmlns: _xmlns,
    width: _width,
    height: _height,
    viewBox: _viewBox,
    ...paint
  } = rootAttributes(row.kind)
  const offset = (CELL - size) / 2
  const attributes = {
    transform: `translate(${x + offset} ${y + offset}) scale(${size / ICON_GRID.size})`,
    color: colour,
    ...paint
  }
  return serializeContainer('g', attributes, row.elements)
}

/**
 * Composes the contact sheet as one SVG document.
 *
 * @param rows - The drawings, one per row.
 * @returns The sheet's SVG text. With no row it holds the header and a note.
 */
export function composeContactSheet(rows: readonly SheetRow[]): string {
  const width = cellX(SHEET_THEMES.length, 0, 0)
  const height = HEADER_HEIGHT + Math.max(rows.length, 1) * CELL
  const body = rows.flatMap((row, r) => {
    const y = HEADER_HEIGHT + r * CELL
    return [
      text(8, y + CELL / 2 + 4, '#0d1b24', row.label),
      ...SHEET_THEMES.flatMap((theme, t) =>
        theme.colours.flatMap(([, value], c) =>
          SHEET_SIZES.map((size, s) => placedDrawing(row, cellX(t, c, s), y, size, value))
        )
      )
    ]
  })
  const note =
    rows.length === 0 ? [text(8, HEADER_HEIGHT + CELL / 2 + 4, '#0d1b24', 'No drawing yet.')] : []
  const root = tagBody('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: String(width),
    height: String(height),
    viewBox: `0 0 ${width} ${height}`
  })
  return [
    `<${root}>`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    ...panels(height),
    ...note,
    ...body,
    '</svg>',
    ''
  ].join('\n')
}

/**
 * Renders a sheet to PNG, one device pixel per CSS pixel, so each size shows the pixels it
 * really gets.
 *
 * @param svg - The sheet's SVG text.
 * @returns The PNG bytes.
 */
export function renderPng(svg: string): Buffer {
  // resvg loads the system fonts by default, which is what draws the labels.
  return new Resvg(svg).render().asPng()
}
