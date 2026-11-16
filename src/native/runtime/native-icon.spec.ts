/**
 * Unit tests for the `NativeIcon` base.
 *
 * Layer: unit. The component is a pure function, so the returned element tree is read
 * directly, with no renderer.
 * Goal: pin the colour mechanism, the grid, the paint, the stroke maths, the accessibility
 * props and the precedence of consumer props.
 * Mocks: react-native-svg, which cannot load in Jest, replaced by named function components.
 */

import type { IconNode } from '@bymax-one/icons/runtime'
import type { ReactElement } from 'react'
import Svg, { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg'

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

/** The element's children as an array of elements. */
function childrenOf(element: ReactElement): ReactElement[] {
  const children = propsOf(element)['children']
  return (Array.isArray(children) ? children : [children]) as ReactElement[]
}

describe('NativeIcon: root and colour', () => {
  it('renders an Svg root with the grid, the size and no color by default', () => {
    /**
     * Scenario: with no props but the drawing, the root is a 24 by 24 Svg on the 24 grid
     * and carries no `color`, so the icon renders black.
     */
    const root = NativeIcon({ iconNode: FIXTURE })
    expect(root.type).toBe(Svg)
    expect(propsOf(root)).toMatchObject({ width: 24, height: 24, viewBox: '0 0 24 24' })
    expect(propsOf(root)).not.toHaveProperty('color')
  })

  it('puts color on the root while every shape keeps currentColor', () => {
    /**
     * Scenario: `color="red"` is written on the root Svg, where react-native-svg resolves
     * it; the stroke on the root and a shape fill stay `currentColor`.
     */
    const root = NativeIcon({
      iconNode: [
        ['path', { d: 'M0 0h1' }],
        ['circle', { cx: 12, cy: 12, r: 1, fill: 'currentColor' }]
      ],
      color: 'red'
    })
    expect(propsOf(root)['color']).toBe('red')
    expect(propsOf(root)['stroke']).toBe('currentColor')
    const [, dot] = childrenOf(root)
    expect(propsOf(dot as ReactElement)['fill']).toBe('currentColor')
  })

  it.each([undefined, null])('writes no color for %p', (color) => {
    /** Scenario: an absent or null colour is not written, so it cannot turn into a value. */
    const root = NativeIcon({ iconNode: FIXTURE, color: color as unknown as undefined })
    expect(propsOf(root)).not.toHaveProperty('color')
  })

  it('keeps an empty color string as given', () => {
    /** Scenario: only undefined and null are absent; an empty string is the consumer's value. */
    expect(propsOf(NativeIcon({ iconNode: FIXTURE, color: '' }))['color']).toBe('')
  })
})

describe('NativeIcon: size', () => {
  it('uses size for width and height', () => {
    /** Scenario: a numeric size sets both dimensions in dp. */
    const root = NativeIcon({ iconNode: FIXTURE, size: 40 })
    expect(propsOf(root)).toMatchObject({ width: 40, height: 40 })
  })

  it('defaults the size to the master size', () => {
    /** Scenario: a 16 master draws at 16 when no size is given. */
    const root = NativeIcon({ iconNode: FIXTURE, masterSize: 16 })
    expect(propsOf(root)).toMatchObject({ width: 16, height: 16, viewBox: '0 0 24 24' })
  })
})

describe('NativeIcon: paint', () => {
  it('outlines a stroke icon on the root', () => {
    /** Scenario: the default paint strokes in currentColor with the grid caps and joins. */
    const root = propsOf(NativeIcon({ iconNode: FIXTURE }))
    expect(root).toMatchObject({
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    })
  })

  it('fills a filled icon and writes no stroke prop', () => {
    /** Scenario: paint fill sets the root fill to currentColor and no stroke attribute. */
    const root = propsOf(NativeIcon({ iconNode: FIXTURE, paint: 'fill' }))
    expect(root['fill']).toBe('currentColor')
    for (const name of ['stroke', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin']) {
      expect(root).not.toHaveProperty(name)
    }
  })

  it('writes a stroke for the explicit stroke paint', () => {
    /** Scenario: `stroke` is the same as the default. */
    expect(propsOf(NativeIcon({ iconNode: FIXTURE, paint: 'stroke' }))['fill']).toBe('none')
  })
})

describe('NativeIcon: stroke width', () => {
  it('writes the given width at the 24 master', () => {
    /** Scenario: a width is read in dp at the master size and written as given. */
    expect(propsOf(NativeIcon({ iconNode: FIXTURE, strokeWidth: 2 }))['strokeWidth']).toBe(2)
  })

  it('scales a 16 master width to the grid', () => {
    /** Scenario: a 16 master writes `1.5 * 24 / 16` grid units. */
    const root = NativeIcon({ iconNode: FIXTURE, masterSize: 16 })
    expect(propsOf(root)['strokeWidth']).toBe(2.25)
  })

  it('keeps the visual width constant with absoluteStrokeWidth', () => {
    /** Scenario: at size 48 an absolute 1.5 is written `1.5 * 24 / 48`. */
    const root = NativeIcon({ iconNode: FIXTURE, size: 48, absoluteStrokeWidth: true })
    expect(propsOf(root)['strokeWidth']).toBe(0.75)
  })

  it('lets the stroke scale with the drawing without absoluteStrokeWidth', () => {
    /** Scenario: at size 48 the written width is unchanged, so it renders 3 dp wide. */
    expect(propsOf(NativeIcon({ iconNode: FIXTURE, size: 48 }))['strokeWidth']).toBe(1.5)
  })

  it('computes the absolute width against the 16 master size', () => {
    /** Scenario: absolute ignores the master: at size 16, 1.5 becomes `1.5 * 24 / 16`. */
    const root = NativeIcon({
      iconNode: FIXTURE,
      masterSize: 16,
      size: 32,
      absoluteStrokeWidth: true
    })
    expect(propsOf(root)['strokeWidth']).toBe(1.125)
  })
})

describe('NativeIcon: drawing', () => {
  it('maps every tag to its react-native-svg element and keeps its attributes', () => {
    /** Scenario: each allowed tag becomes its own component, in order, with its attributes. */
    const root = NativeIcon({
      iconNode: [
        ['path', { d: 'M0 0' }],
        ['line', { x1: 1, y1: 2, x2: 3, y2: 4 }],
        ['polyline', { points: '0,0 1,1' }],
        ['polygon', { points: '0,0 1,1 2,0' }],
        ['circle', { cx: 1, cy: 2, r: 3 }],
        ['ellipse', { cx: 1, cy: 2, rx: 3, ry: 4 }],
        ['rect', { x: 1, y: 2, width: 3, height: 4 }]
      ]
    })
    const children = childrenOf(root)
    expect(children.map((child) => child.type)).toEqual([
      Path,
      Line,
      Polyline,
      Polygon,
      Circle,
      Ellipse,
      Rect
    ])
    expect(propsOf(children[4] as ReactElement)).toEqual({ cx: 1, cy: 2, r: 3 })
    expect(children.map((child) => child.key)).toEqual(['0', '1', '2', '3', '4', '5', '6'])
  })

  it('keeps an attribute of currentColor as written', () => {
    /** Scenario: the shape keeps `currentColor`, even when the icon has a color. */
    const root = NativeIcon({
      iconNode: [['rect', { x: 1, y: 1, width: 2, height: 2, fill: 'currentColor' }]],
      color: 'blue'
    })
    expect(propsOf(childrenOf(root)[0] as ReactElement)['fill']).toBe('currentColor')
  })

  it('renders no children for an empty drawing', () => {
    /** Scenario: an empty drawing is an Svg with no shapes. */
    expect(propsOf(NativeIcon({ iconNode: [] }))).not.toHaveProperty('children')
  })

  it('does not forward the base-only props to the root', () => {
    /** Scenario: the drawing, paint, master size and stroke options are not Svg props. */
    const root = propsOf(
      NativeIcon({ iconNode: FIXTURE, paint: 'stroke', masterSize: 16, absoluteStrokeWidth: true })
    )
    for (const name of [
      'iconNode',
      'paint',
      'masterSize',
      'absoluteStrokeWidth',
      'size',
      'title'
    ]) {
      expect(root).not.toHaveProperty(name)
    }
  })
})

describe('NativeIcon: accessibility', () => {
  it('exposes the icon as an image when it has a title', () => {
    /** Scenario: a title gives accessible, role image and the label, with no title child. */
    const root = NativeIcon({ iconNode: FIXTURE, title: 'Home' })
    expect(propsOf(root)).toMatchObject({
      accessible: true,
      accessibilityRole: 'image',
      accessibilityLabel: 'Home'
    })
    expect(propsOf(root)).not.toHaveProperty('accessibilityElementsHidden')
    expect(childrenOf(root)).toHaveLength(1)
  })

  it('hides a decorative icon', () => {
    /** Scenario: with no title the icon is hidden from assistive technology. */
    expect(propsOf(NativeIcon({ iconNode: FIXTURE }))).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants'
    })
  })

  it('leaves accessibility to the consumer when they set a prop', () => {
    /** Scenario: a consumer accessibility prop and no title writes no hidden default. */
    const root = propsOf(NativeIcon({ iconNode: FIXTURE, accessibilityLabel: 'Mine' }))
    expect(root['accessibilityLabel']).toBe('Mine')
    expect(root).not.toHaveProperty('accessibilityElementsHidden')
  })
})

