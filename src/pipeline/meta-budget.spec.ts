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
  META_RECORD_BYTES,
  metaLimit,
  recordCost
} from './meta-budget.ts'

describe('the budget constants', () => {
  it('are the measured base, the per-record budget and the cap', () => {
    /** Scenario: the numbers the comment of `scripts/check-size.mjs` states. */
    expect([META_BASE_BYTES, META_RECORD_BYTES, META_CAP_BYTES]).toStrictEqual([707, 52, 114688])
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

  it('is the base alone with no record', () => {
    /** Scenario: nothing to budget but the fixed part. */
    expect(metaLimit(0)).toBe(707)
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
