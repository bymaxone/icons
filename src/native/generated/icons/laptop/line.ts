/**
 * @fileoverview The `laptop` icon, line variant.
 * Written by `pnpm generate` from icons/line/laptop.svg: edit the source, never this file.
 * @layer Generated
 */

import { createNativeIcon } from '@bymax-one/icons/native/runtime'

/**
 * The `laptop` icon, line variant: laptop, computer, device, desktop.
 *
 * @since 1.0.0
 */
export const LaptopIcon = /* @__PURE__ */ createNativeIcon('laptop', [
  [
    'path',
    {
      d: 'M7.25 5.25h10c1.625 0 2 .375 2 2v6c0 1.625-.375 2-2 2h-10c-1.625 0-2-.375-2-2v-6c0-1.625.375-2 2-2'
    }
  ],
  ['path', { d: 'M2.75 19.25h19' }],
  ['path', { d: 'M12.25 8.25h.01' }]
])

/** `computer`: an alias of {@link LaptopIcon}. */
export const ComputerIcon = LaptopIcon
