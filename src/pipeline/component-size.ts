/**
 * @fileoverview The size of each icon component as a consumer ships it: one named import,
 * bundled by esbuild (minified, tree-shaken, `react` external) and compressed with brotli at
 * the quality of the package budgets. A component's bundle must hold its own drawing and no
 * sibling's: that is what proves the module tree-shakes.
 * @layer Pipeline
 */

import { dirname } from 'node:path'
import { brotliCompressSync } from 'node:zlib'

import { build } from 'esbuild'

/** The specifier every icon module imports `createIcon` from. */
export const RUNTIME_SPECIFIER = '@bymax-one/icons/runtime'

/** One component of an icon module, measured. */
export interface ComponentSize {
  /** The exported name, such as `HomeFilledIcon`. */
  readonly component: string
  /** The drawing it passes to `createIcon`; undefined when the module text does not show it. */
  readonly drawing: string | undefined
  /** Brotli bytes of the component alone, the runtime left external. */
  readonly alone: number
  /** Brotli bytes of the component with the runtime bundled in. */
  readonly withRuntime: number
  /** The drawings of sibling components its bundle still holds; empty when it tree-shakes. */
  readonly leaks: readonly string[]
}

/**
 * The names a built module exports, from its closing `export { A, B };`.
 *
 * @param moduleText - The module's code.
 * @returns The exported names, in order; none when the module has no such statement.
 */
export function exportedNames(moduleText: string): string[] {
  const list = /export\s*\{([^}]*)\}\s*;?\s*$/.exec(moduleText)?.[1]
  if (list === undefined) return []
  return list
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '')
}

/**
 * The drawing name each component passes to `createIcon`, keyed by component; an alias
 * (`var WarningIcon = AlertTriangleIcon;`) carries the drawing of the component it names.
 * A call without its `@__PURE__` annotation is read too: it is the call a bundler cannot
 * drop, so it is the one that leaks into a sibling's bundle. So is a call tsup breaks over
 * lines, as it does when the path data is long.
 *
 * @param moduleText - The module's code.
 * @returns The drawing of each component, such as `HomeFilledIcon` to `home-filled`.
 */
export function drawingNames(moduleText: string): Map<string, string> {
  const names = new Map<string, string>()
  for (const [, component, drawing] of moduleText.matchAll(
    /var (\w+) = (?:\/\* @__PURE__ \*\/ )?createIcon\(\s*"([^"]+)"/g
  )) {
    names.set(String(component), String(drawing))
  }
  for (const [, alias, target] of moduleText.matchAll(/var (\w+) = (\w+);/g)) {
    const drawing = names.get(String(target))
    if (drawing !== undefined) names.set(String(alias), drawing)
  }
  return names
}

/**
 * Bundles one named export of a built module as a consumer would.
 *
 * @param modulePath - Absolute path of the built module.
 * @param component - The export to keep.
 * @param runtimePath - Absolute path of the built runtime, bundled in when given and left
 *   external otherwise.
 * @returns The minified bundle.
 */
export async function bundleComponent(
  modulePath: string,
  component: string,
  runtimePath?: string
): Promise<string> {
  const result = await build({
    stdin: {
      contents: `export { ${component} } from ${JSON.stringify(modulePath)}`,
      loader: 'js',
      resolveDir: dirname(modulePath)
    },
    bundle: true,
    write: false,
    format: 'esm',
    minify: true,
    treeShaking: true,
    logLevel: 'silent',
    // The runtime specifier stays external; the alias, which esbuild resolves first, inlines
    // the runtime when its path is given.
    external: ['react', 'react/jsx-runtime', RUNTIME_SPECIFIER],
    alias: runtimePath === undefined ? {} : { [RUNTIME_SPECIFIER]: runtimePath }
  })
  // One entry, one output file.
  return Buffer.concat(result.outputFiles.map((file) => file.contents)).toString()
}

/**
 * Brotli bytes of a text, at Node's default quality, 11: the maximum, which
 * `scripts/check-size.mjs` sets explicitly.
 *
 * @param text - The text.
 * @returns Its compressed length.
 */
export function brotliSize(text: string): number {
  return brotliCompressSync(Buffer.from(text)).length
}

/**
 * Measures every component of one built icon module.
 *
 * @param moduleText - The module's code, which names its components and their drawings.
 * @param modulePath - Absolute path of the module.
 * @param runtimePath - Absolute path of the built runtime.
 * @returns One measure per exported component, in export order.
 */
export async function measureModule(
  moduleText: string,
  modulePath: string,
  runtimePath: string
): Promise<ComponentSize[]> {
  const drawings = drawingNames(moduleText)
  const sizes: ComponentSize[] = []
  for (const component of exportedNames(moduleText)) {
    const alone = await bundleComponent(modulePath, component)
    const withRuntime = await bundleComponent(modulePath, component, runtimePath)
    const own = drawings.get(component)
    const leaks = [...new Set(drawings.values())].filter(
      (drawing) => drawing !== own && alone.includes(JSON.stringify(drawing))
    )
    sizes.push({
      component,
      drawing: own,
      alone: brotliSize(alone),
      withRuntime: brotliSize(withRuntime),
      leaks
    })
  }
  return sizes
}
