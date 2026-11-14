/**
 * Unit tests for the `check:meta` command.
 *
 * Layer: unit, against scratch copies of the repository layout on disk.
 * Goal: pin the exit code and the output of `runMetaCheck`: a clean set, a record copied from
 * another icon, a placeholder record copied over a new icon, a stale entry, a malformed
 * allowlist, sources that do not lint, brand marks left out and `--icons`.
 * Mocks: none.
 */

import { cpSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  REPO_ROOT,
  brandMeta,
  drawing,
  iconMeta,
  removeScratch,
  scratchRepository,
  CIRCLE
} from './__tests__/support.ts'
import type { Output } from './cli.ts'
import { runMetaCheck } from './cli-meta-check.ts'
import { META_ALLOWLIST, RENAMES_REVIEWED } from './meta-check.ts'

/** An output that records every line. */
function capture(): Output & { logs: string[]; errors: string[] } {
  const logs: string[] = []
  const errors: string[] = []
  return { logs, errors, log: (line) => logs.push(line), error: (line) => errors.push(line) }
}

const allowlist = (labels: unknown): string => JSON.stringify({ labels })

const reviewedManifest = (icons: unknown): string => JSON.stringify({ icons })

/** Two icons with their own labels and use cases, a brand mark, an allowlist and a rename manifest listing nothing. */
function repository(list: string, extra: Record<string, string> = {}, prefix = 'icons'): string {
  return scratchRepository({
    [`${prefix}/line/ring.svg`]: drawing('line', CIRCLE),
    [`${prefix}/line/disc.svg`]: drawing('line', CIRCLE),
    [`${prefix}/brands/acme.svg`]: drawing('brands', '<path d="M4 4h16v16H4z"/>'),
    [`${prefix}/meta/ring.json`]: iconMeta(),
    [`${prefix}/meta/disc.json`]: iconMeta({
      label: 'Disc',
      useCases: ['Other use', 'Another use']
    }),
    [`${prefix}/meta/acme.json`]: brandMeta(),
    [META_ALLOWLIST]: list,
    [RENAMES_REVIEWED]: reviewedManifest({}),
    ...extra
  })
}

