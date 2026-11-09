/**
 * Unit tests for the contact sheet.
 *
 * Layer: unit, with resvg for the PNG.
 * Goal: pin the sizes, the two Studio pages and their seven colours, the rows a set
 * yields, the layout of every cell, and that the render is a PNG of the sheet's size.
 * Mocks: none.
 */

import { brandMeta, drawing, iconMeta, sources } from './__tests__/support.ts'
import {
  CELL,
  composeContactSheet,
  HEADER_HEIGHT,
  LABEL_WIDTH,
  renderPng,
  SHEET_SIZES,
  SHEET_THEMES,
  sheetRows
} from './contact-sheet.ts'
import type { SheetRow } from './contact-sheet.ts'
import { lintSources } from './lint.ts'

const FONT = 'font-family="Helvetica, Arial, sans-serif" font-size="12"'
const STROKE =
  'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"'

const ROW: SheetRow = {
  label: 'ring & <co> (line)',
  kind: 'line',
  elements: [{ tag: 'circle', attributes: { cx: '12', cy: '12', r: '7.25' } }]
}
const BRAND_ROW: SheetRow = {
  label: 'acme (brand)',
  kind: 'brands',
  elements: [{ tag: 'path', attributes: { d: 'M4 4h16v16H4z' } }]
}

describe('the sheet constants', () => {
  it('shows every drawing at 16, 20, 24 and 48 px', () => {
    /**
     * Scenario: a drawing batch is reviewed at these four sizes (spec section 16).
     */
    expect(SHEET_SIZES).toStrictEqual([16, 20, 24, 48])
    expect([CELL, LABEL_WIDTH, HEADER_HEIGHT]).toStrictEqual([56, 200, 48])
  })

  it('pins the Studio light and dark pages, the ink and the six accents', () => {
    /**
     * Scenario: the colours are the Studio design system's, so a drawing is judged on
     * the surfaces it will appear on.
     */
    expect(SHEET_THEMES).toStrictEqual([
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
        ]
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
        ]
      }
    ])
  })
})

describe('sheetRows', () => {
  it('lists every icon variant in name order, then every brand', () => {
    /**
     * Scenario: each drawing is one row, labelled with its name and variant.
     */
    const { set } = lintSources(
      sources({
        line: { 'ring.svg': drawing('line', '<circle cx="12" cy="12" r="7"/>') },
        filled: { 'ring.svg': drawing('filled', '<circle cx="12" cy="12" r="8"/>') },
        brands: { 'acme.svg': drawing('brands', '<path d="M4 4h16v16H4z"/>') },
        meta: { 'ring.json': iconMeta({ variants: ['line', 'filled'] }), 'acme.json': brandMeta() }
      })
    )
    expect(sheetRows(set)).toStrictEqual([
      {
        label: 'ring (line)',
        kind: 'line',
        elements: [{ tag: 'circle', attributes: { cx: '12', cy: '12', r: '7' } }]
      },
      {
        label: 'ring (filled)',
        kind: 'filled',
        elements: [{ tag: 'circle', attributes: { cx: '12', cy: '12', r: '8' } }]
      },
      {
        label: 'acme (brand)',
        kind: 'brands',
        elements: [{ tag: 'path', attributes: { d: 'M4 4h16v16H4z' } }]
      }
    ])
  })
})

describe('composeContactSheet', () => {
  it('lays out the header over both pages, with a note when there is no drawing', () => {
    /**
     * Scenario: 2 pages x 7 colours x 4 sizes of 56 px cells beside a 200 px label column;
     * each colour is named over its four sizes. With no drawing the sheet still renders,
     * one row tall, and says so.
     */
    const lines = composeContactSheet([]).split('\n')
    expect(lines).toHaveLength(77)
    expect(lines[0]).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="3336" height="104" viewBox="0 0 3336 104">'
    )
    expect(lines[1]).toBe('<rect width="3336" height="104" fill="#ffffff"/>')
    expect(lines[2]).toBe('<rect x="200" y="0" width="1568" height="104" fill="#e9eff3"/>')
    expect(lines.slice(3, 8)).toStrictEqual([
      `<text x="204" y="18" fill="#0d1b24" ${FONT}>light ink</text>`,
      `<text x="204" y="40" fill="#0d1b24" ${FONT}>16</text>`,
      `<text x="260" y="40" fill="#0d1b24" ${FONT}>20</text>`,
      `<text x="316" y="40" fill="#0d1b24" ${FONT}>24</text>`,
      `<text x="372" y="40" fill="#0d1b24" ${FONT}>48</text>`
    ])
    expect(lines[8]).toBe(`<text x="428" y="18" fill="#f2c200" ${FONT}>light yellow</text>`)
    expect(lines[38]).toBe('<rect x="1768" y="0" width="1568" height="104" fill="#101114"/>')
    expect(lines[39]).toBe(`<text x="1772" y="18" fill="#ecf3f7" ${FONT}>dark ink</text>`)
    expect(lines[73]).toBe(`<text x="3284" y="40" fill="#c2a4ff" ${FONT}>48</text>`)
    expect(lines.slice(74)).toStrictEqual([
      `<text x="8" y="80" fill="#0d1b24" ${FONT}>No drawing yet.</text>`,
      '</svg>',
      ''
    ])
  })

  it('draws every row at every size and colour, centred in its cell', () => {
    /**
     * Scenario: each row repeats its drawing 56 times, as a group moved into its cell and
     * scaled from the 24 px master to the cell's px size, coloured through `color` so
     * currentColor paints it. Nothing else is written: the note is for an empty sheet only.
     */
    const text = composeContactSheet([ROW, BRAND_ROW])
    expect(
      text.startsWith(
        '<svg xmlns="http://www.w3.org/2000/svg" width="3336" height="160" viewBox="0 0 3336 160">'
      )
    ).toBe(true)
    // 2 root lines, 72 header lines, then per row a label and 56 drawings of 3 lines.
    expect(text.split('\n')).toHaveLength(2 + 72 + 2 * (1 + 56 * 3) + 2)
    expect(text).not.toContain('No drawing yet.')
    expect(text.match(/<g transform=/g)).toHaveLength(112)
    expect(text).toContain(
      `<text x="8" y="80" fill="#0d1b24" ${FONT}>ring &amp; &lt;co> (line)</text>`
    )
    expect(text).toContain(`<text x="8" y="136" fill="#0d1b24" ${FONT}>acme (brand)</text>`)
    expect(text).toContain(
      `<g transform="translate(220 68) scale(0.6666666666666666)" color="#0d1b24" ${STROKE}>\n  <circle cx="12" cy="12" r="7.25"/>\n</g>`
    )
    // The dark page's yellow at 20 px: cell 28 + 4 + 1 = 33, centred 18 px into it.
    expect(text).toContain(
      `<g transform="translate(2066 66) scale(0.8333333333333334)" color="#ffd84d" ${STROKE}>`
    )
    expect(text).toContain(
      '<g transform="translate(3284 108) scale(2)" color="#c2a4ff" fill="currentColor">\n  <path d="M4 4h16v16H4z"/>\n</g>'
    )
  })
})

describe('renderPng', () => {
  it('renders the sheet as a PNG of the sheet size, one pixel per px', () => {
    /**
     * Scenario: the file opens as a PNG, and its pixel size is the sheet's, so a 16 px
     * cell shows 16 device pixels.
     */
    const png = renderPng(composeContactSheet([ROW]))
    expect(png.subarray(0, 8)).toStrictEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
    expect(png.readUInt32BE(16)).toBe(3336)
    expect(png.readUInt32BE(20)).toBe(104)
  })
})
