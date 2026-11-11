/**
 * Unit tests for the per-component size measure.
 *
 * Layer: unit, against built-module fixtures on disk, bundled by the real esbuild.
 * Goal: prove that each component is bundled as a consumer imports it (minified, its own
 * drawing kept, the runtime external or inlined on request, React always external), that
 * a module whose components are all `@__PURE__` tree-shakes, and that one call without the
 * annotation is reported as a leak in its siblings' bundles.
 * Mocks: none.
 */

import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { brotliCompressSync } from 'node:zlib'

import { RUNTIME_MARKER, iconModule, scratchDist } from './__tests__/component-fixtures.ts'
import type { FixtureComponent } from './__tests__/component-fixtures.ts'
import {
  RUNTIME_SPECIFIER,
  brotliSize,
  bundleComponent,
  drawingNames,
  exportedNames,
  measureModule
} from './component-size.ts'

const ALPHA: FixtureComponent = {
  name: 'AlphaIcon',
  drawing: 'alpha-fixture',
  d: 'M4 4h16v16H4z',
  pure: true
}
const BETA: FixtureComponent = {
  name: 'BetaIcon',
  drawing: 'beta-fixture',
  d: 'M6 6l12 12M18 6L6 18',
  pure: true
}

const roots: string[] = []

/** A scratch module on disk, and the paths a measure needs. */
function fixture(code: string): { code: string; modulePath: string; runtimePath: string } {
  const root = scratchDist({ sample: code })
  roots.push(root)
  return {
    code,
    modulePath: join(root, 'dist', 'icons', 'sample', 'index.mjs'),
    runtimePath: join(root, 'dist', 'runtime', 'index.mjs')
  }
}

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true })
})

describe('exportedNames', () => {
  it('reads the names of the closing export statement, in order', () => {
    // Scenario: the shape tsup emits, a trailing semicolon and newline included.
    expect(exportedNames('var a = 1;\n\nexport { AIcon, WarningIcon };\n')).toEqual([
      'AIcon',
      'WarningIcon'
    ])
  })

  it('reads a statement without spaces, semicolon or newline', () => {
    // Scenario: the whitespace and the semicolon are optional.
    expect(exportedNames('var a = 1;export{AIcon,BIcon}')).toEqual(['AIcon', 'BIcon'])
  })

  it('reads a statement with a space before its semicolon', () => {
    // Scenario: whitespace may sit between the closing brace and the semicolon.
    expect(exportedNames('export { AIcon } ;')).toEqual(['AIcon'])
  })

  it('drops the empty name a trailing comma leaves', () => {
    // Scenario: `export { A, }` exports one name.
    expect(exportedNames('export { AIcon, };')).toEqual(['AIcon'])
  })

  it('ignores an export statement that does not close the module', () => {
    // Scenario: only the closing statement is the module's export list.
    expect(exportedNames('export { AIcon };\nvar later = 1;\n')).toEqual([])
  })

  it('returns nothing for a module without an export statement', () => {
    // Scenario: no list to read.
    expect(exportedNames('var a = 1;\n')).toEqual([])
  })
})

describe('drawingNames', () => {
  it('maps each component to the drawing it passes to createIcon', () => {
    // Scenario: two annotated calls, as every generated module has.
    expect(drawingNames(iconModule([ALPHA, BETA]))).toEqual(
      new Map([
        ['AlphaIcon', 'alpha-fixture'],
        ['BetaIcon', 'beta-fixture']
      ])
    )
  })

  it('reads a call without its pure annotation', () => {
    // Scenario: the unannotated call is the one that can leak, so it must be known.
    expect(drawingNames(iconModule([{ ...ALPHA, pure: false }]))).toEqual(
      new Map([['AlphaIcon', 'alpha-fixture']])
    )
  })

  it('reads a call broken over lines', () => {
    // Scenario: tsup prints a long call as `createIcon(\n  "name",\n  [...]\n)`.
    expect(drawingNames(iconModule([{ ...ALPHA, multiline: true }]))).toEqual(
      new Map([['AlphaIcon', 'alpha-fixture']])
    )
  })

  it('gives an alias the drawing of the component it names', () => {
    // Scenario: `var WarningIcon = AlertTriangleIcon;` draws the alert triangle.
    expect(drawingNames(iconModule([ALPHA], { AlphaAliasIcon: 'AlphaIcon' }))).toEqual(
      new Map([
        ['AlphaIcon', 'alpha-fixture'],
        ['AlphaAliasIcon', 'alpha-fixture']
      ])
    )
  })

  it('ignores an assignment that names no component', () => {
    // Scenario: `var x = y;` where `y` draws nothing adds no entry.
    expect(drawingNames(`${iconModule([ALPHA])}var other = elsewhere;\n`)).toEqual(
      new Map([['AlphaIcon', 'alpha-fixture']])
    )
  })
})

