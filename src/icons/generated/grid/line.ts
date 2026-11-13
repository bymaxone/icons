/**
 * @fileoverview The `grid` icon, line variant.
 * Written by `pnpm generate` from icons/line/grid.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `grid` icon, line variant: lattice, guides, hash, layout grid.
 *
 * @since 0.1.0
 */
export const GridIcon = /* @__PURE__ */ createIcon('grid', [
  ['path', { d: 'M8.25 3.25v2m0 6v10' }],
  ['path', { d: 'M16.25 3.25v10m0 6v2' }],
  ['path', { d: 'M3.25 8.25h10m6 0h2' }],
  ['path', { d: 'M3.25 16.25h2m6 0h10' }]
])

/** `hash`: an alias of {@link GridIcon}. */
export const HashIcon = GridIcon

/** `grid-3x3`: an alias of {@link GridIcon}. */
export const Grid3x3Icon = GridIcon

/** `grid-3x`: an alias of {@link GridIcon}. */
export const Grid3xIcon = GridIcon
