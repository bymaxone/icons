/**
 * Unit tests for deep freezing.
 *
 * Layer: unit.
 * Goal: prove every object and array a value holds is frozen, and that a primitive or
 * `null` passes through.
 * Mocks: none.
 */

import { deepFreeze } from './freeze'

describe('deepFreeze', () => {
  it('freezes the value and every object and array it holds, and returns it', () => {
    /**
     * Scenario: a consumer that writes into a nested record of `./meta` must fail rather
     * than change what every other consumer reads.
     */
    const value = { list: [{ name: 'a' }], nested: { deeper: { tags: ['x'] } } }
    expect(deepFreeze(value)).toBe(value)
    for (const part of [
      value,
      value.list,
      value.list[0],
      value.nested,
      value.nested.deeper,
      value.nested.deeper.tags
    ]) {
      expect(Object.isFrozen(part)).toBe(true)
    }
    expect(() => {
      ;(value.nested.deeper.tags as string[]).push('y')
    }).toThrow(TypeError)
  })

  it.each([null, undefined, 1, 'a', true])('returns %p as it is', (value) => {
    /**
     * Scenario: there is nothing to freeze in a primitive or in null.
     */
    expect(deepFreeze(value)).toBe(value)
  })
})
