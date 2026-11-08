/**
 * Unit tests for the `createIcon` factory.
 *
 * Layer: unit, rendered with `react-dom/server` in the Node environment.
 * Goal: pin the component name, the class names and their merge with the
 * consumer's, the paint option, the props passed through to the base, and the
 * kebab-case rule a name must meet.
 * Mocks: none.
 */

import { renderToStaticMarkup } from 'react-dom/server'

import { createIcon } from './create-icon'
import { Icon } from './icon'
import type { IconNode } from './icon-node'

const FIXTURE: IconNode = [['path', { d: 'M4.75 12h14.5' }]]

describe('createIcon: component name', () => {
  it.each([
    ['lightning', 'LightningIcon'],
    ['lightning-filled', 'LightningFilledIcon'],
    ['lightning-sm', 'LightningSmIcon'],
    ['google-brand', 'GoogleBrandIcon'],
    ['arrow-up-right', 'ArrowUpRightIcon'],
    ['file-2', 'File2Icon'],
    ['x', 'XIcon']
  ])('names the component for %p %p', (name, displayName) => {
    /**
     * Scenario: the displayName is derived from the name, each word capitalised
     * and `Icon` appended, so developer tools show the name a consumer imports.
     */
    expect(createIcon(name, FIXTURE).displayName).toBe(displayName)
  })
})

describe('createIcon: class names', () => {
  it('writes bx-icon and bx-icon-<name> on the root', () => {
    /**
     * Scenario: with no consumer class, the root carries exactly the two icon
     * classes, with no trailing space.
     */
    const PlayIcon = createIcon('play', FIXTURE)
    expect(renderToStaticMarkup(<PlayIcon />)).toContain('class="bx-icon bx-icon-play"')
  })

  it('appends the consumer className after the icon classes', () => {
    /**
     * Scenario: the consumer's class is merged, never replacing the icon classes.
     */
    const PlayIcon = createIcon('play', FIXTURE)
    expect(renderToStaticMarkup(<PlayIcon className="text-accent h-4" />)).toContain(
      'class="bx-icon bx-icon-play text-accent h-4"'
    )
  })

  it('treats an empty consumer className as none', () => {
    /**
     * Scenario: `className=""` adds nothing, so no trailing space is written.
     */
    const PlayIcon = createIcon('play', FIXTURE)
    expect(renderToStaticMarkup(<PlayIcon className="" />)).toContain(
      'class="bx-icon bx-icon-play"'
    )
  })
})

describe('createIcon: rendering', () => {
  it('renders the drawing through the Icon base with every prop', () => {
    /**
     * Scenario: a named component is the base with its drawing and class names
     * bound; the other props, title included, behave exactly as on the base.
     */
    const SearchIcon = createIcon('search', FIXTURE)
    expect(renderToStaticMarkup(<SearchIcon size={16} color="red" title="Search" />)).toBe(
      renderToStaticMarkup(
        <Icon
          iconNode={FIXTURE}
          className="bx-icon bx-icon-search"
          size={16}
          color="red"
          title="Search"
        />
      )
    )
  })

  it('strokes the drawing by default', () => {
    /**
     * Scenario: with no options the component is a line icon.
     */
    const SearchIcon = createIcon('search', FIXTURE)
    expect(renderToStaticMarkup(<SearchIcon />)).toContain('stroke="currentColor"')
  })

  it('fills the drawing with paint fill', () => {
    /**
     * Scenario: filled icons and brand marks are created with `paint: 'fill'`,
     * which fills in the colour and writes no stroke attribute.
     */
    const HeartIcon = createIcon('heart-filled', FIXTURE, { paint: 'fill' })
    const html = renderToStaticMarkup(<HeartIcon strokeWidth={3} />)
    expect(html).toContain('fill="currentColor"')
    expect(html).not.toContain('stroke')
  })

  it('creates independent components', () => {
    /**
     * Scenario: two factory calls share nothing: each component keeps its own
     * drawing, name and paint.
     */
    const A = createIcon('a', [['circle', { cx: 12, cy: 12, r: 4 }]])
    const B = createIcon('b', FIXTURE, { paint: 'fill' })
    expect(renderToStaticMarkup(<A />)).toContain('bx-icon-a"')
    expect(renderToStaticMarkup(<A />)).toContain('<circle')
    expect(renderToStaticMarkup(<B />)).toContain('bx-icon-b"')
    expect(renderToStaticMarkup(<B />)).not.toContain('<circle')
    expect(A.displayName).toBe('AIcon')
  })
})

describe('createIcon: name rule', () => {
  it.each(['a', 'home', 'arrow-up', 'file-2', 'a1-b2-c3', 'x2y'])(
    'accepts the kebab-case name %p',
    (name) => {
      /**
       * Scenario: lower-case words of letters and digits, joined by single
       * hyphens and starting with a letter, are valid names.
       */
      expect(() => createIcon(name, FIXTURE)).not.toThrow()
    }
  )

  it.each([
    '',
    'Home',
    'homE',
    'arrowUp',
    'arrow_up',
    'arrow up',
    'arrow--up',
    '-arrow',
    'arrow-',
    '2fa',
    'a-',
    'a-B',
    'é',
    'home\n',
    '\nhome',
    'a"b'
  ])('refuses the name %p', (name) => {
    /**
     * Scenario: the name becomes a class name and a component name; anything but
     * kebab-case (upper case, separators other than one hyphen, a leading digit,
     * an edge hyphen, a newline either side, a quote) is refused at creation.
     */
    expect(() => createIcon(name, FIXTURE)).toThrow(
      new TypeError(`Icon name ${JSON.stringify(name)} is not kebab-case.`)
    )
  })
})
