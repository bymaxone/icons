#!/usr/bin/env node
/**
 * @fileoverview `pnpm similarity`: compares every drawing with Lucide, Tabler, Phosphor and
 * Heroicons, and writes a report and a sheet of the nearest matches under `reports/`. With
 * `--calibrate`, writes the threshold calibration to `docs/similarity/calibration.md`.
 * A thin entry over `src/pipeline/cli-visual.ts`.
 * @layer scripts
 *
 * Usage: node scripts/similarity.mjs [--icons <dir>] [--names <a,b>] [--out <dir>] [--calibrate]
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runSimilarity } from '../src/pipeline/cli-visual.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
process.exitCode = runSimilarity(process.argv.slice(2), root, console)
