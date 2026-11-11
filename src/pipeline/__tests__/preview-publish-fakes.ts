/**
 * @fileoverview Fakes the specs of the privileged preview half share: a scripted GitHub
 * REST call, a valid manifest, and the identity of the workflow run that built it.
 * @layer Tests
 */

import type { GitHubRequest, GitHubResponse } from '../preview-publish.ts'
import { validateManifest } from '../preview.ts'
import type { PreviewManifest } from '../preview.ts'

/** The head commit every fake run and manifest names: a full lowercase SHA. */
export const HEAD = 'c'.repeat(40)
/** The repository the fake requests are made against. */
export const REPO = 'bymaxone/icons'
/** The run that built the artifact: its head commit, head repository, head branch and base. */
export const RUN = {
  head: HEAD,
  repository: 'contributor/icons',
  branch: 'new-icons',
  base: 'main'
}
/**
 * Bytes that start with the PNG signature and pass `isPublishablePng`. They are a signature
 * fixture only, not a decodable image.
 */
export const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 7, 8, 9])

/** A valid manifest as parsed JSON, with fields replaced by `overrides`. */
export const manifestJson = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  pr: 12,
  head: HEAD,
  lint: 'passed',
  issues: 0,
  icons: [],
  images: ['preview.png'],
  ...overrides
})

/** A valid manifest after `validateManifest`, with fields replaced by `overrides`. */
export const manifestOf = (overrides: Record<string, unknown> = {}): PreviewManifest =>
  validateManifest(manifestJson(overrides))

/** One call a fake REST call received. */
export interface Call {
  readonly method: string
  readonly path: string
  readonly body: unknown
}

/** A fake REST call: it records every call and answers from a handler. */
export function fakeRequest(handler: (call: Call) => GitHubResponse | undefined): {
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

/** A REST response with a status and an optional parsed body. */
export const respond = (status: number, body?: unknown): GitHubResponse => ({ status, body })
