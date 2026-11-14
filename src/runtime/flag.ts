/**
 * @fileoverview The `Flag` base every country flag renders through: it writes the root
 * `<svg>` attributes from the flag's view box, the size and the accessibility rules, then
 * builds the drawing's elements from data with `createElement`. A pure function with no
 * hook, no context and no client directive, so it renders in Server Components and client
 * components alike.
 * @layer Runtime
 */

import { createElement } from 'react'
import type { ReactElement } from 'react'

import { accessibilityAttributes } from './accessibility'
import type { FlagElement } from './flag-node'
import type { FlagBaseProps } from './flag-props'
import { parseViewBox } from './view-box'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

/** The height of a flag with no `size`, which makes a 3:2 flag 24 by 16. */
export const FLAG_DEFAULT_SIZE = 16

/** The width, in px, of a flag `size` px high in a view box of this width and height. */
function widthFor(size: number, boxWidth: number, boxHeight: number): number {
  return Math.round(((size * boxWidth) / boxHeight) * 1000) / 1000
}

/** Builds one flag element from its tag and attributes. */
function renderElement([tag, attributes]: FlagElement): ReactElement {
  return createElement(tag, attributes)
}

/**
 * Drops props whose value is `undefined` or `null`, so a prop that is absent in value does
 * not erase the default of the same name when spread last.
 */
function withoutNullish(props: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(props).filter(([, value]) => value != null))
}

/**
 * Renders a flag as an accessible `<svg>` that keeps its own colours.
 *
 * Root attributes are written in this order, and a later one wins: the namespace, the size
 * (`height` from `size`, and `width` too when `size` is a number and the view box is
 * valid), the view box, `focusable="false"`, the accessibility attributes, then every
 * remaining consumer prop. A consumer attribute therefore overrides any default it names;
 * one passed as `undefined` or `null` is absent, not an override. `children` and
 * `dangerouslySetInnerHTML` are dropped: the content is the drawing, preceded by a `<title>`
 * text child when `title` is set.
 *
 * @param props - The flag props, the drawing and its view box.
 * @returns The `<svg>` element.
 */
export function Flag({
  flagNode,
  viewBox,
  size = FLAG_DEFAULT_SIZE,
  title,
  children: _children,
  dangerouslySetInnerHTML: _markup,
  ...props
}: FlagBaseProps): ReactElement {
  const box = parseViewBox(viewBox)
  const width = typeof size === 'number' && box ? widthFor(size, box.width, box.height) : undefined
  const titleChild = title ? [createElement('title', null, title)] : []
  return createElement(
    'svg',
    {
      xmlns: SVG_NAMESPACE,
      ...(width === undefined ? {} : { width }),
      height: size,
      viewBox,
      focusable: 'false',
      ...accessibilityAttributes(title, props),
      ...withoutNullish(props)
    },
    ...titleChild,
    ...flagNode.map(renderElement)
  )
}
