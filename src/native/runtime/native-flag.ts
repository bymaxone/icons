/**
 * @fileoverview The `NativeFlag` base every React Native country flag renders through: it
 * writes the root `<Svg>` props from the flag's view box, the size and the accessibility
 * rules, then builds the drawing's elements from data. A pure function with no hook and no
 * context.
 * @layer Runtime
 */

import { createElement } from 'react'
import type { ReactElement } from 'react'
import Svg from 'react-native-svg'

import { nativeAccessibilityProps } from './native-accessibility'
import { FLAG_DEFAULT_SIZE, flagWidth, parseViewBox } from './native-helpers'
import type { NativeFlagBaseProps } from './native-icon-props'
import { renderShape } from './native-shapes'

/**
 * Drops props whose value is `undefined` or `null`, so a prop that is absent in value does
 * not erase the default of the same name when spread last, and drops `color`, which the type
 * omits and which a flag ignores whatever a caller outside the type system passes.
 */
function ownedProps(props: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(props).filter(([name, value]) => name !== 'color' && value != null)
  )
}

/**
 * Renders a flag as an accessible `<Svg>` that keeps its own colours.
 *
 * `size` is the height; the width follows the view box, and is left unwritten when the view
 * box is not four numbers with a positive width and height. A `color` prop is ignored: the
 * flag's colours are on its elements. Root props are written in this order, and a later one
 * wins: the size, the view box, the accessibility props, then every remaining consumer prop,
 * where one passed as `undefined` or `null` is absent, not an override.
 *
 * @param props - The flag props, the drawing and its view box.
 * @returns The `<Svg>` element.
 */
export function NativeFlag({
  flagNode,
  viewBox,
  size = FLAG_DEFAULT_SIZE,
  title,
  ...props
}: NativeFlagBaseProps): ReactElement {
  const box = parseViewBox(viewBox)
  return createElement(
    Svg,
    {
      ...(box === undefined ? {} : { width: flagWidth(size, box.width, box.height) }),
      height: size,
      viewBox,
      ...nativeAccessibilityProps(title, props),
      ...ownedProps(props)
    },
    ...flagNode.map(renderShape)
  )
}
