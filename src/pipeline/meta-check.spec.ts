/**
 * Unit tests for the metadata check.
 *
 * Layer: unit, with synthetic records and one small in-memory icon set.
 * Goal: pin the records read, each rule of `metaIssues` and the message of each, so a record
 * that was overwritten or copied fails and a justified group passes.
 * Mocks: none.
 */

import { brandMeta, drawing, iconMeta, sources, CIRCLE } from './__tests__/support.ts'
import { lintSources } from './lint.ts'
import {
  META_ALLOWLIST,
  PLACEHOLDER_LABELS,
  RENAMES_REVIEWED,
  TYPE_WORDS,
  metaIssues,
  metaRecords
} from './meta-check.ts'
import type { AllowedLabel, MetaRecord } from './meta-check.ts'

/** A record with distinct use cases and no tags unless told otherwise. */
const record = (
  name: string,
  label: string,
  useCases?: string[],
  tags: string[] = [],
  renamed = false
): MetaRecord => ({
  name,
  renamed,
  label,
  tags,
  useCases: useCases ?? [`Use of ${name}`]
})

const group = (icons: string[], why = 'the same action drawn two ways'): AllowedLabel => ({
  icons,
  why
})

describe('PLACEHOLDER_LABELS', () => {
  it('lists the words that stand for a label not written yet', () => {
    /** Scenario: the constant is the list the check and its callers share. */
    expect(PLACEHOLDER_LABELS).toStrictEqual(['todo', 'icon', 'untitled', 'label'])
  })
})

describe('TYPE_WORDS', () => {
  it('lists the words of a tag that name a type of the catalogue', () => {
    /** Scenario: the constant is the list the check and its callers share. */
    expect(TYPE_WORDS).toStrictEqual(['filled', 'sm', '16 px', '16px'])
  })
})

describe('metaRecords', () => {
  it('reads the label and use cases of each icon and leaves brand marks out', () => {
    /** Scenario: a brand has no label or use cases, so it is not a record. */
    const { set, issues } = lintSources(
      sources({
        line: { 'ring.svg': drawing('line', CIRCLE) },
        brands: { 'acme.svg': drawing('brands', '<path d="M4 4h16v16H4z"/>') },
        meta: { 'ring.json': iconMeta(), 'acme.json': brandMeta() }
      })
    )
    expect(issues).toEqual([])
    expect(set.brands).toHaveLength(1)
    expect(metaRecords(set)).toStrictEqual([
      {
        name: 'ring',
        renamed: false,
        label: 'Ring',
        tags: ['circle'],
        useCases: ['First use', 'Second use']
      }
    ])
  })
})

