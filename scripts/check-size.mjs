#!/usr/bin/env node
// Zero-dependency bundle-size gate. Measures every published subpath's ESM
// bundle (raw + brotli-compressed) and fails when any subpath exceeds the
// hard-coded budget below.
//
// Why zero deps: this package ships "dependencies": {} on purpose. The
// CI/release runner must stay free of third-party tooling so a compromised
// devDep cannot tamper with the bundle before `pnpm publish`. `node:zlib`'s
// brotli matches what npm/CDN compression produces on the wire.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync, constants } from 'node:zlib'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Budgets are in bytes (KiB units, `n * 1024`, matching the table's /1024
// display) measured against the brotli'd .mjs bundle: what a consumer's
// bundler/CDN ships. Brotli, not gzip, to match real wire compression.
//
// Bymax bundle-size convention: the .mjs ships UNMINIFIED, without comments
// (tsup `minify: false`, then scripts/strip-bundle-comments.mjs). Readable stack
// traces and source inside a consumer's node_modules are the family default, and
// the documentation lives in the .d.ts. A consumer's bundler minifies an icon
// library on its way to the browser anyway, so the budget measures what the package
// adds before that step. The budget is a bloat tripwire, not a hard design ceiling:
// raise it (and say why here) when growth is legitimate, tighten it when the
// artifact shrinks.
//
// What the budgets rest on, measured on a build that holds no drawing:
//   - root, 0.75 KiB brotli: the entry re-exports the grid, the runtime and every icon by
//     package specifier and holds no code of its own, measured at 85 bytes brotli with no
//     icon and at 577 bytes with 56 icons, about 9 bytes per icon. Each
//     icon adds one re-export line, so every drawing batch recalibrates the budget.
//   - runtime, 1.25 KiB brotli: the `Icon` base, `createIcon`, the stroke maths and the
//     accessibility rules, measured at 3228 bytes raw and 1114 bytes brotli. The headroom
//     fits a small fix, while an inlined dependency such as React fails.
//   - meta, 3.5 KiB brotli: the grid, the deep freeze and the twelve categories, measured at
//     497 bytes brotli with no record, at 1.13 KiB brotli with the records of the twelve
//     keystone icons, and at 3057 bytes with 56 records, about 46 bytes
//     brotli per record. The headroom fits about ten records or a tag edit; every drawing
//     batch adds records, so each one recalibrates it.
//   - brands, 0.25 KiB brotli: the entry is empty until a brand mark exists (5 bytes
//     brotli); the budget is a floor that catches an accidental inline of the runtime.
//
// Every icon module under `dist/icons/<name>/` is measured too, against the targets of the
// specification: each icon at most 0.6 KiB brotli, and the runtime with one icon at most
// 1.5 KiB brotli (the two files compressed together, as a consumer's bundle would ship
// them). Against 56 icons the largest module, `settings`, measures 0.36 KiB
// brotli and the largest pair 1.42 KiB, so the targets hold as budgets. A drawing that breaks them is
// simplified, not budgeted for: a gear whose tooth corners each carried a cubic curve
// measured 0.51 KiB alone and 1.58 KiB with the runtime, and drawing those corners with
// the round join of the stroke brought it to 0.32 KiB and 1.36 KiB.
const BUDGETS = [
  { name: 'root (re-exports)', path: 'dist/index.mjs', brotli: 0.75 * 1024 },
  { name: 'runtime (Icon base)', path: 'dist/runtime/index.mjs', brotli: 1.25 * 1024 },
  { name: 'meta (typed metadata)', path: 'dist/meta/index.mjs', brotli: 3.5 * 1024 },
  { name: 'brands (brand marks)', path: 'dist/brands/index.mjs', brotli: 0.25 * 1024 }
]
const ICON_BUDGET = 0.6 * 1024
const RUNTIME_WITH_ICON_BUDGET = 1.5 * 1024

const fmt = (n) => `${(n / 1024).toFixed(2)} kB`

const BROTLI_OPTS = {
  params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY }
}

let failed = 0
const rows = []

/** Reads a build artifact, exiting with the build hint only when it is genuinely absent. */
function readArtifact(path) {
  // Read straight away rather than stat-then-read: two syscalls where one will
  // do, and the pair is a check-then-use race — the artifact can be replaced
  // between them, so the size reported would not be the size that was checked.
  try {
    return readFileSync(resolve(ROOT, path))
  } catch (error) {
    // Only a genuinely absent artifact gets the friendly message. Anything
    // else — EACCES, EISDIR, a transient IO fault — keeps its own error, or
    // the real cause would be reported as "run pnpm build" and hide itself.
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error
    console.error(`Missing build artifact: ${path}. Run "pnpm build" first.`)
    process.exit(2)
  }
}

/** Records one row of the table, and a failure when it is over its budget. */
function measure(name, raw, limit) {
  const compressed = brotliCompressSync(raw, BROTLI_OPTS).length
  const ok = compressed <= limit
  if (!ok) failed += 1
  rows.push({ name, raw: raw.length, brotli: compressed, limit, delta: compressed - limit, ok })
}

for (const { name, path, brotli: limit } of BUDGETS) measure(name, readArtifact(path), limit)

// One directory per icon entry, `dist/icons/<name>/index.mjs`; none before the first drawing.
const iconsDir = resolve(ROOT, 'dist', 'icons')
const icons = existsSync(iconsDir) ? readdirSync(iconsDir).sort() : []
const runtime = readArtifact('dist/runtime/index.mjs')
for (const icon of icons) {
  const bundle = readArtifact(`dist/icons/${icon}/index.mjs`)
  measure(`icon ${icon}`, bundle, ICON_BUDGET)
  measure(`runtime + ${icon}`, Buffer.concat([runtime, bundle]), RUNTIME_WITH_ICON_BUDGET)
}

const pad = (s, n) => String(s).padEnd(n)
const padL = (s, n) => String(s).padStart(n)

console.log('')
console.log(
  `  ${pad('Subpath', 32)}${padL('Raw', 12)}${padL('Brotli', 12)}${padL('Budget', 12)}  Status`
)
console.log(`  ${'-'.repeat(32)}${'-'.repeat(12)}${'-'.repeat(12)}${'-'.repeat(12)}  ------`)
for (const r of rows) {
  const status = r.ok ? 'PASS' : `FAIL +${fmt(r.delta)}`
  console.log(
    `  ${pad(r.name, 32)}${padL(fmt(r.raw), 12)}${padL(fmt(r.brotli), 12)}${padL(fmt(r.limit), 12)}  ${status}`
  )
}
if (icons.length === 0) {
  console.log('  No icon module in dist/icons: the per-icon budgets apply once one is built.')
}
console.log('')

if (failed > 0) {
  console.error(`${failed} subpath(s) exceeded the brotli budget.`)
  process.exit(1)
}
