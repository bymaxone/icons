/**
 * @fileoverview The `presentation` icon, line variant.
 * Written by `pnpm generate` from icons/line/presentation.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `presentation` icon, line variant: presentation, slides, board, pitch.
 *
 * @since 0.1.0
 */
export const PresentationIcon = /* @__PURE__ */ createIcon('presentation', [
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
