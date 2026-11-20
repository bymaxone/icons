/**
 * Pins `scripts/consumer-probe.mjs` and the rule behind it: a probe that lists data growing with
 * the icon set runs from a file, never as an `-e` argument. Linux refuses one argument past
 * 131,072 bytes (E2BIG) and macOS has no such cap, so a probe inlining the real component list
 * (163,383 bytes) would pass locally and fail on Linux.
 *
 * Layer: repository tooling, tests. The helper is an ES module, so each case runs it in a child
 * process the way the gates do.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const SCRIPTS = resolve(__dirname, '..', 'scripts')
const MODULE = resolve(SCRIPTS, 'consumer-probe.mjs')
const LINUX_ARG_LIMIT = 131_072

/** Evaluates `body` in a module that has imported the helper, and returns its printed JSON. */
function evaluate(body: string): unknown {
  const program = `import * as probe from ${JSON.stringify(MODULE)}\n${body}`
  const run = spawnSync('node', ['--input-type=module', '-e', program], { encoding: 'utf8' })
  return JSON.parse(run.stdout)
}

describe('probeArguments', () => {
  it('carries the flags and the file name and never the source', () => {
    // Scenario: the command line of a probe is node, its flags and one file name.
    expect(evaluate(`console.log(JSON.stringify(probe.probeArguments('p.mjs', ['--x'])))`)).toEqual(
      ['--x', 'p.mjs']
    )
  })

  it('defaults to no flags', () => {
    // Scenario: a probe with no flags is just its file.
    expect(evaluate(`console.log(JSON.stringify(probe.probeArguments('p.cjs')))`)).toEqual([
      'p.cjs'
    ])
  })
})

describe('runProbe', () => {
  const dirs: string[] = []
  afterAll(() => dirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })))

  /** Runs a probe whose source is `size` bytes, and returns what it printed and its status. */
  function runOfSize(size: number): { status: number; stdout: string; argBytes: number } {
    const dir = mkdtempSync(join(tmpdir(), 'consumer-probe-spec-'))
    dirs.push(dir)
    const body = `
      const source = 'const data = [' + '1,'.repeat(${size}) + '1]\\nconsole.log(data.length)'
      const run = probe.runProbe(${JSON.stringify(dir)}, 'big.mjs', source)
      const args = probe.probeArguments('big.mjs')
      console.log(JSON.stringify({ status: run.status, stdout: run.stdout, argBytes: Math.max(...args.map((a) => Buffer.byteLength(a))) }))`
    return evaluate(body) as { status: number; stdout: string; argBytes: number }
  }

  it('runs a probe whose source is past the Linux argument limit, from a file', () => {
    // Scenario: the real component list was 163,383 bytes. A source twice that runs, and the
    // longest argument on the command line is the file name, far under the limit.
    const outcome = runOfSize(LINUX_ARG_LIMIT)
    expect(outcome.status).toBe(0)
    expect(outcome.stdout.trim()).toBe(String(LINUX_ARG_LIMIT + 1))
    expect(outcome.argBytes).toBeLessThan(LINUX_ARG_LIMIT)
  })

  it('exports the limit it guards against', () => {
    // Scenario: the constant the helper documents is the kernel's.
    expect(evaluate(`console.log(probe.MAX_ARG_BYTES)`)).toBe(LINUX_ARG_LIMIT)
  })
})

describe('describeFailure', () => {
  it('names the status, the signal, the spawn error and the stderr', () => {
    // Scenario: a run that never started has a null status.
    expect(
      evaluate(
        `console.log(JSON.stringify(probe.describeFailure({ status: null, signal: null, error: { code: 'E2BIG' }, stderr: undefined })))`
      )
    ).toBe('code null, signal null, error E2BIG: (no stderr)')
  })

  it('reads the code of an error that carries it, as execFileSync throws it', () => {
    // Scenario: a thrown error has `code` on itself and a trimmed stderr.
    expect(
      evaluate(
        `console.log(JSON.stringify(probe.describeFailure({ status: 5, signal: 'SIGTERM', code: 'ETIMEDOUT', stderr: 'boom\\n' })))`
      )
    ).toBe('code 5, signal SIGTERM, error ETIMEDOUT: boom')
  })
})

describe('the scripts', () => {
  it('never pass a probe as an `-e` argument', () => {
    // Scenario: the family sweep. Only the fixture gate's constant one-line delete may run `node -e`,
    // because it carries no data that grows with the set.
    const offenders = readdirSync(SCRIPTS)
      .filter((file) => file.endsWith('.mjs') && file !== 'check-fixture-package.mjs')
      .filter((file) =>
        /['"]node['"][^;]{0,200}['"]-e['"]|--input-type/.test(
          readFileSync(join(SCRIPTS, file), 'utf8')
        )
      )
    expect(offenders).toEqual([])
  })
})