describe('metaIssues', () => {
  it('passes records that each have their own label and use cases', () => {
    /** Scenario: nothing is shared and the allowlist is empty. */
    expect(metaIssues([record('a', 'Alpha'), record('b', 'Beta')], {})).toStrictEqual([])
  })

  it('passes a group the allowlist lists, in any order', () => {
    /** Scenario: two icons share "Add" and the entry lists them in the other order. */
    const records = [record('plus', 'Add'), record('plus-circle', 'Add')]
    expect(metaIssues(records, { Add: group(['plus-circle', 'plus']) })).toStrictEqual([])
  })

  it('fails every icon of an unlisted shared label, naming the others', () => {
    /** Scenario: three icons share "Add" and nothing is listed. */
    const records = [record('a', 'Add'), record('b', 'Add'), record('c', 'Add')]
    expect(metaIssues(records, {})).toStrictEqual([
      'a: label "Add" is shared with b, c. Give it its own label, or list the group in scripts/meta-allowlist.json with a justification.',
      'b: label "Add" is shared with a, c. Give it its own label, or list the group in scripts/meta-allowlist.json with a justification.',
      'c: label "Add" is shared with a, b. Give it its own label, or list the group in scripts/meta-allowlist.json with a justification.'
    ])
  })

  it('fails only the icon that joins a listed group', () => {
    /** Scenario: a new icon carries the label of `plus`, which is listed with one other. */
    const records = [
      record('motorbike', 'Add'),
      record('plus', 'Add'),
      record('plus-circle', 'Add')
    ]
    expect(metaIssues(records, { Add: group(['plus', 'plus-circle']) })).toStrictEqual([
      'motorbike: label "Add" is shared with plus, plus-circle. Give it its own label, or list the group in scripts/meta-allowlist.json with a justification.'
    ])
  })

  it('names the allowlist file the messages point to', () => {
    /** Scenario: the constant is the path the messages and the docs name. */
    expect(META_ALLOWLIST).toBe('scripts/meta-allowlist.json')
  })

  it('fails an entry whose label no icon shares any more', () => {
    /** Scenario: the group dissolved, so only one icon holds the label. */
    const records = [record('plus', 'Add'), record('plus-circle', 'Add more')]
    expect(metaIssues(records, { Add: group(['plus', 'plus-circle']) })).toStrictEqual([
      'label "Add": on the allowlist but no longer shared. Remove its entry.'
    ])
  })

  it('fails an entry whose label no icon has', () => {
    /** Scenario: the label was renamed everywhere. */
    expect(metaIssues([record('a', 'Alpha')], { Gone: group(['a', 'b']) })).toStrictEqual([
      'label "Gone": on the allowlist but no longer shared. Remove its entry.'
    ])
  })

  it('fails a listed icon that no longer has the label', () => {
    /** Scenario: `plus-circle` was renamed while `plus` and `plus-square` still share "Add". */
    const records = [
      record('plus', 'Add'),
      record('plus-square', 'Add'),
      record('plus-circle', 'Add circle')
    ]
    expect(
      metaIssues(records, { Add: group(['plus', 'plus-square', 'plus-circle']) })
    ).toStrictEqual([
      'label "Add": plus-circle is on the allowlist but no longer has that label. Update the entry.'
    ])
  })

  it('fails an entry with fewer than two icons', () => {
    /** Scenario: the entry lists one icon of a pair that shares the label. */
    const records = [record('a', 'Add'), record('b', 'Add')]
    expect(metaIssues(records, { Add: group(['a']) })).toStrictEqual([
      'b: label "Add" is shared with a. Give it its own label, or list the group in scripts/meta-allowlist.json with a justification.',
      'label "Add": on the allowlist with fewer than two icons. List the group.'
    ])
  })

  it.each(['', '   '])('fails an entry with the justification %j', (why) => {
    /** Scenario: a blank justification is none. */
    const records = [record('a', 'Add'), record('b', 'Add')]
    expect(metaIssues(records, { Add: group(['a', 'b'], why) })).toStrictEqual([
      'label "Add": on the allowlist without a justification.'
    ])
  })

  it.each(['TODO', 'todo', 'Icon', 'Untitled', 'Label', ' label ', '', '   '])(
    'fails the placeholder label %j',
    (label) => {
      /** Scenario: a placeholder in any case, padded or blank is not a label. */
      expect(metaIssues([record('a', label)], {})).toStrictEqual([
        `a: label ${JSON.stringify(label)} is a placeholder. Write the label the icon is known by.`
      ])
    }
  )

  it('accepts a label that only contains a placeholder word', () => {
    /** Scenario: "Label printer" is a real label. */
    expect(metaIssues([record('a', 'Label printer')], {})).toStrictEqual([])
  })

  it('fails an empty use case list', () => {
    /** Scenario: the use cases were not written. */
    expect(metaIssues([record('a', 'Alpha', [])], {})).toStrictEqual([
      'a: useCases is empty. List at least one use.'
    ])
  })

  it('fails use cases that another icon has too, naming the others', () => {
    /** Scenario: `a` and `b` carry the same list; `c` has the same uses in another order. */
    const records = [
      record('a', 'Alpha', ['One', 'Two']),
      record('b', 'Beta', ['One', 'Two']),
      record('c', 'Gamma', ['Two', 'One'])
    ]
    expect(metaIssues(records, {})).toStrictEqual([
      'a: useCases are identical to those of b. Write use cases that fit this icon.',
      'b: useCases are identical to those of a. Write use cases that fit this icon.'
    ])
  })

  it('names every other icon that has the same use cases, comma separated', () => {
    /** Scenario: three icons carry one list, so each message names the other two. */
    const records = ['a', 'b', 'c'].map((name) => record(name, name.toUpperCase(), ['One', 'Two']))
    expect(metaIssues(records, {})[0]).toBe(
      'a: useCases are identical to those of b, c. Write use cases that fit this icon.'
    )
  })

  it('does not call two empty lists identical', () => {
    /** Scenario: each is reported as empty, once. */
    const records = [record('a', 'Alpha', []), record('b', 'Beta', [])]
    expect(metaIssues(records, {})).toStrictEqual([
      'a: useCases is empty. List at least one use.',
      'b: useCases is empty. List at least one use.'
    ])
  })

  it('reports labels before use cases', () => {
    /** Scenario: the order of the groups of messages is stable. */
    const records = [record('a', 'TODO', []), record('b', 'Beta')]
    expect(metaIssues(records, {})).toStrictEqual([
      'a: label "TODO" is a placeholder. Write the label the icon is known by.',
      'a: useCases is empty. List at least one use.'
    ])
  })
})

