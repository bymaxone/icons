#!/usr/bin/env node
/**
 * Dogfood smoke test: validates the published package shape before tagging.
 *
 * What this script validates:
 *   1. Build artifacts exist for every subpath (ESM, CJS, .d.ts)
 *   2. Named exports resolve from ESM for every subpath
 *   3. Named exports resolve from CJS for every subpath
 *   4. The packed tarball contains only dist/ + meta files
 *   5. A minimal consumer, scaffolded in an OS temp dir, installs the packed
 *      tarball via a `file:` dependency and resolves every subpath from both
 *      ESM and CJS through the published `exports` map
 *   6. The same consumer renders a fixture icon made with the installed
 *      `createIcon`, and every generated component, through `react-dom/server`
 *
 * The subpaths and the names each must export are read from the built
 * `dist/metadata.json` (see `package-expectations.mjs`), so every icon and brand the
 * build holds is covered, and a build with none still checks the runtime, `./meta` and
 * `./brands`.
 *
 * Exit codes:
 *   0: all assertions pass
 *   1: one or more assertions failed (details printed to stderr)
 *   2: build artifacts missing (run `pnpm build` first)
 *
 * Usage:
 *   pnpm build && node scripts/dogfood-smoke-test.mjs
 */

import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execSync, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

import { packageExpectations } from './package-expectations.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const pkg = require(resolve(ROOT, 'package.json'))

if (!existsSync(resolve(ROOT, 'dist', 'metadata.json'))) {
  console.error('Missing build artifact: dist/metadata.json. Run "pnpm build" first.')
  process.exit(2)
}

// Named runtime exports each subpath must resolve to, one subpath per JavaScript entry of
// package.json "exports" and one per icon of the build. Type-only exports are erased in
// the emitted JS and so are intentionally absent here; the structural checks below (build
// artifacts, subpath resolution, tarball contents) gate the rest of the package shape.
const EXPECTED = packageExpectations(ROOT)
const EXPECTED_EXPORTS = EXPECTED.exports
const SUBPATHS = Object.keys(EXPECTED_EXPORTS)

// React is the package's peer, so the consumer installs it beside the tarball, at
// the versions this repository tests against: the render below then exercises the
// same React the specs do.
const REACT_VERSIONS = {
  react: require('react/package.json').version,
  'react-dom': require('react-dom/package.json').version
}

const ALLOWED_TARBALL_PATHS = [
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'TRADEMARKS.md',
  'dist/'
]

let failures = 0
let consumerDir
let packOutDir

function fail(msg) {
  console.error(`  FAIL: ${msg}`)
  failures++
}

function pass(msg) {
  console.log(`  PASS: ${msg}`)
}

function section(title) {
  console.log(`\n${title}`)
}

function specifierFor(subpath) {
  return subpath === '.' ? pkg.name : `${pkg.name}${subpath.slice(1)}`
}

/**
 * Resolve a subpath's artifacts from the `exports` map as declared.
 *
 * `types` is declared per condition — `import` resolves `.d.ts`, `require`
 * resolves `.d.cts` — so a CommonJS consumer lands on declarations for the right
 * module format. Reading both is what makes this check notice a `.d.cts` that was
 * never emitted, which is the half a single shared `types` entry used to hide.
 */
