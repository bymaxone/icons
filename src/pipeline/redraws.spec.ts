/**
 * Unit tests for the redraw gate's rules: reading `git diff --name-status`, telling a guarded
 * drawing or baseline from any other file, reading a manifest, and refusing what no manifest
 * names.
 *
 * Layer: unit.
 * Goal: pin which changes the gate refuses, with the case that motivated it: a batch that
 * rewrote existing filled drawings and regenerated their baselines.
 * Mocks: none.
 */

import {
  guardedName,
  manifestNames,
  manifestPaths,
  parseNameStatus,
  unlistedChanges
} from './redraws.ts'

describe('parseNameStatus', () => {
  it('reads each line as its status letter and its paths, skipping blank lines', () => {
    // Scenario: a modification, an addition, a rename with its score, and a blank line.
    expect(
      parseNameStatus('M\ticons/line/home.svg\nA\tdocs/a.md\n\nR087\told.svg\tnew.svg\n')
    ).toStrictEqual([
      { status: 'M', paths: ['icons/line/home.svg'] },
      { status: 'A', paths: ['docs/a.md'] },
      { status: 'R', paths: ['old.svg', 'new.svg'] }
    ])
  })

  it('keeps a line with no path as a change without paths, and skips a line of spaces', () => {
    // Scenario: a malformed line is read, not dropped, so the gate sees it; white space alone
    // is not a change.
    expect(parseNameStatus('M\n   \n')).toStrictEqual([{ status: 'M', paths: [] }])
  })
})

describe('guardedName', () => {
  it('names the icon of a drawing source or a visual baseline in each variant folder', () => {
    // Scenario: every guarded folder, for sources and for baselines.
    expect(guardedName('icons/line/arrow-up.svg')).toBe('arrow-up')
    expect(guardedName('icons/filled/info.svg')).toBe('info')
    expect(guardedName('icons/sm/lock.svg')).toBe('lock')
    expect(guardedName('icons/brands/github.svg')).toBe('github')
    expect(guardedName('visual/line/home.png')).toBe('home')
    expect(guardedName('visual/brands/x.png')).toBe('x')
  })

  it('guards nothing else', () => {
    // Scenario: metadata, generated modules, other folders, other extensions and a path
    // that only contains a guarded one.
    for (const path of [
      'icons/meta/home.json',
      'src/icons/generated/home/line.ts',
      'icons/other/home.svg',
      'icons/line/home.png',
      'visual/line/home.svg',
      'x/icons/line/home.svg',
      'icons/line/Home.svg',
      'icons/line/home.svg.orig',
      'visual/line/home.png.bak'
    ]) {
      expect(guardedName(path)).toBeUndefined()
    }
  })
})

describe('manifestNames', () => {
  it('reads the backticked name that opens each list item', () => {
    // Scenario: dash and star items, indented ones, and lines that are not items.
    const markdown = [
      '# Redraws of B6-A1',
      '',
      '- `home`: the door was widened (auditor, 2026-11-12)',
      '* `lock-open`: the shackle',
      '  - `info`',
      'The `trash` icon is mentioned in prose only.',
      '- see `settings` in text',
      'Notes: - `rogue` mid-line'
    ].join('\n')
    expect([...manifestNames(markdown)]).toStrictEqual(['home', 'lock-open', 'info'])
  })
})

describe('unlistedChanges', () => {
  it('refuses a modified, deleted, renamed or retyped drawing or baseline no manifest names', () => {
    // Scenario: the B5d slip: an existing filled source rewritten and its baseline
    // regenerated, a deleted one, a renamed one (its old path), a type change.
    const changes = parseNameStatus(
      [
        'M\ticons/filled/info.svg',
        'M\tvisual/filled/info.png',
        'D\ticons/line/old.svg',
        'R100\ticons/line/was.svg\ticons/line/now.svg',
        'T\ticons/sm/lock.svg'
      ].join('\n')
    )
    expect(unlistedChanges(changes, new Set())).toStrictEqual([
      'icons/filled/info.svg',
      'visual/filled/info.png',
      'icons/line/old.svg',
      'icons/line/was.svg',
      'icons/sm/lock.svg'
    ])
  })

  it('lets through what a manifest names, new drawings, copies and other files', () => {
    // Scenario: a listed redraw, an added icon and its baseline, a copy, metadata and
    // generated code; a malformed line with no path guards nothing.
    const changes = parseNameStatus(
      [
        'M\ticons/line/home.svg',
        'M\tvisual/line/home.png',
        'A\ticons/line/new.svg',
        'A\tvisual/line/new.png',
        'C100\ticons/line/home.svg\ticons/line/home-copy.svg',
        'M\ticons/meta/info.json',
        'M\tsrc/icons/generated/info/filled.ts',
        'M'
      ].join('\n')
    )
    expect(unlistedChanges(changes, new Set(['home']))).toStrictEqual([])
  })
})

describe('manifestPaths', () => {
  it('lists the manifests a pull request adds or changes, but not the README', () => {
    // Scenario: an added and a modified manifest count; a deleted one, a renamed one, the
    // folder's README, another extension and a file outside the folder do not.
    const changes = parseNameStatus(
      [
        'A\tdocs/redraws/b6-a1.md',
        'M\tdocs/redraws/r2.md',
        'D\tdocs/redraws/old.md',
        'R100\tdocs/redraws/a.md\tdocs/redraws/b.md',
        'M\tdocs/redraws/README.md',
        'A\tdocs/redraws/notes.txt',
        'A\tdocs/other/x.md'
      ].join('\n')
    )
    expect(manifestPaths(changes)).toStrictEqual(['docs/redraws/b6-a1.md', 'docs/redraws/r2.md'])
  })
})
