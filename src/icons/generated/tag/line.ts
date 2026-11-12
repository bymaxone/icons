/**
 * @fileoverview The `tag` icon, line variant.
 * Written by `pnpm generate` from icons/line/tag.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `tag` icon, line variant: tag, price, label, discount.
 *
 * @since 0.1.0
 */
export const TagIcon = /* @__PURE__ */ createIcon('tag', [
  [
    'path',
    {
      d: 'M3.75 5.25v5.5c0 1 .25 1.75 1 2.5l7.5 7.5c1 1 2 1 3 0l5-5c1-1 1-2 0-3l-7.5-7.5c-.75-.75-1.5-1-2.5-1h-5.5c-.75 0-1 .25-1 1'
    }
  ],
  ['path', { d: 'M8.25 8.75h.01' }]
])

/** `price-tag`: an alias of {@link TagIcon}. */
export const PriceTagIcon = TagIcon

/** `label`: an alias of {@link TagIcon}. */
export const LabelIcon = TagIcon
