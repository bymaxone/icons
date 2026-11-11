/**
 * @fileoverview The privileged half of the pull-request preview. It runs with write access,
 * so it treats the artifact of the unprivileged half as hostile: the manifest is validated
 * field by field, every image must be a PNG of bounded size named by a strict pattern, the
 * pull request must be open on the commit, the repository and the branch the run built,
 * and the images are stored under paths built from validated numbers and hashes only. It
 * never checks out or runs pull-request code.
 * @layer Pipeline
 */

import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { COMMENT_MARKER, commentBody, isPublishablePng, validateManifest } from './preview.ts'
import type { PreviewManifest } from './preview.ts'

/** A GitHub REST response: its status and its parsed body. */
export interface GitHubResponse {
  readonly status: number
  readonly body: unknown
}

/** One GitHub REST call, injected so the publishing is testable without the network. */
export type GitHubRequest = (
  method: 'GET' | 'POST' | 'PUT' | 'PATCH',
  path: string,
  body?: unknown
) => Promise<GitHubResponse>

/** The branch the preview images are stored on; it shares no history with `main`. */
export const PREVIEW_BRANCH = 'icons-preview'
/** The author of the preview comment. */
export const COMMENT_AUTHOR = 'github-actions[bot]'
/** The largest manifest read, in bytes. */
const MAX_MANIFEST_BYTES = 1024 * 1024
/** An `owner/name` repository. */
const REPOSITORY = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/
/** A git object name. */
const COMMIT = /^[0-9a-f]{40}$/
/** The most pages of comments read while looking for the preview comment. */
const MAX_COMMENT_PAGES = 20

/** The workflow run that built an artifact, as its `workflow_run` event names it. */
export interface WorkflowRun {
  /** The head commit the run built. */
  readonly head: string
  /** The `owner/name` of the repository the head commit came from (a fork, for one). */
  readonly repository: string
  /** The branch of that repository. */
  readonly branch: string
}

/** A validated artifact: the manifest and the bytes of each image it lists. */
export interface PreviewArtifact {
  readonly manifest: PreviewManifest
  readonly images: ReadonlyMap<string, Uint8Array>
}

/** A field of an API body, or `undefined` when the body is not an object. */
function read(body: unknown, key: string): unknown {
  return typeof body === 'object' && body !== null ? Reflect.get(body, key) : undefined
}

/** Fails with the API's status, for a response that is not the one expected. */
function unexpected(what: string, response: GitHubResponse): never {
  throw new Error(`${what}: unexpected response ${response.status}`)
}

/**
 * Reads and validates the artifact the unprivileged job uploaded. Files it does not list
 * are ignored; a listed image that is missing, too large or not a PNG fails.
 *
 * @param directory - Where the artifact was downloaded.
 * @returns The validated artifact.
 * @throws {Error} When the manifest or an image does not validate.
 */
export function readArtifact(directory: string): PreviewArtifact {
  const manifestFile = join(directory, 'manifest.json')
  if (statSync(manifestFile).size > MAX_MANIFEST_BYTES) throw new Error('manifest too large')
  const manifest = validateManifest(JSON.parse(readFileSync(manifestFile, 'utf8')))
  const images = new Map<string, Uint8Array>()
  for (const file of manifest.images) {
    const path = join(directory, file)
    if (!existsSync(path)) throw new Error(`missing image ${file}`)
    const bytes = readFileSync(path)
    if (!isPublishablePng(bytes)) throw new Error(`not a publishable PNG: ${file}`)
    images.set(file, bytes)
  }
  return { manifest, images }
}

/**
 * Checks the repository name and that the pull request the manifest names is the one the
 * workflow run built: open, on the run's head commit, and from the run's head repository
 * and branch. The number comes from the artifact, so it is not trusted: anyone's fork can
 * push another pull request's head commit, but a manifest that passes can only name a pull
 * request opened from the run's own head branch, which its author already controls.
 *
 * @param request - The REST call.
 * @param repository - `owner/name` of this repository.
 * @param manifest - The validated manifest.
 * @param run - The workflow run that built the artifact.
 * @throws {Error} When anything does not match.
 */
export async function verifyPullRequest(
  request: GitHubRequest,
  repository: string,
  manifest: PreviewManifest,
  run: WorkflowRun
): Promise<void> {
  if (!REPOSITORY.test(repository)) throw new Error('invalid repository')
  if (!COMMIT.test(run.head) || run.head !== manifest.head) {
    throw new Error('the manifest does not belong to this workflow run')
  }
  const response = await request('GET', `/repos/${repository}/pulls/${manifest.pr}`)
  if (response.status !== 200) unexpected('pull request', response)
  if (read(response.body, 'state') !== 'open') throw new Error('the pull request is not open')
  const head = read(response.body, 'head')
  if (read(head, 'sha') !== run.head) {
    throw new Error('the pull request has moved past this commit')
  }
  if (
    read(read(head, 'repo'), 'full_name') !== run.repository ||
    read(head, 'ref') !== run.branch
  ) {
    throw new Error('the pull request was not built by this workflow run')
  }
}

/** Where an image is stored on the preview branch. */
function imagePath(manifest: PreviewManifest, file: string): string {
  return `pr-${manifest.pr}/${manifest.head}/${file}`
}

/**
 * The address an image is served from.
 *
 * @param repository - `owner/name`.
 * @param manifest - The validated manifest.
 * @param file - The image's file name.
 * @returns The raw-content URL on the preview branch.
 */
export function imageUrl(repository: string, manifest: PreviewManifest, file: string): string {
  return `https://raw.githubusercontent.com/${repository}/${PREVIEW_BRANCH}/${imagePath(manifest, file)}`
}

