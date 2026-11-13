/**
 * @fileoverview The `user-square` icon, line variant.
 * Written by `pnpm generate` from icons/line/user-square.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `user-square` icon, line variant: user, contact, card, profile.
 *
 * @since 0.1.0
 */
export const UserSquareIcon = /* @__PURE__ */ createIcon('user-square', [
  [
    'path',
    {
      d: 'M8.25 4.25h8c3.25 0 4 .75 4 4v8c0 3.25-.75 4-4 4h-8c-3.25 0-4-.75-4-4v-8c0-3.25.75-4 4-4'
    }
  ],
  ['circle', { cx: 12.25, cy: 10, r: 2 }],
  ['path', { d: 'M9 20.25c.5-2 1.5-3 3.25-3s2.75 1 3.25 3' }]
])

/** `account-box`: an alias of {@link UserSquareIcon}. */
export const AccountBoxIcon = UserSquareIcon
