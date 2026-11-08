/**
 * @fileoverview The accessibility attributes an icon writes on its root: silent by
 * default, an image with a name when it has a title, and out of the way when the
 * consumer has taken accessibility into their own hands.
 * @layer Runtime
 */

import type { SVGProps } from 'react'

/**
 * Whether the consumer passed a `role` or any `aria-*` attribute with a value.
 * A prop whose value is `undefined` or `null` renders nothing, so it does not count:
 * `aria-label={maybeLabel}` with no label leaves the icon silent rather than
 * exposing an unnamed graphic.
 *
 * @param props - The props the consumer passed to the icon.
 * @returns True when the consumer set accessibility attributes of their own.
 */
export function hasOwnAccessibility(props: Readonly<Record<string, unknown>>): boolean {
  return Object.entries(props).some(
    ([name, value]) =>
      (name === 'role' || name.startsWith('aria-')) && value !== undefined && value !== null
  )
}

/**
 * The accessibility attributes written before the consumer's props, which are
 * spread after them and so win on any attribute both set.
 *
 * - With a non-empty `title`: `role="img"` and `aria-label` set to the title. The
 *   `<title>` child is added by the icon itself.
 * - Without a title and with no `role` or `aria-*` of the consumer's: `aria-hidden`,
 *   so a decorative icon next to a text label is not announced.
 * - Otherwise nothing: the consumer's own attributes decide.
 *
 * An empty title is no title: an image with an empty name is an accessibility
 * error, while a hidden decorative icon is not.
 *
 * @param title - The icon's accessible name, if any.
 * @param props - The other props the consumer passed.
 * @returns The attributes to write on the root element.
 */
export function accessibilityAttributes(
  title: string | undefined,
  props: Readonly<Record<string, unknown>>
): SVGProps<SVGSVGElement> {
  if (title) return { role: 'img', 'aria-label': title }
  if (hasOwnAccessibility(props)) return {}
  return { 'aria-hidden': 'true' }
}
