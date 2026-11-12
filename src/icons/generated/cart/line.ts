/**
 * @fileoverview The `cart` icon, line variant.
 * Written by `pnpm generate` from icons/line/cart.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `cart` icon, line variant: cart, shopping, basket, checkout.
 *
 * @since 0.1.0
 */
export const CartIcon = /* @__PURE__ */ createIcon('cart', [
  [
    'path',
    {
      d: 'M2.75 4.25h1.5c.75 0 1.25.5 1.5 1.25l2 9.25H18c.75 0 1.25-.5 1.5-1.25L20.75 8c.25-1-.25-1.5-1.25-1.5H6.25'
    }
  ],
  ['circle', { cx: 9, cy: 19.5, r: 1.5 }],
  ['circle', { cx: 16.75, cy: 19.5, r: 1.5 }]
])

/** `shopping-cart`: an alias of {@link CartIcon}. */
export const ShoppingCartIcon = CartIcon
