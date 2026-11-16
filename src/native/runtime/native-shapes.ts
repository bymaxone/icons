/**
 * @fileoverview The react-native-svg element for each tag a drawing may use, and the
 * builder that turns a drawing's data into those elements.
 * @layer Runtime
 */

import { createElement } from 'react'
import type { ComponentType, ReactElement } from 'react'
import { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg'

import type { IconElementTag } from '@bymax-one/icons/runtime'

/** The attributes of one drawing element: names spelled as react-native-svg props. */
type ShapeAttributes = Readonly<Record<string, string | number | undefined>>

/**
 * The component of each tag. react-native-svg types the attributes of each shape
 * narrowly (`fillRule` is a union), while a drawing carries them as strings the generator
 * has already restricted, so the components are read through one loose attribute type.
 */
const SHAPES: Readonly<Record<IconElementTag, ComponentType<ShapeAttributes>>> = {
  path: Path as unknown as ComponentType<ShapeAttributes>,
  line: Line as unknown as ComponentType<ShapeAttributes>,
  polyline: Polyline as unknown as ComponentType<ShapeAttributes>,
  polygon: Polygon as unknown as ComponentType<ShapeAttributes>,
  circle: Circle as unknown as ComponentType<ShapeAttributes>,
  ellipse: Ellipse as unknown as ComponentType<ShapeAttributes>,
  rect: Rect as unknown as ComponentType<ShapeAttributes>
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
  return createElement(SHAPES[tag], { ...attributes, key })
}
