/**
 * @fileoverview The commands behind the visual tools: `pnpm similarity`,
 * `pnpm check:visual` and `pnpm family-sheet`. Each returns an exit code and prints through the output it is given.
 * @layer Pipeline
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { lintAndReport, parseOptions } from './cli.ts'
import type { Output } from './cli.ts'
import { renderPng } from './contact-sheet.ts'
import { composeFamilySheet, familyGroups } from './family-sheet.ts'
import { calibrationMarkdown, calibrationPairs } from './similarity-calibration.ts'
import { reportMarkdown, reportSheet, similarityEntries } from './similarity-report.ts'
import { loadReferences } from './similarity.ts'
import type { Reference } from './similarity.ts'
import {
  BASELINE_DIRECTORY,
  changedPixels,
  decodePng,
  differenceImage,
  encodePng,
  renderStrip,
  visualTargets
} from './visual.ts'
import type { VisualTarget } from './visual.ts'

/** Where the calibration is committed, from the repository root. */
export const CALIBRATION_PATH = join('docs', 'similarity', 'calibration.md')

/** Reads the value after a flag, or `undefined` when the flag is absent. */
function flagValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

/**
 * `pnpm similarity`: compares every drawing (or `--names a,b`) with the reference sets and
 * writes `report.md` and `sheet.png` under `reports/similarity` (or `--out <dir>`). It
 * flags and never fails on a flag; it fails only when the sources do not lint. With
 * `--calibrate` it writes the calibration to `docs/similarity/calibration.md` instead.
 *
 * @param args - The command-line arguments.
 * @param root - The repository root.
 * @param output - Where to print.
 * @param references - The references, read from `node_modules` when not given.
 * @returns The exit code.
 */
export function runSimilarity(
  args: readonly string[],
  root: string,
  output: Output,
  references: () => readonly Reference[] = () => loadReferences(root)
): number {
  const { layout, flags, out } = parseOptions(args, root)
  if (flags.has('--calibrate')) {
    const file = resolve(root, CALIBRATION_PATH)
    mkdirSync(resolve(file, '..'), { recursive: true })
    writeFileSync(file, calibrationMarkdown(calibrationPairs(references())))
    output.log(`wrote ${file}`)
    return 0
  }
  const { issues, set } = lintAndReport(layout, output)
  if (issues.length > 0) return 1
  const names = flagValue(args, '--names')
  const only = names === undefined ? undefined : new Set(names.split(','))
  const entries = similarityEntries(set, references(), only)
  const directory = resolve(root, out ?? join('reports', 'similarity'))
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, 'report.md'), reportMarkdown(entries))
  writeFileSync(join(directory, 'sheet.png'), renderPng(reportSheet(entries)))
  const flagged = entries.filter((entry) => entry.flagged)
  for (const entry of flagged) {
    output.log(`flagged: ${entry.label}${entry.primitive ? ' (primitive)' : ''}`)
  }
  output.log(`compared ${entries.length} drawing(s); ${flagged.length} flagged; wrote ${directory}`)
  return 0
}

/** The baseline files under a directory, as `<kind>/<name>.png`, in name order. */
function baselineFiles(directory: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(join(directory, entry.name))
        .filter((file) => file.endsWith('.png'))
        .map((file) => `${entry.name}/${file}`)
    )
    .sort()
}

/**
 * `pnpm check:visual`: renders every drawing's strip and compares it with its baseline
 * under `visual/`. A changed drawing writes its difference to `reports/visual/` and fails,
 * as does a drawing without a baseline or a baseline without a drawing. With `--update`
 * it rewrites the baselines instead and removes the ones no drawing needs.
 *
 * @param args - The command-line arguments.
 * @param root - The repository root.
 * @param output - Where to print.
 * @returns The exit code.
 */
export function runVisual(args: readonly string[], root: string, output: Output): number {
  const { layout, flags } = parseOptions(args, root)
  const { issues, set } = lintAndReport(layout, output)
  if (issues.length > 0) return 1
  const directory = resolve(root, BASELINE_DIRECTORY)
  const targets = visualTargets(set)
  const wanted = new Set(targets.map((target) => target.file))
  const stale = baselineFiles(directory).filter((file) => !wanted.has(file))
  if (flags.has('--update')) {
    for (const target of targets) {
      mkdirSync(join(directory, target.kind), { recursive: true })
      writeFileSync(join(directory, target.file), encodePng(renderStrip(target)))
    }
    for (const file of stale) rmSync(join(directory, file))
    output.log(`wrote ${targets.length} baseline(s); removed ${stale.length}`)
    return 0
  }
  const problems = [
    ...targets.flatMap((target) => compareTarget(root, directory, target)),
    ...stale.map((file) => `${BASELINE_DIRECTORY}/${file}: a baseline with no drawing`)
  ]
  for (const problem of problems) output.error(problem)
  if (problems.length > 0) {
    output.error('Review the differences, then run pnpm check:visual --update and commit them.')
    return 1
  }
  output.log(`the ${targets.length} drawing(s) match their baselines`)
  return 0
}

/** Compares one drawing with its baseline; writes the difference when they differ. */
function compareTarget(root: string, directory: string, target: VisualTarget): string[] {
  const file = join(directory, target.file)
  if (!existsSync(file)) return [`${BASELINE_DIRECTORY}/${target.file}: no baseline`]
  const baseline = decodePng(readFileSync(file))
  const current = renderStrip(target)
  const changed = changedPixels(baseline, current)
  if (changed === 0) return []
  const report = resolve(root, 'reports', 'visual', target.file)
  mkdirSync(dirname(report), { recursive: true })
  writeFileSync(report, encodePng(differenceImage(baseline, current)))
  return [`${BASELINE_DIRECTORY}/${target.file}: ${changed} pixel(s) changed; see ${report}`]
}

/**
 * `pnpm family-sheet`: renders every drawing, grouped by category, to
 * `reports/family-sheet.png` (or `--out <file>`), outlining the icons named by
 * `--highlight a,b`, the batch under review.
 *
 * @param args - The command-line arguments.
 * @param root - The repository root.
 * @param output - Where to print.
 * @returns The exit code.
 */
export function runFamilySheet(args: readonly string[], root: string, output: Output): number {
  const { layout, out } = parseOptions(args, root)
  const { issues, set } = lintAndReport(layout, output)
  if (issues.length > 0) return 1
  const highlight = new Set(flagValue(args, '--highlight')?.split(',') ?? [])
  const groups = familyGroups(set, highlight)
  const file = resolve(root, out ?? join('reports', 'family-sheet.png'))
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, renderPng(composeFamilySheet(groups)))
  const count = groups.reduce((total, group) => total + group.members.length, 0)
  output.log(`wrote ${file} (${count} drawing(s))`)
  return 0
}
