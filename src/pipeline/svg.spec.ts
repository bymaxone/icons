/**
 * Unit tests for reading and writing SVG text.
 *
 * Layer: unit, with SVGO.
 * Goal: prove the parse changes nothing, pin the formatter's output for each kind (paint
 * stripped, the spark dot kept, precision, colours, root attributes, layout), and pin the
 * serialiser the static outputs are written with.
 * Mocks: none.
 */

import { isSparkDot, normalizeSvg, parseSvg, serializeContainer, svgRoot, tagBody } from './svg.ts'

const STROKE_ROOT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
const FILL_ROOT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">'

describe('parseSvg', () => {
  it('returns the document as written, without rounding, reordering or removing', () => {
    /**
     * Scenario: the lint must see what the author wrote, so the parse runs no SVGO
     * optimisation: the declaration, the comment, the title, the extra decimals and the
     * attribute order all survive.
     */
    const nodes = parseSvg(
      '<?xml version="1.0"?><svg id="a" viewBox="0 0 24 24"><!-- note --><title>t</title><rect y="1.23456" x="2"/></svg>'
    )
    expect(nodes).toStrictEqual([
      { type: 'instruction' },
      {
        type: 'element',
        name: 'svg',
        attributes: { id: 'a', viewBox: '0 0 24 24' },
        children: [
          { type: 'comment' },
          { type: 'element', name: 'title', attributes: {}, children: [{ type: 'text' }] },
          { type: 'element', name: 'rect', attributes: { y: '1.23456', x: '2' }, children: [] }
        ]
      }
    ])
  })

  it('throws on text that is not well-formed XML', () => {
    /**
     * Scenario: a truncated file is a parse failure the lint reports, never a drawing.
     */
    expect(() => parseSvg('<svg><path d="M0 0"></svg>')).toThrow()
  })
})

describe('svgRoot', () => {
  it('returns the single <svg> element of a document', () => {
    /**
     * Scenario: a source file holds one `<svg>` and nothing else at the top level.
     */
    const [root] = parseSvg('<svg><path d="M2 2h4"/></svg>')
    expect(svgRoot(parseSvg('<svg><path d="M2 2h4"/></svg>'))).toStrictEqual(root)
  })

  it.each([
    ['another root element', '<g/>'],
    ['a declaration before the root', '<?xml version="1.0"?><svg/>'],
    ['a comment after the root', '<svg/><!-- x -->']
  ])('returns undefined for %s', (_label, text) => {
    /**
     * Scenario: anything besides one `<svg>` at the top level is not a drawing file.
     */
    expect(svgRoot(parseSvg(text))).toBeUndefined()
  })

  it('returns undefined for an empty document', () => {
    /**
     * Scenario: a file with nothing in it has no root.
     */
    expect(svgRoot([])).toBeUndefined()
  })
})

describe('isSparkDot', () => {
  it('recognises a circle of radius 1 filled with currentColor', () => {
    /**
     * Scenario: the spark dot is the one filled detail a line icon may carry.
     */
    expect(isSparkDot('circle', { cx: '19', cy: '5', r: '1', fill: 'currentColor' })).toBe(true)
  })

  it.each([
    ['ellipse', { r: '1', fill: 'currentColor' }],
    ['circle', { r: '1.5', fill: 'currentColor' }],
    ['circle', { r: '1', fill: '#000000' }],
    ['circle', { r: '1' }]
  ])('refuses %p with %p', (name, attributes) => {
    /**
     * Scenario: another element, another radius or another fill is not the spark dot.
     */
    expect(isSparkDot(name, attributes)).toBe(false)
  })
})

