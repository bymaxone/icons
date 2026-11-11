/**
 * @fileoverview The unprivileged half of the pull-request preview. It runs the base
 * branch's code on the pull request's drawings: the changed files are read with `git show`
 * as plain text, put into a copy of the base branch's `icons/`, and linted; only drawings
 * that pass the lint (which admits nothing but the seven geometry elements, so no image,
 * link or external reference) are rendered. It writes the images and a manifest for the
 * privileged half.
 * @layer Pipeline
 */

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

import type { Output } from './cli.ts'
import { placedDrawing, renderPng, SHEET_SIZES, SHEET_THEMES } from './contact-sheet.ts'
import type { SheetRow } from './contact-sheet.ts'
import type { IconSet } from './icon-set.ts'
import { formatIssue } from './lint-issue.ts'
import { lintSources } from './lint.ts'
import { parseChanges } from './preview.ts'
import type { PreviewIcon, PreviewManifest } from './preview.ts'
import { reportSheet, similarityEntries } from './similarity-report.ts'
import type { SimilarityEntry } from './similarity-report.ts'
import type { Reference } from './similarity.ts'
import { readSources } from './sources.ts'
import { visualTargets } from './visual.ts'
import type { VisualTarget } from './visual.ts'

/** The git reads the preview needs, injected so the build is testable without a repository. */
export interface PreviewGit {
  /** `git diff --name-status --no-renames <base> <head> -- icons`. */
  readonly diff: (base: string, head: string) => string
  /** `git show <head>:<path>`: a file as the pull request has it. */
  readonly show: (head: string, path: string) => string
}

/** What the build is asked to preview. */
export interface PreviewRequest {
  readonly root: string
  readonly base: string
  readonly head: string
  readonly pr: number
  /** The directory the images, the manifest and the scratch copy are written to. */
  readonly out: string
}

/** Copies the base branch's sources and applies the pull request's changes to the copy. */
function applyChanges(
  request: PreviewRequest,
  git: PreviewGit
): {
  icons: string
  names: Set<string>
} {
  const icons = join(request.out, 'icons')
  rmSync(icons, { recursive: true, force: true })
  cpSync(join(request.root, 'icons'), icons, { recursive: true })
  const changes = parseChanges(git.diff(request.base, request.head))
  for (const change of changes) {
    const file = join(request.out, change.path)
    if (change.status === 'deleted') {
      rmSync(file, { force: true })
    } else {
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, git.show(request.head, change.path))
    }
  }
  return { icons, names: new Set(changes.map((change) => change.name)) }
}

/** A changed drawing as it was and as it is; either side is absent when added or deleted. */
export interface PreviewRow {
  readonly label: string
  readonly before: SheetRow | undefined
  readonly after: SheetRow | undefined
}

/** The side of a preview cell, in px. */
const CELL = 56
/** The width of the label column, in px. */
const LABEL = 160
const FONT = 'font-family="Helvetica, Arial, sans-serif" font-size="12"'

/** One strip of a drawing at every size on both pages, or a dash when it is absent. */
function strip(row: SheetRow | undefined, left: number, top: number): string {
  return SHEET_THEMES.flatMap((theme, t) =>
    SHEET_SIZES.map((size, s) => {
      const x = left + (t * SHEET_SIZES.length + s) * CELL
      const cell = `<rect x="${x}" y="${top}" width="${CELL}" height="${CELL}" fill="${theme.background}"/>`
      return row === undefined ? cell : cell + placedDrawing(row, x, top, size, theme.colours[0][1])
    })
  ).join('')
}

/**
 * The preview sheet: one row a changed drawing, the base branch's drawing on the left and
 * the pull request's on the right, each at 16, 20, 24 and 48 px on both pages.
 *
 * @param rows - The changed drawings.
 * @returns The sheet's SVG text.
 */
