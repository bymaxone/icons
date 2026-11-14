/**
 * Unit tests for the similarity report.
 *
 * Layer: unit, with resvg for the rasters.
 * Goal: prove which drawings the report covers, how each is judged against its nearest
 * references, the exact Markdown for a small set, and the sheet's layout, text and tints.
 * Mocks: none; the icon set is built from inline drawings and the references from a few
 * inline SVGs.
 */

import { ONE_FLAG, ONE_ICON, sources } from './__tests__/support.ts'
import type { Drawing, IconEntry, IconSet } from './icon-set.ts'
import { lintSources } from './lint.ts'
import {
  MATCHES_PER_DRAWING,
  reportMarkdown,
  reportSheet,
  similarityEntries
} from './similarity-report.ts'
import type { SimilarityEntry } from './similarity-report.ts'
import { normalisedShape, readDrawing } from './similarity.ts'
import type { Paint, Reference } from './similarity.ts'

const RING = '<circle cx="12" cy="12" r="7"/>'
const PLUS = '<path d="M12 5v14M5 12h14"/>'
const BAR = '<line x1="3" y1="12" x2="21" y2="12"/>'
const WAVE = '<path d="M3 8c6-6 12 6 18 0M3 16c6-6 12 6 18 0"/>'
const DISC = '<circle cx="12" cy="12" r="7"/>'

const reference = (set: string, name: string, body: string, paint: Paint = 'stroke'): Reference => {
  const drawing = readDrawing(`<svg viewBox="0 0 24 24">${body}</svg>`, paint)
  const shape = normalisedShape(drawing)
  if (shape === undefined) throw new Error('expected visible ink')
  return { id: `${set}/${name}`, set, name, drawing, shape }
}

const REFERENCES = [
  reference('lucide', 'ring', RING),
  reference('lucide', 'plus', PLUS),
  reference('heroicons', 'bar', BAR),
  reference('phosphor', 'disc', DISC, 'fill')
]

/** The metadata of a real linted icon, which the report never reads. */
const { set: LINTED } = lintSources(sources(ONE_ICON))
const META = (LINTED.icons[0] as IconEntry).meta

