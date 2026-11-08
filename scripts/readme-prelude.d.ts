/**
 * @fileoverview The names a README snippet uses without declaring them, typed against
 * the published package. `check-published-surface.mjs` copies this file into the
 * throwaway consumer it compiles the snippets in, so a call made through one of these
 * names is checked against the real types instead of resolving to `any`.
 * Only names the surrounding prose introduces belong here; a wrong option, method or
 * field on a package type is a real error and must stay one. The README snippets of
 * this package introduce none yet, so the declaration is empty.
 */

export {}

declare global {}
