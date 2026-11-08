import { defineConfig } from 'tsup'

export default defineConfig([
  // Root entry: the React components and the `Icon` base. A browser entry, so it
  // targets es2022 and compiles JSX with the automatic runtime; React stays a peer.
  //
  // The package's own subpaths are external. Entry points are separate bundles, so a
  // module two of them reach by a relative path is copied into each; importing a
  // sibling by package specifier keeps one copy of it in the published package, in
  // CommonJS as well as ESM, which esbuild's code splitting could not do (it splits
  // ESM only).
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    tsconfig: 'tsconfig.build.json',
    outDir: 'dist',
    outExtension: ({ format }) => ({
      js: format === 'esm' ? '.mjs' : '.cjs'
    }),
    external: ['react', 'react/jsx-runtime', /^@bymax-one\/icons\//],
    target: 'es2022',
    clean: false,
    splitting: false,
    treeshake: true,
    sourcemap: false,
    minify: false,
    esbuildOptions(options) {
      options.jsx = 'automatic'
    }
  },
  // Meta entry: typed metadata with no React import, so a consumer that only needs
  // names, tags or the grid never loads a renderer.
  {
    entry: { 'meta/index': 'src/meta/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    tsconfig: 'tsconfig.build.json',
    outDir: 'dist',
    outExtension: ({ format }) => ({
      js: format === 'esm' ? '.mjs' : '.cjs'
    }),
    target: 'es2022',
    clean: false,
    splitting: false,
    treeshake: true,
    sourcemap: false,
    minify: false
  }
])
