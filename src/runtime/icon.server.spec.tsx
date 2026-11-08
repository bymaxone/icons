/**
 * Server-render tests for the `Icon` base.
 *
 * Layer: unit, rendered with `react-dom/server` in the Node environment.
 * Goal: pin the exact markup an icon produces, so every root attribute, its order
 * of precedence, the paint, the stroke maths and the accessibility rules are
 * asserted as the HTML a server sends, not as an object that might never render.
 * Mocks: none.
 */

import { renderToStaticMarkup, renderToString } from 'react-dom/server'

import { Icon } from './icon'
import type { IconNode } from './icon-node'

/** A stroke and the spark dot, the one fill a line icon may hold. */
const FIXTURE: IconNode = [
  ['path', { d: 'M4.75 12h14.5' }],
  ['circle', { cx: 18, cy: 6, r: 1, fill: 'currentColor' }]
]

const ROOT = 'xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"'
const STROKE =
  'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"'
const DRAWING =
  '<path d="M4.75 12h14.5"></path><circle cx="18" cy="6" r="1" fill="currentColor"></circle>'

describe('Icon server render: defaults', () => {
  it('renders the grid, the stroke, and a silent decorative icon', () => {
    /**
     * Scenario: with no props an icon is 24 px, drawn on the grid's viewBox with a
     * 1.5 stroke in currentColor and round caps and joins, and is hidden from
     * assistive technology and from keyboard focus.
     */
    expect(renderToStaticMarkup(<Icon iconNode={FIXTURE} />)).toBe(
      `<svg ${ROOT} ${STROKE} focusable="false" aria-hidden="true">${DRAWING}</svg>`
    )
  })

  it('produces the same markup through renderToString', () => {
    /**
     * Scenario: the streaming-free string renderer used for hydration adds no
     * marker of its own to an icon, so both server entry points agree.
     */
    expect(renderToString(<Icon iconNode={FIXTURE} />)).toBe(
      renderToStaticMarkup(<Icon iconNode={FIXTURE} />)
    )
  })

  it('renders an empty drawing as an empty svg', () => {
    /**
     * Scenario: a drawing with no element still carries every root attribute and
     * no stray child.
     */
    expect(renderToStaticMarkup(<Icon iconNode={[]} />)).toBe(
      `<svg ${ROOT} ${STROKE} focusable="false" aria-hidden="true"></svg>`
    )
  })

  it('renders every allowed element from data, in paint order', () => {
    /**
     * Scenario: each of the seven allowed tags becomes its own element with its
     * attributes, in the order the drawing lists them.
     */
    const node: IconNode = [
      ['line', { x1: 4, y1: 4, x2: 20, y2: 20 }],
      ['polyline', { points: '4 4 12 12 20 4' }],
      ['polygon', { points: '12 4 20 20 4 20' }],
      ['ellipse', { cx: 12, cy: 12, rx: 8, ry: 4 }],
      ['rect', { x: 4, y: 4, width: 16, height: 16, rx: 2.5 }],
      ['path', { d: 'M2 2h20', fillRule: 'evenodd', clipRule: 'evenodd' }],
      ['circle', { cx: 12, cy: 12, r: 9.25 }]
    ]
    expect(renderToStaticMarkup(<Icon iconNode={node} />)).toBe(
      `<svg ${ROOT} ${STROKE} focusable="false" aria-hidden="true">` +
        '<line x1="4" y1="4" x2="20" y2="20"></line>' +
        '<polyline points="4 4 12 12 20 4"></polyline>' +
        '<polygon points="12 4 20 20 4 20"></polygon>' +
        '<ellipse cx="12" cy="12" rx="8" ry="4"></ellipse>' +
        '<rect x="4" y="4" width="16" height="16" rx="2.5"></rect>' +
        '<path d="M2 2h20" fill-rule="evenodd" clip-rule="evenodd"></path>' +
        '<circle cx="12" cy="12" r="9.25"></circle></svg>'
    )
  })
})

describe('Icon server render: title', () => {
  it('announces a titled icon as a named image with a title child', () => {
    /**
     * Scenario: a title makes the icon content: `role="img"`, `aria-label` set to
     * the title, a `<title>` first child for the native tooltip, and no
     * `aria-hidden`.
     */
    expect(renderToStaticMarkup(<Icon iconNode={FIXTURE} title="Credits" />)).toBe(
      `<svg ${ROOT} ${STROKE} focusable="false" role="img" aria-label="Credits">` +
        `<title>Credits</title>${DRAWING}</svg>`
    )
  })

  it('escapes the title as text and as an attribute value', () => {
    /**
     * Scenario: the title is consumer text; markup in it must reach the page as
     * escaped characters in both places it is written, never as elements.
     */
    const html = renderToStaticMarkup(
      <Icon iconNode={[]} title={'<script>alert("x")</script> & \'y\''} />
    )
    expect(html).toContain(
      'aria-label="&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#x27;y&#x27;"'
    )
    expect(html).toContain(
      '<title>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#x27;y&#x27;</title>'
    )
    expect(html).not.toContain('<script')
  })

  it('treats an empty title as no title', () => {
    /**
     * Scenario: an empty accessible name is an error, so `title=""` renders the
     * silent default and no empty `<title>` child.
     */
    expect(renderToStaticMarkup(<Icon iconNode={FIXTURE} title="" />)).toBe(
      renderToStaticMarkup(<Icon iconNode={FIXTURE} />)
    )
  })
})

