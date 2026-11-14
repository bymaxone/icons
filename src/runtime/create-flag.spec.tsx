/**
 * Unit tests for the `createFlag` factory.
 *
 * Layer: unit, rendered with `react-dom/server` in the Node environment.
 * Goal: pin the component name, the class names and their merge with the consumer's, the
 * props passed through to the base, and the rules a name and a view box must meet.
 * Mocks: none.
 */

import { renderToStaticMarkup } from 'react-dom/server'

import { createFlag } from './create-flag'
import { Flag } from './flag'
import type { FlagNode } from './flag-node'

const FIXTURE: FlagNode = [['path', { fill: '#004F8E', d: 'M0 0h513v342H0z' }]]
const BOX = '0 0 513 342'

describe('createFlag: component name', () => {
  it.each([
    ['us-flag', 'UsFlagIcon'],
    ['br-flag', 'BrFlagIcon'],
    ['gb-eng-flag', 'GbEngFlagIcon']
  ])('names the component for %p', (name, displayName) => {
    /**
     * Scenario: the displayName is derived from the name, each word capitalised and `Icon`
     * appended, so developer tools show the name a consumer imports.
     */
    expect(createFlag(name, BOX, FIXTURE).displayName).toBe(displayName)
  })
})

describe('createFlag: class names', () => {
  it('writes bx-icon and bx-icon-<name> on the root', () => {
    /** Scenario: with no consumer class the root carries the two icon classes alone. */
    const SeFlagIcon = createFlag('se-flag', BOX, FIXTURE)
    expect(renderToStaticMarkup(<SeFlagIcon />)).toContain('class="bx-icon bx-icon-se-flag"')
  })

  it('appends the consumer className after the icon classes', () => {
    /** Scenario: the consumer's class is merged, never replacing the icon classes. */
    const SeFlagIcon = createFlag('se-flag', BOX, FIXTURE)
    expect(renderToStaticMarkup(<SeFlagIcon className="rounded h-4" />)).toContain(
      'class="bx-icon bx-icon-se-flag rounded h-4"'
    )
  })

  it('treats an empty consumer className as none', () => {
    /** Scenario: `className=""` adds nothing, so no trailing space is written. */
    const SeFlagIcon = createFlag('se-flag', BOX, FIXTURE)
    expect(renderToStaticMarkup(<SeFlagIcon className="" />)).toContain(
      'class="bx-icon bx-icon-se-flag"'
    )
  })
})

describe('createFlag: rendering', () => {
  it('renders the drawing through the Flag base with every prop', () => {
    /**
     * Scenario: the component is the base with the drawing and the view box filled in, so
     * the size, the title and the other props behave as they do on the base.
     */
    const SeFlagIcon = createFlag('se-flag', BOX, FIXTURE)
    expect(renderToStaticMarkup(<SeFlagIcon size={32} title="Sweden" id="s" />)).toBe(
      renderToStaticMarkup(
        <Flag
          flagNode={FIXTURE}
          viewBox={BOX}
          size={32}
          title="Sweden"
          id="s"
          className="bx-icon bx-icon-se-flag"
        />
      )
    )
  })

  it('renders a 24 by 16 flag by default', () => {
    /** Scenario: the default size of a created flag is 16 px high and 24 wide in a 3:2 box. */
    const SeFlagIcon = createFlag('se-flag', BOX, FIXTURE)
    expect(renderToStaticMarkup(<SeFlagIcon />)).toContain('width="24" height="16"')
  })
})

describe('createFlag: validation', () => {
  it.each(['Us-flag', 'us flag', 'us_flag', '1-flag', '', 'us--flag', '-us-flag'])(
    'rejects the name %p',
    (name) => {
      /** Scenario: the name becomes a class name and a component name, so it must be kebab-case. */
      expect(() => createFlag(name, BOX, FIXTURE)).toThrow(
        new TypeError(`Flag name ${JSON.stringify(name)} is not kebab-case.`)
      )
    }
  )

  it.each(['', '0 0 513', '0 0 0 342', 'wide'])('rejects the view box %p', (viewBox) => {
    /** Scenario: a flag whose width cannot be taken from its view box cannot be created. */
    expect(() => createFlag('us-flag', viewBox, FIXTURE)).toThrow(
      new TypeError(`Flag view box ${JSON.stringify(viewBox)} is not four numbers.`)
    )
  })
})
