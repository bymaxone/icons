/**
 * Bundles what a consumer imports, the way a consumer's bundler does, and holds the result to a
 * budget.
 *
 * `check:size` measures each entry of the package with the package's own subpaths left external,
 * so an entry that reaches the whole metadata through a sibling subpath still measures a few
 * hundred bytes. A consumer pays for what the bundler cannot drop. This gate builds a real entry
 * (one icon by subpath, one by the root, the grid, a brand, a flag, and the React Native
 * equivalents) from the package unpacked under `node_modules`, in production mode with React
 * external, and fails when the result passes its budget: a module that cannot be dropped, such as
 * a top-level call with no `/* @__PURE__ *\/` annotation, shows here as the whole metadata in
 * the bundle.
 */

import { build } from 'esbuild'

/** The packages a consumer's app provides, left out of the measurement. */
const EXTERNAL = ['react', 'react/jsx-runtime', 'react-native-svg']

/**
 * What a consumer imports, and the most minified bytes its bundle may weigh. The numbers are the
 * measured size with room for one more drawing or two, far under the 160 KB of metadata that the
 * bundle held when a module could not be dropped.
 *
 * @param {{ icon?: string, brand?: string, flag?: string }} names - An icon, a brand mark and a
 *   flag the package holds; a package without one of them (the placeholder set) gets no entry for
 *   it.
 * @returns {{ name: string, code: string, limit: number }[]} The entries.
 */
export function bundleEntries({ icon, brand, flag }) {
  const component = (kebab, kind) =>
    `${kebab
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')}${kind}Icon`
  const one = (specifier, symbol) =>
    `import { ${symbol} } from '@bymax-one/icons${specifier}'\nconsole.log(${symbol})\n`
  const KIB = 1024
  const grid = [
    { name: 'the grid from meta', code: one('/meta', 'ICON_GRID'), limit: KIB },
    { name: 'the grid from its own subpath', code: one('/grid', 'ICON_GRID'), limit: KIB }
  ]
  const icons =
    icon === undefined
      ? []
      : [
          {
            name: 'an icon by subpath',
            code: one(`/icons/${icon}`, component(icon, '')),
            limit: 4 * KIB
          },
          { name: 'an icon from the root', code: one('', component(icon, '')), limit: 4 * KIB },
          {
            name: 'a native icon by subpath',
            code: one(`/native/icons/${icon}`, component(icon, '')),
            limit: 6 * KIB
          }
        ]
  const brands =
    brand === undefined
      ? []
      : [
          {
            name: 'a brand mark by subpath',
            code: one(`/brands/${brand}`, component(brand, 'Brand')),
            limit: 4 * KIB
          },
          {
            name: 'a native brand mark by subpath',
            code: one(`/native/brands/${brand}`, component(brand, 'Brand')),
            limit: 6 * KIB
          }
        ]
  const flags =
    flag === undefined
      ? []
      : [
          {
            name: 'a flag by subpath',
            code: one(`/flags/${flag}`, component(flag, '')),
            limit: 6 * KIB
          },
          {
            name: 'a native flag by subpath',
            code: one(`/native/flags/${flag}`, component(flag, '')),
            limit: 8 * KIB
          }
        ]
  return [
    ...icons.slice(0, 2),
    ...grid,
    ...brands.slice(0, 1),
    ...flags.slice(0, 1),
    ...icons.slice(2),
    ...brands.slice(1),
    ...flags.slice(1)
  ]
}

/**
 * Bundles one entry as a consumer's production build would.
 *
 * @param {string} code - The entry's source.
 * @param {string} resolveDir - A directory whose `node_modules` holds the package.
 * @returns {Promise<number>} The minified bundle's size in bytes.
 */
export async function bundledBytes(code, resolveDir) {
  const result = await build({
    stdin: { contents: code, resolveDir, loader: 'js' },
    bundle: true,
    minify: true,
    treeShaking: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    external: EXTERNAL,
    define: { 'process.env.NODE_ENV': '"production"' },
    write: false,
    logLevel: 'silent'
  })
  return result.outputFiles[0].contents.length
}

/**
 * Bundles every entry and says which ones pass their budget.
 *
 * @param {{ name: string, code: string, limit: number }[]} entries - What to bundle.
 * @param {string} resolveDir - A directory whose `node_modules` holds the package.
 * @returns {Promise<{ name: string, bytes: number, limit: number, ok: boolean }[]>} One result per
 *   entry.
 */
export async function measureBundles(entries, resolveDir) {
  return Promise.all(
    entries.map(async ({ name, code, limit }) => {
      const bytes = await bundledBytes(code, resolveDir)
      return { name, bytes, limit, ok: bytes <= limit }
    })
  )
}
