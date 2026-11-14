#!/usr/bin/env node
/**
 * Consumer load gate (zero external dependencies).
 *
 * Every other gate reads the source or the type declarations. This one packs the
 * tarball, lays it out the way npm would, and loads every subpath from it — in
 * ESM and in CommonJS — asserting each one exports exactly the names it is supposed
 * to: the runtime, the metadata, and every icon and brand component the packed
 * `dist/metadata.json` describes (see `package-expectations.mjs`).
 *
 * `attw` proves the declarations *resolve*; it never runs the JavaScript. A
 * broken `exports` map, a bundler misconfiguration, or an entry that ships an
 * empty module all pass a type check and fail here.
 *
 * Loading is not rendering, so the probes also render: a fixture icon made with the
 * packed `createIcon`, and every generated component, through `react-dom/server` in ESM
 * and in CommonJS and through the Server Components renderer under the `react-server`
 * condition, where React leaves out its client-only APIs. The root re-exports each icon
 * from its own subpath, so the probes require the two to be the same object: each icon
 * exists once. The assets resolve through `exports` as well: the sprite holds exactly the
 * expected symbols, every raw SVG resolves, and `metadata.json` loads and matches `./meta`.
 *
 * The built bundles are scanned too: no `'use client'` directive anywhere, `createElement`
 * as the only name the runtime imports from `react`, and no `react` import in any other
 * bundle. React, `react-dom` and `react-server-dom-webpack` come from this repository's
 * `node_modules`, which Node reaches by walking up from the consumer directory, so the
 * probes need no install.
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

import { packageExpectations } from './package-expectations.mjs'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
// Read from the manifest rather than hard-coded: this gate exists to inspect the
// packed artifact, so a rename must not leave it silently checking a package that no
// longer exists.
const packageName = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8')).name
const consumerDir = join(rootDir, '.consumer-runtime-check')

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

/** The checks both module formats run, given `loaded`, `EXPECTED` and the render helpers. */
const probeBody = `
const failures = []
for (const [subpath, names] of Object.entries(EXPECTED.exports)) {
  const namespace = loaded[subpath]
  if (namespace === undefined) {
    failures.push(subpath + ' did not load')
    continue
  }
  const actual = Object.keys(namespace).filter((name) => name !== 'default').sort()
  if (JSON.stringify(actual) !== JSON.stringify(names)) {
    failures.push(subpath + ' exports ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(names))
  }
}
for (const name of ['Icon', 'createIcon']) {
  if (loaded['.'][name] !== loaded['./runtime'][name]) failures.push('the root ' + name + ' is a copy of the runtime one')
}
for (const [subpath, names] of Object.entries(EXPECTED.exports)) {
  if (!subpath.startsWith('./icons/')) continue
  for (const name of names) {
    if (loaded['.'][name] !== loaded[subpath][name]) failures.push('the root ' + name + ' is a copy of the one in ' + subpath)
  }
}
const FixtureIcon = loaded['.'].${FIXTURE_ICON}
const markup = renderToStaticMarkup(createElement(FixtureIcon))
if (markup !== ${JSON.stringify(FIXTURE_MARKUP)}) failures.push('the fixture icon rendered ' + markup)
for (const { subpath, name, className } of EXPECTED.components) {
  const html = renderToStaticMarkup(createElement(loaded[subpath][name]))
  const silent = html.startsWith('<svg ') && html.includes('aria-hidden="true"') && html.includes('focusable="false"')
  if (!silent || !html.includes('class="' + className + '"')) failures.push(name + ' rendered ' + html)
}
const sprite = readAsset('sprite.svg')
const ids = [...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((match) => match[1]).sort()
if (JSON.stringify(ids) !== JSON.stringify([...EXPECTED.symbols].sort())) failures.push('the sprite holds ' + JSON.stringify(ids))
for (const file of EXPECTED.svgFiles) {
  if (!readAsset(file).startsWith('<svg xmlns="http://www.w3.org/2000/svg" ')) failures.push(file + ' is not a raw SVG')
}
if (JSON.stringify(metadataJson) !== JSON.stringify(EXPECTED.metadata)) failures.push('metadata.json does not load as packed')
const meta = loaded['./meta']
if (JSON.stringify(meta.ICON_METADATA) !== JSON.stringify(EXPECTED.metadata.icons) ||
    JSON.stringify(meta.BRAND_METADATA) !== JSON.stringify(EXPECTED.metadata.brands) ||
    JSON.stringify(meta.FLAG_METADATA) !== JSON.stringify(EXPECTED.metadata.flags)) {
  failures.push('./meta and metadata.json describe different records')
}
if (failures.length) {
  for (const failure of failures) console.error('  ✗ ' + FORMAT + ': ' + failure)
  process.exit(1)
}
const total = Object.values(EXPECTED.exports).reduce((sum, names) => sum + names.length, 0)
console.log('  ✓ ' + FORMAT + ': ' + Object.keys(EXPECTED.exports).length + ' subpath(s) export exactly their ' + total + ' name(s); ' +
  EXPECTED.components.length + ' generated component(s) and the fixture render; ' + EXPECTED.symbols.length + ' sprite symbol(s) and ' +
  EXPECTED.svgFiles.length + ' raw SVG(s) resolve')
`

