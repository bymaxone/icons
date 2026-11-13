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

import {
  META_BASE_BYTES,
  META_CAP_BYTES,
  META_RECORD_BYTES,
  metaLimit,
  recordCost
} from '../src/pipeline/meta-budget.ts'

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
//   - root, 6 KiB brotli: the entry re-exports the grid, the runtime and every icon by
//     package specifier and holds no code of its own, measured at 85 bytes brotli with no
//     icon and at 5409 bytes with 545 icons, about 10 bytes per icon. Each
//     icon adds one re-export line, so every drawing batch recalibrates the budget.
//   - runtime, 1.25 KiB brotli: the `Icon` base, `createIcon`, the stroke maths and the
//     accessibility rules, measured at 3614 bytes raw and 1206 bytes brotli. The headroom
//     fits a small fix, while an inlined dependency such as React fails.
//   - meta, a budget per record, not a total: `dist/meta/index.mjs` grows with every icon and
//     brand, so a fixed total was raised by hand each batch. The fixed part (the grid, the deep
//     freeze, the categories and the empty tables) measures 707 bytes brotli with every
//     icon name and record taken out; the tree measures 24843 bytes with 559 records (545
//     icon and 14 brand), (24843 - 707) / 559 = 43.2 bytes brotli a record, the icon's `label`
//     included. The budget is 52 bytes a record, about 20% of headroom for records with longer
//     tags and use cases, so the limit is 707 + 52 * records and follows the set instead of
//     being recalibrated. A sanity cap of 112 KiB holds whatever the records, room for about
//     2,000 of them at the measured cost; the arithmetic is `src/pipeline/meta-budget.ts`.
//   - brands, 5 KiB brotli: the entry holds every brand mark, measured at 5 bytes brotli
//     with no mark and at 4015 bytes with 14 marks, about 290 bytes per mark, most of it the
//     path data of the owner's geometry. The headroom fits three more marks; an inline of
//     the runtime still fails.
//
// Each icon component is measured by `scripts/check-component-size.mjs`, against the targets
// of the specification: the component a consumer imports, bundled and tree-shaken, at most
// 0.6 KiB brotli alone and 1.5 KiB with the runtime; against 545 icons the largest of 813
// components, `SunFilledIcon`, measures 0.60 KiB and 1.42 KiB. A drawing that breaks them is
// simplified, not budgeted for: a gear whose tooth corners each carried a cubic curve
// measured 0.51 KiB alone and 1.58 KiB with the runtime, and drawing those corners with
// the round join of the stroke brought it to 0.32 KiB and 1.36 KiB.
//
// The whole module under `dist/icons/<name>/` is measured here as well, at most 1.5 KiB
// brotli: what a namespace import or a CommonJS consumer without tree-shaking loads, every
// variant and alias of the icon together. It catches a module that grows while each of its
// components stays inside its own budget. Against 545 icons the largest module,
// `octopus`, measures 0.90 KiB brotli.
const BUDGETS = [
  { name: 'root (re-exports)', path: 'dist/index.mjs', brotli: 6 * 1024 },
  { name: 'runtime (Icon base)', path: 'dist/runtime/index.mjs', brotli: 1.25 * 1024 },
  { name: 'brands (brand marks)', path: 'dist/brands/index.mjs', brotli: 5 * 1024 }
]
const MODULE_BUDGET = 1.5 * 1024

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

// The meta bundle is budgeted per record: icons and brands in the merged metadata.
const merged = JSON.parse(readArtifact('dist/metadata.json').toString('utf8'))
const records = Object.keys(merged.icons).length + Object.keys(merged.brands).length
const metaBundle = readArtifact('dist/meta/index.mjs')
measure('meta (typed metadata)', metaBundle, metaLimit(records))
const metaCost = recordCost(brotliCompressSync(metaBundle, BROTLI_OPTS).length, records)

// One directory per icon entry, `dist/icons/<name>/index.mjs`; none before the first drawing.
const iconsDir = resolve(ROOT, 'dist', 'icons')
const icons = existsSync(iconsDir) ? readdirSync(iconsDir).sort() : []
for (const icon of icons) {
  measure(`module ${icon}`, readArtifact(`dist/icons/${icon}/index.mjs`), MODULE_BUDGET)
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
  console.log('  No icon module in dist/icons: the module budget applies once one is built.')
}
console.log(
  `  meta: ${metaCost.toFixed(1)} bytes brotli per record over ${records} records ` +
    `(budget ${META_RECORD_BYTES} above a base of ${META_BASE_BYTES}, cap ${fmt(META_CAP_BYTES)})`
)
console.log('')

if (failed > 0) {
  console.error(`${failed} subpath(s) exceeded the brotli budget.`)
  process.exit(1)
}
