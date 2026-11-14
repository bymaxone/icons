/**
 * Unit tests for the generator's file operations.
 *
 * Layer: unit, on scratch repositories.
 * Goal: prove the formatter rewrites only the source SVGs it can read and that differ,
 * the modules come out formatted with the repository's Prettier configuration, a
 * generation replaces the generated directories, the stale-copy comparison names every
 * missing, extra and different file, and the static outputs are written.
 * Mocks: none.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  CIRCLE,
  drawing,
  iconMeta,
  removeScratch,
  REPO_ROOT,
  scratchRepository,
  sources
} from './__tests__/support.ts'
import {
  formatSources,
  generatedModules,
  replaceGenerated,
  staleFiles,
  writeFiles,
  writeStatic
} from './generate.ts'
import { lintSources } from './lint.ts'
import { readSources } from './sources.ts'

let built: ReturnType<typeof lintSources> | undefined
/** Built on first use rather than at load, so a fault fails tests instead of the file. */
const build = (): ReturnType<typeof lintSources> =>
  (built ??= lintSources(
    sources({ line: { 'ring.svg': drawing('line', CIRCLE) }, meta: { 'ring.json': iconMeta() } })
  ))

describe('formatSources', () => {
  let root: string

  afterEach(() => removeScratch(root))

  it('rewrites each readable SVG that differs from its normalised form, in every kind', () => {
    /**
     * Scenario: the formatter writes the root attributes and the canonical layout; a file
     * already normalised, a file that is not XML, one SVGO fails on and a non-SVG file in
     * an SVG directory are left exactly as they were.
     */
    const files = {
      'icons/line/a.svg': `<svg>${CIRCLE}</svg>`,
      'icons/line/b.svg': drawing('line', CIRCLE),
      'icons/line/broken.svg': '<svg>',
      'icons/line/crash.svg': '<svg><constructor/></svg>',
      'icons/line/notes.txt': `<svg>${CIRCLE}</svg>`,
      'icons/filled/a.svg': `<svg>${CIRCLE}</svg>`,
      'icons/sm/a.svg': `<svg>${CIRCLE}</svg>`,
      'icons/brands/c.svg': '<svg><path d="M4 4h16"/></svg>'
    }
    root = scratchRepository(files)
    const changed = formatSources(root, readSources({ root, icons: 'icons' }))
    expect([...changed].sort()).toStrictEqual([
      'icons/brands/c.svg',
      'icons/filled/a.svg',
      'icons/line/a.svg',
      'icons/sm/a.svg'
    ])
    const read = (path: string): string => readFileSync(join(root, path), 'utf8')
    expect(read('icons/line/a.svg')).toBe(drawing('line', CIRCLE))
    expect(read('icons/filled/a.svg')).toBe(drawing('filled', CIRCLE))
    expect(read('icons/sm/a.svg')).toBe(drawing('sm', CIRCLE))
    expect(read('icons/brands/c.svg')).toBe(drawing('brands', '<path d="M4 4h16"/>'))
    for (const path of ['icons/line/broken.svg', 'icons/line/crash.svg', 'icons/line/notes.txt']) {
      expect(read(path)).toBe(files[path as keyof typeof files])
    }
  })
})

describe('generatedModules', () => {
  it('formats every module with the repository Prettier configuration', async () => {
    /**
     * Scenario: the committed modules pass `pnpm format:check`, so the generator writes
     * them in the repository's style: single quotes, no semicolons, 100 columns.
     */
    const modules = await generatedModules(REPO_ROOT, build().set)
    expect([...modules.keys()]).toStrictEqual([
      'src/icons/generated/index.ts',
      'src/brands/generated/index.ts',
      'src/flags/generated/index.ts',
      'src/icons/generated/ring/index.ts',
      'src/icons/generated/ring/line.ts',
      'src/meta/generated/metadata.ts'
    ])
    expect(modules.get('src/icons/generated/ring/line.ts')).toContain(
      "export const RingIcon = /* @__PURE__ */ createIcon('ring', [\n  ['circle', { cx: 12, cy: 12, r: 7.25 }]\n])\n"
    )
    expect(modules.get('src/meta/generated/metadata.ts')).toContain(
      "export const ICON_NAMES = ['ring'] as const\n"
    )
    expect(modules.get('src/icons/generated/index.ts')).toContain(
      "export { RingIcon } from '@bymax-one/icons/icons/ring'\n"
    )
  })
})

