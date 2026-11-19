/**
 * A Jest `globalSetup`, which runs in the parent before any worker starts. jest-worker puts
 * FORCE_COLOR=1 in a worker's environment when the parent's stdout is a terminal, and Node then
 * colours what a program spawned by a spec prints, so a spec that compares that output with a
 * literal reads `\x1b[33mtrue\x1b[39m` instead of `true`. CI has no terminal and never sees it.
 */
export default async function noColor() {
  process.env.FORCE_COLOR = '0'
  process.env.NO_COLOR = '1'
}
