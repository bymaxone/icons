/**
 * @fileoverview `pnpm check:redraws`: fails when a pull request changes an existing drawing or
 * its baseline that no redraw manifest of that pull request names. Git and the file system are
 * given to it, so the rule is tested without a repository.
 * @layer Pipeline
 */

import { join } from 'node:path'

import type { Output } from './cli.ts'
import { manifestNames, manifestPaths, parseNameStatus, unlistedChanges } from './redraws.ts'

/** Runs git with the given arguments and returns its output. */
export type RunGit = (args: readonly string[]) => string

/** Reads a file as text. */
export type ReadText = (path: string) => string

/** The base a pull request is compared with when `--base` is not given. */
export const DEFAULT_BASE = 'origin/main'

/**
 * Checks the changes since the merge base with `--base` (`origin/main` by default).
 *
 * @param args - The command's arguments.
 * @param root - The repository root.
 * @param output - Where the command writes.
 * @param git - Runs git in the repository.
 * @param read - Reads a file.
 * @returns 0 when every changed existing drawing and baseline is listed, 1 otherwise.
 */
export function runRedraws(
  args: readonly string[],
  root: string,
  output: Output,
  git: RunGit,
  read: ReadText
): number {
  const at = args.indexOf('--base')
  const base = at === -1 ? DEFAULT_BASE : (args[at + 1] ?? DEFAULT_BASE)
  const changes = parseNameStatus(git(['diff', '--name-status', '-M', `${base}...HEAD`]))
  const allowed = new Set<string>()
  for (const path of manifestPaths(changes)) {
    for (const name of manifestNames(read(join(root, path)))) allowed.add(name)
  }
  const refused = unlistedChanges(changes, allowed)
  if (refused.length === 0) {
    output.log(
      `redraw gate: no existing drawing or baseline changed outside a manifest (${allowed.size} name(s) listed)`
    )
    return 0
  }
  output.error(
    `redraw gate: ${refused.length} existing drawing(s) or baseline(s) changed with no redraw manifest naming them:`
  )
  for (const path of refused) output.error(`  ${path}`)
  output.error(
    'List each redrawn icon in a manifest under docs/redraws/ (see its README), or restore the file from the base.'
  )
  return 1
}
