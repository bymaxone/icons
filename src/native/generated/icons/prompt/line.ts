/**
 * @fileoverview The `prompt` icon, line variant.
 * Written by `pnpm generate` from icons/line/prompt.svg: edit the source, never this file.
 * @layer Generated
 */

import { createNativeIcon } from '@bymax-one/icons/native/runtime'

/**
 * The `prompt` icon, line variant: input, command, instruction, terminal.
 *
 * @since 1.0.0
 */
export const PromptIcon = /* @__PURE__ */ createNativeIcon('prompt', [
  [
    'path',
    {
      d: 'M6.75 5.25h10.5c3.25 0 4 .75 4 4v6c0 3.25-.75 4-4 4H6.75c-3.25 0-4-.75-4-4v-6c0-3.25.75-4 4-4'
    }
  ],
  ['path', { d: 'm6.75 9.75 2.5 2.5-2.5 2.5' }],
  ['path', { d: 'M12.25 14.75h5.5' }]
])

/** `terminal`: an alias of {@link PromptIcon}. */
export const TerminalIcon = PromptIcon
