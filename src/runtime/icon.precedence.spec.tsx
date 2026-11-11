/**
 * Prop-precedence tests for the `Icon` base.
 *
 * Layer: unit, rendered with `react-dom/server` in the Node environment.
 * Goal: pin how consumer props meet the defaults. Every SVG attribute a consumer
 * names overrides the default of the same name; a consumer `role` or `aria-*`
 * suppresses the default `aria-hidden`; pass-through props reach the root; and no
 * consumer prop can add content to the drawing.
 * Mocks: none.
 */

import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { Icon } from './icon'
import type { IconNode } from './icon-node'

const FIXTURE: IconNode = [['path', { d: 'M4.75 12h14.5' }]]

const render = (element: ReactElement): string => renderToStaticMarkup(element)

describe('Icon precedence: accessibility', () => {
  it.each([
    [{ 'aria-label': 'Open menu' }, 'aria-label="Open menu"'],
    [{ 'aria-labelledby': 'label-id' }, 'aria-labelledby="label-id"'],
    [{ role: 'presentation' }, 'role="presentation"'],
    [{ 'aria-hidden': false }, 'aria-hidden="false"']
  ])('drops the default aria-hidden for the consumer prop %p', (extra, written) => {
    /**
     * Scenario: a consumer who passes a role or any aria-* attribute has decided
     * how the icon is announced, so the default `aria-hidden="true"` is not
     * applied and their attribute is written.
     */
    const html = render(<Icon iconNode={FIXTURE} {...extra} />)
    expect(html).not.toContain('aria-hidden="true"')
    expect(html).toContain(written)
  })

  it('keeps the default aria-hidden when an aria prop is undefined', () => {
    /**
     * Scenario: `aria-label={maybeLabel}` without a label renders no attribute,
     * so the icon must stay hidden rather than become an unnamed graphic.
     */
    expect(render(<Icon iconNode={FIXTURE} aria-label={undefined} />)).toContain(
      'aria-hidden="true"'
    )
  })

  it.each([
    ['aria-hidden', { 'aria-hidden': undefined }, 'aria-hidden="true"'],
    ['focusable', { focusable: undefined }, 'focusable="false"'],
    ['viewBox', { viewBox: undefined }, 'viewBox="0 0 24 24"'],
    ['stroke', { stroke: undefined }, 'stroke="currentColor"']
  ])('keeps the default %s when the consumer passes it as undefined', (_name, extra, written) => {
    /**
     * Scenario: a prop passed as `undefined` (for example `aria-hidden={maybe}`)
     * is absent, not an override; spreading it last would
     * erase the default and expose a decorative icon or break the drawing.
     */
    expect(render(<Icon iconNode={FIXTURE} {...extra} />)).toContain(written)
  })

  it('lets the consumer aria-label and role override the title-derived ones', () => {
    /**
     * Scenario: consumer props are written after the defaults, so an explicit
     * `aria-label` or `role` wins over the one the title produces; the `<title>`
     * child still renders for the native tooltip.
     */
    const html = render(
      <Icon iconNode={FIXTURE} title="Credits" aria-label="Credit balance" role="presentation" />
    )
    expect(html).toContain('role="presentation" aria-label="Credit balance"')
    expect(html).not.toContain('aria-label="Credits"')
    expect(html).toContain('<title>Credits</title>')
  })

  it('lets the consumer make the icon focusable', () => {
    /**
     * Scenario: `focusable="false"` keeps legacy browsers from tabbing into the
     * graphic; a consumer that needs the opposite can say so.
     */
    expect(render(<Icon iconNode={FIXTURE} focusable="true" />)).toContain('focusable="true"')
  })
})

describe('Icon precedence: root attributes', () => {
  it('lets a consumer attribute override the default of the same name', () => {
    /**
     * Scenario: consumer props are spread last, so `width`, `viewBox`, `fill`,
     * `stroke` or the caps written by name win over `size`, the grid and the paint.
     */
    const html = render(
      <Icon
        iconNode={FIXTURE}
        size={24}
        width={32}
        viewBox="0 0 16 16"
        fill="red"
        stroke="blue"
        strokeLinecap="square"
      />
    )
    expect(html).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="24" viewBox="0 0 16 16" ' +
        'fill="red" stroke="blue" stroke-width="1.5" stroke-linecap="square" ' +
        'stroke-linejoin="round" focusable="false" aria-hidden="true">' +
        '<path d="M4.75 12h14.5"></path></svg>'
    )
  })

  it('passes className, style, id and data attributes to the root', () => {
    /**
     * Scenario: an icon is styled and located like any element; these props are
     * not consumed by the runtime and reach the `<svg>` as given.
     */
    const html = render(
      <Icon
        iconNode={FIXTURE}
        className="nav-icon"
        style={{ verticalAlign: 'middle' }}
        id="logo"
        data-testid="icon"
      />
    )
    expect(html).toContain('class="nav-icon"')
    expect(html).toContain('style="vertical-align:middle"')
    expect(html).toContain('id="logo"')
    expect(html).toContain('data-testid="icon"')
  })

  it('does not write the runtime props as attributes', () => {
    /**
     * Scenario: `size`, `strokeWidth`, `absoluteStrokeWidth`, `color`, `title`,
     * `paint`, `masterSize` and `iconNode` are inputs to the runtime, never SVG
     * attributes.
     */
    const html = render(
      <Icon
        iconNode={FIXTURE}
        paint="stroke"
        size={20}
        color="red"
        title="X"
        masterSize={16}
        absoluteStrokeWidth
      />
    )
    expect(html).not.toMatch(/\s(size|color|title|paint|iconNode|absoluteStrokeWidth|masterSize)=/i)
  })
})

describe('Icon precedence: content', () => {
  it('ignores consumer children', () => {
    /**
     * Scenario: the content of an icon is its drawing and its title; children
     * passed by a consumer are dropped, whether or not the drawing is empty.
     */
    expect(
      render(
        <Icon iconNode={FIXTURE}>
          <text>injected</text>
        </Icon>
      )
    ).toBe(render(<Icon iconNode={FIXTURE} />))
    expect(
      render(
        <Icon iconNode={[]}>
          <text>injected</text>
        </Icon>
      )
    ).toBe(render(<Icon iconNode={[]} />))
  })

  it('ignores dangerouslySetInnerHTML', () => {
    /**
     * Scenario: no consumer prop may become markup inside an icon; the raw HTML
     * prop is dropped before the root element is created, with or without a
     * drawing.
     */
    const markup = { __html: '<script>alert(1)</script>' }
    expect(render(<Icon iconNode={[]} dangerouslySetInnerHTML={markup} />)).toBe(
      render(<Icon iconNode={[]} />)
    )
    expect(render(<Icon iconNode={FIXTURE} dangerouslySetInnerHTML={markup} />)).toBe(
      render(<Icon iconNode={FIXTURE} />)
    )
  })
})
