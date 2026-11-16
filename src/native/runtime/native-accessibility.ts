/**
 * @fileoverview The accessibility props a React Native icon writes on its root: hidden by
 * default, an image with a label when it has a title, and out of the way when the consumer
 * has taken accessibility into their own hands.
 * @layer Runtime
 */

import type { SvgProps } from 'react-native-svg'

/** The props that make the consumer the owner of the icon's accessibility. */
const OWN_NAMES: ReadonlySet<string> = new Set(['accessible', 'importantForAccessibility', 'role'])

/**
 * Whether the consumer passed any accessibility prop with a value: `accessible`,
 * `importantForAccessibility`, `role`, `aria-*` or any `accessibility*` prop. A prop whose
 * value is `undefined` or `null` does not count, so `accessibilityLabel={maybeLabel}` with
 * no label leaves the icon hidden rather than exposing an unnamed graphic.
 *
 * @param props - The props the consumer passed to the icon.
 * @returns True when the consumer set accessibility props of their own.
 */
export function hasOwnNativeAccessibility(props: Readonly<Record<string, unknown>>): boolean {
  return Object.entries(props).some(
    ([name, value]) =>
      (OWN_NAMES.has(name) || name.startsWith('accessibility') || name.startsWith('aria-')) &&
      value != null
  )
}

/**
 * The accessibility props written before the consumer's, which are spread after them and
 * so win on any prop both set.
 *
 * - With a non-empty `title`: `accessible`, `accessibilityRole="image"` and
 *   `accessibilityLabel` set to the title.
 * - Without a title and with no accessibility prop of the consumer's:
 *   `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`.
 * - Otherwise nothing: the consumer's props decide.
 *
 * An empty title is no title: an image with an empty label is an accessibility error,
 * while a hidden decorative icon is not.
 *
 * @param title - The icon's accessible name, if any.
 * @param props - The other props the consumer passed.
 * @returns The props to write on the root.
 */
export function nativeAccessibilityProps(
  title: string | undefined,
  props: Readonly<Record<string, unknown>>
): SvgProps {
  if (title) return { accessible: true, accessibilityRole: 'image', accessibilityLabel: title }
  if (hasOwnNativeAccessibility(props)) return {}
  return { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' }
}
