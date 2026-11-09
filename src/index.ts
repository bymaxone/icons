/**
 * @fileoverview Public entry point for the root subpath of `@bymax-one/icons`: every line,
 * filled and 16 px icon component, the `Icon` base, the `createIcon` factory, their types,
 * and the grid.
 * @layer Module
 *
 * Everything here is re-exported by package specifier (`@bymax-one/icons/runtime`,
 * `@bymax-one/icons/meta`, `@bymax-one/icons/icons/<name>` through the generated list)
 * rather than by relative path. Each entry point is a separate bundle, and a module
 * reached from two of them by a relative path would be copied into each; through the
 * specifier the root imports the one copy each subpath ships. The runtime has an entry of
 * its own because every icon module imports `createIcon`: were it part of the root, the
 * root and the icon modules would import each other.
 */

export { ICON_GRID } from '@bymax-one/icons/meta'
export { createIcon, Icon } from '@bymax-one/icons/runtime'
export * from './icons/generated'

export type { IconGrid } from '@bymax-one/icons/meta'
export type {
  IconAttributeName,
  IconBaseProps,
  IconComponent,
  IconElement,
  IconElementAttributes,
  IconElementTag,
  IconNode,
  IconOptions,
  IconPaint,
  IconProps
} from '@bymax-one/icons/runtime'
