#!/usr/bin/env node
/**
 * @fileoverview `pnpm check:visual`: renders every drawing at 16, 20, 24 and 48 px on the
 * light and dark pages and compares it with its committed baseline under `visual/`;
 * `--update` rewrites the baselines. A thin entry over `src/pipeline/cli-visual.ts`.
 * @layer scripts
 *
 * Usage: node scripts/check-visual.mjs [--icons <dir>] [--update]
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runVisual } from '../src/pipeline/cli-visual.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
process.exitCode = runVisual(process.argv.slice(2), root, console)
