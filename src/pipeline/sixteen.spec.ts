/**
 * Unit tests for the 16 px fusion check.
 *
 * Layer: unit, with synthetic alpha arrays and small drawings rendered through resvg.
 * Goal: pin both fusion branches, the vector-touch skip, the 16 px master preference and the
 * three kinds of allowlist failure.
 * Mocks: none.
 */

import { drawing, iconMeta, sources } from './__tests__/support.ts'
import { lintSources } from './lint.ts'
import {
  BRIDGE_ALPHA,
  INK_ALPHA,
  TOUCH_ALPHA,
  fusedPairs,
  fusingIcons,
  pairKey,
  rendersFuse,
  rendersTouch,
  sixteenDrawings,
  sixteenIssues
} from './sixteen.ts'
import type { SixteenDrawing } from './sixteen.ts'

/** A 4 by 4 alpha image from the pixels that carry ink, by index. */
function image(ink: Record<number, number>): Float32Array {
  const pixels = new Float32Array(16)
  for (const [index, alpha] of Object.entries(ink)) pixels[Number(index)] = alpha
  return pixels
}

/** A horizontal stroke on the line grid, as a drawing element. */
const row = (y: number): SixteenDrawing['elements'][number] => ({
  tag: 'path',
  attributes: { d: `M4 ${y}h16` }
})

const lineDrawing = (...elements: SixteenDrawing['elements'][number][]): SixteenDrawing => ({
  name: 'test',
  kind: 'line',
  path: 'icons/line/test.svg',
  elements
})

describe('the thresholds', () => {
  it('names the alphas the measurement uses', () => {
    /** Scenario: the constants hold the values the 16 px method fixes. */
    expect([INK_ALPHA, BRIDGE_ALPHA, TOUCH_ALPHA]).toEqual([0.5, 0.35, 0.98])
  })
})

describe('rendersFuse', () => {
  it('fuses parts that both reach the ink alpha in one pixel', () => {
    /** Scenario: pixel 5 holds exactly half ink of each part. */
    expect(rendersFuse(image({ 5: 0.5 }), image({ 5: 0.5 }))).toBe(true)
  })

  it('does not fuse parts whose shared pixel is below the ink alpha for one of them', () => {
    /** Scenario: the second part's fringe there is 0.25, and its ink is far away. */
    expect(rendersFuse(image({ 5: 1 }), image({ 5: 0.25, 15: 1 }))).toBe(false)
  })

  it('fuses parts whose ink is joined by neighbouring pixels', () => {
    /** Scenario: ink of the first at 0 and of the second at 1, side by side, no shared pixel. */
    expect(rendersFuse(image({ 0: 1 }), image({ 1: 1 }))).toBe(true)
  })

  it('joins ink down a column as well as along a row', () => {
    /** Scenario: ink at pixel 0 and at pixel 4, one row below. */
    expect(rendersFuse(image({ 0: 1 }), image({ 4: 1 }))).toBe(true)
  })

  it('joins ink upward and leftward', () => {
    /** Scenario: the stack starts at the lower right, so the walk must go back up and left. */
    expect(rendersFuse(image({ 15: 1 }), image({ 14: 1 }))).toBe(true)
    expect(rendersFuse(image({ 15: 1 }), image({ 11: 1 }))).toBe(true)
  })

  it('does not join ink across a gap', () => {
    /** Scenario: two clear pixels lie between the inks. */
    expect(rendersFuse(image({ 0: 1 }), image({ 3: 1 }))).toBe(false)
  })

  it('joins ink through a pixel whose combined fringe reaches the bridge alpha', () => {
    /** Scenario: the fringes 0.25 and 0.125 sum to 0.375 on the pixel between the inks. */
    expect(rendersFuse(image({ 0: 1, 1: 0.25 }), image({ 1: 0.125, 2: 1 }))).toBe(true)
  })

  it('does not join ink through a pixel whose combined fringe stays under the bridge alpha', () => {
    /** Scenario: 0.125 and 0.125 sum to 0.25 on the pixel between the inks. */
    expect(rendersFuse(image({ 0: 1, 1: 0.125 }), image({ 1: 0.125, 2: 1 }))).toBe(false)
  })

  it('does not wrap a row into the next one', () => {
    /** Scenario: ink at the end of one row and at the start of the next are not neighbours. */
    expect(rendersFuse(image({ 3: 1 }), image({ 4: 1 }))).toBe(false)
    expect(rendersFuse(image({ 4: 1 }), image({ 3: 1 }))).toBe(false)
    expect(rendersFuse(image({ 0: 1, 4: 1 }), image({ 3: 1 }))).toBe(false)
    expect(rendersFuse(image({ 3: 1 }), image({ 7: 1 }))).toBe(true)
  })

  it('walks left, down and up through a region to reach the ink', () => {
    /** Scenario: a U of pixels, 0 4 8 9 10 6 2, with ink of one part at 0 and of the other at 2. */
    const ring = image({ 0: 1, 4: 0.4, 8: 0.4, 9: 0.4, 10: 0.4, 6: 0.4 })
    expect(rendersFuse(ring, image({ 2: 1 }))).toBe(true)
    /** Scenario: ink at 1 and at 8, joined by 5 and 9 below 1 and then a step left. */
    expect(rendersFuse(image({ 1: 1, 5: 0.4, 9: 0.4 }), image({ 8: 1 }))).toBe(true)
  })

  it('does not bridge two regions through a pixel that carries no ink or fringe', () => {
    /** Scenario: pixel 1 is clear; ink at 2 and at 5 touches it only on a side each, and not each other. */
    expect(rendersFuse(image({ 2: 1 }), image({ 5: 1 }))).toBe(false)
  })

  it('does not fuse when only one part has ink', () => {
    /** Scenario: the second part leaves no pixel at all. */
    expect(rendersFuse(image({ 0: 1, 1: 1 }), image({}))).toBe(false)
  })

  it('does not wrap a column off the top or the bottom', () => {
    /** Scenario: ink in the top row and in the bottom row of one column are 12 pixels apart. */
    expect(rendersFuse(image({ 1: 1 }), image({ 13: 1 }))).toBe(false)
  })
})

