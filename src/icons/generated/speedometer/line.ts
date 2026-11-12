/**
 * @fileoverview The `speedometer` icon, line variant.
 * Written by `pnpm generate` from icons/line/speedometer.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `speedometer` icon, line variant: speedometer, gauge, dial, limit, budget, cap.
 *
 * @since 0.1.0
 */
export const SpeedometerIcon = /* @__PURE__ */ createIcon('speedometer', [
  ['path', { d: 'M3.75 16.25a8.5 8.5 0 0 1 13.294-7.019m3.441 4.915a8.5 8.5 0 0 1 .265 2.104' }],
  ['path', { d: 'm17.37 12.665 3.686-2.581' }],
  ['path', { d: 'm12.25 16.25 1.294-4.83' }],
  ['circle', { cx: 12.25, cy: 16.25, r: 0.75 }]
])

/** @deprecated `spending-cap` is a deprecated alias of `speedometer`, removed in 2.0.0. Renamed to speedometer, the object the drawing shows. Use {@link SpeedometerIcon}. */
export const SpendingCapIcon = SpeedometerIcon
