#!/usr/bin/env node
/**
 * @fileoverview `pnpm check:redraws`: a pull request may change an existing drawing or its
 * visual baseline only when a redraw manifest under `docs/redraws/` names it. A thin entry
 * over `src/pipeline/cli-redraws.ts`.
 * @layer scripts
 *
 * Usage: node scripts/check-redraws.mjs [--base <ref>]
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runRedraws } from '../src/pipeline/cli-redraws.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
process.exitCode = runRedraws(
  process.argv.slice(2),
  root,
  console,
  (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }),
  (path) => readFileSync(path, 'utf8')
)
