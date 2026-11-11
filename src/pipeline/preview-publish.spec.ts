/**
 * Unit tests for the privileged half of the pull-request preview.
 *
 * Layer: unit, with a fake GitHub REST call and artifacts in a temp directory.
 * Goal: prove a hostile artifact is refused before anything is written, a manifest is
 * accepted only for the open pull request on the commit that was built, the images are
 * stored on the preview branch under validated paths, the comment is created or updated
 * once, and `gitHubRequest` speaks the REST protocol.
 * Mocks: the REST call is a scripted fake; `fetch` is a fake that records its arguments.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { COMMENT_MARKER, commentBody, validateManifest } from './preview.ts'
import type { PreviewManifest } from './preview.ts'
import {
  COMMENT_AUTHOR,
  gitHubRequest,
  imageUrl,
  PREVIEW_BRANCH,
  publishImages,
  readArtifact,
  upsertComment,
  verifyPullRequest
} from './preview-publish.ts'
import type { GitHubRequest, GitHubResponse, PreviewArtifact } from './preview-publish.ts'

const HEAD = 'c'.repeat(40)
const REPO = 'bymaxone/icons'
/** The run that built the artifact: its head commit, head repository and head branch. */
const RUN = { head: HEAD, repository: 'contributor/icons', branch: 'new-icons' }
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 7, 8, 9])

const manifestJson = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  pr: 12,
  head: HEAD,
  lint: 'passed',
  issues: 0,
  icons: [],
  images: ['preview.png'],
  ...overrides
})

const manifestOf = (overrides: Record<string, unknown> = {}): PreviewManifest =>
  validateManifest(manifestJson(overrides))

/** One call a fake REST call received. */
interface Call {
  readonly method: string
  readonly path: string
  readonly body: unknown
}

/** A fake REST call: it records every call and answers from a handler. */
function fakeRequest(handler: (call: Call) => GitHubResponse | undefined): {
  request: GitHubRequest
  calls: Call[]
} {
  const calls: Call[] = []
  const request: GitHubRequest = (method, path, body) => {
    const call = { method, path, body }
    calls.push(call)
    return Promise.resolve(handler(call) ?? { status: 599, body: undefined })
  }
  return { request, calls }
}

const respond = (status: number, body?: unknown): GitHubResponse => ({ status, body })

