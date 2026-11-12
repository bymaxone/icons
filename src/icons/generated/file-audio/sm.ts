/**
 * @fileoverview The `file-audio` icon, sm variant.
 * Written by `pnpm generate` from icons/sm/file-audio.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `file-audio` icon, sm variant: audio file, sound file, music file, media.
 *
 * @since 0.1.0
 */
export const FileAudioSmIcon = /* @__PURE__ */ createIcon(
  'file-audio-sm',
  [
    [
      'path',
      { d: 'M12.75 3.75h-4.5c-2.25 0-3 .75-3 3v10.5c0 2.25.75 3 3 3h7.5c2.25 0 3-.75 3-3v-7.5Z' }
    ],
    ['circle', { cx: 11.25, cy: 14.25, r: 1.125 }],
    ['path', { d: 'M12.75 14.25v-3l1.5.75' }]
  ],
  { masterSize: 16 }
)

/** `file-music`: an alias of {@link FileAudioSmIcon}. */
export const FileMusicSmIcon = FileAudioSmIcon
