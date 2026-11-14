/**
 * @fileoverview The metadata check: it catches records that were overwritten or copied
 * instead of written. Two icons may share a label only through the allowlist, each group with
 * its written justification; an icon's use cases are never empty and never the same list as
 * another icon's; no label is a placeholder; and no tag names a type of the catalogue. Brand marks have no label or use cases and
 * are out of scope.
 * @layer Pipeline
 */

import { britishWords } from './british-spellings.ts'
import type { IconSet } from './icon-set.ts'
import { fold } from './site-search.ts'

/** The labels that stand for "not written yet", compared in lower case and trimmed. A blank label is one too. */
export const PLACEHOLDER_LABELS: readonly string[] = ['todo', 'icon', 'untitled', 'label']

/**
 * The words of a tag that name a type of the catalogue, which the search reads as the type
 * filter: a tag holding one makes the search for that type find an icon that has no such
 * drawing. Matched as whole words in the tag as the search folds it: accents removed, lower
 * case and every run of other characters one space, so `16-px` and `Filled!` are caught too.
 */
export const TYPE_WORDS: readonly string[] = ['filled', 'sm', '16 px', '16px']

const TYPE_WORD = /(?:^| )(filled|sm|16 ?px)(?: |$)/

/** Where the allowlist is named in the messages, from the repository root. */
export const META_ALLOWLIST = 'scripts/meta-allowlist.json'

/** Where the review manifest of the renamed icons is named in the messages. */
export const RENAMES_REVIEWED = 'scripts/renames-reviewed.json'

/** The part of an icon's metadata the check reads. */
export interface MetaRecord {
  readonly name: string
  /** Whether the icon holds a deprecated alias whose reason says it was renamed to this icon. */
  readonly renamed: boolean
  readonly label: string
  readonly tags: readonly string[]
  readonly useCases: readonly string[]
}

/** The renamed icons whose categories were reviewed against the drawing, each with the verdict. */
export type ReviewedRenames = Readonly<Record<string, string>>

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
    renamed: (meta.aliases ?? []).some(
      (alias) => alias.deprecated && alias.deprecationReason?.startsWith('Renamed to') === true
    ),
    label: meta.label,
    tags: meta.tags,
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

/** The tags that hold a word naming a type of the catalogue, one message for each. */
function tagIssues(records: readonly MetaRecord[]): string[] {
  return records.flatMap(({ name, tags }) =>
    tags.flatMap((tag) => {
      const word = TYPE_WORD.exec(fold(tag))?.[1]
      return word === undefined
        ? []
        : [
            `${name}: tag ${JSON.stringify(tag)} holds the type word "${word}", which the search reads as a filter. Write the tag without it.`
          ]
    })
  )
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
 * The problems of the rename review: an icon that was renamed keeps the categories of its old
 * name until someone checks them against the drawing, so it has to be listed with the verdict;
 * an entry for an icon that is not renamed, or with no verdict, is stale.
 */
function renameIssues(records: readonly MetaRecord[], reviewed: ReviewedRenames): string[] {
  const renamed = new Set(records.filter((record) => record.renamed).map(({ name }) => name))
  const unreviewed = [...renamed]
    .filter((name) => !Object.hasOwn(reviewed, name))
    .map(
      (name) =>
        `${name}: renamed, but its categories were not reviewed against the drawing. Check them, then list the icon in ${RENAMES_REVIEWED} with the verdict.`
    )
  const stale = Object.entries(reviewed).flatMap(([name, verdict]) => [
    ...(renamed.has(name)
      ? []
      : [`${name}: listed in ${RENAMES_REVIEWED} but not a renamed icon. Remove its entry.`]),
    ...(verdict.trim() === ''
      ? [`${name}: listed in ${RENAMES_REVIEWED} without a verdict. Write what was decided.`]
      : [])
  ])
  return [...unreviewed, ...stale]
}

/** The label, tags and use cases that hold a British spelling, one message for each word. */
function spellingIssues(records: readonly MetaRecord[]): string[] {
  return records.flatMap(({ name, label, tags, useCases }) =>
    [
      ['label', [label]],
      ['tag', tags],
      ['use case', useCases]
    ].flatMap(([field, texts]) =>
      (texts as readonly string[]).flatMap((text) =>
        britishWords(text).map(
          ({ british, american }) =>
            `${name}: ${field} ${JSON.stringify(text)}: '${british}' is British; write '${american}'.`
        )
      )
    )
  )
}

/**
 * Compares the metadata of the icons with the rules, so a record that was overwritten or
 * copied fails: a label that is a placeholder, a label shared by icons the allowlist does not
 * list as a group, an entry whose group changed, has fewer than two icons or has no
 * justification, an empty `useCases`, a `useCases` list that another icon has too and a tag that
 * holds a type word, a renamed icon whose categories were not reviewed, and a British spelling in
 * a label, tag or use case.
 *
 * @param records - The records of the icons the check covers.
 * @param allowlist - The groups that may share a label, by label.
 * @param reviewed - The renamed icons whose categories were reviewed, with the verdict.
 * @returns One message per problem.
 */
export function metaIssues(
  records: readonly MetaRecord[],
  allowlist: Readonly<Record<string, AllowedLabel>>,
  reviewed: ReviewedRenames = {}
): string[] {
  return [
    ...labelIssues(records, allowlist),
    ...useCaseIssues(records),
    ...tagIssues(records),
    ...renameIssues(records, reviewed),
    ...spellingIssues(records)
  ]
}