describe('metaIssues on tags', () => {
  it('fails a tag that holds the word filled on an icon with no filled drawing', () => {
    /** Scenario: the tag "filled line" would make the search for the type "filled" find this icon. */
    const records = [record('area', 'Area', undefined, ['area', 'filled line'])]
    expect(metaIssues(records, {})).toStrictEqual([
      'area: tag "filled line" holds the type word "filled", which the search reads as a filter. Write the tag without it.'
    ])
  })

  it.each([
    ['sm', 'sm'],
    ['SM size', 'sm'],
    ['16 px', '16 px'],
    ['at 16px', '16px'],
    ['Filled', 'filled'],
    ['a-filled-b', 'filled'],
    ['16-px', '16 px'],
    ['16_px', '16 px'],
    ['16  px', '16 px'],
    ['sm.', 'sm'],
    ['Filled!', 'filled'],
    ['Sm\u0301', 'sm']
  ])('fails the tag %j for the type word %j', (tag, word) => {
    /** Scenario: each type word is caught as a whole word, in any case and next to a hyphen or a space. */
    expect(metaIssues([record('a', 'Alpha', undefined, [tag])], {})).toStrictEqual([
      `a: tag ${JSON.stringify(tag)} holds the type word "${word}", which the search reads as a filter. Write the tag without it.`
    ])
  })

  it.each([
    'smart',
    'filler',
    'small',
    'sm4',
    '16 pixels',
    'unfilled',
    'mismatch',
    'circle',
    'smé'
  ])('passes the tag %j that only contains the letters of a type word', (tag) => {
    /** Scenario: a word that merely contains the letters is not a type word. */
    expect(metaIssues([record('a', 'Alpha', undefined, [tag])], {})).toStrictEqual([])
  })

  it('reports one message for each tag that holds a type word', () => {
    /** Scenario: two tags of two icons hold a type word; the others are clean. */
    const records = [
      record('a', 'Alpha', undefined, ['sm', 'round']),
      record('b', 'Beta', undefined, ['filled', 'sm'])
    ]
    expect(metaIssues(records, {})).toHaveLength(3)
  })

  it('leaves the use cases alone, which describe the filled variant of an icon', () => {
    /** Scenario: "Filled: the selected file" is a use case of the filled drawing and is not a tag. */
    const records = [record('file', 'File', ['Filled: the selected file', 'Opens a file'])]
    expect(metaIssues(records, {})).toStrictEqual([])
  })
})

