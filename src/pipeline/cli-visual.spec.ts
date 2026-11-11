/**
 * Unit tests for the visual commands.
 *
 * Layer: unit, against scratch copies of the repository layout on disk.
 * Goal: pin the exit code, the output and the files of `runSimilarity`, `runVisual` and
 * `runFamilySheet`, including the failure paths.
 * Mocks: the similarity references are injected; the real third-party sets are never read.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  CIRCLE,
  brandMeta,
  drawing,
  iconMeta,
  removeScratch,
  scratchRepository
} from './__tests__/support.ts'
import type { Output } from './cli.ts'
import { CALIBRATION_PATH, runFamilySheet, runSimilarity, runVisual } from './cli-visual.ts'
import { calibrationMarkdown, calibrationPairs } from './similarity-calibration.ts'
import { loadReferences } from './similarity.ts'
import type { Reference } from './similarity.ts'
import { decodePng, encodePng, renderStrip, visualTargets } from './visual.ts'
import { lintSources } from './lint.ts'
import { readSources } from './sources.ts'

/** An output that records every line. */
function capture(): Output & { logs: string[]; errors: string[] } {
  const logs: string[] = []
  const errors: string[] = []
  return { logs, errors, log: (line) => logs.push(line), error: (line) => errors.push(line) }
}

