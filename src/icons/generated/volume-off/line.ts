/**
 * @fileoverview The `volume-off` icon, line variant.
 * Written by `pnpm generate` from icons/line/volume-off.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `volume-off` icon, line variant: mute, silent, speaker off, no sound.
 *
 * @since 0.1.0
 */
export const VolumeOffIcon = /* @__PURE__ */ createIcon('volume-off', [
  ['path', { d: 'M2.75 9.75h3.5v5h-3.5z' }],
  [
    'path',
    {
      d: 'm10.099 8.401 2.302-2.302c.69-.69.849-.624.849.351v11.6c0 .975-.159 1.041-.849.351l-2.302-2.302c-.69-.69-.849-1.074-.849-2.049v-3.6c0-.975.159-1.359.849-2.049'
    }
  ],
  ['path', { d: 'm16.25 9.75 5 5m0-5-5 5' }]
])

/** `volume-mute`: an alias of {@link VolumeOffIcon}. */
export const VolumeMuteIcon = VolumeOffIcon

/** `volume-x`: an alias of {@link VolumeOffIcon}. */
export const VolumeXIcon = VolumeOffIcon
