/**
 * @fileoverview The `users` icon, sm variant.
 * Written by `pnpm generate` from icons/sm/users.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `users` icon, sm variant: team, people, members, group.
 *
 * @since 0.1.0
 */
export const UsersSmIcon = /* @__PURE__ */ createIcon(
  'users-sm',
  [
    ['circle', { cx: 9, cy: 7.5, r: 2.625 }],
    ['path', { d: 'M3.75 19.5c0-3.4 1.6-5.25 5.25-5.25s5.25 1.85 5.25 5.25Z' }],
    ['circle', { cx: 18, cy: 7.5, r: 2.25 }],
    ['path', { d: 'M18 13.5c2 .3 2.6 1.9 2.6 5.25' }]
  ],
  { masterSize: 16 }
)

/** `group`: an alias of {@link UsersSmIcon}. */
export const GroupSmIcon = UsersSmIcon

/** `user-group`: an alias of {@link UsersSmIcon}. */
export const UserGroupSmIcon = UsersSmIcon