describe('NativeIcon: consumer props', () => {
  it('passes testID and style to the root', () => {
    /** Scenario: the rest of the Svg props reach the root. */
    const root = NativeIcon({ iconNode: FIXTURE, testID: 'icon', style: { opacity: 0.5 } })
    expect(propsOf(root)).toMatchObject({ testID: 'icon', style: { opacity: 0.5 } })
  })

  it('lets a consumer prop override a default', () => {
    /** Scenario: a prop that names a default (`accessibilityRole`, `stroke`) wins over it. */
    const root = propsOf(
      NativeIcon({
        iconNode: FIXTURE,
        title: 'Home',
        accessibilityRole: 'button',
        strokeLinecap: 'butt'
      })
    )
    expect(root['accessibilityRole']).toBe('button')
    expect(root['strokeLinecap']).toBe('butt')
  })

  it('does not let a null or undefined prop erase a default', () => {
    /** Scenario: `undefined` and `null` are absent, so the defaults stay. */
    const root = propsOf(
      NativeIcon({
        iconNode: FIXTURE,
        title: 'Home',
        accessibilityRole: undefined as unknown as 'image',
        accessibilityLabel: null as unknown as string
      })
    )
    expect(root['accessibilityRole']).toBe('image')
    expect(root['accessibilityLabel']).toBe('Home')
  })
})
