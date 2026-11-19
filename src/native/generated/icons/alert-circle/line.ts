/**
 * @fileoverview The `alert-circle` icon, line variant.
 * Written by `pnpm generate` from icons/line/alert-circle.svg: edit the source, never this file.
 * @layer Generated
 */

import { createNativeIcon } from '@bymax-one/icons/native/runtime'

/**
 * The `alert-circle` icon, line variant: error, problem, exclamation, attention.
 *
 * @since 1.0.0
 */
export const AlertCircleIcon = /* @__PURE__ */ createNativeIcon('alert-circle', [
  ['circle', { cx: 12.25, cy: 12.25, r: 8.5 }],
  ['path', { d: 'M12.25 7.75v5' }],
  ['path', { d: 'M12.25 15.75h.01' }]
])

/** `exclamation-circle`: an alias of {@link AlertCircleIcon}. */
export const ExclamationCircleIcon = AlertCircleIcon

/** `error`: an alias of {@link AlertCircleIcon}. */
export const ErrorIcon = AlertCircleIcon
