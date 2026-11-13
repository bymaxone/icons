/**
 * @fileoverview The `traffic-light` icon, line variant.
 * Written by `pnpm generate` from icons/line/traffic-light.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `traffic-light` icon, line variant: traffic light, signal, stoplight, road.
 *
 * @since 0.1.0
 */
export const TrafficLightIcon = /* @__PURE__ */ createIcon('traffic-light', [
  [
    'path',
    {
      d: 'M10.75 2.25h3c2.438 0 3 .563 3 3v13.5c0 2.438-.563 3-3 3h-3c-2.438 0-3-.563-3-3V5.25c0-2.438.563-3 3-3'
    }
  ],
  ['circle', { cx: 12.25, cy: 6.5, r: 1.25 }],
  ['circle', { cx: 12.25, cy: 12, r: 1.25 }],
  ['circle', { cx: 12.25, cy: 17.5, r: 1.25 }]
])

/** `traffic`: an alias of {@link TrafficLightIcon}. */
export const TrafficIcon = TrafficLightIcon
