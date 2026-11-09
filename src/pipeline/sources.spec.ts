/**
 * Unit tests for reading the sources from disk.
 *
 * Layer: unit, on scratch directories.
 * Goal: prove every file of the layout is read with its path, that missing directories
 * are empty ones, that anything outside the layout is reported as a stray, and that a
 * schema file that is not an object is refused.
 * Mocks: none.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { removeScratch, SCHEMAS, scratchRepository } from './__tests__/support.ts'
import { readSources } from './sources.ts'

describe('readSources', () => {
  let root: string

  afterEach(() => removeScratch(root))

  it('reads every file of the layout with its path from the root', () => {
    /**
     * Scenario: each directory's files are read as text, and the path every message
     * uses is the one from the repository root, with `/` separators.
     */
    root = scratchRepository({
      'icons/line/a.svg': '<svg/>',
      'icons/filled/a.svg': '<svg>f</svg>',
      'icons/sm/a.svg': '<svg>s</svg>',
      'icons/brands/b.svg': '<svg>b</svg>',
      'icons/meta/a.json': '{}',
      'icons/README.md': '# layout'
    })
    const sources = readSources({ root, icons: 'icons' })
    expect(sources.svg).toStrictEqual({
      line: [{ fileName: 'a.svg', path: 'icons/line/a.svg', text: '<svg/>' }],
      filled: [{ fileName: 'a.svg', path: 'icons/filled/a.svg', text: '<svg>f</svg>' }],
      sm: [{ fileName: 'a.svg', path: 'icons/sm/a.svg', text: '<svg>s</svg>' }],
      brands: [{ fileName: 'b.svg', path: 'icons/brands/b.svg', text: '<svg>b</svg>' }]
    })
    expect(sources.meta).toStrictEqual([
      { fileName: 'a.json', path: 'icons/meta/a.json', text: '{}' }
    ])
    expect(sources.strays).toStrictEqual([])
    expect(sources.schemas).toStrictEqual(SCHEMAS)
    expect(sources.categories.path).toBe('categories.json')
    expect(sources.categories.fileName).toBe('categories.json')
    expect(JSON.parse(sources.categories.text)).toHaveProperty('categories')
  })

  it('reads a missing icons directory, or a missing source directory, as empty', () => {
    /**
     * Scenario: a set with no filled variant or no brand needs no placeholder directory,
     * and a repository with no drawing yet needs no icons directory at all.
     */
    root = scratchRepository()
    const sources = readSources({ root, icons: 'icons' })
    expect(sources.svg).toStrictEqual({ line: [], filled: [], sm: [], brands: [] })
    expect(sources.meta).toStrictEqual([])
    expect(sources.strays).toStrictEqual([])
  })

  it('reads another icons directory, such as the fixtures', () => {
    /**
     * Scenario: every command accepts `--icons <dir>`, and the paths it reports start
     * there.
     */
    root = scratchRepository({ 'fixtures/icons/line/a.svg': '<svg/>' })
    expect(readSources({ root, icons: 'fixtures/icons' }).svg.line).toStrictEqual([
      { fileName: 'a.svg', path: 'fixtures/icons/line/a.svg', text: '<svg/>' }
    ])
  })

  it('reports every entry outside the layout as a stray', () => {
    /**
     * Scenario: the icons directory holds the five source directories and its README;
     * a directory inside a source directory, a file where a directory belongs, a
     * directory named like the README, or anything else, is reported.
     */
    root = scratchRepository({
      'icons/line/nested/a.svg': '<svg/>',
      'icons/notes.txt': 'x',
      'icons/extra/a.svg': '<svg/>',
      'icons/README.md/x': 'x'
    })
    writeFileSync(join(root, 'icons', 'filled'), 'not a directory')
    mkdirSync(join(root, 'icons', 'meta', 'deeper'), { recursive: true })
    const strays = [...readSources({ root, icons: 'icons' }).strays].sort()
    expect(strays).toStrictEqual([
      'icons/README.md',
      'icons/extra',
      'icons/filled',
      'icons/line/nested',
      'icons/meta/deeper',
      'icons/notes.txt'
    ])
  })

  it('refuses a schema file that is not a JSON object', () => {
    /**
     * Scenario: ajv compiles objects; a schema file holding `null` or a number is a broken
     * checkout, reported with the file it is.
     */
    root = scratchRepository({ 'schemas/brand.schema.json': 'null' })
    expect(() => readSources({ root, icons: 'icons' })).toThrow(
      new TypeError('schemas/brand.schema.json is not a JSON object.')
    )
    removeScratch(root)
    root = scratchRepository({ 'schemas/category.schema.json': '7' })
    expect(() => readSources({ root, icons: 'icons' })).toThrow(
      new TypeError('schemas/category.schema.json is not a JSON object.')
    )
  })
})
