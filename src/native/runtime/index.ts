/**
 * @fileoverview Public entry point for the `./native/runtime` subpath of `@bymax-one/icons`:
 * the React Native runtime every native icon renders through, the `NativeIcon` base, the
 * `createNativeIcon` factory, the `NativeFlag` base and the `createNativeFlag` factory for
 * the country flags, and the types of their props.
 * @layer Module
 */

export { createNativeFlag } from './create-native-flag'
export { createNativeIcon } from './create-native-icon'
export { NativeFlag } from './native-flag'
export { NativeIcon } from './native-icon'

export type { NativeFlagComponent } from './create-native-flag'
export type { NativeIconComponent } from './create-native-icon'
export type {
  NativeFlagBaseProps,
  NativeFlagProps,
  NativeIconBaseProps,
  NativeIconProps
} from './native-icon-props'
