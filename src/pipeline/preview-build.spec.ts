/**
 * Unit tests for the unprivileged half of the pull-request preview.
 *
 * Layer: integration, on scratch copies of the repository layout with injected git reads.
 * Goal: prove the preview is built from GitHub's merge commit, so only the pull request's
 * own change is shown, only a drawing that passes the base branch's lint is ever rendered,
 * a hostile drawing yields a lint-failure manifest and no image, and the sheet and the
 * manifest are what the privileged half expects.
 * Mocks: git is a fake over in-memory trees; the references are a one-icon loader.
 */

import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

import { CIRCLE, drawing, iconMeta, removeScratch, scratchRepository } from './__tests__/support.ts'
import type { Output } from './cli.ts'
import { placedDrawing, SHEET_SIZES, SHEET_THEMES } from './contact-sheet.ts'
import type { SheetRow } from './contact-sheet.ts'
import { isPublishablePng, validateManifest } from './preview.ts'
import { buildPreview, previewSheet } from './preview-build.ts'
import type { PreviewGit, PreviewRequest } from './preview-build.ts'
import { normalisedShape, readDrawing } from './similarity.ts'
import type { Reference } from './similarity.ts'

const BASE = 'b'.repeat(40)
const HEAD = 'a'.repeat(40)
const MERGE = 'c'.repeat(40)

const SMALL = '<circle cx="12" cy="12" r="5"/>'
const BIG = '<circle cx="12" cy="12" r="9"/>'

/** A tree of files by path. */
type Tree = Record<string, string>

/** The files of the base branch: `ring` and `star`. */
const BASE_TREE: Tree = {
  'icons/line/ring.svg': drawing('line', CIRCLE),
  'icons/meta/ring.json': iconMeta(),
  'icons/line/star.svg': drawing('line', BIG),
  'icons/meta/star.json': iconMeta({ tags: ['star'] })
}

/** A fake git over trees: the diff is computed between two of them. */
function fakeGit(
  trees: Record<string, Tree>,
  parents: Record<string, readonly string[]> = { [MERGE]: [BASE, HEAD] }
): PreviewGit & { diffs: [string, string][]; shown: [string, string][] } {
  const diffs: [string, string][] = []
  const shown: [string, string][] = []
  const tree = (commit: string): Tree => trees[commit] ?? {}
  return {
    diffs,
    shown,
    diff: (base, head) => {
      diffs.push([base, head])
      const [from, to] = [tree(base), tree(head)]
      const paths = [...new Set([...Object.keys(from), ...Object.keys(to)])].sort()
      return paths
        .flatMap((path) => {
          if (from[path] === to[path]) return []
          if (from[path] === undefined) return [`A\t${path}`]
          return [to[path] === undefined ? `D\t${path}` : `M\t${path}`]
        })
        .join('\n')
    },
    show: (commit, path) => {
      shown.push([commit, path])
      return tree(commit)[path] ?? ''
    },
    parents: (commit) => parents[commit] ?? []
  }
}

/** One reference, a circle, from the real reader. */
function circleReference(): Reference {
  const parsed = readDrawing(drawing('line', '<circle cx="12" cy="12" r="8"/>'), 'stroke')
  const shape = normalisedShape(parsed)
  if (shape === undefined) throw new Error('the reference has no ink')
  return { id: 'lucide/circle', set: 'lucide', name: 'circle', drawing: parsed, shape }
}

function capture(): Output & { logs: string[]; errors: string[] } {
  const logs: string[] = []
  const errors: string[] = []
  return { logs, errors, log: (line) => logs.push(line), error: (line) => errors.push(line) }
}

