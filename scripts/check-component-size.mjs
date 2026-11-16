#!/usr/bin/env node
/**
 * @fileoverview The per-component part of `pnpm size`: bundles every icon component as a
 * consumer imports it and checks it against the budgets of the specification, and that its
 * bundle leaves the sibling drawings out. A thin entry over
 * `src/pipeline/cli-component-size.ts`.
 *
 * Unlike `check-size.mjs` it runs a development dependency, esbuild, the bundler tsup already
 * builds `dist/` with; it bundles in memory and writes no file.
 * @layer scripts
 *
 * Usage: node scripts/check-component-size.mjs
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runComponentSize } from '../src/pipeline/cli-component-size.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// The React Native components are not bundled here: their entries import `react-native-svg`,
// which the in-memory bundle cannot resolve to anything measurable without a Metro build, and
// the budgets of the native entries are still to be set. `check-size.mjs` prints their size.
console.log('Native components: skipped, see the report-only rows of check-size.mjs.')
process.exitCode = await runComponentSize(root, console)