/** Creates the preview branch, with no parent, when it does not exist yet. */
async function ensureBranch(request: GitHubRequest, repository: string): Promise<void> {
  const ref = await request('GET', `/repos/${repository}/git/ref/heads/${PREVIEW_BRANCH}`)
  if (ref.status === 200) return
  if (ref.status !== 404) unexpected('preview branch', ref)
  const readme =
    'Rendered previews of pull requests that change drawings, written by the icon preview workflow. Nothing here is part of the package.\n'
  const tree = await request('POST', `/repos/${repository}/git/trees`, {
    tree: [{ path: 'README.md', mode: '100644', type: 'blob', content: readme }]
  })
  if (tree.status !== 201) unexpected('preview tree', tree)
  const commit = await request('POST', `/repos/${repository}/git/commits`, {
    message: 'Start the icon preview branch',
    tree: read(tree.body, 'sha'),
    parents: []
  })
  if (commit.status !== 201) unexpected('preview commit', commit)
  const created = await request('POST', `/repos/${repository}/git/refs`, {
    ref: `refs/heads/${PREVIEW_BRANCH}`,
    sha: read(commit.body, 'sha')
  })
  // 422: another publish created the branch first, which is what this call wanted.
  if (created.status !== 201 && created.status !== 422) {
    unexpected('preview branch creation', created)
  }
}

/** How many times an image write is tried when another publish moved the branch under it. */
const WRITE_ATTEMPTS = 3

/** Writes one image, reading its current sha first and trying again on a conflict. */
async function writeImage(
  request: GitHubRequest,
  path: string,
  content: string,
  message: string
): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    const existing = await request('GET', `${path}?ref=${PREVIEW_BRANCH}`)
    if (existing.status !== 200 && existing.status !== 404) unexpected('preview image', existing)
    const sha = existing.status === 200 ? read(existing.body, 'sha') : undefined
    const written = await request('PUT', path, {
      message,
      content,
      branch: PREVIEW_BRANCH,
      ...(sha === undefined ? {} : { sha })
    })
    if (written.status === 200 || written.status === 201) return
    // 409: the branch moved between the read and the write; read again and retry.
    if (written.status !== 409 || attempt === WRITE_ATTEMPTS) {
      unexpected('preview image write', written)
    }
  }
}

/**
 * Stores every image of a validated artifact on the preview branch, replacing an image of
 * the same commit when the workflow runs again. Publishes of different pull requests run at
 * the same time, so a write that loses a race to another one is read again and retried.
 *
 * @param request - The REST call.
 * @param repository - `owner/name`.
 * @param artifact - The validated artifact.
 * @throws {Error} When the API refuses a write.
 */
export async function publishImages(
  request: GitHubRequest,
  repository: string,
  artifact: PreviewArtifact
): Promise<void> {
  await ensureBranch(request, repository)
  for (const [file, bytes] of artifact.images) {
    await writeImage(
      request,
      `/repos/${repository}/contents/${imagePath(artifact.manifest, file)}`,
      Buffer.from(bytes).toString('base64'),
      `Preview of pull request ${artifact.manifest.pr}`
    )
  }
}

/** The id of the existing preview comment, or `undefined`. */
async function findComment(
  request: GitHubRequest,
  repository: string,
  pr: number
): Promise<unknown> {
  for (let page = 1; page <= MAX_COMMENT_PAGES; page++) {
    const response = await request(
      'GET',
      `/repos/${repository}/issues/${pr}/comments?per_page=100&page=${page}`
    )
    if (response.status !== 200 || !Array.isArray(response.body)) unexpected('comments', response)
    const comments: readonly unknown[] = response.body
    const found = comments.find(
      (comment) =>
        read(read(comment, 'user'), 'login') === COMMENT_AUTHOR &&
        String(read(comment, 'body')).startsWith(COMMENT_MARKER)
    )
    if (found !== undefined) return read(found, 'id')
    if (comments.length < 100) return undefined
  }
  return undefined
}

/**
 * Writes the preview comment, or updates the one already there.
 *
 * @param request - The REST call.
 * @param repository - `owner/name`.
 * @param manifest - The validated manifest.
 * @returns Whether the comment was created or updated.
 * @throws {Error} When the API refuses the write.
 */
export async function upsertComment(
  request: GitHubRequest,
  repository: string,
  manifest: PreviewManifest
): Promise<'created' | 'updated'> {
  const body = commentBody(manifest, (file) => imageUrl(repository, manifest, file))
  const id = await findComment(request, repository, manifest.pr)
  if (id === undefined) {
    const created = await request('POST', `/repos/${repository}/issues/${manifest.pr}/comments`, {
      body
    })
    if (created.status !== 201) unexpected('comment', created)
    return 'created'
  }
  const updated = await request('PATCH', `/repos/${repository}/issues/comments/${String(id)}`, {
    body
  })
  if (updated.status !== 200) unexpected('comment update', updated)
  return 'updated'
}

/**
 * A `GitHubRequest` over `fetch` and the REST API, authenticated by a token.
 *
 * @param token - The workflow's token.
 * @param fetcher - The `fetch` to call.
 * @returns The request function.
 */
export function gitHubRequest(token: string, fetcher: typeof fetch = fetch): GitHubRequest {
  return async (method, path, body) => {
    const response = await fetcher(`https://api.github.com${path}`, {
      method,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'x-github-api-version': '2022-11-28'
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    })
    const text = await response.text()
    return {
      status: response.status,
      body: text === '' ? undefined : (JSON.parse(text) as unknown)
    }
  }
}
