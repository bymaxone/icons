/**
 * Unit tests for the catalog search: folding, the edit distance, the ranking, the facets,
 * the suggestions for a search that finds nothing, the highlight, the address state and the
 * index the build writes.
 *
 * Layer: unit.
 * Goal: pin every weight of the ranking with real cases (an alias, a typo, a category, a
 * type, a Portuguese term with and without its accents) and the rules around them.
 * Mocks: none; the documents are built in the test.
 */

import {
  allowedEdits,
  editDistance,
  fold,
  highlight,
  mergeState,
  nearCategories,
  passes,
  readState,
  scoreDoc,
  search,
  searchIndex,
  suggestions,
  writeState
} from './site-search.ts'
import type { SearchDoc, SearchField } from './site-search.ts'
import type { Catalog, CatalogEntry } from './site.ts'

/** A document with the given texts, one type and one category. */
function doc(name: string, texts: [SearchField, string][], types = ['line']): SearchDoc {
  return {
    name,
    types,
    categories: ['actions'],
    texts: texts.map(([field, text]) => ({ field, text }))
  }
}

const NONE = { types: [], categories: [] }

describe('fold', () => {
  it('removes accents, lowers the case and turns every other run into one space', () => {
    // Scenario: a Portuguese term with accents and punctuation folds to plain words.
    expect(fold('  Configurações / Ícone—2x  ')).toBe('configuracoes icone 2x')
    expect(fold('arrow-up-right')).toBe('arrow up right')
    expect(fold('ÇÃO')).toBe('cao')
  })
})

describe('editDistance', () => {
  it('counts insertions, deletions and substitutions', () => {
    // Scenario: the classic pairs, within a generous limit.
    expect(editDistance('kitten', 'sitting', 5)).toBe(3)
    expect(editDistance('lixera', 'lixeira', 2)).toBe(1)
    expect(editDistance('lixeira', 'lixera', 2)).toBe(1)
    expect(editDistance('cat', 'cut', 2)).toBe(1)
    expect(editDistance('same', 'same', 2)).toBe(0)
  })

  it('counts a swap of two neighbours as one edit, wherever it falls', () => {
    // Scenario: transpositions at the start, in the middle and at the end of a word, and
    // where the swapped pair sits at the edge of the table.
    expect(editDistance('ab', 'ba', 3)).toBe(1)
    expect(editDistance('calnedar', 'calendar', 3)).toBe(1)
    expect(editDistance('ba', 'xab', 3)).toBe(2)
    expect(editDistance('xab', 'ba', 3)).toBe(2)
    expect(editDistance('abc', 'acb', 3)).toBe(1)
    // Only a swap whose letters both match counts; and a swap after inserted letters costs
    // those insertions plus one ("ba" to "xyab" is three, as substituting the b is).
    expect(editDistance('ab', 'bc', 3)).toBe(2)
    expect(editDistance('ba', 'xyab', 3)).toBe(3)
  })

  it('measures against an empty word as the length of the other', () => {
    // Scenario: one side empty, within the limit.
    expect(editDistance('', 'ab', 2)).toBe(2)
    expect(editDistance('ab', '', 2)).toBe(2)
    expect(editDistance('', '', 0)).toBe(0)
  })

  it('stops at the limit, plus one', () => {
    // Scenario: a length gap over the limit, a row whose best is over it, and a final
    // distance over it all answer limit + 1; a distance equal to the limit is kept.
    expect(editDistance('a', 'abcd', 2)).toBe(3)
    expect(editDistance('', 'abcd', 2)).toBe(3)
    expect(editDistance('abcd', 'wxyz', 1)).toBe(2)
    expect(editDistance('abcd', 'abzz', 2)).toBe(2)
    expect(editDistance('abcd', 'azzz', 2)).toBe(3)
    expect(editDistance('ab', 'ac', 1)).toBe(1)
    expect(editDistance('ab', 'ba', 0)).toBe(1)
  })
})

describe('allowedEdits', () => {
  it('allows none below four letters, one up to six and two from seven', () => {
    // Scenario: the boundaries of each band.
    expect([3, 4, 6, 7].map((n) => allowedEdits('x'.repeat(n)))).toStrictEqual([0, 1, 1, 2])
  })
})

