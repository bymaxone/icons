/**
 * @fileoverview The command behind `pnpm check:meta`: it reads the metadata of every icon and
 * fails on a placeholder label, a label shared outside `scripts/meta-allowlist.json`, an
 * empty or repeated `useCases`, a tag that holds a type word, a renamed icon whose categories were
 * not reviewed and a British spelling. Returns an exit code and prints through the output it is given.
 * @layer Pipeline
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { lintAndReport, parseOptions } from './cli.ts'
import type { Output } from './cli.ts'
import type { AllowedLabel, ReviewedRenames } from './meta-check.ts'
import { META_ALLOWLIST, RENAMES_REVIEWED, metaIssues, metaRecords } from './meta-check.ts'

const SHAPE = `${META_ALLOWLIST}: expected { "labels": { "<label>": { "icons": ["<name>"], "why": "<justification>" } } }`

/** Whether a value is an entry `{ icons: string[], why: string }`. */
function isEntry(value: unknown): value is AllowedLabel {
  const { icons, why } = (value ?? {}) as { icons?: unknown; why?: unknown }
  return (
    typeof why === 'string' &&
    Array.isArray(icons) &&
    icons.every((icon) => typeof icon === 'string')
  )
}

/** Reads the allowlist's `labels` table; throws when the file does not have the documented shape. */
function readAllowlist(root: string): Record<string, AllowedLabel> {
  const parsed = JSON.parse(readFileSync(join(root, META_ALLOWLIST), 'utf8')) as {
    labels?: unknown
  } | null
  const labels = parsed?.labels
  const entries = typeof labels === 'object' && labels !== null ? Object.entries(labels) : undefined
  if (
    Array.isArray(labels) ||
    entries === undefined ||
    !entries.every(([, entry]) => isEntry(entry))
  ) {
    throw new Error(SHAPE)
  }
  return Object.fromEntries(entries) as Record<string, AllowedLabel>
}

const REVIEWED_SHAPE = `${RENAMES_REVIEWED}: expected { "icons": { "<name>": "<verdict on its categories>" } }`

/** Reads the `icons` table of the rename review manifest; throws when it does not have the documented shape. */
function readReviewedRenames(root: string): ReviewedRenames {
  const parsed = JSON.parse(readFileSync(join(root, RENAMES_REVIEWED), 'utf8')) as {
    icons?: unknown
  } | null
  const icons = parsed?.icons
  const entries = typeof icons === 'object' && icons !== null ? Object.entries(icons) : undefined
  if (
    Array.isArray(icons) ||
    entries === undefined ||
    !entries.every(([, verdict]) => typeof verdict === 'string')
  ) {
    throw new Error(REVIEWED_SHAPE)
  }
  return Object.fromEntries(entries) as ReviewedRenames
}

/**
 * `pnpm check:meta`: fails on an icon whose label is a placeholder or is shared with an icon
 * outside a justified group of the allowlist, on an allowlist entry that is stale, and on
 * `useCases` that are empty or the same list as another icon's, on a renamed icon whose categories
 * are not in the review manifest and on a British spelling in a label, tag or use case. Brand marks are not read.
 *
 * @param args - The command-line arguments.
 * @param root - The repository root.
 * @param output - Where to print.
 * @returns The exit code.
 */
export function runMetaCheck(args: readonly string[], root: string, output: Output): number {
  const { layout } = parseOptions(args, root)
  const { issues, set } = lintAndReport(layout, output)
  if (issues.length > 0) return 1
  const records = metaRecords(set)
  const problems = metaIssues(records, readAllowlist(root), readReviewedRenames(root))
  for (const problem of problems) output.error(problem)
  if (problems.length > 0) {
    output.error(`${problems.length} metadata problem(s).`)
    return 1
  }
  output.log(`${records.length} icon record(s) checked; labels and use cases are their own`)
  return 0
}
