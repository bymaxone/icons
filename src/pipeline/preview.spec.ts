/**
 * Unit tests for the pull-request preview's contract.
 *
 * Layer: unit, pure functions.
 * Goal: prove an unexpected path in a diff never reaches the file system, a manifest from
 * the unprivileged job is validated field by field and rebuilt from checked fields only,
 * an image is accepted only when it is a PNG of bounded size, and the comment is written
 * only from a validated manifest.
 * Mocks: none.
 */

import {
  COMMENT_MARKER,
  commentBody,
  isPublishablePng,
  MAX_ICONS,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  parseChanges,
  validateManifest
} from './preview.ts'

const HEAD = 'a'.repeat(40)

const match = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'lucide/arrow-up',
  distance: 0.5,
  overlap: 0.25,
  cosine: 0.75,
  ...overrides
})

const icon = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  name: 'arrow-up',
  variant: 'line',
  flagged: false,
  primitive: false,
  matches: [match()],
  ...overrides
})

const manifest = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  pr: 12,
  head: HEAD,
  lint: 'passed',
  issues: 0,
  icons: [icon()],
  images: ['preview.png'],
  ...overrides
})

describe('parseChanges', () => {
  it('reads added, modified and deleted drawings in the order listed', () => {
    /**
     * Scenario: a plain diff lists one file of each status; each becomes a change with its
     * path, its icon name and its status.
     */
    const text = [
      'A\ticons/line/ring.svg',
      'M\ticons/filled/ring-solid.svg',
      'D\ticons/sm/dot-2.svg'
    ].join('\n')
    expect(parseChanges(text)).toStrictEqual([
      { path: 'icons/line/ring.svg', name: 'ring', status: 'added' },
      { path: 'icons/filled/ring-solid.svg', name: 'ring-solid', status: 'modified' },
      { path: 'icons/sm/dot-2.svg', name: 'dot-2', status: 'deleted' }
    ])
  })

  it.each(['line', 'filled', 'sm', 'brands'])('accepts a drawing under icons/%s', (directory) => {
    /**
     * Scenario: every drawing directory is part of the expected set.
     */
    expect(parseChanges(`A\ticons/${directory}/x1.svg`)).toStrictEqual([
      { path: `icons/${directory}/x1.svg`, name: 'x1', status: 'added' }
    ])
  })

  it('accepts a metadata file under icons/meta', () => {
    /**
     * Scenario: a metadata change names its icon too, so the icon is previewed.
     */
    expect(parseChanges('M\ticons/meta/ring.json')).toStrictEqual([
      { path: 'icons/meta/ring.json', name: 'ring', status: 'modified' }
    ])
  })

  it('returns nothing for empty text and skips blank lines', () => {
    /**
     * Scenario: a diff with no output, or with blank lines, yields no change.
     */
    expect(parseChanges('')).toStrictEqual([])
    expect(parseChanges('\n\n')).toStrictEqual([])
  })

  it.each([
    ['a parent directory', 'A\ticons/line/../../etc/passwd'],
    ['a leading parent directory', 'A\t../icons/line/ring.svg'],
    ['an absolute path', 'A\t/icons/line/ring.svg'],
    ['a prefix before icons', 'A\txicons/line/ring.svg'],
    ['an uppercase name', 'A\ticons/line/Ring.svg'],
    ['an uppercase letter inside a name', 'A\ticons/line/rIng.svg'],
    ['another directory', 'A\ticons/other/ring.svg'],
    ['a nested directory', 'A\ticons/line/sub/ring.svg'],
    ['a prefix on a directory', 'A\ticons/xline/ring.svg'],
    ['a suffix on a directory', 'A\ticons/linex/ring.svg'],
    ['a directory of the repository', 'A\tsrc/pipeline/ring.svg'],
    ['another extension', 'A\ticons/line/ring.png'],
    ['a trailing extension', 'A\ticons/line/ring.svg.png'],
    ['a trailing suffix', 'A\ticons/line/ring.svgx'],
    ['a leading hyphen', 'A\ticons/line/-ring.svg'],
    ['a trailing hyphen', 'A\ticons/line/ring-.svg'],
    ['a double hyphen', 'A\ticons/line/ri--ng.svg'],
    ['an underscore', 'A\ticons/line/ri_ng.svg'],
    ['an empty name', 'A\ticons/line/.svg'],
    ['a rename line', 'R100\ticons/line/a.svg\ticons/line/b.svg'],
    ['a copy line', 'C100\ticons/line/a.svg\ticons/line/b.svg'],
    ['a trailing tab field', 'A\ticons/line/ring.svg\textra'],
    ['a trailing empty tab field', 'A\ticons/line/ring.svg\t'],
    ['a status with extra letters', 'AM\ticons/line/ring.svg'],
    ['a lowercase status', 'a\ticons/line/ring.svg'],
    ['an unmerged status', 'U\ticons/line/ring.svg'],
    ['a type change', 'T\ticons/line/ring.svg'],
    ['no status', '\ticons/line/ring.svg'],
    ['no tab', 'A icons/line/ring.svg'],
    ['a status alone', 'A'],
    ['a space before the path', 'A\t icons/line/ring.svg'],
    ['a drawing in the metadata directory', 'A\ticons/meta/ring.svg'],
    ['metadata in a drawing directory', 'A\ticons/line/ring.json']
  ])('drops %s', (_what, line) => {
    /**
     * Scenario: a path outside the expected set, or a line that is not a plain
     * added/modified/deleted entry, is dropped so it never reaches a file name.
     */
    expect(parseChanges(line)).toStrictEqual([])
  })

  it('keeps the valid lines around the dropped ones', () => {
    /**
     * Scenario: a hostile line does not hide the legitimate changes beside it.
     */
    const text = ['A\t../x.svg', 'M\ticons/line/ok.svg', 'R90\ticons/line/a.svg\ticons/line/b.svg']
    expect(parseChanges(text.join('\n'))).toStrictEqual([
      { path: 'icons/line/ok.svg', name: 'ok', status: 'modified' }
    ])
  })

  it('accepts hyphenated and numeric names', () => {
    /**
     * Scenario: kebab-case names with digits and several segments are the expected shape.
     */
    expect(parseChanges('A\ticons/line/a1-b22-c3.svg').map((change) => change.name)).toStrictEqual([
      'a1-b22-c3'
    ])
  })

  it('accepts a hyphenated metadata name and drops a malformed one', () => {
    /**
     * Scenario: a metadata file follows the same kebab-case rule as a drawing: segments of
     * several characters are read, and a segment of anything else is dropped.
     */
    expect(
      parseChanges('M\ticons/meta/a1-b22-c3.json\nM\ticons/meta/a1-_.json').map(
        (change) => change.name
      )
    ).toStrictEqual(['a1-b22-c3'])
  })
})

