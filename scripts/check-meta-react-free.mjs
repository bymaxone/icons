/**
 * @fileoverview Self-contained gate for the `./meta` subpath — proves that
 * `src/meta/` can load nothing from outside itself, so the entry stays
 * React-free and dependency-free.
 * @layer scripts
 *
 * The lint rule set for `src/meta/` is an allowlist (specifiers that start with
 * `./` and contain no `..` segment and no backslash), not a list of forbidden
 * modules. A rule that is
 * enabled is not evidence that it matches, so this gate lints one probe per
 * way code can enter a module and requires each to be refused, plus clean
 * probes that must pass. Probes go through stdin, so nothing is written to
 * `src/`; they are not part of a TypeScript project, so type-aware parsing is
 * off (none of these rules needs types).
 *
 * Lint only sees the extensions its `files` glob names, so any file under
 * `src/meta/` that is not `.ts` fails the gate outright. That also covers JSX:
 * with `jsx: "react-jsx"` the compiler adds the React import itself.
 */

import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const META_DIR = join(ROOT, 'src', 'meta')
const PROBE_FILE = 'src/meta/__probe__.ts'
const MESSAGE = 'The ./meta subpath may import only from src/meta'

/** One probe per way code can enter a module; every one must be refused. */
const REFUSED = [
  ['static import of a package', "import * as r from 'react'\nexport const u: unknown = r"],
  [
    'static import of a package subpath',
    "import { renderToString } from 'react-dom/server'\nexport const u: unknown = renderToString"
  ],
  [
    'static import of a node builtin',
    "import { readFileSync } from 'node:fs'\nexport const u: unknown = readFileSync"
  ],
  [
    'self-import of this package',
    "import * as r from '@bymax-one/icons'\nexport const u: unknown = r"
  ],
  ['type-only import', "import type { FC } from 'react'\nexport type U = FC"],
  ['side-effect import', "import 'react'\nexport const u = 1"],
  ['re-export from a package', "export * from 'react'"],
  ['import-equals require', "import r = require('react')\nexport const u: unknown = r"],
  [
    'relative import leaving src/meta',
    "import * as r from '../index'\nexport const u: unknown = r"
  ],
  [
    'relative import leaving src/',
    "import * as r from '../../node_modules/react/index.js'\nexport const u: unknown = r"
  ],
  [
    'relative import climbing out and back in',
    "import { ICON_GRID } from '../meta/icon-grid'\nexport const u = ICON_GRID"
  ],
  [
    'relative import hiding a .. segment',
    "import * as r from './x/../../index'\nexport const u: unknown = r"
  ],
  ['backslash separator', "import * as r from './..\\\\index'\nexport const u: unknown = r"],
  ['bare relative parent', "import * as r from '..'\nexport const u: unknown = r"],
  ['absolute path', "import * as r from '/tmp/react.js'\nexport const u: unknown = r"],
  ['file URL', "import * as r from 'file:///tmp/react.js'\nexport const u: unknown = r"],
  ['dynamic import, literal', "export const u: unknown = await import('react')"],
  ['dynamic import, computed', "const n = 'react'\nexport const u: unknown = await import(n)"],
  ['dynamic import, template', 'export const u: unknown = await import(`react`)'],
  ['require, literal', "export const u: unknown = require('react')"],
  ['require, computed', "const n = 'react'\nexport const u: unknown = require(n)"]
]

/** Probes that must pass: the rules may not refuse legitimate metadata code. */
const ALLOWED = [
  ['module with no imports', 'export const clean = 1'],
  [
    'relative import inside src/meta',
    "import { ICON_GRID } from './icon-grid'\nexport const u = ICON_GRID"
  ]
]

/**
 * Lints one source text as if it lived at {@link PROBE_FILE}.
 * @param {string} source - The probe source.
 * @returns {{ status: number | null, output: string }} Exit status and combined output.
 */
function lintProbe(source) {
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
      PROBE_FILE
    ],
    { cwd: ROOT, input: `${source}\n`, encoding: 'utf8' }
  )
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

/**
 * Lists files under `src/meta/` whose extension lint does not cover.
 * @param {string} dir - Directory to scan.
 * @returns {string[]} Absolute paths of files that are not `.ts`.
 */
function findNonTs(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return findNonTs(path)
    return entry.name.endsWith('.ts') ? [] : [path]
  })
}

/**
 * Runs every probe and the extension scan.
 * @returns {string[]} Human-readable failures; empty when the gate passes.
 */
function runGate() {
  const failures = []
  for (const [name, source] of REFUSED) {
    const { status, output } = lintProbe(source)
    if (status === 0 || !output.includes(MESSAGE)) failures.push(`not refused: ${name}`)
  }
  for (const [name, source] of ALLOWED) {
    if (lintProbe(source).status !== 0) failures.push(`wrongly refused: ${name}`)
  }
  for (const file of findNonTs(META_DIR)) failures.push(`only .ts is allowed in src/meta: ${file}`)
  return failures
}

const failures = runGate()
if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`)
  process.exit(1)
}
console.log(`✓ ./meta is self-contained (${REFUSED.length} entry forms refused).`)
