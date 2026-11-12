/**
 * @fileoverview The `help` icon, line variant.
 * Written by `pnpm generate` from icons/line/help.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `help` icon, line variant: question, support, faq, how to.
 *
 * @since 0.1.0
 */
export const HelpIcon = /* @__PURE__ */ createIcon('help', [
  ['circle', { cx: 12.25, cy: 12.25, r: 9 }],
  ['path', { d: 'M9.25 9.75v-.5m0 0a3 3 0 1 1 5.121 2.121m0 0L12.25 13.25' }],
  ['circle', { cx: 12.25, cy: 17.25, r: 0.75 }]
])

/** `help-circle`: an alias of {@link HelpIcon}. */
export const HelpCircleIcon = HelpIcon

/** `question-mark`: an alias of {@link HelpIcon}. */
export const QuestionMarkIcon = HelpIcon
