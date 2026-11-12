/**
 * Unit tests for the family sheet.
 *
 * Layer: unit.
 * Goal: pin how drawings are grouped (first category, categories.json order, brands last,
 * empty groups dropped, the highlight flag) and the layout, colours and escaping of the
 * composed sheet.
 * Mocks: none.
 */

import { placedDrawing, SHEET_THEMES } from './contact-sheet.ts'
import { brandMeta, drawing, iconMeta, sources } from './__tests__/support.ts'
import { FAMILY_COLUMNS, composeFamilySheet, familyGroups } from './family-sheet.ts'
import type { FamilyGroup, FamilyMember } from './family-sheet.ts'
import { lintSources } from './lint.ts'

const CIRCLE = '<circle cx="12" cy="12" r="7.25"/>'

const MEMBER: FamilyMember = {
  name: 'ring',
  label: 'ring',
  kind: 'line',
  elements: [{ tag: 'circle', attributes: { cx: '12', cy: '12', r: '7.25' } }],
  highlighted: false
}

describe('familyGroups', () => {
  const { set } = lintSources(
    sources({
      line: {
        'ring.svg': drawing('line', CIRCLE),
        'arrow.svg': drawing('line', CIRCLE),
        'gear.svg': drawing('line', CIRCLE)
      },
      filled: { 'ring.svg': drawing('filled', '<circle cx="12" cy="12" r="8"/>') },
      brands: { 'acme.svg': drawing('brands', '<path d="M4 4h16v16H4z"/>') },
      meta: {
        'ring.json': iconMeta({ categories: ['system', 'actions'], variants: ['line', 'filled'] }),
        'arrow.json': iconMeta({ categories: ['navigation'] }),
        'gear.json': iconMeta({ categories: ['system'] }),
        'acme.json': brandMeta()
      }
    })
  )

  it('groups by first category in categories.json order, then brands, dropping empty groups', () => {
    /**
     * Scenario: navigation comes before system in categories.json; a second category does
     * not place the icon again; categories with no drawing do not appear; brands are last.
     */
    const groups = familyGroups(set, new Set())
    expect(groups.map((group) => group.title)).toStrictEqual([
      'Navigation and layout',
      'System and settings',
      'Brands'
    ])
    expect(groups.map((group) => group.members.map((member) => member.label))).toStrictEqual([
      ['arrow'],
      ['gear', 'ring', 'ring (filled)'],
      ['acme']
    ])
    expect(groups.flatMap((group) => group.members.map((member) => member.kind))).toStrictEqual([
      'line',
      'line',
      'line',
      'filled',
      'brands'
    ])
    expect(groups[2]?.members[0]?.elements[0]?.tag).toBe('path')
    expect(groups[0]?.members[0]?.elements[0]?.tag).toBe('circle')
  })

  it('flags the members named in the highlight set, brands included', () => {
    /**
     * Scenario: every variant of a highlighted icon is highlighted, and so is a brand;
     * the others are not.
     */
    const groups = familyGroups(set, new Set(['ring', 'acme']))
    expect(
      groups.flatMap((group) => group.members.map((m) => [m.name, m.highlighted]))
    ).toStrictEqual([
      ['arrow', false],
      ['gear', false],
      ['ring', true],
      ['ring', true],
      ['acme', true]
    ])
  })

  it('is empty for an empty set', () => {
    /**
     * Scenario: no drawing, no group, not even Brands.
     */
    expect(familyGroups(lintSources(sources({})).set, new Set())).toStrictEqual([])
  })
})