describe('readArtifact', () => {
  let directory: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'bymax-preview-artifact-'))
  })

  afterEach(() => rmSync(directory, { recursive: true, force: true }))

  const writeManifest = (value: unknown, padTo = 0): void => {
    const text = JSON.stringify(value)
    writeFileSync(join(directory, 'manifest.json'), text.padEnd(padTo, ' '))
  }

  it('reads the manifest and the bytes of every listed image', () => {
    /**
     * Scenario: a well-formed artifact yields the validated manifest and its images.
     */
    writeManifest(manifestJson({ images: ['preview.png', 'similarity.png'] }))
    writeFileSync(join(directory, 'preview.png'), PNG)
    writeFileSync(join(directory, 'similarity.png'), PNG)
    const artifact = readArtifact(directory)
    expect(artifact.manifest).toStrictEqual(
      manifestOf({ images: ['preview.png', 'similarity.png'] })
    )
    expect([...artifact.images.keys()]).toStrictEqual(['preview.png', 'similarity.png'])
    expect(Array.from(artifact.images.get('preview.png') ?? [])).toStrictEqual(Array.from(PNG))
  })

  it('ignores files the manifest does not list', () => {
    /**
     * Scenario: an unlisted file, even one that is not a PNG, is never read.
     */
    writeManifest(manifestJson({ images: [] }))
    writeFileSync(join(directory, 'extra.png'), 'not a png')
    writeFileSync(join(directory, 'script.sh'), 'rm -rf /')
    mkdirSync(join(directory, 'nested'))
    const artifact = readArtifact(directory)
    expect(artifact.images.size).toBe(0)
  })

  it('accepts a manifest of exactly the largest size', () => {
    /**
     * Scenario: the manifest size limit is inclusive.
     */
    writeManifest(manifestJson({ images: [] }), 1024 * 1024)
    expect(readArtifact(directory).manifest.pr).toBe(12)
  })

  it('fails on a manifest one byte over the limit, before parsing it', () => {
    /**
     * Scenario: an oversize manifest is refused by its size, even when it is not JSON.
     */
    writeFileSync(join(directory, 'manifest.json'), 'x'.repeat(1024 * 1024 + 1))
    expect(() => readArtifact(directory)).toThrow('manifest too large')
  })

  it('fails when the manifest is missing', () => {
    /**
     * Scenario: an artifact without a manifest is refused.
     */
    expect(() => readArtifact(directory)).toThrow('manifest.json')
  })

  it('fails when the manifest is not JSON', () => {
    /**
     * Scenario: a manifest that does not parse is refused.
     */
    writeFileSync(join(directory, 'manifest.json'), '{not json')
    expect(() => readArtifact(directory)).toThrow(SyntaxError)
  })

  it('fails on an invalid manifest', () => {
    /**
     * Scenario: a manifest that does not validate is refused with the validation reason.
     */
    writeManifest(manifestJson({ pr: 'twelve' }))
    expect(() => readArtifact(directory)).toThrow('invalid preview manifest: pull request number')
  })

  it('fails on a listed image that is missing', () => {
    /**
     * Scenario: a manifest that lists an image the artifact lacks is refused.
     */
    writeManifest(manifestJson())
    expect(() => readArtifact(directory)).toThrow('missing image preview.png')
  })

  it('fails on a listed image that is not a PNG', () => {
    /**
     * Scenario: a listed image with other bytes is refused.
     */
    writeManifest(manifestJson())
    writeFileSync(join(directory, 'preview.png'), '<svg onload="alert(1)"/>')
    expect(() => readArtifact(directory)).toThrow('not a publishable PNG: preview.png')
  })
})

