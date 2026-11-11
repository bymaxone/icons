/**
 * @fileoverview The ink rule of the icon lint (spec section 2.5): a line drawing covers at most
 * 21.5% of its 24 px canvas, measured with its stroke; a 16 px master covers at most 32.25% of
 * its 16 px canvas, the same weight at its size, and at most 1.5 times the ink of its line
 * drawing, because a master simplifies and never adds geometry. Filled drawings are solid by
 * design and are not held to a ceiling. Ink is the mean coverage of the drawing rendered by
 * resvg at its own size, the size its root declares.
 * @layer Pipeline
 */

import type { Drawing } from './icon-set.ts'
import type { LintIssue } from './lint-issue.ts'
import { coverage, renderRgba } from './raster.ts'

/** The most a line drawing may cover of its 24 px canvas. */
export const LINE_INK_CEILING = 0.215

/** The most a 16 px master may cover of its 16 px canvas: 21.5% x 24 / 16. */
export const SM_INK_CEILING = 0.3225

/** The most a 16 px master may weigh against its line drawing at 24 px. */
export const SM_INK_RATIO = 1.5

/**
 * The share of the canvas a drawing covers, rendered at the size its root declares.
 *
 * @param svg - The drawing's source.
 * @returns The mean coverage, from 0 to 1.
 */
export function inkOf(svg: string): number {
  const pixels = coverage(renderRgba(svg))
  return pixels.reduce((sum, value) => sum + value, 0) / pixels.length
}

/** A measured share as a percentage with one decimal. */
const percent = (share: number): string => `${(share * 100).toFixed(1)}%`

/** A ceiling as the percentage the specification writes. */
const ceiling = (share: number): string => `${+(share * 100).toFixed(2)}%`

/**
 * The drawings that weigh more than spec section 2.5 allows.
 *
 * @param line - The line drawings, by icon name.
 * @param sm - The 16 px masters, by icon name.
 * @param measure - How a drawing's ink is measured; `inkOf` unless a test pins the values.
 * @returns One issue per ceiling a drawing goes over.
 */
export function inkIssues(
  line: ReadonlyMap<string, Drawing>,
  sm: ReadonlyMap<string, Drawing>,
  measure: (svg: string) => number = inkOf
): LintIssue[] {
  const issues: LintIssue[] = []
  const lineInk = new Map<string, number>()
  for (const [name, drawing] of line) {
    const ink = measure(drawing.text)
    lineInk.set(name, ink)
    if (ink > LINE_INK_CEILING) {
      issues.push({
        file: drawing.path,
        rule: 'svg-ink',
        message: `covers ${percent(ink)} of the canvas at 24 px, over the ${ceiling(LINE_INK_CEILING)} ceiling`
      })
    }
  }
  for (const [name, drawing] of sm) {
    const ink = measure(drawing.text)
    if (ink > SM_INK_CEILING) {
      issues.push({
        file: drawing.path,
        rule: 'svg-ink',
        message: `covers ${percent(ink)} of the canvas at 16 px, over the ${ceiling(SM_INK_CEILING)} ceiling`
      })
    }
    const base = lineInk.get(name)
    if (base !== undefined && ink > base * SM_INK_RATIO) {
      issues.push({
        file: drawing.path,
        rule: 'svg-ink',
        message: `weighs ${(ink / base).toFixed(2)} times its line drawing, over ${SM_INK_RATIO}`
      })
    }
  }
  return issues
}
