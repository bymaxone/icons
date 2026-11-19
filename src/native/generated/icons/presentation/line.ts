/**
 * @fileoverview The `presentation` icon, line variant.
 * Written by `pnpm generate` from icons/line/presentation.svg: edit the source, never this file.
 * @layer Generated
 */

import { createNativeIcon } from '@bymax-one/icons/native/runtime'

/**
 * The `presentation` icon, line variant: presentation, slides, board, pitch.
 *
 * @since 1.0.0
 */
export const PresentationIcon = /* @__PURE__ */ createNativeIcon('presentation', [
  ['path', { d: 'M3.25 4.25h18' }],
  ['path', { d: 'M4.75 4.25v9c0 1.5.5 2 2 2h11c1.5 0 2-.5 2-2v-9' }],
  ['path', { d: 'M12.25 15.25v3m-3 3 3-3 3 3' }]
])

/** `slides`: an alias of {@link PresentationIcon}. */
export const SlidesIcon = PresentationIcon

/** `slideshow`: an alias of {@link PresentationIcon}. */
export const SlideshowIcon = PresentationIcon

/** `presentation-chart`: an alias of {@link PresentationIcon}. */
export const PresentationChartIcon = PresentationIcon
