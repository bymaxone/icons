#!/usr/bin/env node
/**
 * @fileoverview Fixture package gate: proves the pipeline and every package gate on a set
 * that has icons, while the repository itself may hold none.
 * @layer scripts
 *
 * The repository's own gates run on the committed `icons/`, which is empty until the first
 * drawings land, so on their own they prove only the empty case. This script copies the
 * repository (its tracked and unignored files, with `node_modules` linked rather than
 * copied) into a scratch directory, puts the placeholder drawings of `fixtures/icons` in
 * place of `icons/`, and runs there, in order:
 *
 *   the icon lint, `pnpm generate` and its stale-copy check, the type checks over the
 *   generated modules, ESLint and Prettier on them (the `src/meta` rules included), the
 *   render smoke test and the entry-point specs, the build, the size budgets with their
 *   per-icon rows, attw on every `./icons/<name>`, the consumer runtime gate, the dogfood
 *   install and the contact sheet.
 *
 * The first failing step stops the run and is named. The rendered contact sheet of the
 * fixtures is kept at `reports/fixture-contact-sheet.png`, and `--keep` keeps the scratch
 * directory for inspection; `--verbose` prints every step's output, not only a failing one.
 *
 * Usage: node scripts/check-fixture-package.mjs [--keep] [--verbose]
 */

import { execFileSync, spawnSync } from 'node:child_process'
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const keep = process.argv.includes('--keep')
const verbose = process.argv.includes('--verbose')

/** Generated directories, written fresh in the copy from the fixtures. */
const GENERATED = ['src/icons/generated/', 'src/brands/generated/', 'src/meta/generated/']

/**
 * Every step, as the commands its package script runs, called directly. pnpm is never run
 * in the copy: its `node_modules` is a link to this repository's, and pnpm, finding a
 * modules directory installed for another project, reinstalls it in place, through the
 * link, which prunes this repository's own tree.
 */
const STEPS = [
  ['icon lint', [['node', 'scripts/lint-icons.mjs']]],
  ['generate', [['node', 'scripts/generate.mjs']]],
  ['stale-copy check', [['node', 'scripts/generate.mjs', '--check']]],
  [
    'type checks',
    [
      ['tsc', '--noEmit'],
      ['tsc', '--noEmit', '-p', 'tsconfig.build.json'],
      ['tsc', '--noEmit', '-p', 'tsconfig.meta.json']
    ]
  ],
  ['ESLint on the generated modules', [['eslint', '--max-warnings', '0', ...GENERATED]]],
  ['Prettier on the generated modules', [['prettier', '--check', ...GENERATED]]],
  ['render smoke test and entry specs', [['jest', 'src/icons', 'src/index.spec.ts', 'src/meta']]],
  [
    'build',
    [
      ['node', '-e', "require('node:fs').rmSync('dist', { recursive: true, force: true })"],
      ['tsup'],
      ['node', 'scripts/strip-bundle-comments.mjs'],
      ['node', 'scripts/generate.mjs', '--static']
    ]
  ],
  ['size budgets', [['node', 'scripts/check-size.mjs']]],
  ['published types (attw)', [['node', 'scripts/check-exports.mjs']]],
  ['consumer runtime', [['node', 'scripts/check-consumer-runtime.mjs']]],
  ['dogfood install', [['node', 'scripts/dogfood-smoke-test.mjs']]],
  ['contact sheet', [['node', 'scripts/contact-sheet.mjs']]]
]

/** The environment of every step: this repository's binaries first on the PATH. */
const env = {
  ...process.env,
  CI: 'true',
  PATH: `${join(root, 'node_modules', '.bin')}${delimiter}${process.env['PATH'] ?? ''}`
}

/** Runs one step's commands in the copy, returning the output of the first that fails. */
function runStep(scratch, commands) {
  for (const [command, ...args] of commands) {
    // stdin is closed: tsup does not exit while its standard input stays open.
    const result = spawnSync(command, args, {
      cwd: scratch,
      encoding: 'utf8',
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}${result.error ?? ''}`
    if (result.status !== 0) return output
    if (verbose) process.stdout.write(output)
  }
  return undefined
}

/** Copies the repository's tracked and unignored files, without the drawings and generated modules. */
function copyRepository(target) {
  const listing = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    {
      cwd: root,
      encoding: 'utf8'
    }
  )
  const skipped = (path) =>
    (path.startsWith('icons/') && path !== 'icons/README.md') ||
    GENERATED.some((directory) => path.startsWith(directory))
  for (const path of listing.split('\0')) {
    if (path === '' || skipped(path) || !existsSync(join(root, path))) continue
    mkdirSync(dirname(join(target, path)), { recursive: true })
    copyFileSync(join(root, path), join(target, path))
  }
  cpSync(join(root, 'fixtures', 'icons'), join(target, 'icons'), { recursive: true })
  symlinkSync(join(root, 'node_modules'), join(target, 'node_modules'), 'dir')
  // `npm pack` runs the `prepare` script (husky), which prints to stdout outside a git
  // repository and breaks the JSON the dogfood test reads from that stream.
  execFileSync('git', ['init', '--quiet'], { cwd: target })
}

const scratch = mkdtempSync(join(tmpdir(), 'icons-fixture-package-'))
let failed

try {
  copyRepository(scratch)
  console.log(`Fixture package gate (in ${scratch})`)
  for (const [name, commands] of STEPS) {
    const failure = runStep(scratch, commands)
    if (failure === undefined) {
      console.log(`  ✓ ${name}`)
      continue
    }
    process.stderr.write(failure)
    failed = name
    break
  }
  const sheet = join(scratch, 'reports', 'contact-sheet.png')
  if (existsSync(sheet)) {
    mkdirSync(join(root, 'reports'), { recursive: true })
    copyFileSync(sheet, join(root, 'reports', 'fixture-contact-sheet.png'))
  }
} finally {
  if (!keep) rmSync(scratch, { recursive: true, force: true })
}

if (failed !== undefined) {
  console.error(`✗ The fixture package failed at: ${failed}.`)
  process.exit(1)
}
console.log(
  '✓ The fixture icons go through every gate: generated, built, packed, loaded and rendered.'
)
