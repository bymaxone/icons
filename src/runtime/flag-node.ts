/**
 * @fileoverview The data shape a country flag's drawing is stored in: a list of SVG
 * elements, each a tag name and its attributes, with the colours the flag carries. The
 * list of tags and attributes is closed, as for an icon, so no gradient, mask, filter,
 * `use`, `image`, `transform`, `style`, `id` or `class` can appear in a flag.
 * @layer Runtime
 */

/** The SVG elements a flag may use. */
export type FlagElementTag = 'path' | 'circle' | 'ellipse' | 'rect' | 'polygon'

/**
 * The attributes a flag element may carry, spelled as React props: the geometry of the
 * allowed elements and the paint a flag keeps on each element, since a flag has its own
 * colours and no root paint.
 */
export type FlagAttributeName =
  | 'd'
  | 'cx'
  | 'cy'
  | 'r'
  | 'rx'
  | 'ry'
  | 'x'
  | 'y'
  | 'width'
  | 'height'
  | 'points'
  | 'fill'
  | 'fillRule'
  | 'stroke'
  | 'strokeWidth'
  | 'strokeMiterlimit'
  | 'strokeLinejoin'
  | 'opacity'

/** One flag element's attributes. */
export type FlagElementAttributes = Readonly<Partial<Record<FlagAttributeName, string | number>>>

/** One flag element: its tag name and its attributes. */
export type FlagElement = readonly [tag: FlagElementTag, attributes: FlagElementAttributes]

/** A complete flag drawing, in paint order. */
export type FlagNode = readonly FlagElement[]
