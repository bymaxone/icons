/**
 * Unit tests for the `./meta` size budget.
 *
 * Layer: unit, pure arithmetic.
 * Goal: pin the constants, the cost of a record and the limit with and without the cap.
 * Mocks: none.
 */

import {
  META_BASE_BYTES,
  META_CAP_BYTES,
  META_FLOOR_BYTES,
  META_RECORD_BYTES,
  ROOT_BASE_BYTES,
  ROOT_CAP_BYTES,
  ROOT_FLOOR_BYTES,
  ROOT_ICON_BYTES,
  iconCost,
  metaLimit,
  recordCost,
  rootLimit
} from './meta-budget.ts'

describe('the budget constants', () => {
  it('are the measured base, the per-record budget and the cap', () => {
    /** Scenario: the numbers the comment of `scripts/check-size.mjs` states. */
    expect([META_BASE_BYTES, META_RECORD_BYTES, META_CAP_BYTES, META_FLOOR_BYTES]).toStrictEqual([
      707, 52, 114688, 2048
    ])
  })
})

describe('recordCost', () => {
  it('shares the bytes above the base over the records', () => {
    /** Scenario: 707 + 100 * 40 bytes over 100 records is 40 a record. */
    expect(recordCost(META_BASE_BYTES + 4000, 100)).toBe(40)
  })

  it('counts a bundle with no record as one record', () => {
    /** Scenario: no division by zero; the bytes above the base are the cost. */
    expect(recordCost(META_BASE_BYTES + 30, 0)).toBe(30)
  })

  it('is negative below the base', () => {
    /** Scenario: a bundle lighter than the base costs less than nothing a record. */
    expect(recordCost(META_BASE_BYTES - 10, 5)).toBe(-2)
  })
})

describe('metaLimit', () => {
  it('is the base plus the budget of each record', () => {
    /** Scenario: 559 records are far below the cap. */
    expect(metaLimit(559)).toBe(707 + 52 * 559)
  })

  it('is the floor with no record', () => {
    /** Scenario: a package of a handful of records is held to the floor, not to the base. */
    expect(metaLimit(0)).toBe(META_FLOOR_BYTES)
    expect(metaLimit(3)).toBe(META_FLOOR_BYTES)
  })

  it('leaves the floor where the base and the records pass it', () => {
    /** Scenario: 30 records at 707 + 52 each are over 2,048, so the budget rules. */
    expect(metaLimit(30)).toBe(707 + 52 * 30)
  })

  it('stops at the cap', () => {
    /** Scenario: 5,000 records would exceed the cap by far. */
    expect(metaLimit(5000)).toBe(META_CAP_BYTES)
  })

  it('reaches the cap exactly where the two meet', () => {
    /** Scenario: the records at which base + budget equals the cap are not capped lower. */
    const records = (META_CAP_BYTES - META_BASE_BYTES) / META_RECORD_BYTES
    expect(metaLimit(Math.floor(records))).toBeLessThanOrEqual(META_CAP_BYTES)
    expect(metaLimit(Math.ceil(records))).toBe(META_CAP_BYTES)
  })

  it('leaves room for about 2,000 records at the measured cost', () => {
    /** Scenario: 2,000 records at 44 bytes fit under the limit. */
    expect(metaLimit(2000)).toBeGreaterThan(META_BASE_BYTES + 2000 * 44)
  })
})

describe('the root budget constants', () => {
  it('are the measured base, the per-icon budget and the cap', () => {
    /** Scenario: the numbers the comment of `scripts/check-size.mjs` states for the root. */
    expect([ROOT_BASE_BYTES, ROOT_ICON_BYTES, ROOT_CAP_BYTES, ROOT_FLOOR_BYTES]).toStrictEqual([
      85, 12, 28672, 512
    ])
  })
})

describe('iconCost', () => {
  it('shares the bytes above the base over the icons', () => {
    /** Scenario: 85 + 100 * 10 bytes over 100 icons is 10 an icon. */
    expect(iconCost(ROOT_BASE_BYTES + 1000, 100)).toBe(10)
  })

  it('counts an entry with no icon as one icon', () => {
    /** Scenario: no division by zero; the bytes above the base are the cost. */
    expect(iconCost(ROOT_BASE_BYTES + 7, 0)).toBe(7)
  })
})

describe('rootLimit', () => {
  it('is the base plus the budget of each icon', () => {
    /** Scenario: 661 icons are far below the cap. */
    expect(rootLimit(661)).toBe(85 + 12 * 661)
  })

  it('is the floor with few icons', () => {
    /** Scenario: a package of a handful of icons is held to the floor, not to the base. */
    expect(rootLimit(0)).toBe(ROOT_FLOOR_BYTES)
    expect(rootLimit(2)).toBe(ROOT_FLOOR_BYTES)
  })

  it('leaves the floor where the base and the icons pass it', () => {
    /** Scenario: 100 icons at 85 + 12 each are over 512, so the budget rules. */
    expect(rootLimit(100)).toBe(85 + 12 * 100)
  })

  it('stops at the cap', () => {
    /** Scenario: 5,000 icons would exceed the cap by far. */
    expect(rootLimit(5000)).toBe(ROOT_CAP_BYTES)
  })

  it('reaches the cap exactly where the two meet', () => {
    /** Scenario: the icons at which base + budget equals the cap are not capped lower. */
    const icons = (ROOT_CAP_BYTES - ROOT_BASE_BYTES) / ROOT_ICON_BYTES
    expect(rootLimit(Math.floor(icons))).toBeLessThanOrEqual(ROOT_CAP_BYTES)
    expect(rootLimit(Math.ceil(icons))).toBe(ROOT_CAP_BYTES)
  })
})