describe('writing and replacing', () => {
  let root: string

  afterEach(() => removeScratch(root))

  it('writes files under a directory, creating their parents', () => {
    /**
     * Scenario: the static outputs and the modules land in directories that may not
     * exist yet.
     */
    root = scratchRepository()
    writeFiles(
      root,
      new Map([
        ['a/b/c.txt', 'one'],
        ['d.txt', 'two']
      ])
    )
    expect(readFileSync(join(root, 'a/b/c.txt'), 'utf8')).toBe('one')
    expect(readFileSync(join(root, 'd.txt'), 'utf8')).toBe('two')
  })

  it('replaces the three generated directories and nothing else', () => {
    /**
     * Scenario: an icon removed from the sources leaves no module behind in any generated
     * directory, while the hand-written modules beside them stay.
     */
    root = scratchRepository({
      'src/icons/generated/old/index.ts': 'old',
      'src/brands/generated/old.ts': 'old',
      'src/meta/generated/stale.ts': 'old',
      'src/meta/icon-grid.ts': 'kept'
    })
    replaceGenerated(root, new Map([['src/icons/generated/index.ts', 'new']]))
    expect(existsSync(join(root, 'src/icons/generated/old'))).toBe(false)
    expect(existsSync(join(root, 'src/brands/generated'))).toBe(false)
    expect(existsSync(join(root, 'src/meta/generated'))).toBe(false)
    expect(readFileSync(join(root, 'src/icons/generated/index.ts'), 'utf8')).toBe('new')
    expect(readFileSync(join(root, 'src/meta/icon-grid.ts'), 'utf8')).toBe('kept')
  })
})

describe('staleFiles', () => {
  let root: string

  afterEach(() => removeScratch(root))

  it('is empty when the committed modules are what the sources produce', () => {
    /**
     * Scenario: a fresh generation over unchanged sources is a no-op.
     */
    root = scratchRepository({
      'src/icons/generated/index.ts': 'a',
      'src/meta/generated/metadata.ts': 'b'
    })
    const expected = new Map([
      ['src/icons/generated/index.ts', 'a'],
      ['src/meta/generated/metadata.ts', 'b']
    ])
    expect(staleFiles(root, expected)).toStrictEqual([])
  })

  it('names every module that is missing, out of date or left over, sorted', () => {
    /**
     * Scenario: a hand edit, a forgotten `pnpm generate` and a removed icon each fail the
     * stale-copy check with the file they are about.
     */
    root = scratchRepository({
      'src/icons/generated/index.ts': 'edited by hand',
      'src/icons/generated/gone/line.ts': 'x',
      'src/brands/generated/index.ts': 'b'
    })
    const expected = new Map([
      ['src/icons/generated/index.ts', 'a'],
      ['src/brands/generated/index.ts', 'b'],
      ['src/meta/generated/metadata.ts', 'c']
    ])
    expect(staleFiles(root, expected)).toStrictEqual([
      'src/icons/generated/gone/line.ts: not generated by any source',
      'src/icons/generated/index.ts: out of date',
      'src/meta/generated/metadata.ts: missing'
    ])
  })
})

describe('writeStatic', () => {
  let root: string

  afterEach(() => removeScratch(root))

  it('writes the raw SVGs, the sprite and metadata.json into the build directory', () => {
    /**
     * Scenario: `pnpm build` writes the static outputs after tsup, into `dist/`.
     */
    root = scratchRepository()
    const dist = join(root, 'dist')
    expect(writeStatic(dist, build().set)).toBe(3)
    expect(readFileSync(join(dist, 'svg/line/ring.svg'), 'utf8')).toBe(drawing('line', CIRCLE))
    expect(readFileSync(join(dist, 'sprite.svg'), 'utf8')).toContain('<symbol id="bx-ring"')
    expect(JSON.parse(readFileSync(join(dist, 'metadata.json'), 'utf8'))).toHaveProperty(
      'icons.ring'
    )
  })
})
