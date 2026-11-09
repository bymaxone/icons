/**
 * Unit tests for the live-area bound.
 *
 * Layer: unit, with resvg.
 * Goal: prove the geometry is measured without the stroke and exactly for curves and
 * arcs, and pin the 21 x 21 limit on each side.
 * Mocks: none.
 */

import { geometryBounds, isInsideLiveArea, LIVE_AREA_LIMIT } from './live-area.ts'

const one = (tag: string, attributes: Record<string, string>) =>
  geometryBounds([{ tag, attributes }])

describe('geometryBounds', () => {
  it.each([
    [
      'a line',
      'line',
      { x1: '2', y1: '3', x2: '22', y2: '3' },
      { left: 2, top: 3, right: 22, bottom: 3 }
    ],
    [
      'a circle',
      'circle',
      { cx: '12', cy: '12', r: '10.5' },
      { left: 1.5, top: 1.5, right: 22.5, bottom: 22.5 }
    ],
    [
      'a rect',
      'rect',
      { x: '4.75', y: '4.75', width: '14.5', height: '14.5', rx: '2.5' },
      { left: 4.75, top: 4.75, right: 19.25, bottom: 19.25 }
    ],
    [
      'an arc, by its curve',
      'path',
      { d: 'M4 12a8 8 0 0 0 16 0' },
      { left: 4, top: 12, right: 20, bottom: 20 }
    ],
    [
      'a polygon',
      'polygon',
      { points: '12 2 22 22 2 22' },
      { left: 2, top: 2, right: 22, bottom: 22 }
    ]
  ])('measures %s at its geometry, not its stroke', (_label, tag, attributes, expected) => {
    /**
     * Scenario: the bound applies to the stroke centre line and the filled shape; the
     * measuring stroke is taken off again on every side.
     */
    expect(one(tag, attributes)).toStrictEqual(expected)
  })

  it('ignores the fill controls, so a filled shape measures as its outline', () => {
    /**
     * Scenario: the spark dot and a filled icon are measured the same way as a stroke.
     */
    expect(
      one('circle', {
        cx: '19',
        cy: '5',
        r: '1',
        fill: 'currentColor',
        'fill-rule': 'evenodd',
        'clip-rule': 'evenodd'
      })
    ).toStrictEqual({
      left: 18,
      top: 4,
      right: 20,
      bottom: 6
    })
  })

  it('spans every element of the drawing', () => {
    /**
     * Scenario: the bound is the drawing's, not one element's.
     */
    expect(
      geometryBounds([
        { tag: 'line', attributes: { x1: '3', y1: '4', x2: '5', y2: '6' } },
        { tag: 'line', attributes: { x1: '18', y1: '19', x2: '20', y2: '21' } }
      ])
    ).toStrictEqual({ left: 3, top: 4, right: 20, bottom: 21 })
  })

  it('returns undefined for a drawing that paints nothing', () => {
    /**
     * Scenario: no element, a degenerate path or a zero-sized shape draws nothing.
     */
    expect(geometryBounds([])).toBeUndefined()
    expect(one('path', { d: 'M5 5' })).toBeUndefined()
    expect(one('rect', { x: '4', y: '4', width: '0', height: '5' })).toBeUndefined()
  })
})

describe('isInsideLiveArea', () => {
  it('is the 20 px live area grown by half a pixel on each side', () => {
    /**
     * Scenario: the grid's 2 px padding leaves a 20 x 20 live area; large round shapes
     * may reach 21 x 21, which is the hard limit.
     */
    expect(LIVE_AREA_LIMIT).toStrictEqual({ left: 1.5, top: 1.5, right: 22.5, bottom: 22.5 })
  })

  it('accepts a geometry on the limit', () => {
    /**
     * Scenario: touching the limit is inside it.
     */
    expect(isInsideLiveArea({ left: 1.5, top: 1.5, right: 22.5, bottom: 22.5 })).toBe(true)
  })

  it.each([
    ['left', { left: 1.499, top: 2, right: 22, bottom: 22 }],
    ['top', { left: 2, top: 1.499, right: 22, bottom: 22 }],
    ['right', { left: 2, top: 2, right: 22.501, bottom: 22 }],
    ['bottom', { left: 2, top: 2, right: 22, bottom: 22.501 }]
  ])('refuses a geometry past the %s side', (_side, bounds) => {
    /**
     * Scenario: each side is checked on its own, at the grid's three decimals.
     */
    expect(isInsideLiveArea(bounds)).toBe(false)
  })
})