describe('rendersTouch', () => {
  it('touches when both parts cover one pixel almost fully', () => {
    /** Scenario: both reach the touch alpha on pixel 2. */
    expect(rendersTouch(image({ 2: 0.98 }), image({ 2: 1 }))).toBe(true)
  })

  it('does not touch when one part is under the touch alpha there', () => {
    /** Scenario: the second part covers 0.9 on the shared pixel. */
    expect(rendersTouch(image({ 2: 1 }), image({ 2: 0.9 }))).toBe(false)
  })

  it('does not touch when the covered pixels differ', () => {
    /** Scenario: each part is full on a pixel the other leaves clear. */
    expect(rendersTouch(image({ 1: 1 }), image({ 2: 1 }))).toBe(false)
  })
})

describe('fusedPairs', () => {
  it('finds no fusion between strokes far apart', () => {
    /** Scenario: two rows 12 units apart are 8 pixels apart at 16 px. */
    expect(fusedPairs(lineDrawing(row(6), row(18)))).toEqual([])
  })

  it('finds strokes that abut at 16 px without touching', () => {
    /** Scenario: rows 1.5 units apart are 1 px apart, each one pixel row of full ink. */
    expect(fusedPairs(lineDrawing(row(8.25), row(9.75)))).toEqual([[0, 1]])
  })

  it('names the positions of the pair among other parts', () => {
    /** Scenario: a far row sits between two abutting ones. */
    expect(fusedPairs(lineDrawing(row(8.25), row(20), row(9.75)))).toEqual([[0, 2]])
  })

  it('skips parts that touch in the vector', () => {
    /** Scenario: a plus is one shape, so its strokes are joined on purpose. */
    const plus = lineDrawing(row(12), { tag: 'path', attributes: { d: 'M12 4v16' } })
    expect(fusedPairs(plus)).toEqual([])
  })

  it('renders a 16 px master on its own root', () => {
    /** Scenario: a master strokes at 2.25 units, so rows 3 units apart fuse where the line's 1.5 units do not. */
    const line = lineDrawing(row(8), row(11))
    expect(fusedPairs(line)).toEqual([])
    expect(fusedPairs({ ...line, kind: 'sm' })).toEqual([[0, 1]])
  })

  it('finds nothing in a drawing of one part or none', () => {
    /** Scenario: a pair needs two parts. */
    expect(fusedPairs(lineDrawing(row(8)))).toEqual([])
    expect(fusedPairs(lineDrawing())).toEqual([])
  })
})

