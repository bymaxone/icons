/**
 * Retries a request that failed for a reason that is not the link's own: a server error (5xx) or a
 * transport error. A transient 503 from a host that is up a minute later must not block a release,
 * and a dead link still fails, because it answers the same on every attempt.
 */

/**
 * Runs `request` until it returns a response that is not a server error, up to `attempts` times.
 * The last response is returned whatever its status; the last error is rethrown.
 *
 * @param {() => Promise<{ status: number, body?: { cancel: () => Promise<unknown> } | null }>} request
 *   One attempt, which must build its own timeout signal.
 * @param {object} [options] - Tuning.
 * @param {number} [options.attempts] - The most attempts, the first included.
 * @param {(error: unknown) => boolean} [options.retryable] - Whether a thrown error is worth another attempt.
 * @param {(attempt: number) => Promise<void>} [options.wait] - The pause after attempt `attempt`.
 * @returns {Promise<{ status: number }>} The response of the last attempt.
 */
export async function retryRequest(
  request,
  {
    attempts = 3,
    retryable = () => true,
    wait = (attempt) => new Promise((done) => setTimeout(done, 1000 * attempt))
  } = {}
) {
  for (let attempt = 1; ; attempt++) {
    let response
    try {
      response = await request()
    } catch (error) {
      if (attempt >= attempts || !retryable(error)) throw error
      await wait(attempt)
      continue
    }
    if (response.status < 500 || attempt >= attempts) return response
    await response.body?.cancel().catch(() => undefined)
    await wait(attempt)
  }
}
