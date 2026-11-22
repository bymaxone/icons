#!/usr/bin/env node
/**
 * @fileoverview Check Line and optical masters against their design-grid stroke bands.
 * @layer scripts
 */
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { contourWeight } from '../src/pipeline/contour-weight.ts'

const exceptions = new Map(
  Object.entries(JSON.parse(readFileSync(new URL('./weight-allowlist.json', import.meta.url))))
)
for (const kind of ['line', 'sm']) {
  const folder = new URL(`../icons/${kind}/`, import.meta.url)
  for (const file of readdirSync(folder).filter((name) => name.endsWith('.svg'))) {
    const name = file.slice(0, -4)
    const svg = readFileSync(new URL(file, folder), 'utf8')
    const weight = contourWeight(svg)
    const key = `${kind}/${name}`
    const valid =
      weight &&
      (kind === 'line'
        ? weight.median >= 1.4 && weight.median <= 1.6 && weight.p10 >= 1.3
        : weight.median >= 2.1 && weight.median <= 2.4)
    const exception = exceptions.get(key)
    if (exceptions.delete(key)) {
      if (!exception?.reason?.trim()) {
        console.error(key, 'has no optical exception reason')
        process.exitCode = 1
        continue
      }
      if (createHash('sha256').update(svg).digest('hex') === exception.sha256) continue
      console.error(key, 'differs from the approved drawing')
      process.exitCode = 1
      continue
    }
    if (valid) continue
    console.error(key, weight ?? 'no measurable stroke')
    process.exitCode = 1
  }
}
for (const key of exceptions.keys()) {
  console.error(key, 'has an optical exception but no drawing')
  process.exitCode = 1
}
