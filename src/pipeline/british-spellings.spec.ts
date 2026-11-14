/**
 * Unit tests for the British spelling list.
 *
 * Layer: unit, pure functions.
 * Goal: pin that every listed spelling is found with its American form, that matching is by
 * whole word and case-insensitive, and that American text passes.
 * Mocks: none.
 */

import { BRITISH_SPELLINGS, britishWords } from './british-spellings.ts'

describe('BRITISH_SPELLINGS', () => {
  it('never maps a word to itself and never lists an American form as British', () => {
    /** Scenario: a typo in the table would flag correct text or ask for no change. */
    for (const [british, american] of [...BRITISH_SPELLINGS]) {
      expect(british).toMatch(/^[a-z]+$/)
      expect(american).not.toBe(british)
      expect(BRITISH_SPELLINGS.has(american)).toBe(false)
    }
  })

  it.each([
    ['centred', 'centered'],
    ['analysed', 'analyzed'],
    ['organised', 'organized'],
    ['colourful', 'colorful']
  ])('asks for the American form %s -> %s as it is spelled', (british, american) => {
    /** Scenario: a suffix glued onto a stem must give a real word, not a misspelling like centerd. */
    expect(BRITISH_SPELLINGS.get(british)).toBe(american)
  })

  it.each([...BRITISH_SPELLINGS])('flags %s and asks for %s', (british, american) => {
    /** Scenario: each listed spelling, alone and in a sentence in capitals, is found. */
    expect(britishWords(british)).toStrictEqual([{ british, american }])
    expect(britishWords(`Marks a ${british.toUpperCase()}, today`)).toStrictEqual([
      { british, american }
    ])
  })
})

describe('britishWords', () => {
  it('keeps analyses, the plural noun of analysis, and flags the verb forms', () => {
    /** Scenario: `analyses` is American as a plural noun, so only the verb forms are British. */
    expect(britishWords('Shows statistical analyses')).toStrictEqual([])
    expect(britishWords('analysing')).toStrictEqual([
      { british: 'analysing', american: 'analyzing' }
    ])
  })

  it('passes American text', () => {
    /** Scenario: the American forms and a regional word with no spelling variant are fine. */
    expect(britishWords('Samples a color; the torch and the cancellation')).toStrictEqual([])
  })

  it('matches whole words only', () => {
    /** Scenario: "centred" is listed but "decentre" and "centreless" are other words. */
    expect(britishWords('decentre centreless')).toStrictEqual([])
  })

  it('flags a word joined by a hyphen and reports them in order', () => {
    /** Scenario: `colour-picker` holds a listed word; two words come out in reading order. */
    expect(britishWords('Grey colour-picker')).toStrictEqual([
      { british: 'grey', american: 'gray' },
      { british: 'colour', american: 'color' }
    ])
  })

  it('does not read inherited object keys as spellings', () => {
    /** Scenario: "constructor" and "toString" are properties of every object, not words of the list. */
    expect(britishWords('constructor toString valueOf')).toStrictEqual([])
  })
})
