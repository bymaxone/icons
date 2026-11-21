import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const GATE = resolve(__dirname, '../../scripts/check-size.mjs')

/** Writes a file under `root`, creating its folders. */
function put(root: string, path: string, content: string | Buffer): void {
  const file = join(root, path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
}

/** A small built package: every entry the gate reads, each far under its budget. */
function build(root: string, overrides: Record<string, Buffer> = {}): void {
  const small = 'export {}\n'
  const files = [
    'dist/runtime/index.mjs',
    'dist/index.mjs',
    'dist/brands/index.mjs',
    'dist/flags/index.mjs',
    'dist/meta/index.mjs',
    'dist/native/index.mjs',
    'dist/native/runtime/index.mjs',
    'dist/native/brands/index.mjs',
    'dist/native/flags/index.mjs',
    'dist/native/icons/acorn/index.mjs',
    'dist/native/flags/us-flag/index.mjs'
  ]
  for (const file of files) put(root, file, overrides[file] ?? small)
  put(root, 'dist/metadata.json', JSON.stringify({ icons: { acorn: {} }, brands: {}, flags: {} }))
}

/** Runs the size gate on `root` and returns its exit status and output. */
function gate(root: string): { status: number | null; out: string } {
  const run = spawnSync(process.execPath, [GATE], {
    env: { ...process.env, SIZE_GATE_ROOT: root },
    encoding: 'utf8'
  })
  return { status: run.status, out: run.stdout + run.stderr }
}

describe('the size gate on the React Native entries', () => {
  let root: string
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'size-gate-'))
  })
  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('passes a package whose native entries are inside their budgets', () => {
    // Scenario: every native entry is tiny, so the gate reports each row and passes.
    build(root)
    const run = gate(root)
    expect(run.out).toContain('native/icons/acorn')
    expect(run.out).toContain('native/flags/us-flag')
    expect(run.status).toBe(0)
  })

  it.each([
    ['dist/native/index.mjs', 'native (re-exports)'],
    ['dist/native/runtime/index.mjs', 'native/runtime'],
    ['dist/native/brands/index.mjs', 'native/brands'],
    ['dist/native/flags/index.mjs', 'native/flags (re-exports)'],
    ['dist/native/icons/acorn/index.mjs', 'native/icons/acorn'],
    ['dist/native/flags/us-flag/index.mjs', 'native/flags/us-flag']
  ])('fails when %s is over its budget', (file, row) => {
    // Scenario: 80 KiB of incompressible bytes in one native entry exceeds every native budget.
    build(root, { [file]: randomBytes(80 * 1024) })
    const run = gate(root)
    // The row is read as text, never built into a pattern: it holds parentheses and slashes.
    const failing = run.out.split('\n').some((line) => {
      const cells = line.trimStart()
      return cells.startsWith(row) && /^\s/.test(cells.slice(row.length)) && cells.includes('FAIL')
    })
    expect(failing).toBe(true)
    expect(run.status).toBe(1)
  })
})
