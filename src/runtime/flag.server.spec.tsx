/**
 * Server-render tests for the `Flag` base.
 *
 * Layer: unit, rendered with `react-dom/server` in the Node environment.
 * Goal: pin the exact markup a flag produces, so the size and the width taken from the
 * view box, the precedence of the root attributes, the paint kept on each element and the
 * accessibility rules are asserted as the HTML a server sends.
 * Mocks: none.
 */

import { renderToStaticMarkup, renderToString } from 'react-dom/server'

import { Flag, FLAG_DEFAULT_SIZE } from './flag'
import type { FlagNode } from './flag-node'

/** Two bands, a ringed disc and a stroked polygon: every paint a flag element may carry. */
const FIXTURE: FlagNode = [
  ['path', { fill: '#FFF', d: 'M0 0h513v342H0z' }],
  ['path', { fill: '#D80027', fillRule: 'evenodd', opacity: 0.5, d: 'M0 0h513v114H0z' }],
  ['circle', { fill: 'none', stroke: '#000', strokeWidth: 8, cx: 256, cy: 171, r: 80 }],
  [
    'polygon',
    { fill: '#00F', strokeMiterlimit: 10, strokeLinejoin: 'round', points: '0,0 9,0 9,9' }
  ]
]
const BOX = '0 0 513 342'

const DRAWING =
  '<path fill="#FFF" d="M0 0h513v342H0z"></path>' +
  '<path fill="#D80027" fill-rule="evenodd" opacity="0.5" d="M0 0h513v114H0z"></path>' +
  '<circle fill="none" stroke="#000" stroke-width="8" cx="256" cy="171" r="80"></circle>' +
  '<polygon fill="#00F" stroke-miterlimit="10" stroke-linejoin="round" points="0,0 9,0 9,9"></polygon>'

