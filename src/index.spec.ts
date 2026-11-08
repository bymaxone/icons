/**
 * Unit tests for the public entry points.
 *
 * Layer: unit.
 * Goal: prove the root and `./meta` barrels expose the grid, through the same
 * package specifiers a consumer and the bundler use, and that the root re-exports
 * the `./meta` object rather than a copy of it.
 * Mocks: none.
 */

import * as root from '@bymax-one/icons'
import * as meta from '@bymax-one/icons/meta'

import { ICON_GRID } from './meta/icon-grid'

describe('public entry points', () => {
  it('exposes the grid from the meta subpath', () => {
    /**
     * Scenario: `@bymax-one/icons/meta` is the React-free entry; the grid it exports
     * is the module's own frozen object, not a reconstruction.
     */
    expect(meta.ICON_GRID).toBe(ICON_GRID)
  })

  it('re-exports the meta grid from the root without copying it', () => {
    /**
     * Scenario: the root re-exports by package specifier so the published package
     * holds one grid; an identity check fails if the root ever inlines its own copy.
     */
    expect(root.ICON_GRID).toBe(meta.ICON_GRID)
  })

  it('exports only the documented runtime names', () => {
    /**
     * Scenario: a barrel decides what is public; a runtime name added to either
     * entry by accident is new surface, so both lists are pinned.
     */
    expect(Object.keys(root).sort()).toEqual(['ICON_GRID'])
    expect(Object.keys(meta).sort()).toEqual(['ICON_GRID'])
  })
})
