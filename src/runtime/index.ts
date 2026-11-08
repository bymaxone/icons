/**
 * @fileoverview The runtime every icon component renders through: the `Icon` base,
 * the `createIcon` factory and the types of the props and of a drawing.
 * @layer Module
 */

export { createIcon } from './create-icon'
export { Icon } from './icon'

export type { IconComponent, IconOptions } from './create-icon'
export type {
  IconAttributeName,
  IconElement,
  IconElementAttributes,
  IconElementTag,
  IconNode,
  IconPaint
} from './icon-node'
export type { IconBaseProps, IconProps } from './icon-props'
