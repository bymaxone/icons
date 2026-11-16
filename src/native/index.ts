/**
 * @fileoverview Public entry point for the `./native` subpath of `@bymax-one/icons`: every
 * line, filled and 16 px icon as a React Native component, the `NativeIcon` base, the
 * `createNativeIcon` factory and the types of their props. Brand marks and flags have their
 * own entries, `./native/brands` and `./native/flags`.
 * @layer Module
 *
 * Everything here is re-exported by package specifier (`@bymax-one/icons/native/runtime`,
 * `@bymax-one/icons/native/icons/<name>` through the generated list) rather than by relative
 * path, for the same reason as the web root: each entry point is a separate bundle, and a
 * module reached from two of them by a relative path would be copied into each.
 */

export {
  createNativeFlag,
  createNativeIcon,
  NativeFlag,
  NativeIcon
} from '@bymax-one/icons/native/runtime'
export * from './generated/icons'

export type {
  NativeFlagBaseProps,
  NativeFlagComponent,
  NativeFlagProps,
  NativeIconBaseProps,
  NativeIconComponent,
  NativeIconProps
} from '@bymax-one/icons/native/runtime'
