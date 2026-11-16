# P6 React Native: specification draft

> **Status**: draft for the auditor's decision, before any code · **Ships as**: 1.1.0, a minor release · **Source**: [`development_plan.md`](./development_plan.md) §5 (P6)

Nothing here is built. Each item that depends on a measurement says what is measured, and the number is filled in when it is.

---

## 1. Goal

The same icons, brand marks and flags as React Native components, from the same `icons/` sources through the same pipeline. No drawing is kept twice.

## 2. Entry points

| Subpath                 | Holds                                     | Peer dependencies           |
| ----------------------- | ----------------------------------------- | --------------------------- |
| `./native`              | Every native component, named exports     | `react`, `react-native-svg` |
| `./native/icons/<name>` | One icon's components, for dynamic import | `react`, `react-native-svg` |
| `./native/brands`       | The brand marks                           | `react`, `react-native-svg` |
| `./native/flags`        | The flags                                 | `react`, `react-native-svg` |

- `react-native` and `react-native-svg` are optional peers (`peerDependenciesMeta`), so `dependencies` stays `{}` and a web consumer installs nothing new.
- Metro resolves the subpath through the `exports` map. A `react-native` condition is added only if Metro needs it, and the Expo test below decides that.
- The web entries do not change, and `check:api` shows no difference in their types.

## 3. Components

- A native component is generated from the same icon node as the web one and renders `Svg`, `Path`, `Circle` and the other elements the lint allows, imported from `react-native-svg`.
- It is a pure function: no hooks, no context.
- Name and class: `LightningIcon` in `./native`, as on the web; the `bx-icon-*` class has no meaning on native and is not emitted.

## 4. Props and colour

`IconProps` of the web components where a prop has a native meaning:

| Prop          | Native behaviour                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `size`        | A number, in density-independent pixels. A CSS length string is not accepted.                                                              |
| `color`       | Passed to the root `<Svg>`; see below.                                                                                                     |
| `strokeWidth` | As on the web, at the icon's master size.                                                                                                  |
| `title`       | Becomes `accessibilityLabel` with `accessibilityRole="image"`, and the icon is exposed.                                                    |
| no `title`    | A decorative icon sets `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`, as the web sets `aria-hidden`. |

**Colour.** The shapes keep `currentColor`, as on the web, and the component passes `color` to the root `<Svg>`. `react-native-svg` resolves `currentColor` from the root's `color` prop, so the API is the web's, and with no `color` the icon renders black. `color` is never required. A flag keeps its own colours and takes no `color` prop, as on the web, where its props omit `color`.

**Peer range.** `react-native-svg` is an optional peer with a minimum version: the first one that resolves `currentColor` from the root's `color`. The number is measured in the Expo test below and written here and in `peerDependencies`.

Props that exist only for the DOM (`className`, `style` as a CSS object, `ref` to an SVG element) are left out of the native type, not ignored.

## 5. Build and gates

- `pnpm generate` writes the native modules next to the web ones under `src/native/generated`, and `check:generated` covers them.
- tsup builds `./native` to ESM and CJS with its declarations, `react` and `react-native-svg` external.
- The size gate gets a budget per native entry, set 20% over the measured cost of the built entry. The number is measured on the first build and written here.
- `check:exports` and the published-surface check cover every `./native` subpath, and `attw` runs on them.
- A Jest test renders every native icon through `react-test-renderer` with a mock of `react-native-svg`, and a second test checks that the rendered element tree has the same shapes as the web render of the same icon.
- A colour test renders an icon with `color="red"` and checks that the root carries `color="red"` and the shapes still read `currentColor`; with no `color` the root has none. The Expo test then shows the shapes painted red on a device.
- Coverage and mutation stay at 100% for the hand-written native code; the generated modules are excluded as they are on the web.

## 6. The Expo test from the tarball

Recorded in the phase's task file, with the commands and what they returned:

1. Pack the library: `npm pack`.
2. Create a scratch Expo app on the current SDK outside this repository, and install the `.tgz` and `react-native-svg`.
3. Render, on one screen: a line icon, a filled icon, a 16 px master, a brand mark and a flag, at three sizes and two colours.
4. Run it on the iOS Simulator and an Android emulator, and capture a screenshot of each.
5. Check that Metro resolves `./native` and one `./native/icons/<name>` with no extra configuration, and record any resolution error.

The screenshots go to the auditor before the phase is called done.

## 7. Decisions

Decided by the auditor:

1. **The subpath.** `./native` with the per-entry subpaths above, one version for web and native.
2. **Colour.** `currentColor` on the shapes and `color` on the root `<Svg>`; black by default; no required `color`.
3. **Flags.** In `./native` in 1.1.0 with the icons and the brands. A flag keeps its own viewBox and colours and takes no `color` prop.
4. **Accessibility.** Decorative by default and hidden; `title` gives `accessibilityLabel` and `accessibilityRole="image"`.

Still open: the minimum `react-native-svg` version, measured in the Expo test. P6 starts only after the 1.0.0 release is merged.

## 8. Out of scope

Vue, Svelte and Angular packages. A native font or sprite. Animated icons.