describe('scoreDoc', () => {
  const trash = doc('trash', [
    ['name', 'trash'],
    ['label', 'delete'],
    ['alias', 'bin'],
    ['pt', 'lixeira'],
    ['pt', 'excluir item'],
    ['tag', 'remove'],
    ['category', 'actions actions'],
    ['type', 'line outline'],
    ['use', 'deletes a file']
  ])

  it('weighs a word by the field it matches, exactly and as a prefix', () => {
    // Scenario: one word against each field; an exact word scores more than a prefix of it.
    expect(scoreDoc(trash, 'tra')).toBe(80)
    expect(scoreDoc(trash, 'del')).toBe(60)
    expect(scoreDoc(trash, 'bi')).toBe(60)
    expect(scoreDoc(trash, 'lix')).toBe(60)
    expect(scoreDoc(trash, 'excluir')).toBe(70)
    expect(scoreDoc(trash, 'remove')).toBe(350)
    expect(scoreDoc(trash, 'rem')).toBe(45)
    expect(scoreDoc(trash, 'actions')).toBe(35)
    expect(scoreDoc(trash, 'act')).toBe(30)
    expect(scoreDoc(trash, 'outline')).toBe(30)
    expect(scoreDoc(trash, 'out')).toBe(25)
    expect(scoreDoc(trash, 'file')).toBe(20)
    expect(scoreDoc(trash, 'fil')).toBe(15)
  })

  it('adds a bonus when the whole query is one of the texts', () => {
    // Scenario: the name, the label, an alias and a Portuguese phrase equal to the query each
    // add their bonus; a whole type or use case adds nothing, so "a" scores as the prefix of
    // a category word (30) and the use case's words as use case words (20).
    expect(scoreDoc(trash, 'trash')).toBe(1100)
    expect(scoreDoc(trash, 'delete')).toBe(570)
    expect(scoreDoc(trash, 'bin')).toBe(570)
    expect(scoreDoc(trash, 'lixeira')).toBe(570)
    expect(scoreDoc(trash, 'excluir item')).toBe(640)
    expect(scoreDoc(trash, 'line outline')).toBe(60)
    expect(scoreDoc(trash, 'deletes a file')).toBe(70)
  })

  it('needs every word of the query, adding their best scores', () => {
    // Scenario: two words that both match add up (100 + 60); one that matches nothing sinks
    // the entry.
    expect(scoreDoc(trash, 'trash lix')).toBe(160)
    expect(scoreDoc(trash, 'trash nothing')).toBe(0)
  })

  it('accepts a misspelt word on the name, aliases, label, Portuguese terms and tags only', () => {
    // Scenario: one edit away scores 10, two edits away 5, and a misspelt category, type or
    // use case word does not match.
    expect(scoreDoc(trash, 'lixera')).toBe(10)
    expect(scoreDoc(trash, 'lixxeiira')).toBe(5)
    expect(scoreDoc(trash, 'remvoe')).toBe(10)
    expect(scoreDoc(trash, 'actoins')).toBe(0)
    expect(scoreDoc(trash, 'outlnie')).toBe(0)
    expect(scoreDoc(trash, 'deletse')).toBe(10)
  })

  it('does not stretch a short word to a misspelt match', () => {
    // Scenario: a three letter word one edit away from "bin" matches nothing.
    expect(scoreDoc(trash, 'bun')).toBe(0)
  })

  it('keeps the best of a prefix and a misspelt match on the same text', () => {
    // Scenario: "exclu" is a prefix of "excluir" (60) and also near "item"; the prefix wins,
    // and a later fuzzy candidate does not lower it.
    expect(scoreDoc(trash, 'exclu')).toBe(60)
    expect(scoreDoc(doc('x', [['pt', 'itemx exclux']]), 'exclu')).toBe(60)
  })
})

