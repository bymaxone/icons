/**
 * Unit tests for the source SVG kinds.
 *
 * Layer: unit.
 * Goal: pin the fixed root attributes of each kind, which kinds are stroked, the variant
 * each kind becomes, and the helpers that walk a per-kind record.
 * Mocks: none.
 */

import {
  isStrokeKind,
  KIND_VARIANT,
  kindEntries,
  mapKinds,
  rootAttributes,
  SVG_KINDS
} from './svg-kind.ts'

const STROKE_ROOT = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '24',
  height: '24',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.5',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round'
}

/** A 16 px master: the same grid and paint, made for 16 px with a 1.5 px stroke at that size. */
const SM_ROOT = {
  ...STROKE_ROOT,
  width: '16',
  height: '16',
  'stroke-width': '2.25'
}

const FILL_ROOT = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '24',
  height: '24',
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}

describe('svg kinds', () => {
  it('lists the four source directories in output order', () => {
    /**
     * Scenario: the outputs list line icons first, then filled, sm and brands; the
     * directory names are the layout of `icons/`.
     */
    expect(SVG_KINDS).toStrictEqual(['line', 'filled', 'sm', 'brands'])
  })

  it('strokes the line icons and the 16 px masters only', () => {
    /**
     * Scenario: a filled icon and a brand mark are filled shapes; drawing them with a
     * stroke would change their silhouette.
     */
    expect(SVG_KINDS.map(isStrokeKind)).toStrictEqual([true, false, true, false])
  })

  it('writes the stroked root and the filled root, in their order', () => {
    /**
     * Scenario: the root attributes match what the `Icon` base renders for the same
     * drawing, attribute for attribute and in the same order, so a raw SVG, a sprite
     * symbol and a component paint alike; a 16 px master is 16 px wide with its
     * 1.5 px stroke written as 2.25 units of the shared grid.
     */
    expect(Object.entries(rootAttributes('line'))).toStrictEqual(Object.entries(STROKE_ROOT))
    expect(Object.entries(rootAttributes('sm'))).toStrictEqual(Object.entries(SM_ROOT))
    expect(Object.entries(rootAttributes('filled'))).toStrictEqual(Object.entries(FILL_ROOT))
    expect(Object.entries(rootAttributes('brands'))).toStrictEqual(Object.entries(FILL_ROOT))
  })

  it('maps each kind to the variant it becomes', () => {
    /**
     * Scenario: a file in `icons/brands` becomes a brand variant; the others keep the
     * directory name.
     */
    expect(KIND_VARIANT).toStrictEqual({
      line: 'line',
      filled: 'filled',
      sm: 'sm',
      brands: 'brand'
    })
  })

  it('maps and lists a per-kind record kind by kind', () => {
    /**
     * Scenario: each kind's value reaches the callback with its own kind, and the
     * entries come in the order of SVG_KINDS.
     */
    const record = { line: 1, filled: 2, sm: 3, brands: 4 }
    expect(mapKinds(record, (value, kind) => `${kind}:${value}`)).toStrictEqual({
      line: 'line:1',
      filled: 'filled:2',
      sm: 'sm:3',
      brands: 'brands:4'
    })
    expect(kindEntries(record)).toStrictEqual([
      ['line', 1],
      ['filled', 2],
      ['sm', 3],
      ['brands', 4]
    ])
  })
})
