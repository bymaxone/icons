/**
 * @fileoverview The typed metadata of the set: every icon and brand name as a union, the
 * record of each, and the categories. The records are generated from `icons/meta` and
 * `categories.json`; this module gives them their public types and freezes them.
 * @layer Metadata
 */

import { deepFreeze } from './freeze'
import type { CATEGORY_NAMES as CATEGORY_NAME_LIST } from './generated/metadata'
import {
  BRAND_NAMES as BRAND_NAME_LIST,
  BRANDS,
  CATEGORIES,
  ICON_NAMES as ICON_NAME_LIST,
  ICONS
} from './generated/metadata'

/** The name of every non-brand icon, such as `lightning`. */
export type IconName = (typeof ICON_NAME_LIST)[number]

/** The name of every brand mark, such as `github`. */
export type BrandName = (typeof BRAND_NAME_LIST)[number]

/** The name of every category in `categories.json`, such as `navigation`. */
export type IconCategoryName = (typeof CATEGORY_NAME_LIST)[number]

/** A drawing of a non-brand icon: the 24 px line master, the filled variant, the 16 px master. */
export type IconVariant = 'line' | 'filled' | 'sm'

/**
 * Another name an icon's components are exported under. A deprecated alias names the
 * version that removes it.
 */
export type IconAlias =
  | { readonly name: string; readonly deprecated: false }
  | {
      readonly name: string
      readonly deprecated: true
      readonly deprecationReason?: string
      readonly toBeRemovedInVersion: string
    }

/** The metadata of one non-brand icon. */
export interface IconMetadata {
  /**
   * The short accessible name the icon most often takes when it stands alone, such as
   * "Delete" for `trash`; pass it, or a name of your own, as `title`.
   */
  readonly label: string
  /** Search terms: what the icon depicts and what it is used for. */
  readonly tags: readonly string[]
  readonly categories: readonly IconCategoryName[]
  /** Where the icon is used. */
  readonly useCases: readonly string[]
  readonly aliases: readonly IconAlias[]
  /** The drawings that exist; `line` always. */
  readonly variants: readonly IconVariant[]
  /** The masters drawn by hand, in px: 24 always, 16 with the `sm` variant. */
  readonly opticalSizes: readonly (16 | 24)[]
  /** The version that added the icon. */
  readonly since: string
}

/** The metadata of one brand mark. */
export interface BrandMetadata {
  /** The brand's own spelling of its name. */
  readonly title: string
  /** Where the path data was taken from. */
  readonly source: string
  /** The owner's brand guidelines for the mark. */
  readonly guidelines: string
  /** The license of the path data. */
  readonly license: string
  /** The day the path data was retrieved, `YYYY-MM-DD`. */
  readonly retrievedAt: string
  readonly tags: readonly string[]
  readonly aliases: readonly IconAlias[]
  /** The mark keeps its official colours instead of `currentColor`. */
  readonly multicolor: boolean
  /** The version that added the mark. */
  readonly since: string
}

/** One category of `categories.json`. */
export interface IconCategory {
  readonly name: IconCategoryName
  readonly title: string
}

/** Every icon name, in name order. */
export const ICON_NAMES: readonly IconName[] = deepFreeze(ICON_NAME_LIST)

/** Every brand name, in name order. */
export const BRAND_NAMES: readonly BrandName[] = deepFreeze(BRAND_NAME_LIST)

/** The categories, in the order of `categories.json`. */
export const ICON_CATEGORIES: readonly IconCategory[] = deepFreeze(CATEGORIES)

/**
 * The metadata of every icon, keyed by name, frozen.
 *
 * @example
 * ```ts
 * import { ICON_METADATA, ICON_NAMES } from '@bymax-one/icons/meta'
 *
 * const searchable = ICON_NAMES.filter((name) => ICON_METADATA[name].tags.includes('energy'))
 * ```
 */
export const ICON_METADATA: Readonly<Record<IconName, IconMetadata>> = deepFreeze(ICONS)

/** The metadata of every brand mark, keyed by name, frozen. */
export const BRAND_METADATA: Readonly<Record<BrandName, BrandMetadata>> = deepFreeze(BRANDS)