describe('verifyPullRequest', () => {
  const open = (sha: string = HEAD, state: unknown = 'open'): GitHubResponse =>
    respond(200, {
      state,
      head: { sha, ref: RUN.branch, repo: { full_name: RUN.repository } }
    })

  it('asks for the pull request and accepts an open one on the built commit', async () => {
    /**
     * Scenario: the manifest's pull request is open on the run's commit.
     */
    const { request, calls } = fakeRequest(() => open())
    await expect(verifyPullRequest(request, REPO, manifestOf(), RUN)).resolves.toBeUndefined()
    expect(calls).toStrictEqual([
      { method: 'GET', path: '/repos/bymaxone/icons/pulls/12', body: undefined }
    ])
  })

  it.each([
    ['no owner', 'icons'],
    ['an empty string', ''],
    ['a third segment', 'a/b/c'],
    ['a space', 'a b/c'],
    ['a dot in the owner', 'a.b/c'],
    ['a prefix', ' a/b'],
    ['a suffix', 'a/b\n'],
    ['a query', 'a/b?x=1'],
    ['a parent directory', '../b']
  ])('rejects a repository with %s, before any request', async (_what, repository) => {
    /**
     * Scenario: a repository that is not `owner/name` is refused and nothing is requested.
     */
    const { request, calls } = fakeRequest(() => open())
    await expect(verifyPullRequest(request, repository, manifestOf(), RUN)).rejects.toThrow(
      'invalid repository'
    )
    expect(calls).toStrictEqual([])
  })

  it('accepts dots, underscores and hyphens in the repository name', async () => {
    /**
     * Scenario: the name part of a repository may carry `.`, `_` and `-`.
     */
    const { request } = fakeRequest(() => open())
    await expect(
      verifyPullRequest(request, 'My-Org1/my.repo_x-1', manifestOf(), RUN)
    ).resolves.toBeUndefined()
  })

  it.each([
    ['a prefix', `x${HEAD}`],
    ['a suffix', `${HEAD}0`]
  ])('rejects a run head and manifest head that agree but carry %s', async (_what, head) => {
    /**
     * Scenario: even when the manifest names the same text as the run, a head that is not
     * exactly a full SHA is refused before any request.
     */
    const { request, calls } = fakeRequest(() => open(head))
    const forged: PreviewManifest = { ...manifestOf(), head }
    await expect(verifyPullRequest(request, REPO, forged, { ...RUN, head })).rejects.toThrow(
      'the manifest does not belong to this workflow run'
    )
    expect(calls).toStrictEqual([])
  })

  it.each([
    ['a short sha', 'c'.repeat(39)],
    ['a long sha', 'c'.repeat(41)],
    ['an uppercase sha', 'C'.repeat(40)],
    ['a branch name', 'main'],
    ['an empty string', ''],
    ['a suffix', `${'c'.repeat(40)}\n`],
    ['a prefix', `x${'c'.repeat(40)}`]
  ])('rejects a run head that is %s', async (_what, runHead) => {
    /**
     * Scenario: a run head that is not a full SHA is refused before any request, even when
     * the manifest names the same text.
     */
    const { request, calls } = fakeRequest(() => open())
    await expect(
      verifyPullRequest(request, REPO, manifestOf(), { ...RUN, head: runHead })
    ).rejects.toThrow('the manifest does not belong to this workflow run')
    expect(calls).toStrictEqual([])
  })

  it('rejects a run head that differs from the manifest head', async () => {
    /**
     * Scenario: a forged manifest naming another commit is refused before any request.
     */
    const { request, calls } = fakeRequest(() => open())
    await expect(
      verifyPullRequest(request, REPO, manifestOf(), { ...RUN, head: 'd'.repeat(40) })
    ).rejects.toThrow('the manifest does not belong to this workflow run')
    expect(calls).toStrictEqual([])
  })

  it('rejects a non-200 response with its status', async () => {
    /**
     * Scenario: an API error, even one with a body that looks open, is refused.
     */
    const { request } = fakeRequest(() => respond(404, { state: 'open', head: { sha: HEAD } }))
    await expect(verifyPullRequest(request, REPO, manifestOf(), RUN)).rejects.toThrow(
      'pull request: unexpected response 404'
    )
  })

  it.each([
    ['closed', open(HEAD, 'closed')],
    ['without a state', respond(200, { head: { sha: HEAD } })],
    ['with no body', respond(200)],
    ['with a non-object body', respond(200, 'open')]
  ])('rejects a pull request that is %s', async (_what, response) => {
    /**
     * Scenario: only a pull request whose state is `open` is accepted.
     */
    const { request } = fakeRequest(() => response)
    await expect(verifyPullRequest(request, REPO, manifestOf(), RUN)).rejects.toThrow(
      'the pull request is not open'
    )
  })

  it.each([
    ['moved', open('d'.repeat(40))],
    ['without a head', respond(200, { state: 'open' })],
    ['with a head that is not an object', respond(200, { state: 'open', head: 'x' })]
  ])('rejects a pull request that has %s', async (_what, response) => {
    /**
     * Scenario: the pull request's head must be exactly the commit the run built.
     */
    const { request } = fakeRequest(() => response)
    await expect(verifyPullRequest(request, REPO, manifestOf(), RUN)).rejects.toThrow(
      'the pull request has moved past this commit'
    )
  })

  it.each([
    [
      'another repository',
      { sha: HEAD, ref: RUN.branch, repo: { full_name: 'someone-else/icons' } }
    ],
    ['another branch', { sha: HEAD, ref: 'other', repo: { full_name: RUN.repository } }],
    ['no repository', { sha: HEAD, ref: RUN.branch }],
    ['a repository that is not an object', { sha: HEAD, ref: RUN.branch, repo: 'x' }],
    ['no branch', { sha: HEAD, repo: { full_name: RUN.repository } }]
  ])(
    'rejects a pull request on the same commit from %s, the forged-number case',
    async (_what, head) => {
      /**
       * Scenario: the pull request number comes from the artifact, which the author of the
       * pull request controls. A fork can push the head commit of someone else's pull
       * request and name that number; the head repository and branch still differ from the
       * run's, so the manifest is refused and nothing is written to the other pull request.
       */
      const { request } = fakeRequest(() => respond(200, { state: 'open', head }))
      await expect(verifyPullRequest(request, REPO, manifestOf(), RUN)).rejects.toThrow(
        'the pull request was not built by this workflow run'
      )
    }
  )
})

