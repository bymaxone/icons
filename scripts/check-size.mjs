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
  BRAND_MODULE_BYTES,
  FLAG_MODULE_BYTES,
  FLAGS_BASE_BYTES,
  FLAGS_CAP_BYTES,
  FLAGS_FLAG_BYTES,
  BRANDS_BASE_BYTES,
  BRANDS_CAP_BYTES,
  BRANDS_MARK_BYTES,
  META_BASE_BYTES,
  META_CAP_BYTES,
  META_RECORD_BYTES,
  ROOT_BASE_BYTES,
  ROOT_CAP_BYTES,
  ROOT_ICON_BYTES,
  brandsLimit,
  flagCost,
  flagsLimit,
  iconCost,
  markCost,
  metaLimit,
  recordCost,
  rootLimit
} from '../src/pipeline/meta-budget.ts'

// `SIZE_GATE_ROOT` points the gate at another tree: the spec of the native budgets runs it on a
// small built package it assembles, so a budget that fails is proven to fail.
const ROOT = process.env.SIZE_GATE_ROOT ?? resolve(dirname(fileURLToPath(import.meta.url)), '..')

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
//   - root, a budget per icon: the entry re-exports the grid, the runtime and every icon by
//     package specifier and holds no code of its own, one re-export line for each, so its size
//     grows with the set. It measures 85 bytes brotli with no icon and
//     5409 bytes with 545 icons, (5409 - 85) / 545 = 9.8 bytes brotli an icon. The budget is
//     12 bytes an icon, about 20% of headroom for a longer name, so the limit is 85 + 12 * icons
//     and follows the set. A sanity cap of 28 KiB holds whatever the icons, room for about
//     2,300 of them; the arithmetic is `src/pipeline/meta-budget.ts`.
//     A package of a handful of icons, such as the placeholders of `fixtures/icons`, is held to a
//     floor of 512 bytes for the root and 2 KiB for meta, because its fixed part outweighs
//     the cost of an icon.
//   - runtime, 1.75 KiB brotli: the `Icon` and `Flag` bases, `createIcon` and `createFlag`, the
//     stroke maths, the view box reader and the accessibility rules, measured at 5976 bytes raw
//     and 1617 bytes brotli. The headroom of 11% fits a small fix, while an inlined dependency
//     such as React fails.
//   - meta, a budget per record: `dist/meta/index.mjs` grows with every icon and brand, so its
//     size follows the set. The fixed part (the grid, the deep
//     freeze, the categories and the empty tables) measures 707 bytes brotli with every
//     icon name and record taken out; the tree measures 24843 bytes with 559 records (545
//     icon and 14 brand), (24843 - 707) / 559 = 43.2 bytes brotli a record, the icon's `label`
//     included. The budget is 52 bytes a record, about 20% of headroom for records with longer
//     tags and use cases, so the limit is 707 + 52 * records and follows the set. A sanity cap of 112 KiB holds whatever the records, room for about
//     2,000 of them at the measured cost; the arithmetic is `src/pipeline/meta-budget.ts`.
//   - brands: `dist/brands/index.mjs` holds one re-export line per mark, through the mark's own
//     subpath, so its size follows the set: 5 bytes brotli with no mark and 8.7 bytes a mark
//     with 110. The budget is 16 bytes a mark above a base of 5, within a floor of 256 bytes and
//     a cap of 8 KiB; the arithmetic is `src/pipeline/meta-budget.ts`. A barrel that inlines the
//     marks again fails. Each mark's own module, `dist/brands/<name>/index.mjs`, holds the owner's
//     path data and is held to 4 KiB brotli: the largest of the 110 measures 2,944 bytes. An
//     inline of the runtime still fails.
//   - flags: `dist/flags/index.mjs` holds one re-export line per flag, through the flag's own
//     subpath, so its size follows the set: 5 bytes brotli with no flag and 733 with 250, 2.9
//     bytes a flag. The budget is 3.5 bytes a flag above a base of 5, within a floor of 512
//     bytes and a cap of 8 KiB. Each flag's own module, `dist/flags/<name>/index.mjs`, is held
//     to 2 KiB brotli: the largest of the 250 measures 1,505 bytes, 403 on average.
//
// A fixed-weight contour stores both edges of the ink. The densest component, qr-code,
// measures 1,394 bytes alone and 2,224 with the runtime. The component gate limits these
// to 1.4 and 2.25 KiB respectively and checks tree-shaking independently.
// Whole modules include every variant. The octopus module measures 1,638 bytes on web
// and 1,665 on native. A 1.65 KiB ceiling applies to both targets.
const BUDGETS = [
  { name: 'runtime (Icon and Flag bases)', path: 'dist/runtime/index.mjs', brotli: 1.75 * 1024 }
]
const MODULE_BUDGET = 1.65 * 1024

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

