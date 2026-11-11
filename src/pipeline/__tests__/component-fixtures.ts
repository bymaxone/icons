/**
 * @fileoverview Built-module fixtures for the per-component size specs: a stand-in runtime
 * and icon modules in the shape tsup emits, written under a scratch `dist/`.
 * @layer Pipeline tests
 */

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** A string only the stand-in runtime holds, so a bundle that includes it can be told apart. */
export const RUNTIME_MARKER = 'fixture-runtime-marker'

/** The stand-in runtime: it imports both React entries the real one may use. */
export const RUNTIME = `import { createElement } from 'react';
import { jsx } from 'react/jsx-runtime';

var marker = "${RUNTIME_MARKER}";
function createIcon(name, nodes) {
  return function Icon(props) {
    return jsx("svg", { "data-runtime": marker, "data-name": name, ...props, children: nodes.map((node) => createElement(node[0], node[1])) });
  };
}

export { createIcon };
`

/** One component of a fixture module. */
export interface FixtureComponent {
  /** The exported name. */
  readonly name: string
  /** The drawing name it passes to `createIcon`. */
  readonly drawing: string
  /** Path data, which sets the size of the drawing. */
  readonly d: string
  /** Whether the call carries `@__PURE__`, as every generated one does. */
  readonly pure: boolean
  /** Whether the call is broken over lines, as tsup prints one whose path data is long. */
  readonly multiline?: boolean
}

/**
 * The code of an icon module in the shape tsup emits.
 *
 * @param components - The components, in declaration order.
 * @param aliases - Alias name to the component it names.
 * @returns The module's code.
 */
export function iconModule(
  components: readonly FixtureComponent[],
  aliases: Readonly<Record<string, string>> = {}
): string {
  const lines = ["import { createIcon } from '@bymax-one/icons/runtime';", '']
  for (const { name, drawing, d, pure, multiline = false } of components) {
    const annotation = pure ? '/* @__PURE__ */ ' : ''
    const call = multiline
      ? `createIcon(\n  "${drawing}",\n  [["path", { d: "${d}" }]]\n)`
      : `createIcon("${drawing}", [["path", { d: "${d}" }]])`
    lines.push(`var ${name} = ${annotation}${call};`)
  }
  for (const [alias, target] of Object.entries(aliases)) lines.push(`var ${alias} = ${target};`)
  const names = [...components.map(({ name }) => name), ...Object.keys(aliases)].sort()
  lines.push('', `export { ${names.join(', ')} };`, '')
  return lines.join('\n')
}

/** A scratch repository root with `dist/runtime/index.mjs` and the given icon modules. */
export function scratchDist(modules: Readonly<Record<string, string>>, runtime = true): string {
  const root = mkdtempSync(join(tmpdir(), 'component-size-'))
  if (runtime) {
    mkdirSync(join(root, 'dist', 'runtime'), { recursive: true })
    writeFileSync(join(root, 'dist', 'runtime', 'index.mjs'), RUNTIME)
  }
  for (const [name, code] of Object.entries(modules)) {
    mkdirSync(join(root, 'dist', 'icons', name), { recursive: true })
    writeFileSync(join(root, 'dist', 'icons', name, 'index.mjs'), code)
  }
  return root
}