describe('fusingIcons', () => {
  it('keeps the icons that fuse, with their pairs', () => {
    /** Scenario: one drawing abuts and the other is clean. */
    const fused = { ...lineDrawing(row(8.25), row(9.75)), name: 'fused' }
    const clean = { ...lineDrawing(row(6), row(18)), name: 'clean' }
    expect(fusingIcons([fused, clean])).toEqual(new Map([['fused', [[0, 1]]]]))
  })
})

describe('sixteenDrawings', () => {
  const meta = iconMeta({ variants: ['line', 'sm'], opticalSizes: [24, 16] })
  const set = lintSources(
    sources({
      line: {
        'both.svg': drawing('line', '<path d="M4 8h16"/>'),
        'plain.svg': drawing('line', '<path d="M4 12h16"/>')
      },
      sm: { 'both.svg': drawing('sm', '<path d="M4 8h12"/>') },
      meta: { 'both.json': meta, 'plain.json': iconMeta() }
    })
  )

  it('prefers the 16 px master and falls back to the line drawing', () => {
    /** Scenario: `both` has a master, `plain` has only its line drawing. */
    expect(set.issues).toEqual([])
    expect(sixteenDrawings(set.set).map(({ name, kind, path }) => [name, kind, path])).toEqual([
      ['both', 'sm', 'icons/sm/both.svg'],
      ['plain', 'line', 'icons/line/plain.svg']
    ])
  })

  it('leaves out an icon that has no line or master drawing', () => {
    /** Scenario: an icon whose only drawings are other variants is out of scope. */
    const [icon] = set.set.icons
    const bare = {
      ...set.set,
      icons: [{ ...icon!, drawings: { ...icon!.drawings, line: undefined, sm: undefined } }]
    }
    expect(sixteenDrawings(bare)).toEqual([])
  })
})

describe('pairKey', () => {
  it('writes a pair as the allowlist does', () => {
    /** Scenario: the element positions are joined by a hyphen, counted from 0. */
    expect(pairKey([0, 2])).toBe('0-2')
  })
})

