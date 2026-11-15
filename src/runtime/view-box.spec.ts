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

/** Builds a view box text whose `slot`th number (0 to 3) is `value`, the others being `1`. */
const withNumber = (slot: number, value: string): string =>
  [0, 1, 2, 3].map((index) => (index === slot ? value : '1')).join(' ')

describe('parseViewBox: the number grammar, in each of the four positions', () => {
  const slots = [0, 1, 2, 3]

  it.each(
    slots.flatMap((slot) =>
      ['.5', '1.5', '+1.5', '5.', '12', '+7', '1e2', '1E-3', '1e+2', '1e25', '1e-25', '1.25e3'].map(
        (value) => [slot, value] as const
      )
    )
  )('accepts in position %p the number %p', (slot, value) => {
    /**
     * Scenario: a leading-dot, fractional, trailing-dot, signed and multi-digit number, and an
     * exponent with either case of `e`, an optional sign and one or more digits, is read in
     * every one of the four positions (a regex branch applies per position).
     */
    expect(parseViewBox(withNumber(slot, value))).toBeDefined()
  })

  it.each(
    slots.flatMap((slot) =>
      [
        '1..2',
        'e5',
        '--1',
        '1e',
        '1e+',
        '1e-',
        'a1',
        '1a',
        '1.2.3',
        '1e2e3',
        'x.5',
        '1.x',
        '+-1'
      ].map((value) => [slot, value] as const)
    )
  )('refuses in position %p the number %p', (slot, value) => {
    /**
     * Scenario: a doubled dot or sign, a bare exponent, an exponent without digits, a letter
     * before or after the digits and a second exponent are no number in any position.
     */
    expect(parseViewBox(withNumber(slot, value))).toBeUndefined()
  })

  it('reads the exact value of fractional and exponent numbers', () => {
    /** Scenario: `.5` and `1.5` keep their fraction; `1e2` is 100, so no digit is lost. */
    expect(parseViewBox('-1.5 .5 1e2 1E-1')).toStrictEqual({
      minX: -1.5,
      minY: 0.5,
      width: 100,
      height: 0.1
    })
  })
})

describe('parseViewBox: separators and whitespace, at each of the three joints', () => {
  const joints = [0, 1, 2]
  const join = (joint: number, separator: string): string =>
    ['1', '2', '3', '4'].reduce(
      (text, number, index) =>
        index === 0 ? number : text + (index - 1 === joint ? separator : ' ') + number,
      ''
    )

  it.each(
    joints.flatMap((joint) =>
      [',', ' , ', ', ', ' ,', '  ', '\t', '\n'].map((separator) => [joint, separator] as const)
    )
  )('accepts at joint %p the separator %j', (joint, separator) => {
    /**
     * Scenario: whitespace of any length, or one comma with whitespace around it or none, joins
     * two numbers at each of the three joints.
     */
    expect(parseViewBox(join(joint, separator))).toBeDefined()
  })

  it.each(
    joints.flatMap((joint) => [',,', ' ,, ', ''].map((separator) => [joint, separator] as const))
  )('refuses at joint %p the separator %j', (joint, separator) => {
    /**
     * Scenario: a doubled comma, or no separator at all (which would run two numbers into
     * one or leave only three), is no joint.
     */
    expect(parseViewBox(join(joint, separator))).toBeUndefined()
  })

  it.each([
    [' 1 2 3 4', true],
    ['1 2 3 4 ', true],
    ['\n1 2 3 4\n', true],
    ['x1 2 3 4', false],
    ['1 2 3 4x', false],
    ['1 2 3 4 x', false],
    ['x 1 2 3 4', false]
  ])('reads the ends of %j: accepted %p', (text, accepted) => {
    /**
     * Scenario: whitespace may surround the four numbers, and nothing else may come before or
     * after them (both anchors hold).
     */
    expect(parseViewBox(text) !== undefined).toBe(accepted)
  })
})
