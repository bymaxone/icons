/**
 * Unit tests for the `createNativeIcon` factory.
 *
 * Layer: unit, reading the returned element tree directly.
 * Goal: pin the component name, the paint and master size options, the props passed to the
 * base, the absence of a class name and the validation of the name and master size.
 * Mocks: react-native-svg, which cannot load in Jest, replaced by named function components.
 */

import type { IconNode } from '@bymax-one/icons/runtime'
import type { ReactElement } from 'react'
import Svg from 'react-native-svg'

import { createNativeIcon } from './create-native-icon'
import { NativeIcon } from './native-icon'

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

const FIXTURE: IconNode = [['path', { d: 'M4.75 12h14.5' }]]

/** The props of an element, read loosely. */
function propsOf(element: ReactElement): Record<string, unknown> {
  return element.props as Record<string, unknown>
}

describe('createNativeIcon: component name', () => {
  it.each([
    ['lightning', 'LightningIcon'],
    ['lightning-filled', 'LightningFilledIcon'],
    ['lightning-sm', 'LightningSmIcon'],
    ['google-brand', 'GoogleBrandIcon'],
    ['file-2', 'File2Icon'],
    ['x', 'XIcon']
  ])('names the component for %p', (name, displayName) => {
    /** Scenario: the displayName is each word capitalised plus `Icon`, as on the web. */
    expect(createNativeIcon(name, FIXTURE).displayName).toBe(displayName)
  })
})

describe('createNativeIcon: rendering', () => {
  it('renders the drawing through NativeIcon', () => {
    /** Scenario: the component is NativeIcon with the drawing, so the trees are equal. */
    const Play = createNativeIcon('play', FIXTURE)
    expect(Play({ size: 20, color: 'red' })).toEqual(
      NativeIcon({ iconNode: FIXTURE, size: 20, color: 'red' })
    )
    expect(Play({}).type).toBe(Svg)
  })

  it('writes no class name', () => {
    /** Scenario: className has no meaning on native, so none reaches the root. */
    const root = propsOf(createNativeIcon('play', FIXTURE)({}))
    expect(root).not.toHaveProperty('className')
    expect(root).not.toHaveProperty('class')
  })

  it('passes the consumer props to the root', () => {
    /** Scenario: testID and title reach the base. */
    const root = propsOf(createNativeIcon('play', FIXTURE)({ testID: 'play', title: 'Play' }))
    expect(root).toMatchObject({ testID: 'play', accessibilityLabel: 'Play' })
  })

  it('uses the fill paint', () => {
    /** Scenario: `paint: fill` makes a filled icon. */
    const root = propsOf(createNativeIcon('play-filled', FIXTURE, { paint: 'fill' })({}))
    expect(root['fill']).toBe('currentColor')
    expect(root).not.toHaveProperty('stroke')
  })

  it('uses the master size as the default size and the stroke base', () => {
    /** Scenario: a 16 master draws at 16 with the stroke scaled to the grid. */
    const root = propsOf(createNativeIcon('play-sm', FIXTURE, { masterSize: 16 })({}))
    expect(root).toMatchObject({ width: 16, height: 16, strokeWidth: 2.25 })
  })

  it('lets the consumer size override the master size', () => {
    /** Scenario: an explicit size wins over the master size. */
    const root = propsOf(createNativeIcon('play-sm', FIXTURE, { masterSize: 16 })({ size: 32 }))
    expect(root).toMatchObject({ width: 32, height: 32 })
  })

  it('does not let a consumer replace the drawing', () => {
    /** Scenario: the factory's drawing is spread last, so a stray iconNode prop is ignored. */
    const Play = createNativeIcon('play', FIXTURE)
    const stray = { iconNode: [] } as unknown as Parameters<typeof Play>[0]
    expect(propsOf(Play(stray))['children']).toBeDefined()
  })
})

describe('createNativeIcon: validation', () => {
  it.each(['', 'Play', 'play_icon', '1play', 'play--x', '-play', 'play-', 'play x'])(
    'throws a TypeError for the name %p',
    (name) => {
      /** Scenario: a name that is not kebab-case would make an ill-formed component name. */
      expect(() => createNativeIcon(name, FIXTURE)).toThrow(TypeError)
      expect(() => createNativeIcon(name, FIXTURE)).toThrow('is not kebab-case')
    }
  )

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'throws a TypeError for the master size %p',
    (masterSize) => {
      /** Scenario: a master size must be a positive finite number. */
      expect(() => createNativeIcon('play', FIXTURE, { masterSize })).toThrow(TypeError)
      expect(() => createNativeIcon('play', FIXTURE, { masterSize })).toThrow(
        `Icon master size ${String(masterSize)} is not a positive number.`
      )
    }
  )

  it('accepts an undefined master size and a positive one', () => {
    /** Scenario: undefined means the 24 default; a positive number is valid. */
    expect(() => createNativeIcon('play', FIXTURE, { masterSize: undefined })).not.toThrow()
    expect(() => createNativeIcon('play', FIXTURE, { masterSize: 16 })).not.toThrow()
  })
})
