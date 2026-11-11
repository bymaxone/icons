/**
 * @fileoverview How the similarity threshold is set, from pairs whose answer is known.
 * Negatives are the same concept drawn independently by two sets, matched by file name;
 * they should mostly stay above the threshold, and the ones that do not are the simple
 * glyphs every set draws alike. Positives are third-party icons against a careless copy
 * of themselves (scaled by 0.95 and moved by half a unit), which must all be flagged.
 * @layer Pipeline
 */

import {
  FLAG_DISTANCE,
  NORMAL_SIDE,
  compareShapes,
  isFlagged,
  normalisedShape
} from './similarity.ts'
import type { Reference, Scores, SvgDrawing } from './similarity.ts'

/** A pair whose answer is known, and its scores. */
export interface CalibrationPair {
  readonly label: string
  readonly scores: Scores
}

/** The negatives, split by lineage, and the positives. */
export interface Calibration {
  /** Pairs where one side is Heroicons, drawn independently of the other sets. */
  readonly independent: readonly CalibrationPair[]
  /** Lucide against Tabler, two sets with a shared ancestry and many identical glyphs. */
  readonly related: readonly CalibrationPair[]
  readonly copies: readonly CalibrationPair[]
}

/** Every how-many-th icon of the copied set is perturbed into a positive. */
const COPY_STRIDE = 7

/**
 * A careless copy of a drawing: scaled by 0.95 about its centre and moved by half a unit
 * right and down. Inside the transform the stroke shrinks with the drawing, as it does
 * when a copied path is rescaled.
 *
 * @param drawing - The original.
 * @returns The copy.
 */
export function perturbed(drawing: SvgDrawing): SvgDrawing {
  const [x, y, width, height] = drawing.viewBox
  const unit = width / 24
  const centreX = x + width / 2
  const centreY = y + height / 2
  const shift = unit / 2
  const transform = `translate(${centreX + shift} ${centreY + shift}) scale(0.95) translate(${-centreX} ${-centreY})`
  return { ...drawing, body: `<g transform="${transform}">${drawing.body}</g>` }
}

/** The same-name pairs between two sets. */
function sameName(
  references: readonly Reference[],
  first: string,
  second: string
): CalibrationPair[] {
  const others = new Map(
    references.filter((reference) => reference.set === second).map((r) => [r.name, r])
  )
  return references
    .filter((reference) => reference.set === first)
    .flatMap((reference) => {
      const other = others.get(reference.name)
      if (other === undefined) return []
      const label = `${reference.id} ~ ${other.id}`
      return [{ label, scores: compareShapes(reference.shape, other.shape) }]
    })
}

/**
 * Builds the known pairs from the loaded references.
 *
 * @param references - Every reference, normalised.
 * @param copiedSet - The set whose icons are perturbed into the positives.
 * @returns The negatives and the positives.
 */
export function calibrationPairs(
  references: readonly Reference[],
  copiedSet = 'lucide'
): Calibration {
  const copies = references
    .filter((reference) => reference.set === copiedSet)
    .filter((_, index) => index % COPY_STRIDE === 0)
    .flatMap((reference) => {
      const shape = normalisedShape(perturbed(reference.drawing))
      if (shape === undefined) return []
      return [{ label: reference.id, scores: compareShapes(shape, reference.shape) }]
    })
  return {
    independent: [
      ...sameName(references, 'lucide', 'heroicons'),
      ...sameName(references, 'tabler', 'heroicons')
    ],
    related: sameName(references, 'lucide', 'tabler'),
    copies
  }
}

/**
 * The value below which a share of the pairs fall, by nearest rank.
 *
 * @param values - The values.
 * @param share - From 0 (the smallest) to 1 (the largest).
 * @returns The value, or `NaN` with no value.
 */
export function quantile(values: readonly number[], share: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.floor(share * sorted.length))
  return sorted.at(index) ?? Number.NaN
}

/** One line of a quantile table. */
function quantileRow(
  label: string,
  pairs: readonly CalibrationPair[],
  metric: (scores: Scores) => number
): string {
  const values = pairs.map((pair) => metric(pair.scores))
  const cells = [0, 0.01, 0.05, 0.5, 0.95, 0.99, 1].map((share) =>
    quantile(values, share).toFixed(3)
  )
  return `| ${label} | ${pairs.length} | ${cells.join(' | ')} |`
}

/** The share of pairs flagged, as `n / total (p%)`. */
function flaggedShare(pairs: readonly CalibrationPair[]): string {
  const flagged = pairs.filter((pair) => isFlagged(pair.scores)).length
  const percent = pairs.length === 0 ? 0 : (100 * flagged) / pairs.length
  return `${flagged} / ${pairs.length} (${percent.toFixed(1)}%)`
}

/**
 * The calibration as a Markdown document, with the quantiles of each score for each group
 * and the share each group has flagged at `FLAG_DISTANCE`.
 *
 * @param calibration - The pairs.
 * @returns The document, ending with a newline.
 */
export function calibrationMarkdown(calibration: Calibration): string {
  const groups = [
    ['Copies (must flag)', calibration.copies],
    ['Independent redesigns', calibration.independent],
    ['Related sets (Lucide ~ Tabler)', calibration.related]
  ] as const
  const metrics = [
    ['distance', (scores: Scores): number => scores.distance],
    ['overlap', (scores: Scores): number => scores.overlap],
    ['cosine', (scores: Scores): number => scores.cosine]
  ] as const
  const tables = metrics.flatMap(([title, metric]) => [
    `### ${title}`,
    '',
    '| Group | Pairs | min | p1 | p5 | p50 | p95 | p99 | max |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...groups.map(([label, pairs]) => quantileRow(label, pairs, metric)),
    ''
  ])
  return [
    '# Similarity calibration',
    '',
    'Written by `pnpm similarity --calibrate`; do not edit by hand.',
    '',
    `A pair is flagged when its chamfer distance is at most ${FLAG_DISTANCE} px on the ${NORMAL_SIDE} px normalised canvas.`,
    '',
    '| Group | Flagged |',
    '| --- | --- |',
    ...groups.map(([label, pairs]) => `| ${label} | ${flaggedShare(pairs)} |`),
    '',
    ...tables
  ].join('\n')
}