describe('metaRecords on renames', () => {
  it.each([
    ['a deprecated alias whose reason says renamed', true, 'Renamed to ring, the object.', true],
    ['a deprecated alias with another reason', true, 'Replaced by a new design.', false],
    ['a deprecated alias with no reason', true, undefined, false],
    ['an alias that is not deprecated', false, undefined, false]
  ])('reads %s', (_label, deprecated, reason, renamed) => {
    /** Scenario: only a deprecated alias whose reason starts with "Renamed to" marks a rename. */
    const alias = deprecated
      ? {
          name: 'old',
          deprecated,
          toBeRemovedInVersion: '2.0.0',
          ...(reason === undefined ? {} : { deprecationReason: reason })
        }
      : { name: 'old', deprecated }
    const { set } = lintSources(
      sources({
        line: { 'ring.svg': drawing('line', CIRCLE) },
        meta: { 'ring.json': iconMeta({ aliases: [alias] }) }
      })
    )
    expect(metaRecords(set).map((entry) => entry.renamed)).toStrictEqual([renamed])
  })

  it('reads an icon with no aliases as not renamed', () => {
    /** Scenario: the `aliases` field is optional. */
    const { set } = lintSources(
      sources({
        line: { 'ring.svg': drawing('line', CIRCLE) },
        meta: { 'ring.json': iconMeta() }
      })
    )
    expect(metaRecords(set).map((entry) => entry.renamed)).toStrictEqual([false])
  })
})

describe('metaIssues on renames', () => {
  const renamed = record('stairs', 'Stairs', undefined, [], true)

  it('fails a renamed icon whose categories were not reviewed, and says where to record it', () => {
    /** Scenario: the icon is renamed and the manifest is empty. */
    expect(metaIssues([renamed], {}, {})).toStrictEqual([
      `stairs: renamed, but its categories were not reviewed against the drawing. Check them, then list the icon in ${RENAMES_REVIEWED} with the verdict.`
    ])
  })

  it('passes a renamed icon the manifest lists with a verdict', () => {
    /** Scenario: reviewed. */
    expect(metaIssues([renamed], {}, { stairs: 'household, commerce' })).toStrictEqual([])
  })

  it('fails an entry for an icon that is not renamed, or that no longer exists', () => {
    /** Scenario: the manifest lists `ring` (never renamed) and `gone` (not in the set). */
    expect(metaIssues([record('ring', 'Ring')], {}, { ring: 'fine', gone: 'fine' })).toStrictEqual([
      `ring: listed in ${RENAMES_REVIEWED} but not a renamed icon. Remove its entry.`,
      `gone: listed in ${RENAMES_REVIEWED} but not a renamed icon. Remove its entry.`
    ])
  })

  it('fails an entry with a blank verdict', () => {
    /** Scenario: the icon is listed but nothing was decided. */
    expect(metaIssues([renamed], {}, { stairs: '  ' })).toStrictEqual([
      `stairs: listed in ${RENAMES_REVIEWED} without a verdict. Write what was decided.`
    ])
  })
})

describe('metaIssues on spelling', () => {
  it('names the field, the text and the American form for a label, a tag and a use case', () => {
    /** Scenario: one British word in each field is reported with the exact message. */
    expect(
      metaIssues([record('a', 'Colour wheel', ['Marks a favourite'], ['grey'])], {})
    ).toStrictEqual([
      `a: label "Colour wheel": 'colour' is British; write 'color'.`,
      `a: tag "grey": 'grey' is British; write 'gray'.`,
      `a: use case "Marks a favourite": 'favourite' is British; write 'favorite'.`
    ])
  })

  it('reports each British word of a text', () => {
    /** Scenario: two words in one use case give two messages. */
    expect(metaIssues([record('a', 'Alpha', ['Colour and centre'])], {})).toHaveLength(2)
  })

  it('passes American text', () => {
    /** Scenario: the American spellings raise nothing. */
    expect(
      metaIssues([record('a', 'Color wheel', ['Marks a favorite'], ['gray'])], {})
    ).toStrictEqual([])
  })
})
