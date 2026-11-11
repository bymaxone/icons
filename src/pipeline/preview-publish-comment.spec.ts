/**
 * Unit tests for the comment and the REST call of the privileged preview half.
 *
 * Layer: unit, with a fake GitHub REST call.
 * Goal: prove the preview comment is created once and then updated, found across pages
 * only when the bot wrote it with the marker, and that `gitHubRequest` speaks the REST
 * protocol.
 * Mocks: the REST call is a scripted fake; `fetch` is a fake that records its arguments.
 */

import { COMMENT_MARKER, commentBody } from './preview.ts'
import { COMMENT_AUTHOR, gitHubRequest, imageUrl, upsertComment } from './preview-publish.ts'
import { REPO, fakeRequest, manifestOf, respond } from './__tests__/preview-publish-fakes.ts'

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
