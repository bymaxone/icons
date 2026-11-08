/**
 * @fileoverview Public entry point for the root subpath of `@bymax-one/icons`: the
 * `Icon` base, the `createIcon` factory, their types, and the grid.
 * @layer Module
 *
 * The grid is re-exported from the `./meta` entry by package specifier rather than
 * by relative path. Each entry point is a separate bundle, and a module reached from
 * two of them by a relative path would be copied into each; through the specifier
 * the root imports the one copy `./meta` ships.
 */

export { ICON_GRID } from '@bymax-one/icons/meta'
export { createIcon, Icon } from './runtime'

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
} from './runtime'
