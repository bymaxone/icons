/**
 * Unit tests for metadata validation.
 *
 * Layer: unit, with ajv and the repository's schemas.
 * Goal: pin what each schema requires and refuses (the metadata rules of spec section
 * 6.2: required fields, two use cases, the alias shape and its deprecation fields, the
 * brand fields), the error format, and the JSON parse that never throws.
 * Mocks: none.
 */

import { brandMeta, CATEGORIES_TEXT, iconMeta, SCHEMAS } from './__tests__/support.ts'
import {
  BRAND_SCHEMA_REF,
  createValidators,
  ICON_SCHEMA_REF,
  parseJson,
  validationErrors
} from './metadata.ts'

const validators = createValidators(SCHEMAS)
const icon = (overrides: Record<string, unknown> = {}): unknown => JSON.parse(iconMeta(overrides))
const brand = (overrides: Record<string, unknown> = {}): unknown => JSON.parse(brandMeta(overrides))

describe('schema references', () => {
  it('names the schemas the way a file in icons/meta reaches them', () => {
    /**
     * Scenario: `$schema` decides which schema a file is validated against, and an editor
     * resolves it relative to the file.
     */
    expect(ICON_SCHEMA_REF).toBe('../../schemas/icon.schema.json')
    expect(BRAND_SCHEMA_REF).toBe('../../schemas/brand.schema.json')
  })
})

describe('createValidators', () => {
  it('refuses a schema with a keyword ajv does not know, instead of ignoring it', () => {
    /**
     * Scenario: a misspelt keyword such as `minItem` would silently validate nothing;
     * strict mode turns it into an error when the schemas are compiled.
     */
    const category = { ...SCHEMAS.category, minItem: 1 }
    expect(() => createValidators({ ...SCHEMAS, category })).toThrow(/unknown keyword: "minItem"/)
  })
})

describe('icon schema', () => {
  it.each([
    ['the minimal valid file', {}],
    ['a current alias', { aliases: [{ name: 'ring-alias', deprecated: false }] }],
    [
      'a deprecated alias with its version and reason',
      {
        aliases: [
          {
            name: 'old',
            deprecated: true,
            toBeRemovedInVersion: '2.0.0',
            deprecationReason: 'Renamed.'
          }
        ]
      }
    ],
    [
      'a deprecated alias without a reason',
      { aliases: [{ name: 'old', deprecated: true, toBeRemovedInVersion: '10.20.30' }] }
    ],
    ['every variant', { variants: ['line', 'filled', 'sm'], opticalSizes: [24, 16] }]
  ])('accepts %s', (_label, overrides) => {
    /**
     * Scenario: the metadata of spec section 6.2 in every legitimate shape.
     */
    expect(validators.icon(icon(overrides))).toBe(true)
  })

  it.each([
    ['no tags', { tags: [] }, '/tags must NOT have fewer than 1 items'],
    ['a blank tag', { tags: [' power'] }, '/tags/0 must match pattern "^\\S(.*\\S)?$"'],
    [
      'a repeated tag',
      { tags: ['a', 'a'] },
      '/tags must NOT have duplicate items (items ## 0 and 1 are identical)'
    ],
    ['no category', { categories: [] }, '/categories must NOT have fewer than 1 items'],
    [
      'a category that is not kebab-case',
      { categories: ['Status'] },
      '/categories/0 must match pattern "^[a-z][a-z0-9]*(-[a-z0-9]+)*$"'
    ],
    ['a single use case', { useCases: ['Only one'] }, '/useCases must NOT have fewer than 2 items'],
    [
      'no line variant',
      { variants: ['filled'] },
      '/variants must contain at least 1 valid item(s)'
    ],
    [
      'an unknown variant',
      { variants: ['line', 'bold'] },
      '/variants/1 must be equal to one of the allowed values'
    ],
    ['no 24 master', { opticalSizes: [16] }, '/opticalSizes must contain at least 1 valid item(s)'],
    [
      'an unknown size',
      { opticalSizes: [24, 32] },
      '/opticalSizes/1 must be equal to one of the allowed values'
    ],
    [
      'a version that is not x.y.z',
      { since: '1.0' },
      '/since must match pattern "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$"'
    ],
    [
      'a version with a leading zero',
      { since: '01.0.0' },
      '/since must match pattern "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$"'
    ],
    ['an unknown field', { contributors: ['x'] }, '/ must NOT have additional properties'],
    [
      'a different $schema',
      { $schema: '../../schemas/brand.schema.json' },
      '/$schema must be equal to constant'
    ]
  ])('refuses %s', (_label, overrides, message) => {
    /**
     * Scenario: each requirement of the metadata is enforced, and the error names the
     * field that breaks it.
     */
    expect(validators.icon(icon(overrides))).toBe(false)
    expect(validationErrors(validators.icon)).toContain(message)
  })

  it.each(['tags', 'categories', 'useCases', 'variants', 'opticalSizes', 'since', '$schema'])(
    'requires %p',
    (field) => {
      /**
       * Scenario: tags, categories and use cases are required by the spec; the variants,
       * the optical sizes and the version are what the outputs are generated from.
       */
      const value = icon()
      Reflect.deleteProperty(value as object, field)
      expect(validators.icon(value)).toBe(false)
      expect(validationErrors(validators.icon)).toContain(
        `/ must have required property '${field}'`
      )
    }
  )

  it.each([
    ['a deprecated alias without the version that removes it', { name: 'old', deprecated: true }],
    [
      'a current alias with a removal version',
      { name: 'old', deprecated: false, toBeRemovedInVersion: '2.0.0' }
    ],
    [
      'a current alias with a deprecation reason',
      { name: 'old', deprecated: false, deprecationReason: 'x' }
    ],
    ['an alias that is not kebab-case', { name: 'Old', deprecated: false }],
    ['an alias without its deprecated flag', { name: 'old' }]
  ])('refuses %s', (_label, alias) => {
    /**
     * Scenario: a rename keeps the old name as a deprecated alias with
     * `toBeRemovedInVersion` (spec section 4.3), and an alias in use carries neither
     * deprecation field.
     */
    expect(validators.icon(icon({ aliases: [alias] }))).toBe(false)
  })
})