describe('passes', () => {
  const entry: SearchDoc = {
    name: 'home',
    types: ['line', 'filled'],
    categories: ['nav'],
    texts: []
  }

  it('lets an entry through open facets, and through picked ones it has', () => {
    // Scenario: no facet, a type it has, a category it is in, and both together.
    expect(passes(entry, NONE)).toBe(true)
    expect(passes(entry, { types: ['sm', 'filled'], categories: [] })).toBe(true)
    expect(passes(entry, { types: [], categories: ['x', 'nav'] })).toBe(true)
    expect(passes(entry, { types: ['filled'], categories: ['nav'] })).toBe(true)
  })

  it('stops an entry that lacks a picked type or category', () => {
    // Scenario: either facet alone excludes it.
    expect(passes(entry, { types: ['sm'], categories: [] })).toBe(false)
    expect(passes(entry, { types: [], categories: ['media'] })).toBe(false)
    expect(passes(entry, { types: ['sm'], categories: ['nav'] })).toBe(false)
    expect(passes(entry, { types: ['line'], categories: ['media'] })).toBe(false)
  })
})

describe('search', () => {
  const docs = [
    doc('upload', [
      ['name', 'upload'],
      ['tag', 'arrow up']
    ]),
    doc('arrow-up', [['name', 'arrow up']], ['line', 'filled']),
    doc('arrow-down', [['name', 'arrow down']]),
    doc('home', [['name', 'home']])
  ]

  it('lists every entry in the index order for an empty query', () => {
    // Scenario: a blank or punctuation-only query matches everything that passes the facets.
    expect(search(docs, '  ', NONE).map((hit) => hit.name)).toStrictEqual([
      'upload',
      'arrow-up',
      'arrow-down',
      'home'
    ])
    expect(search(docs, '--', { types: ['filled'], categories: [] })).toStrictEqual([
      { name: 'arrow-up', score: 1 }
    ])
  })

  it('ranks the exact name first, keeps ties in index order and drops what does not match', () => {
    // Scenario: "arrow up" is arrow-up's name (200 + 1000) and upload's tag (50 for "arrow",
    // 80 for "up" as the start of its name, 300 for the whole tag); arrow-down has no word
    // for "up", too short to be misspelt; "arrow" alone ties the two arrows, which keep their
    // order; home matches nothing.
    expect(search(docs, 'Arrow-Up', NONE)).toStrictEqual([
      { name: 'arrow-up', score: 1200 },
      { name: 'upload', score: 430 }
    ])
    expect(search(docs, 'arrow', NONE).map((hit) => hit.name)).toStrictEqual([
      'arrow-up',
      'arrow-down',
      'upload'
    ])
  })

  it('applies the facets before scoring', () => {
    // Scenario: only the filled entry is left.
    expect(search(docs, 'arrow', { types: ['filled'], categories: [] })).toStrictEqual([
      { name: 'arrow-up', score: 100 }
    ])
  })
})

describe('suggestions', () => {
  const docs = [
    doc('calendar', [
      ['name', 'calendar'],
      ['use', 'calender use'],
      ['tag', 'date']
    ]),
    doc('cart', [
      ['name', 'cart'],
      ['pt', 'carrinho']
    ]),
    doc('card', [
      ['alias', 'card'],
      ['label', 'cards']
    ])
  ]

  it('offers the nearest words of the searchable fields, nearest first then alphabetical', () => {
    // Scenario: "carx" is one edit from cart and card and two from cards; a use case word
    // ("calender") does not count, and the limit cuts the list. "date" is in the index, so it
    // is not offered back.
    expect(suggestions(docs, 'carx')).toStrictEqual(['card', 'cart', 'cards'])
    expect(suggestions(docs, 'carx', 2)).toStrictEqual(['card', 'cart'])
    expect(suggestions(docs, 'calnedar date')).toStrictEqual(['calendar'])
  })

  it('reaches one edit further than a search forgives', () => {
    // Scenario: a four letter word reaches two edits, not three ("dxyz" is three from date);
    // a seven letter word reaches three ("calxxxar" is three from calendar); a three letter
    // word reaches one ("crt" is one from cart, two from card).
    expect(suggestions(docs, 'dxyz')).toStrictEqual([])
    expect(suggestions(docs, 'calxxxar')).toStrictEqual(['calendar'])
    expect(suggestions(docs, 'crt')).toStrictEqual(['cart'])
  })

  it('offers nothing when no word is near, and never the word itself', () => {
    // Scenario: a far word, and the only word of an index, which is not offered back.
    expect(suggestions(docs, 'zzzzzzzz')).toStrictEqual([])
    expect(suggestions([doc('d', [['tag', 'date']])], 'date')).toStrictEqual([])
  })

  it('offers nothing for a query with no word', () => {
    // Scenario: facets alone left nothing, so the query is empty; one-letter words of the
    // index must not be offered as if one edit from it.
    const short = [
      doc('x', [
        ['name', 'x'],
        ['tag', 'a 2']
      ])
    ]
    expect(suggestions(short, '')).toStrictEqual([])
    expect(suggestions(short, ' - ')).toStrictEqual([])
  })
})

