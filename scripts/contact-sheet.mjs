#!/usr/bin/env node
/**
 * @fileoverview `pnpm contact-sheet`: renders every drawing at 16, 20, 24 and 48 px on the
 * light and dark Studio pages, in the ink and the six accents, to a PNG under `reports/`.
 * A thin entry over `src/pipeline/cli.ts`.
 * @layer scripts
 *
 * Usage: node scripts/contact-sheet.mjs [--icons <dir>] [--out <file>]
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runContactSheet } from '../src/pipeline/cli.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
process.exitCode = runContactSheet(process.argv.slice(2), root, console)
