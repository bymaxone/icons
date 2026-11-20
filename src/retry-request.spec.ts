/**
 * Pins `scripts/retry-request.mjs`, which asks a link again after a server error, so one 503 from
 * a host that is up a minute later cannot block a release while a dead link still fails.
 *
 * Layer: repository tooling, tests. The helper is an ES module, so each case runs it in a child
 * process the way the gate does, with a scripted sequence of answers and no real waiting.
 */
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const MODULE = resolve(__dirname, '..', 'scripts', 'retry-request.mjs')

interface Outcome {
  readonly result?: number
  readonly thrown?: string
  readonly calls: number
  readonly waits: number[]
  readonly cancelled: number
}

/** Runs `retryRequest` over `steps`: a number is a response status, a string is a thrown error. */
function run(steps: readonly (number | string)[], options = '{}'): Outcome {
  const program = `
    import { retryRequest } from ${JSON.stringify(MODULE)}
    const steps = ${JSON.stringify(steps)}
    const waits = []
    let calls = 0
    let cancelled = 0
    const request = async () => {
      const step = steps[Math.min(calls++, steps.length - 1)]
      if (typeof step === 'string') throw new Error(step)
      return { status: step, body: { cancel: async () => { cancelled++ } } }
    }
    const options = { wait: async (n) => { waits.push(n) }, ...(${options}) }
    try {
      const response = await retryRequest(request, options)
      console.log(JSON.stringify({ result: response.status, calls, waits, cancelled }))
    } catch (error) {
      console.log(JSON.stringify({ thrown: error.message, calls, waits, cancelled }))
    }`
  const run = spawnSync('node', ['--input-type=module', '-e', program], { encoding: 'utf8' })
  return JSON.parse(run.stdout) as Outcome
}

describe('retryRequest', () => {
  it('returns a good answer at once, without a second request or a wait', () => {
    // Scenario: the link answers 200 the first time.
    expect(run([200])).toMatchObject({ result: 200, calls: 1, waits: [] })
  })

  it('does not retry a client error, which the link answers the same every time', () => {
    // Scenario: a 404 is the link's own answer, so it is returned after one request.
    expect(run([404])).toMatchObject({ result: 404, calls: 1, waits: [] })
  })

  it('asks again after a 503 and returns the 200 that follows', () => {
    // Scenario: the release run that failed on a transient 503 for a LICENSE link.
    expect(run([503, 200])).toMatchObject({ result: 200, calls: 2, waits: [1], cancelled: 1 })
  })

  it('gives up after three attempts and returns the last server error', () => {
    // Scenario: a host that stays down fails the link with its own status, after two waits.
    expect(run([503])).toMatchObject({ result: 503, calls: 3, waits: [1, 2], cancelled: 2 })
  })

  it('retries a transport error and returns the answer that follows', () => {
    // Scenario: a reset connection, then a 200.
    expect(run(['ECONNRESET', 200])).toMatchObject({ result: 200, calls: 2, waits: [1] })
  })

  it('rethrows the last transport error once the attempts are spent', () => {
    // Scenario: three resets in a row surface the error to the caller.
    expect(run(['ECONNRESET'])).toMatchObject({ thrown: 'ECONNRESET', calls: 3, waits: [1, 2] })
  })

  it('rethrows at once an error the caller says is not worth another attempt', () => {
    // Scenario: a refused redirect is a finding about the link, so it is never asked again.
    expect(run(['refused'], '{ retryable: (e) => e.message !== "refused" }')).toMatchObject({
      thrown: 'refused',
      calls: 1,
      waits: []
    })
  })

  it('honours the number of attempts it is given', () => {
    // Scenario: with two attempts, a second 503 is returned after one wait.
    expect(run([503], '{ attempts: 2 }')).toMatchObject({ result: 503, calls: 2, waits: [1] })
  })

  it('waits a growing time between attempts by default', () => {
    // Scenario: with no `wait` given, the default pause is 1 s then 2 s; a fake timer would hide
    // that it elapses, so the pause is read from the real clock with one attempt left to spare.
    const program = `
      import { retryRequest } from ${JSON.stringify(MODULE)}
      let calls = 0
      const start = Date.now()
      await retryRequest(async () => ({ status: calls++ === 0 ? 503 : 200 }))
      console.log(Date.now() - start)`
    const elapsed = Number(
      spawnSync('node', ['--input-type=module', '-e', program], { encoding: 'utf8' }).stdout
    )
    expect(elapsed).toBeGreaterThanOrEqual(950)
  })
})
