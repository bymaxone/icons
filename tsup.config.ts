import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'

import { defineConfig } from 'tsup'
import type { Options } from 'tsup'

// Every entry is a browser entry: it targets es2022 and compiles JSX with the automatic
// runtime, and React stays a peer.
//
// The package's own subpaths are external. Entry points are separate bundles, so a
// module two of them reach by a relative path is copied into each; importing a sibling
// by package specifier keeps one copy of it in the published package, in CommonJS as
// well as ESM, which esbuild's code splitting could not do (it splits ESM only). That is
// how each icon exists once: the root re-exports `@bymax-one/icons/icons/<name>`, and
// every icon module imports `createIcon` from `@bymax-one/icons/runtime`.
const shared: Options = {
  format: ['esm', 'cjs'],
  dts: true,
  tsconfig: 'tsconfig.build.json',
  outDir: 'dist',
  outExtension: ({ format }) => ({
    js: format === 'esm' ? '.mjs' : '.cjs'
  }),
  external: [
    'react',
    'react/jsx-runtime',
    /^react-native(?:-svg)?(?:\/|$)/,
    /^@bymax-one\/icons(?:\/|$)/
  ],
  target: 'es2022',
  clean: false,
  splitting: false,
  treeshake: true,
  sourcemap: false,
  minify: false,
  esbuildOptions(options) {
    options.jsx = 'automatic'
  }
}

// One entry per generated icon, `./icons/<name>`, emitted as `dist/icons/<name>/index.*`
// so the comment strip that runs on every `index.mjs` and `index.cjs` covers it. The list
// is read from the generated directory, which holds one subdirectory per icon.
//
// Each entry is a one-line re-export written to a single directory, ENTRIES_DIR, rather
// than the icon's own `index.ts`. The declaration bundler starts a new TypeScript program
// whenever an entry's directory differs from the previous entry's, and each program costs
// about 125 MB, so one directory per icon would mean one program per icon and a build whose
// memory grows with the set. From one directory the icons share one program. `pnpm clean`
// removes the directory.
const ICONS_DIR = 'src/icons/generated'
const ENTRIES_DIR = '.tsup-entries'
const iconNames = readdirSync(ICONS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
rmSync(ENTRIES_DIR, { recursive: true, force: true })
mkdirSync(ENTRIES_DIR)
const iconEntries = Object.fromEntries(
  iconNames.map((name) => {
    const file = `${ENTRIES_DIR}/${name}.ts`
    writeFileSync(file, `export * from '../${ICONS_DIR}/${name}/index'\n`)
    return [`icons/${name}/index`, file]
  })
)

// One entry per generated brand mark, `./brands/<name>`, emitted as `dist/brands/<name>/index.*`
// from the same entries directory, like the flags, so a consumer who imports one mark loads it
// alone.
const BRANDS_DIR = 'src/brands/generated'
const brandNames = readdirSync(BRANDS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'index.ts')
  .map((entry) => entry.name.slice(0, -'.ts'.length))
const brandEntries = Object.fromEntries(
  brandNames.map((name) => {
    const file = `${ENTRIES_DIR}/brand-${name}.ts`
    writeFileSync(file, `export * from '../${BRANDS_DIR}/${name}'\n`)
    return [`brands/${name}/index`, file]
  })
)

// One entry per generated flag, `./flags/<name>`, emitted as `dist/flags/<name>/index.*` from the
// same entries directory, so the flags share one declaration program like the icons do.
const FLAGS_DIR = 'src/flags/generated'
const flagNames = readdirSync(FLAGS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'index.ts')
  .map((entry) => entry.name.slice(0, -'.ts'.length))
if (flagNames.length > 0) mkdirSync(ENTRIES_DIR, { recursive: true })
const flagEntries = Object.fromEntries(
  flagNames.map((name) => {
    const file = `${ENTRIES_DIR}/flag-${name}.ts`
    writeFileSync(file, `export * from '../${FLAGS_DIR}/${name}'\n`)
    return [`flags/${name}/index`, file]
  })
)

// The React Native entries, `./native/icons/<name>` and `./native/flags/<name>`, come from the
// same entries directory, so the native components share one declaration program as well. They
// build with the native tsconfig, because the web one cannot see `src/native`: the types of
// `react-native` conflict with `lib.dom`. `react-native` and `react-native-svg` stay external.
const native: Options = { ...shared, tsconfig: 'tsconfig.build.native.json' }
const NATIVE_ICONS_DIR = 'src/native/generated/icons'
// A build with no native tree has no native entries, like a build with no icon.
const listDirectory = (dir: string) =>
  existsSync(dir) ? readdirSync(dir, { withFileTypes: true }) : []
const nativeIconEntries = Object.fromEntries(
  listDirectory(NATIVE_ICONS_DIR)
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const file = `${ENTRIES_DIR}/native-icon-${entry.name}.ts`
      writeFileSync(file, `export * from '../${NATIVE_ICONS_DIR}/${entry.name}/index'\n`)
      return [`native/icons/${entry.name}/index`, file]
    })
)
const NATIVE_BRANDS_DIR = 'src/native/generated/brands'
const nativeBrandEntries = Object.fromEntries(
  listDirectory(NATIVE_BRANDS_DIR)
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'index.ts')
    .map((entry) => {
      const name = entry.name.slice(0, -'.ts'.length)
      const file = `${ENTRIES_DIR}/native-brand-${name}.ts`
      writeFileSync(file, `export * from '../${NATIVE_BRANDS_DIR}/${name}'\n`)
      return [`native/brands/${name}/index`, file]
    })
)
const NATIVE_FLAGS_DIR = 'src/native/generated/flags'
const nativeFlagEntries = Object.fromEntries(
  listDirectory(NATIVE_FLAGS_DIR)
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'index.ts')
    .map((entry) => {
      const name = entry.name.slice(0, -'.ts'.length)
      const file = `${ENTRIES_DIR}/native-flag-${name}.ts`
      writeFileSync(file, `export * from '../${NATIVE_FLAGS_DIR}/${name}'\n`)
      return [`native/flags/${name}/index`, file]
    })
)