// The meta bundle is budgeted per record: icons, brands and flags in the merged metadata.
const merged = JSON.parse(readArtifact('dist/metadata.json').toString('utf8'))
const flagCount = Object.keys(merged.flags).length
const records = Object.keys(merged.icons).length + Object.keys(merged.brands).length + flagCount
const rootBundle = readArtifact('dist/index.mjs')
const iconCount = Object.keys(merged.icons).length
measure('root (re-exports)', rootBundle, rootLimit(iconCount))
const rootCost = iconCost(brotliCompressSync(rootBundle, BROTLI_OPTS).length, iconCount)
const brandsBundle = readArtifact('dist/brands/index.mjs')
const brandCount = Object.keys(merged.brands).length
measure('brands (brand marks)', brandsBundle, brandsLimit(brandCount))
const brandCost = markCost(brotliCompressSync(brandsBundle, BROTLI_OPTS).length, brandCount)
const flagsBundle = readArtifact('dist/flags/index.mjs')
measure('flags (re-exports)', flagsBundle, flagsLimit(flagCount))
const flagCostBytes = flagCost(brotliCompressSync(flagsBundle, BROTLI_OPTS).length, flagCount)
const metaBundle = readArtifact('dist/meta/index.mjs')
measure('meta (typed metadata)', metaBundle, metaLimit(records))
const metaCost = recordCost(brotliCompressSync(metaBundle, BROTLI_OPTS).length, records)

// One directory per brand entry, `dist/brands/<name>/index.mjs`, each held to its own budget: a
// consumer who imports one mark loads this module and nothing else of the marks.
const brandsDir = resolve(ROOT, 'dist', 'brands')
const brandEntries = existsSync(brandsDir)
  ? readdirSync(brandsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory())
  : []
for (const { name } of brandEntries) {
  measure(`brand ${name}`, readArtifact(`dist/brands/${name}/index.mjs`), BRAND_MODULE_BYTES)
}

// One directory per flag entry, `dist/flags/<name>/index.mjs`, each held to its own budget: a
// consumer who imports one flag loads this module and nothing else of the flags.
const flagsDir = resolve(ROOT, 'dist', 'flags')
const flagEntries = existsSync(flagsDir)
  ? readdirSync(flagsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory())
  : []
for (const { name } of flagEntries) {
  measure(`flag ${name}`, readArtifact(`dist/flags/${name}/index.mjs`), FLAG_MODULE_BYTES)
}

// One directory per icon entry, `dist/icons/<name>/index.mjs`; none before the first drawing.
const iconsDir = resolve(ROOT, 'dist', 'icons')
const icons = existsSync(iconsDir) ? readdirSync(iconsDir).sort() : []
for (const icon of icons) {
  measure(`module ${icon}`, readArtifact(`dist/icons/${icon}/index.mjs`), MODULE_BUDGET)
}

// React Native entries, each held to a budget above its measured brotli size. They are fixed
// numbers, as the runtime's is: the native index re-exports every icon, so it moves with the set,
// and a growing set raises it here with a reviewed number rather than a formula. Measured on 1,298
// icon modules, 250 flag modules and 110 marks: index 12,397 bytes, runtime 1,786, brands 42,602,
// flags 732; the largest native icon module is `octopus` and the largest flag `sa-flag` at
// 1,504, so the per-module budgets are the web's (1.65 KiB and 2 KiB).
const NATIVE_BUDGETS = [
  ['native (re-exports)', 'dist/native/index.mjs', 14.5 * 1024],
  ['native/runtime', 'dist/native/runtime/index.mjs', 2.1 * 1024],
  ['native/brands (re-exports)', 'dist/native/brands/index.mjs', 1.5 * 1024],
  ['native/flags (re-exports)', 'dist/native/flags/index.mjs', 0.9 * 1024]
]
for (const [name, path, limit] of NATIVE_BUDGETS) measure(name, readArtifact(path), limit)

// One directory per native icon and per native flag, each held to the budget of its web twin.
for (const [dir, limit] of [
  ['icons', MODULE_BUDGET],
  ['brands', BRAND_MODULE_BYTES],
  ['flags', FLAG_MODULE_BYTES]
]) {
  const nativeDir = resolve(ROOT, 'dist', 'native', dir)
  if (!existsSync(nativeDir)) continue
  for (const entry of readdirSync(nativeDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    measure(
      `native/${dir}/${entry.name}`,
      readArtifact(`dist/native/${dir}/${entry.name}/index.mjs`),
      limit
    )
  }
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
  `  root: ${rootCost.toFixed(1)} bytes brotli per icon over ${iconCount} icons ` +
    `(budget ${ROOT_ICON_BYTES} above a base of ${ROOT_BASE_BYTES}, cap ${fmt(ROOT_CAP_BYTES)})`
)
console.log(
  `  brands: ${brandCost.toFixed(1)} bytes brotli per mark over ${brandCount} marks ` +
    `(budget ${BRANDS_MARK_BYTES} above a base of ${BRANDS_BASE_BYTES}, cap ${fmt(BRANDS_CAP_BYTES)})`
)
console.log(
  `  flags: ${flagCostBytes.toFixed(1)} bytes brotli per flag over ${flagCount} flags ` +
    `(budget ${FLAGS_FLAG_BYTES} above a base of ${FLAGS_BASE_BYTES}, cap ${fmt(FLAGS_CAP_BYTES)}; a module of one flag, ${fmt(FLAG_MODULE_BYTES)})`
)
console.log(
  `  meta: ${metaCost.toFixed(1)} bytes brotli per record over ${records} records ` +
    `(budget ${META_RECORD_BYTES} above a base of ${META_BASE_BYTES}, cap ${fmt(META_CAP_BYTES)})`
)
console.log('')

if (failed > 0) {
  console.error(`${failed} subpath(s) exceeded the brotli budget.`)
  process.exit(1)
}