describe('Icon server render: size, stroke and colour', () => {
  it('writes a numeric or string size to width and height', () => {
    /**
     * Scenario: `size` is both dimensions; a number is px and a string is any CSS
     * length, written as given.
     */
    expect(renderToStaticMarkup(<Icon iconNode={[]} size={16} />)).toContain(
      'width="16" height="16"'
    )
    expect(renderToStaticMarkup(<Icon iconNode={[]} size="1.25em" />)).toContain(
      'width="1.25em" height="1.25em"'
    )
  })

  it('writes the requested stroke width, scaled with the drawing by default', () => {
    /**
     * Scenario: without `absoluteStrokeWidth` the width is written as given at
     * every size, so a 48 px icon draws a stroke twice as wide on screen.
     */
    expect(renderToStaticMarkup(<Icon iconNode={[]} size={48} strokeWidth={2} />)).toContain(
      'stroke-width="2"'
    )
  })

  it('divides the stroke by the scale with absoluteStrokeWidth', () => {
    /**
     * Scenario: `absoluteStrokeWidth` writes `strokeWidth * 24 / size`, so the
     * default 1.5 becomes 0.75 at 48 px and renders 1.5 px wide.
     */
    expect(renderToStaticMarkup(<Icon iconNode={[]} size={48} absoluteStrokeWidth />)).toContain(
      'stroke-width="0.75"'
    )
    expect(
      renderToStaticMarkup(<Icon iconNode={[]} size={16} strokeWidth={2} absoluteStrokeWidth />)
    ).toContain('stroke-width="3"')
  })

  it('keeps the stroke width for a CSS-length size even with absoluteStrokeWidth', () => {
    /**
     * Scenario: `size="1em"` has no pixel value to divide by, so the requested
     * width is written unchanged instead of `NaN`.
     */
    expect(renderToStaticMarkup(<Icon iconNode={[]} size="1em" absoluteStrokeWidth />)).toContain(
      'stroke-width="1.5"'
    )
  })

  it('paints the strokes and every currentColor detail in the colour', () => {
    /**
     * Scenario: `color` sets the stroke, and the spark dot drawn in currentColor
     * follows it, so the icon is one colour; an attribute holding any other value
     * is left as drawn.
     */
    const node: IconNode = [
      ['path', { d: 'M4 12h16', fill: 'none' }],
      ['circle', { cx: 18, cy: 6, r: 1, fill: 'currentColor' }]
    ]
    expect(renderToStaticMarkup(<Icon iconNode={node} color="#ff0066" />)).toBe(
      `<svg ${ROOT} fill="none" stroke="#ff0066" stroke-width="1.5" stroke-linecap="round" ` +
        'stroke-linejoin="round" focusable="false" aria-hidden="true">' +
        '<path d="M4 12h16" fill="none"></path>' +
        '<circle cx="18" cy="6" r="1" fill="#ff0066"></circle></svg>'
    )
  })
})

describe('Icon server render: fill paint', () => {
  it('fills a filled icon in the colour and writes no stroke attribute', () => {
    /**
     * Scenario: a filled icon or brand mark is painted by `fill`; the stroke
     * attributes would outline it, so none is written.
     */
    expect(renderToStaticMarkup(<Icon iconNode={FIXTURE} paint="fill" />)).toBe(
      `<svg ${ROOT} fill="currentColor" focusable="false" aria-hidden="true">${DRAWING}</svg>`
    )
    expect(renderToStaticMarkup(<Icon iconNode={[]} paint="fill" color="red" />)).toContain(
      'viewBox="0 0 24 24" fill="red" focusable="false"'
    )
  })

  it('ignores strokeWidth and absoluteStrokeWidth on a filled icon', () => {
    /**
     * Scenario: the stroke props have nothing to act on when the icon is filled,
     * so neither writes an attribute.
     */
    const html = renderToStaticMarkup(
      <Icon iconNode={[]} paint="fill" strokeWidth={3} size={48} absoluteStrokeWidth />
    )
    expect(html).not.toContain('stroke')
  })

  it('strokes the drawing when paint is stroke or absent', () => {
    /**
     * Scenario: `stroke` is the default paint; naming it explicitly renders the
     * same icon.
     */
    expect(renderToStaticMarkup(<Icon iconNode={FIXTURE} paint="stroke" />)).toBe(
      renderToStaticMarkup(<Icon iconNode={FIXTURE} />)
    )
  })
})