/**
 * Renders the fixture and every generated component through Flight under
 * `--conditions=react-server`. Loading `react-server-dom-webpack/server` throws outside
 * that condition, so a pass also proves the condition was in effect; the components then
 * run on the React build that has no `useState`, `useEffect` or `createContext`.
 */
function rscProbe(expected) {
  const imports = Object.keys(expected.exports)
    .filter(
      (subpath) =>
        subpath === './brands' ||
        subpath === './flags' ||
        subpath.startsWith('./icons/') ||
        subpath.startsWith('./flags/')
    )
    .map((subpath, i) => `import * as m${i} from '${specifier(subpath)}'`)
  const modules = Object.keys(expected.exports)
    .filter(
      (subpath) =>
        subpath === './brands' ||
        subpath === './flags' ||
        subpath.startsWith('./icons/') ||
        subpath.startsWith('./flags/')
    )
    .map((subpath, i) => `'${subpath}': m${i}`)
  return `import { createElement, Fragment } from 'react'
import * as React from 'react'
import { renderToPipeableStream } from 'react-server-dom-webpack/server'
import { Writable } from 'node:stream'
import { createIcon } from '${packageName}'
${imports.join('\n')}
const loaded = { ${modules.join(', ')} }
const COMPONENTS = ${JSON.stringify(expected.components)}
if (React.useState !== undefined) {
  console.error('  ✗ RSC: react resolved to its client build')
  process.exit(1)
}
const FixtureIcon = ${FIXTURE_ICON}
const tree = createElement(Fragment, null, createElement(FixtureIcon),
  ...COMPONENTS.map(({ subpath, name }) => createElement(loaded[subpath][name])))
let payload = ''
const sink = new Writable({
  write(chunk, _encoding, callback) { payload += chunk; callback() },
  final(callback) {
    const classes = ['bx-icon bx-icon-fixture', ...COMPONENTS.map((c) => c.className)]
    const missing = classes.filter((name) => !payload.includes('"className":"' + name + '"'))
    if (!payload.includes('["$","svg"') || !payload.includes('"aria-hidden":"true"') || missing.length) {
      console.error('  ✗ RSC: unexpected payload ' + payload)
      process.exit(1)
    }
    console.log('  ✓ RSC: the fixture and ' + COMPONENTS.length + ' generated component(s) render as Server Components under react-server')
    callback()
  }
})
renderToPipeableStream(tree, {}, {
  onError(error) {
    console.error('  ✗ RSC: ' + (error && error.message))
    process.exit(1)
  }
}).pipe(sink)
`
}

/** The bundles of every subpath that has JavaScript, by path in the package. */
function bundles(expected) {
  const entries = ['index', 'meta/index', 'brands/index', 'flags/index']
  for (const subpath of Object.keys(expected.exports)) {
    if (subpath.startsWith('./icons/') || subpath.startsWith('./flags/')) {
      entries.push(`${subpath.slice(2)}/index`)
    }
  }
  return entries.flatMap((entry) => [`dist/${entry}.mjs`, `dist/${entry}.cjs`])
}

