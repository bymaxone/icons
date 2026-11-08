/**
 * Unit tests for the root accessibility attributes.
 *
 * Layer: unit.
 * Goal: pin the three outcomes (named image, hidden, consumer-owned) and exactly
 * which consumer props count as owning accessibility.
 * Mocks: none.
 */

import { accessibilityAttributes, hasOwnAccessibility } from './accessibility'

describe('hasOwnAccessibility', () => {
  it.each([
    ['role', 'presentation'],
    ['aria-label', 'Close'],
    ['aria-labelledby', 'heading'],
    ['aria-hidden', false],
    ['aria-describedby', ''],
    ['aria-busy', 0]
  ])('counts the consumer prop %p with the value %p', (name, value) => {
    /**
     * Scenario: a `role` or any `aria-*` attribute with a value, including a falsy
     * one that still renders (`false`, `''`, `0`), means the consumer decides how
     * the icon is announced.
     */
    expect(hasOwnAccessibility({ [name]: value })).toBe(true)
  })

  it.each([
    ['aria-label', undefined],
    ['role', undefined],
    ['aria-label', null],
    ['role', null]
  ])('ignores the consumer prop %p when its value is %p', (name, value) => {
    /**
     * Scenario: a prop set to `undefined` or `null` renders no attribute, so
     * `aria-label={maybeLabel}` without a label must not strip the default
     * `aria-hidden` and expose an unnamed graphic.
     */
    expect(hasOwnAccessibility({ [name]: value })).toBe(false)
  })

  it.each(['className', 'data-aria', 'roles', 'ariaLabel', 'x-aria-label', 'onClick'])(
    'ignores the unrelated prop %p',
    (name) => {
      /**
       * Scenario: only `role` itself and names that start with `aria-` count; a
       * name that merely contains either word is an ordinary prop.
       */
      expect(hasOwnAccessibility({ [name]: 'value' })).toBe(false)
    }
  )

  it('looks at every prop, not only the first', () => {
    /**
     * Scenario: the accessibility prop can come after any number of other props,
     * so the scan covers the whole object.
     */
    expect(hasOwnAccessibility({ className: 'a', style: {}, 'aria-label': 'Close' })).toBe(true)
    expect(hasOwnAccessibility({})).toBe(false)
  })
})

describe('accessibilityAttributes', () => {
  it('hides a decorative icon by default', () => {
    /**
     * Scenario: with no title and no accessibility prop, the icon is decoration
     * next to a text label and must be silent.
     */
    expect(accessibilityAttributes(undefined, {})).toStrictEqual({ 'aria-hidden': 'true' })
    expect(accessibilityAttributes(undefined, { className: 'x' })).toStrictEqual({
      'aria-hidden': 'true'
    })
  })

  it('names the icon as an image when it has a title', () => {
    /**
     * Scenario: a title makes the icon content; it is announced as an image whose
     * name is the title, and is not hidden.
     */
    expect(accessibilityAttributes('Settings', {})).toStrictEqual({
      role: 'img',
      'aria-label': 'Settings'
    })
  })

  it('keeps the title attributes even when the consumer adds accessibility props', () => {
    /**
     * Scenario: the consumer's props are spread after these by the icon, so they
     * override the title's on any attribute both set; the title's own attributes
     * are still produced here.
     */
    expect(accessibilityAttributes('Settings', { 'aria-describedby': 'hint' })).toStrictEqual({
      role: 'img',
      'aria-label': 'Settings'
    })
  })

  it('writes nothing when the consumer owns accessibility', () => {
    /**
     * Scenario: a consumer `role` or `aria-*` suppresses the default `aria-hidden`
     * so their own attributes decide.
     */
    expect(accessibilityAttributes(undefined, { role: 'img' })).toStrictEqual({})
    expect(accessibilityAttributes(undefined, { 'aria-label': 'Open' })).toStrictEqual({})
  })

  it('treats an empty title as no title', () => {
    /**
     * Scenario: an image with an empty accessible name is an accessibility error,
     * so `title=""` leaves the icon hidden instead.
     */
    expect(accessibilityAttributes('', {})).toStrictEqual({ 'aria-hidden': 'true' })
  })
})