describe('imageUrl', () => {
  it('builds the raw-content address on the preview branch', () => {
    /**
     * Scenario: an image is served from a path made of the validated pull request number,
     * the commit and the file name.
     */
    expect(imageUrl(REPO, manifestOf(), 'preview.png')).toBe(
      `https://raw.githubusercontent.com/bymaxone/icons/icons-preview/pr-12/${HEAD}/preview.png`
    )
  })
})

describe('publishImages', () => {
  const artifact = (files: readonly string[] = ['preview.png']): PreviewArtifact => ({
    manifest: manifestOf({ images: files }),
    images: new Map(files.map((file) => [file, PNG]))
  })
  const base64 = Buffer.from(PNG).toString('base64')
  const refPath = `/repos/${REPO}/git/ref/heads/${PREVIEW_BRANCH}`
  const contentPath = `/repos/${REPO}/contents/pr-12/${HEAD}/preview.png`

  it('creates the branch from nothing when it does not exist, then writes the image', async () => {
    /**
     * Scenario: a 404 for the preview branch creates it through a tree, a parentless commit
     * and a ref, and the image is then stored on it.
     */
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === refPath) return respond(404)
      if (path.endsWith('/git/trees')) return respond(201, { sha: 'tree-sha' })
      if (path.endsWith('/git/commits')) return respond(201, { sha: 'commit-sha' })
      if (path.endsWith('/git/refs')) return respond(201)
      if (method === 'GET') return respond(404)
      return respond(201)
    })
    await publishImages(request, REPO, artifact())
    expect(calls).toStrictEqual([
      { method: 'GET', path: refPath, body: undefined },
      {
        method: 'POST',
        path: `/repos/${REPO}/git/trees`,
        body: {
          tree: [
            {
              path: 'README.md',
              mode: '100644',
              type: 'blob',
              content:
                'Rendered previews of pull requests that change drawings, written by the icon preview workflow. Nothing here is part of the package.\n'
            }
          ]
        }
      },
      {
        method: 'POST',
        path: `/repos/${REPO}/git/commits`,
        body: { message: 'Start the icon preview branch', tree: 'tree-sha', parents: [] }
      },
      {
        method: 'POST',
        path: `/repos/${REPO}/git/refs`,
        body: { ref: 'refs/heads/icons-preview', sha: 'commit-sha' }
      },
      { method: 'GET', path: `${contentPath}?ref=icons-preview`, body: undefined },
      {
        method: 'PUT',
        path: contentPath,
        body: {
          message: 'Preview of pull request 12',
          content: base64,
          branch: 'icons-preview'
        }
      }
    ])
  })

  it.each([
    ['the branch lookup', 'ref', 500, 'preview branch: unexpected response 500'],
    ['the tree', 'trees', 422, 'preview tree: unexpected response 422'],
    ['the commit', 'commits', 200, 'preview commit: unexpected response 200'],
    ['the ref', 'refs', 500, 'preview branch creation: unexpected response 500']
  ])('fails on an unexpected status from %s', async (_what, step, status, message) => {
    /**
     * Scenario: each step of creating the branch fails on any status but the expected one,
     * and nothing after it is requested.
     */
    const { request, calls } = fakeRequest(({ path }) => {
      if (path === refPath) return respond(step === 'ref' ? status : 404)
      if (path.endsWith('/git/trees')) return respond(step === 'trees' ? status : 201, { sha: 't' })
      if (path.endsWith('/git/commits')) {
        return respond(step === 'commits' ? status : 201, { sha: 'c' })
      }
      return respond(step === 'refs' ? status : 201)
    })
    await expect(publishImages(request, REPO, artifact())).rejects.toThrow(message)
    expect(calls.some(({ method, path }) => method === 'PUT' && path.includes('/contents/'))).toBe(
      false
    )
  })

  it('carries on when another publish created the branch first', async () => {
    /**
     * Scenario: two pull requests publish at once and both find no branch; the loser's ref
     * creation answers 422 because the branch now exists, which is what it wanted, so it
     * goes on to write its images.
     */
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === refPath) return respond(404)
      if (path.endsWith('/git/trees')) return respond(201, { sha: 't' })
      if (path.endsWith('/git/commits')) return respond(201, { sha: 'c' })
      if (path.endsWith('/git/refs')) return respond(422)
      return respond(method === 'GET' ? 404 : 201)
    })
    await publishImages(request, REPO, artifact())
    expect(calls.filter(({ method }) => method === 'PUT')).toHaveLength(1)
  })

  it('reads the image again and retries a write that lost a race', async () => {
    /**
     * Scenario: another publish moved the branch between the read and the write (409); the
     * write is retried with the sha read again, and the second attempt succeeds.
     */
    let puts = 0
    let gets = 0
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === refPath) return respond(200)
      if (method === 'GET') return respond(200, { sha: `sha-${++gets}` })
      return respond(++puts === 1 ? 409 : 200)
    })
    await publishImages(request, REPO, artifact())
    const writes = calls.filter(({ method }) => method === 'PUT')
    expect(writes.map(({ body }) => (body as { sha: string }).sha)).toStrictEqual([
      'sha-1',
      'sha-2'
    ])
  })

  it('does not retry a write refused for another reason', async () => {
    /**
     * Scenario: only a conflict (409) is a lost race worth retrying; any other refusal fails
     * on the first attempt.
     */
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === refPath) return respond(200)
      return respond(method === 'GET' ? 404 : 422)
    })
    await expect(publishImages(request, REPO, artifact())).rejects.toThrow(
      'preview image write: unexpected response 422'
    )
    expect(calls.filter(({ method }) => method === 'PUT')).toHaveLength(1)
  })

  it('gives up after three conflicting writes', async () => {
    /**
     * Scenario: a write that keeps losing the race fails after three attempts rather than
     * looping, with the status of the last one.
     */
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === refPath) return respond(200)
      return respond(method === 'GET' ? 404 : 409)
    })
    await expect(publishImages(request, REPO, artifact())).rejects.toThrow(
      'preview image write: unexpected response 409'
    )
    expect(calls.filter(({ method }) => method === 'PUT')).toHaveLength(3)
  })

  it('updates an existing image with its sha', async () => {
    /**
     * Scenario: the workflow runs again for the same commit; the image already there is
     * replaced by passing its blob sha.
     */
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === refPath) return respond(200)
      if (method === 'GET') return respond(200, { sha: 'old-sha' })
      return respond(200)
    })
    await publishImages(request, REPO, artifact())
    expect(calls).toHaveLength(3)
    expect(calls[2]).toStrictEqual({
      method: 'PUT',
      path: contentPath,
      body: {
        message: 'Preview of pull request 12',
        content: base64,
        branch: 'icons-preview',
        sha: 'old-sha'
      }
    })
  })

  it('writes an existing image without a sha when the response has none', async () => {
    /**
     * Scenario: a 200 body with no sha does not invent one.
     */
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === refPath) return respond(200)
      if (method === 'GET') return respond(200, {})
      return respond(201)
    })
    await publishImages(request, REPO, artifact())
    expect(calls[2]?.body).not.toHaveProperty('sha')
  })

  it('writes without a sha when the lookup answers 404, whatever its body holds', async () => {
    /**
     * Scenario: only a 200 lookup supplies a sha; a 404 body that carries one is ignored.
     */
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === refPath) return respond(200)
      return method === 'GET' ? respond(404, { sha: 'stale' }) : respond(201)
    })
    await publishImages(request, REPO, artifact())
    expect(calls[2]?.body).not.toHaveProperty('sha')
  })

  it('stores every image of the artifact, each at its own path', async () => {
    /**
     * Scenario: two images produce two lookups and two writes in order; the branch exists.
     */
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === refPath) return respond(200)
      return method === 'GET' ? respond(404) : respond(201)
    })
    await publishImages(request, REPO, artifact(['preview.png', 'similarity.png']))
    expect(calls.map(({ method, path }) => `${method} ${path}`)).toStrictEqual([
      `GET ${refPath}`,
      `GET /repos/${REPO}/contents/pr-12/${HEAD}/preview.png?ref=icons-preview`,
      `PUT /repos/${REPO}/contents/pr-12/${HEAD}/preview.png`,
      `GET /repos/${REPO}/contents/pr-12/${HEAD}/similarity.png?ref=icons-preview`,
      `PUT /repos/${REPO}/contents/pr-12/${HEAD}/similarity.png`
    ])
  })

  it('writes nothing but the branch check when there is no image', async () => {
    /**
     * Scenario: a lint-failure artifact has no image, so no content is written.
     */
    const { request, calls } = fakeRequest(() => respond(200))
    await publishImages(request, REPO, artifact([]))
    expect(calls).toHaveLength(1)
  })

  it('fails when the image lookup answers with another status', async () => {
    /**
     * Scenario: a lookup that is neither 200 nor 404 stops before any write.
     */
    const { request, calls } = fakeRequest(({ path }) =>
      path === refPath ? respond(200) : respond(500)
    )
    await expect(publishImages(request, REPO, artifact())).rejects.toThrow(
      'preview image: unexpected response 500'
    )
    expect(calls.some(({ method }) => method === 'PUT')).toBe(false)
  })

  it.each([200, 201])('accepts a write that answers %i', async (status) => {
    /**
     * Scenario: both an update and a creation are successful writes.
     */
    const { request } = fakeRequest(({ method, path }) => {
      if (path === refPath) return respond(200)
      return method === 'GET' ? respond(404) : respond(status)
    })
    await expect(publishImages(request, REPO, artifact())).resolves.toBeUndefined()
  })

  it.each([204, 409, 422])('fails on a refused write that answers %i', async (status) => {
    /**
     * Scenario: a write the API refuses fails the job.
     */
    const { request } = fakeRequest(({ method, path }) => {
      if (path === refPath) return respond(200)
      return method === 'GET' ? respond(404) : respond(status)
    })
    await expect(publishImages(request, REPO, artifact())).rejects.toThrow(
      `preview image write: unexpected response ${status}`
    )
  })
})

