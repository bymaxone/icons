/**
 * @fileoverview The `alert-circle` icon, sm variant.
 * Written by `pnpm generate` from icons/sm/alert-circle.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `alert-circle` icon, sm variant: error, problem, exclamation, attention.
 *
 * @since 0.1.0
 */
export const AlertCircleSmIcon = /* @__PURE__ */ createIcon(
  'alert-circle-sm',
  [
    ['circle', { cx: 12.75, cy: 12.375, r: 7.875 }],
    ['path', { d: 'M12.75 8.25V12' }],
    ['path', { d: 'M12.75 15.75h.01' }]
  ],
  { masterSize: 16 }
)

/** `exclamation-circle`: an alias of {@link AlertCircleSmIcon}. */
export const ExclamationCircleSmIcon = AlertCircleSmIcon

/** `error`: an alias of {@link AlertCircleSmIcon}. */
export const ErrorSmIcon = AlertCircleSmIcon
