/**
 * @fileoverview A throwaway git repository shaped like a pull request that is behind its
 * base branch, for the preview specs: a merge base, a base commit that moved on, a head
 * commit that changes drawings, and GitHub's merge commit of the two.
 * @layer Tests
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { CIRCLE, drawing, iconMeta, scratchRepository } from './support.ts'

/** The commits of the repository; the working tree is checked out at `base`. */
export interface PreviewRepository {
  readonly root: string
  readonly mergeBase: string
  readonly base: string
  readonly head: string
  readonly merge: string
}

/** Runs git in a repository and returns its trimmed output. */
export function git(root: string, ...args: string[]): string {
  return execFileSync(
    'git',
    [
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgsign=false',
      ...args
    ],
    { cwd: root, encoding: 'utf8' }
  ).trim()
}

/** The same circle drawn smaller, so it differs from `CIRCLE`. */
export const SMALL_CIRCLE = '<circle cx="12" cy="12" r="5"/>'

/**
 * Creates the repository. The merge base holds `ring`; the base branch then adds `star`;
 * the pull request changes `ring` (and adds what `headFiles` holds); the merge commit has
 * both. The working tree is left at the base commit, as the workflow checks it out.
 *
 * @param headFiles - Files the pull request's commit adds or overwrites, by path.
 * @returns The repository.
 */
export function previewRepository(headFiles: Record<string, string> = {}): PreviewRepository {
  const root = scratchRepository({
    'icons/line/ring.svg': drawing('line', CIRCLE),
    'icons/meta/ring.json': iconMeta()
  })
  const write = (path: string, text: string): void => {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  git(root, 'init', '-q', '-b', 'main')
  git(root, 'add', '-A')
  git(root, 'commit', '-q', '-m', 'merge base')
  const mergeBase = git(root, 'rev-parse', 'HEAD')

  git(root, 'checkout', '-q', '-b', 'pr')
  write('icons/line/ring.svg', drawing('line', SMALL_CIRCLE))
  for (const [path, text] of Object.entries(headFiles)) write(path, text)
  git(root, 'add', '-A')
  git(
    root,
    'commit',
    '-q',
    '-m',
    'the pull request\n\nparent 0000000000000000000000000000000000000000'
  )
  const head = git(root, 'rev-parse', 'HEAD')

  git(root, 'checkout', '-q', 'main')
  write('icons/line/star.svg', drawing('line', '<circle cx="12" cy="12" r="9"/>'))
  write('icons/meta/star.json', iconMeta({ tags: ['star'] }))
  git(root, 'add', '-A')
  git(root, 'commit', '-q', '-m', 'main moves on')
  const base = git(root, 'rev-parse', 'HEAD')

  git(root, 'checkout', '-q', '-b', 'merge')
  git(root, 'merge', '-q', '--no-ff', '-m', 'Merge the pull request', 'pr')
  const merge = git(root, 'rev-parse', 'HEAD')
  git(root, 'checkout', '-q', base)
  return { root, mergeBase, base, head, merge }
}
