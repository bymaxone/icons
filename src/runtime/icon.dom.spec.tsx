/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */

/**
 * DOM tests for the `Icon` base and the components `createIcon` makes.
 *
 * Layer: unit, rendered into jsdom with `@testing-library/react`.
 * Goal: prove the attributes reach a real DOM `<svg>` in the SVG namespace, that
 * `ref` arrives as a regular prop on both the base and a named component, that
 * event handlers fire, and that assistive-technology queries see exactly what the
 * accessibility rules promise.
 * Mocks: none.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'

import { createIcon } from './create-icon'
import { Icon } from './icon'
import type { IconNode } from './icon-node'

const FIXTURE: IconNode = [
  ['path', { d: 'M4.75 12h14.5' }],
  ['circle', { cx: 18, cy: 6, r: 1, fill: 'currentColor' }]
]
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

/** The single `<svg>` a render produced. */
function rootOf(container: HTMLElement): SVGSVGElement {
  const svg = container.querySelector('svg')
  if (svg === null) throw new Error('no <svg> rendered')
  return svg
}

describe('Icon in the DOM: defaults', () => {
  it('creates SVG-namespace elements with the default root attributes', () => {
    /**
     * Scenario: the drawing is built with createElement, so the browser creates
     * real SVG elements (not unknown HTML elements) carrying the grid, the stroke
     * and the silent-by-default attributes.
     */
    const svg = rootOf(render(<Icon iconNode={FIXTURE} />).container)
    expect(svg.namespaceURI).toBe(SVG_NAMESPACE)
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg.getAttribute('width')).toBe('24')
    expect(svg.getAttribute('height')).toBe('24')
    expect(svg.getAttribute('fill')).toBe('none')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
    expect(svg.getAttribute('stroke-width')).toBe('1.5')
    expect(svg.getAttribute('stroke-linecap')).toBe('round')
    expect(svg.getAttribute('stroke-linejoin')).toBe('round')
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('focusable')).toBe('false')
    expect(svg.hasAttribute('role')).toBe(false)
    expect(Array.from(svg.children).map((child) => [child.tagName, child.namespaceURI])).toEqual([
      ['path', SVG_NAMESPACE],
      ['circle', SVG_NAMESPACE]
    ])
  })

  it('is invisible to role queries when decorative', () => {
    /**
     * Scenario: a decorative icon must not be announced; `aria-hidden` removes it
     * from the accessibility tree, so no image role is exposed.
     */
    render(<Icon iconNode={FIXTURE} />)
    expect(screen.queryByRole('img')).toBeNull()
  })
})

describe('Icon in the DOM: title', () => {
  it('is exposed as an image named by its title, with a title element', () => {
    /**
     * Scenario: with a title, the icon is found by role and accessible name, and
     * its first child is a `<title>` holding the text for the native tooltip.
     */
    render(<Icon iconNode={FIXTURE} title="Credits" />)
    const svg = screen.getByRole('img', { name: 'Credits' })
    expect(svg.hasAttribute('aria-hidden')).toBe(false)
    expect(svg.firstElementChild?.tagName).toBe('title')
    expect(svg.firstElementChild?.textContent).toBe('Credits')
  })

  it('keeps markup in a title as text', () => {
    /**
     * Scenario: consumer text never becomes elements: a title holding a tag is a
     * text node inside `<title>` and nothing else is created.
     */
    const svg = rootOf(render(<Icon iconNode={[]} title="<b>bold</b>" />).container)
    expect(svg.querySelector('b')).toBeNull()
    expect(svg.querySelector('title')?.textContent).toBe('<b>bold</b>')
  })

  it('lets a consumer aria-label name a title-less icon', () => {
    /**
     * Scenario: a consumer that names the icon with aria-label and role="img"
     * gets an announced image; the default aria-hidden is not applied.
     */
    render(<Icon iconNode={FIXTURE} role="img" aria-label="Status: online" />)
    const svg = screen.getByRole('img', { name: 'Status: online' })
    expect(svg.hasAttribute('aria-hidden')).toBe(false)
  })
})

describe('Icon in the DOM: ref and events', () => {
  it('receives ref as a regular prop on the base', () => {
    /**
     * Scenario: React 19 passes `ref` to function components as a prop, so the
     * icon hands it to the `<svg>` without forwardRef.
     */
    const ref = createRef<SVGSVGElement>()
    const { container } = render(<Icon iconNode={FIXTURE} ref={ref} />)
    expect(ref.current).toBe(rootOf(container))
  })

  it('receives ref through a component made by createIcon', () => {
    /**
     * Scenario: a named icon component passes every prop, ref included, to the
     * base, so the ref lands on the same `<svg>`.
     */
    const ShieldIcon = createIcon('shield', FIXTURE)
    const ref = createRef<SVGSVGElement>()
    const { container } = render(<ShieldIcon ref={ref} />)
    expect(ref.current).toBe(rootOf(container))
  })

  it('calls a callback ref with the element', () => {
    /**
     * Scenario: a callback ref is the other form React accepts; it is called with
     * the rendered `<svg>`.
     */
    const seen: (SVGSVGElement | null)[] = []
    const { container } = render(<Icon iconNode={FIXTURE} ref={(node) => void seen.push(node)} />)
    expect(seen[0]).toBe(rootOf(container))
  })

  it('passes event handlers to the root element', () => {
    /**
     * Scenario: an icon used as a click or hover target gets the consumer's
     * handlers on the `<svg>` itself.
     */
    const clicks: string[] = []
    const { container } = render(
      <Icon iconNode={FIXTURE} onClick={(event) => clicks.push(event.currentTarget.tagName)} />
    )
    fireEvent.click(rootOf(container))
    expect(clicks).toEqual(['svg'])
  })
})

describe('createIcon in the DOM', () => {
  it('writes the bx-icon classes before the consumer class', () => {
    /**
     * Scenario: CSS can target every icon (`bx-icon`) or one icon
     * (`bx-icon-<name>`), and the consumer's own class still applies.
     */
    const BellIcon = createIcon('bell', FIXTURE)
    const svg = rootOf(render(<BellIcon className="nav" size={20} />).container)
    expect(Array.from(svg.classList)).toEqual(['bx-icon', 'bx-icon-bell', 'nav'])
    expect(svg.getAttribute('width')).toBe('20')
  })
})
