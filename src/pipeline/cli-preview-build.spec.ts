/**
 * Unit tests for the command the unprivileged preview job runs.
 *
 * Layer: integration; git runs for real, in throwaway repositories.
 * Goal: prove every flag is validated before it reaches git or a path, git is run with an
 * argument list and reads the parents of a commit from its header only, the build refuses
 * a merge commit that is not the merge of the base and the head, and a hostile drawing is
 * refused end to end through real git.
 * Mocks: git and the references are injected for the flag cases; the repository cases use
 * real git on a temp repository.
 */

import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { previewRepository, SMALL_CIRCLE } from './__tests__/preview-repo-d.ts'
import type { PreviewRepository } from './__tests__/preview-repo-d.ts'
import { drawing, removeScratch, scratchRepository } from './__tests__/support.ts'
import type { Output } from './cli.ts'
import { commitParents, repositoryGit, runPreviewBuild } from './cli-preview-build.ts'
import type { PreviewGit } from './preview-build.ts'
import { normalisedShape, readDrawing } from './similarity.ts'
import type { Reference } from './similarity.ts'

const BASE = 'b'.repeat(40)
const HEAD = 'a'.repeat(40)
const MERGE = 'c'.repeat(40)

function capture(): Output & { logs: string[]; errors: string[] } {
  const logs: string[] = []
  const errors: string[] = []
  return { logs, errors, log: (line) => logs.push(line), error: (line) => errors.push(line) }
}

/** Throws a value that is not an `Error`. */
function failWith(value: unknown): never {
  throw value
}

describe('commitParents', () => {
  const tree = `tree ${'1'.repeat(40)}`

  it('reads every parent line of the header, in order', () => {
    /**
     * Scenario: a merge commit's header lists two parents; both are returned in order.
     */
    const object = [tree, `parent ${BASE}`, `parent ${HEAD}`, 'author A', '', 'message'].join('\n')
    expect(commitParents(object)).toStrictEqual([BASE, HEAD])
  })

  it('returns nothing for a commit without parents', () => {
    /**
     * Scenario: a root commit has no parent line.
     */
    expect(commitParents([tree, 'author A', '', ''].join('\n'))).toStrictEqual([])
  })

  it('stops at the first blank line, so the message is never read', () => {
    /**
     * Scenario: a message line shaped like a header is author text, not a parent.
     */
    const object = [tree, `parent ${BASE}`, '', `parent ${HEAD}`].join('\n')
    expect(commitParents(object)).toStrictEqual([BASE])
  })

  it.each([
    ['a prefix', `xparent ${BASE}`],
    ['a suffix', `parent ${BASE}0`],
    ['a short sha', `parent ${'b'.repeat(39)}`],
    ['an uppercase sha', `parent ${'B'.repeat(40)}`],
    ['no space', `parent${BASE}`],
    ['a trailing space', `parent ${BASE} `]
  ])('ignores a header line with %s', (_what, line) => {
    /**
     * Scenario: only a line that is exactly `parent <40 hex>` names a parent.
     */
    expect(commitParents([tree, line, 'author A'].join('\n'))).toStrictEqual([])
  })
})

describe('repositoryGit', () => {
  let repository: PreviewRepository

  beforeAll(() => {
    repository = previewRepository()
  })

  afterAll(() => removeScratch(repository.root))

  it('reads the parents of a merge commit, in order', () => {
    /**
     * Scenario: GitHub's merge commit has the base first and the head second.
     */
    const git = repositoryGit(repository.root)
    expect(git.parents(repository.merge)).toStrictEqual([repository.base, repository.head])
  })

  it('reads one parent, and none for a root commit', () => {
    /**
     * Scenario: an ordinary commit has one parent and the first commit has none.
     */
    const git = repositoryGit(repository.root)
    expect(git.parents(repository.base)).toStrictEqual([repository.mergeBase])
    expect(git.parents(repository.mergeBase)).toStrictEqual([])
  })

  it('does not read a parent line from the commit message', () => {
    /**
     * Scenario: the head commit's message holds a line that looks like a header, after the
     * blank line; it is author text and is not a parent.
     */
    const git = repositoryGit(repository.root)
    expect(git.parents(repository.head)).toStrictEqual([repository.mergeBase])
  })

  it('lists the pull request own change between the base and the merge commit', () => {
    /**
     * Scenario: the base branch added `star` after the pull request branched; the diff to
     * the merge commit lists only the pull request's drawing.
     */
    const git = repositoryGit(repository.root)
    expect(git.diff(repository.base, repository.merge)).toBe('M\ticons/line/ring.svg\n')
    expect(git.diff(repository.head, repository.base)).toContain('A\ticons/line/star.svg')
  })

  it('shows a file as a commit has it', () => {
    /**
     * Scenario: `show` returns the text of a path at a commit, and fails for a path that
     * is not there.
     */
    const git = repositoryGit(repository.root)
    expect(git.show(repository.merge, 'icons/line/ring.svg')).toBe(drawing('line', SMALL_CIRCLE))
    expect(() => git.show(repository.merge, 'icons/line/missing.svg')).toThrow()
  })
})