describe('validateManifest', () => {
  it('returns a valid manifest unchanged', () => {
    /**
     * Scenario: a manifest the build wrote validates and comes back with every field.
     */
    expect(validateManifest(manifest())).toStrictEqual(manifest())
  })

  it('accepts a failed lint with no icons and no images', () => {
    /**
     * Scenario: the lint-failure manifest validates.
     */
    const failed = manifest({ lint: 'failed', issues: 3, icons: [], images: [] })
    expect(validateManifest(failed)).toStrictEqual(failed)
  })

  it('drops a field it does not know, at every level', () => {
    /**
     * Scenario: a hostile manifest carries extra fields; the validated one is rebuilt from
     * the checked fields only.
     */
    const hostile = manifest({
      evil: '![x](https://evil.example)',
      icons: [icon({ evil: 1, matches: [match({ evil: 2 })] })]
    })
    expect(validateManifest(hostile)).toStrictEqual(manifest())
  })

  it('reads the fields of the parsed JSON text', () => {
    /**
     * Scenario: the value comes from `JSON.parse`, as in the privileged job.
     */
    expect(validateManifest(JSON.parse(JSON.stringify(manifest())))).toStrictEqual(manifest())
  })

  it.each([
    ['a string', 'text'],
    ['a number', 5],
    ['null', null],
    ['undefined', undefined],
    ['an array', [manifest()]]
  ])('rejects %s as the manifest', (_what, value) => {
    /**
     * Scenario: the manifest must be a plain object.
     */
    expect(() => validateManifest(value)).toThrow('invalid preview manifest: not an object')
  })

  it('does not read a field from the prototype', () => {
    /**
     * Scenario: a field that only the prototype holds counts as missing.
     */
    const inherited = Object.create(manifest()) as unknown
    expect(() => validateManifest(inherited)).toThrow('invalid preview manifest: lint')
  })

  it('does not read an inherited field of a nested object', () => {
    /**
     * Scenario: an icon whose fields are inherited is rejected, not read through.
     */
    const nested = Object.create(icon()) as unknown
    expect(() => validateManifest(manifest({ icons: [nested] }))).toThrow(
      'invalid preview manifest: icon name'
    )
  })

  it.each([
    ['a missing lint', { lint: undefined }, 'lint'],
    ['an unknown lint', { lint: 'skipped' }, 'lint'],
    ['a lint of the wrong type', { lint: true }, 'lint'],
    ['a string pull request', { pr: '12' }, 'pull request number'],
    ['a zero pull request', { pr: 0 }, 'pull request number'],
    ['a negative pull request', { pr: -1 }, 'pull request number'],
    ['an unsafe pull request', { pr: Number.MAX_SAFE_INTEGER + 1 }, 'pull request number'],
    ['an infinite pull request', { pr: Infinity }, 'pull request number'],
    ['a NaN pull request', { pr: Number.NaN }, 'pull request number'],
    ['a missing head', { head: undefined }, 'head commit'],
    ['a numeric head', { head: 5 }, 'head commit'],
    ['a short head', { head: 'a'.repeat(39) }, 'head commit'],
    ['a long head', { head: 'a'.repeat(41) }, 'head commit'],
    ['an uppercase head', { head: 'A'.repeat(40) }, 'head commit'],
    ['a head with a prefix', { head: `x${'a'.repeat(40)}` }, 'head commit'],
    ['a head with a suffix', { head: `${'a'.repeat(40)}\n` }, 'head commit'],
    ['a string issue count', { issues: '0' }, 'issue count'],
    ['a negative issue count', { issues: -1 }, 'issue count'],
    ['a huge issue count', { issues: 1e6 + 1 }, 'issue count'],
    ['an infinite issue count', { issues: Infinity }, 'issue count'],
    ['icons that are not a list', { icons: {} }, 'icons'],
    ['too many icons', { icons: Array.from({ length: MAX_ICONS + 1 }, () => icon()) }, 'icons'],
    ['a missing icons list', { icons: undefined }, 'icons'],
    ['images that are not a list', { images: 'preview.png' }, 'images'],
    [
      'too many images',
      { images: Array.from({ length: MAX_IMAGES + 1 }, () => 'a.png') },
      'images'
    ],
    ['an image that is not a string', { images: [5] }, 'image name'],
    ['an image with a path', { images: ['../a.png'] }, 'image name'],
    ['an image with a directory', { images: ['a/b.png'] }, 'image name'],
    ['an image of another type', { images: ['a.svg'] }, 'image name'],
    ['an uppercase image', { images: ['A.png'] }, 'image name'],
    ['an image with a prefix', { images: ['x.png\n../y.png'] }, 'image name'],
    ['an image with a suffix', { images: ['a.pngx'] }, 'image name'],
    ['an image with a double hyphen', { images: ['a--b.png'] }, 'image name'],
    ['an image with a leading hyphen', { images: ['-a.png'] }, 'image name'],
    ['an image with a trailing hyphen', { images: ['a-.png'] }, 'image name'],
    ['an image with a symbol segment', { images: ['a-!.png'] }, 'image name']
  ])('rejects %s', (_what, overrides, reason) => {
    /**
     * Scenario: each malformed top-level field is rejected with its own reason.
     */
    expect(() => validateManifest(manifest(overrides))).toThrow(
      `invalid preview manifest: ${reason}`
    )
  })

  it.each([
    ['a missing name', { name: undefined }, 'icon name'],
    ['a numeric name', { name: 5 }, 'icon name'],
    ['an uppercase name', { name: 'Arrow' }, 'icon name'],
    ['a name with markup', { name: 'a`b' }, 'icon name'],
    ['a name with a suffix', { name: 'ab\n|' }, 'icon name'],
    ['a name with a prefix', { name: '|\nab' }, 'icon name'],
    ['an unknown variant', { variant: 'duotone' }, 'variant'],
    ['a variant with a prefix', { variant: 'xline' }, 'variant'],
    ['a variant with a suffix', { variant: 'linex' }, 'variant'],
    ['a flagged of the wrong type', { flagged: 'yes' }, 'flagged'],
    ['a missing flagged', { flagged: undefined }, 'flagged'],
    ['a primitive of the wrong type', { primitive: 1 }, 'primitive'],
    ['a missing primitive', { primitive: undefined }, 'primitive'],
    ['matches that are not a list', { matches: 'x' }, 'matches'],
    ['too many matches', { matches: [match(), match(), match(), match()] }, 'matches']
  ])('rejects an icon with %s', (_what, overrides, reason) => {
    /**
     * Scenario: each malformed icon field is rejected with its own reason.
     */
    expect(() => validateManifest(manifest({ icons: [icon(overrides)] }))).toThrow(
      `invalid preview manifest: ${reason}`
    )
  })

  it.each([
    ['a missing id', { id: undefined }, 'reference id'],
    ['a numeric id', { id: 5 }, 'reference id'],
    ['an id without a set', { id: 'arrow-up' }, 'reference id'],
    ['an uppercase set', { id: 'Lucide/arrow-up' }, 'reference id'],
    ['an id with a digit in the set', { id: 'lucide2/arrow-up' }, 'reference id'],
    ['an id with a nested path', { id: 'lucide/a/b' }, 'reference id'],
    ['an id with a suffix', { id: 'lucide/arrow\n![x]' }, 'reference id'],
    ['an id with a prefix', { id: '![x]\nlucide/arrow' }, 'reference id'],
    ['an id with an empty name', { id: 'lucide/' }, 'reference id'],
    ['an id with a double hyphen', { id: 'lucide/a--b' }, 'reference id'],
    ['a string distance', { distance: '0.5' }, 'distance'],
    ['a negative distance', { distance: -0.01 }, 'distance'],
    ['a huge distance', { distance: 1e9 + 1 }, 'distance'],
    ['an infinite distance', { distance: Infinity }, 'distance'],
    ['a negative overlap', { overlap: -0.01 }, 'overlap'],
    ['an overlap above one', { overlap: 1.01 }, 'overlap'],
    ['a string overlap', { overlap: '0' }, 'overlap'],
    ['a negative cosine', { cosine: -0.01 }, 'cosine'],
    ['a cosine above one', { cosine: 1.01 }, 'cosine'],
    ['a NaN cosine', { cosine: Number.NaN }, 'cosine']
  ])('rejects a match with %s', (_what, overrides, reason) => {
    /**
     * Scenario: each malformed match field is rejected with its own reason.
     */
    expect(() =>
      validateManifest(manifest({ icons: [icon({ matches: [match(overrides)] })] }))
    ).toThrow(`invalid preview manifest: ${reason}`)
  })

  it.each([
    ['a string', 'x'],
    ['null', null],
    ['an array', []]
  ])('rejects %s as an icon', (_what, value) => {
    /**
     * Scenario: an entry of `icons` must be an object too.
     */
    expect(() => validateManifest(manifest({ icons: [value] }))).toThrow(
      'invalid preview manifest: not an object'
    )
  })

  it('rejects a non-object match', () => {
    /**
     * Scenario: an entry of `matches` must be an object too.
     */
    expect(() => validateManifest(manifest({ icons: [icon({ matches: ['x'] })] }))).toThrow(
      'invalid preview manifest: not an object'
    )
  })

  it('accepts every bound exactly', () => {
    /**
     * Scenario: the largest and smallest allowed values pass, so each bound is pinned from
     * the inside.
     */
    const edge = manifest({
      pr: Number.MAX_SAFE_INTEGER,
      issues: 1e6,
      icons: Array.from({ length: MAX_ICONS }, () =>
        icon({
          matches: [
            match({ distance: 1e9, overlap: 1, cosine: 1 }),
            match({ distance: 0, overlap: 0, cosine: 0 }),
            match()
          ]
        })
      ),
      images: Array.from({ length: MAX_IMAGES }, (_unused, index) => `i${index}.png`)
    })
    expect(validateManifest(edge)).toStrictEqual(edge)
    expect(validateManifest(manifest({ pr: 1 })).pr).toBe(1)
  })

  it('accepts hyphenated image names and pins the comment marker', () => {
    /**
     * Scenario: an image name may have several multi-character segments, and the marker
     * that identifies the preview comment is a fixed HTML comment.
     */
    const named = manifest({ images: ['my-image-22.png'] })
    expect(validateManifest(named)).toStrictEqual(named)
    expect(COMMENT_MARKER).toBe('<!-- bymax-icons-preview -->')
  })

  it('accepts an icon with no matches and a variant of each kind', () => {
    /**
     * Scenario: matches may be empty, and filled and sm variants validate.
     */
    const kinds = manifest({
      icons: [
        icon({ variant: 'filled', matches: [] }),
        icon({ variant: 'sm', primitive: true, flagged: true })
      ]
    })
    expect(validateManifest(kinds)).toStrictEqual(kinds)
  })
})

