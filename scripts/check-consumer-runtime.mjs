#!/usr/bin/env node
/**
 * Consumer load gate (zero external dependencies).
 *
 * Every other gate reads the source or the type declarations. This one packs the
 * tarball, lays it out the way npm would, and loads every subpath from it — in
 * ESM and in CommonJS — asserting the values each one is supposed to export are
 * really there.
 *
 * `attw` proves the declarations *resolve*; it never runs the JavaScript. A
 * broken `exports` map, a bundler misconfiguration, or an entry that ships an
 * empty module all pass a type check and fail here.
 *
 * Loading is not rendering, so the probes also render a fixture icon made with the
 * packed `createIcon`: through `react-dom/server` in ESM and in CommonJS, and
 * through the Server Components renderer under the `react-server` condition, where
 * React leaves out its client-only APIs. The built root is scanned as well: no
 * `'use client'` directive, and `createElement` as the only name it imports from
 * `react`. React, `react-dom` and `react-server-dom-webpack` come from this
 * repository's `node_modules`, which Node reaches by walking up from the consumer
 * directory, so the probes need no install.
 *
 * Usage: `node scripts/check-consumer-runtime.mjs` (run after `pnpm build`).
 */
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
// Read from the manifest rather than hard-coded: this gate exists to inspect the
// packed artifact, so a rename must not leave it silently checking a package that no
// longer exists.
const packageName = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8')).name
const consumerDir = join(rootDir, '.consumer-runtime-check')

/**
 * Subpath → the values a consumer must find on it.
 *
 * The root re-exports the grid from `./meta` by package specifier, so loading the
 * root from the tarball also proves that specifier resolves through the published
 * `exports` map rather than through a path that exists only in the repository.
 */
const SUBPATHS = {
  '.': ['ICON_GRID', 'Icon', 'createIcon'],
  './meta': ['ICON_GRID']
}

const probeBody = `
const failures = []
for (const [subpath, names] of Object.entries(SUBPATHS)) {
  const namespace = loaded[subpath]
  if (namespace === undefined) {
    failures.push(subpath + ' did not load')
    continue
  }
  const missing = names.filter((name) => namespace[name] === undefined)
  if (missing.length) failures.push(subpath + ' does not export: ' + missing.join(', '))
}
if (failures.length) {
  for (const failure of failures) console.error('  ✗ ' + failure)
  process.exit(1)
}
const total = Object.values(SUBPATHS).reduce((sum, names) => sum + names.length, 0)
console.log('  ✓ ' + FORMAT + ': ' + Object.keys(SUBPATHS).length + ' subpath(s), ' + total + ' export(s) present')
`

/**
 * The fixture rendered from the tarball, and the markup it must produce: the
 * grid, the stroke, the silent default and the class names, all written by the
 * packed runtime.
 */
const FIXTURE_ICON = "createIcon('fixture', [['path', { d: 'M4 12h16' }]])"
const FIXTURE_MARKUP =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ' +
  'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" ' +
  'stroke-linejoin="round" focusable="false" aria-hidden="true" ' +
  'class="bx-icon bx-icon-fixture"><path d="M4 12h16"></path></svg>'

const renderBody = `
const FixtureIcon = loaded['.'].${FIXTURE_ICON}
const markup = renderToStaticMarkup(createElement(FixtureIcon))
if (markup !== ${JSON.stringify(FIXTURE_MARKUP)}) {
  console.error('  ✗ ' + FORMAT + ': the fixture icon rendered ' + markup)
  process.exit(1)
}
console.log('  ✓ ' + FORMAT + ': a fixture icon renders through react-dom/server')
`

/**
 * Renders the fixture through Flight under `--conditions=react-server`. Loading
 * `react-server-dom-webpack/server` throws outside that condition, so a pass also
 * proves the condition was in effect; the component then runs on the React build
 * that has no `useState`, `useEffect` or `createContext`.
 */
const rscProbe = `import { createElement } from 'react'
import * as React from 'react'
import { renderToPipeableStream } from 'react-server-dom-webpack/server'
import { Writable } from 'node:stream'
import { createIcon } from '${packageName}'
if (React.useState !== undefined) {
  console.error('  ✗ RSC: react resolved to its client build')
  process.exit(1)
}
const FixtureIcon = ${FIXTURE_ICON}
let payload = ''
const sink = new Writable({
  write(chunk, _encoding, callback) { payload += chunk; callback() },
  final(callback) {
    const row = payload.split('\\n').find((line) => line.startsWith('0:['))
    const element = row === undefined ? [] : JSON.parse(row.slice(2))
    const props = element[3] ?? {}
    if (element[1] !== 'svg' || props.className !== 'bx-icon bx-icon-fixture' || props['aria-hidden'] !== 'true') {
      console.error('  ✗ RSC: unexpected payload ' + payload)
      process.exit(1)
    }
    console.log('  ✓ RSC: a fixture icon renders as a Server Component under react-server')
    callback()
  }
})
renderToPipeableStream(createElement(FixtureIcon), {}, {
  onError(error) {
    console.error('  ✗ RSC: ' + (error && error.message))
    process.exit(1)
  }
}).pipe(sink)
`

/**
 * Scans the built root, in both formats, for what would put a consumer behind a
 * client boundary: a `'use client'` directive, or any React import other than
 * `createElement` (hooks, context and the other client-only APIs all come from
 * `react`).
 * @param {string} packageDir - The unpacked package.
 * @returns {string[]} Failures; empty when the bundle is clean.
 */