describe('nearCategories', () => {
  const categories = [
    { name: 'security', title: 'Security' },
    { name: 'places-devices', title: 'Places and devices' },
    { name: 'brands', title: 'Brands' }
  ]

  it('finds a category by a prefix or a misspelling of its name or title', () => {
    // Scenario: a prefix of a title word, a misspelt name word, and a word of no category.
    expect(nearCategories(categories, 'secur')).toStrictEqual(['security'])
    expect(nearCategories(categories, 'devises')).toStrictEqual(['places-devices'])
    expect(nearCategories(categories, 'sacurety')).toStrictEqual(['security'])
    expect(nearCategories(categories, 'brnads zzzz')).toStrictEqual(['brands'])
    expect(nearCategories(categories, 'kitchen')).toStrictEqual([])
  })

  it('finds nothing for a query with no word', () => {
    // Scenario: punctuation folds to no word, which must not match every category.
    expect(nearCategories(categories, '--')).toStrictEqual([])
  })
})

describe('highlight', () => {
  it('marks every occurrence of every query word, keeping the letters of the text', () => {
    // Scenario: two words in a dashed name, an accent-insensitive match, and a repeat.
    expect(highlight('arrow-up-right', 'arrow up')).toStrictEqual([
      { text: 'arrow', hit: true },
      { text: '-', hit: false },
      { text: 'up', hit: true },
      { text: '-right', hit: false }
    ])
    expect(highlight('Configurações', 'acoes')).toStrictEqual([
      { text: 'Configur', hit: false },
      { text: 'ações', hit: true }
    ])
    expect(highlight('aa-aa', 'aa')).toStrictEqual([
      { text: 'aa', hit: true },
      { text: '-', hit: false },
      { text: 'aa', hit: true }
    ])
  })

  it('returns one unmarked run when nothing occurs or the query is empty', () => {
    // Scenario: no match, and an empty query.
    expect(highlight('home', 'zz')).toStrictEqual([{ text: 'home', hit: false }])
    expect(highlight('home', '')).toStrictEqual([{ text: 'home', hit: false }])
  })
})

describe('readState and writeState', () => {
  it('reads the query and the comma-separated facets, empty when absent', () => {
    // Scenario: a full address, one with empty list items, and a bare one.
    expect(readState('?q=arrow%20up&type=filled&cat=actions')).toStrictEqual({
      q: 'arrow up',
      types: ['filled'],
      categories: ['actions']
    })
    expect(readState('?type=,line,&cat=')).toStrictEqual({ q: '', types: ['line'], categories: [] })
    expect(readState('')).toStrictEqual({ q: '', types: [], categories: [] })
  })

  it('keeps the first known type, as the Type control picks one', () => {
    // Scenario: a hand-edited address with two types keeps the first; an unknown one is
    // skipped for the next known one, or leaves no type.
    expect(readState('?type=filled,brand').types).toStrictEqual(['filled'])
    expect(readState('?type=bogus,sm').types).toStrictEqual(['sm'])
    expect(readState('?type=bogus').types).toStrictEqual([])
  })

  it('reads an older variant address as its type, unless a type is given', () => {
    // Scenario: ?variant=filled and ?variant=sm become the type; ?variant=line (every
    // entry, drawn in line) and an unknown variant name no type; an explicit type wins.
    expect(readState('?variant=filled').types).toStrictEqual(['filled'])
    expect(readState('?variant=sm&q=a').types).toStrictEqual(['sm'])
    expect(readState('?variant=line').types).toStrictEqual([])
    expect(readState('?variant=bold').types).toStrictEqual([])
    expect(readState('?variant=filled&type=brand').types).toStrictEqual(['brand'])
  })

  it('writes only what is set, and nothing for an empty state', () => {
    // Scenario: each part alone, all together, and none.
    expect(writeState({ q: 'home', types: [], categories: [] })).toBe('?q=home')
    expect(writeState({ q: '', types: ['line', 'sm'], categories: [] })).toBe('?type=line%2Csm')
    expect(writeState({ q: '', types: [], categories: ['actions'] })).toBe('?cat=actions')
    expect(writeState({ q: 'a b', types: ['line'], categories: ['x', 'y'] })).toBe(
      '?q=a+b&type=line&cat=x%2Cy'
    )
    expect(writeState({ q: '', types: [], categories: [] })).toBe('')
  })

  it('keeps every parameter of the page the search does not own', () => {
    // Scenario: a parameter of the page survives a search; the search's own parameters are
    // replaced, or removed when empty, and the older variant is dropped once read; nothing
    // left gives an empty string.
    expect(
      mergeState('?ref=docs&variant=filled&q=old&cat=x', { q: 'home', types: [], categories: [] })
    ).toBe('?ref=docs&q=home')
    expect(mergeState('?type=line', { q: '', types: [], categories: ['a'] })).toBe('?cat=a')
    expect(mergeState('?q=a', { q: '', types: [], categories: [] })).toBe('')
  })
})

