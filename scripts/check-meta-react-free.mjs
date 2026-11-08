/**
 * @fileoverview React-free gate for the `./meta` subpath — proves the lint rule
 * that keeps React out of `src/meta/` rejects every way React can enter, by
 * linting real probes and requiring each one to be refused.
 * @layer scripts
 *
 * `./meta` is the entry a consumer loads without a renderer. The rule that
 * guards it is `no-restricted-imports`, and a rule that is enabled is not
 * evidence that it matches: a `paths` entry matches one exact specifier, and a
 * `files` glob can leave an extension out. This gate therefore lints probes
 * through the real configuration (stdin, so nothing is written to `src/`) and
 * fails when any React specifier passes or when a clean probe is refused. The
 * probes are not part of a TypeScript project, so type-aware parsing is off;
 * `no-restricted-imports` reads the import statement and needs no types.
 *
 * A `.tsx` file is refused outright: with `jsx: "react-jsx"` the compiler adds
 * the `react/jsx-runtime` import itself, so no import statement exists for the
 * lint rule to see.
 */

import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const META_DIR = join(ROOT, 'src', 'meta')
const MESSAGE = 'The ./meta subpath must not import React'

const REACT_SPECIFIERS = [
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-dom',
  'react-dom/server',
  'react-dom/client'
]

/**
 * Lints one source text as if it lived at `filename`.
 * @param {string} source - The probe source.
 * @param {string} filename - Path relative to the repository root.
 * @returns {{ status: number | null, output: string }} Exit status and combined output.
 */
function lintProbe(source, filename) {
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'eslint',
      '--no-warn-ignored',
      '--parser-options',
      'project:false',
      '--stdin',
      '--stdin-filename',
      filename
    ],
    { cwd: ROOT, input: source, encoding: 'utf8' }
  )
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

/**
 * Lists `.tsx` files anywhere under `src/meta/`.
 * @param {string} dir - Directory to scan.
 * @returns {string[]} Absolute paths of `.tsx` files.
 */
function findTsx(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return findTsx(path)
    return entry.name.endsWith('.tsx') ? [path] : []
  })
}

/**
 * Runs every probe and returns the failures.
 * @returns {string[]} Human-readable failures; empty when the gate passes.
 */
function runProbes() {
  const failures = []
  for (const ext of ['ts', 'tsx']) {
    const filename = `src/meta/__probe__.${ext}`
    for (const specifier of REACT_SPECIFIERS) {
      const probes = [
        `import * as probe from '${specifier}'\n\nexport const used: unknown = probe\n`,
        `export const used: unknown = await import('${specifier}')\n`,
        `export const used: unknown = require('${specifier}')\n`
      ]
      for (const probe of probes) {
        const { status, output } = lintProbe(probe, filename)
        if (status === 0 || !output.includes(MESSAGE)) {
          failures.push(`${filename}: ${probe.trim().split('\n')[0]} was not refused`)
        }
      }
    }
    const clean = lintProbe('export const clean = 1\n', filename)
    if (clean.status !== 0) failures.push(`${filename}: a React-free probe was refused`)
  }
  for (const file of findTsx(META_DIR)) failures.push(`${file}: .tsx is not allowed in src/meta`)
  return failures
}

const failures = runProbes()
if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`)
  process.exit(1)
}
console.log('✓ ./meta refuses every React import.')
