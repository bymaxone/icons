/**
 * Unit tests for the commands behind the scripts.
 *
 * Layer: integration, on scratch repositories.
 * Goal: prove `pnpm generate` formats the sources and writes the modules only from a
 * clean lint, `--check` fails on a stale copy and writes nothing, `--static` writes the
 * build's static outputs, `pnpm lint:icons` and `pnpm contact-sheet` report and exit as
 * documented, and `--icons` and `--out` are honoured.
 * Mocks: none; output is captured through the `Output` the commands take.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { CIRCLE, drawing, iconMeta, removeScratch, scratchRepository } from './__tests__/support.ts'
import { runContactSheet, runGenerate, runLint } from './cli.ts'
import type { Output } from './cli.ts'

/** An output that records every line. */
function capture(): Output & { logs: string[]; errors: string[] } {
  const logs: string[] = []
  const errors: string[] = []
  return { logs, errors, log: (line) => logs.push(line), error: (line) => errors.push(line) }
}

const UNFORMATTED = `<svg>${CIRCLE}</svg>`

describe('runGenerate', () => {
  let root: string

  afterEach(() => removeScratch(root))

  it('formats the sources, then writes every generated module', async () => {
    /**
     * Scenario: an author adds an SVG and its metadata and runs `pnpm generate`: the SVG
     * gets its root attributes, and the modules of the new icon are written.
     */
    root = scratchRepository({
      'icons/line/ring.svg': UNFORMATTED,
      'icons/meta/ring.json': iconMeta()
    })
    const output = capture()
    expect(await runGenerate([], root, output)).toBe(0)
    expect(output.errors).toStrictEqual([])
    expect(output.logs).toStrictEqual([
      'formatted icons/line/ring.svg',
      'generated 6 module(s) from 1 icon(s), 0 brand(s) and 0 flag(s)'
    ])
    expect(readFileSync(join(root, 'icons/line/ring.svg'), 'utf8')).toBe(drawing('line', CIRCLE))
    expect(readFileSync(join(root, 'src/icons/generated/ring/line.ts'), 'utf8')).toContain(
      "createIcon('ring'"
    )
  })

  it('writes nothing when the lint finds an issue, and prints every issue', async () => {
    /**
     * Scenario: a drawing with no metadata never reaches the outputs; the command fails
     * and says why.
     */
    root = scratchRepository({ 'icons/line/ring.svg': drawing('line', CIRCLE) })
    const output = capture()
    expect(await runGenerate([], root, output)).toBe(1)
    expect(output.errors).toStrictEqual([
      'icons/line/ring.svg: [meta-pair] no metadata file icons/meta/ring.json',
      '1 icon lint issue(s).'
    ])
    expect(existsSync(join(root, 'src'))).toBe(false)
  })

  it('reads another icons directory with --icons', async () => {
    /**
     * Scenario: the fixture build generates from `fixtures/icons`.
     */
    root = scratchRepository({
      'fixtures/icons/line/ring.svg': drawing('line', CIRCLE),
      'fixtures/icons/meta/ring.json': iconMeta()
    })
    const output = capture()
    expect(await runGenerate(['--icons', 'fixtures/icons'], root, output)).toBe(0)
    expect(output.logs).toStrictEqual([
      'generated 6 module(s) from 1 icon(s), 0 brand(s) and 0 flag(s)'
    ])
  })

  it('passes --check when the committed modules are current, writing nothing', async () => {
    /**
     * Scenario: CI regenerates and compares; an unchanged repository passes.
     */
    root = scratchRepository({
      'icons/line/ring.svg': drawing('line', CIRCLE),
      'icons/meta/ring.json': iconMeta()
    })
    await runGenerate([], root, capture())
    const output = capture()
    expect(await runGenerate(['--check'], root, output)).toBe(0)
    expect(output.logs).toStrictEqual(['the 6 generated module(s) match the sources'])
    expect(output.errors).toStrictEqual([])
  })

  it('fails --check on a stale module and leaves it as it is', async () => {
    /**
     * Scenario: a hand edit under src/icons/generated, or a source change committed
     * without `pnpm generate`, fails the stale-copy check.
     */
    root = scratchRepository({
      'icons/line/ring.svg': drawing('line', CIRCLE),
      'icons/meta/ring.json': iconMeta()
    })
    await runGenerate([], root, capture())
    const module = join(root, 'src/icons/generated/ring/line.ts')
    writeFileSync(module, 'edited by hand\n')
    const output = capture()
    expect(await runGenerate(['--check'], root, output)).toBe(1)
    expect(output.errors).toStrictEqual([
      'src/icons/generated/ring/line.ts: out of date',
      'The generated modules are not what the sources produce: run pnpm generate and commit the result.'
    ])
    expect(readFileSync(module, 'utf8')).toBe('edited by hand\n')
  })

  it('does not format the sources under --check, so an unformatted source fails', async () => {
    /**
     * Scenario: CI never rewrites a source; a committed file that is not normalised is
     * reported, and stays as committed.
     */
    root = scratchRepository({
      'icons/line/ring.svg': UNFORMATTED,
      'icons/meta/ring.json': iconMeta()
    })
    const output = capture()
    expect(await runGenerate(['--check'], root, output)).toBe(1)
    expect(output.errors[0]).toBe(
      'icons/line/ring.svg: [svg-normalised] the file is not normalised: run pnpm generate'
    )
    expect(readFileSync(join(root, 'icons/line/ring.svg'), 'utf8')).toBe(UNFORMATTED)
  })

  it('writes the static outputs into dist, or --out, without formatting the sources', async () => {
    /**
     * Scenario: `pnpm build` writes the raw SVGs, the sprite and metadata.json after tsup,
     * from the sources as committed.
     */
    root = scratchRepository({
      'icons/line/ring.svg': drawing('line', CIRCLE),
      'icons/meta/ring.json': iconMeta()
    })
    const output = capture()
    expect(await runGenerate(['--static'], root, output)).toBe(0)
    expect(output.logs).toStrictEqual(['wrote 3 static file(s)'])
    expect(existsSync(join(root, 'dist/sprite.svg'))).toBe(true)
    expect(existsSync(join(root, 'src'))).toBe(false)
    expect(await runGenerate(['--static', '--out', 'elsewhere'], root, capture())).toBe(0)
    expect(existsSync(join(root, 'elsewhere/metadata.json'))).toBe(true)
  })

  it('fails --static on a lint issue', async () => {
    /**
     * Scenario: a build never ships outputs from sources that fail the lint.
     */
    root = scratchRepository({
      'icons/line/ring.svg': UNFORMATTED,
      'icons/meta/ring.json': iconMeta()
    })
    expect(await runGenerate(['--static'], root, capture())).toBe(1)
    expect(existsSync(join(root, 'dist'))).toBe(false)
  })

  it('treats an option given without its value as absent', async () => {
    /**
     * Scenario: a trailing `--icons` or `--out` falls back to the default directory.
     */
    root = scratchRepository({
      'icons/line/ring.svg': drawing('line', CIRCLE),
      'icons/meta/ring.json': iconMeta()
    })
    expect(await runGenerate(['--static', '--icons'], root, capture())).toBe(0)
    expect(await runGenerate(['--static', '--out'], root, capture())).toBe(0)
    expect(existsSync(join(root, 'dist/svg/line/ring.svg'))).toBe(true)
  })
})

