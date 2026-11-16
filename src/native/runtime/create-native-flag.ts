/**
 * @fileoverview The factory that turns a flag's drawing into a named React Native component:
 * a stable `displayName` around the `NativeFlag` base.
 * @layer Runtime
 */

import type { ReactElement } from 'react'

import type { FlagNode } from '@bymax-one/icons/runtime'

import { NativeFlag } from './native-flag'
import { ICON_NAME, parseViewBox, toComponentName } from './native-helpers'
import type { NativeFlagProps } from './native-icon-props'

/** A named React Native flag component, as {@link createNativeFlag} returns it. */
export interface NativeFlagComponent {
  (props: NativeFlagProps): ReactElement
  /** The component name React developer tools show, such as `UsFlagIcon`. */
  displayName: string
}

/**
 * Creates a named React Native flag component.
 *
 * The component renders through {@link NativeFlag} with the given drawing and view box,
 * and passes every prop to it. It writes no class name, which has no meaning on native.
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
 * import { createNativeFlag } from '@bymax-one/icons/native/runtime'
 *
 * export const UsFlagIcon = createNativeFlag('us-flag', '0 0 513 342', [
 *   ['path', { fill: '#FFF', d: 'M0 0h513v342H0z' }]
 * ])
 * ```
 */
export function createNativeFlag(
  name: string,
  viewBox: string,
  flagNode: FlagNode
): NativeFlagComponent {
  if (!ICON_NAME.test(name)) {
    throw new TypeError(`Flag name ${JSON.stringify(name)} is not kebab-case.`)
  }
  if (!parseViewBox(viewBox)) {
    throw new TypeError(`Flag view box ${JSON.stringify(viewBox)} is not four numbers.`)
  }
  const component = (props: NativeFlagProps): ReactElement =>
    NativeFlag({ ...props, flagNode, viewBox })
  component.displayName = toComponentName(name)
  return component
}
