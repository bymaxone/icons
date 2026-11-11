/**
 * @fileoverview The family sheet a drawing batch is reviewed beside: every drawing of the
 * set, grouped by its first category, at 48, 24 and 16 px, on the light and the dark
 * Studio page side by side, with the drawings of the batch under review outlined.
 * @layer Pipeline
 */

import { SHEET_THEMES, placedDrawing } from './contact-sheet.ts'
import type { SheetRow } from './contact-sheet.ts'
import { drawnVariants } from './icon-set.ts'
import type { IconSet } from './icon-set.ts'

/** One drawing on the family sheet. */
export interface FamilyMember extends SheetRow {
  readonly name: string
  /** Whether it belongs to the batch under review. */
  readonly highlighted: boolean
}

/** A titled group of drawings. */
export interface FamilyGroup {
  readonly title: string
  readonly members: readonly FamilyMember[]
}

/** Drawings per row of a group. */
export const FAMILY_COLUMNS = 10
/** The width of a member's cell, in px. */
const CELL_WIDTH = 72
/** The height of a member's cell, in px. */
const CELL_HEIGHT = 96
/** The height of a group's title, in px. */
const TITLE_HEIGHT = 28
const FONT = 'font-family="Helvetica, Arial, sans-serif"'

/**
 * Groups every drawing by the first category of its icon, in the order of
 * `categories.json`, then the brand marks; each group in name and variant order.
 *
 * @param set - The icon set.
 * @param highlight - The names of the icons and brands under review.
 * @returns The groups that hold a drawing.
 */
export function familyGroups(set: IconSet, highlight: ReadonlySet<string>): FamilyGroup[] {
  const groups = set.categories.map((category) => ({
    title: category.title,
    members: set.icons
      .filter((icon) => icon.meta.categories[0] === category.name)
      .flatMap((icon) =>
        drawnVariants(icon).map(([variant, drawing]) => ({
          name: icon.name,
          label: variant === 'line' ? icon.name : `${icon.name} (${variant})`,
          kind: variant,
          elements: drawing.elements,
          highlighted: highlight.has(icon.name)
        }))
      )
  }))
  const brands = {
    title: 'Brands',
    members: set.brands.map((brand) => ({
      name: brand.name,
      label: brand.name,
      kind: 'brands' as const,
      elements: brand.drawing.elements,
      highlighted: highlight.has(brand.name)
    }))
  }
  return [...groups, brands].filter((group) => group.members.length > 0)
}

/** The height of a group: its title and its rows of cells. */
function groupHeight(group: FamilyGroup): number {
  return TITLE_HEIGHT + Math.ceil(group.members.length / FAMILY_COLUMNS) * CELL_HEIGHT
}

/** A text element, with its content escaped. */
function text(x: number, y: number, fill: string, size: number, content: string): string {
  const escaped = content.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  return `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" ${FONT}>${escaped}</text>`
}

/** One member's cell: the drawing at 48 px, then at 24 and 16 px, and its name. */
function memberCell(
  member: FamilyMember,
  x: number,
  y: number,
  ink: string,
  outline: string
): string {
  // `placedDrawing` centres a drawing in a 56 px square; these offsets place each size.
  return [
    member.highlighted
      ? `<rect x="${x + 2}" y="${y + 2}" width="${CELL_WIDTH - 4}" height="${CELL_HEIGHT - 4}" rx="8" fill="none" stroke="${outline}" stroke-width="2"/>`
      : '',
    placedDrawing(member, x + 8, y, 48, ink),
    placedDrawing(member, x - 6, y + 34, 24, ink),
    placedDrawing(member, x + 22, y + 38, 16, ink),
    text(x + 6, y + CELL_HEIGHT - 8, ink, 9, member.label)
  ].join('')
}

/**
 * Composes the family sheet: the light page on the left, the dark page on the right, each
 * with every group.
 *
 * @param groups - The groups.
 * @returns The sheet's SVG text. With no group it holds a note.
 */
export function composeFamilySheet(groups: readonly FamilyGroup[]): string {
  const panelWidth = FAMILY_COLUMNS * CELL_WIDTH + 16
  const height = Math.max(
    groups.reduce((total, group) => total + groupHeight(group), 0),
    TITLE_HEIGHT
  )
  const panels = SHEET_THEMES.map((theme, t) => {
    const left = t * panelWidth
    const ink = theme.colours[0][1]
    let top = 0
    const body = groups.map((group) => {
      const title = text(left + 8, top + 19, ink, 13, group.title)
      const cells = group.members.map((member, index) => {
        const x = left + 8 + (index % FAMILY_COLUMNS) * CELL_WIDTH
        const y = top + TITLE_HEIGHT + Math.floor(index / FAMILY_COLUMNS) * CELL_HEIGHT
        return memberCell(member, x, y, ink, theme.outline)
      })
      top += groupHeight(group)
      return title + cells.join('')
    })
    const note = groups.length === 0 ? [text(left + 8, 19, ink, 13, 'No drawing yet.')] : []
    return [
      `<rect x="${left}" y="0" width="${panelWidth}" height="${height}" fill="${theme.background}"/>`,
      ...note,
      ...body
    ].join('\n')
  })
  const width = panelWidth * SHEET_THEMES.length
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    ...panels,
    '</svg>',
    ''
  ].join('\n')
}
