/**
 * Unit tests for `runRedraws`, the command behind `pnpm check:redraws`.
 *
 * Layer: unit.
 * Goal: pin the git call, the manifests read, the exit code and the output.
 * Mocks: git and the file reader are injected fakes.
 */

import { join } from 'node:path'

import type { Output } from './cli.ts'
import { DEFAULT_BASE, runRedraws } from './cli-redraws.ts'

/** An output that records what the command writes. */
function recorder(): Output & { logs: string[]; errors: string[] } {
  const logs: string[] = []
  const errors: string[] = []
  return { logs, errors, log: (line) => logs.push(line), error: (line) => errors.push(line) }
}

describe('runRedraws', () => {
  const ROOT = '/repo'

  it('passes when the only changed existing drawing is named by a manifest of the pull request', () => {
    // Scenario: home is redrawn and listed in an added manifest; a new icon needs no entry.
    const calls: (readonly string[])[] = []
    const read: string[] = []
    const output = recorder()
    const code = runRedraws(
      ['--base', 'origin/release'],
      ROOT,
      output,
      (args) => {
        calls.push(args)
        return 'M\ticons/line/home.svg\nA\ticons/line/new.svg\nA\tdocs/redraws/b6.md\n'
      },
      (path) => {
        read.push(path)
        return '- `home`: redrawn door\n'
      }
    )
    expect(code).toBe(0)
    expect(calls).toStrictEqual([['diff', '--name-status', '-M', 'origin/release...HEAD']])
    expect(read).toStrictEqual([join(ROOT, 'docs/redraws/b6.md')])
    expect(output.logs).toStrictEqual([
      'redraw gate: no existing drawing or baseline changed outside a manifest (1 name(s) listed)'
    ])
    expect(output.errors).toStrictEqual([])
  })

  it('fails and lists every unlisted path when an existing drawing changes with no manifest', () => {
    // Scenario: the default base; an existing filled drawing and its baseline rewritten.
    const calls: (readonly string[])[] = []
    const output = recorder()
    const code = runRedraws(
      [],
      ROOT,
      output,
      (args) => {
        calls.push(args)
        return 'M\ticons/filled/info.svg\nM\tvisual/filled/info.png\n'
      },
      () => {
        throw new Error('no manifest should be read')
      }
    )
    expect(code).toBe(1)
    expect(calls).toStrictEqual([['diff', '--name-status', '-M', 'origin/main...HEAD']])
    expect(output.logs).toStrictEqual([])
    expect(output.errors).toStrictEqual([
      'redraw gate: 2 existing drawing(s) or baseline(s) changed with no redraw manifest naming them:',
      '  icons/filled/info.svg',
      '  visual/filled/info.png',
      'List each redrawn icon in a manifest under docs/redraws/ (see its README), or restore the file from the base.'
    ])
  })

  it('uses the default base when no --base is given, whatever else is', () => {
    // Scenario: another argument is never taken for the base.
    const calls: (readonly string[])[] = []
    runRedraws(
      ['--verbose', 'x'],
      ROOT,
      recorder(),
      (args) => {
        calls.push(args)
        return ''
      },
      () => ''
    )
    expect(calls).toStrictEqual([['diff', '--name-status', '-M', 'origin/main...HEAD']])
    expect(DEFAULT_BASE).toBe('origin/main')
  })

  it('falls back to the default base when --base has no value', () => {
    // Scenario: a trailing --base is read as no base given.
    const calls: (readonly string[])[] = []
    runRedraws(
      ['--base'],
      ROOT,
      recorder(),
      (args) => {
        calls.push(args)
        return ''
      },
      () => ''
    )
    expect(calls).toStrictEqual([['diff', '--name-status', '-M', `${DEFAULT_BASE}...HEAD`]])
  })
})
