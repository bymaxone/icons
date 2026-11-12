/**
 * Unit tests for the `check:sixteen` command.
 *
 * Layer: unit, against scratch copies of the repository layout on disk.
 * Goal: pin the exit code and the output of `runSixteen`: a clean set, an unlisted fusion,
 * the stale, unknown and unjustified allowlist entries, a malformed allowlist, sources that do
 * not lint, and `--icons`.
 * Mocks: none.
 */

import { drawing, iconMeta, removeScratch, scratchRepository } from './__tests__/support.ts'
import type { Output } from './cli.ts'
import { ALLOWLIST_PATH, runSixteen } from './cli-sixteen.ts'

/** An output that records every line. */
function capture(): Output & { logs: string[]; errors: string[] } {
  const logs: string[] = []
  const errors: string[] = []
  return { logs, errors, log: (line) => logs.push(line), error: (line) => errors.push(line) }
}

/** Two strokes 1 px apart at 16 px: they abut without touching. */
const FUSED = '<path d="M4 8.25h16"/><path d="M4 9.75h16"/>'
/** Two strokes 8 px apart at 16 px. */
const CLEAN = '<path d="M4 6h16"/><path d="M4 18h16"/>'

const allowlist = (icons: unknown): string => JSON.stringify({ icons })

/** A scratch repository with a fusing icon, a clean one and an allowlist. */
function repository(list: string, prefix = 'icons'): string {
  return scratchRepository({
    [`${prefix}/line/fused.svg`]: drawing('line', FUSED),
    [`${prefix}/line/clean.svg`]: drawing('line', CLEAN),
    [`${prefix}/meta/fused.json`]: iconMeta(),
    [`${prefix}/meta/clean.json`]: iconMeta(),
    [ALLOWLIST_PATH]: list
  })
}

describe('ALLOWLIST_PATH', () => {
  it('is the committed allowlist', () => {
    /** Scenario: the path is the file under scripts the CI and the docs name. */
    expect(ALLOWLIST_PATH).toBe('scripts/sixteen-allowlist.json')
  })
})

describe('runSixteen', () => {
  let root: string

  afterEach(() => removeScratch(root))

  it('passes when every fusion is on the allowlist, and says how many', () => {
    /** Scenario: `fused` fuses and is listed with a reason; `clean` does not. */
    root = repository(allowlist({ fused: 'it still reads' }))
    const output = capture()
    expect(runSixteen([], root, output)).toBe(0)
    expect(output.errors).toStrictEqual([])
    expect(output.logs).toStrictEqual([
      '2 drawing(s) measured at 16 px; 1 fuse, all on the allowlist'
    ])
  })

  it('fails on a fusion that is not listed, naming the icon and the parts', () => {
    /** Scenario: the allowlist is empty. */
    root = repository(allowlist({}))
    const output = capture()
    expect(runSixteen([], root, output)).toBe(1)
    expect(output.errors).toStrictEqual([
      'fused: elements 1 and 2 fuse at 16 px. Redraw it, or list it in scripts/sixteen-allowlist.json with a justification.',
      '1 16 px problem(s).'
    ])
    expect(output.logs).toStrictEqual([])
  })

  it('fails on an entry that no longer fuses', () => {
    /** Scenario: `clean` is listed. */
    root = repository(allowlist({ fused: 'it reads', clean: 'it reads' }))
    const output = capture()
    expect(runSixteen([], root, output)).toBe(1)
    expect(output.errors[0]).toBe(
      'clean: on the allowlist but no longer fuses at 16 px. Remove its entry.'
    )
  })

  it('fails on an entry whose icon is gone, and on one without a justification', () => {
    /** Scenario: `gone` names no icon and `fused` has an empty text. */
    root = repository(allowlist({ fused: '', gone: 'it reads' }))
    const output = capture()
    expect(runSixteen([], root, output)).toBe(1)
    expect(output.errors).toStrictEqual([
      'fused: on the allowlist without a justification.',
      'gone: on the allowlist but there is no such icon. Remove its entry.',
      '2 16 px problem(s).'
    ])
  })

  it('reads the icons directory given by --icons', () => {
    /** Scenario: the drawings live under `fixtures/icons`, not `icons`. */
    root = repository(allowlist({ fused: 'it reads' }), 'fixtures/icons')
    const output = capture()
    expect(runSixteen(['--icons', 'fixtures/icons'], root, output)).toBe(0)
    expect(output.logs).toHaveLength(1)
  })

  it('stops on sources that do not lint, before measuring', () => {
    /** Scenario: a drawing has no metadata, so the lint fails and the allowlist is not read. */
    root = scratchRepository({ 'icons/line/orphan.svg': drawing('line', CLEAN) })
    const output = capture()
    expect(runSixteen([], root, output)).toBe(1)
    expect(output.errors.at(-1)).toMatch(/icon lint issue\(s\)\.$/)
  })

  it.each([
    ['an array', '[]'],
    ['null', 'null'],
    ['no icons table', '{}'],
    ['icons as an array', allowlist([])],
    ['icons as null', allowlist(null)],
    ['icons as a string', allowlist('fused')],
    ['a justification that is not text', allowlist({ fused: 3 })]
  ])('rejects an allowlist that is %s', (_label, text) => {
    /** Scenario: the file does not have the shape `{ "icons": { "<name>": "<text>" } }`. */
    root = repository(text)
    expect(() => runSixteen([], root, capture())).toThrow(
      `${ALLOWLIST_PATH}: expected { "icons": { "<name>": "<justification>" } }`
    )
  })
})
