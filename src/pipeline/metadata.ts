/**
 * @fileoverview The metadata sources: the shapes of `icons/meta/<name>.json` and
 * `categories.json`, and their validation against the JSON Schemas in `schemas/` with ajv.
 * A file names its schema in `$schema`, and that is what decides whether it describes an
 * icon or a brand mark.
 * @layer Pipeline
 */

import Ajv2020 from 'ajv/dist/2020.js'
import type { ValidateFunction } from 'ajv/dist/2020.js'

/**
 * One alias of an icon or a brand, in Lucide's shape: one in use, or one being retired,
 * which names the version that removes it.
 */
export type AliasSource =
  | { readonly name: string; readonly deprecated: false }
  | {
      readonly name: string
      readonly deprecated: true
      readonly deprecationReason?: string
      readonly toBeRemovedInVersion: string
    }

/** The variants an icon may declare. */
export type IconVariantName = 'line' | 'filled' | 'sm'

/** `icons/meta/<name>.json` of a non-brand icon. */
export interface IconMetaSource {
  readonly $schema: string
  readonly label: string
  readonly tags: readonly string[]
  readonly categories: readonly string[]
  readonly useCases: readonly string[]
  readonly aliases?: readonly AliasSource[]
  readonly variants: readonly IconVariantName[]
  readonly opticalSizes: readonly (16 | 24)[]
  readonly since: string
}

/** `icons/meta/<name>.json` of a brand mark. */
export interface BrandMetaSource {
  readonly $schema: string
  readonly title: string
  readonly source: string
  readonly guidelines: string
  readonly license: string
  readonly retrievedAt: string
  readonly tags?: readonly string[]
  readonly aliases?: readonly AliasSource[]
  readonly multicolor?: boolean
  readonly since: string
}

/** One entry of `categories.json`. */
export interface CategorySource {
  readonly name: string
  readonly title: string
}

/** `categories.json`. */
export interface CategoriesSource {
  readonly $schema: string
  readonly categories: readonly CategorySource[]
}

/** The `$schema` value of an icon's metadata file. */
export const ICON_SCHEMA_REF = '../../schemas/icon.schema.json'

/** The `$schema` value of a brand's metadata file. */
export const BRAND_SCHEMA_REF = '../../schemas/brand.schema.json'

/** The three schemas, parsed from `schemas/`. */
export interface Schemas {
  readonly icon: object
  readonly brand: object
  readonly category: object
}

/** A compiled validator per metadata file kind. */
export interface MetadataValidators {
  readonly icon: ValidateFunction<IconMetaSource>
  readonly brand: ValidateFunction<BrandMetaSource>
  readonly categories: ValidateFunction<CategoriesSource>
}

/**
 * Compiles the schemas. The icon schema is compiled first, which registers it under its
 * `$id`, because the other two refer to its definitions (`icon.schema.json#/$defs/...`).
 * Strict mode refuses an unknown
 * keyword in a schema instead of ignoring it, and every error is reported, not only the
 * first.
 *
 * @param schemas - The parsed schemas.
 * @returns The validators.
 */
export function createValidators(schemas: Schemas): MetadataValidators {
  const ajv = new Ajv2020({ strict: true, allErrors: true })
  return {
    icon: ajv.compile<IconMetaSource>(schemas.icon),
    brand: ajv.compile<BrandMetaSource>(schemas.brand),
    categories: ajv.compile<CategoriesSource>(schemas.category)
  }
}

/**
 * The errors of the last validation, one line each: where in the document, and what is
 * wrong there.
 *
 * @param validate - A validator that has just rejected a value.
 * @returns The messages, such as `/tags must NOT have fewer than 1 items`.
 */
export function validationErrors(validate: ValidateFunction): readonly string[] {
  return (validate.errors ?? []).map((error) => `${error.instancePath || '/'} ${error.message}`)
}

/** The outcome of parsing a JSON file. */
export type ParsedJson =
  { readonly ok: true; readonly value: unknown } | { readonly ok: false; readonly error: string }

/**
 * Parses JSON without throwing.
 *
 * @param text - The file's contents.
 * @returns The value, or the parser's message.
 */
export function parseJson(text: string): ParsedJson {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (error) {
    // JSON.parse throws only a SyntaxError on a string, whose text names the position.
    return { ok: false, error: String(error) }
  }
}
