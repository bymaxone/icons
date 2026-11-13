/**
 * @fileoverview The `eye` icon, sm variant.
 * Written by `pnpm generate` from icons/sm/eye.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `eye` icon, sm variant: visible, show, view, preview.
 *
 * @since 0.1.0
 */
export const EyeSmIcon = /* @__PURE__ */ createIcon(
  'eye-sm',
  [
    ['path', { d: 'M5.25 10.875a7.982 7.982 0 0 1 15 0' }],
    ['path', { d: 'M20.25 14.625a7.982 7.982 0 0 1-15 0' }],
    ['circle', { cx: 12.75, cy: 12.75, r: 1.875 }]
  ],
  { masterSize: 16 }
)

/** `view`: an alias of {@link EyeSmIcon}. */
export const ViewSmIcon = EyeSmIcon
