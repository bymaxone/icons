/**
 * Unit tests for the privileged half of the pull-request preview.
 *
 * Layer: unit, with a fake GitHub REST call and artifacts in a temp directory.
 * Goal: prove a hostile artifact is refused before anything is written, a manifest is
 * accepted only for the open pull request on the commit that was built, the images are
 * stored on the preview branch under validated paths, the comment is created or updated
 * once.
 * Mocks: the REST call is a scripted fake.
 */

import fs, { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { PreviewManifest } from './preview.ts'
import {
  imageUrl,
  PREVIEW_BRANCH,
  publishImages,
  readArtifact,
  verifyPullRequest
} from './preview-publish.ts'
import type { GitHubResponse, PreviewArtifact } from './preview-publish.ts'
import {
  fakeRequest,
  HEAD,
  manifestJson,
  manifestOf,
  PNG,
  REPO,
  respond,
  RUN
} from './__tests__/preview-publish-fakes.ts'

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

  it('fails on a listed image one byte over the limit, before reading it whole', () => {
    /**
     * Scenario: an image larger than the publishable size is refused by the size of the
     * descriptor it is read through, even when it starts like a PNG.
     */
    writeManifest(manifestJson())
    const big = Buffer.alloc(5 * 1024 * 1024 + 1)
    big.set(PNG)
    writeFileSync(join(directory, 'preview.png'), big)
    expect(() => readArtifact(directory)).toThrow('not a publishable PNG: preview.png')
  })

  it('checks and reads each file through one descriptor, and closes it', () => {
    /**
     * Scenario: the size is taken from the open descriptor and the bytes are read from the
     * same one, so the file cannot be swapped between the check and the read (a
     * time-of-check to time-of-use race); every descriptor opened is closed.
     */
    writeManifest(manifestJson())
    writeFileSync(join(directory, 'preview.png'), PNG)
    const opened = jest.spyOn(fs, 'openSync')
    const checked = jest.spyOn(fs, 'fstatSync')
    const closed = jest.spyOn(fs, 'closeSync')
    readArtifact(directory)
    const descriptors = opened.mock.results.map((result) => result.value as number)
    expect(descriptors).toHaveLength(2)
    expect(checked.mock.calls.map(([descriptor]) => descriptor)).toStrictEqual(descriptors)
    expect(closed.mock.calls.map(([descriptor]) => descriptor)).toStrictEqual(descriptors)
  })

  it('passes on an error other than a missing file', () => {
    /**
     * Scenario: only a missing file reads as missing; any other failure to open, such as a
     * permission error, is reported as it is.
     */
    writeManifest(manifestJson())
    jest.spyOn(fs, 'openSync').mockImplementation(() => {
      throw Object.assign(new Error('permission denied'), { code: 'EACCES' })
    })
    expect(() => readArtifact(directory)).toThrow('permission denied')
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
      head: { sha, ref: RUN.branch, repo: { full_name: RUN.repository } },
      base: { ref: RUN.base }
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
      const { request } = fakeRequest(() =>
        respond(200, { state: 'open', head, base: { ref: RUN.base } })
      )
      await expect(verifyPullRequest(request, REPO, manifestOf(), RUN)).rejects.toThrow(
        'the pull request was not built by this workflow run'
      )
    }
  )

  it.each([
    ['another base branch', { ref: 'release' }],
    ['no base branch', {}],
    ['a base that is not an object', 'main'],
    ['no base', undefined]
  ])('rejects a pull request from the run own head branch into %s', async (_what, base) => {
    /**
     * Scenario: one branch can back pull requests into several bases, so the head commit,
     * repository and branch do not single one out; the preview runs for the default
     * branch only, and a pull request into any other base is refused.
     */
    const head = { sha: HEAD, ref: RUN.branch, repo: { full_name: RUN.repository } }
    const { request } = fakeRequest(() => respond(200, { state: 'open', head, base }))
    await expect(verifyPullRequest(request, REPO, manifestOf(), RUN)).rejects.toThrow(
      'the pull request was not built by this workflow run'
    )
  })
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

  /** Every call that creates the branch from nothing, then writes one image, in order. */
  const bootstrapCalls = (): unknown[] => [
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
  ]

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
    expect(calls).toStrictEqual(bootstrapCalls())
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