function scanRootBundle(packageDir) {
  const failures = []
  const bundles = {
    'dist/index.mjs': /^import\s+\{([^}]*)\}\s+from\s+'react';?$/gm,
    'dist/index.cjs': /^var\s+(\w+)\s*=\s*require\('react'\);?$/gm
  }
  for (const [file, pattern] of Object.entries(bundles)) {
    const source = readFileSync(join(packageDir, file), 'utf8')
    if (/['"]use client['"]/.test(source)) failures.push(`${file} holds a 'use client' directive`)
    const imported = [...source.matchAll(pattern)].map((match) => match[1])
    // ESM names what it imports; CommonJS binds the module once and reads members.
    const names = file.endsWith('.mjs')
      ? imported.flatMap((list) => list.split(',').map((name) => name.trim()))
      : [...new Set([...source.matchAll(/\breact\.(\w+)/g)].map((match) => match[1]))]
    if (imported.length !== 1 || names.join(',') !== 'createElement') {
      failures.push(`${file} imports ${JSON.stringify(names)} from react, not only createElement`)
    }
  }
  return failures
}

const specifier = (subpath) => (subpath === '.' ? packageName : packageName + subpath.slice(1))

const esmProbe = `${Object.keys(SUBPATHS)
  .map((s, i) => `import * as m${i} from '${specifier(s)}'`)
  .join('\n')}
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
const SUBPATHS = ${JSON.stringify(SUBPATHS)}
const loaded = { ${Object.keys(SUBPATHS)
  .map((s, i) => `'${s}': m${i}`)
  .join(', ')} }
const FORMAT = 'ESM'
${probeBody}${renderBody}`

const cjsProbe = `${Object.keys(SUBPATHS)
  .map((s, i) => `const m${i} = require('${specifier(s)}')`)
  .join('\n')}
const { createElement } = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const SUBPATHS = ${JSON.stringify(SUBPATHS)}
const loaded = { ${Object.keys(SUBPATHS)
  .map((s, i) => `'${s}': m${i}`)
  .join(', ')} }
const FORMAT = 'CJS'
${probeBody}${renderBody}`

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: 'pipe', ...options })
}

function cleanup() {
  rmSync(consumerDir, { recursive: true, force: true })
}

console.log('Consumer load gate')

if (!existsSync(join(rootDir, 'dist'))) {
  console.error('✗ dist/ is missing — run `pnpm build` first')
  process.exit(1)
}

cleanup()
const packDir = mkdtempSync(join(tmpdir(), 'pack-'))
let failed = false

try {
  // `--ignore-scripts` keeps `prepublishOnly` from rebuilding underneath the
  // artifact this gate is meant to inspect.
  //
  // `npm publish --dry-run` exports `npm_config_dry_run`, which this nested pack
  // would inherit — and a dry pack writes no file, so the gate would fail on the
  // one path it most needs to hold: the publish that runs it. The variable is
  // dropped for the child only.
  const packEnv = { ...process.env }
  delete packEnv['npm_config_dry_run']
  run('npm', ['pack', '--ignore-scripts', '--silent', '--pack-destination', packDir], {
    cwd: rootDir,
    env: packEnv
  })
  // Read the directory rather than parse stdout: npm writes notices there too, and
  // the last line is not reliably the filename.
  const packed = readdirSync(packDir).filter((name) => name.endsWith('.tgz'))
  if (packed.length !== 1) {
    throw new Error(`expected one tarball in ${packDir}, found ${packed.length}`)
  }
  const tarball = join(packDir, packed[0])

  const packageDir = join(consumerDir, 'node_modules', packageName)
  mkdirSync(packageDir, { recursive: true })
  run('tar', ['-xzf', tarball, '-C', packageDir, '--strip-components=1'])

  writeFileSync(
    join(consumerDir, 'package.json'),
    `${JSON.stringify({ name: 'consumer-runtime-check', private: true, version: '0.0.0', type: 'module' }, null, 2)}\n`
  )
  writeFileSync(join(consumerDir, 'probe.mjs'), esmProbe)
  writeFileSync(join(consumerDir, 'probe.cjs'), cjsProbe)
  writeFileSync(join(consumerDir, 'probe-rsc.mjs'), rscProbe)

  const scanFailures = scanRootBundle(packageDir)
  for (const failure of scanFailures) console.error(`  ✗ ${failure}`)
  if (scanFailures.length) failed = true
  else console.log("  ✓ the built root has no 'use client' and imports only createElement")

  const probes = [['probe.mjs'], ['probe.cjs'], ['--conditions=react-server', 'probe-rsc.mjs']]
  for (const args of probes) {
    try {
      process.stdout.write(run('node', args, { cwd: consumerDir, stdio: 'pipe' }))
    } catch (error) {
      process.stdout.write(error.stdout ?? '')
      process.stderr.write(error.stderr ?? '')
      failed = true
    }
  }
} catch (error) {
  console.error(`✗ gate setup failed: ${error.message}`)
  if (error.stderr) process.stderr.write(error.stderr)
  failed = true
} finally {
  cleanup()
  rmSync(packDir, { recursive: true, force: true })
}

if (failed) {
  console.error('\n✗ The published artifact does not load for a consumer.')
  process.exit(1)
}

console.log(
  '✓ Every subpath loads in ESM and CommonJS, and the root renders on the server and as a Server Component.'
)