describe('runPreviewBuild', () => {
  const VALID = ['--base', BASE, '--head', HEAD, '--merge', MERGE, '--pr', '7', '--out', 'out']
  const fake: PreviewGit = {
    diff: () => '',
    show: () => '',
    parents: () => [BASE, HEAD]
  }
  let root: string
  let scratch: string

  beforeEach(() => {
    root = scratchRepository({
      'icons/line/ring.svg': drawing('line', SMALL_CIRCLE),
      'icons/meta/ring.json': JSON.stringify({
        $schema: '../../schemas/icon.schema.json',
        label: 'Ring',
        tags: ['circle'],
        categories: ['system'],
        useCases: ['First use', 'Second use'],
        variants: ['line'],
        opticalSizes: [24],
        since: '1.0.0'
      })
    })
    scratch = mkdtempSync(join(tmpdir(), 'bymax-preview-out-'))
  })

  afterEach(() => {
    removeScratch(root)
    removeScratch(scratch)
  })

  /** The valid arguments with a flag's value replaced, or the flag removed. */
  const withFlag = (flag: string, value: string | undefined): string[] => {
    const args = [...VALID]
    const index = args.indexOf(flag)
    if (value === undefined) args.splice(index, 2)
    else args[index + 1] = value
    return args
  }

  it('builds the preview and reports the lint result and the image count', () => {
    /**
     * Scenario: valid flags build a manifest in the output directory, resolved against the
     * root, and the command prints a summary and returns 0.
     */
    const output = capture()
    expect(runPreviewBuild(VALID, root, output, fake, () => [])).toBe(0)
    expect(output.errors).toStrictEqual([])
    expect(output.logs).toStrictEqual([
      'previewed 0 drawing(s); 0 compared for similarity',
      'lint passed; 0 image(s)'
    ])
    const manifest = JSON.parse(readFileSync(join(root, 'out', 'manifest.json'), 'utf8')) as {
      pr: number
      head: string
    }
    expect(manifest.pr).toBe(7)
    expect(manifest.head).toBe(HEAD)
  })

  it('passes the repository root to the references loader only when it renders', () => {
    /**
     * Scenario: the references are loaded lazily with the root, once a drawing changes.
     */
    const reference = ((): Reference => {
      const parsed = readDrawing(drawing('line', SMALL_CIRCLE), 'stroke')
      const shape = normalisedShape(parsed)
      if (shape === undefined) throw new Error('no ink')
      return { id: 'lucide/circle', set: 'lucide', name: 'circle', drawing: parsed, shape }
    })()
    const seen: string[] = []
    const changing: PreviewGit = {
      ...fake,
      diff: () => 'M\ticons/line/ring.svg\n',
      show: () => drawing('line', '<circle cx="12" cy="12" r="8"/>')
    }
    const output = capture()
    const code = runPreviewBuild(VALID, root, output, changing, (loaded) => {
      seen.push(loaded)
      return [reference]
    })
    expect(code).toBe(0)
    expect(seen).toStrictEqual([root])
    expect(output.logs.at(-1)).toBe('lint passed; 2 image(s)')
  })

  it.each([
    ['--base', undefined],
    ['--base', 'abc'],
    ['--base', 'B'.repeat(40)],
    ['--base', 'b'.repeat(41)],
    ['--base', `${BASE}\n`],
    ['--head', undefined],
    ['--head', 'main'],
    ['--head', `x${HEAD}`],
    ['--merge', undefined],
    ['--merge', 'abc'],
    ['--merge', 'C'.repeat(40)],
    ['--merge', `${MERGE}x`],
    ['--pr', undefined],
    ['--pr', '0'],
    ['--pr', '07'],
    ['--pr', 'abc'],
    ['--pr', '-1'],
    ['--pr', '1.5'],
    ['--pr', '12345678901'],
    ['--pr', '7\n8'],
    ['--out', undefined],
    ['--out', ''],
    ['--out', 'a b'],
    ['--out', 'a;b'],
    ['--out', '$(x)'],
    ['--out', 'a\nb']
  ])('rejects %s set to %s, before anything is built', (flag, value) => {
    /**
     * Scenario: a flag that is missing or does not match its pattern fails with its name,
     * returns 1 and builds nothing.
     */
    const output = capture()
    const git: PreviewGit = { ...fake, parents: jest.fn(fake.parents) }
    expect(runPreviewBuild(withFlag(flag, value), root, output, git, () => [])).toBe(1)
    expect(output.errors).toStrictEqual([`missing or invalid ${flag}`])
    expect(output.logs).toStrictEqual([])
    expect(git.parents).not.toHaveBeenCalled()
    expect(existsSync(join(root, 'out'))).toBe(false)
  })

  it('rejects a flag whose value is missing at the end of the line', () => {
    /**
     * Scenario: `--merge` as the last argument has no value.
     */
    const output = capture()
    const args = [...withFlag('--merge', undefined), '--merge']
    expect(runPreviewBuild(args, root, output, fake, () => [])).toBe(1)
    expect(output.errors).toStrictEqual(['missing or invalid --merge'])
  })

  it('accepts the largest pull request number and a nested output path', () => {
    /**
     * Scenario: ten digits are allowed, and an output path with dots and slashes is
     * resolved against the root.
     */
    const output = capture()
    const args = withFlag('--pr', '1234567890')
    args[args.indexOf('--out') + 1] = 'a/b.c-d/out'
    expect(runPreviewBuild(args, root, output, fake, () => [])).toBe(0)
    expect(existsSync(join(root, 'a/b.c-d/out/manifest.json'))).toBe(true)
  })

  it('fails when the merge commit is not the merge of the base and the head', () => {
    /**
     * Scenario: GitHub's merge commit names other parents; the command returns 1 with the
     * reason and writes nothing.
     */
    const output = capture()
    const git: PreviewGit = { ...fake, parents: () => [HEAD, BASE] }
    expect(runPreviewBuild(VALID, root, output, git, () => [])).toBe(1)
    expect(output.errors).toStrictEqual([
      'the merge commit is not the merge of the base and the head'
    ])
    expect(existsSync(join(root, 'out'))).toBe(false)
  })

  it('reports a thrown value that is not an Error', () => {
    /**
     * Scenario: a failure that is not an `Error` is printed as text.
     */
    const output = capture()
    const git: PreviewGit = { ...fake, parents: () => failWith('boom') }
    expect(runPreviewBuild(VALID, root, output, git, () => [])).toBe(1)
    expect(output.errors).toStrictEqual(['boom'])
  })

  it('refuses a hostile drawing end to end, through real git and the default loaders', () => {
    /**
     * Scenario: a pull request replaces `ring.svg` with a drawing that reads a local file.
     * With real git, the real merge commit and no injected loader, the build exits 0 with a
     * failed lint, writes no PNG and never loads the references.
     */
    const hostile =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><image href="file:///etc/hosts" width="24" height="24"/></svg>'
    const pr = previewRepository({ 'icons/line/ring.svg': hostile })
    try {
      const out = join(scratch, 'result')
      const output = capture()
      const args = [
        '--base',
        pr.base,
        '--head',
        pr.head,
        '--merge',
        pr.merge,
        '--pr',
        '9',
        '--out',
        out
      ]
      expect(runPreviewBuild(args, pr.root, output)).toBe(0)
      expect(output.logs).toStrictEqual(['lint failed; 0 image(s)'])
      expect(output.errors.join('\n')).toContain('icons/line/ring.svg')
      const manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8')) as unknown
      expect(manifest).toStrictEqual({
        pr: 9,
        head: pr.head,
        lint: 'failed',
        issues: output.errors.length,
        icons: [],
        images: []
      })
      expect(existsSync(join(out, 'preview.png'))).toBe(false)
      expect(existsSync(join(out, 'similarity.png'))).toBe(false)
    } finally {
      removeScratch(pr.root)
    }
  })

  it('previews only the pull request own change through real git', () => {
    /**
     * Scenario: with real git and a branch that is behind its base, the manifest lists the
     * changed `ring` and not the `star` that landed on the base branch.
     */
    const pr = previewRepository()
    try {
      const out = join(scratch, 'result')
      const output = capture()
      const reference = ((): Reference => {
        const parsed = readDrawing(drawing('line', SMALL_CIRCLE), 'stroke')
        const shape = normalisedShape(parsed)
        if (shape === undefined) throw new Error('no ink')
        return { id: 'lucide/circle', set: 'lucide', name: 'circle', drawing: parsed, shape }
      })()
      const args = ['--base', pr.base, '--head', pr.head, '--merge', pr.merge, '--pr', '9']
      expect(
        runPreviewBuild([...args, '--out', out], pr.root, output, undefined, () => [reference])
      ).toBe(0)
      const manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8')) as {
        icons: { name: string }[]
      }
      expect(manifest.icons.map((icon) => icon.name)).toStrictEqual(['ring'])
      expect(output.errors).toStrictEqual([])
    } finally {
      removeScratch(pr.root)
    }
  })
})
