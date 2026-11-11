import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'

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
  external: ['react', 'react/jsx-runtime', /^@bymax-one\/icons(?:\/|$)/],
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
// than the icon's own `index.ts`. The declaration bundler (rollup-plugin-dts 6.5.1, inside
// tsup 9.0.0) starts a new TypeScript program whenever an entry's directory differs from
// the previous entry's, so one directory per icon meant one program per icon: about
// 125 MB each, and the build of 56 icons ran out of memory. From one directory the icons
// share one program, and the built files are byte-identical (compared on ten icons). `pnpm
// clean` removes the directory.
const ICONS_DIR = 'src/icons/generated'
const ENTRIES_DIR = '.tsup-entries'
const iconNames = readdirSync(ICONS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
rmSync(ENTRIES_DIR, { recursive: true, force: true })
if (iconNames.length > 0) mkdirSync(ENTRIES_DIR)
const iconEntries = Object.fromEntries(
  iconNames.map((name) => {
    const file = `${ENTRIES_DIR}/${name}.ts`
    writeFileSync(file, `export * from '../${ICONS_DIR}/${name}/index'\n`)
    return [`icons/${name}/index`, file]
  })
)

export default defineConfig([
  // Root entry: every icon component, re-exported from the icon entries, and the runtime.
  { ...shared, entry: { index: 'src/index.ts' } },
  // Runtime entry: the `Icon` base and `createIcon`, which every icon module imports.
  { ...shared, entry: { 'runtime/index': 'src/runtime/index.ts' } },
  // Meta entry: typed metadata with no React import, so a consumer that only needs
  // names, tags or the grid never loads a renderer.
  { ...shared, entry: { 'meta/index': 'src/meta/index.ts' } },
  // Brands entry: every brand mark component.
  { ...shared, entry: { 'brands/index': 'src/brands/index.ts' } },
  // tsup refuses an empty entry list, so the icon entries exist only once an icon does.
  ...(Object.keys(iconEntries).length > 0 ? [{ ...shared, entry: iconEntries }] : [])
])
