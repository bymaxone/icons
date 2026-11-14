/**
 * Unit tests for the provenance of the country flags.
 *
 * Layer: unit, over the committed flags and the installed `country-flag-icons`.
 * Goal: prove that every flag names the file its drawing was taken from at the pinned version
 * of the `country-flag-icons` development dependency, that the file exists there, that the
 * drawing keeps the shapes and the path data of that file, that the set is the codes spec
 * section 5.1 names, and that TRADEMARKS.md carries the notice the licence asks for.
 * Mocks: none.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { FLAG_METADATA, FLAG_NAMES } from '../meta'
import { parseSvg, svgRoot } from '../pipeline/svg.ts'
import type { SvgElementNode } from '../pipeline/svg.ts'

const ROOT = join(__dirname, '..', '..')
const PACKAGE = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
  devDependencies: Record<string, string>
}
const SOURCE = join(ROOT, 'node_modules', 'country-flag-icons')
const SOURCE_PACKAGE = JSON.parse(readFileSync(join(SOURCE, 'package.json'), 'utf8')) as {
  version: string
  license: string
}
const VERSION = PACKAGE.devDependencies['country-flag-icons']
const TRADEMARKS = readFileSync(join(ROOT, 'TRADEMARKS.md'), 'utf8')

/**
 * The flags of the source that are not shipped, deferred to 1.x as the founder's decision
 * (spec section 5.1): Kosovo, the de facto states, the reserved codes and the subdivisions.
 */
const DEFERRED = [
  'AC',
  'BQ-BO',
  'BQ-SA',
  'BQ-SE',
  'ES-CT',
  'GB-ENG',
  'GB-NIR',
  'GB-SCT',
  'GB-WLS',
  'IC',
  'TA',
  'XA',
  'XC',
  'XK',
  'XO'
]

/** The shapes of a drawing with their geometry, in paint order, whatever groups hold them. */
function shapes(text: string): [string, Record<string, string>][] {
  const root = svgRoot(parseSvg(text)) as SvgElementNode
  const found: [string, Record<string, string>][] = []
  const walk = (nodes: SvgElementNode['children']): void => {
    for (const node of nodes) {
      if (node.type !== 'element') continue
      if (node.name === 'g') walk(node.children)
      else {
        const geometry = Object.entries(node.attributes).filter(([name]) =>
          ['d', 'points', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height'].includes(name)
        )
        found.push([node.name, Object.fromEntries(geometry)])
      }
    }
  }
  walk(root.children)
  return found
}

describe('flag provenance', () => {
  it('pins the source of the drawings to an exact version, the one installed', () => {
    /**
     * Scenario: the version in `source` must be the one the drawings were taken from; a range
     * would let the recorded file drift from the installed one.
     */
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/)
    expect(SOURCE_PACKAGE.version).toBe(VERSION)
  })

  it('ships the assigned ISO 3166-1 codes and the European Union, and defers the rest', () => {
    /**
     * Scenario: the set is the files of the source less the deferred ones (spec section 5.1),
     * so a flag added or dropped by accident, or a deferred one shipped, fails here.
     */
    const files = readdirSync(join(SOURCE, '3x2'))
      .filter((file) => file.endsWith('.svg'))
      .map((file) => file.slice(0, -'.svg'.length))
    const shipped = FLAG_NAMES.map((name) => FLAG_METADATA[name].code)
    expect(shipped).toHaveLength(250)
    expect(new Set(shipped).size).toBe(250)
    expect([...shipped, ...DEFERRED].sort()).toStrictEqual([...files].sort())
  })

  it.each(FLAG_NAMES)('names the file of %s in the source as its source', (name) => {
    /**
     * Scenario: `source` is where the drawing was taken from (schemas/flag.schema.json): the
     * file of the code at the pinned version, which exists in the installed package, and the
     * name is the lower-case code and `-flag`.
     */
    const meta = FLAG_METADATA[name]
    expect(name).toBe(`${meta.code.toLowerCase()}-flag`)
    expect(meta.source).toBe(
      `https://gitlab.com/catamphetamine/country-flag-icons/-/blob/v${VERSION}/flags/3x2/${meta.code}.svg`
    )
    expect(existsSync(join(SOURCE, '3x2', `${meta.code}.svg`))).toBe(true)
    expect(meta.license).toBe(SOURCE_PACKAGE.license)
  })

  it.each(FLAG_NAMES)('keeps the view box, the shapes and the path data of %s', (name) => {
    /**
     * Scenario: a flag is official geometry kept as published: its view box, its shapes in
     * paint order and the geometry of each, path data included, equal the source's, whatever the
     * formatter did to groups, colours and attributes.
     */
    const { code } = FLAG_METADATA[name]
    const source = readFileSync(join(SOURCE, '3x2', `${code}.svg`), 'utf8')
    const flag = readFileSync(join(ROOT, 'icons', 'flags', `${name}.svg`), 'utf8')
    const viewBox = (text: string): string | undefined =>
      svgRoot(parseSvg(text))?.attributes['viewBox']
    expect(viewBox(flag)).toBe(viewBox(source))
    expect(shapes(flag)).toStrictEqual(shapes(source))
  })

  it('carries the notice of the licence and what the package says of flags', () => {
    /**
     * Scenario: the MIT licence asks that its copyright and permission notice go with copies;
     * TRADEMARKS.md holds it under "Country flags", with the statements spec section 5.1 lists.
     */
    const section = TRADEMARKS.slice(TRADEMARKS.indexOf('## Country flags'))
      .replace(/\n>\s?/g, ' ')
      .replace(/\s+/g, ' ')
    expect(section.startsWith('## Country flags')).toBe(true)
    expect(section).toContain('Copyright (c) 2020 @catamphetamine')
    expect(section).toContain('Permission is hereby granted, free of charge')
    expect(section).toContain('implies no position on sovereignty or recognition')
    for (const code of ['XK', 'XA', 'XC', 'XO']) expect(section).toContain(`\`${code}\``)
  })
})
