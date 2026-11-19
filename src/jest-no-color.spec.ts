import { spawnSync } from 'node:child_process'

describe('the test run keeps colour off for the programs a spec spawns', () => {
  // jest-worker forces colour on in a worker when the parent has a terminal, so a spec that
  // compares a spawned program's output with a literal reads `\x1b[33mtrue\x1b[39m`. The Jest
  // configs turn colour off; without that this fails in a terminal and under `FORCE_COLOR=1`
  // whenever Jest uses workers, and passes in CI, which has no terminal.
  it('prints a boolean without colour codes, whatever the terminal', () => {
    const run = spawnSync(process.execPath, ['-e', 'console.log(true)'], { encoding: 'utf8' })

    expect(run.stdout).toBe('true\n')
  })
})
