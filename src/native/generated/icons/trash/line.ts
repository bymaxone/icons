/**
 * @fileoverview The `trash` icon, line variant.
 * Written by `pnpm generate` from icons/line/trash.svg: edit the source, never this file.
 * @layer Generated
 */

import { createNativeIcon } from '@bymax-one/icons/native/runtime'

/**
 * The `trash` icon, line variant: delete, remove, bin, discard.
 *
 * @since 1.1.0
 */
export const TrashIcon = /* @__PURE__ */ createNativeIcon('trash', [
  ['path', { d: 'M3.75 6.25h5.5v-1.3c0-.975.225-1.2 1.2-1.2h3.6c.975 0 1.2.225 1.2 1.2v1.3h5.5' }],
  [
    'path',
    {
      d: 'm5.25 9.25.983 7.534c.42 3.222 1.267 3.966 4.517 3.966h3c3.25 0 4.097-.744 4.517-3.966l.983-7.534'
    }
  ]
])

/** `delete`: an alias of {@link TrashIcon}. */
export const DeleteIcon = TrashIcon