describe('upsertComment', () => {
  const manifest = manifestOf()
  const expectedBody = commentBody(manifest, (file) => imageUrl(REPO, manifest, file))
  const listPath = (page: number): string =>
    `/repos/${REPO}/issues/12/comments?per_page=100&page=${page}`
  const mine = (id: number, body = `${COMMENT_MARKER}\nold`): unknown => ({
    id,
    user: { login: COMMENT_AUTHOR },
    body
  })
  const filler = (count: number): unknown[] =>
    Array.from({ length: count }, (_unused, index) => ({
      id: index,
      user: { login: 'someone' },
      body: 'hello'
    }))

  it('creates the comment when there is none', async () => {
    /**
     * Scenario: an empty first page leads to a new comment with the validated body.
     */
    const { request, calls } = fakeRequest(({ method }) =>
      method === 'GET' ? respond(200, []) : respond(201)
    )
    await expect(upsertComment(request, REPO, manifest)).resolves.toBe('created')
    expect(calls).toStrictEqual([
      { method: 'GET', path: listPath(1), body: undefined },
      { method: 'POST', path: `/repos/${REPO}/issues/12/comments`, body: { body: expectedBody } }
    ])
  })

  it('updates the comment it wrote earlier, found on a later page', async () => {
    /**
     * Scenario: the first page is full and holds no preview comment; the second holds it,
     * after a comment that is not ours, so it is updated by id.
     */
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === listPath(1)) return respond(200, filler(100))
      if (path === listPath(2)) return respond(200, [filler(1)[0], mine(555)])
      return method === 'PATCH' ? respond(200) : undefined
    })
    await expect(upsertComment(request, REPO, manifest)).resolves.toBe('updated')
    expect(calls.map(({ method, path }) => `${method} ${path}`)).toStrictEqual([
      `GET ${listPath(1)}`,
      `GET ${listPath(2)}`,
      `PATCH /repos/${REPO}/issues/comments/555`
    ])
    expect(calls[2]?.body).toStrictEqual({ body: expectedBody })
  })

  it('finds the comment on the first page without reading more', async () => {
    /**
     * Scenario: a full first page that holds the comment stops the search.
     */
    const { request, calls } = fakeRequest(({ method }) =>
      method === 'GET' ? respond(200, [...filler(99), mine(7)]) : respond(200)
    )
    await expect(upsertComment(request, REPO, manifest)).resolves.toBe('updated')
    expect(calls.filter(({ method }) => method === 'GET')).toHaveLength(1)
  })

  it.each([
    ['another author', { id: 1, user: { login: 'mallory' }, body: `${COMMENT_MARKER}\nx` }],
    ['a user without a login', { id: 1, user: {}, body: `${COMMENT_MARKER}\nx` }],
    ['no user', { id: 1, body: `${COMMENT_MARKER}\nx` }],
    ['no marker', mine(1, 'a comment without the marker')],
    ['the marker after other text', mine(1, `intro ${COMMENT_MARKER}`)],
    ['no body', { id: 1, user: { login: COMMENT_AUTHOR } }],
    ['a null comment', null]
  ])('ignores a comment with %s', async (_what, comment) => {
    /**
     * Scenario: only a comment by the workflow's bot that starts with the marker counts, so
     * another author cannot make the job overwrite their comment.
     */
    const { request, calls } = fakeRequest(({ method }) =>
      method === 'GET' ? respond(200, [comment]) : respond(201)
    )
    await expect(upsertComment(request, REPO, manifest)).resolves.toBe('created')
    expect(calls.map(({ method }) => method)).toStrictEqual(['GET', 'POST'])
  })

  it('stops at the first short page', async () => {
    /**
     * Scenario: a page of 99 comments is the last, so no further page is read.
     */
    const { request, calls } = fakeRequest(({ method }) =>
      method === 'GET' ? respond(200, filler(99)) : respond(201)
    )
    await expect(upsertComment(request, REPO, manifest)).resolves.toBe('created')
    expect(calls.map(({ method }) => method)).toStrictEqual(['GET', 'POST'])
  })

  it('stops at the page cap', async () => {
    /**
     * Scenario: with only full pages, twenty are read and no more; the comment is created.
     */
    const { request, calls } = fakeRequest(({ method }) =>
      method === 'GET' ? respond(200, filler(100)) : respond(201)
    )
    await expect(upsertComment(request, REPO, manifest)).resolves.toBe('created')
    const reads = calls.filter(({ method }) => method === 'GET').map(({ path }) => path)
    expect(reads).toStrictEqual(Array.from({ length: 20 }, (_unused, index) => listPath(index + 1)))
  })

  it('fails when the comments cannot be listed', async () => {
    /**
     * Scenario: a non-200 answer to the listing fails with its status.
     */
    const { request } = fakeRequest(() => respond(500, []))
    await expect(upsertComment(request, REPO, manifest)).rejects.toThrow(
      'comments: unexpected response 500'
    )
  })

  it('fails when the listing is not an array', async () => {
    /**
     * Scenario: a 200 answer whose body is not a list is refused.
     */
    const { request } = fakeRequest(() => respond(200, { message: 'x' }))
    await expect(upsertComment(request, REPO, manifest)).rejects.toThrow(
      'comments: unexpected response 200'
    )
  })

  it.each([200, 204, 422])('fails when creating the comment answers %i', async (status) => {
    /**
     * Scenario: only 201 means the comment was created.
     */
    const { request } = fakeRequest(({ method }) =>
      method === 'GET' ? respond(200, []) : respond(status)
    )
    await expect(upsertComment(request, REPO, manifest)).rejects.toThrow(
      `comment: unexpected response ${status}`
    )
  })

  it.each([201, 204, 404])('fails when updating the comment answers %i', async (status) => {
    /**
     * Scenario: only 200 means the comment was updated.
     */
    const { request } = fakeRequest(({ method }) =>
      method === 'GET' ? respond(200, [mine(9)]) : respond(status)
    )
    await expect(upsertComment(request, REPO, manifest)).rejects.toThrow(
      `comment update: unexpected response ${status}`
    )
  })
})

