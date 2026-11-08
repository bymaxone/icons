/**
 * Unit tests for the icon drawing grid.
 *
 * Layer: unit.
 * Goal: pin every grid value to the design language of the set (a 24 px master, a
 * 20 px live area with 2 px padding, a 1.5 px round-capped, round-joined stroke),
 * prove the values agree with each other, and prove the shared object cannot be
 * rewritten at runtime.
 * Mocks: none.
 */

import { ICON_GRID } from './icon-grid'

describe('ICON_GRID', () => {
  it('describes a 24 px master canvas with a matching viewBox', () => {
    /**
     * Scenario: every icon is drawn on a 24 by 24 canvas, and the root `<svg>` of
     * each one carries `viewBox="0 0 24 24"`. A different size or viewBox would
     * rescale every drawing in the set.
     */
    expect(ICON_GRID.size).toBe(24)
    expect(ICON_GRID.viewBox).toBe('0 0 24 24')
  })

  it('reserves a 20 px live area inside 2 px of padding', () => {
    /**
     * Scenario: drawings stay inside a centred 20 by 20 live area, which leaves
     * 2 px on each side of the 24 px canvas; the three numbers must add up.
     */
    expect(ICON_GRID.liveArea).toBe(20)
    expect(ICON_GRID.padding).toBe(2)
    expect(ICON_GRID.liveArea + 2 * ICON_GRID.padding).toBe(ICON_GRID.size)
  })

  it('draws line icons with a 1.5 px round stroke', () => {
    /**
     * Scenario: the stroke is the identity of the set, 1.5 px at the 24 px master
     * with round caps and round joins; any other value changes how every line
     * icon reads.
     */
    expect(ICON_GRID.strokeWidth).toBe(1.5)
    expect(ICON_GRID.strokeLinecap).toBe('round')
    expect(ICON_GRID.strokeLinejoin).toBe('round')
  })

  it('exposes exactly the documented keys', () => {
    /**
     * Scenario: the grid is public data; a key added or dropped by accident is a
     * change to the published surface, so the full key set is pinned.
     */
    expect(Object.keys(ICON_GRID).sort()).toEqual([
      'liveArea',
      'padding',
      'size',
      'strokeLinecap',
      'strokeLinejoin',
      'strokeWidth',
      'viewBox'
    ])
  })

  it('is frozen, so no consumer can rewrite a shared default', () => {
    /**
     * Scenario: one object backs the defaults of every icon in a process; a write
     * from any consumer must fail rather than silently restyle the whole set.
     */
    expect(Object.isFrozen(ICON_GRID)).toBe(true)
    expect(() => {
      ;(ICON_GRID as { size: number }).size = 16
    }).toThrow(TypeError)
    expect(ICON_GRID.size).toBe(24)
  })
})