describe('composeFamilySheet', () => {
  it('composes exactly the expected document for one group of two drawings', () => {
    /**
     * Scenario: the whole output for a small sheet, so the joins, the fonts and the
     * absence of stray text are all pinned.
     */
    const font = 'font-family="Helvetica, Arial, sans-serif"'
    const second = { ...MEMBER, label: 'two' }
    const panels = SHEET_THEMES.map((theme, t) => {
      const left = t * 736
      const ink = theme.colours[0][1]
      const cell = (member: FamilyMember, dx: number): string =>
        [
          '',
          placedDrawing(member, left + 16 + dx, 28, 48, ink),
          placedDrawing(member, left + 2 + dx, 62, 24, ink),
          placedDrawing(member, left + 30 + dx, 66, 16, ink),
          `<text x="${left + 14 + dx}" y="116" fill="${ink}" font-size="9" ${font}>${member.label}</text>`
        ].join('')
      return [
        `<rect x="${left}" y="0" width="736" height="124" fill="${theme.background}"/>`,
        `<text x="${left + 8}" y="19" fill="${ink}" font-size="13" ${font}>T</text>${cell(MEMBER, 0)}${cell(second, 72)}`
      ].join('\n')
    })
    expect(composeFamilySheet([{ title: 'T', members: [MEMBER, second] }])).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="1472" height="124" viewBox="0 0 1472 124">',
        ...panels,
        '</svg>',
        ''
      ].join('\n')
    )
  })

  it('composes exactly the expected document with no group', () => {
    /**
     * Scenario: the empty sheet is each page's background and its note, nothing else.
     */
    const font = 'font-family="Helvetica, Arial, sans-serif"'
    const panels = SHEET_THEMES.map((theme, t) =>
      [
        `<rect x="${t * 736}" y="0" width="736" height="28" fill="${theme.background}"/>`,
        `<text x="${t * 736 + 8}" y="19" fill="${theme.colours[0][1]}" font-size="13" ${font}>No drawing yet.</text>`
      ].join('\n')
    )
    expect(composeFamilySheet([])).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="1472" height="28" viewBox="0 0 1472 28">',
        ...panels,
        '</svg>',
        ''
      ].join('\n')
    )
  })

  it('holds a note on each page when there is no group', () => {
    /**
     * Scenario: an empty set still gives a valid sheet, 1472 by 28 px, light and dark.
     */
    const svg = composeFamilySheet([])
    expect(svg).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1472" height="28" viewBox="0 0 1472 28">'
    )
    expect(svg).toContain('<rect x="0" y="0" width="736" height="28" fill="#e9eff3"/>')
    expect(svg).toContain('<rect x="736" y="0" width="736" height="28" fill="')
    expect(svg.match(/No drawing yet\./g)).toHaveLength(2)
    expect(svg).toContain('<text x="8" y="19" fill="#0d1b24" font-size="13"')
    expect(svg.endsWith('</svg>\n')).toBe(true)
  })

  it('has no note when there is a group', () => {
    /**
     * Scenario: the note is only for an empty sheet.
     */
    expect(composeFamilySheet([{ title: 'T', members: [MEMBER] }])).not.toContain('No drawing yet')
  })

  it('titles each group and stacks them, on both pages', () => {
    /**
     * Scenario: a group is its title and ceil(members / columns) rows of 96 px, so a
     * second group starts below the first; the sheet is as tall as the groups together.
     */
    expect(FAMILY_COLUMNS).toBe(10)
    const many = Array.from({ length: 11 }, () => MEMBER)
    const groups: FamilyGroup[] = [
      { title: 'First', members: many },
      { title: 'Second', members: [MEMBER] }
    ]
    const svg = composeFamilySheet(groups)
    // First: 28 + 2 * 96 = 220. Second: 28 + 96 = 124. Total 344.
    expect(svg).toContain('width="1472" height="344" viewBox="0 0 1472 344"')
    expect(svg).toContain('<rect x="0" y="0" width="736" height="344" fill="#e9eff3"/>')
    expect(svg).toContain('<text x="8" y="19" fill="#0d1b24" font-size="13"')
    expect(svg).toContain('>First</text>')
    expect(svg).toContain('<text x="8" y="239" fill="#0d1b24" font-size="13"')
    expect(svg).toContain('<text x="744" y="19" ')
    expect(svg).toContain('<text x="744" y="239" ')
    expect(svg.match(/>First<\/text>/g)).toHaveLength(2)
    expect(svg.match(/>Second<\/text>/g)).toHaveLength(2)
  })

  it('places each member by column and row, with its name under it', () => {
    /**
     * Scenario: the eleventh member wraps to the second row and the first column; the
     * name sits 8 px above the cell's bottom edge in the ink.
     */
    const members = Array.from({ length: 11 }, (_, index) => ({ ...MEMBER, label: `m${index}` }))
    const svg = composeFamilySheet([{ title: 'G', members }])
    expect(svg).toContain('<text x="14" y="116" fill="#0d1b24" font-size="9"')
    expect(svg).toContain('>m0</text>')
    expect(svg).toContain('<text x="86" y="116" ')
    expect(svg).toContain('<text x="14" y="212" ')
    expect(svg).toContain('>m10</text>')
    expect(svg).toContain('<text x="750" y="116" ')
    // 48 px at +8, 24 px at (-6, +34), 16 px at (+22, +38), in a 56 px square.
    expect(svg).toContain('transform="translate(20 32) scale(2)"')
    expect(svg).toContain('transform="translate(18 78) scale(1)"')
    expect(svg).toContain('transform="translate(50 86) scale(0.6666666666666666)"')
  })

  it('outlines only the highlighted members, in each page outline colour', () => {
    /**
     * Scenario: the batch under review is boxed in the page's outline colour; the
     * others are not.
     */
    const svg = composeFamilySheet([
      { title: 'G', members: [MEMBER, { ...MEMBER, label: 'b', highlighted: true }] }
    ])
    const outlines = svg.match(/<rect x="\d+" y="\d+" width="68" height="92"[^>]*>/g) ?? []
    expect(outlines).toHaveLength(2)
    expect(outlines[0]).toBe(
      '<rect x="82" y="30" width="68" height="92" rx="8" fill="none" stroke="#2450b8" stroke-width="2"/>'
    )
    expect(outlines[1]).toContain('x="818"')
    expect(outlines[1]).toContain('stroke="#7fa6ff"')
  })

  it('escapes ampersands and angle brackets in titles and labels', () => {
    /**
     * Scenario: text is data, never markup.
     */
    const svg = composeFamilySheet([
      { title: 'A & <B>', members: [{ ...MEMBER, label: 'x & <y>' }] }
    ])
    expect(svg).toContain('>A &amp; &lt;B></text>')
    expect(svg).toContain('>x &amp; &lt;y></text>')
  })
})