describe('normalizeSvg', () => {
  it('writes the stroked root and strips paint from a line icon, keeping the spark dot', () => {
    /**
     * Scenario: the root owns the stroke, so every stroke attribute and every fill
     * control of an element goes, except the spark dot's fill; the author's root
     * attributes are replaced by the fixed set.
     */
    const source =
      '<svg viewBox="0 0 48 48" fill="red"><path d="M 4 12 L 20 12" stroke="red" stroke-width="3" fill="blue" fill-rule="evenodd" clip-rule="evenodd"/><circle cx="19" cy="5" r="1" fill="currentColor" fill-rule="evenodd"/></svg>'
    expect(normalizeSvg(source, 'line')).toBe(
      `${STROKE_ROOT}\n  <path d="M4 12h16"/>\n  <circle cx="19" cy="5" r="1" fill="currentColor"/>\n</svg>\n`
    )
  })

  it('treats a 16 px master as stroked', () => {
    /**
     * Scenario: the sm masters are line drawings, painted like the line icons.
     */
    expect(normalizeSvg('<svg><path d="M4 12h16" fill="red"/></svg>', 'sm')).toBe(
      `${STROKE_ROOT}\n  <path d="M4 12h16"/>\n</svg>\n`
    )
  })

  it('keeps the fill controls of a filled icon and strips its stroke attributes', () => {
    /**
     * Scenario: a filled shape knocks out its interior with fill-rule; it has no stroke.
     */
    const source =
      '<svg><path d="M2 2h8v8H2z" fill-rule="evenodd" clip-rule="evenodd" stroke="red" stroke-linecap="square"/></svg>'
    expect(normalizeSvg(source, 'filled')).toBe(
      `${FILL_ROOT}\n  <path fill-rule="evenodd" d="M2 2h8v8H2z" clip-rule="evenodd"/>\n</svg>\n`
    )
  })

  it('keeps a brand colour as #rrggbb and drops a fill equal to the root', () => {
    /**
     * Scenario: a multicolour mark keeps its official colours, written as six-digit hex
     * (never shortened to #f00 or red); a fill of currentColor repeats the root and goes.
     */
    const source =
      '<svg><path d="M2 2h4" fill="#FF0000"/><path d="M8 8h4" fill="currentColor"/></svg>'
    expect(normalizeSvg(source, 'brands')).toBe(
      `${FILL_ROOT}\n  <path fill="#ff0000" d="M2 2h4"/>\n  <path d="M8 8h4"/>\n</svg>\n`
    )
  })

  it('rounds to three decimals and keeps shapes as shapes', () => {
    /**
     * Scenario: numbers carry at most three decimals; a circle and a rect are not turned
     * into paths, and two paths are not merged into one.
     */
    const source =
      '<svg><circle cx="12.12345" cy="12" r="4"/><rect x="2" y="2" width="4" height="4"/><path d="M2 2h2"/><path d="M6 6h2"/></svg>'
    expect(normalizeSvg(source, 'line')).toBe(
      `${STROKE_ROOT}\n  <circle cx="12.123" cy="12" r="4"/>\n  <rect width="4" height="4" x="2" y="2"/>\n  <path d="M2 2h2"/>\n  <path d="M6 6h2"/>\n</svg>\n`
    )
  })

  it('removes the declaration, comments and editor data, and is stable on its own output', () => {
    /**
     * Scenario: the formatter's output is the canonical file, so formatting it again
     * changes nothing.
     */
    const source = '<?xml version="1.0"?><!-- exported --><svg><path d="M2 2h4"/></svg>'
    const once = normalizeSvg(source, 'line')
    expect(once).toBe(`${STROKE_ROOT}\n  <path d="M2 2h4"/>\n</svg>\n`)
    expect(normalizeSvg(once, 'line')).toBe(once)
  })

  it('throws on text that is not well-formed XML', () => {
    /**
     * Scenario: the formatter never writes over a file it cannot read.
     */
    expect(() => normalizeSvg('<svg>', 'line')).toThrow()
  })
})

describe('tagBody and serializeContainer', () => {
  it('writes attributes in their order, escaping what XML requires', () => {
    /**
     * Scenario: a value with `&`, `<` or `"` must not end the attribute or start markup.
     */
    expect(tagBody('path', { d: 'M0 0', 'data-x': 'a&b<c"d' })).toBe(
      'path d="M0 0" data-x="a&amp;b&lt;c&quot;d"'
    )
    expect(tagBody('g', {})).toBe('g')
  })

  it('writes one element per line inside the container, at the given indent', () => {
    /**
     * Scenario: the sprite indents each symbol by two spaces and its elements by four.
     */
    const elements = [
      { tag: 'path', attributes: { d: 'M2 2h4' } },
      { tag: 'circle', attributes: { cx: '12', cy: '12', r: '1' } }
    ]
    expect(serializeContainer('symbol', { id: 'bx-a' }, elements, '  ')).toBe(
      '  <symbol id="bx-a">\n    <path d="M2 2h4"/>\n    <circle cx="12" cy="12" r="1"/>\n  </symbol>'
    )
    expect(serializeContainer('svg', {}, [])).toBe('<svg>\n</svg>')
  })
})
