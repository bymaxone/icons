/**
 * @fileoverview `scripts/icons-preview-build.mjs`, the command the unprivileged preview job
 * runs. Every value from the command line is validated before it reaches git or a path, and
 * git runs with its arguments as a list, never through a shell.
 * @layer Pipeline
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

import type { Output } from './cli.ts'
import { buildPreview } from './preview-build.ts'
import type { PreviewGit } from './preview-build.ts'
import { loadReferences } from './similarity.ts'
import type { Reference } from './similarity.ts'

/** The largest output read from git, in bytes. */
const MAX_GIT_OUTPUT = 64 * 1024 * 1024
/** A git object name. */
const COMMIT = /^[0-9a-f]{40}$/

/**
 * The parents named in the header of a raw commit object (`git cat-file -p`), in order.
 * The header ends at the first blank line; the message after it is author text and is not
 * read.
 *
 * @param object - The raw commit object.
 * @returns The parent commits.
 */
export function commitParents(object: string): string[] {
  const parents: string[] = []
  for (const line of object.split('\n')) {
    if (line === '') break
    const parent = /^parent ([0-9a-f]{40})$/.exec(line)?.[1]
    if (parent !== undefined) parents.push(parent)
  }
  return parents
}

/** Git through `execFileSync`, run in the repository root. */
export function repositoryGit(root: string): PreviewGit {
  const run = (args: string[]): string =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: MAX_GIT_OUTPUT })
  return {
    diff: (base, head) => run(['diff', '--name-status', '--no-renames', base, head, '--', 'icons']),
    show: (commit, path) => run(['show', `${commit}:${path}`]),
    parents: (commit) => commitParents(run(['cat-file', '-p', commit]))
  }
}

/** Reads the value after a flag. */
function flagValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

/** A required flag value that matches a pattern, or a failure naming it. */
function required(args: readonly string[], name: string, pattern: RegExp): string {
  const value = flagValue(args, name)
  if (value === undefined || !pattern.test(value)) throw new Error(`missing or invalid ${name}`)
  return value
}

/**
 * Builds the preview of a pull request's drawings: `--base <sha> --head <sha> --merge <sha> --pr <n>
 * --out <dir>`.
 *
 * @param args - The flags.
 * @param root - The repository root, checked out at the base commit.
 * @param output - Where to print.
 * @param git - The git reads.
 * @param references - The similarity references.
 * @returns The exit code.
 */
export function runPreviewBuild(
  args: readonly string[],
  root: string,
  output: Output,
  git: PreviewGit = repositoryGit(root),
  references: (root: string) => readonly Reference[] = loadReferences
): number {
  try {
    const manifest = buildPreview(
      {
        root,
        base: required(args, '--base', COMMIT),
        head: required(args, '--head', COMMIT),
        merge: required(args, '--merge', COMMIT),
        pr: Number(required(args, '--pr', /^[1-9][0-9]{0,9}$/)),
        out: resolve(root, required(args, '--out', /^[\w./-]+$/))
      },
      git,
      () => references(root),
      output
    )
    output.log(`lint ${manifest.lint}; ${manifest.images.length} image(s)`)
    return 0
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}