export function previewSheet(rows: readonly PreviewRow[]): string {
  const stripWidth = SHEET_THEMES.length * SHEET_SIZES.length * CELL
  const width = LABEL + stripWidth * 2 + 16
  const height = 24 + Math.max(rows.length, 1) * CELL
  const body = rows.map((row, index) => {
    const top = 24 + index * CELL
    const label = row.label.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    return [
      `<text x="8" y="${top + CELL / 2 + 4}" fill="#0d1b24" ${FONT}>${label}</text>`,
      strip(row.before, LABEL, top),
      strip(row.after, LABEL + stripWidth + 16, top)
    ].join('')
  })
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    `<text x="${LABEL}" y="16" fill="#0d1b24" ${FONT}>Base branch</text>`,
    `<text x="${LABEL + stripWidth + 16}" y="16" fill="#0d1b24" ${FONT}>This pull request</text>`,
    ...body,
    '</svg>',
    ''
  ].join('\n')
}

/**
 * The before-and-after rows of the changed drawings, matched by variant and name: the base
 * branch's drawings first, then the ones the pull request adds.
 */
function previewRows(base: IconSet, head: IconSet, names: ReadonlySet<string>): PreviewRow[] {
  const changed = (set: IconSet): VisualTarget[] =>
    visualTargets(set).filter((target) => names.has(target.name))
  const rows = new Map<string, PreviewRow>()
  for (const target of changed(base)) {
    rows.set(target.file, { label: target.label, before: target, after: undefined })
  }
  for (const target of changed(head)) {
    rows.set(target.file, {
      label: target.label,
      before: rows.get(target.file)?.before,
      after: target
    })
  }
  return [...rows.values()]
}

/** A similarity entry as the manifest lists it. */
function manifestIcon(entry: SimilarityEntry): PreviewIcon {
  return {
    name: entry.name,
    variant: entry.variant,
    flagged: entry.flagged,
    primitive: entry.primitive,
    matches: entry.matches.map((match) => ({
      id: match.reference.id,
      distance: match.scores.distance,
      overlap: match.scores.overlap,
      cosine: match.scores.cosine
    }))
  }
}

/**
 * Builds the preview: lints the changed drawings and, when they pass, renders the
 * before-and-after sheet and the similarity sheet, then writes `manifest.json`.
 *
 * @param request - The commits, the pull request and the output directory.
 * @param git - The git reads.
 * @param references - The similarity references, loaded only when something is rendered.
 * @param output - Where to print.
 * @returns The manifest written.
 */
export function buildPreview(
  request: PreviewRequest,
  git: PreviewGit,
  references: () => readonly Reference[],
  output: Output
): PreviewManifest {
  mkdirSync(request.out, { recursive: true })
  const { icons, names } = applyChanges(request, git)
  const lint = lintSources(
    readSources({ root: request.root, icons: relative(request.root, icons) })
  )
  for (const issue of lint.issues) output.error(formatIssue(issue))
  const write = (manifest: PreviewManifest): PreviewManifest => {
    writeFileSync(join(request.out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
    return manifest
  }
  const common = { pr: request.pr, head: request.head }
  if (lint.issues.length > 0) {
    return write({ ...common, lint: 'failed', issues: lint.issues.length, icons: [], images: [] })
  }
  const base = lintSources(readSources({ root: request.root, icons: 'icons' })).set
  const rows = previewRows(base, lint.set, names)
  const images: string[] = []
  if (rows.length > 0) {
    writeFileSync(join(request.out, 'preview.png'), renderPng(previewSheet(rows)))
    images.push('preview.png')
  }
  const entries = names.size === 0 ? [] : similarityEntries(lint.set, references(), names)
  if (entries.length > 0) {
    writeFileSync(join(request.out, 'similarity.png'), renderPng(reportSheet(entries)))
    images.push('similarity.png')
  }
  output.log(`previewed ${rows.length} drawing(s); ${entries.length} compared for similarity`)
  return write({ ...common, lint: 'passed', issues: 0, icons: entries.map(manifestIcon), images })
}
