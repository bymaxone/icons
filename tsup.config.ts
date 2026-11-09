import { readdirSync } from 'node:fs'

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
const ICONS_DIR = 'src/icons/generated'
const iconEntries = Object.fromEntries(
  readdirSync(ICONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [`icons/${entry.name}/index`, `${ICONS_DIR}/${entry.name}/index.ts`])
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
