/**
 * Integration tests for fixed-weight artwork across drawing sources and consumers.
 * @layer Pipeline tests
 */
import { iconMeta, sources } from './__tests__/support.ts'
import { placedDrawing, sheetRows } from './contact-sheet.ts'
import { sprite } from './emit-data.ts'
import { componentModules } from './emit-modules.ts'
import { familyGroups } from './family-sheet.ts'
import { inkIssues } from './lint-ink.ts'
import { lintSources } from './lint.ts'
import { similarityEntries } from './similarity-report.ts'
import { sixteenDrawings } from './sixteen.ts'
import { normalizeSvg } from './svg.ts'
import { visualTargets } from './visual.ts'

const source =
  '<svg fill="currentColor"><path fill-rule="evenodd" d="M5 5h14v14H5zM6 6h12v12H6z"/></svg>'
const line = normalizeSvg(source, 'line')
const sm = normalizeSvg(source, 'sm')
const catalog = lintSources(
  sources({
    line: { 'frame.svg': line },
    sm: { 'frame.svg': sm },
    meta: { 'frame.json': iconMeta({ variants: ['line', 'sm'], opticalSizes: [24, 16] }) }
  })
)

describe('fixed-weight contours', () => {
  it('preserves holes and native sizes throughout generation', () => {
    // Scenario: an outlined frame has a hole at both optical sizes.
    expect(catalog.issues).toEqual([])
    expect(sm).toContain('width="16" height="16"')
    expect(normalizeSvg(sm, 'sm')).toBe(sm)
    expect(line).toContain('fill-rule="evenodd"')
    const modules = componentModules(catalog.set)
    expect(modules.get('src/icons/generated/frame/line.ts')).toContain("{ paint: 'fill' }")
    expect(modules.get('src/icons/generated/frame/sm.ts')).toContain(
      "{ paint: 'fill', masterSize: 16 }"
    )
    expect(sprite(catalog.set).match(/fill="currentColor"/g)).toHaveLength(2)
  })

  it('renders both variants as ink boundaries in previews and analysis', () => {
    // Scenario: painting an extra stroke would close the hole in the frame.
    for (const row of [
      ...sheetRows(catalog.set),
      ...visualTargets(catalog.set),
      ...familyGroups(catalog.set, new Set()).flatMap((group) => group.members)
    ]) {
      const svg = placedDrawing(row, 0, 0, 24, '#fff')
      expect(svg).toContain('fill="currentColor"')
      expect(svg).not.toContain('stroke=')
    }
    expect(sixteenDrawings(catalog.set).map((row) => row.kind)).toEqual(['filled'])
    expect(similarityEntries(catalog.set, []).map((row) => row.drawing.paint)).toEqual([
      'fill',
      'fill'
    ])
  })

  it('enforces the contour ceiling at thirty percent', () => {
    // Scenario: at the boundary the frame passes, one additional pixel of ink exceeds it.
    const drawings = new Map([
      ['frame', { path: 'frame.svg', text: line, elements: [], contour: true }]
    ])
    expect(inkIssues(drawings, new Map(), () => 0.3)).toEqual([])
    expect(inkIssues(drawings, new Map(), () => 0.301)).toEqual([
      expect.objectContaining({ message: expect.stringContaining('30% ceiling') })
    ])
  })
})
