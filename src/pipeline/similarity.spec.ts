/**
 * Unit tests for the similarity check.
 *
 * Layer: unit, with resvg for the rasters.
 * Goal: prove a drawing reads with its defaults, normalises independently of position,
 * size and stroke weight, scores 0 against itself and far against another shape, flags at
 * the distance, and that references load from a directory and sort by distance.
 * Mocks: none; references are read from a scratch directory of a few SVG files.
 */

import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  compareShapes,
  FLAG_DISTANCE,
  INK_THRESHOLD,
  isFlagged,
  isPrimitive,
  loadReferences,
  MASK_DILATION,
  NORMAL_SIDE,
  nearest,
  normalisedShape,
  readDrawing,
  REFERENCE_SETS
} from './similarity.ts'
import type { Paint, ReferenceSet, Scores, SvgDrawing } from './similarity.ts'

jest.mock('node:fs', () => {
  const actual = jest.requireActual<typeof import('node:fs')>('node:fs')
  return { ...actual, readdirSync: jest.fn(actual.readdirSync) }
})

const svg = (body: string, viewBox = '0 0 24 24'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none">${body}</svg>`

const drawingOf = (body: string, paint: Paint = 'stroke', viewBox = '0 0 24 24'): SvgDrawing =>
  readDrawing(svg(body, viewBox), paint)

const RING = '<circle cx="12" cy="12" r="7"/>'
const BAR = '<line x1="3" y1="12" x2="21" y2="12"/>'
const FRAME = '<rect x="4" y="5" width="16" height="14"/>'

const shapeOf = (body: string, paint: Paint = 'stroke', viewBox = '0 0 24 24') => {
  const shape = normalisedShape(drawingOf(body, paint, viewBox))
  if (shape === undefined) throw new Error('expected visible ink')
  return shape
}

const ink = (grid: readonly (readonly number[])[]): number =>
  grid.reduce((sum, row) => sum + row.filter((value) => value > 0).length, 0)

describe('the constants', () => {
  it('pins the canvas, the ink threshold, the dilation and the flag distance', () => {
    /**
     * Scenario: the calibration and the report are written against these values.
     */
    expect([NORMAL_SIDE, INK_THRESHOLD, MASK_DILATION, FLAG_DISTANCE]).toStrictEqual([
      48, 0.4, 1, 0.25
    ])
  })

  it('names the four reference sets with their paint', () => {
    /**
     * Scenario: spec section 3.4 fixes the four sets and how each paints its icons.
     */
    expect(REFERENCE_SETS).toStrictEqual([
      { name: 'lucide', directory: 'node_modules/lucide-static/icons', paint: 'stroke' },
      { name: 'tabler', directory: 'node_modules/@tabler/icons/icons/outline', paint: 'stroke' },
      {
        name: 'phosphor',
        directory: 'node_modules/@phosphor-icons/core/assets/regular',
        paint: 'fill'
      },
      { name: 'heroicons', directory: 'node_modules/heroicons/24/outline', paint: 'stroke' }
    ])
  })
})

describe('readDrawing', () => {
  it('reads the viewBox, the body between the root tags and the paint', () => {
    /**
     * Scenario: a normal document gives its viewBox numbers and only its inner markup.
     */
    expect(
      readDrawing(
        '<?xml version="1.0"?>\n<svg width="9" viewBox="2 3 40 50"><g/><path d="M0 0"/></svg>\n',
        'fill'
      )
    ).toStrictEqual({ viewBox: [2, 3, 40, 50], body: '<g/><path d="M0 0"/>', paint: 'fill' })
  })

  it('defaults to 24 x 24 when the root has no viewBox', () => {
    /**
     * Scenario: a missing viewBox means the 24 unit grid at the origin.
     */
    expect(readDrawing('<svg width="9"><path d="M1 1"/></svg>', 'stroke').viewBox).toStrictEqual([
      0, 0, 24, 24
    ])
  })

  it('ignores a viewBox written on an element inside the root', () => {
    /**
     * Scenario: only the root's attributes count, so a nested viewBox does not leak out.
     */
    expect(readDrawing('<svg><symbol viewBox="0 0 5 5"/></svg>', 'stroke').viewBox).toStrictEqual([
      0, 0, 24, 24
    ])
  })

  it('does not match a name that merely ends with viewBox', () => {
    /**
     * Scenario: the attribute is matched as a whole word.
     */
    expect(readDrawing('<svg xviewBox="1 1 2 2"></svg>', 'stroke').viewBox).toStrictEqual([
      0, 0, 24, 24
    ])
  })

  it('fills the missing numbers of a short viewBox with the defaults', () => {
    /**
     * Scenario: a viewBox with two numbers keeps them and defaults the width and height.
     */
    expect(readDrawing('<svg viewBox="5 6"></svg>', 'stroke').viewBox).toStrictEqual([5, 6, 24, 24])
    expect(readDrawing('<svg viewBox="5"></svg>', 'stroke').viewBox).toStrictEqual([5, 0, 24, 24])
    expect(readDrawing('<svg viewBox=""></svg>', 'stroke').viewBox).toStrictEqual([0, 0, 24, 24])
  })

  it('splits the viewBox on commas and on runs of blanks, ignoring padding', () => {
    /**
     * Scenario: the separators SVG allows are all accepted.
     */
    expect(readDrawing('<svg viewBox="  0,0 ,  16   16 "></svg>', 'stroke').viewBox).toStrictEqual([
      0, 0, 16, 16
    ])
  })

  it('takes the body to the end of the text when the root is never closed', () => {
    /**
     * Scenario: no closing tag means the body runs to the end, trailing text included.
     */
    expect(readDrawing('<svg><path d="M0 0"/>', 'stroke').body).toBe('<path d="M0 0"/>')
  })

  it('takes the root as empty text and the whole text as body when there is no root', () => {
    /**
     * Scenario: markup without an svg element is read whole, with the default box.
     */
    expect(readDrawing('<path d="M0 0"/>', 'fill')).toStrictEqual({
      viewBox: [0, 0, 24, 24],
      body: '<path d="M0 0"/>',
      paint: 'fill'
    })
  })

  it('does not take an svg-prefixed element for the root', () => {
    /**
     * Scenario: the root is matched as a whole word, so `<svgx>` is not the root.
     */
    expect(
      readDrawing('<svgx viewBox="1 1 1 1"><svg viewBox="0 0 8 8"></svg>', 'fill').viewBox
    ).toStrictEqual([0, 0, 8, 8])
  })
})

describe('normalisedShape', () => {
  it('gives undefined for a blank drawing', () => {
    /**
     * Scenario: with no ink there is nothing to compare.
     */
    expect(normalisedShape(drawingOf(''))).toBeUndefined()
  })

  it('gives undefined for a drawing too faint to count', () => {
    /**
     * Scenario: ink under the probe threshold does not make bounds.
     */
    expect(
      normalisedShape(drawingOf('<circle cx="12" cy="12" r="5" opacity="0.05"/>'))
    ).toBeUndefined()
  })

  it('returns four grids of the canvas side', () => {
    /**
     * Scenario: every form of the shape is a NORMAL_SIDE square.
     */
    const shape = shapeOf(RING)
    for (const grid of [shape.blurred, shape.dilated, shape.mask, shape.distances]) {
      expect(grid).toHaveLength(NORMAL_SIDE)
      expect(grid.every((row) => row.length === NORMAL_SIDE)).toBe(true)
    }
  })

  it('draws the ink at the margin of the canvas, centred', () => {
    /**
     * Scenario: the ink bounds fill the canvas less a margin and sit in the middle, on
     * both axes.
     */
    const { mask } = shapeOf('<rect x="2" y="9" width="12" height="4"/>', 'fill')
    const rows = mask.flatMap((row, y) => (row.some((v) => v > 0) ? [y] : []))
    const columns =
      mask[0]?.flatMap((_, x) => (mask.some((row) => (row[x] ?? 0) > 0) ? [x] : [])) ?? []
    // A 12 x 4 box on a 12 x 1.1 square: the box spans 48 / 1.1 = 43.6 px wide.
    expect([columns[0], columns.at(-1)]).toStrictEqual([2, 45])
    expect(rows[0]).toBeGreaterThanOrEqual(15)
    expect(rows.at(-1)).toBeLessThanOrEqual(32)
    expect(Math.abs((rows[0] ?? 0) + (rows.at(-1) ?? 0) - (NORMAL_SIDE - 1))).toBeLessThanOrEqual(1)
  })

  it('centres a tall drawing horizontally', () => {
    /**
     * Scenario: the larger side sets the scale, so a tall drawing is centred across.
     */
    const { mask } = shapeOf('<rect x="9" y="2" width="4" height="12"/>', 'fill')
    const columns =
      mask[0]?.flatMap((_, x) => (mask.some((row) => (row[x] ?? 0) > 0) ? [x] : [])) ?? []
    const rows = mask.flatMap((row, y) => (row.some((v) => v > 0) ? [y] : []))
    expect([rows[0], rows.at(-1)]).toStrictEqual([2, 45])
    expect(
      Math.abs((columns[0] ?? 0) + (columns.at(-1) ?? 0) - (NORMAL_SIDE - 1))
    ).toBeLessThanOrEqual(1)
  })

  it('matches a drawing moved inside its viewBox exactly', () => {
    /**
     * Scenario: position does not hide a copy; that is what normalising is for.
     */
    const scores = compareShapes(
      shapeOf(FRAME),
      shapeOf('<rect x="3" y="4" width="16" height="14"/>')
    )
    expect(scores).toStrictEqual({ cosine: 1, overlap: 1, distance: 0 })
  })

  it('matches a drawing scaled inside its viewBox', () => {
    /**
     * Scenario: size does not hide a copy: a 0.875 scaled frame is still flagged, while the
     * same frame squashed to another proportion is not.
     */
    const scores = compareShapes(
      shapeOf(FRAME),
      shapeOf('<rect x="5" y="6" width="14" height="12.25"/>')
    )
    expect(isFlagged(scores)).toBe(true)
    expect(scores.overlap).toBeGreaterThan(0.9)
    expect(scores.cosine).toBeGreaterThan(0.98)
    expect(
      isFlagged(compareShapes(shapeOf(FRAME), shapeOf('<rect x="4" y="9" width="16" height="6"/>')))
    ).toBe(false)
  })

  it('matches the same drawing in a viewBox of another size and origin', () => {
    /**
     * Scenario: the viewBox's origin and scale are part of the coordinates, not of the shape.
     */
    const a = shapeOf(FRAME)
    const b = shapeOf('<rect x="14" y="15" width="32" height="28" />', 'stroke', '10 10 48 48')
    expect(isFlagged(compareShapes(a, b))).toBe(true)
  })

  it('redraws a stroked drawing at one stroke whatever its size', () => {
    /**
     * Scenario: a small ring and a large one both get a wall of 3 px, where the strokes
     * written in the viewBox would be 1.5 units in both.
     */
    const wall = (body: string): number => {
      const row = shapeOf(body).mask[24] ?? []
      return row.slice(0, 24).filter((value) => value > 0).length
    }
    expect(wall('<circle cx="12" cy="12" r="3.5"/>')).toBeGreaterThanOrEqual(3)
    expect(wall('<circle cx="12" cy="12" r="3.5"/>')).toBeLessThanOrEqual(4)
    expect(wall(RING)).toBe(3)
    expect(wall('<circle cx="12" cy="12" r="10"/>')).toBe(3)
  })

  it('reads the same drawing alike in a viewBox of another scale', () => {
    /**
     * Scenario: a 48-unit drawing gets a 3 unit probe stroke and the same shape.
     */
    expect(shapeOf('<circle cx="24" cy="24" r="14"/>', 'stroke', '0 0 48 48').mask).toStrictEqual(
      shapeOf(RING).mask
    )
  })

  it('draws a filled drawing as filled shapes, without a stroke', () => {
    /**
     * Scenario: a fill drawing is painted solid; its ink is the area, not an outline.
     */
    const { mask } = shapeOf('<circle cx="12" cy="12" r="7"/>', 'fill')
    expect(mask[24]?.[24]).toBe(1)
    expect(ink(mask)).toBeGreaterThan(1200)
  })

  it('scales the probe stroke with a larger viewBox', () => {
    /**
     * Scenario: a hairline on a 48-unit grid is as visible as 1.5 on a 24-unit grid.
     */
    const shape = shapeOf('<line x1="4" y1="24" x2="44" y2="24"/>', 'stroke', '0 0 48 48')
    expect(ink(shape.mask)).toBeGreaterThan(0)
  })

  it('rounds the ends and the joins of a stroke', () => {
    /**
     * Scenario: strokes are drawn with round caps and joins, so a dot has ink and a sharp
     * corner is blunted.
     */
    expect(normalisedShape(drawingOf('<path d="M12 12h.01"/>'))).toBeDefined()
    expect(ink(shapeOf('<path d="M4 4L12 20L20 4"/>').mask)).toBe(280)
  })

  it('dilates the mask by one pixel and blurs the coverage', () => {
    /**
     * Scenario: the dilated mask holds the mask and more; the blurred grid holds soft values.
     */
    const shape = shapeOf(RING)
    expect(ink(shape.dilated)).toBeGreaterThan(ink(shape.mask))
    expect(shape.blurred.flat().some((value) => value > 0 && value < 1)).toBe(true)
  })

  it('gives zero distance on ink and a positive one beside it', () => {
    /**
     * Scenario: the distance grid is the distance to the nearest ink of the mask.
     */
    const { mask, distances } = shapeOf(RING)
    const first = (mask[24] ?? []).indexOf(1)
    expect(distances[24]?.[first]).toBe(0)
    expect(distances[24]?.[first - 1]).toBe(1)
    expect(distances[24]?.[24]).toBeGreaterThan(5)
  })
})

describe('compareShapes and isFlagged', () => {
  it('scores a drawing with itself as distance 0, overlap 1 and cosine 1', () => {
    /**
     * Scenario: identical shapes are as close as can be.
     */
    const scores = compareShapes(shapeOf(RING), shapeOf(RING))
    expect(scores.distance).toBe(0)
    expect(scores.overlap).toBe(1)
    expect(scores.cosine).toBeCloseTo(1, 10)
    expect(isFlagged(scores)).toBe(true)
  })

  it('does not match a different shape', () => {
    /**
     * Scenario: a ring and a bar are far apart on every score.
     */
    const scores = compareShapes(shapeOf(RING), shapeOf(BAR))
    expect(scores.distance).toBeGreaterThan(1)
    expect(scores.overlap).toBeLessThan(0.3)
    expect(scores.cosine).toBeLessThan(0.6)
    expect(isFlagged(scores)).toBe(false)
  })

  it('is symmetric', () => {
    /**
     * Scenario: the order of the pair does not change its scores.
     */
    expect(compareShapes(shapeOf(FRAME), shapeOf(RING))).toStrictEqual(
      compareShapes(shapeOf(RING), shapeOf(FRAME))
    )
  })

  it.each([
    [0, true],
    [0.25, true],
    [0.2500001, false],
    [3, false]
  ])('flags a distance of %s as %s', (distance, flagged) => {
    /**
     * Scenario: the flag is inclusive at FLAG_DISTANCE and closed above it.
     */
    const scores: Scores = { cosine: 0, overlap: 0, distance }
    expect(isFlagged(scores)).toBe(flagged)
  })
})

describe('isPrimitive', () => {
  it.each(['plus', 'minus', 'close', 'check', 'chevron-down', 'arrow-up-right'])(
    'counts %s as a primitive',
    (name) => {
      /**
       * Scenario: the glyphs every set draws alike are primitives.
       */
      expect(isPrimitive(name)).toBe(true)
    }
  )

  it.each([
    'circle',
    'checkbox',
    'plus-circle',
    'chevron',
    'arrow',
    'my-arrow-up',
    'xchevron-up',
    ''
  ])('does not count %s as a primitive', (name) => {
    /**
     * Scenario: only the exact names and the chevron- and arrow- families qualify.
     */
    expect(isPrimitive(name)).toBe(false)
  })
})

describe('loadReferences and nearest', () => {
  const root = mkdtempSync(join(tmpdir(), 'bymax-similarity-'))
  const sets: ReferenceSet[] = [
    { name: 'alpha', directory: 'alpha', paint: 'stroke' },
    { name: 'beta', directory: 'nested/beta', paint: 'fill' }
  ]

  beforeAll(() => {
    mkdirSync(join(root, 'alpha'))
    mkdirSync(join(root, 'nested', 'beta'), { recursive: true })
    writeFileSync(join(root, 'alpha', 'ring.svg'), svg(RING))
    writeFileSync(join(root, 'alpha', 'bar.svg'), svg(BAR))
    writeFileSync(join(root, 'alpha', 'blank.svg'), svg(''))
    writeFileSync(join(root, 'alpha', 'notes.txt'), 'not an icon')
    writeFileSync(join(root, 'alpha', 'ring.svg.bak'), svg(BAR))
    writeFileSync(join(root, 'nested', 'beta', 'disc.svg'), svg(RING))
  })

  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it('reads the icons of each set in file-name order, set by set, skipping blanks and other files', () => {
    /**
     * Scenario: ids are `<set>/<name>`, files are sorted, and a blank drawing or a
     * non-SVG file is left out.
     */
    const references = loadReferences(root, sets)
    expect(references.map(({ id, set, name }) => ({ id, set, name }))).toStrictEqual([
      { id: 'alpha/bar', set: 'alpha', name: 'bar' },
      { id: 'alpha/ring', set: 'alpha', name: 'ring' },
      { id: 'beta/disc', set: 'beta', name: 'disc' }
    ])
  })

  it('sorts the file names itself, whatever order the directory lists them in', () => {
    /**
     * Scenario: a file system may list files in any order; the references still come
     * out in name order.
     */
    jest.mocked(readdirSync).mockReturnValueOnce(['ring.svg', 'bar.svg'] as never)
    expect(loadReferences(root, [sets[0] as ReferenceSet]).map((r) => r.name)).toStrictEqual([
      'bar',
      'ring'
    ])
  })

  it('keeps the drawing read with the set paint and its normalised shape', () => {
    /**
     * Scenario: each reference carries its drawing, painted as its set paints, and a shape.
     */
    const [bar, ring, disc] = loadReferences(root, sets)
    expect(bar?.drawing.paint).toBe('stroke')
    expect(disc?.drawing.paint).toBe('fill')
    expect(bar?.drawing.body).toBe(BAR)
    expect(ring?.shape.mask).toStrictEqual(shapeOf(RING).mask)
  })

  it('reads the four reference sets when none are given', () => {
    /**
     * Scenario: the default sets are the four of spec section 3.4, read under the root.
     */
    const home = mkdtempSync(join(tmpdir(), 'bymax-similarity-default-'))
    try {
      for (const { directory, name } of REFERENCE_SETS) {
        mkdirSync(join(home, directory), { recursive: true })
        writeFileSync(join(home, directory, `${name}-icon.svg`), svg(RING))
      }
      expect(loadReferences(home).map((reference) => reference.id)).toStrictEqual([
        'lucide/lucide-icon',
        'tabler/tabler-icon',
        'phosphor/phosphor-icon',
        'heroicons/heroicons-icon'
      ])
    } finally {
      rmSync(home, { recursive: true, force: true })
    }
  })

  it('gives nothing for no sets', () => {
    /**
     * Scenario: an empty list of sets loads no reference.
     */
    expect(loadReferences(root, [])).toStrictEqual([])
  })

  it('rejects a set whose directory is missing', () => {
    /**
     * Scenario: a missing dependency is an error, not a silent empty set.
     */
    expect(() =>
      loadReferences(root, [{ name: 'gone', directory: 'gone', paint: 'fill' }])
    ).toThrow(/ENOENT/)
  })

  it('sorts the nearest references by distance and cuts the list', () => {
    /**
     * Scenario: a ring is closest to the ring, then the disc, then the bar; the count caps.
     */
    const references = loadReferences(root, sets)
    const matches = nearest(shapeOf(RING), references, 2)
    expect(matches.map((match) => match.reference.id)).toStrictEqual(['alpha/ring', 'beta/disc'])
    expect(matches[0]?.scores.distance).toBe(0)
    expect(nearest(shapeOf(RING), references, 10).map((m) => m.reference.id)).toStrictEqual([
      'alpha/ring',
      'beta/disc',
      'alpha/bar'
    ])
  })

  it('keeps the reference order on a tie', () => {
    /**
     * Scenario: two equally near references keep the order they were loaded in.
     */
    const twin = loadReferences(root, sets)
    const ring = twin[1]
    if (ring === undefined) throw new Error('expected a reference')
    const copy = { ...ring, id: 'alpha/ring-copy' }
    const ids = nearest(shapeOf(RING), [ring, copy], 2).map((m) => m.reference.id)
    expect(ids).toStrictEqual(['alpha/ring', 'alpha/ring-copy'])
  })

  it('gives an empty list for no references or a zero count', () => {
    /**
     * Scenario: nothing to compare, or nothing asked for, returns nothing.
     */
    expect(nearest(shapeOf(RING), [], 3)).toStrictEqual([])
    expect(nearest(shapeOf(RING), loadReferences(root, sets), 0)).toStrictEqual([])
  })
})
