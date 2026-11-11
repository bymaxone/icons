/**
 * Unit tests for the ink rule of the icon lint: the measure, the three ceilings of spec
 * section 2.5 and the issues they produce.
 *
 * Layer: unit.
 * Goal: pin the ceilings, the boundary (a drawing at its ceiling passes), the ratio of a master
 * to its line drawing, and the coverage resvg measures on known shapes.
 * Mocks: the measure, where a test needs an exact value; resvg otherwise.
 */

import type { Drawing } from './icon-set.ts'
import { inkIssues, inkOf, LINE_INK_CEILING, SM_INK_CEILING, SM_INK_RATIO } from './lint-ink.ts'

const FILL = (size: number, body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">${body}</svg>`

/** A drawing whose source is its own ink, so a fake measure can read it back. */
const drawing = (path: string, ink: number): Drawing => ({ path, text: String(ink), elements: [] })
const set = (kind: string, inks: Record<string, number>): Map<string, Drawing> =>
  new Map(
    Object.entries(inks).map(([name, ink]) => [name, drawing(`icons/${kind}/${name}.svg`, ink)])
  )
const fake = (svg: string): number => Number(svg)

describe('the ceilings', () => {
  it('are the values of spec section 2.5', () => {
    /**
     * Scenario: 21.5% for a line drawing at 24 px, the same weight at 16 px for a master
     * (21.5% x 24 / 16) and 1.5 times its line drawing.
     */
    expect(LINE_INK_CEILING).toBe(0.215)
    expect(SM_INK_CEILING).toBe(0.3225)
    expect(SM_INK_CEILING).toBeCloseTo((LINE_INK_CEILING * 24) / 16, 10)
    expect(SM_INK_RATIO).toBe(1.5)
  })
})

describe('inkOf', () => {
  it('measures the share of the canvas a drawing covers, at the size its root declares', () => {
    /**
     * Scenario: a solid rectangle over half the canvas covers exactly half, at 24 px and at
     * 16 px; an empty drawing covers nothing.
     */
    expect(inkOf(FILL(24, '<rect width="24" height="12"/>'))).toBe(0.5)
    expect(inkOf(FILL(16, '<rect width="24" height="12"/>'))).toBe(0.5)
    expect(inkOf(FILL(24, '<rect width="6" height="24"/>'))).toBe(0.25)
    expect(inkOf(FILL(24, ''))).toBe(0)
  })
})

describe('inkIssues', () => {
  it('passes drawings at or under their ceilings', () => {
    /**
     * Scenario: a line drawing exactly at 21.5%, a master exactly at 32.25% and exactly 1.5
     * times its line drawing are within the rule.
     */
    const line = set('line', { a: LINE_INK_CEILING, b: 0.2 })
    const sm = set('sm', { a: SM_INK_CEILING, b: 0.3 })
    expect(inkIssues(line, sm, fake)).toStrictEqual([])
  })

  it('flags a line drawing over 21.5%', () => {
    /**
     * Scenario: the heavier drawing is named with its measured share, to one decimal, against
     * the ceiling.
     */
    expect(inkIssues(set('line', { heavy: 0.2151, light: 0.1 }), new Map(), fake)).toStrictEqual([
      {
        file: 'icons/line/heavy.svg',
        rule: 'svg-ink',
        message: 'covers 21.5% of the canvas at 24 px, over the 21.5% ceiling'
      }
    ])
  })

  it('flags a master over 32.25% and over 1.5 times its line drawing, as two issues', () => {
    /**
     * Scenario: a master can break both rules; each is reported, the ratio to two decimals.
     */
    expect(inkIssues(set('line', { a: 0.2 }), set('sm', { a: 0.35 }), fake)).toStrictEqual([
      {
        file: 'icons/sm/a.svg',
        rule: 'svg-ink',
        message: 'covers 35.0% of the canvas at 16 px, over the 32.25% ceiling'
      },
      {
        file: 'icons/sm/a.svg',
        rule: 'svg-ink',
        message: 'weighs 1.75 times its line drawing, over 1.5'
      }
    ])
  })

  it('flags a light master that still outweighs a lighter line drawing', () => {
    /**
     * Scenario: a master under its own ceiling but at 1.51 times its line drawing adds
     * geometry, which the rule forbids.
     */
    expect(inkIssues(set('line', { a: 0.1 }), set('sm', { a: 0.151 }), fake)).toStrictEqual([
      {
        file: 'icons/sm/a.svg',
        rule: 'svg-ink',
        message: 'weighs 1.51 times its line drawing, over 1.5'
      }
    ])
  })

  it('holds a master with no line drawing to its own ceiling only', () => {
    /**
     * Scenario: a master whose line drawing is missing (another rule reports the pairing) has
     * no ratio to check.
     */
    expect(inkIssues(new Map(), set('sm', { lone: 0.3 }), fake)).toStrictEqual([])
  })

  it('measures with resvg by default', () => {
    /**
     * Scenario: without a measure, real drawings are rendered: a line drawing filling the
     * canvas is flagged, an empty one is not.
     */
    const solid = FILL(24, '<rect width="24" height="24"/>')
    const empty = FILL(24, '')
    const issues = inkIssues(
      new Map([
        ['solid', { path: 'icons/line/solid.svg', text: solid, elements: [] }],
        ['empty', { path: 'icons/line/empty.svg', text: empty, elements: [] }]
      ]),
      new Map()
    )
    expect(issues.map(({ file, message }) => [file, message])).toStrictEqual([
      ['icons/line/solid.svg', 'covers 100.0% of the canvas at 24 px, over the 21.5% ceiling']
    ])
  })
})
