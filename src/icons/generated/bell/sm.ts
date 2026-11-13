/**
 * @fileoverview The `bell` icon, sm variant.
 * Written by `pnpm generate` from icons/sm/bell.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `bell` icon, sm variant: notifications, alerts, alarm, ring.
 *
 * @since 0.1.0
 */
export const BellSmIcon = /* @__PURE__ */ createIcon(
  'bell-sm',
  [
    [
      'path',
      {
        d: 'm5.25 16.5 1.35-1.95c.45-.7.65-1.1.65-1.95v-1.5c0-1.85.35-2.6 1.6-3.85L9.9 6.2c2.1-2.1 3.6-2.1 5.7 0l1.05 1.05c1.25 1.25 1.6 2 1.6 3.85v1.5c0 .85.2 1.25.65 1.95l1.35 1.95Z'
      }
    ],
    ['path', { d: 'M10.5 20.25H15' }]
  ],
  { masterSize: 16 }
)

/** `notification`: an alias of {@link BellSmIcon}. */
export const NotificationSmIcon = BellSmIcon