describe('isPublishablePng', () => {
  const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

  it('accepts a signature alone', () => {
    /**
     * Scenario: eight signature bytes are the shortest accepted file.
     */
    expect(isPublishablePng(Uint8Array.from(SIGNATURE))).toBe(true)
  })

  it('accepts a PNG with a body', () => {
    /**
     * Scenario: a signature followed by data is a PNG.
     */
    expect(isPublishablePng(Uint8Array.from([...SIGNATURE, 1, 2, 3]))).toBe(true)
  })

  it('accepts a PNG of exactly the largest size and rejects one byte more', () => {
    /**
     * Scenario: the size limit is inclusive.
     */
    const at = new Uint8Array(MAX_IMAGE_BYTES)
    at.set(SIGNATURE)
    expect(isPublishablePng(at)).toBe(true)
    const over = new Uint8Array(MAX_IMAGE_BYTES + 1)
    over.set(SIGNATURE)
    expect(isPublishablePng(over)).toBe(false)
  })

  it('rejects an empty buffer and a buffer shorter than the signature', () => {
    /**
     * Scenario: a buffer that cannot hold the signature is not a PNG, even with a matching
     * prefix.
     */
    expect(isPublishablePng(new Uint8Array(0))).toBe(false)
    expect(isPublishablePng(Uint8Array.from(SIGNATURE.slice(0, 7)))).toBe(false)
  })

  it.each(SIGNATURE.map((_byte, index) => index))(
    'rejects a file whose signature byte %i is wrong',
    (index) => {
      /**
       * Scenario: every one of the eight signature bytes is checked.
       */
      const bytes = Uint8Array.from([...SIGNATURE, 1])
      bytes[index] = 0
      expect(isPublishablePng(bytes)).toBe(false)
    }
  )

  it('rejects text and SVG bytes', () => {
    /**
     * Scenario: a file that is not a PNG is refused whatever its length.
     */
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
    expect(isPublishablePng(svg)).toBe(false)
  })
})

