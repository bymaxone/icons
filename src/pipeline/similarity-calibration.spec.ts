/**
 * Unit tests for the similarity calibration.
 *
 * Layer: unit, with resvg for the rasters.
 * Goal: prove the careless copy is built the way the calibration says, the known pairs
 * are chosen by set and name, the quantile is by nearest rank, and the Markdown report is
 * exactly the text a small input produces.
 * Mocks: none; references are normalised from a few inline drawings.
 */

import {
  calibrationMarkdown,
  calibrationPairs,
  perturbed,
  quantile
} from './similarity-calibration.ts'
import type { Calibration } from './similarity-calibration.ts'
import { compareShapes, isFlagged, normalisedShape, readDrawing } from './similarity.ts'
import type { Reference, Scores, SvgDrawing } from './similarity.ts'

const FRAME = '<rect x="4" y="5" width="16" height="14"/>'
const RING = '<circle cx="12" cy="12" r="7"/>'
const BAR = '<line x1="3" y1="12" x2="21" y2="12"/>'

const reference = (set: string, name: string, body: string, viewBox = '0 0 24 24'): Reference => {
  const drawing = readDrawing(`<svg viewBox="${viewBox}">${body}</svg>`, 'stroke')
  const shape = normalisedShape(drawing)
  if (shape === undefined) throw new Error('expected visible ink')
  return { id: `${set}/${name}`, set, name, drawing, shape }
}

const scores = (distance: number, overlap = 0.5, cosine = 0.25): Scores => ({
  distance,
  overlap,
  cosine
})

describe('perturbed', () => {
  it('wraps the body in a scale of 0.95 about the centre, moved half a unit', () => {
    /**
     * Scenario: a careless copy is scaled and shifted by transforms around the original body.
     */
    const drawing: SvgDrawing = { viewBox: [0, 0, 24, 24], body: FRAME, paint: 'stroke' }
    expect(perturbed(drawing)).toStrictEqual({
      viewBox: [0, 0, 24, 24],
      body: `<g transform="translate(12.5 12.5) scale(0.95) translate(-12 -12)">${FRAME}</g>`,
      paint: 'stroke'
    })
  })

  it('scales the shift and the centre with the viewBox size and origin', () => {
    /**
     * Scenario: on a 48-unit grid at (10, 20) the shift is one unit about the box's centre.
     */
    const drawing: SvgDrawing = { viewBox: [10, 20, 48, 24], body: 'x', paint: 'fill' }
    expect(perturbed(drawing)).toStrictEqual({
      viewBox: [10, 20, 48, 24],
      body: '<g transform="translate(35 33) scale(0.95) translate(-34 -32)">x</g>',
      paint: 'fill'
    })
  })

  it('stays within the flag distance of the original, so a copy is caught', () => {
    /**
     * Scenario: the perturbation is what the threshold is calibrated against.
     */
    const original = reference('lucide', 'frame', FRAME)
    const copy = normalisedShape(perturbed(original.drawing))
    if (copy === undefined) throw new Error('expected visible ink')
    expect(isFlagged(compareShapes(copy, original.shape))).toBe(true)
  })
})

describe('quantile', () => {
  it.each([
    [0, 1],
    [0.01, 1],
    [0.25, 2],
    [0.5, 3],
    [0.75, 4],
    [0.99, 5],
    [1, 5]
  ])('takes share %s of five values by nearest rank', (share, expected) => {
    /**
     * Scenario: the value at floor(share * count), clamped to the largest.
     */
    expect(quantile([5, 3, 1, 4, 2], share)).toBe(expected)
  })

  it('does not reorder its input', () => {
    /**
     * Scenario: the sort works on a copy.
     */
    const values = [3, 1, 2]
    quantile(values, 0.5)
    expect(values).toStrictEqual([3, 1, 2])
  })

  it('sorts numerically, not as text', () => {
    /**
     * Scenario: 10 is larger than 9.
     */
    expect(quantile([10, 9, 100], 1)).toBe(100)
    expect(quantile([10, 9, 100], 0)).toBe(9)
  })

  it('gives NaN for no value', () => {
    /**
     * Scenario: an empty group has no quantile.
     */
    expect(quantile([], 0.5)).toBeNaN()
  })
})

