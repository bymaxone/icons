/**
 * @fileoverview The `truck` icon, line variant.
 * Written by `pnpm generate` from icons/line/truck.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `truck` icon, line variant: truck, delivery, shipping, transport.
 *
 * @since 0.1.0
 */
export const TruckIcon = /* @__PURE__ */ createIcon('truck', [
  [
    'path',
    {
      d: 'M4.75 5.25h7.5c1.625 0 2 .375 2 2v6c0 1.625-.375 2-2 2h-7.5c-1.625 0-2-.375-2-2v-6c0-1.625.375-2 2-2'
    }
  ],
  ['path', { d: 'M14.25 8.25H18L21 12v3.25h-6.75' }],
  ['circle', { cx: 7.25, cy: 19.5, r: 1.25 }],
  ['circle', { cx: 17.25, cy: 19.5, r: 1.25 }]
])

/** `shipping`: an alias of {@link TruckIcon}. */
export const ShippingIcon = TruckIcon

/** `van`: an alias of {@link TruckIcon}. */
export const VanIcon = TruckIcon
