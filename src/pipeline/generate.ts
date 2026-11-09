/**
 * @fileoverview The generator's file operations: format the source SVGs in place, write
 * the generated modules (formatted by Prettier with the repository's configuration), write
 * the static outputs, and compare a fresh generation with the committed copy.
 * @layer Pipeline
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'

import type { Options } from 'prettier'
import * as estree from 'prettier/plugins/estree'
import * as typescript from 'prettier/plugins/typescript'
import { format } from 'prettier/standalone'

import { metadataModule, staticFiles } from './emit-data.ts'
import { componentModules, GENERATED_DIRECTORIES } from './emit-modules.ts'
import type { IconSet } from './icon-set.ts'
import type { IconSources } from './sources.ts'
import { kindEntries } from './svg-kind.ts'
import type { SvgKind } from './svg-kind.ts'
import { normalizeSvg } from './svg.ts'

/**
 * Rewrites every source SVG the formatter can read into its normalised form, leaving the
 * others for the lint to report.
 *
 * @param root - The repository root.
 * @param sources - The sources as read.
 * @returns The paths of the files that changed.
 */
export function formatSources(root: string, sources: IconSources): string[] {
  const changed: string[] = []
  for (const [kind, files] of kindEntries(sources.svg)) {
    for (const file of files) {
      const normalised = file.fileName.endsWith('.svg') ? tryNormalize(file.text, kind) : undefined
      if (normalised === undefined || normalised === file.text) continue
      writeFileSync(join(root, file.path), normalised)
      changed.push(file.path)
    }
  }
  return changed
}

/** The normalised text, or `undefined` when the formatter cannot read the file. */
function tryNormalize(text: string, kind: SvgKind): string | undefined {
  try {
    return normalizeSvg(text, kind)
  } catch {
    return undefined
  }
}

/**
 * The repository's Prettier options, from its `.prettierrc` (JSON). Prettier's standalone
 * build is used because its Node build loads its parsers with a dynamic `import()`, which
 * Jest runs only behind `--experimental-vm-modules`; the standalone build resolves no
 * configuration file, so the file is read here.
 */
function prettierOptions(root: string): Options {
  const options: Options = JSON.parse(readFileSync(join(root, '.prettierrc'), 'utf8'))
  return { ...options, parser: 'typescript', plugins: [estree, typescript] }
}

/**
 * Every generated module, formatted by Prettier with the repository's configuration,
 * keyed by its path from the repository root.
 *
 * @param root - The repository root, which holds `.prettierrc`.
 * @param set - The icon set.
 * @returns The modules' text.
 */
export async function generatedModules(root: string, set: IconSet): Promise<Map<string, string>> {
  const raw = new Map([
    ...componentModules(set),
    ['src/meta/generated/metadata.ts', metadataModule(set)]
  ])
  const options = prettierOptions(root)
  const formatted = new Map<string, string>()
  for (const [path, text] of raw) formatted.set(path, await format(text, options))
  return formatted
}

/**
 * Writes files under a directory, creating parents as needed.
 *
 * @param directory - The directory the paths are relative to.
 * @param files - The files, keyed by relative path.
 */
export function writeFiles(directory: string, files: ReadonlyMap<string, string>): void {
  for (const [path, text] of files) {
    mkdirSync(dirname(join(directory, path)), { recursive: true })
    writeFileSync(join(directory, path), text)
  }
}

/**
 * Replaces the generated directories under `directory` with `files`, so a module whose
 * icon was removed does not survive the next generation.
 *
 * @param directory - The repository root, or a scratch copy of its layout.
 * @param files - The generated modules, keyed by path from the root.
 */
export function replaceGenerated(directory: string, files: ReadonlyMap<string, string>): void {
  for (const generated of GENERATED_DIRECTORIES) {
    rmSync(join(directory, generated), { recursive: true, force: true })
  }
  writeFiles(directory, files)
}

/** Every file under a directory, as paths relative to `base`, or none when it is absent. */
function listFiles(base: string, directory: string): string[] {
  const path = join(base, directory)
  if (!existsSync(path)) return []
  return readdirSync(path, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(base, join(entry.parentPath, entry.name)).replaceAll(sep, '/'))
}

/**
 * Compares the committed generated directories with a fresh generation.
 *
 * @param root - The repository root.
 * @param expected - The modules a generation writes, keyed by path from the root.
 * @returns One line per file that is missing, extra or different; empty when in step.
 */
export function staleFiles(root: string, expected: ReadonlyMap<string, string>): string[] {
  const committed = new Set(
    GENERATED_DIRECTORIES.flatMap((directory) => listFiles(root, directory))
  )
  const stale: string[] = []
  for (const [path, text] of expected) {
    if (!committed.has(path)) stale.push(`${path}: missing`)
    else if (readFileSync(join(root, path), 'utf8') !== text) stale.push(`${path}: out of date`)
  }
  for (const path of committed)
    if (!expected.has(path)) stale.push(`${path}: not generated by any source`)
  return stale.sort()
}

/**
 * Writes the static outputs into the build directory.
 *
 * @param outDir - The build directory, `dist`.
 * @param set - The icon set.
 * @returns The number of files written.
 */
export function writeStatic(outDir: string, set: IconSet): number {
  const files = staticFiles(set)
  writeFiles(outDir, files)
  return files.size
}
