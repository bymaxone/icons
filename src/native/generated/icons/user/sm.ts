/**
 * @fileoverview The `user` icon, sm variant.
 * Written by `pnpm generate` from icons/sm/user.svg: edit the source, never this file.
 * @layer Generated
 */

import { createNativeIcon } from '@bymax-one/icons/native/runtime'

/**
 * The `user` icon, sm variant: person, account, profile, avatar.
 *
 * @since 1.0.0
 */
export const UserSmIcon = /* @__PURE__ */ createNativeIcon(
  'user-sm',
  [
    ['circle', { cx: 12.75, cy: 8, r: 3.75 }],
    ['path', { d: 'M6 19.25c0-3.6 1.9-5.5 6.75-5.5s6.75 1.9 6.75 5.5z' }]
  ],
  { masterSize: 16 }
)

/** `person`: an alias of {@link UserSmIcon}. */
export const PersonSmIcon = UserSmIcon