const drawn = (body: string): Drawing => ({
  path: 'icons/x.svg',
  text: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${body}</svg>`,
  elements: []
})

const icon = (
  name: string,
  drawings: Partial<Record<'line' | 'filled' | 'sm', string>>
): IconEntry => ({
  name,
  metaPath: `icons/meta/${name}.json`,
  meta: META,
  drawings: {
    line: drawings.line === undefined ? undefined : drawn(drawings.line),
    filled: drawings.filled === undefined ? undefined : drawn(drawings.filled),
    sm: drawings.sm === undefined ? undefined : drawn(drawings.sm)
  }
})

const setOf = (...icons: IconEntry[]): IconSet => ({ icons, brands: [], flags: [], categories: [] })

describe('similarityEntries', () => {
  it('lists every drawn variant in icon and variant order, with its label', () => {
    /**
     * Scenario: one entry per variant that has a drawing, labelled `<name> (<variant>)`.
     */
    const entries = similarityEntries(
      setOf(icon('ring', { line: RING, sm: RING }), icon('disc', { filled: DISC })),
      REFERENCES
    )
    expect(entries.map((entry) => [entry.label, entry.name, entry.variant])).toStrictEqual([
      ['ring (line)', 'ring', 'line'],
      ['ring (sm)', 'ring', 'sm'],
      ['disc (filled)', 'disc', 'filled']
    ])
  })

  it('does not compare a country flag', () => {
    /**
     * Scenario: a flag is official geometry kept as published, so a set with one lists the
     * entries of its icons alone.
     */
    const { set } = lintSources(
      sources({ ...ONE_ICON, ...ONE_FLAG, meta: { ...ONE_ICON.meta, ...ONE_FLAG.meta } })
    )
    expect(set.flags).toHaveLength(1)
    expect(similarityEntries(set, REFERENCES).map((entry) => entry.name)).toStrictEqual(['ring'])
  })

  it('reads a line or sm variant as stroked and a filled one as filled', () => {
    /**
     * Scenario: the paint follows the variant's kind.
     */
    const entries = similarityEntries(
      setOf(icon('ring', { line: RING, filled: DISC, sm: RING })),
      REFERENCES
    )
    expect(entries.map((entry) => entry.drawing.paint)).toStrictEqual(['stroke', 'fill', 'stroke'])
    expect(entries[0]?.drawing.body).toBe(RING)
  })

  it('keeps the nearest references, nearest first, up to the count', () => {
    /**
     * Scenario: three matches a drawing, the closest first.
     */
    expect(MATCHES_PER_DRAWING).toBe(3)
    const [entry] = similarityEntries(setOf(icon('ring', { line: RING })), REFERENCES)
    expect(entry?.matches).toHaveLength(3)
    expect(entry?.matches[0]?.reference.id).toBe('lucide/ring')
    expect(entry?.matches.map((match) => match.scores.distance)).toStrictEqual(
      [...(entry?.matches ?? [])].map((match) => match.scores.distance).sort((a, b) => a - b)
    )
    expect(entry?.matches[0]?.scores.distance).toBe(0)
  })

  it('flags a drawing with a reference within the distance, and clears a far one', () => {
    /**
     * Scenario: a copy of a reference is flagged; a drawing unlike all of them is not.
     */
    const entries = similarityEntries(
      setOf(
        icon('ring', { line: RING }),
        icon('wave', { line: '<path d="M3 8c6-6 12 6 18 0M3 16c6-6 12 6 18 0"/>' })
      ),
      [REFERENCES[0] as Reference, REFERENCES[2] as Reference]
    )
    expect(entries.map((entry) => entry.flagged)).toStrictEqual([true, false])
  })

  it('flags on any of the matches, not only the first', () => {
    /**
     * Scenario: the flag is true when some match is within the distance.
     */
    const [entry] = similarityEntries(setOf(icon('ring', { line: RING })), [
      REFERENCES[2] as Reference,
      REFERENCES[0] as Reference
    ])
    expect(entry?.matches[0]?.reference.id).toBe('lucide/ring')
    expect(entry?.flagged).toBe(true)
  })

  it('marks the primitive glyphs and only those', () => {
    /**
     * Scenario: plus and the chevron family are primitives; ring is not.
     */
    const entries = similarityEntries(
      setOf(
        icon('chevron-up', { line: PLUS }),
        icon('plus', { line: PLUS }),
        icon('ring', { line: RING })
      ),
      REFERENCES
    )
    expect(entries.map((entry) => entry.primitive)).toStrictEqual([true, true, false])
  })

  it('skips a drawing with no visible ink', () => {
    /**
     * Scenario: a blank drawing has nothing to compare and gets no entry.
     */
    const entries = similarityEntries(
      setOf(icon('empty', { line: '' }), icon('ring', { line: RING })),
      REFERENCES
    )
    expect(entries.map((entry) => entry.label)).toStrictEqual(['ring (line)'])
  })

  it('covers only the named icons when names are given', () => {
    /**
     * Scenario: a name list narrows the report; an empty list leaves it empty; no list
     * keeps every icon.
     */
    const set = setOf(icon('ring', { line: RING }), icon('bar', { line: BAR }))
    expect(similarityEntries(set, REFERENCES, new Set(['bar'])).map((e) => e.name)).toStrictEqual([
      'bar'
    ])
    expect(similarityEntries(set, REFERENCES, new Set())).toStrictEqual([])
    expect(similarityEntries(set, REFERENCES).map((e) => e.name)).toStrictEqual(['ring', 'bar'])
  })

  it('gives no entries for an empty set or no references to flag', () => {
    /**
     * Scenario: an empty set yields nothing; with no references a drawing has no matches
     * and is clear.
     */
    expect(similarityEntries(setOf(), REFERENCES)).toStrictEqual([])
    const [entry] = similarityEntries(setOf(icon('ring', { line: RING })), [])
    expect(entry?.matches).toStrictEqual([])
    expect(entry?.flagged).toBe(false)
  })
})

describe('reportMarkdown', () => {
  it('writes the exact document for a small report', () => {
    /**
     * Scenario: one row each for a clear, a flagged and a flagged primitive drawing, with
     * the scores of the matches joined by line breaks.
     */
    const entries = similarityEntries(
      setOf(
        icon('bar', { line: BAR }),
        icon('plus', { line: PLUS }),
        icon('ring', { line: RING }),
        icon('wave', { line: WAVE })
      ),
      [REFERENCES[0] as Reference, REFERENCES[1] as Reference]
    )
    expect(reportMarkdown(entries)).toBe(
      [
        '# Similarity report',
        '',
        'A drawing is flagged when a third-party icon lies within a chamfer distance of 0.25 px of it on the normalised canvas (d). The overlap of the dilated ink masks (iou) and the cosine of the blurred coverage (cos) are reported beside it. A flag asks for a human review; it is not a verdict of copying.',
        '',
        '| Drawing | Verdict | Nearest |',
        '| --- | --- | --- |',
        '| bar (line) | clear | lucide/plus d=4.63 iou=0.53 cos=0.74<br>lucide/ring d=11.07 iou=0.07 cos=0.11 |',
        '| plus (line) | flagged, primitive (expected) | lucide/plus d=0.00 iou=1.00 cos=1.00<br>lucide/ring d=7.69 iou=0.10 cos=0.15 |',
        '| ring (line) | **flagged, review** | lucide/ring d=0.00 iou=1.00 cos=1.00<br>lucide/plus d=7.69 iou=0.10 cos=0.15 |',
        '| wave (line) | clear | lucide/ring d=4.78 iou=0.15 cos=0.25<br>lucide/plus d=5.42 iou=0.08 cos=0.12 |',
        ''
      ].join('\n')
    )
  })

  it('ends with a newline and has only the header for no entries', () => {
    /**
     * Scenario: an empty report is still a well-formed table.
     */
    expect(reportMarkdown([]).split('\n').slice(-3)).toStrictEqual([
      '| Drawing | Verdict | Nearest |',
      '| --- | --- | --- |',
      ''
    ])
  })
})

describe('reportSheet', () => {
  const entries = similarityEntries(
    setOf(icon('ring', { line: RING }), icon('plus', { line: PLUS }), icon('wave', { line: BAR })),
    [REFERENCES[0] as Reference, REFERENCES[1] as Reference]
  )

  it('is a sheet four columns wide and one row tall for each entry', () => {
    /**
     * Scenario: the drawing and its three matches make four 170 px columns; each entry is
     * 96 px high.
     */
    const sheet = reportSheet(entries)
    expect(
      sheet.startsWith(
        '<svg xmlns="http://www.w3.org/2000/svg" width="680" height="288" viewBox="0 0 680 288">\n'
      )
    ).toBe(true)
    expect(sheet.endsWith('</svg>\n')).toBe(true)
    expect(sheet).toContain('<rect width="680" height="288" fill="#ffffff"/>')
  })

  it('is one row tall for no entries', () => {
    /**
     * Scenario: an empty sheet keeps a height of one row, so it is a valid image.
     */
    expect(reportSheet([])).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="680" height="96" viewBox="0 0 680 96">',
        '<rect width="680" height="96" fill="#ffffff"/>',
        '</svg>',
        ''
      ].join('\n')
    )
  })

  it('tints a flagged row pink, a flagged primitive grey and a clear row white', () => {
    /**
     * Scenario: the row's background says whether it asks for review.
     */
    const sheet = reportSheet(entries)
    expect(sheet).toContain('<rect x="0" y="0" width="680" height="96" fill="#fbe3e6"/>')
    expect(sheet).toContain('<rect x="0" y="96" width="680" height="96" fill="#eef1f4"/>')
    expect(sheet).toContain('<rect x="0" y="192" width="680" height="96" fill="#ffffff"/>')
  })

  it('writes the drawing, its label and verdict, then each match with its scores', () => {
    /**
     * Scenario: the first column holds the drawing and its label and verdict, the others
     * the matches' ids and scores.
     */
    const sheet = reportSheet(entries)
    expect(sheet).toContain('>ring (line)</text>')
    expect(sheet).toContain('>flagged, review</text>')
    expect(sheet).toContain('>flagged, primitive (expected)</text>')
    expect(sheet).toContain('>clear</text>')
    expect(sheet).toContain('>lucide/ring</text>')
    expect(sheet).toContain('>d 0.00  iou 1.00  cos 1.00</text>')
  })

  it('places each cell by its column and row', () => {
    /**
     * Scenario: a thumbnail sits 12 px in from its column and 8 px down from its row, with
     * the caption lines 62 and 75 px below the row's top.
     */
    const sheet = reportSheet(entries.slice(1, 2))
    expect(sheet).toContain('<g transform="translate(12 8) scale(2) translate(0 0)"')
    expect(sheet).toContain('<g transform="translate(182 8) scale(2) translate(0 0)"')
    expect(sheet).toContain('<text x="12" y="70" fill="#0d1b24" font-weight="normal"')
    expect(sheet).toContain('<text x="12" y="83" fill="#0d1b24" font-weight="normal"')
  })

  it('places the second row 96 px down and joins the pieces without separators', () => {
    /**
     * Scenario: a cell's thumbnail and captions, a row's cells and its background follow
     * each other directly, and the second row's thumbnail sits at y 104, its captions at
     * 166 and 179, in the sheet's font.
     */
    const sheet = reportSheet(entries.slice(0, 2))
    expect(sheet).toContain('fill="#eef1f4"/><g transform="translate(12 104) scale(2)')
    expect(sheet).toContain(
      '</g><text x="12" y="166" fill="#0d1b24" font-weight="normal" font-family="Helvetica, Arial, sans-serif" font-size="11">plus (line)</text><text x="12" y="179"'
    )
    expect(sheet).toContain('</text><g transform="translate(182 104) scale(2)')
    expect(sheet).toContain('</text>\n<rect x="0" y="96"')
  })

  it('draws a stroked thumbnail at the 1.5 px stroke and a filled one solid', () => {
    /**
     * Scenario: the thumbnails are painted as their sets paint them, in the ink colour.
     */
    const sheet = reportSheet(
      similarityEntries(setOf(icon('disc', { filled: DISC })), [
        REFERENCES[3] as Reference,
        REFERENCES[0] as Reference
      ])
    )
    expect(sheet).toContain(
      'color="#0d1b24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
    )
    expect(sheet).toContain(`color="#0d1b24" fill="currentColor">${DISC}</g>`)
  })

  it('scales a thumbnail and its stroke from the viewBox of a larger drawing', () => {
    /**
     * Scenario: a 48-unit drawing at an offset is scaled to 48 px by one, with a 3 unit
     * stroke and the origin moved back.
     */
    const big = readDrawing('<svg viewBox="4 6 48 48"><path d="M0 0"/></svg>', 'stroke')
    const shape = normalisedShape(readDrawing(`<svg>${RING}</svg>`, 'stroke'))
    if (shape === undefined) throw new Error('expected ink')
    const sheet = reportSheet([
      {
        label: 'big',
        name: 'big',
        variant: 'line',
        drawing: big,
        matches: [],
        flagged: false,
        primitive: false
      }
    ])
    expect(sheet).toContain('<g transform="translate(12 8) scale(1) translate(-4 -6)"')
    expect(sheet).toContain('stroke-width="3"')
  })

  it('escapes the text it writes', () => {
    /**
     * Scenario: ampersands and angle brackets in a label do not become markup.
     */
    const entry: SimilarityEntry = {
      ...(entries[0] as SimilarityEntry),
      label: 'a & <b>'
    }
    const sheet = reportSheet([entry])
    expect(sheet).toContain('>a &amp; &lt;b></text>')
    expect(sheet).not.toContain('<b>')
  })
})
