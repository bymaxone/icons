/**
 * @fileoverview The `message` icon, filled variant.
 * Written by `pnpm generate` from icons/filled/message.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `message` icon, filled variant: chat, comment, speech bubble, conversation.
 *
 * @since 0.1.0
 */
export const MessageFilledIcon = /* @__PURE__ */ createIcon(
  'message-filled',
  [
    [
      'path',
      {
        fillRule: 'evenodd',
        d: 'M17.3 3.5H6.8Q4 3.5 3 4.5T2 8.3v8Q2 18 3.8 18H4v3l.2.2v.1l.2.1h.3q.2 0 .1.1t.1 0 .2 0 .1-.2L9.5 18h7.8q2.7 0 3.7-1t1-3.7v-5q0-2.8-1-3.8t-3.7-1'
      }
    ]
  ],
  { paint: 'fill' }
)

/** `chat`: an alias of {@link MessageFilledIcon}. */
export const ChatFilledIcon = MessageFilledIcon

/** `comment`: an alias of {@link MessageFilledIcon}. */
export const CommentFilledIcon = MessageFilledIcon

/** `message-circle`: an alias of {@link MessageFilledIcon}. */
export const MessageCircleFilledIcon = MessageFilledIcon
