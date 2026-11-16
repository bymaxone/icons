/**
 * Unit tests for `renderShape`.
 *
 * Layer: unit, reading the returned element directly.
 * Goal: pin the component of each tag, the attributes that reach it unchanged, and the
 * attributes react-native-svg types narrowly (text, and the `fillRule`, `clipRule` and
 * `strokeLinejoin` unions), which are written as text or kept only when they are a member.
 * Mocks: react-native-svg, which cannot load in Jest, replaced by named function components.
 */

import type { IconElementTag } from '@bymax-one/icons/runtime'
import { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg'

import { renderShape } from './native-shapes'

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

const COMPONENTS: readonly [IconElementTag, unknown][] = [
  ['path', Path],
  ['line', Line],
  ['polyline', Polyline],
  ['polygon', Polygon],
  ['circle', Circle],
  ['ellipse', Ellipse],
  ['rect', Rect]
]

describe('renderShape', () => {
  it.each(COMPONENTS)('renders a %s as its own react-native-svg component', (tag, component) => {
    /**
     * Scenario: every tag a drawing may use reaches the component of that name, with the
     * position as its key.
     */
    const element = renderShape([tag, { x: 1 }], 4)
    expect(element.type).toBe(component)
    expect(element.key).toBe('4')
  })

  it('passes the numeric and textual attributes as they are written', () => {
    /**
     * Scenario: geometry and the stroke attributes of a flag reach the component with the
     * value the drawing holds, a number staying a number.
     */
    const element = renderShape(
      ['rect', { x: 2, y: '3', width: 20, height: 10, strokeWidth: 1.5, opacity: 0.5 }],
      0
    )
    expect(element.props).toStrictEqual({
      x: 2,
      y: '3',
      width: 20,
      height: 10,
      strokeWidth: 1.5,
      opacity: 0.5
    })
  })

  it('writes d, points, fill and stroke as text', () => {
    /**
     * Scenario: react-native-svg types these four as text, so a number a drawing holds is
     * written as its text and a string stays as it is.
     */
    expect(
      renderShape(['path', { d: 'M0 0h4', fill: '#fff', stroke: '#000' }], 0).props
    ).toStrictEqual({
      d: 'M0 0h4',
      fill: '#fff',
      stroke: '#000'
    })
    expect(
      renderShape(['polygon', { d: 7, points: 5, fill: 1, stroke: 2 }], 0).props
    ).toStrictEqual({ d: '7', points: '5', fill: '1', stroke: '2' })
    expect(renderShape(['polyline', { points: '1,2 3,4' }], 0).props).toStrictEqual({
      points: '1,2 3,4'
    })
  })

  it('keeps fillRule and clipRule only when they are one of the two rules', () => {
    /**
     * Scenario: `evenodd` and `nonzero` pass for both attributes; any other value is not a
     * member of the type react-native-svg takes, so it is left out.
     */
    expect(
      renderShape(['path', { fillRule: 'evenodd', clipRule: 'nonzero' }], 0).props
    ).toStrictEqual({ fillRule: 'evenodd', clipRule: 'nonzero' })
    expect(
      renderShape(['path', { fillRule: 'nonzero', clipRule: 'evenodd' }], 0).props
    ).toStrictEqual({ fillRule: 'nonzero', clipRule: 'evenodd' })
    expect(renderShape(['path', { fillRule: 'inherit', clipRule: 3 }], 0).props).toStrictEqual({})
  })

  it('keeps strokeLinejoin only when it is miter, bevel or round', () => {
    /**
     * Scenario: the three joins pass, and a value outside them is left out.
     */
    for (const join of ['miter', 'bevel', 'round']) {
      expect(renderShape(['path', { strokeLinejoin: join }], 0).props).toStrictEqual({
        strokeLinejoin: join
      })
    }
    expect(renderShape(['path', { strokeLinejoin: 'arcs' }], 0).props).toStrictEqual({})
  })

  it('leaves out an attribute the drawing does not carry', () => {
    /**
     * Scenario: an element with no attributes gets no prop, not a prop set to undefined.
     */
    expect(renderShape(['circle', {}], 0).props).toStrictEqual({})
  })
})
