#!/usr/bin/env node
/**
 * @fileoverview `pnpm family-sheet`: renders every drawing, grouped by category, at 48, 24 and 16 px
 * on the light and dark pages, outlining the batch under review. A thin entry over
 * `src/pipeline/cli-visual.ts`.
 * @layer scripts
 *
 * Usage: node scripts/family-sheet.mjs [--icons <dir>] [--highlight <a,b>] [--out <file>]
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runFamilySheet } from '../src/pipeline/cli-visual.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
process.exitCode = runFamilySheet(process.argv.slice(2), root, console)
