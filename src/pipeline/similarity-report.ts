/**
 * @fileoverview The similarity report: for every drawing, its nearest third-party icons
 * with their scores, as a Markdown table and as a sheet that shows each drawing beside its
 * nearest matches, so a reviewer judges the resemblance by eye.
 * @layer Pipeline
 */

import { drawnVariants } from './icon-set.ts'
import type { IconSet } from './icon-set.ts'
import type { IconVariantName } from './metadata.ts'
import {
  FLAG_DISTANCE,
  isFlagged,
  isPrimitive,
  nearest,
  normalisedShape,
  readDrawing
} from './similarity.ts'
import type { Match, Reference, SvgDrawing } from './similarity.ts'
import { isStrokeKind } from './svg-kind.ts'

/** One drawing of the set and its nearest references. */
export interface SimilarityEntry {
  /** `<name> (<variant>)`. */
  readonly label: string
  readonly name: string
  readonly variant: IconVariantName
  readonly drawing: SvgDrawing
  readonly matches: readonly Match[]
  /** Whether the nearest match is at or below the flag distance. */
  readonly flagged: boolean
  /** Whether the icon is a primitive glyph, where a flag is expected (spec §3.5). */
  readonly primitive: boolean
}

/** How many references the report lists for each drawing. */
export const MATCHES_PER_DRAWING = 3

/**
 * Compares every icon variant of a set with every reference.
 *
 * @param set - The icon set.
 * @param references - Every reference, normalised.
 * @param names - When given, only these icons.
 * @returns One entry a drawing with visible ink, in icon and variant order.
 */
export function similarityEntries(
  set: IconSet,
  references: readonly Reference[],
  names?: ReadonlySet<string>
): SimilarityEntry[] {
  return set.icons
    .filter((icon) => names === undefined || names.has(icon.name))
    .flatMap((icon) =>
      drawnVariants(icon).flatMap(([variant, source]) => {
        const drawing = readDrawing(source.text, isStrokeKind(variant) ? 'stroke' : 'fill')
        const shape = normalisedShape(drawing)
        if (shape === undefined) return []
        const matches = nearest(shape, references, MATCHES_PER_DRAWING)
        return [
          {
            label: `${icon.name} (${variant})`,
            name: icon.name,
            variant,
            drawing,
            matches,
            flagged: matches.some((match) => isFlagged(match.scores)),
            primitive: isPrimitive(icon.name)
          }
        ]
      })
    )
}

/** The scores of a match, as `id d=0.12 iou=0.80 cos=0.95`. */
function matchText(match: Match): string {
  const { distance, overlap, cosine } = match.scores
  return `${match.reference.id} d=${distance.toFixed(2)} iou=${overlap.toFixed(2)} cos=${cosine.toFixed(2)}`
}

/** What a reviewer does with an entry. */
function verdict(entry: SimilarityEntry): string {
  if (!entry.flagged) return 'clear'
  return entry.primitive ? 'flagged, primitive (expected)' : '**flagged, review**'
}

/**
 * The report as Markdown: a table with each drawing's verdict and its nearest matches.
 *
 * @param entries - The entries.
 * @returns The document, ending with a newline.
 */
export function reportMarkdown(entries: readonly SimilarityEntry[]): string {
  const rows = entries.map(
    (entry) =>
      `| ${entry.label} | ${verdict(entry)} | ${entry.matches.map(matchText).join('<br>')} |`
  )
  return [
    '# Similarity report',
    '',
    `A drawing is flagged when a third-party icon lies within a chamfer distance of ${FLAG_DISTANCE} px of it on the normalised canvas (d). The overlap of the dilated ink masks (iou) and the cosine of the blurred coverage (cos) are reported beside it. A flag asks for a human review; it is not a verdict of copying.`,
    '',
    '| Drawing | Verdict | Nearest |',
    '| --- | --- | --- |',
    ...rows,
    ''
  ].join('\n')
}

/** The width of a sheet column, in px. */
const COLUMN = 170
/** The height of a sheet row, in px. */
const ROW = 96
/** The side of a thumbnail, in px. */
const THUMBNAIL = 48
const FONT = 'font-family="Helvetica, Arial, sans-serif" font-size="11"'

/** A text element, with its content escaped. */
function text(x: number, y: number, content: string, weight = 'normal'): string {
  const escaped = content.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  return `<text x="${x}" y="${y}" fill="#0d1b24" font-weight="${weight}" ${FONT}>${escaped}</text>`
}

/** A drawing scaled into a thumbnail at (x, y), stroked drawings at the set's 1.5 px. */
function thumbnail(drawing: SvgDrawing, x: number, y: number): string {
  const [boxX, boxY, width] = drawing.viewBox
  const scale = THUMBNAIL / width
  const paint =
    drawing.paint === 'stroke'
      ? `fill="none" stroke="currentColor" stroke-width="${1.5 * (width / 24)}" stroke-linecap="round" stroke-linejoin="round"`
      : 'fill="currentColor"'
  const transform = `translate(${x} ${y}) scale(${scale}) translate(${-boxX} ${-boxY})`
  return `<g transform="${transform}" color="#0d1b24" ${paint}>${drawing.body}</g>`
}

/** One cell: a thumbnail and up to two caption lines under it. */
function sheetCell(drawing: SvgDrawing, column: number, row: number, lines: string[]): string {
  const x = column * COLUMN + 12
  const y = row * ROW + 8
  return [
    thumbnail(drawing, x, y),
    ...lines.map((line, index) => text(x, y + THUMBNAIL + 14 + index * 13, line))
  ].join('')
}

/**
 * The report as a sheet: one row a drawing, the drawing first, then its nearest matches,
 * each with its scores; a flagged row is tinted.
 *
 * @param entries - The entries.
 * @returns The sheet's SVG text.
 */
export function reportSheet(entries: readonly SimilarityEntry[]): string {
  const width = COLUMN * (MATCHES_PER_DRAWING + 1)
  const height = Math.max(entries.length, 1) * ROW
  const rows = entries.map((entry, row) => {
    const tint = entry.flagged ? (entry.primitive ? '#eef1f4' : '#fbe3e6') : '#ffffff'
    return [
      `<rect x="0" y="${row * ROW}" width="${width}" height="${ROW}" fill="${tint}"/>`,
      sheetCell(entry.drawing, 0, row, [entry.label, verdict(entry).replaceAll('*', '')]),
      ...entry.matches.map((match, index) => {
        const { distance, overlap, cosine } = match.scores
        const scores = `d ${distance.toFixed(2)}  iou ${overlap.toFixed(2)}  cos ${cosine.toFixed(2)}`
        return sheetCell(match.reference.drawing, index + 1, row, [match.reference.id, scores])
      })
    ].join('')
  })
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    ...rows,
    '</svg>',
    ''
  ].join('\n')
}
