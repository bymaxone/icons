/**
 * @fileoverview The catalog site's model and the rule its pages depend on: every text a page
 * writes is escaped. The search is in `site-search.ts`. The page templates and the browser
 * script under `site/` build on these; they hold no logic of their own that a wrong value
 * could turn into markup.
 * @layer Pipeline
 */

import type { BrandMetadata, IconAlias, IconCategory, IconMetadata } from '../meta/icon-metadata.ts'
import { componentName } from './naming.ts'
import type { Variant } from './naming.ts'

/** The merged metadata the build writes to `dist/metadata.json`. */
export interface BuiltMetadata {
  readonly icons: Readonly<Record<string, IconMetadata>>
  readonly brands: Readonly<Record<string, BrandMetadata>>
  readonly categories: readonly IconCategory[]
}

/** One drawing of an entry: its variant and the component that renders it. */
export interface CatalogDrawing {
  readonly variant: Variant
  readonly component: string
}

/** An icon or a brand mark, as the catalog lists and searches it. */
export interface CatalogEntry {
  readonly name: string
  readonly kind: 'icon' | 'brand'
  /** The name to show: the icon's name, or the brand's own title. */
  readonly title: string
  /** The accessible name for a standalone use: the icon's label, or the brand's title. */
  readonly label: string
  readonly drawings: readonly CatalogDrawing[]
  /** Category names; a brand mark belongs to `brands`. */
  readonly categories: readonly string[]
  readonly tags: readonly string[]
  readonly aliases: readonly IconAlias[]
  readonly useCases: readonly string[]
  readonly since: string
}

/** A category the catalog filters by: the set's categories and the brands. */
export interface CatalogCategory {
  readonly name: string
  readonly title: string
}

/** The catalog: every entry in name order, icons first, and the categories to filter by. */
export interface Catalog {
  readonly entries: readonly CatalogEntry[]
  readonly categories: readonly CatalogCategory[]
}

/** The category every brand mark is listed under. */
export const BRAND_CATEGORY: CatalogCategory = { name: 'brands', title: 'Brands' }

/**
 * Escapes a text for HTML, as element content or as a quoted attribute value.
 *
 * @param text - Any text.
 * @returns The text with `&`, `<`, `>`, `"` and `'` written as entities; `&` first, so no
 *   entity is escaped twice.
 */
export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/**
 * Builds the catalog from the built metadata.
 *
 * @param metadata - The content of `dist/metadata.json`.
 * @returns Every icon in name order with its drawn variants, then every brand mark, and the
 *   categories followed by the brands category.
 */
export function catalogFrom(metadata: BuiltMetadata): Catalog {
  const icons = Object.entries(metadata.icons)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, icon]): CatalogEntry => ({
      name,
      kind: 'icon',
      title: name,
      label: icon.label,
      drawings: icon.variants.map((variant) => ({
        variant,
        component: componentName(name, variant)
      })),
      categories: icon.categories,
      tags: icon.tags,
      aliases: icon.aliases,
      useCases: icon.useCases,
      since: icon.since
    }))
  const brands = Object.entries(metadata.brands)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, brand]): CatalogEntry => ({
      name,
      kind: 'brand',
      title: brand.title,
      label: brand.title,
      drawings: [{ variant: 'brand', component: componentName(name, 'brand') }],
      categories: [BRAND_CATEGORY.name],
      tags: brand.tags,
      aliases: brand.aliases,
      useCases: [],
      since: brand.since
    }))
  return { entries: [...icons, ...brands], categories: [...metadata.categories, BRAND_CATEGORY] }
}
