/**
 * @fileoverview The `window` icon, line variant.
 * Written by `pnpm generate` from icons/line/window.svg: edit the source, never this file.
 * @layer Generated
 */

import { createNativeIcon } from '@bymax-one/icons/native/runtime'

/**
 * The `window` icon, line variant: window, browser, app, frame.
 *
 * @since 1.0.0
 */
export const WindowIcon = /* @__PURE__ */ createNativeIcon('window', [
  [
    'path',
    {
      d: 'M5.75 4.25h13c2.031 0 2.5.469 2.5 2.5v10.5c0 2.031-.469 2.5-2.5 2.5h-13c-2.031 0-2.5-.469-2.5-2.5V6.75c0-2.031.469-2.5 2.5-2.5'
    }
  ],
  ['path', { d: 'M3.25 10.25h18' }],
  ['path', { d: 'M6.75 7.25h.01' }]
])

/** `app-window`: an alias of {@link WindowIcon}. */
export const AppWindowIcon = WindowIcon

/** `browser`: an alias of {@link WindowIcon}. */
export const BrowserIcon = WindowIcon
