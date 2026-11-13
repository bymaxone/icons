/**
 * @fileoverview The metadata check: it catches records that were overwritten or copied
 * instead of written. Two icons may share a label only through the allowlist, each group with
 * its written justification; an icon's use cases are never empty and never the same list as
 * another icon's; and no label is a placeholder. Brand marks have no label or use cases and
 * are out of scope.
 * @layer Pipeline
 */

import type { IconSet } from './icon-set.ts'

/** The labels that stand for "not written yet", compared in lower case and trimmed. A blank label is one too. */
export const PLACEHOLDER_LABELS: readonly string[] = ['todo', 'icon', 'untitled', 'label']

/** Where the allowlist is named in the messages, from the repository root. */
export const META_ALLOWLIST = 'scripts/meta-allowlist.json'

/** The part of an icon's metadata the check reads. */
export interface MetaRecord {
  readonly name: string
  readonly label: string
  readonly useCases: readonly string[]
}

/** What the allowlist records for a label: the exact icons that may share it, and why. */
export interface AllowedLabel {
  /** The icons that share the label, in any order. */
  readonly icons: readonly string[]
  /** The written justification. */
  readonly why: string
}

/**
 * The records the check covers: the label and use cases of each non-brand icon, in the
 * set's name order. Brand marks are not icons of the set's `icons` and are left out.
 *
 * @param set - The icon set.
 * @returns One record per non-brand icon.
 */
export function metaRecords(set: IconSet): MetaRecord[] {
  return set.icons.map(({ name, meta }) => ({
    name,
    label: meta.label,
    useCases: meta.useCases
  }))
}

/** Groups the names of the records by a key, keeping the records' order inside a group. */
function groupBy(
  records: readonly MetaRecord[],
  keyOf: (record: MetaRecord) => string
): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  for (const record of records) {
    const key = keyOf(record)
    groups.set(key, [...(groups.get(key) ?? []), record.name])
  }
  return groups
}

/** Whether a label stands for "not written yet". */
function isPlaceholder(label: string): boolean {
  const text = label.trim().toLowerCase()
  return text === '' || PLACEHOLDER_LABELS.includes(text)
}

const joinedMessage = (name: string, label: string, others: readonly string[]): string =>
  `${name}: label ${JSON.stringify(label)} is shared with ${others.join(', ')}. Give it its own label, or list the group in ${META_ALLOWLIST} with a justification.`

/** The problems of one entry of the allowlist against the icons that hold its label. */
function entryIssues(label: string, entry: AllowedLabel, group: readonly string[]): string[] {
  const problems: string[] = []
  const quoted = JSON.stringify(label)
  if (group.length < 2) {
    problems.push(`label ${quoted}: on the allowlist but no longer shared. Remove its entry.`)
  } else {
    for (const name of entry.icons.filter((icon) => !group.includes(icon))) {
      problems.push(
        `label ${quoted}: ${name} is on the allowlist but no longer has that label. Update the entry.`
      )
    }
  }
  if (entry.icons.length < 2) {
    problems.push(`label ${quoted}: on the allowlist with fewer than two icons. List the group.`)
  }
  if (entry.why.trim() === '') {
    problems.push(`label ${quoted}: on the allowlist without a justification.`)
  }
  return problems
}

/** The problems of the labels: placeholders, unlisted shared labels and stale entries. */
function labelIssues(
  records: readonly MetaRecord[],
  allowlist: Readonly<Record<string, AllowedLabel>>
): string[] {
  const placeholders = records
    .filter((record) => isPlaceholder(record.label))
    .map(
      (record) =>
        `${record.name}: label ${JSON.stringify(record.label)} is a placeholder. Write the label the icon is known by.`
    )
  const groups = groupBy(records, (record) => record.label)
  const joined = [...groups].flatMap(([label, group]) =>
    group.length < 2
      ? []
      : group
          .filter((name) => !allowlist[label]?.icons.includes(name))
          .map((name) =>
            joinedMessage(
              name,
              label,
              group.filter((other) => other !== name)
            )
          )
  )
  const entries = Object.entries(allowlist).flatMap(([label, entry]) =>
    // Stryker disable next-line ArrayDeclaration: any group of fewer than two icons reads as "no longer shared", so a one-element fallback gives the same message.
    entryIssues(label, entry, groups.get(label) ?? [])
  )
  return [...placeholders, ...joined, ...entries]
}

/** The problems of the use cases: an empty list, and a list another icon has too. */
function useCaseIssues(records: readonly MetaRecord[]): string[] {
  const empty = records
    .filter((record) => record.useCases.length === 0)
    .map((record) => `${record.name}: useCases is empty. List at least one use.`)
  const groups = groupBy(
    records.filter((record) => record.useCases.length > 0),
    (record) => JSON.stringify(record.useCases)
  )
  const same = [...groups.values()].flatMap((group) =>
    group.length < 2
      ? []
      : group.map(
          (name) =>
            `${name}: useCases are identical to those of ${group.filter((other) => other !== name).join(', ')}. Write use cases that fit this icon.`
        )
  )
  return [...empty, ...same]
}

/**
 * Compares the metadata of the icons with the rules, so a record that was overwritten or
 * copied fails: a label that is a placeholder, a label shared by icons the allowlist does not
 * list as a group, an entry whose group changed, has fewer than two icons or has no
 * justification, an empty `useCases` and a `useCases` list that another icon has too.
 *
 * @param records - The records of the icons the check covers.
 * @param allowlist - The groups that may share a label, by label.
 * @returns One message per problem.
 */
export function metaIssues(
  records: readonly MetaRecord[],
  allowlist: Readonly<Record<string, AllowedLabel>>
): string[] {
  return [...labelIssues(records, allowlist), ...useCaseIssues(records)]
}