describe('runLint', () => {
  let root: string

  afterEach(() => removeScratch(root))

  it('reports a clean set with its counts', () => {
    /**
     * Scenario: `pnpm lint:icons` exits 0 and says what it checked.
     */
    root = scratchRepository({
      'icons/line/ring.svg': drawing('line', CIRCLE),
      'icons/meta/ring.json': iconMeta()
    })
    const output = capture()
    expect(runLint([], root, output)).toBe(0)
    expect(output.logs).toStrictEqual(['icon lint: 1 icon(s), 0 brand(s) and 0 flag(s), no issue'])
  })

  it('fails with every issue and writes nothing', () => {
    /**
     * Scenario: the lint never rewrites a source, even one the formatter would fix.
     */
    root = scratchRepository({
      'icons/line/ring.svg': UNFORMATTED,
      'icons/meta/ring.json': iconMeta()
    })
    const output = capture()
    expect(runLint([], root, output)).toBe(1)
    expect(output.errors).toStrictEqual([
      'icons/line/ring.svg: [svg-normalised] the file is not normalised: run pnpm generate',
      'icons/line/ring.svg: [svg-root] root attribute xmlns must be "http://www.w3.org/2000/svg"',
      'icons/line/ring.svg: [svg-root] root attribute width must be "24"',
      'icons/line/ring.svg: [svg-root] root attribute height must be "24"',
      'icons/line/ring.svg: [svg-root] root attribute viewBox must be "0 0 24 24"',
      'icons/line/ring.svg: [svg-root] root attribute fill must be "none"',
      'icons/line/ring.svg: [svg-root] root attribute stroke must be "currentColor"',
      'icons/line/ring.svg: [svg-root] root attribute stroke-width must be "1.5"',
      'icons/line/ring.svg: [svg-root] root attribute stroke-linecap must be "round"',
      'icons/line/ring.svg: [svg-root] root attribute stroke-linejoin must be "round"',
      '10 icon lint issue(s).'
    ])
    expect(output.logs).toStrictEqual([])
    expect(readFileSync(join(root, 'icons/line/ring.svg'), 'utf8')).toBe(UNFORMATTED)
  })
})

describe('runContactSheet', () => {
  let root: string

  afterEach(() => removeScratch(root))

  it('renders reports/contact-sheet.png by default, or --out', () => {
    /**
     * Scenario: `pnpm contact-sheet` writes the review sheet under the ignored reports
     * directory, creating it, and names the file and the number of drawings.
     */
    root = scratchRepository({
      'icons/line/ring.svg': drawing('line', CIRCLE),
      'icons/meta/ring.json': iconMeta()
    })
    const output = capture()
    expect(runContactSheet([], root, output)).toBe(0)
    const file = join(root, 'reports', 'contact-sheet.png')
    expect(output.logs).toStrictEqual([`wrote ${file} (1 drawing(s))`])
    expect(readFileSync(file).subarray(1, 4).toString()).toBe('PNG')
    expect(runContactSheet(['--out', 'sheets/b0/sheet.png'], root, capture())).toBe(0)
    expect(existsSync(join(root, 'sheets', 'b0', 'sheet.png'))).toBe(true)
  })

  it('renders nothing when the lint finds an issue', () => {
    /**
     * Scenario: a sheet is evidence for a gate, so it is drawn only from clean sources.
     */
    root = scratchRepository({ 'icons/line/ring.svg': drawing('line', CIRCLE) })
    expect(runContactSheet([], root, capture())).toBe(1)
    expect(existsSync(join(root, 'reports'))).toBe(false)
  })
})
