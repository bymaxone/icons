/**
 * @fileoverview The factory that turns a drawing into a named React Native icon component:
 * a stable `displayName` around the `NativeIcon` base. Generated native icon modules are
 * written as one call to it.
 * @layer Runtime
 */

import type { ReactElement } from 'react'

import type { IconNode, IconOptions } from '@bymax-one/icons/runtime'

import { ICON_NAME, toComponentName } from './native-helpers'
import { NativeIcon } from './native-icon'
import type { NativeIconProps } from './native-icon-props'

/** A named React Native icon component, as {@link createNativeIcon} returns it. */
export interface NativeIconComponent {
  (props: NativeIconProps): ReactElement
  /** The component name React developer tools show, such as `LightningIcon`. */
  displayName: string
}

/**
 * Creates a named React Native icon component.
 *
 * The component renders through {@link NativeIcon} with the given drawing and paint, and
 * passes every prop to it. It writes no class name, which has no meaning on native.
 *
 * @param name - The icon's kebab-case name, including any variant suffix
 *   (`lightning`, `lightning-filled`, `google-brand`).
 * @param iconNode - The drawing, as data.
 * @param options - How the drawing is painted, and its master size.
 * @returns The component, with `displayName` set from the name.
 * @throws {TypeError} When `name` is not kebab-case, or `masterSize` is not a positive
 *   finite number.
 *
 * @example
 * ```ts
 * import { createNativeIcon } from '@bymax-one/icons/native/runtime'
 *
 * export const MinusIcon = createNativeIcon('minus', [
 *   ['line', { x1: 4.75, y1: 12, x2: 19.25, y2: 12 }]
 * ])
 * ```
 */
export function createNativeIcon(
  name: string,
  iconNode: IconNode,
  options: IconOptions = {}
): NativeIconComponent {
  if (!ICON_NAME.test(name)) {
    throw new TypeError(`Icon name ${JSON.stringify(name)} is not kebab-case.`)
  }
  const { paint, masterSize } = options
  if (masterSize !== undefined && !(Number.isFinite(masterSize) && masterSize > 0)) {
    throw new TypeError(`Icon master size ${String(masterSize)} is not a positive number.`)
  }
  const component = (props: NativeIconProps): ReactElement =>
    NativeIcon({ ...props, iconNode, paint, masterSize })
  component.displayName = toComponentName(name)
  return component
}
