/**
 * @fileoverview Pins the zero-dependency contract of the published manifest.
 * @layer Tests
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface Manifest {
  dependencies?: Record<string, string>
}

const manifest = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as Manifest

describe('package.json', () => {
  it('declares an explicit, empty dependencies object', () => {
    /**
     * Scenario: the library ships with zero runtime dependencies (React is a peer).
     * The empty object is the stated contract in CLAUDE.md and the README security
     * table, so a missing field or any entry fails here instead of in a review.
     */
    expect(manifest.dependencies).toEqual({})
  })
})