describe('runMetaCheck', () => {
  let root: string

  afterEach(() => removeScratch(root))

  it('passes a set whose records are their own, and says how many', () => {
    /** Scenario: two icons differ and the brand mark has no label, which is not read. */
    root = repository(allowlist({}))
    const output = capture()
    expect(runMetaCheck([], root, output)).toBe(0)
    expect(output.errors).toStrictEqual([])
    expect(output.logs).toStrictEqual([
      '2 icon record(s) checked; labels and use cases are their own'
    ])
  })

  it('fails when a new icon carries the record of `plus`', () => {
    /** Scenario: `plus.json` is copied over `motorbike.json`; `plus` and `plus-circle` are listed. */
    const plus = JSON.stringify({
      ...JSON.parse(readFileSync(join(REPO_ROOT, 'icons/meta/plus.json'), 'utf8')),
      variants: ['line'],
      opticalSizes: [24]
    })
    root = repository(allowlist({ Add: { icons: ['ring', 'disc'], why: 'drawn two ways' } }), {
      'icons/line/motorbike.svg': drawing('line', CIRCLE),
      'icons/meta/motorbike.json': plus,
      'icons/meta/ring.json': iconMeta({
        label: 'Add',
        useCases: ['First use', 'Second use']
      }),
      'icons/meta/disc.json': iconMeta({ label: 'Add', useCases: ['Other use', 'Another use'] })
    })
    const output = capture()
    expect(runMetaCheck([], root, output)).toBe(1)
    expect(output.errors).toStrictEqual([
      'motorbike: label "Add" is shared with disc, ring. Give it its own label, or list the group in scripts/meta-allowlist.json with a justification.',
      '1 metadata problem(s).'
    ])
    expect(output.logs).toStrictEqual([])
  })

  it('fails on a placeholder label, repeated use cases and a stale entry together', () => {
    /** Scenario: `ring` is a placeholder and repeats `disc`'s uses, and "Gone" names no shared label. */
    root = repository(allowlist({ Gone: { icons: ['a', 'b'], why: 'x' } }), {
      'icons/meta/ring.json': iconMeta({ label: 'TODO', useCases: ['Other use', 'Another use'] })
    })
    const output = capture()
    expect(runMetaCheck([], root, output)).toBe(1)
    expect(output.errors).toStrictEqual([
      'ring: label "TODO" is a placeholder. Write the label the icon is known by.',
      'label "Gone": on the allowlist but no longer shared. Remove its entry.',
      'disc: useCases are identical to those of ring. Write use cases that fit this icon.',
      'ring: useCases are identical to those of disc. Write use cases that fit this icon.',
      '4 metadata problem(s).'
    ])
  })

  it('reads the icons directory given by --icons', () => {
    /** Scenario: the sources live under `fixtures/icons`, not `icons`. */
    root = repository(allowlist({}), {}, 'fixtures/icons')
    const output = capture()
    expect(runMetaCheck(['--icons', 'fixtures/icons'], root, output)).toBe(0)
    expect(output.logs).toHaveLength(1)
  })

  it('stops on sources that do not lint, before reading the allowlist', () => {
    /** Scenario: a drawing has no metadata, so the lint fails. */
    root = scratchRepository({ 'icons/line/orphan.svg': drawing('line', CIRCLE) })
    const output = capture()
    expect(runMetaCheck([], root, output)).toBe(1)
    expect(output.errors.at(-1)).toMatch(/icon lint issue\(s\)\.$/)
  })

  it('passes on the repository itself', () => {
    /** Scenario: the committed icons and the committed allowlist agree. */
    root = scratchRepository()
    cpSync(join(REPO_ROOT, 'icons'), join(root, 'icons'), { recursive: true })
    cpSync(join(REPO_ROOT, META_ALLOWLIST), join(root, META_ALLOWLIST), { recursive: true })
    cpSync(join(REPO_ROOT, RENAMES_REVIEWED), join(root, RENAMES_REVIEWED), { recursive: true })
    const output = capture()
    expect(runMetaCheck([], root, output)).toBe(0)
    expect(output.errors).toStrictEqual([])
  })

  it.each([
    ['an array', '[]'],
    ['null', 'null'],
    ['no labels table', '{}'],
    ['labels as an array', allowlist([])],
    ['labels as null', allowlist(null)],
    ['labels as a string', allowlist('Add')],
    ['an entry that is a string', allowlist({ Add: 'x' })],
    ['an entry that is null', allowlist({ Add: null })],
    ['an entry without icons', allowlist({ Add: { why: 'x' } })],
    ['icons that are not a list', allowlist({ Add: { icons: 'a', why: 'x' } })],
    ['an icon that is not text', allowlist({ Add: { icons: [1], why: 'x' } })],
    ['one icon in two that is not text', allowlist({ Add: { icons: ['a', 1], why: 'x' } })],
    ['a justification that is not text', allowlist({ Add: { icons: ['a', 'b'], why: 3 } })],
    ['an entry without a justification', allowlist({ Add: { icons: ['a', 'b'] } })]
  ])('rejects an allowlist that is %s', (_label, text) => {
    /** Scenario: the file does not have the shape `{ "labels": { "<label>": { "icons", "why" } } }`. */
    root = repository(text)
    expect(() => runMetaCheck([], root, capture())).toThrow(
      'scripts/meta-allowlist.json: expected { "labels": { "<label>": { "icons": ["<name>"], "why": "<justification>" } } }'
    )
  })

  it('fails a renamed icon that is not in the review manifest, and a British spelling', () => {
    /** Scenario: `ring` holds a deprecated "Renamed to" alias and a British tag; nothing is reviewed. */
    root = repository(allowlist({}), {
      'icons/meta/ring.json': iconMeta({
        tags: ['colour'],
        aliases: [
          {
            name: 'old-ring',
            deprecated: true,
            deprecationReason: 'Renamed to ring, the object.',
            toBeRemovedInVersion: '2.0.0'
          }
        ]
      })
    })
    const output = capture()
    expect(runMetaCheck([], root, output)).toBe(1)
    expect(output.errors).toStrictEqual([
      'ring: renamed, but its categories were not reviewed against the drawing. Check them, then list the icon in scripts/renames-reviewed.json with the verdict.',
      `ring: tag "colour": 'colour' is British; write 'color'.`,
      '2 metadata problem(s).'
    ])
  })

  it.each([
    ['an array', '[]'],
    ['null', 'null'],
    ['no icons table', '{}'],
    ['icons as an array', reviewedManifest([])],
    ['icons as null', reviewedManifest(null)],
    ['icons as a string', reviewedManifest('ring')],
    ['a verdict that is not text', reviewedManifest({ ring: 3 })]
  ])('rejects a rename manifest that is %s', (_label, text) => {
    /** Scenario: the file does not have the shape `{ "icons": { "<name>": "<verdict>" } }`. */
    root = repository(allowlist({}), { [RENAMES_REVIEWED]: text })
    expect(() => runMetaCheck([], root, capture())).toThrow(
      'scripts/renames-reviewed.json: expected { "icons": { "<name>": "<verdict on its categories>" } }'
    )
  })
})
