/**
 * @fileoverview The redraw gate: a pull request may change a drawing that already exists, or
 * its visual baseline, only when a redraw manifest under `docs/redraws/` names it. A batch
 * that adds icons touches no existing drawing, so a slip that rewrites one (a normaliser run
 * over a whole folder, a baseline regenerated from the damage) fails here rather than in
 * review.
 * @layer Pipeline
 */

/** One line of `git diff --name-status`: its status letter and the paths it names. */
export interface FileChange {
  /** `A`, `M`, `D`, `R` or `C`; a rename or copy score is dropped. */
  readonly status: string
  /** The paths, one for most statuses, the old and the new one for a rename or copy. */
  readonly paths: readonly string[]
}

/** Where the redraw manifests live, from the repository root. */
export const MANIFEST_DIRECTORY = 'docs/redraws/'

/** A drawing source or its baseline: the folder decides which, the file name gives the name. */
const GUARDED =
  /^(?:icons\/(?:line|filled|sm|brands)\/([a-z0-9-]+)\.svg|visual\/(?:line|filled|sm|brands)\/([a-z0-9-]+)\.png)$/

/**
 * Reads `git diff --name-status` output.
 *
 * @param text - The command's output, one change per line, fields separated by tabs.
 * @returns The changes, blank lines skipped.
 */
export function parseNameStatus(text: string): FileChange[] {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => ({ status: line.charAt(0), paths: line.split('\t').slice(1) }))
}

/**
 * The icon or brand name a path guards, or `undefined` for any other file.
 *
 * @param path - A repository path, with forward slashes.
 * @returns The name, such as `home` for `icons/line/home.svg` or `visual/sm/home.png`.
 */
export function guardedName(path: string): string | undefined {
  const match = GUARDED.exec(path)
  return match?.[1] ?? match?.[2]
}

/**
 * The names a redraw manifest lists: the backticked name that opens each list item, as in
 * "- `home`: the door was redrawn (auditor, 2026-11-12)".
 *
 * @param markdown - The manifest's text.
 * @returns The names it lists.
 */
export function manifestNames(markdown: string): Set<string> {
  const names = new Set<string>()
  for (const match of markdown.matchAll(/^\s*[-*] `([a-z0-9-]+)`/gm)) names.add(String(match[1]))
  return names
}

/**
 * The statuses that touch a file which existed before: modified, deleted, renamed away and
 * changed in type. An added file and a copy's new file did not exist.
 */
const EXISTING = new Set(['M', 'D', 'R', 'T'])

/**
 * The paths of existing drawings and baselines a pull request changes that no manifest
 * names: what the gate refuses.
 *
 * @param changes - The pull request's changes against its base.
 * @param allowed - The names its manifests list.
 * @returns The refused paths, in the order of the changes; for a rename, its old path.
 */
export function unlistedChanges(
  changes: readonly FileChange[],
  allowed: ReadonlySet<string>
): string[] {
  const refused: string[] = []
  for (const change of changes) {
    // The first path is the file that existed: the old one, for a rename.
    for (const path of change.paths.slice(0, 1)) {
      const name = guardedName(path)
      if (EXISTING.has(change.status) && name !== undefined && !allowed.has(name)) {
        refused.push(path)
      }
    }
  }
  return refused
}

/**
 * The manifests a pull request adds or changes, which are the ones that speak for it.
 *
 * @param changes - The pull request's changes against its base.
 * @returns Their paths.
 */
export function manifestPaths(changes: readonly FileChange[]): string[] {
  return changes
    .filter((change) => change.status === 'A' || change.status === 'M')
    .flatMap((change) => change.paths)
    .filter((path) => path.startsWith(MANIFEST_DIRECTORY) && path.endsWith('.md'))
    .filter((path) => path !== `${MANIFEST_DIRECTORY}README.md`)
}