export default defineConfig([
  // Root entry: every icon component, re-exported from the icon entries, and the runtime.
  { ...shared, entry: { index: 'src/index.ts' } },
  // Runtime entry: the `Icon` base and `createIcon`, which every icon module imports.
  { ...shared, entry: { 'runtime/index': 'src/runtime/index.ts' } },
  // Grid entry: the drawing grid alone, which the runtimes import, so reading it never loads
  // the metadata.
  { ...shared, entry: { 'grid/index': 'src/grid/index.ts' } },
  // Meta entry: typed metadata with no React import, so a consumer that only needs
  // names, tags or the grid never loads a renderer.
  { ...shared, entry: { 'meta/index': 'src/meta/index.ts' } },
  // Brands entry: every brand mark component.
  { ...shared, entry: { 'brands/index': 'src/brands/index.ts' } },
  // Flags entry: every country flag component, re-exported from the flag entries.
  { ...shared, entry: { 'flags/index': 'src/flags/index.ts' } },
  // tsup refuses an empty entry list, so the icon and flag entries exist only once one does.
  ...(Object.keys(iconEntries).length > 0 ? [{ ...shared, entry: iconEntries }] : []),
  ...(Object.keys(brandEntries).length > 0 ? [{ ...shared, entry: brandEntries }] : []),
  ...(Object.keys(flagEntries).length > 0 ? [{ ...shared, entry: flagEntries }] : []),
  // React Native entries: the components, the runtime, the brand marks and the flags.
  { ...native, entry: { 'native/index': 'src/native/index.ts' } },
  { ...native, entry: { 'native/runtime/index': 'src/native/runtime/index.ts' } },
  { ...native, entry: { 'native/brands/index': 'src/native/brands/index.ts' } },
  { ...native, entry: { 'native/flags/index': 'src/native/flags/index.ts' } },
  ...(Object.keys(nativeIconEntries).length > 0 ? [{ ...native, entry: nativeIconEntries }] : []),
  ...(Object.keys(nativeBrandEntries).length > 0 ? [{ ...native, entry: nativeBrandEntries }] : []),
  ...(Object.keys(nativeFlagEntries).length > 0 ? [{ ...native, entry: nativeFlagEntries }] : [])
])
