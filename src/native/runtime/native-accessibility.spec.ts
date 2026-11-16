/**
 * Unit tests for the native accessibility props.
 *
 * Layer: unit, plain function calls.
 * Goal: pin the title, hidden and consumer-owned cases, and which props count as the
 * consumer's own.
 * Mocks: none.
 */

import { hasOwnNativeAccessibility, nativeAccessibilityProps } from './native-accessibility'

describe('nativeAccessibilityProps', () => {
  it('exposes an icon with a title as a labelled image', () => {
    /** Scenario: a title makes the icon accessible, an image, named by the title. */
    expect(nativeAccessibilityProps('Home', {})).toEqual({
      accessible: true,
      accessibilityRole: 'image',
      accessibilityLabel: 'Home'
    })
  })

  it('keeps the title defaults when the consumer passed accessibility props', () => {
    /** Scenario: a title wins over the consumer-owned check; the root spread lets props override. */
    expect(nativeAccessibilityProps('Home', { accessibilityHint: 'Opens home' })).toEqual({
      accessible: true,
      accessibilityRole: 'image',
      accessibilityLabel: 'Home'
    })
  })

  it('hides a decorative icon', () => {
    /** Scenario: no title and no accessibility props hides the icon from assistive tech. */
    expect(nativeAccessibilityProps(undefined, { testID: 'x' })).toEqual({
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants'
    })
  })

  it('treats an empty title as no title', () => {
    /** Scenario: an empty title would be an unnamed image, so the icon stays hidden. */
    expect(nativeAccessibilityProps('', {})).toEqual({
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants'
    })
  })

  it('writes nothing when the consumer owns accessibility', () => {
    /** Scenario: with no title and an accessibility prop of the consumer, no default is written. */
    expect(nativeAccessibilityProps(undefined, { accessibilityLabel: 'Mine' })).toEqual({})
  })
})

describe('hasOwnNativeAccessibility', () => {
  it.each([
    ['accessible', true],
    ['importantForAccessibility', 'yes'],
    ['role', 'img'],
    ['aria-label', 'x'],
    ['aria-hidden', false],
    ['accessibilityRole', 'button'],
    ['accessibilityElementsHidden', false]
  ])('counts %p as the consumer own', (name, value) => {
    /** Scenario: each accessibility prop family counts, a falsy value included. */
    expect(hasOwnNativeAccessibility({ [name]: value })).toBe(true)
  })

  it.each([
    ['accessibilityLabel', undefined],
    ['accessibilityLabel', null],
    ['aria-label', null],
    ['accessible', undefined]
  ])('does not count %p set to %p', (name, value) => {
    /** Scenario: a prop with no value renders nothing, so it does not take ownership. */
    expect(hasOwnNativeAccessibility({ [name]: value })).toBe(false)
  })

  it.each(['testID', 'style', 'onPress', 'xaccessible', 'myaria-label', 'prole'])(
    'does not count the unrelated prop %p',
    (name) => {
      /** Scenario: only the named accessibility props count, not look-alike names. */
      expect(hasOwnNativeAccessibility({ [name]: 'value' })).toBe(false)
    }
  )
})
