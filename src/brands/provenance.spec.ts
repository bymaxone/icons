/**
 * Unit tests for the provenance of the brand marks.
 *
 * Layer: unit.
 * Goal: prove that every brand record names the file its path data was taken from at the pinned
 * version of the `simple-icons` development dependency, that the file exists there, that the
 * record carries the licence Simple Icons states for it, that the owner's guidelines page is
 * recorded with the day it was read, and that a licence that asks for attribution has it.
 * Mocks: none.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { BRAND_METADATA, BRAND_NAMES } from '../meta/icon-metadata'

const ROOT = join(__dirname, '..', '..')
const PACKAGE = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
  devDependencies: Record<string, string>
}
const SIMPLE_ICONS = PACKAGE.devDependencies['simple-icons']
const TRADEMARKS = readFileSync(join(ROOT, 'TRADEMARKS.md'), 'utf8')
const EVIDENCE = readFileSync(join(ROOT, 'docs', 'brands', 'guidelines-evidence.md'), 'utf8')
const LICENSES = new Map(
  (
    JSON.parse(
      readFileSync(join(ROOT, 'node_modules', 'simple-icons', 'data', 'simple-icons.json'), 'utf8')
    ) as { slug: string; license?: { type: string } }[]
  ).map((entry) => [entry.slug, entry.license?.type ?? 'CC0-1.0'])
)

/** The Simple Icons file name a record's `source` points at, without its extension. */
function sourceSlug(source: string): string {
  return source.slice(source.lastIndexOf('/') + 1, -'.svg'.length)
}

describe('brand provenance', () => {
  it('pins the source of the path data to an exact version', () => {
    /**
     * Scenario: the version in `source` must be the one the marks were taken from; a range
     * would let the recorded file drift from the installed one.
     */
    expect(SIMPLE_ICONS).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it.each(BRAND_NAMES)('names the Simple Icons file of %s as its source', (name) => {
    /**
     * Scenario: `source` is where the path data was taken from (schemas/brand.schema.json): a
     * file of Simple Icons at the pinned version, which exists in the installed package. The
     * file is named by the brand's Simple Icons slug, which differs from the package's name for
     * a few marks (`nodedotjs` is `nodejs`).
     */
    const meta = BRAND_METADATA[name]
    const slug = sourceSlug(meta.source)
    expect(meta.source).toBe(
      `https://github.com/simple-icons/simple-icons/blob/${SIMPLE_ICONS}/icons/${slug}.svg`
    )
    expect(existsSync(join(ROOT, 'node_modules', 'simple-icons', 'icons', `${slug}.svg`))).toBe(
      true
    )
  })

  it.each(BRAND_NAMES)('records the licence Simple Icons states for %s', (name) => {
    /**
     * Scenario: the `license` of a mark is the one Simple Icons states for it, CC0-1.0 when it
     * states none, so a mark under another licence cannot be shipped as if it were public domain.
     */
    const meta = BRAND_METADATA[name]
    expect(meta.license).toBe(LICENSES.get(sourceSlug(meta.source)))
  })

  it.each(BRAND_NAMES)('lists %s in TRADEMARKS.md with its guidelines', (name) => {
    /**
     * Scenario: every shipped brand has a line in TRADEMARKS.md (AGENTS.md, "Brand marks are
     * official geometry"), naming the mark and linking the owner's guidelines.
     */
    const meta = BRAND_METADATA[name]
    expect(TRADEMARKS).toContain(
      `- **${meta.title}** (\`${name}\`): [brand guidelines](${meta.guidelines})`
    )
  })

  it.each(BRAND_NAMES)('holds the evidence of the guidelines page of %s', (name) => {
    /**
     * Scenario: the guidelines address of a mark is on file with the page that was read and the
     * day it was opened, in docs/brands/guidelines-evidence.md, so an address nobody read cannot
     * be shipped.
     */
    const meta = BRAND_METADATA[name]
    const cells = EVIDENCE.split('\n')
      .map((line) => line.split(/(?<!\\)\|/).map((cell) => cell.trim()))
      .find((row) => row[1] === `\`${name}\``)
    expect(cells?.[2]).toBe(meta.guidelines)
    expect(cells?.[5]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it.each(BRAND_NAMES.filter((name) => BRAND_METADATA[name].license !== 'CC0-1.0'))(
    'carries the attribution of %s',
    (name) => {
      /**
       * Scenario: a mark under a licence that asks for credit has its attribution line in
       * TRADEMARKS.md, under the heading for licensed marks.
       */
      const section = TRADEMARKS.slice(TRADEMARKS.indexOf('## Marks under another licence'))
      expect(section).toContain(`(\`${name}\`)`)
    }
  )
})
