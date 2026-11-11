/**
 * @fileoverview `pnpm size` (its per-component part): every component of every built icon
 * module, bundled as a consumer imports it, against the budgets of the specification, and
 * checked to leave its sibling drawings out of the bundle.
 * @layer Pipeline
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Output } from './cli.ts'
import { measureModule } from './component-size.ts'
import type { ComponentSize } from './component-size.ts'

/** A component alone, brotli: the target of spec §12 for one icon. */
export const COMPONENT_BUDGET = 0.6 * 1024

/** The runtime with one component, brotli. */
export const RUNTIME_WITH_COMPONENT_BUDGET = 1.5 * 1024

/** Kilobytes with two decimals, as the size table prints them. */
const kb = (bytes: number): string => `${(bytes / 1024).toFixed(2)} kB`

/**
 * The problems of one measured component: a budget it exceeds, a drawing the module text
 * does not show (so no leak can be looked for), or a sibling drawing its bundle holds.
 *
 * @param size - The measure.
 * @returns One message per problem; none when the component passes.
 */
export function componentProblems(size: ComponentSize): string[] {
  const problems: string[] = []
  // Stryker disable next-line EqualityOperator: sizes are whole bytes and the budget is 614.4, so `>` and `>=` agree on every size.
  if (size.alone > COMPONENT_BUDGET) {
    problems.push(`${size.component}: ${kb(size.alone)} alone, over ${kb(COMPONENT_BUDGET)}`)
  }
  if (size.withRuntime > RUNTIME_WITH_COMPONENT_BUDGET) {
    problems.push(
      `${size.component}: ${kb(size.withRuntime)} with the runtime, over ${kb(RUNTIME_WITH_COMPONENT_BUDGET)}`
    )
  }
  if (size.drawing === undefined) {
    problems.push(`${size.component}: its drawing cannot be read, so its bundle cannot be checked`)
  }
  if (size.leaks.length > 0) {
    problems.push(
      `${size.component}: its bundle keeps ${size.leaks.join(', ')}, so the module does not tree-shake`
    )
  }
  return problems
}

/**
 * Measures every component of every built icon module and prints the result.
 *
 * @param root - The repository root, which holds `dist/`.
 * @param output - Where to print.
 * @param listDirectory - Lists a directory; the file system's by default, whose order is
 *   not fixed, so the names are sorted.
 * @returns The exit code: 0 when every component passes, 1 when one does not, 2 when the
 *   build is missing.
 */
export async function runComponentSize(
  root: string,
  output: Output,
  listDirectory: (path: string) => string[] = (path) => readdirSync(path)
): Promise<number> {
  const runtime = join(root, 'dist', 'runtime', 'index.mjs')
  const icons = join(root, 'dist', 'icons')
  if (!existsSync(runtime) || !existsSync(icons)) {
    output.error('Missing build artifacts in dist/. Run "pnpm build" first.')
    return 2
  }
  const problems: string[] = []
  let largest: ComponentSize | undefined
  let count = 0
  for (const name of listDirectory(icons).sort()) {
    const modulePath = join(icons, name, 'index.mjs')
    for (const size of await measureModule(readFileSync(modulePath, 'utf8'), modulePath, runtime)) {
      count += 1
      problems.push(...componentProblems(size))
      if (largest === undefined || size.alone > largest.alone) largest = size
    }
  }
  for (const problem of problems) output.error(problem)
  if (largest !== undefined) {
    output.log(
      `${count} component(s) measured; the largest, ${largest.component}, is ${kb(largest.alone)} alone and ${kb(largest.withRuntime)} with the runtime`
    )
  }
  return problems.length === 0 ? 0 : 1
}
