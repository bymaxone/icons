/**
 * Unit tests for the stroke maths.
 *
 * Layer: unit.
 * Goal: pin `strokeWidth * 24 / size` for numeric sizes, and the explicit fallback
 * for every input the division cannot use: a CSS length, a non-numeric width, a
 * zero or negative size, an infinite value.
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
})
