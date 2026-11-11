/**
 * Unit tests for the per-component size command.
 *
 * Layer: unit, against scratch `dist/` trees bundled by the real esbuild.
 * Goal: pin the budgets and their boundaries, the messages, the exit codes (0 on a pass, 1
 * on a budget or a leak, 2 on a missing build) and the summary line.
 * Mocks: the output sink only.
 */

import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

import { iconModule, scratchDist } from './__tests__/component-fixtures.ts'
import type { FixtureComponent } from './__tests__/component-fixtures.ts'
import type { Output } from './cli.ts'
import {
  COMPONENT_BUDGET,
  RUNTIME_WITH_COMPONENT_BUDGET,
  componentProblems,
  runComponentSize
} from './cli-component-size.ts'
import { measureModule } from './component-size.ts'

const roots: string[] = []

/** A scratch root, removed after the suite. */
function root(modules: Readonly<Record<string, string>>, runtime = true): string {
  const dir = scratchDist(modules, runtime)
  roots.push(dir)
  return dir
}

/** An output sink that keeps what it is given. */
function sink(): Output & { logs: string[]; errors: string[] } {
  const logs: string[] = []
  const errors: string[] = []
  return { logs, errors, log: (line) => logs.push(line), error: (line) => errors.push(line) }
}

/** A pure component whose path data repeats `segments` times, to set its size. */
function component(letter: string, segments: number, pure = true): FixtureComponent {
  return {
    name: `${letter}Icon`,
    drawing: `${letter.toLowerCase()}-fixture`,
    d: Array.from({ length: segments }, (_, i) => `M${i} ${i}h${i % 7}v${i % 5}`).join(''),
    pure
  }
}

/** A pure component with `segments` pseudo-random segments, which brotli cannot shrink much. */
function noisy(letter: string, segments: number): FixtureComponent {
  let seed = 7
  const next = (): number => (seed = (seed * 48271) % 2147483647) % 2000
  return {
    name: `${letter}Icon`,
    drawing: `${letter.toLowerCase()}-fixture`,
    d: Array.from({ length: segments }, () => `M${next() / 100} ${next() / 100}`).join(''),
    pure: true
  }
}

afterAll(() => {
  for (const dir of roots) rmSync(dir, { recursive: true, force: true })
})

describe('budgets', () => {
  it('are the targets of spec §12', () => {
    // Scenario: 0.6 KiB per component alone, 1.5 KiB with the runtime.
    expect(COMPONENT_BUDGET).toBe(614.4)
    expect(RUNTIME_WITH_COMPONENT_BUDGET).toBe(1536)
  })
})

describe('componentProblems', () => {
  const size = { component: 'XIcon', drawing: 'x', alone: 614, withRuntime: 1536, leaks: [] }

  it('passes a component at both budgets exactly', () => {
    // Scenario: a budget is a ceiling, reached but not exceeded.
    expect(componentProblems(size)).toEqual([])
  })

  it('reports a component one byte over the budget alone', () => {
    // Scenario: 615 bytes against 614.4.
    expect(componentProblems({ ...size, alone: 615 })).toEqual([
      'XIcon: 0.60 kB alone, over 0.60 kB'
    ])
  })

  it('reports a component one byte over the budget with the runtime', () => {
    // Scenario: 1537 bytes against 1536.
    expect(componentProblems({ ...size, withRuntime: 1537 })).toEqual([
      'XIcon: 1.50 kB with the runtime, over 1.50 kB'
    ])
  })

  it('reports the drawings a bundle keeps', () => {
    // Scenario: two sibling drawings left in the bundle.
    expect(componentProblems({ ...size, leaks: ['a-one', 'a-two'] })).toEqual([
      'XIcon: its bundle keeps a-one, a-two, so the module does not tree-shake'
    ])
  })

  it('reports a component whose drawing cannot be read', () => {
    // Scenario: no leak can be looked for, so the gate does not pass it unchecked.
    expect(componentProblems({ ...size, drawing: undefined })).toEqual([
      'XIcon: its drawing cannot be read, so its bundle cannot be checked'
    ])
  })

  it('reports every problem of one component, in order', () => {
    // Scenario: both budgets, an unread drawing and a leak at once.
    expect(
      componentProblems({
        ...size,
        drawing: undefined,
        alone: 2048,
        withRuntime: 3072,
        leaks: ['a']
      })
    ).toEqual([
      'XIcon: 2.00 kB alone, over 0.60 kB',
      'XIcon: 3.00 kB with the runtime, over 1.50 kB',
      'XIcon: its drawing cannot be read, so its bundle cannot be checked',
      'XIcon: its bundle keeps a, so the module does not tree-shake'
    ])
  })
})