describe('brand schema', () => {
  it.each([
    ['the minimal valid file', {}],
    [
      'the optional fields',
      { tags: ['code'], aliases: [{ name: 'acme-logo', deprecated: false }], multicolor: true }
    ]
  ])('accepts %s', (_label, overrides) => {
    /**
     * Scenario: a brand records where its path data came from, the owner's guidelines,
     * the license and the day it was retrieved (spec section 5).
     */
    expect(validators.brand(brand(overrides))).toBe(true)
  })

  it.each(['title', 'source', 'guidelines', 'license', 'retrievedAt', 'since'])(
    'requires %p',
    (field) => {
      /**
       * Scenario: every brand carries its provenance; a missing field fails.
       */
      const value = brand()
      Reflect.deleteProperty(value as object, field)
      expect(validators.brand(value)).toBe(false)
      expect(validationErrors(validators.brand)).toContain(
        `/ must have required property '${field}'`
      )
    }
  )

  it.each([
    [
      'a source that is not https',
      { source: 'http://example.com' },
      '/source must match pattern "^https://\\S+$"'
    ],
    [
      'guidelines that are not a URL',
      { guidelines: 'see owner' },
      '/guidelines must match pattern "^https://\\S+$"'
    ],
    [
      'a date that is not YYYY-MM-DD',
      { retrievedAt: '2026-13-01' },
      '/retrievedAt must match pattern "^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$"'
    ],
    [
      'a multicolor flag that is not a boolean',
      { multicolor: 'yes' },
      '/multicolor must be boolean'
    ],
    ['icon fields', { variants: ['line'] }, '/ must NOT have additional properties']
  ])('refuses %s', (_label, overrides, message) => {
    /**
     * Scenario: each brand field has a shape a reviewer can rely on.
     */
    expect(validators.brand(brand(overrides))).toBe(false)
    expect(validationErrors(validators.brand)).toContain(message)
  })
})

describe('category schema', () => {
  it('accepts the repository categories.json', () => {
    /**
     * Scenario: the committed category list is valid.
     */
    expect(validators.categories(JSON.parse(CATEGORIES_TEXT))).toBe(true)
  })

  it.each([
    ['an empty list', { $schema: './schemas/category.schema.json', categories: [] }],
    [
      'a category without a title',
      { $schema: './schemas/category.schema.json', categories: [{ name: 'a' }] }
    ],
    [
      'another $schema',
      { $schema: '../schemas/category.schema.json', categories: [{ name: 'a', title: 'A' }] }
    ]
  ])('refuses %s', (_label, value) => {
    /**
     * Scenario: the list must name at least one category, each with a title.
     */
    expect(validators.categories(value)).toBe(false)
  })
})

describe('validationErrors', () => {
  it('locates an error at the root as /', () => {
    /**
     * Scenario: an error about the whole document has an empty path; it is written as `/`
     * so every line names a location.
     */
    validators.icon({})
    expect(validationErrors(validators.icon)[0]).toMatch(/^\/ must have required property/)
  })

  it('is empty after a successful validation', () => {
    /**
     * Scenario: ajv clears its errors on success; no stale error is reported.
     */
    validators.icon(icon())
    expect(validationErrors(validators.icon)).toStrictEqual([])
  })
})

describe('parseJson', () => {
  it('parses JSON and reports a syntax error without throwing', () => {
    /**
     * Scenario: a broken metadata file is a lint issue with the parser's message.
     */
    expect(parseJson('{"a":1}')).toStrictEqual({ ok: true, value: { a: 1 } })
    const failed = parseJson('{"a":')
    expect(failed.ok).toBe(false)
    expect(failed).toStrictEqual({ ok: false, error: expect.stringMatching(/^SyntaxError: /) })
  })
})
