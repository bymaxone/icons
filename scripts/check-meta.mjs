#!/usr/bin/env node
/**
 * @fileoverview `pnpm check:meta`: reads the label and use cases of every icon and fails on a
 * placeholder label, on a label two icons share that is not a justified group of
 * `scripts/meta-allowlist.json`, and on empty or repeated use cases. A thin entry over
 * `src/pipeline/cli-meta-check.ts`.
 * @layer scripts
 *
 * Usage: node scripts/check-meta.mjs [--icons <dir>]
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runMetaCheck } from '../src/pipeline/cli-meta-check.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
process.exitCode = runMetaCheck(process.argv.slice(2), root, console)
