import { spawnSync } from 'node:child_process'

describe('the test run keeps colour off for the programs a spec spawns', () => {
  // `scripts/jest-no-color.mjs` exists because jest-worker forces colour on in a worker when the parent
  // has a terminal, so a spec that compares a spawned program's output with a literal reads
  // `\x1b[33mtrue\x1b[39m`. Without the global setup this fails under `FORCE_COLOR=1 pnpm test`
  // and in any real terminal, and passes in CI, which has none.
  it('prints a boolean without colour codes, whatever the terminal', () => {
    const run = spawnSync(process.execPath, ['-e', 'console.log(true)'], { encoding: 'utf8' })

    expect(run.stdout).toBe('true\n')
  })
})
