#!/usr/bin/env node
/**
 * @fileoverview `pnpm lint:icons`: every rule of the icon lint over `icons/`, writing
 * nothing. A thin entry over `src/pipeline/cli.ts`, where the rules live with their specs.
 * @layer scripts
 *
 * Usage: node scripts/lint-icons.mjs [--icons <dir>]
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runLint } from '../src/pipeline/cli.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
process.exitCode = runLint(process.argv.slice(2), root, console)
