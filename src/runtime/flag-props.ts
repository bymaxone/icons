/**
 * @fileoverview The props every country flag component accepts, and the props of the
 * `Flag` base that every flag component renders through.
 * @layer Runtime
 */

import type { FlagNode } from './flag-node'
import type { IconProps } from './icon-props'

/**
 * Props of every flag component: those of an icon, without `color`, `strokeWidth` and
 * `absoluteStrokeWidth`, which mean nothing for artwork that keeps its own colours. Any
 * other SVG attribute, `className`, `style`, `data-*` attribute or event handler is passed
 * to the `<svg>` element.
 *
 * `size` is the height of the flag. A number is px and the width follows the aspect ratio
 * of the flag's view box; a string is any CSS length that sets the height alone. The
 * default is 16, so the box of a 3:2 flag is 24 by 16.
 */
export type FlagProps = Omit<IconProps, 'color' | 'strokeWidth' | 'absoluteStrokeWidth'>

/** Props of the {@link Flag} base: the flag props plus the drawing and its view box. */
export interface FlagBaseProps extends FlagProps {
  /** The drawing, as data. */
  flagNode: FlagNode
  /** The view box of the drawing, such as `0 0 513 342`. */
  viewBox: string
}