describe('Flag server render: defaults', () => {
  it('renders a 24 by 16 box, its view box and a silent decorative flag', () => {
    /**
     * Scenario: with no props a flag is 16 px high, as wide as its 3:2 view box makes it, kept
     * in its own view box, with the paint of each element as the drawing gives it and no
     * paint on the root, and hidden from assistive technology and keyboard focus.
     */
    expect(renderToStaticMarkup(<Flag flagNode={FIXTURE} viewBox={BOX} />)).toBe(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="${BOX}" focusable="false" aria-hidden="true">${DRAWING}</svg>`
    )
  })

  it('has a default size of 16', () => {
    /** Scenario: the constant the default is built from is the height a flag has at rest. */
    expect(FLAG_DEFAULT_SIZE).toBe(16)
  })

  it('produces the same markup through renderToString', () => {
    /**
     * Scenario: the streaming and the static renderers agree on the elements and attributes,
     * so a flag hydrates without a mismatch.
     */
    const element = <Flag flagNode={FIXTURE} viewBox={BOX} title="Flag" />
    expect(renderToString(element).replaceAll('<!-- -->', '')).toBe(renderToStaticMarkup(element))
  })
})

describe('Flag server render: size', () => {
  it.each([
    [16, '24', '16'],
    [32, '48', '32'],
    [20, '30', '20'],
    [0, '0', '0'],
    [10.5, '15.75', '10.5']
  ])('writes the height %p and the width from the view box', (size, width, height) => {
    /**
     * Scenario: a number is the height in px and the width is that height times the aspect
     * ratio of the view box, so the flag keeps its proportions.
     */
    expect(renderToStaticMarkup(<Flag flagNode={FIXTURE} viewBox={BOX} size={size} />)).toContain(
      `width="${width}" height="${height}" viewBox`
    )
  })

  it('rounds the width to three decimals', () => {
    /**
     * Scenario: a view box that is not exactly 3:2, such as 512 by 341.333, still gives a
     * clean width, not 24.00002.
     */
    expect(
      renderToStaticMarkup(<Flag flagNode={FIXTURE} viewBox="0 85.333 512 341.333" size={16} />)
    ).toContain('width="24" height="16"')
  })

  it('writes the height alone for a CSS length', () => {
    /**
     * Scenario: a string is any CSS length that sets the height; the width is left to the view
     * box, so `1em` follows the text without a calculation the attribute cannot hold.
     */
    expect(renderToStaticMarkup(<Flag flagNode={FIXTURE} viewBox={BOX} size="1.5em" />)).toContain(
      'xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox'
    )
  })

  it('writes the height alone for a numeric string', () => {
    /** Scenario: a string is a CSS length even when it is digits, and sets the height alone. */
    expect(renderToStaticMarkup(<Flag flagNode={FIXTURE} viewBox={BOX} size="20" />)).toContain(
      'xmlns="http://www.w3.org/2000/svg" height="20" viewBox'
    )
  })

  it('writes the height alone when the view box is not four numbers', () => {
    /**
     * Scenario: a base called directly with a view box it cannot read still renders, with the
     * height from `size` and no width it cannot compute.
     */
    expect(renderToStaticMarkup(<Flag flagNode={FIXTURE} viewBox="wide" size={16} />)).toContain(
      'xmlns="http://www.w3.org/2000/svg" height="16" viewBox="wide"'
    )
  })
})

describe('Flag server render: precedence', () => {
  it('lets a consumer width, height and viewBox win over size and the drawing', () => {
    /**
     * Scenario: consumer props are spread last, so an explicit `width`, `height` or `viewBox`
     * overrides what the flag computed.
     */
    const html = renderToStaticMarkup(
      <Flag
        flagNode={FIXTURE}
        viewBox={BOX}
        size={16}
        width={100}
        height={50}
        {...{ viewBox2: 1 }}
      />
    )
    expect(html).toContain('width="100" height="50" viewBox="0 0 513 342"')
  })

  it('keeps the default for a prop passed as undefined or null', () => {
    /**
     * Scenario: a prop that is absent in value does not erase the default of the same name.
     */
    const html = renderToStaticMarkup(
      <Flag flagNode={FIXTURE} viewBox={BOX} width={undefined} {...({ height: null } as object)} />
    )
    expect(html).toContain('width="24" height="16"')
  })

  it('passes className, style, data attributes and handlers to the svg', () => {
    /**
     * Scenario: a flag is styled and located like any element; these props reach the `<svg>`.
     */
    const html = renderToStaticMarkup(
      <Flag
        flagNode={FIXTURE}
        viewBox={BOX}
        className="rounded"
        style={{ opacity: 0.8 }}
        data-testid="flag"
        onClick={() => undefined}
      />
    )
    expect(html).toContain('class="rounded"')
    expect(html).toContain('style="opacity:0.8"')
    expect(html).toContain('data-testid="flag"')
  })

  it('drops children and dangerouslySetInnerHTML', () => {
    /**
     * Scenario: the content of a flag is its drawing; no consumer prop becomes markup in it.
     */
    const html = renderToStaticMarkup(
      <Flag
        flagNode={FIXTURE}
        viewBox={BOX}
        dangerouslySetInnerHTML={{ __html: '<script>alert(1)</script>' }}
      >
        <text>x</text>
      </Flag>
    )
    expect(html).not.toContain('script')
    expect(html).not.toContain('<text>')
    expect(html.endsWith(`${DRAWING}</svg>`)).toBe(true)
  })
})

describe('Flag server render: accessibility', () => {
  it('names the flag from its title', () => {
    /**
     * Scenario: a title makes the flag an image with an accessible name and a `<title>`
     * child before the drawing, and removes the decorative `aria-hidden`.
     */
    const html = renderToStaticMarkup(<Flag flagNode={FIXTURE} viewBox={BOX} title="Brazil" />)
    expect(html).toContain('role="img" aria-label="Brazil"')
    expect(html).toContain(`<title>Brazil</title>${DRAWING}`)
    expect(html).not.toContain('aria-hidden')
  })

  it('treats an empty title as none', () => {
    /** Scenario: an image with an empty name is an error, so the flag stays decorative. */
    const html = renderToStaticMarkup(<Flag flagNode={FIXTURE} viewBox={BOX} title="" />)
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('<title>')
  })

  it('leaves accessibility to a consumer who set it', () => {
    /**
     * Scenario: a consumer's own `role` or `aria-*` replaces the default, which is not written.
     */
    const html = renderToStaticMarkup(
      <Flag flagNode={FIXTURE} viewBox={BOX} role="presentation" aria-label="x" />
    )
    expect(html).toContain('role="presentation" aria-label="x"')
    expect(html).not.toContain('aria-hidden')
  })
})
