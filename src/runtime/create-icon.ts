/**
 * @fileoverview The factory that turns a drawing into a named icon component: a
 * stable `displayName` and the `bx-icon` class names, around the `Icon` base.
 * Generated icon modules are written as one call to it.
 * @layer Runtime
 */

import type { ReactElement } from 'react'

import { Icon } from './icon'
import type { IconNode, IconPaint } from './icon-node'
import type { IconProps } from './icon-props'

/** Options of {@link createIcon}. */
export interface IconOptions {
  /** How the drawing is painted. Default `stroke`; `fill` for filled icons and brand marks. */
  paint?: IconPaint | undefined
  /**
   * The px size the drawing is made for: 24 (the default) for the line and filled
   * icons, 16 for a 16 px master. It is the component's default `size`, and
   * `strokeWidth` is read in px at this size.
   */
  masterSize?: number | undefined
}

/** A named icon component, as {@link createIcon} returns it. */
export interface IconComponent {
  (props: IconProps): ReactElement
  /** The component name React developer tools show, such as `LightningIcon`. */
  displayName: string
}

/**
 * Kebab-case: lower-case letters and digits in words joined by single hyphens,
 * starting with a letter. The name becomes a class name and a component name, so
 * a space, an upper-case letter or a leading digit would make either ill-formed.
 */
export const ICON_NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

/**
 * The component name for an icon name: each word capitalised, then `Icon`, so
 * `lightning-filled` becomes `LightningFilledIcon`.
 */
export function toComponentName(name: string): string {
  const words = name.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  return `${words.join('')}Icon`
}

/**
 * Creates a named icon component.
 *
 * The component renders through {@link Icon} with the given drawing and paint. It
 * writes the class names `bx-icon` and `bx-icon-<name>` first and appends the
 * consumer's `className` after them, so CSS can target every icon or one of them
 * and the consumer's classes still apply. Every other prop is passed to `Icon`.
 *
 * @param name - The icon's kebab-case name, including any variant suffix
 *   (`lightning`, `lightning-filled`, `google-brand`).
 * @param iconNode - The drawing, as data.
 * @param options - How the drawing is painted.
 * @returns The component, with `displayName` set from the name.
 * @throws {TypeError} When `name` is not kebab-case, or `masterSize` is not a
 *   positive finite number.
 *
 * @example
 * ```ts
 * import { createIcon } from '@bymax-one/icons'
 *
 * export const MinusIcon = createIcon('minus', [['line', { x1: 4.75, y1: 12, x2: 19.25, y2: 12 }]])
 * ```
 */
export function createIcon(
  name: string,
  iconNode: IconNode,
  options: IconOptions = {}
): IconComponent {
  if (!ICON_NAME.test(name)) {
    throw new TypeError(`Icon name ${JSON.stringify(name)} is not kebab-case.`)
  }
  const { paint, masterSize } = options
  if (masterSize !== undefined && !(Number.isFinite(masterSize) && masterSize > 0)) {
    throw new TypeError(`Icon master size ${String(masterSize)} is not a positive number.`)
  }
  const iconClassName = `bx-icon bx-icon-${name}`
  const component = ({ className, ...props }: IconProps): ReactElement =>
    Icon({
      ...props,
      iconNode,
      paint,
      masterSize,
      className: className ? `${iconClassName} ${className}` : iconClassName
    })
  component.displayName = toComponentName(name)
  return component
}
