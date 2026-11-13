/**
 * @fileoverview The `subway` icon, line variant.
 * Written by `pnpm generate` from icons/line/subway.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `subway` icon, line variant: subway, metro, train, underground.
 *
 * @since 0.1.0
 */
export const SubwayIcon = /* @__PURE__ */ createIcon('subway', [
  ['path', { d: 'M4.25 21.25v-9a8 8 0 0 1 16 0v9' }],
  [
    'path',
    {
      d: 'M11.25 9.75h2c1.625 0 2 .375 2 2v5c0 1.625-.375 2-2 2h-2c-1.625 0-2-.375-2-2v-5c0-1.625.375-2 2-2'
    }
  ],
  ['path', { d: 'M9.25 13.25h6' }],
  ['path', { d: 'm10.5 18.75-1 2.5m4.5-2.5 1 2.5' }]
])

/** `metro`: an alias of {@link SubwayIcon}. */
export const MetroIcon = SubwayIcon
