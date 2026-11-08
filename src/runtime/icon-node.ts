/**
 * @fileoverview The data shape an icon's drawing is stored in: a list of SVG
 * elements, each a tag name and its attributes. Generated icon modules hold their
 * drawing as this data, and the runtime turns it into React elements, so no icon
 * path ever passes through a string of markup or an SVG parser.
 * @layer Runtime
 */

/**
 * The SVG elements a drawing may use. The list is closed on purpose: no `use`,
 * `image`, `foreignObject`, gradient, mask, filter or `script` can appear in a
 * drawing, because the type that carries it has no name for them.
 */
export type IconElementTag =
  'path' | 'line' | 'polyline' | 'polygon' | 'circle' | 'ellipse' | 'rect'

/**
 * The attributes a drawing element may carry, spelled as React props. Geometry for
 * the allowed elements, plus the fill controls a filled icon, a brand mark or the
 * spark dot needs. Presentation that belongs to the root (`stroke`, the stroke
 * width, caps and joins) is written once on the `<svg>` element, and `transform`,
 * `style`, `id` and `class` are absent because drawings may not use them.
 */
export type IconAttributeName =
  | 'd'
  | 'x1'
  | 'y1'
  | 'x2'
  | 'y2'
  | 'points'
  | 'cx'
  | 'cy'
  | 'r'
  | 'rx'
  | 'ry'
  | 'x'
  | 'y'
  | 'width'
  | 'height'
  | 'fill'
  | 'fillRule'
  | 'clipRule'

/**
 * One element's attributes. A value of `currentColor` follows the icon's `color`
 * prop when the icon renders, so a filled detail such as the spark dot takes the
 * same colour as the strokes around it.
 */
export type IconElementAttributes = Readonly<Partial<Record<IconAttributeName, string | number>>>

/** One drawing element: its tag name and its attributes. */
export type IconElement = readonly [tag: IconElementTag, attributes: IconElementAttributes]

/**
 * A complete drawing, in paint order.
 *
 * @example
 * ```ts
 * import type { IconNode } from '@bymax-one/icons'
 *
 * const minus: IconNode = [['line', { x1: 4.75, y1: 12, x2: 19.25, y2: 12 }]]
 * ```
 */
export type IconNode = readonly IconElement[]

/**
 * How a drawing is painted. `stroke` is a line icon (and a 16 px master): shapes
 * are outlined in the icon's colour and the root carries the stroke attributes.
 * `fill` is a filled icon or a brand mark: shapes are filled in the icon's colour
 * and no stroke attribute is written, so `strokeWidth` has nothing to act on.
 */
export type IconPaint = 'stroke' | 'fill'
