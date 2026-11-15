/**
 * Sweep of the committed repository through the icon lint and the metadata check.
 *
 * Layer: integration, on the repository's own `icons` directory (about 75 s each).
 * Goal: prove that the committed sources and metadata agree with `pnpm lint:icons` and `pnpm check:meta`.
 * Mocks: none.
 * The mutation run skips this file (`jest.stryker.config.ts`): it reads every icon and kills no
 * mutant that the fixture specs of `lint.spec.ts` and `cli-meta-check.spec.ts` do not kill.
 */

import { cpSync } from 'node:fs'
import { join } from 'node:path'

import { REPO_ROOT, removeScratch, scratchRepository } from './__tests__/support.ts'
import type { Output } from './cli.ts'
import { runMetaCheck } from './cli-meta-check.ts'
import { lintSources } from './lint.ts'
import { META_ALLOWLIST, RENAMES_REVIEWED } from './meta-check.ts'
import { readSources } from './sources.ts'

/** An output that records every line. */
function capture(): Output & { logs: string[]; errors: string[] } {
  const logs: string[] = []
  const errors: string[] = []
  return { logs, errors, log: (line) => logs.push(line), error: (line) => errors.push(line) }
}

describe('the repository', () => {
  let root = ''

  afterEach(() => removeScratch(root))

  it('lints clean', () => {
    /** Scenario: the committed sources are clean, so `pnpm lint:icons` starts green. */
    expect(lintSources(readSources({ root: REPO_ROOT, icons: 'icons' })).issues).toStrictEqual([])
  })

  it('passes the metadata check', () => {
    /** Scenario: the committed icons and the committed allowlist agree. */
    root = scratchRepository()
    cpSync(join(REPO_ROOT, 'icons'), join(root, 'icons'), { recursive: true })
    cpSync(join(REPO_ROOT, META_ALLOWLIST), join(root, META_ALLOWLIST), { recursive: true })
    cpSync(join(REPO_ROOT, RENAMES_REVIEWED), join(root, RENAMES_REVIEWED), { recursive: true })
    const output = capture()
    expect(runMetaCheck([], root, output)).toBe(0)
    expect(output.errors).toStrictEqual([])
  })
})
