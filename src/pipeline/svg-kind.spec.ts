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
  it('lists the five source directories in output order', () => {
    /**
     * Scenario: the outputs list line icons first, then filled, sm, brands and flags; the
     * directory names are the layout of `icons/`.
     */
    expect(SVG_KINDS).toStrictEqual(['line', 'filled', 'sm', 'brands', 'flags'])
  })

  it('strokes the line icons and the 16 px masters only', () => {
    /**
     * Scenario: a filled icon and a brand mark are filled shapes, and a flag paints each
     * element itself; drawing them with a root stroke would change their silhouette.
     */
    expect(SVG_KINDS.map(isStrokeKind)).toStrictEqual([true, false, true, false, false])
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

  it('fixes only the namespace on the root of a flag', () => {
    /**
     * Scenario: a flag keeps the view box of its source, which differs from flag to flag, so
     * the fixed root holds the namespace alone and the formatter keeps the file's own view box.
     */
    expect(rootAttributes('flags')).toStrictEqual({ xmlns: 'http://www.w3.org/2000/svg' })
  })

  it('maps each kind to the variant it becomes', () => {
    /**
     * Scenario: a file in `icons/brands` becomes a brand variant and one in `icons/flags`
     * a flag; the others keep the directory name.
     */
    expect(KIND_VARIANT).toStrictEqual({
      line: 'line',
      filled: 'filled',
      sm: 'sm',
      brands: 'brand',
      flags: 'flag'
    })
  })

  it('maps and lists a per-kind record kind by kind', () => {
    /**
     * Scenario: each kind's value reaches the callback with its own kind, and the
     * entries come in the order of SVG_KINDS.
     */
    const record = { line: 1, filled: 2, sm: 3, brands: 4, flags: 5 }
    expect(mapKinds(record, (value, kind) => `${kind}:${value}`)).toStrictEqual({
      line: 'line:1',
      filled: 'filled:2',
      sm: 'sm:3',
      brands: 'brands:4',
      flags: 'flags:5'
    })
    expect(kindEntries(record)).toStrictEqual([
      ['line', 1],
      ['filled', 2],
      ['sm', 3],
      ['brands', 4],
      ['flags', 5]
    ])
  })
})