describe('runComponentSize', () => {
  it('stops with exit code 2 when the runtime is not built', async () => {
    // Scenario: the icons are there, the runtime is not.
    const output = sink()
    expect(
      await runComponentSize(root({ a: iconModule([component('A', 2)]) }, false), output)
    ).toBe(2)
    expect(output.errors).toEqual(['Missing build artifacts in dist/. Run "pnpm build" first.'])
  })

  it('stops with exit code 2 when no icon is built', async () => {
    // Scenario: the runtime is there, `dist/icons` is not.
    const output = sink()
    expect(await runComponentSize(root({}), output)).toBe(2)
    expect(output.errors).toEqual(['Missing build artifacts in dist/. Run "pnpm build" first.'])
  })

  it('passes an empty icons directory without a summary', async () => {
    // Scenario: a build that holds no drawing.
    const dir = root({})
    mkdirSync(join(dir, 'dist', 'icons'))
    const output = sink()
    expect(await runComponentSize(dir, output)).toBe(0)
    expect(output.logs).toEqual([])
    expect(output.errors).toEqual([])
  })

  it('passes small pure modules and names the largest component', async () => {
    // Scenario: the largest is found whichever module it sits in.
    const dir = root({
      a: iconModule([component('B', 2), component('C', 4)]),
      b: iconModule([component('A', 40)])
    })
    const sizes = await measureModule(
      iconModule([component('A', 40)]),
      join(dir, 'dist', 'icons', 'b', 'index.mjs'),
      join(dir, 'dist', 'runtime', 'index.mjs')
    )
    const largest = sizes[0]!
    const output = sink()
    expect(await runComponentSize(dir, output)).toBe(0)
    expect(output.errors).toEqual([])
    expect(output.logs).toEqual([
      `3 component(s) measured; the largest, AIcon, is ${(largest.alone / 1024).toFixed(2)} kB alone and ${(largest.withRuntime / 1024).toFixed(2)} kB with the runtime`
    ])
  })

  it('keeps the first of two components of the same size as the largest', async () => {
    // Scenario: a tie does not replace the component already found.
    const output = sink()
    const dir = root({ e: iconModule([component('E', 3)]), f: iconModule([component('F', 3)]) })
    const [a] = await measureModule(
      iconModule([component('E', 3)]),
      join(dir, 'dist', 'icons', 'e', 'index.mjs'),
      join(dir, 'dist', 'runtime', 'index.mjs')
    )
    const [b] = await measureModule(
      iconModule([component('F', 3)]),
      join(dir, 'dist', 'icons', 'f', 'index.mjs'),
      join(dir, 'dist', 'runtime', 'index.mjs')
    )
    expect(a!.alone).toBe(b!.alone)
    expect(await runComponentSize(dir, output)).toBe(0)
    expect(output.logs[0]).toContain('the largest, EIcon,')
  })

  it('fails on a component over budget and on a leak, modules in name order', async () => {
    // Scenario: the directory lists `b` before `a`; the problems still come in name order.
    const output = sink()
    const dir = root({
      b: iconModule([noisy('B', 400)]),
      a: iconModule([component('A', 2, false), component('D', 2)])
    })
    expect(await runComponentSize(dir, output, () => ['b', 'a'])).toBe(1)
    expect(output.errors).toHaveLength(3)
    expect(output.errors[0]).toBe(
      'DIcon: its bundle keeps a-fixture, so the module does not tree-shake'
    )
    expect(output.errors[1]).toMatch(/^BIcon: \d\.\d\d kB alone, over 0\.60 kB$/)
    expect(output.errors[2]).toMatch(/^BIcon: \d\.\d\d kB with the runtime, over 1\.50 kB$/)
    expect(output.logs).toHaveLength(1)
  })
})
