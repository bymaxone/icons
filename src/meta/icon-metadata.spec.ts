/**
 * Unit tests for the typed metadata of `./meta`.
 *
 * Layer: unit.
 * Goal: prove the typed exports are the generated records, frozen, and that the
 * categories are the ones `categories.json` lists.
 * Mocks: none.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import * as generated from './generated/metadata'
import {
  BRAND_METADATA,
  BRAND_NAMES,
  ICON_CATEGORIES,
  ICON_METADATA,
  ICON_NAMES
} from './icon-metadata'

const CATEGORIES = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'categories.json'), 'utf8')
) as {
  categories: { name: string; title: string }[]
}

describe('typed metadata', () => {
  it('publishes the generated names and records', () => {
    /**
     * Scenario: the typed module adds types and freezing, nothing else; the data is the
     * generated data.
     */
    expect(ICON_NAMES).toBe(generated.ICON_NAMES)
    expect(BRAND_NAMES).toBe(generated.BRAND_NAMES)
    expect(ICON_METADATA).toBe(generated.ICONS)
    expect(BRAND_METADATA).toBe(generated.BRANDS)
    expect(ICON_CATEGORIES).toBe(generated.CATEGORIES)
    expect(Object.keys(ICON_METADATA)).toStrictEqual([...ICON_NAMES])
    expect(Object.keys(BRAND_METADATA)).toStrictEqual([...BRAND_NAMES])
  })

  it('lists the categories of categories.json, in its order', () => {
    /**
     * Scenario: the catalog filters by these categories with their titles.
     */
    expect(ICON_CATEGORIES).toStrictEqual(CATEGORIES.categories)
    expect(generated.CATEGORY_NAMES).toStrictEqual(
      CATEGORIES.categories.map((category) => category.name)
    )
  })

  it('freezes every export all the way down', () => {
    /**
     * Scenario: one set of records backs every consumer in a process, so none can be
     * rewritten.
     */
    for (const value of [ICON_NAMES, BRAND_NAMES, ICON_CATEGORIES, ICON_METADATA, BRAND_METADATA]) {
      expect(Object.isFrozen(value)).toBe(true)
    }
    for (const category of ICON_CATEGORIES) expect(Object.isFrozen(category)).toBe(true)
    expect(() => {
      Reflect.apply(Array.prototype.push, ICON_CATEGORIES, [{ name: 'x', title: 'X' }])
    }).toThrow(TypeError)
  })
})
