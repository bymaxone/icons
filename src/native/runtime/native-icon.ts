/**
 * @fileoverview The `NativeIcon` base every React Native icon renders through: it writes the
 * root `<Svg>` props from the grid, the paint, the stroke maths and the accessibility rules,
 * then builds the drawing's elements from data. A pure function with no hook and no context.
 * @layer Runtime
 */

import { createElement } from 'react'
import type { ReactElement } from 'react'
import Svg from 'react-native-svg'

import { ICON_GRID } from '@bymax-one/icons/meta'
import type { IconPaint } from '@bymax-one/icons/runtime'

import { nativeAccessibilityProps } from './native-accessibility'
import { resolveStrokeWidth } from './native-helpers'
import type { NativeIconBaseProps } from './native-icon-props'
import { renderShape } from './native-shapes'

const CURRENT_COLOR = 'currentColor'

/**
 * The root props that paint the drawing. A stroked icon outlines in `currentColor` with
 * the grid's caps and joins and fills nothing; a filled icon or brand mark fills in
 * `currentColor` and writes no stroke prop at all.
 */
function paintProps(paint: IconPaint | undefined, strokeWidth: number): object {
  if (paint === 'fill') return { fill: CURRENT_COLOR }
  return {
    fill: 'none',
    stroke: CURRENT_COLOR,
    strokeWidth,
    strokeLinecap: ICON_GRID.strokeLinecap,
    strokeLinejoin: ICON_GRID.strokeLinejoin
  }
}

/**
 * Drops props whose value is `undefined` or `null`, so a prop that is absent in value does
 * not erase the default of the same name when spread last.
 */
function withoutNullish(props: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(props).filter(([, value]) => value != null))
}

/**
 * Renders a drawing as an accessible `<Svg>` of react-native-svg.
 *
 * The shapes keep `currentColor` and the `color` prop goes to the root, where
 * react-native-svg resolves it; with no `color` the prop is not written and the icon
 * renders black. Root props are written in this order, and a later one wins: the grid
 * (`viewBox`, `width` and `height` from `size`), the colour, the paint, the accessibility
 * props, then every remaining consumer prop. A consumer prop therefore overrides any
 * default it names; one passed as `undefined` or `null` is absent, not an override.
 *
 * @param props - The icon props, the drawing and its paint.
 * @returns The `<Svg>` element.
 *
 * @example
 * ```tsx
 * import { NativeIcon } from '@bymax-one/icons/native/runtime'
 *
 * <NativeIcon iconNode={[['circle', { cx: 12, cy: 12, r: 9.25 }]]} size={20} title="Status" />
 * ```
 */
export function NativeIcon({
  iconNode,
  paint,
  masterSize = ICON_GRID.size,
  size = masterSize,
  strokeWidth = ICON_GRID.strokeWidth,
  absoluteStrokeWidth = false,
  color,
  title,
  ...props
}: NativeIconBaseProps): ReactElement {
  return createElement(
    Svg,
    {
      width: size,
      height: size,
      viewBox: ICON_GRID.viewBox,
      ...(color == null ? {} : { color }),
      ...paintProps(paint, resolveStrokeWidth(strokeWidth, size, absoluteStrokeWidth, masterSize)),
      ...nativeAccessibilityProps(title, props),
      ...withoutNullish(props)
    },
    ...iconNode.map(renderShape)
  )
}
