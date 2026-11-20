/**
 * Runs a probe from a file instead of an `-e` argument, and says why a run failed.
 *
 * A probe lists data that grows with the icon set: every subpath, every component. Linux refuses a
 * single command-line argument past 128 KiB (`MAX_ARG_STRLEN`, 131,072 bytes) with E2BIG, and
 * macOS has no such cap, so the data lives in the probe file and the command line carries only
 * the file's name.
 */
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** The most bytes Linux accepts in one argument of a command line. */
export const MAX_ARG_BYTES = 131_072

/**
 * The command line of a probe: node, any flags, and the file. Never the source.
 *
 * @param {string} file - The probe's file name, relative to the directory it runs in.
 * @param {string[]} [flags] - Node flags that come before the file.
 * @returns {string[]} The arguments after `node`.
 */
export function probeArguments(file, flags = []) {
  return [...flags, file]
}

/**
 * Writes `source` to `file` in `dir` and runs it with node from there.
 *
 * @param {string} dir - The consumer directory: the probe's working directory and its location.
 * @param {string} file - The file name, whose extension (`.mjs` or `.cjs`) picks the module type.
 * @param {string} source - The probe's code, data included.
 * @param {{ flags?: string[], timeout?: number }} [options] - Node flags and a timeout in ms.
 * @returns {import('node:child_process').SpawnSyncReturns<string>} What `spawnSync` returned.
 */
export function runProbe(dir, file, source, { flags = [], timeout = 30_000 } = {}) {
  writeFileSync(join(dir, file), source)
  return spawnSync('node', probeArguments(file, flags), { cwd: dir, encoding: 'utf8', timeout })
}

/**
 * Why a spawned process failed, in one line: its exit status, the signal that ended it, the error
 * `spawn` raised (E2BIG, ENOENT, ETIMEDOUT) and what it wrote to stderr. A run that never started
 * has a null status and no stderr, so the status alone reads "code null: undefined".
 *
 * @param {{ status?: number | null, signal?: string | null, error?: { code?: string }, code?: string, stderr?: string | null }} result
 *   A `spawnSync` result, or the error `execFileSync` throws, which carries the code itself.
 * @returns {string} The description.
 */
export function describeFailure(result) {
  const stderr = result.stderr ? result.stderr.trim() : '(no stderr)'
  return `code ${result.status}, signal ${result.signal}, error ${result.error?.code ?? result.code}: ${stderr}`
}
