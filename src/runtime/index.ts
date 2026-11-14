/**
 * @fileoverview Public entry point for the `./runtime` subpath of `@bymax-one/icons`: the
 * runtime every icon component renders through, the `Icon` base, the `createIcon` factory,
 * the `Flag` base and the `createFlag` factory for the country flags, and the types of the
 * props and of a drawing. The root re-exports all of it; the
 * generated icon modules import `createIcon` from here.
 * @layer Module
 */

export { createFlag } from './create-flag'
export { createIcon } from './create-icon'
export { Flag } from './flag'
export { Icon } from './icon'

export type { FlagComponent } from './create-flag'
export type { IconComponent, IconOptions } from './create-icon'
export type {
  FlagAttributeName,
  FlagElement,
  FlagElementAttributes,
  FlagElementTag,
  FlagNode
} from './flag-node'
export type { FlagBaseProps, FlagProps } from './flag-props'
export type {
  IconAttributeName,
  IconElement,
  IconElementAttributes,
  IconElementTag,
  IconNode,
  IconPaint
} from './icon-node'
export type { IconBaseProps, IconProps } from './icon-props'
