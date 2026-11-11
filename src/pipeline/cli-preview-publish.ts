/**
 * @fileoverview `scripts/icons-preview-publish.mjs`, the command the privileged preview jobs
 * run: `publish` stores the images, `comment` writes the comment. It imports nothing that
 * parses or renders a drawing, so the privileged jobs install no dependency, and every value
 * from the command line or the environment is validated before it reaches a path or the API.
 * @layer Pipeline
 */

import type { Output } from './cli.ts'
import {
  gitHubRequest,
  publishImages,
  readArtifact,
  upsertComment,
  verifyPullRequest
} from './preview-publish.ts'
import type { GitHubRequest } from './preview-publish.ts'

/** A git object name. */
const COMMIT = /^[0-9a-f]{40}$/

/** A required value that matches a pattern, or a failure naming it. */
function required(value: string | undefined, pattern: RegExp, what: string): string {
  if (value === undefined || !pattern.test(value)) throw new Error(`missing or invalid ${what}`)
  return value
}

/**
 * Runs `publish --dir <artifact>` or `comment --dir <artifact>`, with `GITHUB_REPOSITORY`,
 * `GITHUB_TOKEN` and `RUN_HEAD_SHA` (the head commit of the run that built the artifact)
 * from the environment.
 *
 * @param args - The command, then its flags.
 * @param env - The environment.
 * @param output - Where to print.
 * @param request - Builds the REST call from the token.
 * @returns The exit code.
 */
export async function runPreviewPublish(
  args: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
  output: Output,
  request: (token: string) => GitHubRequest = gitHubRequest
): Promise<number> {
  try {
    const [command, flag, directory] = args
    if ((command !== 'publish' && command !== 'comment') || flag !== '--dir') {
      throw new Error('usage: icons-preview-publish.mjs publish|comment --dir <artifact>')
    }
    const repository = required(env['GITHUB_REPOSITORY'], /^[\w.-]+\/[\w.-]+$/, 'GITHUB_REPOSITORY')
    const call = request(required(env['GITHUB_TOKEN'], /^\S+$/, 'GITHUB_TOKEN'))
    const runHead = required(env['RUN_HEAD_SHA'], COMMIT, 'RUN_HEAD_SHA')
    const artifact = readArtifact(required(directory, /^[\w./-]+$/, '--dir'))
    await verifyPullRequest(call, repository, artifact.manifest, runHead)
    if (command === 'publish') {
      await publishImages(call, repository, artifact)
      output.log(`published ${artifact.images.size} image(s) for #${artifact.manifest.pr}`)
    } else {
      const result = await upsertComment(call, repository, artifact.manifest)
      output.log(`${result} the preview comment on #${artifact.manifest.pr}`)
    }
    return 0
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}
