/**
 * @fileoverview The command behind `pnpm check:sixteen`: it renders every drawing's parts at
 * 16 px and fails on a fusion that `scripts/sixteen-allowlist.json` does not justify.
 * Returns an exit code and prints through the output it is given.
 * @layer Pipeline
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { lintAndReport, parseOptions } from './cli.ts'
import type { Output } from './cli.ts'
import type { AllowedFusion } from './sixteen.ts'
import { fusingIcons, sixteenDrawings, sixteenIssues } from './sixteen.ts'

/** Where the allowlist is committed, from the repository root. */
export const ALLOWLIST_PATH = 'scripts/sixteen-allowlist.json'

const SHAPE = `${ALLOWLIST_PATH}: expected { "icons": { "<name>": { "pairs": ["<i-j>"], "why": "<justification>" } } }`

/** Whether a value is an entry `{ pairs: string[], why: string }`. */
function isEntry(value: unknown): value is AllowedFusion {
  const { pairs, why } = (value ?? {}) as { pairs?: unknown; why?: unknown }
  return (
    typeof why === 'string' &&
    Array.isArray(pairs) &&
    pairs.every((pair) => typeof pair === 'string')
  )
}

/** Reads the allowlist's `icons` table; throws when the file does not have the documented shape. */
function readAllowlist(root: string): Record<string, AllowedFusion> {
  const parsed = JSON.parse(readFileSync(join(root, ALLOWLIST_PATH), 'utf8')) as {
    icons?: unknown
  } | null
  const icons = parsed?.icons
  const entries = typeof icons === 'object' && icons !== null ? Object.entries(icons) : undefined
  if (
    Array.isArray(icons) ||
    entries === undefined ||
    !entries.every(([, entry]) => isEntry(entry))
  ) {
    throw new Error(SHAPE)
  }
  return Object.fromEntries(entries) as Record<string, AllowedFusion>
}

/**
 * `pnpm check:sixteen`: measures every non-brand icon at 16 px, on its 16 px master or else
 * its line drawing, and fails on a fusion the allowlist does not justify, on an entry that
 * no longer fuses or names no icon, and on a fused pair the entry does not list.
 *
 * @param args - The command-line arguments.
 * @param root - The repository root.
 * @param output - Where to print.
 * @returns The exit code.
 */
export function runSixteen(args: readonly string[], root: string, output: Output): number {
  const { layout } = parseOptions(args, root)
  const { issues, set } = lintAndReport(layout, output)
  if (issues.length > 0) return 1
  const allowlist = readAllowlist(root)
  const drawings = sixteenDrawings(set)
  const fusing = fusingIcons(drawings)
  const problems = sixteenIssues(drawings, fusing, allowlist)
  for (const problem of problems) output.error(problem)
  if (problems.length > 0) {
    output.error(`${problems.length} 16 px problem(s).`)
    return 1
  }
  output.log(
    `${drawings.length} drawing(s) measured at 16 px; ${fusing.size} fuse, all on the allowlist`
  )
  return 0
}
