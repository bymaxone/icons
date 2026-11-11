#!/usr/bin/env node
/**
 * @fileoverview The publish half of the pull-request icon preview. A thin entry over
 * `src/pipeline/cli-preview-publish.ts`; see `.github/workflows/icons-preview*.yml`.
 * @layer scripts
 */

import { runPreviewPublish } from '../src/pipeline/cli-preview-publish.ts'

process.exitCode = await runPreviewPublish(process.argv.slice(2), process.env, console)
