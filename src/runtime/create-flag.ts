/**
 * @fileoverview The factory that turns a flag's drawing into a named component: a stable
 * `displayName` and the `bx-icon` class names, around the `Flag` base.
 * @layer Runtime
 */

import type { ReactElement } from 'react'

import { ICON_NAME, toComponentName } from './create-icon'
import { Flag } from './flag'
import type { FlagNode } from './flag-node'
import type { FlagProps } from './flag-props'
import { parseViewBox } from './view-box'

/** A named flag component, as {@link createFlag} returns it. */
export interface FlagComponent {
  (props: FlagProps): ReactElement
  /** The component name React developer tools show, such as `UsFlagIcon`. */
  displayName: string
}

/**
 * Creates a named flag component.
 *
 * The component renders through {@link Flag} with the given drawing and view box. It writes
 * the class names `bx-icon` and `bx-icon-<name>` first and appends the consumer's
 * `className` after them. Every other prop is passed to `Flag`.
 *
 * @param name - The flag's kebab-case name, such as `us-flag`.
 * @param viewBox - The view box of the drawing, four numbers with a positive width and
 *   height, such as `0 0 513 342`.
 * @param flagNode - The drawing, as data.
 * @returns The component, with `displayName` set from the name.
 * @throws {TypeError} When `name` is not kebab-case or `viewBox` is not four numbers with a
 *   positive width and height.
 *
 * @example
 * ```ts
 * import { createFlag } from '@bymax-one/icons/runtime'
 *
 * export const UsFlagIcon = createFlag('us-flag', '0 0 513 342', [['path', { fill: '#FFF', d: 'M0 0h513v342H0z' }]])
 * ```
 */
export function createFlag(name: string, viewBox: string, flagNode: FlagNode): FlagComponent {
  if (!ICON_NAME.test(name)) {
    throw new TypeError(`Flag name ${JSON.stringify(name)} is not kebab-case.`)
  }
  if (!parseViewBox(viewBox)) {
    throw new TypeError(`Flag view box ${JSON.stringify(viewBox)} is not four numbers.`)
  }
  const className = `bx-icon bx-icon-${name}`
  const component = ({ className: consumerClass, ...props }: FlagProps): ReactElement =>
    Flag({
      ...props,
      flagNode,
      viewBox,
      className: consumerClass ? `${className} ${consumerClass}` : className
    })
  component.displayName = toComponentName(name)
  return component
}