describe('commentBody', () => {
  const url = (file: string): string => `https://img.example/${file}`

  it('writes the lint-failure comment', () => {
    /**
     * Scenario: a failed lint says how many issues were found and that nothing was
     * rendered, and carries no image and no table.
     */
    const body = commentBody(validateManifest(manifest({ lint: 'failed', issues: 3 })), url)
    expect(body).toBe(
      [
        COMMENT_MARKER,
        '### Icon preview for aaaaaaa',
        '',
        'The icon lint found 3 issue(s) in the changed drawings, so nothing was rendered. The details are in the log of the icon preview check.',
        ''
      ].join('\n')
    )
  })

  it('writes the comment of a passed manifest, with each verdict', () => {
    /**
     * Scenario: a passed manifest lists its images, then one row an icon with the verdict
     * (clear, flagged and primitive, flagged for review) and the scores of every match.
     */
    const passed = validateManifest(
      manifest({
        images: ['preview.png', 'similarity.png'],
        icons: [
          icon({ name: 'ring', variant: 'line' }),
          icon({ name: 'dot', variant: 'sm', flagged: true, primitive: true, matches: [] }),
          icon({
            name: 'bolt',
            variant: 'filled',
            flagged: true,
            matches: [
              match({ id: 'lucide/zap', distance: 0.1234, overlap: 0.5, cosine: 0.999 }),
              match({ id: 'tabler/bolt', distance: 2, overlap: 0, cosine: 1 })
            ]
          })
        ]
      })
    )
    expect(commentBody(passed, url)).toBe(
      [
        COMMENT_MARKER,
        '### Icon preview for aaaaaaa',
        '',
        '![preview.png](https://img.example/preview.png)',
        '![similarity.png](https://img.example/similarity.png)',
        '',
        '| Icon | Similarity | Nearest third-party icons |',
        '| --- | --- | --- |',
        '| `ring` (line) | clear | `lucide/arrow-up` d=0.50 iou=0.25 cos=0.75 |',
        '| `dot` (sm) | flagged, primitive (expected) |  |',
        '| `bolt` (filled) | **flagged, review** | `lucide/zap` d=0.12 iou=0.50 cos=1.00<br>`tabler/bolt` d=2.00 iou=0.00 cos=1.00 |',
        '',
        'A flag asks for a human review of the resemblance; it does not fail the pull request.',
        ''
      ].join('\n')
    )
  })

  it('writes a comment with no image and no icon', () => {
    /**
     * Scenario: a passed manifest with nothing to show still writes the table header.
     */
    const empty = validateManifest(manifest({ icons: [], images: [], head: 'b'.repeat(40) }))
    expect(commentBody(empty, url)).toBe(
      [
        COMMENT_MARKER,
        '### Icon preview for bbbbbbb',
        '',
        '',
        '| Icon | Similarity | Nearest third-party icons |',
        '| --- | --- | --- |',
        '',
        'A flag asks for a human review of the resemblance; it does not fail the pull request.',
        ''
      ].join('\n')
    )
  })
})
