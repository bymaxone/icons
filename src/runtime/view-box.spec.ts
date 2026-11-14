/**
 * Unit tests for the `viewBox` reader.
 *
 * Layer: unit, pure parsing.
 * Goal: pin what a view box is read as, and every shape of text it refuses.
 * Mocks: none.
 */

import { parseViewBox } from './view-box'

describe('parseViewBox', () => {
  it.each([
    ['0 0 513 342', { minX: 0, minY: 0, width: 513, height: 342 }],
    ['0 85.333 512 341.333', { minX: 0, minY: 85.333, width: 512, height: 341.333 }],
    ['  0,0,22.5,15 ', { minX: 0, minY: 0, width: 22.5, height: 15 }],
    ['-10 -5\t30\n20', { minX: -10, minY: -5, width: 30, height: 20 }],
    ['0 , 0 , 513 , 342', { minX: 0, minY: 0, width: 513, height: 342 }],
    ['1e2 +1 .5 5.', { minX: 100, minY: 1, width: 0.5, height: 5 }]
  ])('reads %p', (text, box) => {
    /**
     * Scenario: four numbers separated by whitespace or by a single comma (with whitespace
     * around it or none), with an origin that may be negative or fractional, are read as the
     * origin and the size.
     */
    expect(parseViewBox(text)).toStrictEqual(box)
  })

  it.each([
    ['an empty text', ''],
    ['three numbers', '0 0 513'],
    ['five numbers', '0 0 513 342 1'],
    ['a word', '0 0 wide 342'],
    ['an infinite number', '0 0 Infinity 342'],
    ['a zero width', '0 0 0 342'],
    ['a negative height', '0 0 513 -342'],
    ['a zero height', '0 0 513 0'],
    ['a doubled comma', '0,,0,,513,,342'],
    ['a leading comma', ',0 0 513 342'],
    ['a trailing comma', '0 0 513 342,'],
    ['a comma and a gap of commas', '0 0 513 ,, 342'],
    ['a hexadecimal number', '0x10 0 513 342'],
    ['a number with a unit', '0 0 513px 342'],
    ['a number too large to be finite', '0 0 1e999 342']
  ])('refuses %s', (_label, text) => {
    /**
     * Scenario: anything that is not four numbers in the SVG list form, each pair joined by
     * whitespace or one comma, with a positive width and height, is no view box, so a flag
     * with it cannot be created.
     */
    expect(parseViewBox(text)).toBeUndefined()
  })
})
