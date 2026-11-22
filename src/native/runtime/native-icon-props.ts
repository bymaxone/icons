/**
 * @fileoverview The props every React Native icon and flag component accepts, and the
 * props of the `NativeIcon` and `NativeFlag` bases that those components render through.
 * @layer Runtime
 */

import type { SvgProps } from 'react-native-svg'

import type { IconNode, IconPaint, FlagNode } from '@bymax-one/icons/runtime'

/** The root props the component writes itself, so the consumer cannot pass them. */
type OwnedProps = 'width' | 'height' | 'viewBox' | 'fill' | 'stroke' | 'children' | 'color'

/**
 * Props of every React Native icon component. Any other prop of react-native-svg's
 * `Svg` (`testID`, `style`, accessibility props, event handlers) is passed to the root.
 *
 * The drawing is the component's own: `width`, `height`, `viewBox`, `fill`, `stroke` and
 * `children` are not part of the type. There is no `className`, which has no meaning on
 * native.
 */
export interface NativeIconProps extends Omit<SvgProps, OwnedProps | 'strokeWidth' | 'title'> {
  /**
   * Width and height in density-independent pixels. Default the icon's master size: 24,
   * or 16 for a 16 px master. A CSS length string is not accepted.
   */
  size?: number | undefined
  /**
   * Colour, set on the root so the shapes' `currentColor` resolves to it. With none the
   * icon renders black.
   */
  color?: string | undefined
  /**
   * Stroke width in dp at the drawing's master size, for a custom drawing rendered with
   * stroke paint: the default 1.5 is 1.5 dp at 24, or at 16 with `masterSize: 16`. Ignored
   * by fill paint, so by every catalog icon (line, filled and 16 px master, which are
   * fixed-weight contours) and every brand mark.
   */
  strokeWidth?: number | undefined
  /**
   * Keep the visual stroke width constant at every size: the stroke is written as
   * `strokeWidth * 24 / size`.
   */
  absoluteStrokeWidth?: boolean | undefined
  /** Accessible name. When present the icon is exposed as an image with this label. */
  title?: string | undefined
}

/** Props of the `NativeIcon` base: the icon props plus the drawing to render. */
export interface NativeIconBaseProps extends NativeIconProps {
  /** The drawing, as data. */
  iconNode: IconNode
  /** How the drawing is painted. Default `stroke`. */
  paint?: IconPaint | undefined
  /**
   * The dp size the drawing is made for. Default 24; 16 for a 16 px master. It is the
   * default `size`, and `strokeWidth` is read in dp at this size.
   */
  masterSize?: number | undefined
}

/**
 * Props of every React Native flag component: those of an icon without `color`,
 * `strokeWidth` and `absoluteStrokeWidth`, which mean nothing for artwork that keeps its
 * own colours.
 *
 * `size` is the height of the flag, in dp. The width follows the aspect ratio of the
 * flag's view box. The default is 16, so a 3:2 flag is 24 by 16.
 */
export type NativeFlagProps = Omit<NativeIconProps, 'color' | 'strokeWidth' | 'absoluteStrokeWidth'>

/** Props of the `NativeFlag` base: the flag props plus the drawing and its view box. */
export interface NativeFlagBaseProps extends NativeFlagProps {
  /** The drawing, as data. */
  flagNode: FlagNode
  /** The view box of the drawing, such as `0 0 513 342`. */
  viewBox: string
}
