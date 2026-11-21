/**
 * @fileoverview Reads what a built React Native bundle exports from its text, and where a
 * `./native` subpath resolves. Shared by `check-consumer-runtime.mjs` and
 * `dogfood-smoke-test.mjs`.
 * @layer scripts
 *
 * The React Native entries cannot be loaded under Node: they import `react-native-svg`, whose
 * source is Flow that only Metro compiles. The gates therefore never import them; they resolve
 * the specifier through the package's `exports` map and read the export names off the bundle
 * text, which tsup writes in a fixed shape (`export { A, B }` and `export { A } from '...'` in
 * ESM, `exports.A =` and `Object.defineProperty(exports, "A"` in CommonJS).
 */

import { readFileSync } from 'node:fs'

/**
 * The names a built bundle exports.
 *
 * @param {string} file - An `index.mjs` or `index.cjs` of the built package.
 * @returns {string[]} The sorted export names.
 */
export function bundleExportNames(file) {
  const source = readFileSync(file, 'utf8')
  const names = new Set()
  if (file.endsWith('.mjs')) {
    for (const match of source.matchAll(/^export\s*\{([^}]*)\}/gm)) {
      for (const part of match[1].split(',')) {
        const name = part
          .trim()
          .split(/\s+as\s+/)
          .pop()
        if (name) names.add(name)
      }
    }
  } else {
    for (const match of source.matchAll(/^exports\.(\w+)\s*=/gm)) names.add(match[1])
    for (const match of source.matchAll(/^Object\.defineProperty\(exports,\s*"(\w+)"/gm)) {
      names.add(match[1])
    }
  }
  return [...names].sort()
}

/**
 * The failures of one built package's native subpaths: a resolved file that is not the
 * expected one, or an export list that differs from the expected one.
 *
 * @param {Record<string, string[]>} nativeExports - Expected export names per native subpath.
 * @param {Record<string, { esm: string, cjs: string }>} resolved - Absolute paths each subpath
 *   resolved to in ESM and in CommonJS, as a consumer's resolver returned them.
 * @param {(subpath: string, format: 'esm' | 'cjs') => string} expectedFile - The package-relative
 *   file the `exports` map declares for a subpath.
 * @returns {string[]} The failures; empty when every subpath resolves and exports its names.
 */
export function nativeFailures(nativeExports, resolved, expectedFile) {
  const failures = []
  const resolvedBySubpath = new Map(Object.entries(resolved))
  for (const [subpath, names] of Object.entries(nativeExports)) {
    for (const format of /** @type {const} */ (['esm', 'cjs'])) {
      const where = resolvedBySubpath.get(subpath)
      const actual = format === 'esm' ? where?.esm : where?.cjs
      const expected = expectedFile(subpath, format)
      if (actual === undefined) {
        failures.push(`${subpath} did not resolve in ${format}`)
        continue
      }
      if (!actual.endsWith(`/${expected}`)) {
        failures.push(`${subpath} resolved to ${actual} in ${format}, expected ${expected}`)
        continue
      }
      const found = bundleExportNames(actual)
      if (JSON.stringify(found) !== JSON.stringify([...names].sort())) {
        const missing = names.filter((name) => !found.includes(name))
        const extra = found.filter((name) => !names.includes(name))
        failures.push(
          `${subpath} (${format}) exports differ: missing ${JSON.stringify(missing.slice(0, 5))}, extra ${JSON.stringify(extra.slice(0, 5))}`
        )
      }
    }
  }
  return failures
}

/**
 * The package-relative file the `exports` map declares for a subpath, in one module format.
 * An exact key wins; otherwise the pattern key (`./native/icons/*`) whose `*` stands for the
 * rest of the subpath.
 *
 * @param {Record<string, any>} exportsMap - `package.json` "exports".
 * @param {string} subpath - A subpath such as `./native/icons/check`.
 * @param {'esm' | 'cjs'} format - The module format.
 * @returns {string} The file, without a leading `./`.
 */
export function declaredFile(exportsMap, subpath, format) {
  const table = new Map(Object.entries(exportsMap))
  let entry = table.get(subpath)
  let star = ''
  if (entry === undefined) {
    const key = [...table.keys()].find(
      (candidate) => candidate.endsWith('/*') && subpath.startsWith(candidate.slice(0, -1))
    )
    if (key === undefined) throw new Error(`no exports entry for ${subpath}`)
    entry = table.get(key)
    star = subpath.slice(key.length - 1)
  }
  const conditions = format === 'esm' ? entry.import : entry.require
  return conditions.default.replace(/^\.\//, '').replaceAll('*', star)
}

/**
 * The files of the native subpaths, relative to `dist/`, for the bundle scans.
 *
 * @param {string[]} subpaths - The native subpaths.
 * @returns {string[]} For `./native/brands`, `native/brands/index`; for `./native`, `native/index`.
 */
export function nativeEntries(subpaths) {
  return subpaths.map((subpath) =>
    subpath === './native' ? 'native/index' : `${subpath.slice(2)}/index`
  )
}