describe('bundleComponent', () => {
  it('keeps only the imported drawing, minified, with the runtime external', async () => {
    // Scenario: a consumer imports one component of a pure module.
    const { modulePath } = fixture(iconModule([ALPHA, BETA]))
    const bundle = await bundleComponent(modulePath, 'AlphaIcon')
    expect(bundle).toContain('"alpha-fixture"')
    expect(bundle).not.toContain('"beta-fixture"')
    expect(bundle).toContain(`from"${RUNTIME_SPECIFIER}"`)
    expect(bundle).not.toContain(RUNTIME_MARKER)
    expect(bundle.trimEnd().split('\n')).toHaveLength(1)
  })

  it('inlines the runtime when its path is given, React still external', async () => {
    // Scenario: the component with the runtime, the pair spec §12 budgets.
    const { modulePath, runtimePath } = fixture(iconModule([ALPHA, BETA]))
    const bundle = await bundleComponent(modulePath, 'BetaIcon', runtimePath)
    expect(bundle).toContain('"beta-fixture"')
    expect(bundle).not.toContain('"alpha-fixture"')
    expect(bundle).toContain(RUNTIME_MARKER)
    expect(bundle).not.toContain(RUNTIME_SPECIFIER)
    expect(bundle).toContain('from"react"')
    expect(bundle).toContain('from"react/jsx-runtime"')
  })
})

describe('brotliSize', () => {
  it('is the brotli length of the text at the maximum quality', () => {
    // Scenario: the same compression the package budgets use.
    const text = 'createIcon("alpha-fixture",[["path",{d:"M4 4h16v16H4z"}]])'.repeat(4)
    expect(brotliSize(text)).toBe(brotliCompressSync(Buffer.from(text)).length)
    expect(brotliSize(text)).toBeLessThan(text.length)
  })
})

describe('measureModule', () => {
  it('measures every export of a pure module and finds no leak', async () => {
    // Scenario: every generated module, an alias included.
    const { code, modulePath, runtimePath } = fixture(
      iconModule([ALPHA, BETA], { AlphaAliasIcon: 'AlphaIcon' })
    )
    const sizes = await measureModule(code, modulePath, runtimePath)
    expect(sizes.map(({ component }) => component)).toEqual([
      'AlphaAliasIcon',
      'AlphaIcon',
      'BetaIcon'
    ])
    expect(sizes.map(({ drawing }) => drawing)).toEqual([
      'alpha-fixture',
      'alpha-fixture',
      'beta-fixture'
    ])
    for (const size of sizes) {
      expect(size.leaks).toEqual([])
      expect(size.alone).toBe(brotliSize(await bundleComponent(modulePath, size.component)))
      expect(size.withRuntime).toBe(
        brotliSize(await bundleComponent(modulePath, size.component, runtimePath))
      )
      expect(size.withRuntime).toBeGreaterThan(size.alone)
    }
  })

  it('finds the leak of an unannotated call broken over lines', async () => {
    // Scenario: a long filled path makes tsup break the call; the leak is still seen.
    const { code, modulePath, runtimePath } = fixture(
      iconModule([{ ...ALPHA, pure: false, multiline: true }, BETA])
    )
    const [, beta] = await measureModule(code, modulePath, runtimePath)
    expect(beta).toMatchObject({ component: 'BetaIcon', leaks: ['alpha-fixture'] })
  })

  it('leaves the drawing undefined when the module text does not show it', async () => {
    // Scenario: a call the reader does not recognise; the command reports it.
    const { code, modulePath, runtimePath } = fixture(
      "import { createIcon } from '@bymax-one/icons/runtime';\nvar AlphaIcon = createIcon('alpha-fixture', []);\nexport { AlphaIcon };\n"
    )
    const [alpha] = await measureModule(code, modulePath, runtimePath)
    expect(alpha).toMatchObject({ component: 'AlphaIcon', drawing: undefined, leaks: [] })
  })

  it('reports the drawing of a call without its annotation in every sibling bundle', async () => {
    // Scenario: the tree-shake breaks; a module with a side effect a bundler cannot drop.
    // The leaked drawing is named once, although a component and its alias both draw it.
    const { code, modulePath, runtimePath } = fixture(
      iconModule([{ ...ALPHA, pure: false }, BETA], { AlphaAliasIcon: 'AlphaIcon' })
    )
    const leaks = Object.fromEntries(
      (await measureModule(code, modulePath, runtimePath)).map((size) => [
        size.component,
        size.leaks
      ])
    )
    expect(leaks).toEqual({
      AlphaAliasIcon: [],
      AlphaIcon: [],
      BetaIcon: ['alpha-fixture']
    })
  })
})
