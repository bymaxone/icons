/**
 * Unit tests for the naming rules.
 *
 * Layer: unit.
 * Goal: pin every name an icon becomes (the variant name, the component name, the sprite
 * symbol id) and the kebab-case rule a name must meet, which is the one `createIcon`
 * enforces at runtime.
 * Mocks: none.
 */

import { createIcon } from '../runtime/create-icon'

import { componentName, KEBAB_CASE, pascalCase, symbolId, variantName } from './naming.ts'
import type { Variant } from './naming.ts'

describe('variantName', () => {
  it.each([
    ['lightning', 'line', 'lightning'],
    ['lightning', 'filled', 'lightning-filled'],
    ['lightning', 'sm', 'lightning-sm'],
    ['github', 'brand', 'github-brand']
  ] as const)('names %p %p as %p', (name, variant, expected) => {
    /**
     * Scenario: the line master keeps the bare name and every other variant appends its
     * own, so no two variants of one icon share a class name or a symbol id.
     */
    expect(variantName(name, variant)).toBe(expected)
  })
})

describe('pascalCase and componentName', () => {
  it.each([
    ['lightning', 'Lightning'],
    ['arrow-up-right', 'ArrowUpRight'],
    ['aspect-16-9', 'Aspect169'],
    ['x', 'X']
  ])('joins %p as %p', (name, expected) => {
    /**
     * Scenario: each word is capitalised and the words are joined; a word of digits
     * stays as it is.
     */
    expect(pascalCase(name)).toBe(expected)
  })

  it.each([
    ['lightning', 'line', 'LightningIcon'],
    ['lightning', 'filled', 'LightningFilledIcon'],
    ['lightning', 'sm', 'LightningSmIcon'],
    ['google', 'brand', 'GoogleBrandIcon'],
    ['aspect-16-9', 'line', 'Aspect169Icon']
  ] as const)('exports %p %p as %p', (name, variant, expected) => {
    /**
     * Scenario: the component name always ends in `Icon` and carries the variant, so it
     * never collides with an application component such as `Image` or `Link`.
     */
    expect(componentName(name, variant)).toBe(expected)
  })

  it.each([
    ['lightning', 'line'],
    ['arrow-up-right', 'filled'],
    ['aspect-16-9', 'sm'],
    ['github', 'brand']
  ] as const)('agrees with the displayName createIcon derives for %p %p', (name, variant) => {
    /**
     * Scenario: a component is exported under the name developer tools show for it, so
     * the generator's name and the runtime's must be the same function of the name.
     */
    const component = createIcon(variantName(name, variant as Variant), [])
    expect(component.displayName).toBe(componentName(name, variant))
  })
})

describe('symbolId', () => {
  it('prefixes the variant name with bx-', () => {
    /**
     * Scenario: sprite ids live in the consumer's document, so they carry the set's
     * prefix and match the `bx-icon-<name>` class of the same drawing.
     */
    expect(symbolId('lightning', 'line')).toBe('bx-lightning')
    expect(symbolId('lightning', 'filled')).toBe('bx-lightning-filled')
    expect(symbolId('github', 'brand')).toBe('bx-github-brand')
  })
})

describe('KEBAB_CASE', () => {
  it.each(['a', 'home', 'user-plus', 'aspect-16-9', 'file2', 'a1-b2-c3'])('accepts %p', (name) => {
    /**
     * Scenario: lower-case words of letters and digits, joined by single hyphens and
     * starting with a letter, are names.
     */
    expect(KEBAB_CASE.test(name)).toBe(true)
  })

  it.each([
    '',
    'Home',
    'homE',
    '1home',
    '-home',
    'home-',
    'user--plus',
    'user_plus',
    'user plus',
    'home.svg',
    'x-Y',
    'ab-'
  ])('refuses %p', (name) => {
    /**
     * Scenario: an upper-case letter, a leading digit or hyphen, a trailing or doubled
     * hyphen, or any other character makes an ill-formed class and component name.
     */
    expect(KEBAB_CASE.test(name)).toBe(false)
  })
})
