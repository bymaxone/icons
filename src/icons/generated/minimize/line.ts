/**
 * @fileoverview The `minimize` icon, line variant.
 * Written by `pnpm generate` from icons/line/minimize.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `minimize` icon, line variant: exit full screen, shrink, collapse, corners.
 *
 * @since 0.1.0
 */
export const MinimizeIcon = /* @__PURE__ */ createIcon('minimize', [
  ['path', { d: 'M9.75 4.25V7c0 2.234-.516 2.75-2.75 2.75H4.25' }],
  ['path', { d: 'M14.75 4.25V7c0 2.234.516 2.75 2.75 2.75h2.75' }],
  ['path', { d: 'M9.75 20.25V17.5c0-2.234-.516-2.75-2.75-2.75H4.25' }],
  ['path', { d: 'M14.75 20.25V17.5c0-2.234.516-2.75 2.75-2.75h2.75' }]
])

/** `fullscreen-exit`: an alias of {@link MinimizeIcon}. */
export const FullscreenExitIcon = MinimizeIcon
