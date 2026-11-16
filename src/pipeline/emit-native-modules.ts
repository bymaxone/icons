/**
 * @fileoverview The React Native modules the generator writes: the same modules as the web
 * ones, from the same sources and the same drawing literal, importing `createNativeIcon` and
 * `createNativeFlag` from `@bymax-one/icons/native/runtime` and written under
 * `src/native/generated`. Everything but the flavour is shared with `emit-modules.ts`, so no
 * drawing, paint, alias or documentation can differ between the two.
 * @layer Pipeline
 */

import { flavouredModules } from './emit-modules.ts'
import type { Flavour } from './emit-modules.ts'
import type { IconSet } from './icon-set.ts'

/** The native modules: `createNativeIcon` and `createNativeFlag` from `./native/runtime`. */
export const NATIVE_FLAVOUR: Flavour = {
  directories: {
    icons: 'src/native/generated/icons',
    brands: 'src/native/generated/brands',
    flags: 'src/native/generated/flags'
  },
  runtime: '@bymax-one/icons/native/runtime',
  createIcon: 'createNativeIcon',
  createFlag: 'createNativeFlag',
  subpath: '@bymax-one/icons/native/',
  entry: 'the `./native` entry'
}

/**
 * Every native component module, keyed by path from the repository root.
 *
 * @param set - The icon set.
 * @returns The modules' unformatted text.
 */
export function nativeComponentModules(set: IconSet): Map<string, string> {
  return flavouredModules(set, NATIVE_FLAVOUR)
}
