/**
 * @fileoverview Pins the zero-dependency contract of the published manifest and the shape of
 * its React Native entries.
 * @layer Tests
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface Condition {
  types: string
  default: string
}

interface Manifest {
  dependencies?: Record<string, string>
  sideEffects?: boolean
  engines?: { node?: string }
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
  exports: Record<string, { import: Condition; require: Condition } | string>
}

const manifest = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as Manifest

const NATIVE_SUBPATHS = [
  './native',
  './native/runtime',
  './native/brands',
  './native/flags',
  './native/brands/*',
  './native/flags/*',
  './native/icons/*'
]

describe('package.json', () => {
  it('asks a consumer for the oldest Node the package runs on, not the one the tooling uses', () => {
    // Scenario: yarn 1 refuses to install a package whose `engines` is above the consumer's Node,
    // and the package loads and renders on Node 20 and 22. The tooling's Node 24 lives in CI.
    expect(manifest.engines?.node).toBe('>=20.9.0')
  })

  it('declares an explicit, empty dependencies object', () => {
    /**
     * Scenario: the library ships with zero runtime dependencies (React is a peer).
     * The empty object is the stated contract in CLAUDE.md and the README security
     * table, so a missing field or any entry fails here instead of in a review.
     */
    expect(manifest.dependencies).toEqual({})
  })

  it('stays free of side effects', () => {
    /**
     * Scenario: bundlers drop the unused icons of a namespace import only while the
     * manifest says no module has side effects, native entries included.
     */
    expect(manifest.sideEffects).toBe(false)
  })

  it('declares react-native-svg as an optional peer and react-native as none', () => {
    /**
     * Scenario: a web consumer installs nothing new, so the native renderer is an optional
     * peer; react-native is required by react-native-svg and is never declared here.
     */
    expect(manifest.peerDependencies?.['react-native-svg']).toBe('>=15.11.1')
    expect(manifest.peerDependenciesMeta).toEqual({ 'react-native-svg': { optional: true } })
    expect(Object.keys(manifest.peerDependencies ?? {})).not.toContain('react-native')
  })

  it.each(NATIVE_SUBPATHS)('exports %s in ESM and CommonJS with their types', (subpath) => {
    /**
     * Scenario: every native subpath resolves the same four files as a web one, under
     * dist/native, with no react-native condition (Metro needs none until measured).
     */
    const entry = manifest.exports[subpath]
    if (entry === undefined || typeof entry === 'string')
      throw new Error(`${subpath} must be a condition object`)
    expect(Object.keys(entry)).toEqual(['import', 'require'])
    const stem = entry.import.default.replace(/\.mjs$/, '')
    expect(stem.startsWith('./dist/native/')).toBe(true)
    expect(entry.import.types).toBe(`${stem}.d.ts`)
    expect(entry.require).toEqual({ types: `${stem}.d.cts`, default: `${stem}.cjs` })
  })
})
