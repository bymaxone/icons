#!/usr/bin/env node
/**
 * @fileoverview The build half of the pull-request icon preview. A thin entry over
 * `src/pipeline/cli-preview-build.ts`; see `.github/workflows/icons-preview*.yml`.
 * @layer scripts
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runPreviewBuild } from '../src/pipeline/cli-preview-build.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
process.exitCode = runPreviewBuild(process.argv.slice(2), root, console)