const PLUS = '<path d="M12 5v14M5 12h14"/>'
const ZIGZAG = '<path d="M3 20l5-16 4 12 4-12 5 16"/>'
const svgOf = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${body}</svg>`

/** A scratch repository with three icons: a circle, a plus and a zigzag. */
function threeIcons(extra: Record<string, string> = {}): string {
  return scratchRepository({
    'icons/line/ring.svg': drawing('line', CIRCLE),
    'icons/line/plus.svg': drawing('line', PLUS),
    'icons/line/wave.svg': drawing('line', ZIGZAG),
    'icons/meta/ring.json': iconMeta(),
    'icons/meta/plus.json': iconMeta(),
    'icons/meta/wave.json': iconMeta(),
    ...extra
  })
}

/** A handful of references: a circle and a plus, as one set, built from a temp directory. */
function references(): Reference[] {
  const directory = mkdtempSync(join(tmpdir(), 'bymax-refs-'))
  try {
    mkdirSync(join(directory, 'lucide'))
    writeFileSync(join(directory, 'lucide', 'circle.svg'), svgOf(CIRCLE))
    writeFileSync(join(directory, 'lucide', 'plus.svg'), svgOf(PLUS))
    return loadReferences(directory, [{ name: 'lucide', directory: 'lucide', paint: 'stroke' }])
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

/** Every file of a scratch repository's baselines, by relative path. */
const baseline = (root: string, file: string): string => join(root, 'visual', file)

describe('runSimilarity', () => {
  let root: string

  afterEach(() => removeScratch(root))

  it('writes the report and the sheet under reports/similarity and flags without failing', () => {
    /**
     * Scenario: a circle and a plus match references and are flagged (the plus as a
     * primitive); the zigzag is clear. The exit code is still 0.
     */
    root = threeIcons()
    const output = capture()
    expect(runSimilarity([], root, output, references)).toBe(0)
    const directory = join(root, 'reports', 'similarity')
    expect(output.errors).toStrictEqual([])
    expect(output.logs).toStrictEqual([
      'flagged: plus (line) (primitive)',
      'flagged: ring (line)',
      `compared 3 drawing(s); 2 flagged; wrote ${directory}`
    ])
    const report = readFileSync(join(directory, 'report.md'), 'utf8')
    expect(report).toContain('| ring (line) | **flagged, review** | lucide/circle')
    expect(report).toContain('| wave (line) | clear |')
    expect(readFileSync(join(directory, 'sheet.png')).subarray(1, 4).toString()).toBe('PNG')
  })

  it('compares only the icons named by --names, and writes to --out', () => {
    /**
     * Scenario: a batch is checked alone, into a directory of the author's choosing.
     */
    root = threeIcons()
    const output = capture()
    expect(
      runSimilarity(['--names', 'wave,plus', '--out', 'b0/similarity'], root, output, references)
    ).toBe(0)
    const directory = join(root, 'b0', 'similarity')
    expect(output.logs).toStrictEqual([
      'flagged: plus (line) (primitive)',
      `compared 2 drawing(s); 1 flagged; wrote ${directory}`
    ])
    expect(existsSync(join(directory, 'report.md'))).toBe(true)
    expect(existsSync(join(root, 'reports'))).toBe(false)
  })

  it('reads a flag by its own position, not by the first argument', () => {
    /**
     * Scenario: with --names absent the first argument is not its value, and --names in
     * second place is still read.
     */
    root = threeIcons()
    const absent = capture()
    expect(runSimilarity(['--out', 'o1'], root, absent, references)).toBe(0)
    expect(absent.logs.at(-1)).toContain('compared 3 drawing(s)')
    const second = capture()
    expect(
      runSimilarity(['--quiet', '--names', 'wave', '--out', 'o2'], root, second, references)
    ).toBe(0)
    expect(second.logs.at(-1)).toContain('compared 1 drawing(s)')
  })

  it('writes the calibration instead with --calibrate, without linting', () => {
    /**
     * Scenario: the calibration needs only the references; it is written to
     * docs/similarity/calibration.md, creating the directory, and the sources are not read.
     */
    root = scratchRepository()
    const output = capture()
    const refs = references()
    expect(runSimilarity(['--calibrate'], root, output, () => refs)).toBe(0)
    const file = join(root, CALIBRATION_PATH)
    expect(CALIBRATION_PATH).toBe(join('docs', 'similarity', 'calibration.md'))
    expect(output.logs).toStrictEqual([`wrote ${file}`])
    expect(readFileSync(file, 'utf8')).toBe(calibrationMarkdown(calibrationPairs(refs)))
    expect(existsSync(join(root, 'reports'))).toBe(false)
  })

  it('reads the reference sets from node_modules when no loader is given', () => {
    /**
     * Scenario: the default loader reads the four sets under the repository root.
     */
    const dirs = [
      'node_modules/lucide-static/icons',
      'node_modules/@tabler/icons/icons/outline',
      'node_modules/@phosphor-icons/core/assets/regular',
      'node_modules/heroicons/24/outline'
    ]
    root = scratchRepository(
      Object.fromEntries(dirs.map((dir) => [`${dir}/circle.svg`, svgOf(CIRCLE)]))
    )
    const output = capture()
    expect(runSimilarity(['--calibrate'], root, output)).toBe(0)
    const written = readFileSync(join(root, CALIBRATION_PATH), 'utf8')
    expect(written).toBe(calibrationMarkdown(calibrationPairs(loadReferences(root))))
    expect(written).toContain('Related sets')
  })

  it('does not load the references when the lint finds an issue', () => {
    /**
     * Scenario: a failed lint is exit 1, prints the issues, and writes nothing.
     */
    root = scratchRepository({ 'icons/line/ring.svg': drawing('line', CIRCLE) })
    const output = capture()
    const load = jest.fn(() => [])
    expect(runSimilarity([], root, output, load)).toBe(1)
    expect(output.errors.length).toBeGreaterThan(0)
    expect(load).not.toHaveBeenCalled()
    expect(existsSync(join(root, 'reports'))).toBe(false)
  })
})

describe('runVisual', () => {
  let root: string

  afterEach(() => removeScratch(root))

  /** The targets of a scratch repository. */
  const targetsOf = (path: string): ReturnType<typeof visualTargets> =>
    visualTargets(lintSources(readSources({ root: path, icons: 'icons' })).set)

  it('reports a drawing with no baseline and says how to create it', () => {
    /**
     * Scenario: a new drawing without its baseline fails, naming the file.
     */
    root = scratchRepository({
      'icons/line/ring.svg': drawing('line', CIRCLE),
      'icons/meta/ring.json': iconMeta()
    })
    const output = capture()
    expect(runVisual([], root, output)).toBe(1)
    expect(output.errors).toStrictEqual([
      'visual/line/ring.png: no baseline',
      'Review the differences, then run pnpm check:visual --update and commit them.'
    ])
    expect(output.logs).toStrictEqual([])
  })

  it('writes the baselines with --update, then passes against them', () => {
    /**
     * Scenario: an author creates the baselines; a second run finds every drawing equal
     * to its baseline and writes no report.
     */
    root = threeIcons({
      'icons/brands/acme.svg': drawing('brands', '<path d="M4 4h16v16H4z"/>'),
      'icons/meta/acme.json': brandMeta()
    })
    const update = capture()
    expect(runVisual(['--update'], root, update)).toBe(0)
    expect(update.logs).toStrictEqual(['wrote 4 baseline(s); removed 0'])
    for (const file of ['line/ring.png', 'line/plus.png', 'line/wave.png', 'brands/acme.png']) {
      expect(readFileSync(baseline(root, file)).subarray(1, 4).toString()).toBe('PNG')
    }
    const check = capture()
    expect(runVisual([], root, check)).toBe(0)
    expect(check.errors).toStrictEqual([])
    expect(check.logs).toStrictEqual(['the 4 drawing(s) match their baselines'])
    expect(existsSync(join(root, 'reports'))).toBe(false)
  })

  it('writes a baseline that decodes to the drawing strip', () => {
    /**
     * Scenario: the committed file is exactly the strip of the drawing.
     */
    root = scratchRepository({
      'icons/line/ring.svg': drawing('line', CIRCLE),
      'icons/meta/ring.json': iconMeta()
    })
    runVisual(['--update'], root, capture())
    const [target] = targetsOf(root)
    const written = decodePng(readFileSync(baseline(root, 'line/ring.png')))
    expect(Array.from(written.pixels)).toStrictEqual(
      Array.from(renderStrip(target ?? { label: '', kind: 'line', elements: [] }).pixels)
    )
  })

  it('fails on a changed drawing and writes the difference image', () => {
    /**
     * Scenario: the drawing changes without its baseline; the check fails, counts the
     * changed pixels, and writes the three-panel difference under reports/visual.
     */
    root = threeIcons()
    runVisual(['--update'], root, capture())
    writeFileSync(
      join(root, 'icons/line/ring.svg'),
      drawing('line', '<circle cx="12" cy="12" r="5"/>')
    )
    const output = capture()
    expect(runVisual([], root, output)).toBe(1)
    const report = join(root, 'reports', 'visual', 'line', 'ring.png')
    expect(output.errors).toHaveLength(2)
    expect(output.errors[0]).toMatch(
      new RegExp(`^visual/line/ring\\.png: \\d+ pixel\\(s\\) changed; see ${report}$`)
    )
    expect(output.errors[1]).toBe(
      'Review the differences, then run pnpm check:visual --update and commit them.'
    )
    const difference = decodePng(readFileSync(report))
    expect([difference.width, difference.height]).toStrictEqual([448, 56 * 3])
    expect(existsSync(join(root, 'reports', 'visual', 'line', 'plus.png'))).toBe(false)
  })

  it('fails on a baseline of another size, writing a difference that fits both', () => {
    /**
     * Scenario: a baseline that is not a strip of the current size is changed everywhere.
     */
    root = scratchRepository({
      'icons/line/ring.svg': drawing('line', CIRCLE),
      'icons/meta/ring.json': iconMeta()
    })
    mkdirSync(baseline(root, 'line'), { recursive: true })
    writeFileSync(
      baseline(root, 'line/ring.png'),
      encodePng({ width: 2, height: 2, pixels: new Uint8Array(16) })
    )
    const output = capture()
    expect(runVisual([], root, output)).toBe(1)
    expect(output.errors[0]).toContain(`${448 * 56} pixel(s) changed`)
  })

  it('fails on a baseline with no drawing, and --update removes it', () => {
    /**
     * Scenario: a deleted icon leaves its baseline behind; the check names it, and
     * --update deletes it and counts it. Non-PNG files and loose files are left alone.
     */
    root = threeIcons()
    runVisual(['--update'], root, capture())
    mkdirSync(baseline(root, 'brands'), { recursive: true })
    for (const file of ['line/b-gone.png', 'brands/gone.png', 'line/a-gone.png']) {
      writeFileSync(
        baseline(root, file),
        encodePng({ width: 1, height: 1, pixels: new Uint8Array(4) })
      )
    }
    writeFileSync(
      baseline(root, 'line/gone.png'),
      encodePng({ width: 1, height: 1, pixels: new Uint8Array(4) })
    )
    writeFileSync(baseline(root, 'line/notes.txt'), 'keep')
    writeFileSync(baseline(root, 'README.md'), 'keep')
    // The file system may list in any order; list in reverse to prove the names are sorted.
    const fs = jest.requireActual<typeof import('node:fs')>('node:fs')
    const original = fs.readdirSync
    const reversed = jest.spyOn(fs, 'readdirSync').mockImplementation(((
      ...args: Parameters<typeof original>
    ) => {
      const listed = original(...args)
      return Array.isArray(listed) ? [...listed].reverse() : listed
    }) as typeof original)
    const output = capture()
    try {
      expect(runVisual([], root, output)).toBe(1)
    } finally {
      reversed.mockRestore()
    }
    expect(output.errors).toStrictEqual([
      'visual/brands/gone.png: a baseline with no drawing',
      'visual/line/a-gone.png: a baseline with no drawing',
      'visual/line/b-gone.png: a baseline with no drawing',
      'visual/line/gone.png: a baseline with no drawing',
      'Review the differences, then run pnpm check:visual --update and commit them.'
    ])
    const update = capture()
    expect(runVisual(['--update'], root, update)).toBe(0)
    expect(update.logs).toStrictEqual(['wrote 3 baseline(s); removed 4'])
    expect(existsSync(baseline(root, 'line/gone.png'))).toBe(false)
    expect(existsSync(baseline(root, 'line/notes.txt'))).toBe(true)
    expect(existsSync(baseline(root, 'README.md'))).toBe(true)
    expect(existsSync(baseline(root, 'line/ring.png'))).toBe(true)
  })

  it('does not touch the baselines when the lint finds an issue', () => {
    /**
     * Scenario: sources that do not lint are exit 1 for check and for --update alike.
     */
    root = scratchRepository({ 'icons/line/ring.svg': drawing('line', CIRCLE) })
    expect(runVisual([], root, capture())).toBe(1)
    expect(runVisual(['--update'], root, capture())).toBe(1)
    expect(existsSync(join(root, 'visual'))).toBe(false)
  })
})

describe('runFamilySheet', () => {
  let root: string

  afterEach(() => removeScratch(root))

  it('renders reports/family-sheet.png by default and names the drawings', () => {
    /**
     * Scenario: the sheet is written under the ignored reports directory, creating it.
     */
    root = threeIcons()
    const output = capture()
    expect(runFamilySheet([], root, output)).toBe(0)
    const file = join(root, 'reports', 'family-sheet.png')
    expect(output.logs).toStrictEqual([`wrote ${file} (3 drawing(s))`])
    expect(readFileSync(file).subarray(1, 4).toString()).toBe('PNG')
  })

  it('accepts --highlight and --out', () => {
    /**
     * Scenario: the batch under review is outlined, so the sheet differs from the plain
     * one, and it goes to the file named by --out.
     */
    root = threeIcons()
    runFamilySheet([], root, capture())
    const output = capture()
    expect(
      runFamilySheet(['--highlight', 'ring,plus', '--out', 'sheets/b0/family.png'], root, output)
    ).toBe(0)
    const file = join(root, 'sheets', 'b0', 'family.png')
    expect(output.logs).toStrictEqual([`wrote ${file} (3 drawing(s))`])
    expect(readFileSync(file).equals(readFileSync(join(root, 'reports', 'family-sheet.png')))).toBe(
      false
    )
  })

  it('highlights nothing when --highlight is absent, whatever the first argument is', () => {
    /**
     * Scenario: the first argument is not the value of an absent --highlight.
     */
    root = threeIcons()
    runFamilySheet([], root, capture())
    const plain = readFileSync(join(root, 'reports', 'family-sheet.png'))
    runFamilySheet(['ring', '--out', 'other.png'], root, capture())
    expect(readFileSync(join(root, 'other.png')).equals(plain)).toBe(true)
  })

  it('renders nothing when the lint finds an issue', () => {
    /**
     * Scenario: a sheet is evidence for a gate, so it is drawn only from clean sources.
     */
    root = scratchRepository({ 'icons/line/ring.svg': drawing('line', CIRCLE) })
    expect(runFamilySheet([], root, capture())).toBe(1)
    expect(existsSync(join(root, 'reports'))).toBe(false)
  })
})
