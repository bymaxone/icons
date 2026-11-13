/**
 * @fileoverview The `alert-circle` icon, line variant.
 * Written by `pnpm generate` from icons/line/alert-circle.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `alert-circle` icon, line variant: error, problem, exclamation, attention.
 *
 * @since 0.1.0
 */
export const AlertCircleIcon = /* @__PURE__ */ createIcon('alert-circle', [
  ['circle', { cx: 12.25, cy: 12.25, r: 8.5 }],
  ['path', { d: 'M12.25 7.75v5' }],
  ['path', { d: 'M12.25 15.75h.01' }]
])

/** `exclamation-circle`: an alias of {@link AlertCircleIcon}. */
export const ExclamationCircleIcon = AlertCircleIcon

/** `error`: an alias of {@link AlertCircleIcon}. */
export const ErrorIcon = AlertCircleIcon