describe('calibrationPairs', () => {
  const references = [
    reference('lucide', 'frame', FRAME),
    reference('lucide', 'ring', RING),
    reference('lucide', 'bar', BAR),
    reference('tabler', 'frame', FRAME),
    reference('tabler', 'ring', RING),
    reference('tabler', 'only-tabler', BAR),
    reference('heroicons', 'frame', FRAME),
    reference('heroicons', 'bar', BAR),
    reference('phosphor', 'frame', FRAME)
  ]

  it('pairs the same name across sets, split by lineage', () => {
    /**
     * Scenario: independent pairs are Lucide and Tabler against Heroicons, in that order;
     * related pairs are Lucide against Tabler; a name in one set only makes no pair.
     */
    const { independent, related } = calibrationPairs(references)
    expect(independent.map((pair) => pair.label)).toStrictEqual([
      'lucide/frame ~ heroicons/frame',
      'lucide/bar ~ heroicons/bar',
      'tabler/frame ~ heroicons/frame'
    ])
    expect(related.map((pair) => pair.label)).toStrictEqual([
      'lucide/frame ~ tabler/frame',
      'lucide/ring ~ tabler/ring'
    ])
  })

  it('scores each pair with the two shapes', () => {
    /**
     * Scenario: the same drawing under two sets scores as identical.
     */
    const [first] = calibrationPairs(references).related
    expect(first?.scores).toStrictEqual({ cosine: 1, overlap: 1, distance: 0 })
  })

  it('perturbs every seventh icon of the copied set, starting with the first', () => {
    /**
     * Scenario: the positives are icons 0, 7, 14, ... of the copied set, each against
     * itself, and each is flagged.
     */
    const many = Array.from({ length: 15 }, (_, index) =>
      reference(
        'lucide',
        `box-${index}`,
        `<rect x="${3 + (index % 3)}" y="4" width="14" height="${8 + index}"/>`
      )
    )
    const { copies } = calibrationPairs([...many, reference('tabler', 'box-0', FRAME)])
    expect(copies.map((pair) => pair.label)).toStrictEqual([
      'lucide/box-0',
      'lucide/box-7',
      'lucide/box-14'
    ])
    expect(copies.every((pair) => isFlagged(pair.scores))).toBe(true)
    expect(copies.every((pair) => pair.scores.distance > 0)).toBe(true)
  })

  it('copies from the set it is given', () => {
    /**
     * Scenario: the copied set is a parameter, Lucide by default.
     */
    expect(calibrationPairs(references).copies.map((pair) => pair.label)).toStrictEqual([
      'lucide/frame'
    ])
    expect(calibrationPairs(references, 'phosphor').copies.map((pair) => pair.label)).toStrictEqual(
      ['phosphor/frame']
    )
    expect(calibrationPairs(references, 'nobody').copies).toStrictEqual([])
  })

  it('skips a copy whose perturbed drawing has no ink', () => {
    /**
     * Scenario: a drawing pushed out of its viewBox by the shift leaves no positive.
     */
    const faint = reference('lucide', 'ring', RING)
    const gone: Reference = {
      ...faint,
      drawing: {
        viewBox: [0, 0, 24, 24],
        body: '<rect x="-30" y="-30" width="2" height="2"/>',
        paint: 'fill'
      }
    }
    expect(calibrationPairs([gone]).copies).toStrictEqual([])
  })

  it('gives empty groups for no references', () => {
    /**
     * Scenario: nothing loaded, nothing paired.
     */
    expect(calibrationPairs([])).toStrictEqual({ independent: [], related: [], copies: [] })
  })
})

describe('calibrationMarkdown', () => {
  const pair = (label: string, distance: number, overlap: number, cosine: number) => ({
    label,
    scores: { distance, overlap, cosine }
  })

  it('writes the flagged shares and the quantile tables of each score', () => {
    /**
     * Scenario: the exact document for a small input, with each group's share flagged at
     * the distance and one table a score.
     */
    const calibration: Calibration = {
      copies: [pair('a', 0.1, 0.9, 0.99), pair('b', 0.25, 0.8, 0.98)],
      independent: [pair('c', 0.5, 0.4, 0.5), pair('d', 0.2, 0.7, 0.9), pair('e', 1, 0.1, 0.2)],
      related: []
    }
    expect(calibrationMarkdown(calibration)).toBe(
      [
        '# Similarity calibration',
        '',
        'Written by `pnpm similarity --calibrate`; do not edit by hand.',
        '',
        'A pair is flagged when its chamfer distance is at most 0.25 px on the 48 px normalised canvas.',
        '',
        '| Group | Flagged |',
        '| --- | --- |',
        '| Copies (must flag) | 2 / 2 (100.0%) |',
        '| Independent redesigns | 1 / 3 (33.3%) |',
        '| Related sets (Lucide ~ Tabler) | 0 / 0 (0.0%) |',
        '',
        '### distance',
        '',
        '| Group | Pairs | min | p1 | p5 | p50 | p95 | p99 | max |',
        '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
        '| Copies (must flag) | 2 | 0.100 | 0.100 | 0.100 | 0.250 | 0.250 | 0.250 | 0.250 |',
        '| Independent redesigns | 3 | 0.200 | 0.200 | 0.200 | 0.500 | 1.000 | 1.000 | 1.000 |',
        '| Related sets (Lucide ~ Tabler) | 0 | NaN | NaN | NaN | NaN | NaN | NaN | NaN |',
        '',
        '### overlap',
        '',
        '| Group | Pairs | min | p1 | p5 | p50 | p95 | p99 | max |',
        '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
        '| Copies (must flag) | 2 | 0.800 | 0.800 | 0.800 | 0.900 | 0.900 | 0.900 | 0.900 |',
        '| Independent redesigns | 3 | 0.100 | 0.100 | 0.100 | 0.400 | 0.700 | 0.700 | 0.700 |',
        '| Related sets (Lucide ~ Tabler) | 0 | NaN | NaN | NaN | NaN | NaN | NaN | NaN |',
        '',
        '### cosine',
        '',
        '| Group | Pairs | min | p1 | p5 | p50 | p95 | p99 | max |',
        '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
        '| Copies (must flag) | 2 | 0.980 | 0.980 | 0.980 | 0.990 | 0.990 | 0.990 | 0.990 |',
        '| Independent redesigns | 3 | 0.200 | 0.200 | 0.200 | 0.500 | 0.900 | 0.900 | 0.900 |',
        '| Related sets (Lucide ~ Tabler) | 0 | NaN | NaN | NaN | NaN | NaN | NaN | NaN |',
        ''
      ].join('\n')
    )
  })

  it('ends with a newline', () => {
    /**
     * Scenario: the document is a complete text file.
     */
    expect(calibrationMarkdown({ copies: [], independent: [], related: [] }).endsWith('\n')).toBe(
      true
    )
  })
})
