/**
 * Unit tests for the stroke maths.
 *
 * Layer: unit.
 * Goal: pin `strokeWidth * 24 / size` for numeric sizes, the scaling of a width read
 * at a 16 px master (`strokeWidth * 24 / 16`), and the explicit fallback for every
 * input the division cannot use: a CSS length, a non-numeric width, a zero or
 * negative size, an infinite value.
 * Mocks: none.
 */

import { resolveStrokeWidth } from './stroke'

describe('resolveStrokeWidth', () => {
  it('returns the requested width unchanged when the stroke is not absolute', () => {
    /**
     * Scenario: without `absoluteStrokeWidth` the stroke scales with the drawing,
     * so the requested value is written as given, number or string, at any size.
     */
    expect(resolveStrokeWidth(1.5, 48, false)).toBe(1.5)
    expect(resolveStrokeWidth('2', 16, false)).toBe('2')
    expect(resolveStrokeWidth(1.5, '1em', false)).toBe(1.5)
  })

  it.each([
    [1.5, 24, 1.5],
    [1.5, 48, 0.75],
    [1.5, 16, 2.25],
    [1.5, 20, 1.8],
    [2, 12, 4],
    [3, 72, 1]
  ])('writes %p * 24 / %p = %p for a numeric size', (strokeWidth, size, expected) => {
    /**
     * Scenario: an absolute stroke divides by the drawing's scale (size / 24), so
     * the stroke renders `strokeWidth` px wide whatever the size; the cases above
     * and below the master size pin both directions of the division.
     */
    expect(resolveStrokeWidth(strokeWidth, size, true)).toBe(expected)
  })

  it('accepts numeric strings for both the width and the size', () => {
    /**
     * Scenario: `size="32"` and `strokeWidth="2"` are pixel values written as
     * strings (as JSX attributes often are), so they take part in the division.
     */
    expect(resolveStrokeWidth('2', '32', true)).toBe(1.5)
    expect(resolveStrokeWidth(1.5, '48', true)).toBe(0.75)
    expect(resolveStrokeWidth('3', 36, true)).toBe(2)
  })

  it.each(['1em', '100%', '2rem', 'auto', ''])(
    'keeps the requested width for the non-pixel size %p',
    (size) => {
      /**
       * Scenario: a CSS length has no pixel size to divide by; the width is
       * returned as given instead of `NaN`, and an empty size counts as no size.
       */
      expect(resolveStrokeWidth(1.5, size, true)).toBe(1.5)
    }
  )

  it.each([0, -24, '0', '-8'])(
    'keeps the requested width for the size %p, not above zero',
    (size) => {
      /**
       * Scenario: dividing by zero gives `Infinity` and by a negative size a negative
       * stroke; neither is a width, so the requested width is returned.
       */
      expect(resolveStrokeWidth(2, size, true)).toBe(2)
    }
  )

  it('keeps the requested width when either value is infinite', () => {
    /**
     * Scenario: `Number('Infinity')` parses, but an infinite size or width would
     * write `0` or `Infinity`; both are refused and the width is returned as given.
     */
    expect(resolveStrokeWidth(1.5, Infinity, true)).toBe(1.5)
    expect(resolveStrokeWidth(Infinity, 24, true)).toBe(Infinity)
    expect(resolveStrokeWidth('Infinity', 48, true)).toBe('Infinity')
  })

  it('keeps a non-numeric width as given', () => {
    /**
     * Scenario: a width such as `'2px'` does not parse as a number, so it is
     * written unchanged rather than as `NaN`.
     */
    expect(resolveStrokeWidth('2px', 48, true)).toBe('2px')
  })

  it('keeps an empty or blank width as given instead of zeroing the stroke', () => {
    /**
     * Scenario: `Number('')` and `Number('  ')` are `0`, which would write
     * `stroke-width="0"` and make every stroke invisible; a blank width is not a
     * number and is returned unchanged.
     */
    expect(resolveStrokeWidth('', 48, true)).toBe('')
    expect(resolveStrokeWidth('  ', 48, true)).toBe('  ')
  })

  it('keeps the width when the size is an empty or blank string', () => {
    /**
     * Scenario: a blank size is not a pixel size, so no division happens.
     */
    expect(resolveStrokeWidth(2, '', true)).toBe(2)
    expect(resolveStrokeWidth(2, ' ', true)).toBe(2)
  })

  describe('at a 16 px master', () => {
    it.each([
      [1.5, 2.25],
      [2, 3],
      [1, 1.5],
      ['2', 3]
    ])('writes %p px at the master as %p units of the 24 grid', (strokeWidth, expected) => {
      /**
       * Scenario: a 16 px master is drawn on the 24 grid, so a width read in px at 16
       * is written 24 / 16 times wider; the default 1.5 px becomes 2.25 units, and a
       * numeric string takes part like a number.
       */
      expect(resolveStrokeWidth(strokeWidth, 16, false, 16)).toBe(expected)
    })

    it('scales from the master whatever the rendered size', () => {
      /**
       * Scenario: without `absoluteStrokeWidth` the stroke scales with the drawing,
       * so the written width depends on the master only, not on `size`.
       */
      expect(resolveStrokeWidth(1.5, 48, false, 16)).toBe(2.25)
      expect(resolveStrokeWidth(1.5, '1em', false, 16)).toBe(2.25)
    })

    it.each([
      [1.5, 16, 2.25],
      [1.5, 32, 1.125],
      [1.5, 24, 1.5],
      [2, 12, 4]
    ])('keeps %p px absolute at size %p as %p units', (strokeWidth, size, expected) => {
      /**
       * Scenario: an absolute stroke is `strokeWidth` px at any size whatever the
       * master, so the division by the rendered size is the same as at a 24 master.
       */
      expect(resolveStrokeWidth(strokeWidth, size, true, 16)).toBe(expected)
    })

    it('falls back to the master scaling when an absolute stroke has no pixel size', () => {
      /**
       * Scenario: with a CSS length there is nothing to divide by, so the stroke
       * scales with the drawing as it does without `absoluteStrokeWidth`; it is not
       * written as the raw px value, which would be 2/3 as wide on this master.
       */
      expect(resolveStrokeWidth(1.5, '1em', true, 16)).toBe(2.25)
      expect(resolveStrokeWidth(1.5, 0, true, 16)).toBe(2.25)
    })

    it.each(['2px', '', '  ', 'Infinity', Infinity])(
      'keeps the width %p that is not a finite number as given',
      (strokeWidth) => {
        /**
         * Scenario: a width that does not parse to a finite number cannot be scaled;
         * it is written unchanged rather than as `NaN`, `0` or `Infinity`.
         */
        expect(resolveStrokeWidth(strokeWidth, 16, false, 16)).toBe(strokeWidth)
        expect(resolveStrokeWidth(strokeWidth, 32, true, 16)).toBe(strokeWidth)
      }
    )

    it('leaves a width at the 24 px master as given, numeric string or not', () => {
      /**
       * Scenario: at the 24 master one px is one unit, so the width is written
       * exactly as the consumer passed it; the default master is 24.
       */
      expect(resolveStrokeWidth('2', 24, false, 24)).toBe('2')
      expect(resolveStrokeWidth(2, 24, false)).toBe(2)
    })
  })
})
