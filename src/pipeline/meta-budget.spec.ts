/**
 * Unit tests for the `./meta` size budget.
 *
 * Layer: unit, pure arithmetic.
 * Goal: pin the constants, the cost of a record and the limit with and without the cap.
 * Mocks: none.
 */

import {
  FLAG_MODULE_BYTES,
  FLAGS_BASE_BYTES,
  FLAGS_CAP_BYTES,
  FLAGS_FLAG_BYTES,
  FLAGS_FLOOR_BYTES,
  BRANDS_BASE_BYTES,
  BRANDS_CAP_BYTES,
  BRANDS_FLOOR_BYTES,
  BRANDS_MARK_BYTES,
  META_BASE_BYTES,
  META_CAP_BYTES,
  META_FLOOR_BYTES,
  META_RECORD_BYTES,
  ROOT_BASE_BYTES,
  ROOT_CAP_BYTES,
  ROOT_FLOOR_BYTES,
  ROOT_ICON_BYTES,
  brandsLimit,
  flagCost,
  flagsLimit,
  iconCost,
  markCost,
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

describe('the brands budget constants', () => {
  it('are the measured base, the per-mark budget, the cap and the floor', () => {
    /** Scenario: the numbers the comment of `scripts/check-size.mjs` states for `./brands`. */
    expect([
      BRANDS_BASE_BYTES,
      BRANDS_MARK_BYTES,
      BRANDS_CAP_BYTES,
      BRANDS_FLOOR_BYTES
    ]).toStrictEqual([5, 465, 65536, 5120])
  })
})

describe('markCost', () => {
  it('shares the bytes above the base over the marks', () => {
    /** Scenario: 5 + 100 * 300 bytes over 100 marks is 300 a mark. */
    expect(markCost(BRANDS_BASE_BYTES + 30000, 100)).toBe(300)
  })

  it('counts an entry with no mark as one mark', () => {
    /** Scenario: no division by zero; the bytes above the base are the cost. */
    expect(markCost(BRANDS_BASE_BYTES + 7, 0)).toBe(7)
  })
})

describe('brandsLimit', () => {
  it('is the base plus the budget of each mark', () => {
    /** Scenario: 67 marks are far below the cap. */
    expect(brandsLimit(67)).toBe(5 + 465 * 67)
  })

  it('is the floor with few marks', () => {
    /** Scenario: a package of a handful of marks is held to the floor, not to the base. */
    expect(brandsLimit(0)).toBe(BRANDS_FLOOR_BYTES)
    expect(brandsLimit(3)).toBe(BRANDS_FLOOR_BYTES)
  })

  it('leaves the floor where the base and the marks pass it', () => {
    /** Scenario: 20 marks at 5 + 465 each are over 5,120, so the budget rules. */
    expect(brandsLimit(20)).toBe(5 + 465 * 20)
  })

  it('stops at the cap', () => {
    /** Scenario: 1,000 marks would exceed the cap by far. */
    expect(brandsLimit(1000)).toBe(BRANDS_CAP_BYTES)
  })

  it('reaches the cap exactly where the two meet', () => {
    /** Scenario: the marks at which base + budget equals the cap are not capped lower. */
    const marks = (BRANDS_CAP_BYTES - BRANDS_BASE_BYTES) / BRANDS_MARK_BYTES
    expect(brandsLimit(Math.floor(marks))).toBeLessThanOrEqual(BRANDS_CAP_BYTES)
    expect(brandsLimit(Math.ceil(marks))).toBe(BRANDS_CAP_BYTES)
  })
})

describe('the flags budget constants', () => {
  it('are the measured base, the per-flag budget, the cap, the floor and the module budget', () => {
    /** Scenario: the numbers the comment of `scripts/check-size.mjs` states for `./flags`. */
    expect([
      FLAGS_BASE_BYTES,
      FLAGS_FLAG_BYTES,
      FLAGS_CAP_BYTES,
      FLAGS_FLOOR_BYTES,
      FLAG_MODULE_BYTES
    ]).toStrictEqual([5, 3.5, 8192, 512, 2048])
  })
})

describe('flagCost', () => {
  it('shares the bytes above the base over the flags', () => {
    /** Scenario: 5 + 100 * 3 bytes over 100 flags is 3 a flag. */
    expect(flagCost(FLAGS_BASE_BYTES + 300, 100)).toBe(3)
  })

  it('counts an entry with no flag as one flag', () => {
    /** Scenario: no division by zero; the bytes above the base are the cost. */
    expect(flagCost(FLAGS_BASE_BYTES + 2, 0)).toBe(2)
  })
})

describe('flagsLimit', () => {
  it('is the base plus the budget of each flag', () => {
    /** Scenario: 250 flags are far below the cap. */
    expect(flagsLimit(250)).toBe(5 + 3.5 * 250)
  })

  it('is the floor with few flags', () => {
    /** Scenario: a package of a handful of flags is held to the floor, not to the base. */
    expect(flagsLimit(0)).toBe(FLAGS_FLOOR_BYTES)
    expect(flagsLimit(3)).toBe(FLAGS_FLOOR_BYTES)
  })

  it('leaves the floor where the base and the flags pass it', () => {
    /** Scenario: 200 flags at 5 + 3.5 each are over 512, so the budget rules. */
    expect(flagsLimit(200)).toBe(5 + 3.5 * 200)
  })

  it('stops at the cap', () => {
    /** Scenario: 10,000 flags would exceed the cap by far. */
    expect(flagsLimit(10000)).toBe(FLAGS_CAP_BYTES)
  })

  it('reaches the cap exactly where the two meet', () => {
    /** Scenario: the flags at which base + budget equals the cap are not capped lower. */
    const flags = (FLAGS_CAP_BYTES - FLAGS_BASE_BYTES) / FLAGS_FLAG_BYTES
    expect(flagsLimit(Math.floor(flags))).toBeLessThanOrEqual(FLAGS_CAP_BYTES)
    expect(flagsLimit(Math.ceil(flags))).toBe(FLAGS_CAP_BYTES)
  })
})
