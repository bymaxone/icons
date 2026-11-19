/**
 * Pins the release note the API surface gate asks for. `release.yml` runs `check-api-surface.mjs`
 * before it publishes, and a release that changes the public declarations passes only when its
 * CHANGELOG section holds a heading or bold lead-in the gate recognises: an inline sentence
 * does not count.
 *
 * Layer: repository tooling, tests.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '..')
const version = (
  JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as { version: string }
).version

/** Asks the gate's own predicate whether the CHANGELOG section of `version` carries the note. */
function recognised(): string {
  const run = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { readFileSync } from 'node:fs'
import { changelogSection, hasCompatibilityNote } from './scripts/check-api-surface.mjs'
const section = changelogSection(readFileSync('CHANGELOG.md', 'utf8'), process.argv[1])
console.log(section === undefined ? 'missing' : String(hasCompatibilityNote(section)))`,
      version
    ],
    { cwd: ROOT, encoding: 'utf8' }
  )
  return run.stdout.trim()
}

describe('the CHANGELOG release note', () => {
  it('is recognised by the API surface gate for a minor or major release', () => {
    // Scenario: a release whose patch number is 0 adds public API after the first one, and the
    // gate refuses it unless the section carries the "Apply to a consumer" note as a heading.
    // The first release, 1.0.0, has no earlier version to differ from, so it needs the section
    // and nothing else.
    const patch = Number(version.split('.')[2])
    if (patch !== 0 || version === '1.0.0') return
    expect(recognised()).toBe('true')
  })

  it('has a section of its own for the version in package.json', () => {
    // Scenario: `release.yml` extracts the section matching the pushed tag as the release body,
    // so a version with no `## [x.y.z]` heading would publish with an empty body.
    expect(recognised()).not.toBe('missing')
  })
})
