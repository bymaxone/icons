/**
 * Unit tests for the public entry points.
 *
 * Layer: unit.
 * Goal: prove each entry exposes exactly its documented names through the same package
 * specifiers a consumer and the bundler use; that the root re-exports the `./meta` grid
 * and the `./runtime` functions rather than copies of them; and that the root and
 * `./brands` export exactly the generated components.
 * Mocks: none.
 */

import * as root from '@bymax-one/icons'
import * as brands from '@bymax-one/icons/brands'
import * as meta from '@bymax-one/icons/meta'
import * as runtime from '@bymax-one/icons/runtime'

import * as generatedBrands from './brands/generated'
import * as generatedIcons from './icons/generated'
import { ICON_GRID } from './meta/icon-grid'
import { createIcon } from './runtime/create-icon'
import { Icon } from './runtime/icon'

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

  it('exposes the Icon base and the createIcon factory from the runtime and the root', () => {
    /**
     * Scenario: the generated icon modules import the runtime from `./runtime`, and the
     * root re-exports the same two functions, not copies.
     */
    expect(runtime.Icon).toBe(Icon)
    expect(runtime.createIcon).toBe(createIcon)
    expect(root.Icon).toBe(runtime.Icon)
    expect(root.createIcon).toBe(runtime.createIcon)
  })

  it('exports only the documented names from each entry', () => {
    /**
     * Scenario: a barrel decides what is public; a name added to an entry by accident is
     * new surface, so every list is pinned. The root and `./brands` add exactly the
     * generated components.
     */
    expect(Object.keys(runtime).sort()).toStrictEqual(['Icon', 'createIcon'])
    expect(Object.keys(meta).sort()).toStrictEqual([
      'BRAND_METADATA',
      'BRAND_NAMES',
      'ICON_CATEGORIES',
      'ICON_GRID',
      'ICON_METADATA',
      'ICON_NAMES'
    ])
    expect(Object.keys(root).sort()).toStrictEqual(
      ['ICON_GRID', 'Icon', 'createIcon', ...Object.keys(generatedIcons)].sort()
    )
    expect(Object.keys(brands).sort()).toStrictEqual(Object.keys(generatedBrands).sort())
  })
})
