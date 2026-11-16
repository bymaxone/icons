/**
 * Unit tests for the `createNativeFlag` factory.
 *
 * Layer: unit, reading the returned element tree directly.
 * Goal: pin the component name, the view box and props passed to the base, the absence of
 * a class name and the validation of the name and the view box.
 * Mocks: react-native-svg, which cannot load in Jest, replaced by named function components.
 */

import type { FlagNode } from '@bymax-one/icons/runtime'
import type { ReactElement } from 'react'
import Svg from 'react-native-svg'

import { createNativeFlag } from './create-native-flag'
import { NativeFlag } from './native-flag'

jest.mock('react-native-svg', () => {
  const named = (name: string): (() => null) => {
    const component = (): null => null
    Object.defineProperty(component, 'name', { value: name })
    return component
  }
  return {
    __esModule: true,
    default: named('Svg'),
    Path: named('Path'),
    Line: named('Line'),
    Polyline: named('Polyline'),
    Polygon: named('Polygon'),
    Circle: named('Circle'),
    Ellipse: named('Ellipse'),
    Rect: named('Rect')
  }
})

const FIXTURE: FlagNode = [['path', { fill: '#FFF', d: 'M0 0h513v342H0z' }]]
const BOX = '0 0 513 342'

/** The props of an element, read loosely. */
function propsOf(element: ReactElement): Record<string, unknown> {
  return element.props as Record<string, unknown>
}

describe('createNativeFlag: component name', () => {
  it.each([
    ['us-flag', 'UsFlagIcon'],
    ['gb-eng-flag', 'GbEngFlagIcon'],
    ['x', 'XIcon']
  ])('names the component for %p', (name, displayName) => {
    /** Scenario: the displayName follows the same rule as an icon. */
    expect(createNativeFlag(name, BOX, FIXTURE).displayName).toBe(displayName)
  })
})

describe('createNativeFlag: rendering', () => {
  it('renders the drawing through NativeFlag with its view box', () => {
    /** Scenario: the component is NativeFlag with the drawing and the view box. */
    const Us = createNativeFlag('us-flag', BOX, FIXTURE)
    expect(Us({ size: 32 })).toEqual(NativeFlag({ flagNode: FIXTURE, viewBox: BOX, size: 32 }))
    expect(Us({}).type).toBe(Svg)
    expect(propsOf(Us({}))).toMatchObject({ width: 24, height: 16, viewBox: BOX })
  })

  it('writes no class name', () => {
    /** Scenario: className has no meaning on native, so none reaches the root. */
    const root = propsOf(createNativeFlag('us-flag', BOX, FIXTURE)({}))
    expect(root).not.toHaveProperty('className')
  })

  it('passes the consumer props to the root', () => {
    /** Scenario: testID and title reach the base. */
    const root = propsOf(createNativeFlag('us-flag', BOX, FIXTURE)({ testID: 'us', title: 'US' }))
    expect(root).toMatchObject({ testID: 'us', accessibilityLabel: 'US' })
  })

  it('keeps the source view box over a stray viewBox prop', () => {
    /** Scenario: the factory view box is spread last, so the drawing keeps its own box. */
    const Us = createNativeFlag('us-flag', BOX, FIXTURE)
    const stray = { viewBox: '0 0 1 1' } as unknown as Parameters<typeof Us>[0]
    expect(propsOf(Us(stray))['viewBox']).toBe(BOX)
  })
})

describe('createNativeFlag: validation', () => {
  it.each(['', 'US', 'us_flag', '1us', 'us--flag', 'us flag'])(
    'throws a TypeError for the name %p',
    (name) => {
      /** Scenario: a name that is not kebab-case would make an ill-formed component name. */
      expect(() => createNativeFlag(name, BOX, FIXTURE)).toThrow(TypeError)
      expect(() => createNativeFlag(name, BOX, FIXTURE)).toThrow('is not kebab-case')
    }
  )

  it.each(['', 'nope', '0 0 513', '0 0 0 342', '0 0 513 -1', '0 0 513 342 1'])(
    'throws a TypeError for the view box %p',
    (viewBox) => {
      /** Scenario: a view box must be four numbers with a positive width and height. */
      expect(() => createNativeFlag('us-flag', viewBox, FIXTURE)).toThrow(TypeError)
      expect(() => createNativeFlag('us-flag', viewBox, FIXTURE)).toThrow(
        `Flag view box ${JSON.stringify(viewBox)} is not four numbers.`
      )
    }
  )
})
