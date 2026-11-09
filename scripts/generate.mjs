#!/usr/bin/env node
/**
 * @fileoverview `pnpm generate`, `pnpm check:generated` and the static half of `pnpm build`:
 * a thin entry over `src/pipeline/cli.ts`, where the logic lives with its specs.
 * @layer scripts
 *
 * Node runs the TypeScript directly with its native type stripping (Node 24 enables it by
 * default), so there is no build step and no compiled copy to fall out of date.
 *
 * Usage:
 *   node scripts/generate.mjs                  format the sources, lint, write src/**\/generated
 *   node scripts/generate.mjs --check          fail when src/**\/generated differs from the sources
 *   node scripts/generate.mjs --static         write dist/svg, dist/sprite.svg, dist/metadata.json
 *   ... --icons <dir>                          read another icons directory (fixtures)
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runGenerate } from '../src/pipeline/cli.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
process.exitCode = await runGenerate(process.argv.slice(2), root, console)
