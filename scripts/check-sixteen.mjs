#!/usr/bin/env node
/**
 * @fileoverview `pnpm check:sixteen`: renders the parts of every drawing at 16 px and fails
 * when two of them fuse and that pair is not on `scripts/sixteen-allowlist.json` with a
 * justification. A thin entry over `src/pipeline/cli-sixteen.ts`.
 * @layer scripts
 *
 * Usage: node scripts/check-sixteen.mjs [--icons <dir>]
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runSixteen } from '../src/pipeline/cli-sixteen.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
process.exitCode = runSixteen(process.argv.slice(2), root, console)
