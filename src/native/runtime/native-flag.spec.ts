/**
 * Unit tests for the `NativeFlag` base.
 *
 * Layer: unit. The component is a pure function, so the returned element tree is read
 * directly, with no renderer.
 * Goal: pin the size as height, the width from the view box, the ignored colour, the
 * accessibility props and the precedence of consumer props.
 * Mocks: react-native-svg, which cannot load in Jest, replaced by named function components.
 */

import type { FlagNode } from '@bymax-one/icons/runtime'
import type { ReactElement } from 'react'
import Svg, { Path, Rect } from 'react-native-svg'

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

const FIXTURE: FlagNode = [
  ['rect', { width: 513, height: 342, fill: '#FFF' }],
  ['path', { d: 'M0 0h10v10H0z', fill: '#C00', stroke: '#000', strokeWidth: 2 }]
]
const BOX = '0 0 513 342'

/** The props of an element, read loosely. */
function propsOf(element: ReactElement): Record<string, unknown> {
  return element.props as Record<string, unknown>
}

describe('NativeFlag: size and view box', () => {
  it('defaults the height to 16 and derives the width from the view box', () => {
    /** Scenario: a 513 by 342 flag at the default height 16 is 24 wide. */
    const root = NativeFlag({ flagNode: FIXTURE, viewBox: BOX })
    expect(root.type).toBe(Svg)
    expect(propsOf(root)).toMatchObject({ width: 24, height: 16, viewBox: BOX })
  })

  it('takes size as the height and scales the width', () => {
    /** Scenario: size 32 is the height; the width keeps the 3:2 ratio. */
    const root = NativeFlag({ flagNode: FIXTURE, viewBox: BOX, size: 32 })
    expect(propsOf(root)).toMatchObject({ width: 48, height: 32 })
  })

  it('rounds the width to three decimals', () => {
    /** Scenario: a 1:3 box at height 10 gives 3.333, not a long fraction. */
    const root = NativeFlag({ flagNode: FIXTURE, viewBox: '0 0 1 3', size: 10 })
    expect(propsOf(root)['width']).toBe(3.333)
  })

  it('leaves the width unwritten when the view box is invalid', () => {
    /** Scenario: a broken view box has no ratio, so only the height is written. */
    const root = propsOf(NativeFlag({ flagNode: FIXTURE, viewBox: 'nope' }))
    expect(root).not.toHaveProperty('width')
    expect(root['height']).toBe(16)
  })
})

describe('NativeFlag: colour', () => {
  it('ignores color and keeps the flag colours', () => {
    /** Scenario: a color passed outside the types is dropped; the element colours stay. */
    const props = { flagNode: FIXTURE, viewBox: BOX, color: 'red' }
    const root = NativeFlag(props)
    expect(propsOf(root)).not.toHaveProperty('color')
    const children = propsOf(root)['children'] as ReactElement[]
    expect(children.map((child) => child.type)).toEqual([Rect, Path])
    expect(propsOf(children[1] as ReactElement)).toEqual({
      d: 'M0 0h10v10H0z',
      fill: '#C00',
      stroke: '#000',
      strokeWidth: 2
    })
  })

  it('writes no root paint', () => {
    /** Scenario: a flag has its own colours, so the root carries no fill or stroke. */
    const root = propsOf(NativeFlag({ flagNode: FIXTURE, viewBox: BOX }))
    for (const name of ['fill', 'stroke', 'strokeWidth']) {
      expect(root).not.toHaveProperty(name)
    }
  })
})

describe('NativeFlag: accessibility and props', () => {
  it('exposes the flag as an image when it has a title', () => {
    /** Scenario: a title gives accessible, role image and the label. */
    expect(propsOf(NativeFlag({ flagNode: FIXTURE, viewBox: BOX, title: 'France' }))).toMatchObject(
      { accessible: true, accessibilityRole: 'image', accessibilityLabel: 'France' }
    )
  })

  it('hides a decorative flag', () => {
    /** Scenario: with no title the flag is hidden from assistive technology. */
    expect(propsOf(NativeFlag({ flagNode: FIXTURE, viewBox: BOX }))).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants'
    })
  })

  it('passes consumer props, which override a default, and ignores null ones', () => {
    /** Scenario: testID passes through, a role overrides, and null does not erase a default. */
    const root = propsOf(
      NativeFlag({
        flagNode: FIXTURE,
        viewBox: BOX,
        title: 'France',
        testID: 'flag',
        accessibilityRole: 'button',
        accessibilityLabel: null as unknown as string
      })
    )
    expect(root).toMatchObject({
      testID: 'flag',
      accessibilityRole: 'button',
      accessibilityLabel: 'France'
    })
  })

  it('does not forward the base-only props to the root', () => {
    /** Scenario: the drawing and title are not Svg props. */
    const root = propsOf(NativeFlag({ flagNode: FIXTURE, viewBox: BOX, title: 'France' }))
    for (const name of ['flagNode', 'size', 'title']) {
      expect(root).not.toHaveProperty(name)
    }
  })
})
