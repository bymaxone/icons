/**
 * Unit tests for the provenance of the brand marks.
 *
 * Layer: unit.
 * Goal: prove that every brand record names the file its path data was taken from: a mark
 * under CC0-1.0 comes from Simple Icons, so its `source` is that mark's file at the pinned
 * version of the `simple-icons` development dependency, and the file exists there.
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
     * Scenario: `source` is where the path data was taken from (schemas/brand.schema.json);
     * a CC0-1.0 mark comes from Simple Icons, so it names that mark's file, which exists in
     * the installed package.
     */
    const meta = BRAND_METADATA[name]
    expect(meta.license).toBe('CC0-1.0')
    expect(meta.source).toBe(
      `https://github.com/simple-icons/simple-icons/blob/${SIMPLE_ICONS}/icons/${name}.svg`
    )
    expect(existsSync(join(ROOT, 'node_modules', 'simple-icons', 'icons', `${name}.svg`))).toBe(
      true
    )
  })

  it.each(BRAND_NAMES)('lists %s in TRADEMARKS.md with its guidelines', (name) => {
    /**
     * Scenario: every shipped brand has a line in TRADEMARKS.md (AGENTS.md, "Brand marks are
     * official geometry"), naming the mark and linking the owner's guidelines.
     */
    const trademarks = readFileSync(join(ROOT, 'TRADEMARKS.md'), 'utf8')
    const meta = BRAND_METADATA[name]
    expect(trademarks).toContain(
      `- **${meta.title}** (\`${name}\`): [brand guidelines](${meta.guidelines})`
    )
  })
})
