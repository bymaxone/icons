/**
 * @fileoverview The `trash` icon, sm variant.
 * Written by `pnpm generate` from icons/sm/trash.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `trash` icon, sm variant: delete, remove, bin, discard.
 *
 * @since 0.1.0
 */
export const TrashSmIcon = /* @__PURE__ */ createIcon(
  'trash-sm',
  [
    ['path', { d: 'M3.75 5.25h16.5m-10.5 0v-1.5h4.5v1.5' }],
    ['path', { d: 'm5.25 9.75 1 7.5c.4 2.6 1.2 3 4 3h3.5c2.8 0 3.6-.4 4-3l1-7.5' }]
  ],
  { masterSize: 16 }
)

/** `delete`: an alias of {@link TrashSmIcon}. */
export const DeleteSmIcon = TrashSmIcon
