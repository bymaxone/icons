/**
 * @fileoverview The `crosshair` icon, line variant.
 * Written by `pnpm generate` from icons/line/crosshair.svg: edit the source, never this file.
 * @layer Generated
 */

import { createNativeIcon } from '@bymax-one/icons/native/runtime'

/**
 * The `crosshair` icon, line variant: crosshair, target, aim, locate.
 *
 * @since 1.1.0
 */
export const CrosshairIcon = /* @__PURE__ */ createNativeIcon('crosshair', [
  ['circle', { cx: 12.25, cy: 12.25, r: 7.5 }],
  ['path', { d: 'M12.25 2.75v4m0 11v4m-9.5-9.5h4m11 0h4' }]
])

/** `locate`: an alias of {@link CrosshairIcon}. */
export const LocateIcon = CrosshairIcon