describe('gitHubRequest', () => {
  /** A fake `fetch` that records its arguments and answers with a fixed response. */
  function fakeFetch(
    status: number,
    text: string
  ): {
    fetcher: typeof fetch
    seen: { url: string; init: RequestInit | undefined }[]
  } {
    const seen: { url: string; init: RequestInit | undefined }[] = []
    const fetcher: typeof fetch = (input, init) => {
      seen.push({ url: String(input), init })
      return Promise.resolve(new Response(text, { status }))
    }
    return { fetcher, seen }
  }

  it('sends the method, the headers and the JSON body, and parses the answer', async () => {
    /**
     * Scenario: a write call goes to the REST API with the token and the JSON body, and
     * the answer's status and parsed body come back.
     */
    const { fetcher, seen } = fakeFetch(201, '{"id":5}')
    const response = await gitHubRequest('tok', fetcher)('POST', '/repos/o/r/x', { a: 1 })
    expect(response).toStrictEqual({ status: 201, body: { id: 5 } })
    expect(seen).toStrictEqual([
      {
        url: 'https://api.github.com/repos/o/r/x',
        init: {
          method: 'POST',
          headers: {
            accept: 'application/vnd.github+json',
            authorization: 'Bearer tok',
            'content-type': 'application/json',
            'x-github-api-version': '2022-11-28'
          },
          body: '{"a":1}'
        }
      }
    ])
  })

  it('sends no body when none is given, and reads an empty answer as undefined', async () => {
    /**
     * Scenario: a GET carries no `body` key at all, and an empty response body parses to
     * undefined rather than failing.
     */
    const { fetcher, seen } = fakeFetch(404, '')
    const response = await gitHubRequest('tok', fetcher)('GET', '/x')
    expect(response).toStrictEqual({ status: 404, body: undefined })
    expect(seen[0]?.init).not.toHaveProperty('body')
    expect(seen[0]?.init?.method).toBe('GET')
  })

  it('sends a falsy body such as an empty list', async () => {
    /**
     * Scenario: only `undefined` means no body; other values are serialised.
     */
    const { fetcher, seen } = fakeFetch(200, '[]')
    await gitHubRequest('tok', fetcher)('PUT', '/x', [])
    expect(seen[0]?.init?.body).toBe('[]')
  })

  it('fails when the answer is not JSON', async () => {
    /**
     * Scenario: a non-empty answer that does not parse fails the request.
     */
    const { fetcher } = fakeFetch(200, '<html>')
    await expect(gitHubRequest('tok', fetcher)('GET', '/x')).rejects.toThrow(SyntaxError)
  })

  it('uses the global fetch by default', async () => {
    /**
     * Scenario: with no fetch given, the platform's `fetch` makes the call.
     */
    const spy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    try {
      const response = await gitHubRequest('tok')('GET', '/x')
      expect(response).toStrictEqual({ status: 200, body: { ok: true } })
      expect(spy).toHaveBeenCalledWith('https://api.github.com/x', expect.anything())
    } finally {
      spy.mockRestore()
    }
  })
})
