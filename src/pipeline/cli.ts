/**
 * @fileoverview The commands behind `pnpm generate`, `pnpm check:generated`,
 * `pnpm lint:icons` and `pnpm contact-sheet`, and the option parsing every command shares.
 * Each returns an exit code and prints through the output it is given, so the scripts in
 * `scripts/` are one call each.
 * @layer Pipeline
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { composeContactSheet, renderPng, sheetRows } from './contact-sheet.ts'
import {
  formatSources,
  generatedModules,
  replaceGenerated,
  staleFiles,
  writeStatic
} from './generate.ts'
import { formatIssue } from './lint-issue.ts'
import { lintSources } from './lint.ts'
import type { LintResult } from './lint.ts'
import { readSources } from './sources.ts'
import type { SourceLayout } from './sources.ts'

/** Where a command prints. */
export interface Output {
  readonly log: (line: string) => void
  readonly error: (line: string) => void
}

/** The options every command reads from its arguments. */
export interface Options {
  readonly layout: SourceLayout
  readonly flags: ReadonlySet<string>
  readonly out: string | undefined
}

/**
 * Reads `--icons <dir>` (the icons directory, `icons` by default), `--out <path>` and the
 * other flags.
 */
export function parseOptions(args: readonly string[], root: string): Options {
  const value = (name: string): string | undefined => {
    const index = args.indexOf(name)
    return index === -1 ? undefined : args[index + 1]
  }
  return {
    layout: { root, icons: value('--icons') ?? 'icons' },
    flags: new Set(args),
    out: value('--out')
  }
}

/** Lints the sources and prints every issue; the result is usable only when it is clean. */
export function lintAndReport(layout: SourceLayout, output: Output): LintResult {
  const result = lintSources(readSources(layout))
  for (const issue of result.issues) output.error(formatIssue(issue))
  if (result.issues.length > 0) output.error(`${result.issues.length} icon lint issue(s).`)
  return result
}

/**
 * `pnpm generate`: formats the source SVGs in place, lints them, and writes the generated
 * modules. With `--check` it writes nothing and fails when the committed modules differ
 * from a fresh generation; with `--static` it writes the raw SVGs, the sprite and
 * `metadata.json` into `dist/` (or `--out <dir>`).
 *
 * @param args - The command-line arguments.
 * @param root - The repository root.
 * @param output - Where to print.
 * @returns The exit code.
 */
export async function runGenerate(
  args: readonly string[],
  root: string,
  output: Output
): Promise<number> {
  const { layout, flags, out } = parseOptions(args, root)
  const check = flags.has('--check')
  if (!check && !flags.has('--static')) {
    for (const path of formatSources(root, readSources(layout))) output.log(`formatted ${path}`)
  }
  const { issues, set } = lintAndReport(layout, output)
  if (issues.length > 0) return 1
  if (flags.has('--static')) {
    const count = writeStatic(resolve(root, out ?? 'dist'), set)
    output.log(`wrote ${count} static file(s)`)
    return 0
  }
  const modules = await generatedModules(root, set)
  if (!check) {
    replaceGenerated(root, modules)
    output.log(
      `generated ${modules.size} module(s) from ${set.icons.length} icon(s) and ${set.brands.length} brand(s)`
    )
    return 0
  }
  const stale = staleFiles(root, modules)
  for (const line of stale) output.error(line)
  if (stale.length > 0) {
    output.error(
      'The generated modules are not what the sources produce: run pnpm generate and commit the result.'
    )
    return 1
  }
  output.log(`the ${modules.size} generated module(s) match the sources`)
  return 0
}

/**
 * `pnpm lint:icons`: every rule of the icon lint, writing nothing.
 *
 * @param args - The command-line arguments.
 * @param root - The repository root.
 * @param output - Where to print.
 * @returns The exit code.
 */
export function runLint(args: readonly string[], root: string, output: Output): number {
  const { layout } = parseOptions(args, root)
  const { issues, set } = lintAndReport(layout, output)
  if (issues.length > 0) return 1
  output.log(`icon lint: ${set.icons.length} icon(s) and ${set.brands.length} brand(s), no issue`)
  return 0
}

/**
 * `pnpm contact-sheet`: renders every drawing to `reports/contact-sheet.png` (or
 * `--out <file>`).
 *
 * @param args - The command-line arguments.
 * @param root - The repository root.
 * @param output - Where to print.
 * @returns The exit code.
 */
export function runContactSheet(args: readonly string[], root: string, output: Output): number {
  const { layout, out } = parseOptions(args, root)
  const { issues, set } = lintAndReport(layout, output)
  if (issues.length > 0) return 1
  const file = resolve(root, out ?? join('reports', 'contact-sheet.png'))
  mkdirSync(dirname(file), { recursive: true })
  const rows = sheetRows(set)
  writeFileSync(file, renderPng(composeContactSheet(rows)))
  output.log(`wrote ${file} (${rows.length} drawing(s))`)
  return 0
}