/** A catalog entry with the fields the index reads. */
function entry(name: string, extra: Partial<CatalogEntry> = {}): CatalogEntry {
  return {
    name,
    kind: 'icon',
    title: name,
    label: `${name} label`,
    drawings: [{ variant: 'line', component: 'X' }],
    categories: ['actions'],
    tags: [],
    aliases: [],
    useCases: [],
    since: '1.0.0',
    ...extra
  }
}

describe('searchIndex', () => {
  it('folds every text of an entry into its document, with the type words of its drawings', () => {
    // Scenario: one entry with every kind of text, filled and a 16 px master, in two
    // categories, one of which the catalog does not list.
    const catalog: Catalog = {
      entries: [
        entry('arrow-up', {
          label: 'Arrow Up',
          drawings: [
            { variant: 'line', component: 'A' },
            { variant: 'filled', component: 'B' },
            { variant: 'sm', component: 'C' },
            { variant: 'brand', component: 'D' }
          ],
          categories: ['actions', 'orphan'],
          tags: ['Go Up'],
          aliases: [{ name: 'up-arrow', deprecated: false }],
          useCases: ['Moves up']
        })
      ],
      categories: [{ name: 'actions', title: 'Actions & Status' }]
    }
    expect(
      searchIndex(
        catalog,
        { 'arrow-up': ['Seta para cima'] },
        { actions: 'Ações e Estado' }
      )[0]?.texts.find((text) => text.field === 'category')
    ).toStrictEqual({ field: 'category', text: 'actions actions status acoes e estado' })
    expect(searchIndex(catalog, { 'arrow-up': ['Seta para cima'] })).toStrictEqual([
      {
        name: 'arrow-up',
        types: ['line', 'filled', 'sm', 'brand'],
        categories: ['actions', 'orphan'],
        texts: [
          { field: 'name', text: 'arrow up' },
          { field: 'label', text: 'arrow up' },
          { field: 'alias', text: 'up arrow' },
          { field: 'pt', text: 'seta para cima' },
          { field: 'tag', text: 'go up' },
          { field: 'category', text: 'actions actions status' },
          { field: 'category', text: 'orphan' },
          { field: 'type', text: 'line outline' },
          { field: 'type', text: 'filled solid' },
          { field: 'type', text: 'sm 16 px master' },
          { field: 'type', text: 'brand logo' },
          { field: 'use', text: 'moves up' }
        ]
      }
    ])
  })

  it('refuses a catalog with an entry that has no Portuguese term', () => {
    // Scenario: one entry absent from the terms and one with an empty list are both named.
    const catalog: Catalog = {
      entries: [entry('home'), entry('trash'), entry('user')],
      categories: []
    }
    expect(() => searchIndex(catalog, { home: ['início'], user: [] })).toThrow(
      'No Portuguese search term for: trash, user'
    )
  })
})
