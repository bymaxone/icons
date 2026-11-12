/**
 * @fileoverview The `disc` icon, line variant.
 * Written by `pnpm generate` from icons/line/disc.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `disc` icon, line variant: disc, cd, album, record.
 *
 * @since 0.1.0
 */
export const DiscIcon = /* @__PURE__ */ createIcon('disc', [
  ['circle', { cx: 12.25, cy: 12.25, r: 8.5 }],
  ['circle', { cx: 12.25, cy: 12.25, r: 2.25 }],
  ['path', { d: 'M7.5 9.75A5.5 5.5 0 0 1 9.75 7.5' }]
])

/** `cd`: an alias of {@link DiscIcon}. */
export const CdIcon = DiscIcon

/** `album`: an alias of {@link DiscIcon}. */
export const AlbumIcon = DiscIcon
