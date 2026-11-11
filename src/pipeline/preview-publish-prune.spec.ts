/**
 * Unit tests for `pruneEarlierPreviews`: the images of a pull request's earlier commits are
 * removed from the preview branch after a publish, and the commit just published is kept.
 *
 * Layer: unit.
 * Goal: pin the calls the pruning makes, the names it refuses to act on, the race with other
 * publishes, and the failures it reports.
 * Mocks: the GitHub REST call, through the shared fakes.
 */

import { pruneEarlierPreviews } from './preview-publish.ts'
import { fakeRequest, HEAD, manifestOf, REPO, respond } from './__tests__/preview-publish-fakes.ts'

const OLD = 'a'.repeat(40)
const OLDER = 'b'.repeat(40)
const ROOT = `/repos/${REPO}/contents/pr-12`
const MESSAGE = 'Drop an earlier preview of pull request 12'

describe('pruneEarlierPreviews', () => {
  const manifest = manifestOf({ images: ['preview.png'] })

  it('removes every image of the earlier commits and keeps the commit just published', async () => {
    /**
     * Scenario: the pull request has images of two earlier pushes and of the current one;
     * each earlier image is read for its sha and deleted on the preview branch, and the
     * current commit's directory is not even listed.
     */
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === `${ROOT}?ref=icons-preview`) {
        return respond(200, [{ name: OLD }, { name: HEAD }, { name: OLDER }])
      }
      if (path === `${ROOT}/${OLD}?ref=icons-preview`) {
        return respond(200, [{ name: 'preview.png' }, { name: 'family.png' }])
      }
      if (path === `${ROOT}/${OLDER}?ref=icons-preview`)
        return respond(200, [{ name: 'preview.png' }])
      if (method === 'GET') return respond(200, { sha: `sha-of-${path.split('/').at(-1)}` })
      return respond(200)
    })
    expect(await pruneEarlierPreviews(request, REPO, manifest)).toBe(3)
    expect(calls).toStrictEqual([
      { method: 'GET', path: `${ROOT}?ref=icons-preview`, body: undefined },
      { method: 'GET', path: `${ROOT}/${OLD}?ref=icons-preview`, body: undefined },
      { method: 'GET', path: `${ROOT}/${OLD}/preview.png?ref=icons-preview`, body: undefined },
      {
        method: 'DELETE',
        path: `${ROOT}/${OLD}/preview.png`,
        body: {
          message: MESSAGE,
          sha: 'sha-of-preview.png?ref=icons-preview',
          branch: 'icons-preview'
        }
      },
      { method: 'GET', path: `${ROOT}/${OLD}/family.png?ref=icons-preview`, body: undefined },
      {
        method: 'DELETE',
        path: `${ROOT}/${OLD}/family.png`,
        body: {
          message: MESSAGE,
          sha: 'sha-of-family.png?ref=icons-preview',
          branch: 'icons-preview'
        }
      },
      { method: 'GET', path: `${ROOT}/${OLDER}?ref=icons-preview`, body: undefined },
      { method: 'GET', path: `${ROOT}/${OLDER}/preview.png?ref=icons-preview`, body: undefined },
      {
        method: 'DELETE',
        path: `${ROOT}/${OLDER}/preview.png`,
        body: {
          message: MESSAGE,
          sha: 'sha-of-preview.png?ref=icons-preview',
          branch: 'icons-preview'
        }
      }
    ])
  })

  it('does nothing when the pull request has no directory yet', async () => {
    /**
     * Scenario: a 404 for the pull request's directory means nothing was stored before.
     */
    const { request, calls } = fakeRequest(() => respond(404))
    expect(await pruneEarlierPreviews(request, REPO, manifest)).toBe(0)
    expect(calls).toHaveLength(1)
  })

  it('leaves any name a publish does not write', async () => {
    /**
     * Scenario: the names come from the branch, so they are checked before they reach a
     * path: a directory that is not a commit name, a traversal, an entry with no name, and a
     * file that is not an image are all left alone.
     */
    const { request, calls } = fakeRequest(({ path }) => {
      if (path === `${ROOT}?ref=icons-preview`) {
        return respond(200, [{ name: 'README.md' }, { name: '..' }, {}, { name: OLD }])
      }
      return respond(200, [{ name: 'notes.txt' }, { name: '../x.png' }, { name: 'A.png' }, 'odd'])
    })
    expect(await pruneEarlierPreviews(request, REPO, manifest)).toBe(0)
    expect(calls.map(({ path }) => path)).toStrictEqual([
      `${ROOT}?ref=icons-preview`,
      `${ROOT}/${OLD}?ref=icons-preview`
    ])
  })

  it('counts a file another publish removed first as gone', async () => {
    /**
     * Scenario: two publishes of the same pull request prune at once; the file is already
     * gone when it is read (404), which is what the removal wanted, so nothing is deleted.
     */
    const { request, calls } = fakeRequest(({ path }) => {
      if (path === `${ROOT}?ref=icons-preview`) return respond(200, [{ name: OLD }])
      if (path === `${ROOT}/${OLD}?ref=icons-preview`)
        return respond(200, [{ name: 'preview.png' }])
      return respond(404)
    })
    expect(await pruneEarlierPreviews(request, REPO, manifest)).toBe(1)
    expect(calls.some(({ method }) => method === 'DELETE')).toBe(false)
  })

  it('counts a file removed between its read and its delete as gone', async () => {
    /**
     * Scenario: the file is read, then another publish removes it before the delete lands;
     * the delete answers 404, which is the state the removal wanted, so pruning carries on.
     */
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === `${ROOT}?ref=icons-preview`) return respond(200, [{ name: OLD }])
      if (path === `${ROOT}/${OLD}?ref=icons-preview`)
        return respond(200, [{ name: 'preview.png' }])
      return method === 'GET' ? respond(200, { sha: 's' }) : respond(404)
    })
    expect(await pruneEarlierPreviews(request, REPO, manifest)).toBe(1)
    expect(calls.filter(({ method }) => method === 'DELETE')).toHaveLength(1)
  })

  it('reads the sha again and retries a removal that lost a race', async () => {
    /**
     * Scenario: another publish moved the branch between the read and the delete (409); the
     * delete is retried with the sha read again, and the second attempt succeeds.
     */
    let reads = 0
    let deletes = 0
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === `${ROOT}?ref=icons-preview`) return respond(200, [{ name: OLD }])
      if (path === `${ROOT}/${OLD}?ref=icons-preview`)
        return respond(200, [{ name: 'preview.png' }])
      if (method === 'GET') return respond(200, { sha: `sha-${++reads}` })
      return respond(++deletes === 1 ? 409 : 200)
    })
    expect(await pruneEarlierPreviews(request, REPO, manifest)).toBe(1)
    const removals = calls.filter(({ method }) => method === 'DELETE')
    expect(removals.map(({ body }) => (body as { sha: string }).sha)).toStrictEqual([
      'sha-1',
      'sha-2'
    ])
  })

  it.each([
    ['a refused removal', 422, 1, 'preview image removal: unexpected response 422'],
    [
      'a removal that keeps losing the race',
      409,
      3,
      'preview image removal: unexpected response 409'
    ]
  ])('fails on %s', async (_what, status, attempts, message) => {
    /**
     * Scenario: only a conflict is retried, and at most three times; any other refusal fails
     * at once, with the status of the last attempt.
     */
    const { request, calls } = fakeRequest(({ method, path }) => {
      if (path === `${ROOT}?ref=icons-preview`) return respond(200, [{ name: OLD }])
      if (path === `${ROOT}/${OLD}?ref=icons-preview`)
        return respond(200, [{ name: 'preview.png' }])
      return method === 'GET' ? respond(200, { sha: 's' }) : respond(status)
    })
    await expect(pruneEarlierPreviews(request, REPO, manifest)).rejects.toThrow(message)
    expect(calls.filter(({ method }) => method === 'DELETE')).toHaveLength(attempts)
  })

  it.each([
    [
      'the pull request listing fails, even with a list',
      500,
      [],
      'preview listing: unexpected response 500'
    ],
    [
      'the pull request listing is not a list',
      200,
      { name: 'x' },
      'preview listing: unexpected response 200'
    ]
  ])('fails when %s', async (_what, status, body, message) => {
    /**
     * Scenario: a listing that is neither a directory nor missing stops the pruning before
     * anything is deleted.
     */
    const { request, calls } = fakeRequest(() => respond(status, body))
    await expect(pruneEarlierPreviews(request, REPO, manifest)).rejects.toThrow(message)
    expect(calls).toHaveLength(1)
  })

  it('fails when an image cannot be read for its sha', async () => {
    /**
     * Scenario: a read that is neither the file nor a 404 stops the pruning rather than
     * deleting without a sha.
     */
    const { request, calls } = fakeRequest(({ path }) => {
      if (path === `${ROOT}?ref=icons-preview`) return respond(200, [{ name: OLD }])
      if (path === `${ROOT}/${OLD}?ref=icons-preview`)
        return respond(200, [{ name: 'preview.png' }])
      return respond(500)
    })
    await expect(pruneEarlierPreviews(request, REPO, manifest)).rejects.toThrow(
      'preview image: unexpected response 500'
    )
    expect(calls.some(({ method }) => method === 'DELETE')).toBe(false)
  })
})
