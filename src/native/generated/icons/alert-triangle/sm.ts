/**
 * @fileoverview The `alert-triangle` icon, sm variant.
 * Written by `pnpm generate` from icons/sm/alert-triangle.svg: edit the source, never this file.
 * @layer Generated
 */

import { createNativeIcon } from '@bymax-one/icons/native/runtime'

/**
 * The `alert-triangle` icon, sm variant: warning, caution, danger, exclamation.
 *
 * @since 1.0.0
 */
export const AlertTriangleSmIcon = /* @__PURE__ */ createNativeIcon(
  'alert-triangle-sm',
  [
    ['path', { d: 'm12.75 3.75 8.625 16.5H4.125Z' }],
    ['path', { d: 'M12.75 11.25v1.5' }],
    ['path', { d: 'M12.75 16.5h.01' }]
  ],
  { masterSize: 16 }
)

/** `warning`: an alias of {@link AlertTriangleSmIcon}. */
export const WarningSmIcon = AlertTriangleSmIcon

/** `alert`: an alias of {@link AlertTriangleSmIcon}. */
export const AlertSmIcon = AlertTriangleSmIcon
