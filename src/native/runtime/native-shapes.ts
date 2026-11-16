/**
 * @fileoverview The react-native-svg element for each tag a drawing may use, and the
 * builder that turns a drawing's data into those elements.
 * @layer Runtime
 */

import { createElement } from 'react'
import type { ComponentProps, ReactElement } from 'react'
import { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg'

import type { FlagAttributeName, IconAttributeName, IconElementTag } from '@bymax-one/icons/runtime'

/** The attributes of one drawing element: names spelled as react-native-svg props. */
type ShapeAttributes = Readonly<
  Partial<Record<FlagAttributeName | IconAttributeName, string | number>>
>

/** The props of a shape, read for the unions every shape component shares. */
type PathProps = ComponentProps<typeof Path>

/** The attributes react-native-svg types as a union or as text, not as the loose drawing value. */
type Narrowed = 'd' | 'points' | 'fill' | 'stroke' | 'fillRule' | 'clipRule' | 'strokeLinejoin'

/**
 * What every shape component accepts from a drawing: the drawing's attributes where
 * react-native-svg takes a string or a number, and its own unions where it does not.
 */
type ShapeProps = Omit<ShapeAttributes, Narrowed> & {
  d?: string
  points?: string
  fill?: string
  stroke?: string
  fillRule?: NonNullable<PathProps['fillRule']>
  clipRule?: NonNullable<PathProps['clipRule']>
  strokeLinejoin?: NonNullable<PathProps['strokeLinejoin']>
}

/** The values of `fillRule` and `clipRule`. */
const RULES = ['evenodd', 'nonzero'] as const
/** The values of `strokeLinejoin`. */
const JOINS = ['miter', 'bevel', 'round'] as const

/** The member of `allowed` that equals `value`, if any, so a union prop only gets a member. */
function member<T extends string>(
  allowed: readonly T[],
  value: string | number | undefined
): T | undefined {
  return allowed.find((candidate) => candidate === value)
}

/**
 * The props of one element from its drawing attributes. Attributes that react-native-svg
 * types as a union (`fillRule`, `clipRule`, `strokeLinejoin`) are kept only when they are a
 * member, and `d`, `points`, `fill` and `stroke` are written as text.
 */
function shapeProps(attributes: ShapeAttributes): ShapeProps {
  const { d, points, fill, stroke, fillRule, clipRule, strokeLinejoin, ...rest } = attributes
  const evenOdd = member(RULES, fillRule)
  const clip = member(RULES, clipRule)
  const join = member(JOINS, strokeLinejoin)
  return {
    ...rest,
    ...(d === undefined ? {} : { d: String(d) }),
    ...(points === undefined ? {} : { points: String(points) }),
    ...(fill === undefined ? {} : { fill: String(fill) }),
    ...(stroke === undefined ? {} : { stroke: String(stroke) }),
    ...(evenOdd === undefined ? {} : { fillRule: evenOdd }),
    ...(clip === undefined ? {} : { clipRule: clip }),
    ...(join === undefined ? {} : { strokeLinejoin: join })
  }
}

/**
 * Builds one drawing element from its tag and attributes. An attribute of `currentColor`
 * is kept as written: react-native-svg resolves it from the root's `color`.
 *
 * @param element - The tag and attributes of the element.
 * @param key - The element's position in the drawing.
 * @returns The react-native-svg element.
 */
export function renderShape(
  [tag, attributes]: readonly [tag: IconElementTag, attributes: ShapeAttributes],
  key: number
): ReactElement {
  const props = { ...shapeProps(attributes), key }
  switch (tag) {
    case 'path':
      return createElement(Path, props)
    case 'line':
      return createElement(Line, props)
    case 'polyline':
      return createElement(Polyline, props)
    case 'polygon':
      return createElement(Polygon, props)
    case 'circle':
      return createElement(Circle, props)
    case 'ellipse':
      return createElement(Ellipse, props)
    case 'rect':
      return createElement(Rect, props)
  }
}
