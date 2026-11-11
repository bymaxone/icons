/**
 * Unit tests for the command the privileged preview jobs run.
 *
 * Layer: unit, with a fake GitHub REST call and an artifact in a temp directory.
 * Goal: prove the command and every value from the command line or the environment are
 * validated before they reach a path or the API, `publish` stores the images and `comment`
 * writes the comment only after the pull request is verified, and every failure becomes an
 * exit code and a message.
 * Mocks: the REST call is a scripted fake; `fetch` is spied on for the default.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { Output } from './cli.ts'
import { runPreviewPublish } from './cli-preview-publish.ts'
import type { GitHubRequest, GitHubResponse } from './preview-publish.ts'

const HEAD = 'c'.repeat(40)
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1])

function capture(): Output & { logs: string[]; errors: string[] } {
  const logs: string[] = []
  const errors: string[] = []
  return { logs, errors, log: (line) => logs.push(line), error: (line) => errors.push(line) }
}

/** Throws a value that is not an `Error`. */
function failWith(value: unknown): never {
  throw value
}

const respond = (status: number, body?: unknown): GitHubResponse => ({ status, body })

describe('runPreviewPublish', () => {
  let directory: string
  const ENV = {
    GITHUB_REPOSITORY: 'bymaxone/icons',
    GITHUB_TOKEN: 'tok',
    RUN_HEAD_SHA: HEAD
  }

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'bymax-preview-cli-'))
    writeFileSync(
      join(directory, 'manifest.json'),
      JSON.stringify({
        pr: 12,
        head: HEAD,
        lint: 'passed',
        issues: 0,
        icons: [],
        images: ['preview.png']
      })
    )
    writeFileSync(join(directory, 'preview.png'), PNG)
  })

  afterEach(() => rmSync(directory, { recursive: true, force: true }))

  /** A REST fake that serves an open pull request and records every call. */
  function github(
    overrides: (method: string, path: string) => GitHubResponse | undefined = () => undefined
  ): {
    factory: (token: string) => GitHubRequest
    calls: string[]
    tokens: string[]
  } {
    const calls: string[] = []
    const tokens: string[] = []
    const factory = (token: string): GitHubRequest => {
      tokens.push(token)
      return (method, path) => {
        calls.push(`${method} ${path}`)
        const custom = overrides(method, path)
        if (custom !== undefined) return Promise.resolve(custom)
        if (path.endsWith('/pulls/12')) {
          return Promise.resolve(respond(200, { state: 'open', head: { sha: HEAD } }))
        }
        if (path.includes('/git/ref/')) return Promise.resolve(respond(200))
        if (method === 'GET' && path.includes('/contents/')) return Promise.resolve(respond(404))
        if (method === 'GET') return Promise.resolve(respond(200, []))
        return Promise.resolve(respond(201))
      }
    }
    return { factory, calls, tokens }
  }

  it('verifies the pull request, then stores the images', async () => {
    /**
     * Scenario: `publish` reads the artifact, checks the pull request, writes the image
     * to the preview branch, prints a summary and returns 0; the token is the one from the
     * environment.
     */
    const output = capture()
    const { factory, calls, tokens } = github()
    const code = await runPreviewPublish(['publish', '--dir', directory], ENV, output, factory)
    expect(code).toBe(0)
    expect(output.logs).toStrictEqual(['published 1 image(s) for #12'])
    expect(output.errors).toStrictEqual([])
    expect(tokens).toStrictEqual(['tok'])
    expect(calls).toStrictEqual([
      'GET /repos/bymaxone/icons/pulls/12',
      'GET /repos/bymaxone/icons/git/ref/heads/icons-preview',
      `GET /repos/bymaxone/icons/contents/pr-12/${HEAD}/preview.png?ref=icons-preview`,
      `PUT /repos/bymaxone/icons/contents/pr-12/${HEAD}/preview.png`
    ])
  })

  it('verifies the pull request, then writes the comment', async () => {
    /**
     * Scenario: `comment` creates the comment when there is none and says so.
     */
    const output = capture()
    const { factory, calls } = github()
    const code = await runPreviewPublish(['comment', '--dir', directory], ENV, output, factory)
    expect(code).toBe(0)
    expect(output.logs).toStrictEqual(['created the preview comment on #12'])
    expect(calls.at(-1)).toBe('POST /repos/bymaxone/icons/issues/12/comments')
  })

  it('says when it updated the comment', async () => {
    /**
     * Scenario: an existing comment by the bot is updated and the message says so.
     */
    const output = capture()
    const { factory } = github((method, path) => {
      if (method === 'GET' && path.includes('/comments')) {
        return respond(200, [
          { id: 3, user: { login: 'github-actions[bot]' }, body: '<!-- bymax-icons-preview -->' }
        ])
      }
      return method === 'PATCH' ? respond(200) : undefined
    })
    expect(await runPreviewPublish(['comment', '--dir', directory], ENV, output, factory)).toBe(0)
    expect(output.logs).toStrictEqual(['updated the preview comment on #12'])
  })

  it.each([
    ['no arguments', []],
    ['a command alone', ['publish']],
    ['an unknown command', ['delete', '--dir', 'x']],
    ['an unknown flag', ['publish', '--out', 'x']],
    ['a flag first', ['--dir', 'x', 'publish']],
    ['no flag', ['publish', 'x']]
  ])('prints the usage for %s', async (_what, args) => {
    /**
     * Scenario: anything but `publish|comment --dir <artifact>` is a usage error and
     * nothing is requested.
     */
    const output = capture()
    const { factory, tokens } = github()
    expect(await runPreviewPublish(args, ENV, output, factory)).toBe(1)
    expect(output.errors).toStrictEqual([
      'usage: icons-preview-publish.mjs publish|comment --dir <artifact>'
    ])
    expect(tokens).toStrictEqual([])
  })

  it.each([
    ['GITHUB_REPOSITORY', undefined],
    ['GITHUB_REPOSITORY', ''],
    ['GITHUB_REPOSITORY', 'icons'],
    ['GITHUB_REPOSITORY', 'a/b/c'],
    ['GITHUB_REPOSITORY', 'a b/c'],
    ['GITHUB_REPOSITORY', 'a/b c'],
    ['GITHUB_REPOSITORY', 'a/b\n'],
    ['GITHUB_TOKEN', undefined],
    ['GITHUB_TOKEN', ''],
    ['GITHUB_TOKEN', 'two words'],
    ['GITHUB_TOKEN', 'tok\n'],
    ['RUN_HEAD_SHA', undefined],
    ['RUN_HEAD_SHA', 'c'.repeat(39)],
    ['RUN_HEAD_SHA', 'C'.repeat(40)],
    ['RUN_HEAD_SHA', `${'c'.repeat(40)}\n`],
    ['RUN_HEAD_SHA', `x${'c'.repeat(40)}`],
    ['RUN_HEAD_SHA', 'main']
  ])('rejects %s set to %s', async (name, value) => {
    /**
     * Scenario: a missing or malformed environment value fails with its name before any
     * request is made.
     */
    const output = capture()
    const { factory, calls } = github()
    const env = { ...ENV, [name]: value }
    expect(await runPreviewPublish(['publish', '--dir', directory], env, output, factory)).toBe(1)
    expect(output.errors).toStrictEqual([`missing or invalid ${name}`])
    expect(calls).toStrictEqual([])
  })

  it.each(['a b', 'a;b', '$(x)', 'a\nb', ''])('rejects the directory %j', async (value) => {
    /**
     * Scenario: a directory with characters outside the path alphabet is refused.
     */
    const output = capture()
    const { factory, calls } = github()
    expect(await runPreviewPublish(['publish', '--dir', value], ENV, output, factory)).toBe(1)
    expect(output.errors).toStrictEqual(['missing or invalid --dir'])
    expect(calls).toStrictEqual([])
  })

  it('leaves the stricter repository check to the verification', async () => {
    /**
     * Scenario: a repository the environment pattern lets through but the API check
     * refuses stops the command before any request.
     */
    const output = capture()
    const { factory, calls } = github()
    const env = { ...ENV, GITHUB_REPOSITORY: '../b' }
    expect(await runPreviewPublish(['publish', '--dir', directory], env, output, factory)).toBe(1)
    expect(output.errors).toStrictEqual(['invalid repository'])
    expect(calls).toStrictEqual([])
  })

  it('fails before any request when the artifact does not validate', async () => {
    /**
     * Scenario: a forged manifest stops the command before the API is called.
     */
    writeFileSync(join(directory, 'manifest.json'), '{"lint":"passed","pr":"x"}')
    const output = capture()
    const { factory, calls } = github()
    expect(await runPreviewPublish(['publish', '--dir', directory], ENV, output, factory)).toBe(1)
    expect(output.errors).toStrictEqual(['invalid preview manifest: pull request number'])
    expect(calls).toStrictEqual([])
  })

  it('writes nothing when the pull request moved', async () => {
    /**
     * Scenario: the pull request's head is another commit; the command fails after the
     * single read and neither stores an image nor writes a comment.
     */
    for (const command of ['publish', 'comment']) {
      const output = capture()
      const { factory, calls } = github((_method, path) =>
        path.endsWith('/pulls/12')
          ? respond(200, { state: 'open', head: { sha: 'd'.repeat(40) } })
          : undefined
      )
      expect(await runPreviewPublish([command, '--dir', directory], ENV, output, factory)).toBe(1)
      expect(output.errors).toStrictEqual(['the pull request has moved past this commit'])
      expect(calls).toStrictEqual(['GET /repos/bymaxone/icons/pulls/12'])
    }
  })

  it('reports a failure of the API', async () => {
    /**
     * Scenario: a refused write surfaces its message and returns 1.
     */
    const output = capture()
    const { factory } = github((method) => (method === 'PUT' ? respond(422) : undefined))
    expect(await runPreviewPublish(['publish', '--dir', directory], ENV, output, factory)).toBe(1)
    expect(output.errors).toStrictEqual(['preview image write: unexpected response 422'])
  })

  it('reports a thrown value that is not an Error', async () => {
    /**
     * Scenario: a failure that is not an `Error` is printed as text.
     */
    const output = capture()
    const factory = (): GitHubRequest => failWith('boom')
    expect(await runPreviewPublish(['publish', '--dir', directory], ENV, output, factory)).toBe(1)
    expect(output.errors).toStrictEqual(['boom'])
  })

  it('calls the REST API over fetch by default', async () => {
    /**
     * Scenario: with no request factory, the token goes to GitHub through `fetch`; a 404
     * for the pull request fails the command.
     */
    const spy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"message":"Not Found"}', { status: 404 }))
    try {
      const output = capture()
      expect(await runPreviewPublish(['publish', '--dir', directory], ENV, output)).toBe(1)
      expect(output.errors).toStrictEqual(['pull request: unexpected response 404'])
      expect(spy).toHaveBeenCalledWith(
        'https://api.github.com/repos/bymaxone/icons/pulls/12',
        expect.objectContaining({
          headers: expect.objectContaining({ authorization: 'Bearer tok' }) as unknown
        })
      )
    } finally {
      spy.mockRestore()
    }
  })
})