describe('buildPreview', () => {
  let root: string
  let out: string

  beforeEach(() => {
    root = scratchRepository(BASE_TREE)
    out = join(root, 'preview-out')
  })

  afterEach(() => removeScratch(root))

  const request = (overrides: Partial<PreviewRequest> = {}): PreviewRequest => ({
    root,
    base: BASE,
    head: HEAD,
    merge: MERGE,
    pr: 7,
    out,
    ...overrides
  })

  const references = jest.fn(() => [circleReference()])

  beforeEach(() => references.mockClear())

  it('previews only the pull request own change when the branch is behind its base', () => {
    /**
     * Scenario: the base branch moved on and added `star`, which the pull request never
     * had. The diff and the files come from the merge commit, which holds both, so only the
     * change to `ring` appears in the manifest, and `star` is not shown as deleted.
     */
    const git = fakeGit({
      [BASE]: BASE_TREE,
      [HEAD]: {
        'icons/line/ring.svg': drawing('line', SMALL),
        'icons/meta/ring.json': iconMeta()
      },
      [MERGE]: { ...BASE_TREE, 'icons/line/ring.svg': drawing('line', SMALL) }
    })
    const output = capture()
    const manifest = buildPreview(request(), git, references, output)
    expect(git.diffs).toStrictEqual([[BASE, MERGE]])
    expect(git.shown).toStrictEqual([[MERGE, 'icons/line/ring.svg']])
    expect(manifest.head).toBe(HEAD)
    expect(manifest.pr).toBe(7)
    expect(manifest.lint).toBe('passed')
    expect(manifest.issues).toBe(0)
    expect(manifest.images).toStrictEqual(['preview.png', 'similarity.png'])
    expect(manifest.icons.map((icon) => `${icon.name} (${icon.variant})`)).toStrictEqual([
      'ring (line)'
    ])
    expect(manifest.icons[0]?.matches.map((match) => match.id)).toStrictEqual(['lucide/circle'])
    expect(output.logs).toStrictEqual(['previewed 1 drawing(s); 1 compared for similarity'])
    expect(output.errors).toStrictEqual([])
    expect(references).toHaveBeenCalledTimes(1)
  })

  it('writes the images and a manifest the privileged half accepts', () => {
    /**
     * Scenario: the output directory holds exactly the two PNGs and the manifest, the PNGs
     * pass the publish checks, and the manifest on disk validates and equals the result.
     */
    const git = fakeGit({
      [BASE]: BASE_TREE,
      [MERGE]: { ...BASE_TREE, 'icons/line/ring.svg': drawing('line', SMALL) }
    })
    const manifest = buildPreview(request(), git, references, capture())
    expect(readdirSync(out).sort()).toStrictEqual([
      'icons',
      'manifest.json',
      'preview.png',
      'similarity.png'
    ])
    for (const file of ['preview.png', 'similarity.png']) {
      expect(isPublishablePng(readFileSync(join(out, file)))).toBe(true)
    }
    const text = readFileSync(join(out, 'manifest.json'), 'utf8')
    expect(text.endsWith('}\n')).toBe(true)
    expect(validateManifest(JSON.parse(text))).toStrictEqual(manifest)
  })

  it('refuses a merge commit that is not the merge of the base and the head', () => {
    /**
     * Scenario: the parents of the merge commit must be exactly the base and the head, in
     * that order; any other list stops the build before anything is written or read.
     */
    const other = 'd'.repeat(40)
    for (const parents of [
      [],
      [BASE],
      [HEAD],
      [HEAD, BASE],
      [BASE, other],
      [other, HEAD],
      [BASE, HEAD, other]
    ]) {
      const git = fakeGit({ [BASE]: BASE_TREE, [MERGE]: BASE_TREE }, { [MERGE]: parents })
      expect(() => buildPreview(request(), git, references, capture())).toThrow(
        'the merge commit is not the merge of the base and the head'
      )
      expect(git.diffs).toStrictEqual([])
      expect(git.shown).toStrictEqual([])
    }
    expect(existsSync(out)).toBe(false)
    expect(references).not.toHaveBeenCalled()
  })

  it('shows a deleted drawing with its before strip only, and compares nothing', () => {
    /**
     * Scenario: the pull request deletes `star` and its metadata; the sheet is written for
     * the removed drawing, but the deleted icon is not in the head, so no similarity sheet
     * and no icon is listed.
     */
    const merged = { ...BASE_TREE }
    delete merged['icons/line/star.svg']
    delete merged['icons/meta/star.json']
    const git = fakeGit({ [BASE]: BASE_TREE, [MERGE]: merged })
    const output = capture()
    const manifest = buildPreview(request(), git, references, output)
    expect(manifest).toStrictEqual({
      pr: 7,
      head: HEAD,
      lint: 'passed',
      issues: 0,
      icons: [],
      images: ['preview.png']
    })
    expect(git.shown).toStrictEqual([])
    expect(existsSync(join(out, 'similarity.png'))).toBe(false)
    expect(output.logs).toStrictEqual(['previewed 1 drawing(s); 0 compared for similarity'])
  })

  it('tolerates a deleted path that is already absent from the scratch copy', () => {
    /**
     * Scenario: the diff lists a deletion of a drawing the copy of the base branch does not
     * hold; removing it is not an error.
     */
    const git = fakeGit({
      [BASE]: { ...BASE_TREE, 'icons/line/ghost.svg': '' },
      [MERGE]: BASE_TREE
    })
    expect(() => buildPreview(request(), git, references, capture())).not.toThrow()
  })

  it('shows an added drawing', () => {
    /**
     * Scenario: the pull request adds `dot`; the files are read from the merge commit and
     * the icon is previewed and compared.
     */
    const added = {
      'icons/line/dot.svg': drawing('line', SMALL),
      'icons/meta/dot.json': iconMeta({ tags: ['dot'] })
    }
    const git = fakeGit({ [BASE]: BASE_TREE, [MERGE]: { ...BASE_TREE, ...added } })
    const manifest = buildPreview(request(), git, references, capture())
    expect(git.shown.map(([commit]) => commit)).toStrictEqual([MERGE, MERGE])
    expect(manifest.icons.map((icon) => icon.name)).toStrictEqual(['dot'])
    expect(manifest.images).toStrictEqual(['preview.png', 'similarity.png'])
  })

  it('renders nothing and loads no references when no drawing changed', () => {
    /**
     * Scenario: a pull request whose diff holds no preview path produces a passed manifest
     * with no image, and the references are never loaded.
     */
    const git = fakeGit({ [BASE]: BASE_TREE, [MERGE]: BASE_TREE })
    const output = capture()
    const manifest = buildPreview(request(), git, references, output)
    expect(manifest).toStrictEqual({
      pr: 7,
      head: HEAD,
      lint: 'passed',
      issues: 0,
      icons: [],
      images: []
    })
    expect(output.logs).toStrictEqual(['previewed 0 drawing(s); 0 compared for similarity'])
    expect(references).not.toHaveBeenCalled()
    expect(existsSync(join(out, 'preview.png'))).toBe(false)
  })

  it('discards a stale scratch copy of the sources', () => {
    /**
     * Scenario: a leftover `icons/` copy in the output directory does not leak into the
     * lint: a file left from an earlier run is not part of this one.
     */
    const git = fakeGit({ [BASE]: BASE_TREE, [MERGE]: BASE_TREE })
    buildPreview(request(), git, references, capture())
    rmSync(join(out, 'icons', 'line', 'star.svg'))
    const manifest = buildPreview(request(), git, references, capture())
    expect(manifest.lint).toBe('passed')
    expect(existsSync(join(out, 'icons', 'line', 'star.svg'))).toBe(true)
  })

  describe('the rendering is behind the lint', () => {
    const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'

    const hostile = (name: string, svg: string): void => {
      it(`${name}: reports a failed lint and renders nothing`, () => {
        /**
         * Scenario: a pull request modifies an existing drawing into one that carries a
         * reference. The base branch's lint refuses it, so the manifest says `failed`, lists
         * no icon and no image, and neither PNG is written, because nothing reached the
         * renderer.
         */
        const git = fakeGit({
          [BASE]: BASE_TREE,
          [MERGE]: { ...BASE_TREE, 'icons/line/ring.svg': svg }
        })
        const output = capture()
        const manifest = buildPreview(request(), git, references, output)
        expect(manifest.lint).toBe('failed')
        expect(manifest.issues).toBeGreaterThan(0)
        expect(manifest.icons).toStrictEqual([])
        expect(manifest.images).toStrictEqual([])
        expect(output.errors.length).toBe(manifest.issues)
        expect(output.errors.join('\n')).toContain('icons/line/ring.svg')
        expect(existsSync(join(out, 'preview.png'))).toBe(false)
        expect(existsSync(join(out, 'similarity.png'))).toBe(false)
        expect(references).not.toHaveBeenCalled()
        expect(JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'))).toStrictEqual(manifest)
        expect(output.logs).toStrictEqual([])
      })
    }

    hostile(
      'an image element with a file reference',
      `${SVG_OPEN}<image href="file:///etc/hosts" width="24" height="24"/></svg>`
    )
    hostile('a use element', `${SVG_OPEN}<use href="#x"/></svg>`)
    hostile(
      'an xlink:href on a path and an href on an allowed element',
      `${SVG_OPEN}<path d="M4 4h16" xlink:href="file:///etc/hosts"/><circle cx="12" cy="12" r="5" href="https://example.com/x"/></svg>`
    )
  })
})

describe('previewSheet', () => {
  const row = (label: string): SheetRow => ({
    label,
    kind: 'line',
    elements: [{ tag: 'circle', attributes: { cx: '12', cy: '12', r: '7' } }]
  })

  const stripWidth = SHEET_THEMES.length * SHEET_SIZES.length * 56

  it('lays out an empty sheet with a header and one row of space', () => {
    /**
     * Scenario: no rows still gives a sheet one row tall with both column headings.
     */
    const width = 160 + stripWidth * 2 + 16
    expect(previewSheet([])).toBe(
      [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="80" viewBox="0 0 ${width} 80">`,
        `<rect width="${width}" height="80" fill="#ffffff"/>`,
        '<text x="160" y="16" fill="#0d1b24" font-family="Helvetica, Arial, sans-serif" font-size="12">Base branch</text>',
        `<text x="${160 + stripWidth + 16}" y="16" fill="#0d1b24" font-family="Helvetica, Arial, sans-serif" font-size="12">This pull request</text>`,
        '</svg>',
        ''
      ].join('\n')
    )
  })

  it('draws each strip at every size on both pages, with empty cells for a missing side', () => {
    /**
     * Scenario: a row with only an after drawing leaves empty cells on the left, a row with
     * only a before drawing leaves them on the right, a label with markup characters is
     * escaped, and the sheet is as tall as its rows.
     */
    const target = row('ring')
    const font = 'font-family="Helvetica, Arial, sans-serif" font-size="12"'
    const strip = (drawn: SheetRow | undefined, left: number, top: number): string =>
      SHEET_THEMES.flatMap((theme, t) =>
        SHEET_SIZES.map((size, s) => {
          const x = left + (t * SHEET_SIZES.length + s) * 56
          const cell = `<rect x="${x}" y="${top}" width="56" height="56" fill="${theme.background}"/>`
          return drawn === undefined
            ? cell
            : cell + placedDrawing(drawn, x, top, size, theme.colours[0][1])
        })
      ).join('')
    const right = 160 + stripWidth + 16
    const width = right + stripWidth
    const expected = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="136" viewBox="0 0 ${width} 136">`,
      `<rect width="${width}" height="136" fill="#ffffff"/>`,
      `<text x="160" y="16" fill="#0d1b24" ${font}>Base branch</text>`,
      `<text x="${right}" y="16" fill="#0d1b24" ${font}>This pull request</text>`,
      `<text x="8" y="56" fill="#0d1b24" ${font}>a &amp; &lt;b></text>` +
        strip(undefined, 160, 24) +
        strip(target, right, 24),
      `<text x="8" y="112" fill="#0d1b24" ${font}>two</text>` +
        strip(target, 160, 80) +
        strip(undefined, right, 80),
      '</svg>',
      ''
    ].join('\n')
    expect(
      previewSheet([
        { label: 'a & <b>', before: undefined, after: target },
        { label: 'two', before: target, after: undefined }
      ])
    ).toBe(expected)
  })
})
