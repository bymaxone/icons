/**
 * @fileoverview The props every Bymax icon component accepts, and the props of the
 * `Icon` base that every component renders through.
 * @layer Runtime
 */

import type { Ref, SVGProps } from 'react'

import type { IconNode, IconPaint } from './icon-node'

/**
 * Props of every icon component. Any other SVG attribute, `className`, `style`,
 * `data-*` attribute or event handler is passed to the `<svg>` element.
 *
 * An icon's content comes only from its drawing and its `title`: `children` and
 * `dangerouslySetInnerHTML` are accepted by the type, as on any SVG element, and
 * ignored at render time, so no consumer prop can become markup inside an icon.
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Width and height. Default 24. A number is px; a string is any CSS length. */
  size?: number | string | undefined
  /** Stroke width at 24 px. Default 1.5. Ignored by filled and brand icons. */
  strokeWidth?: number | string | undefined
  /**
   * Keep the visual stroke width constant at every size: the stroke is written as
   * `strokeWidth * 24 / size`. Applied only when `size` and `strokeWidth` are
   * numbers or numeric strings (`32`, `'32'`) and `size` is above zero; with a CSS
   * length such as `'1em'` there is no pixel size to divide by, and the stroke
   * width is written unchanged.
   */
  absoluteStrokeWidth?: boolean | undefined
  /** Colour. Default `currentColor`, so the icon follows the surrounding text. */
  color?: string | undefined
  /** Accessible name. When present the icon is announced as an image. */
  title?: string | undefined
  /** The rendered `<svg>` element. A regular prop: React 19 passes `ref` to function components. */
  ref?: Ref<SVGSVGElement> | undefined
}

/** Props of the {@link Icon} base: the icon props plus the drawing to render. */
export interface IconBaseProps extends IconProps {
  /** The drawing, as data. */
  iconNode: IconNode
  /** How the drawing is painted. Default `stroke`. */
  paint?: IconPaint | undefined
}
