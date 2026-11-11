/**
 * @fileoverview The `pull-request` icon, line variant.
 * Written by `pnpm generate` from icons/line/pull-request.svg: edit the source, never this file.
 * @layer Generated
 */

import { createIcon } from '@bymax-one/icons/runtime'

/**
 * The `pull-request` icon, line variant: pull request, git, merge, review.
 *
 * @since 0.1.0
 */
export const PullRequestIcon = /* @__PURE__ */ createIcon('pull-request', [
  ['circle', { cx: 6.75, cy: 5.25, r: 1.75 }],
  ['circle', { cx: 6.75, cy: 19.25, r: 1.75 }],
  ['circle', { cx: 17.75, cy: 19.25, r: 1.75 }],
  ['path', { d: 'M6.75 10v4.5' }],
  ['path', { d: 'M17.75 14.5V9.25c0-1.75-.75-2.5-2.5-2.5h-2.5' }],
  ['path', { d: 'm15.25 4.25-2.5 2.5 2.5 2.5' }]
])

/** `git-pull-request`: an alias of {@link PullRequestIcon}. */
export const GitPullRequestIcon = PullRequestIcon