function distArtifactsFor(subpath) {
  // `./icons/<name>` is served by the `./icons/*` pattern: its `*` stands for the name.
  const declared = new Map(Object.entries(pkg.exports))
  const pattern = subpath.startsWith('./icons/') ? declared.get('./icons/*') : undefined
  const name = subpath.slice('./icons/'.length)
  const entry =
    pattern === undefined
      ? declared.get(subpath)
      : JSON.parse(JSON.stringify(pattern).replaceAll('*', name))
  const strip = (value, where) => {
    // A clear failure beats `p.replace is not a function`: the shape of the
    // `exports` map is exactly what this script exists to check, so a malformed
    // one has to say which subpath and which condition is wrong.
    if (typeof value !== 'string') {
      console.error(
        `Malformed exports entry for "${subpath}": ${where} is ${JSON.stringify(value)}, expected a path string.`
      )
      process.exit(2)
    }
    return value.replace(/^\.\//, '')
  }
  if (entry === undefined || entry.import === undefined || entry.require === undefined) {
    console.error(
      `Missing exports entry for "${subpath}": expected per-condition "import" and "require" objects.`
    )
    process.exit(2)
  }
  return {
    esmTypes: strip(entry.import.types, 'import.types'),
    cjsTypes: strip(entry.require.types, 'require.types'),
    esm: strip(entry.import.default, 'import.default'),
    cjs: strip(entry.require.default, 'require.default')
  }
}

function checkBuildArtifacts() {
  section('1. Build artifacts')
  for (const subpath of SUBPATHS) {
    const { esmTypes, cjsTypes, esm, cjs } = distArtifactsFor(subpath)
    for (const f of [esmTypes, cjsTypes, esm, cjs]) {
      const abs = resolve(ROOT, f)
      if (!existsSync(abs)) {
        console.error(`Missing build artifact: ${f}. Run "pnpm build" first.`)
        process.exit(2)
      }
      pass(f)
    }
  }
}

async function checkNamedExports() {
  for (const [subpath, expected] of Object.entries(EXPECTED_EXPORTS)) {
    const { esm, cjs } = distArtifactsFor(subpath)

    section(`2. ESM named exports: ${subpath}`)
    const esmModule = await import(resolve(ROOT, esm))
    for (const name of expected) {
      if (name in esmModule) pass(`export ${name}`)
      else fail(`Missing export: ${name}`)
    }
    if (expected.length === 0) pass('no named exports declared yet')

    section(`3. CJS named exports: ${subpath}`)
    const cjsModule = require(resolve(ROOT, cjs))
    for (const name of expected) {
      if (name in cjsModule) pass(`cjs export ${name}`)
      else fail(`Missing CJS export: ${name}`)
    }
    if (expected.length === 0) pass('no named exports declared yet')
  }
}

function packTarball() {
  packOutDir = mkdtempSync(join(tmpdir(), 'dogfood-pack-'))
  const packJson = execSync(`npm pack --json --pack-destination "${packOutDir}"`, {
    cwd: ROOT,
    encoding: 'utf8'
  })
  const [result] = JSON.parse(packJson)
  return { tarballPath: resolve(packOutDir, result.filename), files: result.files }
}

function checkTarballContents(files) {
  section('4. Tarball contents (npm pack)')
  const unexpectedFiles = files
    .map((f) => f.path)
    .filter((f) => !ALLOWED_TARBALL_PATHS.some((prefix) => f === prefix || f.startsWith(prefix)))
  if (unexpectedFiles.length === 0) {
    pass(`Tarball contains only dist/ + meta files (${files.length} entries)`)
  } else {
    for (const f of unexpectedFiles) fail(`Unexpected file in tarball: ${f}`)
  }
}

function scaffoldConsumer(tarballPath) {
  consumerDir = mkdtempSync(join(tmpdir(), 'dogfood-consumer-'))
  const consumerPkgJson = {
    name: 'dogfood-consumer',
    version: '0.0.1',
    type: 'module',
    dependencies: { [pkg.name]: `file:${tarballPath}`, ...REACT_VERSIONS }
  }
  writeFileSync(resolve(consumerDir, 'package.json'), JSON.stringify(consumerPkgJson, null, 2))
  return spawnSync('pnpm', ['install', '--no-frozen-lockfile'], {
    cwd: consumerDir,
    encoding: 'utf8',
    timeout: 60_000
  })
}

function checkConsumerResolution() {
  const esmScript = SUBPATHS.map((s) => `import(${JSON.stringify(specifierFor(s))})`)
  const esmProbe = [
    `Promise.all([${esmScript.join(', ')}])`,
    '.then(() => process.exit(0))',
    '.catch((e) => { console.error(e); process.exit(5) })'
  ].join('')
  const esmResult = spawnSync('node', ['--input-type=module', '-e', esmProbe], {
    cwd: consumerDir,
    encoding: 'utf8',
    timeout: 30_000
  })
  if (esmResult.status === 0) pass('ESM specifiers resolve via exports map from consumer cwd')
  else fail(`Consumer ESM import failed (code ${esmResult.status}): ${esmResult.stderr}`)

  const cjsLines = SUBPATHS.map((s) => `require(${JSON.stringify(specifierFor(s))})`).join('\n')
  const cjsResult = spawnSync('node', ['--input-type=commonjs', '-e', cjsLines], {
    cwd: consumerDir,
    encoding: 'utf8',
    timeout: 30_000
  })
  if (cjsResult.status === 0) pass('CJS specifiers resolve via exports map from consumer cwd')
  else fail(`Consumer CJS require failed (code ${cjsResult.status}): ${cjsResult.stderr}`)
}

function checkConsumerRender() {
  section('6. Consumer render smoke (react-dom/server)')
  const probe = [
    "import { createElement } from 'react'",
    "import { renderToStaticMarkup } from 'react-dom/server'",
    `import { createIcon } from ${JSON.stringify(pkg.name)}`,
    "const FixtureIcon = createIcon('fixture', [['path', { d: 'M4 12h16' }]])",
    "const html = renderToStaticMarkup(createElement(FixtureIcon, { title: 'Fixture' }))",
    'const expected = [\'viewBox="0 0 24 24"\', \'role="img"\', \'aria-label="Fixture"\',',
    '  \'class="bx-icon bx-icon-fixture"\', \'<title>Fixture</title><path d="M4 12h16"></path>\']',
    'const missing = expected.filter((part) => !html.includes(part))',
    'if (missing.length) { console.error(html); process.exit(6) }',
    `for (const { subpath, name, className } of ${JSON.stringify(EXPECTED.components)}) {`,
    `  const module = await import(${JSON.stringify(pkg.name)} + subpath.slice(1))`,
    "  const markup = renderToStaticMarkup(createElement(module[name], { title: 'Named' }))",
    "  const named = markup.includes('role=\"img\"') && markup.includes('<title>Named</title>')",
    '  if (!named || !markup.includes(`class="${className}"`)) { console.error(markup); process.exit(7) }',
    '}'
  ].join('\n')
  const result = spawnSync('node', ['--input-type=module', '-e', probe], {
    cwd: consumerDir,
    encoding: 'utf8',
    timeout: 30_000
  })
  if (result.status === 0) {
    pass(
      `a fixture icon and ${EXPECTED.components.length} generated component(s) render from the installed tarball`
    )
  } else fail(`Consumer render failed (code ${result.status}): ${result.stderr}`)
}

function checkConsumerInstall() {
  section('5. Consumer file: install smoke (packed tarball)')
  const { tarballPath, files } = packTarball()
  checkTarballContents(files)

  const installResult = scaffoldConsumer(tarballPath)
  if (installResult.status !== 0) {
    fail(`pnpm install in consumer failed: ${installResult.stderr}`)
    return
  }
  pass('pnpm install with packed tarball succeeded')
  checkConsumerResolution()
  checkConsumerRender()
}

function cleanup() {
  for (const dir of [consumerDir, packOutDir]) {
    if (!dir) continue
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      // Best-effort cleanup: a leftover temp dir does not affect correctness.
    }
  }
}

checkBuildArtifacts()
await checkNamedExports()
try {
  checkConsumerInstall()
} catch (err) {
  fail(`Consumer scaffolding failed: ${err instanceof Error ? err.message : String(err)}`)
} finally {
  cleanup()
}

console.log('')
if (failures === 0) {
  console.log('All dogfood smoke assertions passed.')
  process.exit(0)
} else {
  console.error(`${failures} assertion(s) failed.`)
  process.exit(1)
}
