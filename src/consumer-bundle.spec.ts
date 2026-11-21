/**
 * Pins `scripts/consumer-bundle.mjs`, which bundles what a consumer imports and holds it to a
 * budget: an icon must not drag the metadata of the set along. The module is ES, so each case
 * runs it in a child process against a small fixture package under `node_modules`, the way the
 * gate runs it against the unpacked tarball.
 *
 * Layer: repository tooling, tests.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const MODULE = resolve(__dirname, '..', 'scripts', 'consumer-bundle.mjs')
const roots: string[] = []

interface Measured {
  readonly name: string
  readonly bytes: number
  readonly limit: number
  readonly ok: boolean
}

/** A fixture package whose `./meta` holds `metaSource`, and a consumer directory around it. */
function consumer(metaSource: string): string {
  const root = mkdtempSync(join(tmpdir(), 'consumer-bundle-spec-'))
  roots.push(root)
  const pkg = join(root, 'node_modules', '@bymax-one', 'icons')
  mkdirSync(pkg, { recursive: true })
  writeFileSync(
    join(pkg, 'package.json'),
    JSON.stringify({
      name: '@bymax-one/icons',
      type: 'module',
      sideEffects: false,
      exports: { './icons/a': './a.mjs', './meta': './meta.mjs' }
    })
  )
  writeFileSync(
    join(pkg, 'a.mjs'),
    "import { ICON_GRID } from '@bymax-one/icons/meta'\nexport const AIcon = () => ICON_GRID.size\n"
  )
  writeFileSync(join(pkg, 'meta.mjs'), metaSource)
  return root
}

/** The metadata of a set as a literal: 2,000 records, a few kilobytes each once serialised. */
const RECORDS = JSON.stringify(
  Array.from({ length: 2000 }, (_, i) => ({
    name: `icon-${i}`,
    useCases: [`a use case of icon ${i}`]
  }))
)

/** Runs `measureBundles` over the fixture's one-icon entry with a 1 KiB budget. */
function measure(root: string): Measured {
  const program = `
    import { measureBundles } from ${JSON.stringify(MODULE)}
    const entries = [{ name: 'an icon', code: "import { AIcon } from '@bymax-one/icons/icons/a'\\nconsole.log(AIcon)", limit: 1024 }]
    console.log(JSON.stringify((await measureBundles(entries, ${JSON.stringify(root)}))[0]))`
  const run = spawnSync('node', ['--input-type=module', '-e', program], { encoding: 'utf8' })
  return JSON.parse(run.stdout) as Measured
}

afterAll(() => roots.forEach((dir) => rmSync(dir, { recursive: true, force: true })))

describe('measureBundles', () => {
  it('passes an icon whose metadata a bundler can drop', () => {
    // Scenario: the metadata is a pure call, so an icon that reads only the grid from the same
    // module leaves it out of the bundle.
    const root = consumer(
      `function freeze(value) {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}
export const ICON_GRID = /* @__PURE__ */ Object.freeze({ size: 24 })
export const ICON_METADATA = /* @__PURE__ */ freeze(${RECORDS})
`
    )
    const result = measure(root)
    expect(result.ok).toBe(true)
    expect(result.bytes).toBeLessThan(result.limit)
  })

  it('fails an icon whose module runs a call that a bundler must keep', () => {
    // Scenario: the same metadata frozen by a top-level call with no pure annotation is kept
    // whenever the module is reached, so the icon ships all of it, which is how 1.0.2 bundled
    // 420 KB for one icon.
    const root = consumer(
      `function freeze(value) {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}
export const ICON_GRID = Object.freeze({ size: 24 })
export const ICON_METADATA = freeze(${RECORDS})
`
    )
    const result = measure(root)
    expect(result.ok).toBe(false)
    expect(result.bytes).toBeGreaterThan(result.limit)
  })
})

describe('bundleEntries', () => {
  it('names one entry per way a consumer imports a drawing, web and React Native', () => {
    // Scenario: an icon by subpath and from the root, the grid twice, a brand and a flag by
    // subpath and the three native ones, with a budget of a few kilobytes at most.
    const program = `
      import { bundleEntries } from ${JSON.stringify(MODULE)}
      const entries = bundleEntries({ icon: 'search', brand: 'github', flag: 'br-flag' })
      console.log(JSON.stringify(entries.map(({ code, limit }) => [code.split('\\n')[0], limit])))`
    const run = spawnSync('node', ['--input-type=module', '-e', program], { encoding: 'utf8' })
    expect(JSON.parse(run.stdout)).toEqual([
      ["import { SearchIcon } from '@bymax-one/icons/icons/search'", 4096],
      ["import { SearchIcon } from '@bymax-one/icons'", 4096],
      ["import { ICON_GRID } from '@bymax-one/icons/meta'", 1024],
      ["import { ICON_GRID } from '@bymax-one/icons/grid'", 1024],
      ["import { GithubBrandIcon } from '@bymax-one/icons/brands/github'", 4096],
      ["import { BrFlagIcon } from '@bymax-one/icons/flags/br-flag'", 6144],
      ["import { SearchIcon } from '@bymax-one/icons/native/icons/search'", 6144],
      ["import { GithubBrandIcon } from '@bymax-one/icons/native/brands/github'", 6144],
      ["import { BrFlagIcon } from '@bymax-one/icons/native/flags/br-flag'", 8192]
    ])
  })

  it('leaves out the entries of a kind the package does not hold', () => {
    // Scenario: the placeholder set has icons and no brand mark or flag, so its gate bundles the
    // icon and the grid only.
    const program = `
      import { bundleEntries } from ${JSON.stringify(MODULE)}
      console.log(JSON.stringify(bundleEntries({ icon: 'ring' }).map(({ name }) => name)))`
    const run = spawnSync('node', ['--input-type=module', '-e', program], { encoding: 'utf8' })
    expect(JSON.parse(run.stdout)).toEqual([
      'an icon by subpath',
      'an icon from the root',
      'the grid from meta',
      'the grid from its own subpath',
      'a native icon by subpath'
    ])
  })
})