describe('sixteenIssues', () => {
  const drawings = ['a', 'b'].map((name) => ({ ...lineDrawing(), name }))
  const fusing = new Map<string, [number, number][]>([
    [
      'a',
      [
        [0, 1],
        [0, 2]
      ]
    ]
  ])
  const both = { a: { pairs: ['0-1', '0-2'], why: 'it reads' } }

  it('is quiet when every fused pair is justified', () => {
    /** Scenario: `a` fuses on two pairs and both are listed with a reason. */
    expect(sixteenIssues(drawings, fusing, both)).toEqual([])
  })

  it('names an icon that fuses without being listed, once for each pair', () => {
    /** Scenario: the allowlist is empty; pairs are written as the allowlist writes them. */
    expect(sixteenIssues(drawings, fusing, {})).toEqual([
      'a: pair 0-1 fuses at 16 px. Redraw it, or list the pair in scripts/sixteen-allowlist.json with a justification.',
      'a: pair 0-2 fuses at 16 px. Redraw it, or list the pair in scripts/sixteen-allowlist.json with a justification.'
    ])
  })

  it('names each pair exactly as the allowlist must spell it', () => {
    /** Scenario: the pairs read back from the messages, once listed, clear every issue. */
    const named = sixteenIssues(drawings, fusing, {}).map(
      (issue) => /^a: pair (\d+-\d+) fuses/.exec(issue)?.[1] ?? issue
    )
    expect(named).toEqual(['0-1', '0-2'])
    expect(sixteenIssues(drawings, fusing, { a: { pairs: named, why: 'it reads' } })).toEqual([])
  })

  it('names a new pair of an icon that is already listed', () => {
    /** Scenario: `a` is listed for 0-1 only, and has begun to fuse on 0-2. */
    expect(sixteenIssues(drawings, fusing, { a: { pairs: ['0-1'], why: 'it reads' } })).toEqual([
      'a: pair 0-2 fuses at 16 px. Redraw it, or list the pair in scripts/sixteen-allowlist.json with a justification.'
    ])
  })

  it('fails a listed pair that no longer fuses', () => {
    /** Scenario: `a` still fuses on 0-1 and 0-2, and is listed for 1-2 as well. */
    const listed = { a: { pairs: ['0-1', '0-2', '1-2'], why: 'it reads' } }
    expect(sixteenIssues(drawings, fusing, listed)).toEqual([
      'a: pair 1-2 is on the allowlist but no longer fuses at 16 px. Remove it.'
    ])
  })

  it('fails an entry whose icon no longer fuses', () => {
    /** Scenario: `b` is listed but is clean. */
    expect(sixteenIssues(drawings, fusing, { ...both, b: { pairs: ['0-1'], why: 'x' } })).toEqual([
      'b: on the allowlist but no longer fuses at 16 px. Remove its entry.'
    ])
  })

  it('fails an entry whose icon does not exist', () => {
    /** Scenario: `gone` names no drawing. */
    expect(
      sixteenIssues(drawings, fusing, { ...both, gone: { pairs: ['0-1'], why: 'x' } })
    ).toEqual(['gone: on the allowlist but there is no such icon. Remove its entry.'])
  })

  it('fails an entry with no pairs', () => {
    /** Scenario: `a` has an empty list, so every pair it fuses on is unlisted too. */
    const issues = sixteenIssues(drawings, fusing, { a: { pairs: [], why: 'it reads' } })
    expect(issues).toContain(
      'a: on the allowlist without any pair. Remove its entry or list the pairs.'
    )
    expect(issues).toHaveLength(3)
  })

  it('fails an entry with an empty or blank justification', () => {
    /** Scenario: `a` has an empty text and is listed on its pairs; `b` has spaces and is clean. */
    const listed = { a: { pairs: ['0-1', '0-2'], why: '' }, b: { pairs: ['0-1'], why: '  ' } }
    expect(sixteenIssues(drawings, fusing, listed)).toEqual([
      'a: on the allowlist without a justification.',
      'b: on the allowlist but no longer fuses at 16 px. Remove its entry.',
      'b: on the allowlist without a justification.'
    ])
  })

  it.each(['0', '1-0', '1-1', 'a-b', '0-1-2', '01-2', ' 0-1', '0-1 ', '-1-2', ''])(
    'fails the malformed pair %j',
    (pair) => {
      /** Scenario: a pair must be two indices with the first below the second, no padding. */
      const listed = { a: { pairs: ['0-1', '0-2', pair], why: 'it reads' } }
      expect(sixteenIssues(drawings, fusing, listed)).toEqual([
        `a: the pair ${JSON.stringify(pair)} is malformed. Write it as "i-j" with i below j, counted from 0.`
      ])
    }
  )

  it('accepts pairs of several digits as well formed', () => {
    /** Scenario: 9-10 and 10-12 are canonical; they do not fuse, so they are stale and not malformed. */
    const listed = { a: { pairs: ['0-1', '0-2', '9-10', '10-12'], why: 'it reads' } }
    expect(sixteenIssues(drawings, fusing, listed)).toEqual([
      'a: pair 9-10 is on the allowlist but no longer fuses at 16 px. Remove it.',
      'a: pair 10-12 is on the allowlist but no longer fuses at 16 px. Remove it.'
    ])
  })

  it('does not take an inherited property for an entry', () => {
    /** Scenario: an icon named like an object method is not on an empty allowlist. */
    const odd = new Map<string, [number, number][]>([['constructor', [[0, 1]]]])
    const named = [{ ...lineDrawing(), name: 'constructor' }]
    expect(sixteenIssues(named, odd, {})).toHaveLength(1)
  })
})
