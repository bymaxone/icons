/**
 * @fileoverview The `clock` icon, line variant.
 * Written by `pnpm generate` from icons/line/clock.svg: edit the source, never this file.
 * @layer Generated
 */

import { createNativeIcon } from '@bymax-one/icons/native/runtime'

/**
 * The `clock` icon, line variant: time, duration, schedule, pending.
 *
 * @since 1.1.0
 */
export const ClockIcon = /* @__PURE__ */ createNativeIcon('clock', [
  [
    'path',
    { d: 'M11.75 3.75h1c6.5 0 8 1.5 8 8v1c0 6.5-1.5 8-8 8h-1c-6.5 0-8-1.5-8-8v-1c0-6.5 1.5-8 8-8' }
  ],
  ['path', { d: 'M12.25 12.25v-5' }],
  ['path', { d: 'm14.65 14.05 2 1.5' }]
])

/** `time`: an alias of {@link ClockIcon}. */
export const TimeIcon = ClockIcon