/**
 * Scans the built bundles, in both formats, for what would put a consumer behind a
 * client boundary: a `'use client'` directive, or a React import other than
 * `createElement` in the runtime (hooks, context and the other client-only APIs all come
 * from `react`). Every other bundle imports nothing from `react`: it renders through the
 * runtime.
 * @param {string} packageDir - The unpacked package.
 * @param {ReturnType<typeof packageExpectations>} expected - What the package exports.
 * @returns {string[]} Failures; empty when the bundles are clean.
 */
function scanBundles(packageDir, expected) {
  const failures = []
  const runtime = {
    'dist/runtime/index.mjs': /^import\s+\{([^}]*)\}\s+from\s+'react';?$/gm,
    'dist/runtime/index.cjs': /^var\s+(\w+)\s*=\s*require\('react'\);?$/gm
  }
  for (const [file, pattern] of Object.entries(runtime)) {
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
  for (const file of bundles(expected)) {
    const source = readFileSync(join(packageDir, file), 'utf8')
    if (/['"]use client['"]/.test(source)) failures.push(`${file} holds a 'use client' directive`)
    if (/from\s+['"]react['"]|require\(['"]react['"]\)/.test(source))
      failures.push(`${file} imports react`)
  }
  return failures
}

const specifier = (subpath) => (subpath === '.' ? packageName : packageName + subpath.slice(1))

function esmProbe(expected) {
  const subpaths = Object.keys(expected.exports)
  return `${subpaths.map((s, i) => `import * as m${i} from '${specifier(s)}'`).join('\n')}
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import metadataJson from '${packageName}/metadata.json' with { type: 'json' }
const EXPECTED = ${JSON.stringify(expected)}
const loaded = { ${subpaths.map((s, i) => `'${s}': m${i}`).join(', ')} }
const readAsset = (file) => readFileSync(fileURLToPath(import.meta.resolve('${packageName}/' + file)), 'utf8')
const FORMAT = 'ESM'
${probeBody}`
}

function cjsProbe(expected) {
  const subpaths = Object.keys(expected.exports)
  return `${subpaths.map((s, i) => `const m${i} = require('${specifier(s)}')`).join('\n')}
const { readFileSync } = require('node:fs')
const { createElement } = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const metadataJson = require('${packageName}/metadata.json')
const EXPECTED = ${JSON.stringify(expected)}
const loaded = { ${subpaths.map((s, i) => `'${s}': m${i}`).join(', ')} }
const readAsset = (file) => readFileSync(require.resolve('${packageName}/' + file), 'utf8')
const FORMAT = 'CJS'
${probeBody}`
}

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: 'pipe', ...options })
}

function cleanup() {
  rmSync(consumerDir, { recursive: true, force: true })
}

/** Packs the repository and unpacks the tarball as `node_modules/<name>` of the consumer. */
function installTarball(packDir) {
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
  const packageDir = join(consumerDir, 'node_modules', packageName)
  mkdirSync(packageDir, { recursive: true })
  run('tar', ['-xzf', join(packDir, packed[0]), '-C', packageDir, '--strip-components=1'])
  return packageDir
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
  const packageDir = installTarball(packDir)
  const expected = packageExpectations(packageDir)
  writeFileSync(
    join(consumerDir, 'package.json'),
    `${JSON.stringify({ name: 'consumer-runtime-check', private: true, version: '0.0.0', type: 'module' }, null, 2)}\n`
  )
  writeFileSync(join(consumerDir, 'probe.mjs'), esmProbe(expected))
  writeFileSync(join(consumerDir, 'probe.cjs'), cjsProbe(expected))
  writeFileSync(join(consumerDir, 'probe-rsc.mjs'), rscProbe(expected))

  const scanFailures = scanBundles(packageDir, expected)
  for (const failure of scanFailures) console.error(`  ✗ ${failure}`)
  if (scanFailures.length) failed = true
  else {
    console.log(
      "  ✓ no bundle has 'use client'; the runtime imports only createElement, and no other bundle imports react"
    )
  }

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
  '✓ Every subpath loads in ESM and CommonJS, and every component renders on the server and as a Server Component.'
)
