/**
 * @fileoverview The `Icon` base every Bymax icon renders through: it writes the
 * root `<svg>` attributes from the grid, the paint, the stroke maths and the
 * accessibility rules, then builds the drawing's elements from data with
 * `createElement`. It is a pure function with no hook, no context and no client
 * directive, so it renders in Server Components and client components alike.
 * @layer Runtime
 */

import { createElement } from 'react'
import type { ReactElement, SVGProps } from 'react'

import { ICON_GRID } from '@bymax-one/icons/meta'

import { accessibilityAttributes } from './accessibility'
import type { IconElement, IconPaint } from './icon-node'
import type { IconBaseProps } from './icon-props'
import { resolveStrokeWidth } from './stroke'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const CURRENT_COLOR = 'currentColor'

/**
 * The root attributes that paint the drawing. A stroked icon outlines in `color`
 * with the grid's caps and joins and fills nothing; a filled icon or brand mark
 * fills in `color` and writes no stroke attribute at all.
 */
function paintAttributes(
  paint: IconPaint | undefined,
  color: string,
  strokeWidth: number | string
): SVGProps<SVGSVGElement> {
  if (paint === 'fill') return { fill: color }
  return {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: ICON_GRID.strokeLinecap,
    strokeLinejoin: ICON_GRID.strokeLinejoin
  }
}

/**
 * Builds one drawing element. An attribute of `currentColor` takes the icon's
 * colour, so a filled detail follows the `color` prop as the strokes do.
 */
function renderElement([tag, attributes]: IconElement, color: string): ReactElement {
  const painted = Object.fromEntries(
    Object.entries(attributes).map(([name, value]) => [
      name,
      value === CURRENT_COLOR ? color : value
    ])
  )
  return createElement(tag, painted)
}

/**
 * Renders a drawing as an accessible, themeable `<svg>`.
 *
 * Root attributes are written in this order, and a later one wins: the grid
 * (`viewBox`, `width` and `height` from `size`), the paint, `focusable="false"`,
 * the accessibility attributes, then every remaining consumer prop. A consumer
 * attribute therefore overrides any default it names. `children` and
 * `dangerouslySetInnerHTML` are dropped: the content is the drawing, preceded by a
 * `<title>` text child when `title` is set.
 *
 * @param props - The icon props, the drawing and its paint.
 * @returns The `<svg>` element.
 *
 * @example
 * ```tsx
 * import { Icon } from '@bymax-one/icons'
 *
 * <Icon iconNode={[['circle', { cx: 12, cy: 12, r: 9.25 }]]} size={20} title="Status" />
 * ```
 */
export function Icon({
  iconNode,
  paint,
  size = ICON_GRID.size,
  strokeWidth = ICON_GRID.strokeWidth,
  absoluteStrokeWidth = false,
  color = CURRENT_COLOR,
  title,
  children: _children,
  dangerouslySetInnerHTML: _markup,
  ...props
}: IconBaseProps): ReactElement {
  const titleChild = title ? [createElement('title', null, title)] : []
  return createElement(
    'svg',
    {
      xmlns: SVG_NAMESPACE,
      width: size,
      height: size,
      viewBox: ICON_GRID.viewBox,
      ...paintAttributes(paint, color, resolveStrokeWidth(strokeWidth, size, absoluteStrokeWidth)),
      focusable: 'false',
      ...accessibilityAttributes(title, props),
      ...props
    },
    ...titleChild,
    ...iconNode.map((element) => renderElement(element, color))
  )
}
