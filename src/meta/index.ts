/**
 * @fileoverview Public entry point for the `./meta` subpath of `@bymax-one/icons`:
 * typed metadata about the set, with no React import, so it loads in any runtime.
 * @layer Module
 */

export { ICON_GRID } from './icon-grid'
export {
  BRAND_METADATA,
  BRAND_NAMES,
  ICON_CATEGORIES,
  ICON_METADATA,
  ICON_NAMES
} from './icon-metadata'

export type { IconGrid } from './icon-grid'
export type {
  BrandMetadata,
  BrandName,
  IconAlias,
  IconCategory,
  IconCategoryName,
  IconMetadata,
  IconName,
  IconVariant
} from './icon-metadata'
