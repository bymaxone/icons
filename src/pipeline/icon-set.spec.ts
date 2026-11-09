/**
 * Unit tests for the icon set helpers.
 *
 * Layer: unit.
 * Goal: pin the name order every output uses and the order variants are listed in.
 * Mocks: none.
 */

import { byName, drawnVariants } from './icon-set.ts'
import type { Drawing, IconEntry } from './icon-set.ts'

const DRAWING: Drawing = { path: 'icons/line/a.svg', text: '<svg/>', elements: [] }

const icon = (drawings: IconEntry['drawings']): IconEntry => ({
  name: 'a',
  metaPath: 'icons/meta/a.json',
  meta: {
    $schema: '../../schemas/icon.schema.json',
    tags: ['a'],
    categories: ['system'],
    useCases: ['one', 'two'],
    variants: ['line'],
    opticalSizes: [24],
    since: '1.0.0'
  },
  drawings
})

describe('byName', () => {
  it('orders entries by name in code-unit order, whatever order they came in', () => {
    /**
     * Scenario: a file system lists files in its own order; every output sorts by name,
     * comparing code units, so `aspect-1-1` precedes `aspect-16-9` on every machine.
     */
    const entries = ['zoom', 'aspect-16-9', 'aspect-1-1', 'home'].map((name) => ({ name }))
    expect(byName(entries).map((entry) => entry.name)).toStrictEqual([
      'aspect-1-1',
      'aspect-16-9',
      'home',
      'zoom'
    ])
  })

  it('keeps each entry once and leaves the input as it was', () => {
    /**
     * Scenario: sorting returns the same entry objects, one each, in a new array.
     */
    const entries = [{ name: 'b' }, { name: 'a' }]
    const sorted = byName(entries)
    expect(sorted).toStrictEqual([{ name: 'a' }, { name: 'b' }])
    expect(sorted[0]).toBe(entries[1])
    expect(entries.map((entry) => entry.name)).toStrictEqual(['b', 'a'])
  })
})

describe('drawnVariants', () => {
  it('lists line, filled and sm in that order, skipping the variants with no drawing', () => {
    /**
     * Scenario: the outputs list a line icon's variants in a fixed order, and only the
     * ones that are drawn.
     */
    expect(drawnVariants(icon({ line: DRAWING, filled: DRAWING, sm: DRAWING }))).toStrictEqual([
      ['line', DRAWING],
      ['filled', DRAWING],
      ['sm', DRAWING]
    ])
    expect(drawnVariants(icon({ line: DRAWING, filled: undefined, sm: DRAWING }))).toStrictEqual([
      ['line', DRAWING],
      ['sm', DRAWING]
    ])
    expect(
      drawnVariants(icon({ line: undefined, filled: undefined, sm: undefined }))
    ).toStrictEqual([])
  })
})
