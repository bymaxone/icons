/**
 * @fileoverview The `address-book` icon, line variant.
 * Written by `pnpm generate` from icons/line/address-book.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `address-book` icon, line variant: address book, contacts, directory, people.
 *
 * @since 0.1.0
 */
export const AddressBookIcon = /* @__PURE__ */ createIcon('address-book', [
  [
    'path',
    {
      d: 'M9.75 3.25h6.5c2.25 0 3 .75 3 3v12c0 2.25-.75 3-3 3h-6.5c-2.25 0-3-.75-3-3v-12c0-2.25.75-3 3-3'
    }
  ],
  ['circle', { cx: 13, cy: 9.5, r: 1.75 }],
  ['path', { d: 'M10.25 17c.5-1.5 1.25-2.25 2.75-2.25s2.25.75 2.75 2.25' }],
  ['path', { d: 'M4.25 9.25h1.5m-1.5 6h1.5' }]
])

/** `contacts`: an alias of {@link AddressBookIcon}. */
export const ContactsIcon = AddressBookIcon
