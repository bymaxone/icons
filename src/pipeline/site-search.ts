/**
 * @fileoverview The catalog's search: the index the build writes, the ranking the browser
 * runs over it, the facets, the suggestions for a search that finds nothing, the highlight
 * of the matched words and the search state kept in the address. Every comparison runs on
 * folded text: lower case, accents removed, every run of other characters one space, so
 * "configuracoes" finds "configurações" and "arrow up" finds `arrow-up`.
 * @layer Pipeline
 */

import type { Variant } from './naming.ts'
import type { Catalog, CatalogEntry } from './site.ts'

/** What a piece of an entry's text is, which sets how much a match on it weighs. */
export type SearchField = 'name' | 'alias' | 'label' | 'pt' | 'tag' | 'category' | 'type' | 'use'

/** One searchable text of an entry, already folded. */
export interface SearchText {
  readonly field: SearchField
  readonly text: string
}

/** An entry as the search sees it: its texts, and the types and categories it filters by. */
export interface SearchDoc {
  readonly name: string
  /** The drawings it has: `line`, `filled`, `sm` or `brand`. */
  readonly types: readonly string[]
  readonly categories: readonly string[]
  readonly texts: readonly SearchText[]
}

/** The facets a reader picked; an empty list leaves that facet open. */
export interface SearchFilters {
  readonly types: readonly string[]
  readonly categories: readonly string[]
}

/** A match: the entry's name and how well it matched. */
export interface SearchHit {
  readonly name: string
  readonly score: number
}

/** A run of a displayed text, marked when it is part of a matched word. */
export interface HighlightRun {
  readonly text: string
  readonly hit: boolean
}

/** The search state the address carries: `?q=&type=&cat=`. */
export interface SearchState extends SearchFilters {
  readonly q: string
}

/** What a word of the query scores on each field, exactly and as the start of a word. */
const WEIGHT: Readonly<Record<SearchField, readonly [exact: number, prefix: number]>> = {
  name: [100, 80],
  alias: [70, 60],
  label: [70, 60],
  pt: [70, 60],
  tag: [50, 45],
  category: [35, 30],
  type: [30, 25],
  use: [20, 15]
}

/** What the whole query scores when it equals one text of the field outright. */
const WHOLE: Readonly<Partial<Record<SearchField, number>>> = {
  name: 1000,
  alias: 500,
  label: 500,
  pt: 500,
  tag: 300
}

/** The fields a misspelt word is compared against. */
const FUZZY_FIELDS: ReadonlySet<SearchField> = new Set(['name', 'alias', 'label', 'pt', 'tag'])

/** The type words a reader can search for, by the drawing they name. */
const TYPE_WORDS: Readonly<Record<Variant, string>> = {
  line: 'line outline',
  filled: 'filled solid',
  sm: 'sm 16 px master',
  brand: 'brand logo',
  flag: 'country flag'
}

/**
 * Folds a text for comparison: accents removed, lower case, and every run of characters
 * other than a letter or a digit written as one space, trimmed.
 *
 * @param text - Any text.
 * @returns The folded text.
 */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * The edit distance between two words, counting a swap of two neighbours as one edit, or
 * `limit + 1` as soon as it is certain to exceed the limit.
 *
 * @param a - A folded word.
 * @param b - Another folded word.
 * @param limit - The most edits that matter.
 * @returns The distance, at most `limit + 1`.
 */
export function editDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1
  if (a === '' || b === '') return Math.max(a.length, b.length)
  // Row i holds the distances from a's first i letters to b's first 1 to n letters. Row 0
  // and column 0 are not stored: a read off a stored row falls back to them (j, and i).
  let before: number[] = []
  let previous: number[] = []
  let value = 0
  for (let i = 1; i <= a.length; i++) {
    const current: number[] = []
    for (let j = 0; j < b.length; j++) {
      const up = previous[j] ?? j + 1
      const left = current[j - 1] ?? i
      const diagonal = previous[j - 1] ?? (j === 0 ? i - 1 : j)
      value = Math.min(up + 1, left + 1, diagonal + (a[i - 1] === b[j] ? 0 : 1))
      if (a[i - 1] === b[j - 1] && a[i - 2] === b[j]) {
        // Stryker disable next-line ArithmeticOperator: on row 2, a swap after j - 1 insertions ties keeping the a and substituting the b, so a larger fallback never changes the result
        value = Math.min(value, (before[j - 2] ?? (j === 1 ? i - 2 : j - 1)) + 1)
      }
      current.push(value)
    }
    // Stryker disable next-line ConditionalExpression: a shortcut only; past it, the final clamp to limit + 1 gives the same answer
    if (Math.min(...current) > limit) return limit + 1
    before = previous
    previous = current
  }
  return Math.min(value, limit + 1)
}

/** How many edits a query word may be from a word it matches: none below four letters. */
export function allowedEdits(word: string): number {
  if (word.length >= 7) return 2
  return word.length >= 4 ? 1 : 0
}

/** The best a single word of the query scores against one text. */
function wordScore(word: string, field: SearchField, text: string): number {
  const [exact, prefix] = WEIGHT[field]
  let best = 0
  for (const candidate of text.split(' ')) {
    if (candidate === word) return exact
    if (candidate.startsWith(word)) best = Math.max(best, prefix)
    else if (FUZZY_FIELDS.has(field)) {
      const limit = allowedEdits(word)
      const edits = editDistance(word, candidate, limit)
      // A misspelt word scores below any prefix: 10 one edit away, 5 two edits away.
      if (edits <= limit) best = Math.max(best, edits === 1 ? 10 : 5)
    }
  }
  return best
}

/**
 * How well an entry matches a query: every word of the query must match a word of the
 * entry, and the score adds up each word's best match, plus a bonus when the whole query
 * equals one of the entry's texts.
 *
 * @param doc - The entry.
 * @param query - The folded query.
 * @returns The score, or 0 when a word of the query matches nothing.
 */
export function scoreDoc(doc: SearchDoc, query: string): number {
  let total = 0
  for (const word of query.split(' ')) {
    const best = Math.max(...doc.texts.map(({ field, text }) => wordScore(word, field, text)))
    if (best === 0) return 0
    total += best
  }
  const whole = doc.texts.map(({ field, text }) => (text === query ? (WHOLE[field] ?? 0) : 0))
  return total + Math.max(...whole)
}

/** Whether an entry has one of the picked types and is in one of the picked categories. */
export function passes(doc: SearchDoc, filters: SearchFilters): boolean {
  const typed = filters.types.length === 0 || filters.types.some((t) => doc.types.includes(t))
  const filed =
    filters.categories.length === 0 || filters.categories.some((c) => doc.categories.includes(c))
  return typed && filed
}

/**
 * Searches the index. An empty query matches every entry that passes the facets, in the
 * index's order; otherwise the matches come best first, ties in the index's order.
 *
 * @param docs - The index.
 * @param query - What the reader typed.
 * @param filters - The picked facets.
 * @returns The matching entries.
 */
export function search(
  docs: readonly SearchDoc[],
  query: string,
  filters: SearchFilters
): SearchHit[] {
  const folded = fold(query)
  const hits: SearchHit[] = []
  for (const doc of docs) {
    if (!passes(doc, filters)) continue
    const score = folded === '' ? 1 : scoreDoc(doc, folded)
    if (score > 0) hits.push({ name: doc.name, score })
  }
  return hits.sort((a, b) => b.score - a.score)
}

/**
 * The words of the index closest to each word of a query that found nothing: a reader's
 * "did you mean". Words of the name, aliases, label, Portuguese terms and tags count, up to
 * one edit more than a search forgives, so a short word is not answered with a far one.
 *
 * @param docs - The index.
 * @param query - What the reader typed.
 * @param limit - How many words to offer.
 * @returns At most `limit` words, nearest first, then in alphabetical order.
 */
export function suggestions(docs: readonly SearchDoc[], query: string, limit = 3): string[] {
  const words = new Set<string>()
  for (const doc of docs) {
    for (const { field, text } of doc.texts) {
      if (FUZZY_FIELDS.has(field)) for (const word of text.split(' ')) words.add(word)
    }
  }
  const scored: [string, number][] = []
  for (const word of fold(query).split(' ').filter(Boolean)) {
    const limit = allowedEdits(word) + 1
    for (const candidate of words) {
      const edits = editDistance(word, candidate, limit)
      if (edits <= limit && candidate !== word) scored.push([candidate, edits])
    }
  }
  scored.sort(([a, x], [b, y]) => x - y || a.localeCompare(b))
  return [...new Set(scored.map(([word]) => word))].slice(0, limit)
}

/**
 * The categories whose name or title is close to a word of the query, in the catalog's
 * order.
 *
 * @param catalog - The categories to look in.
 * @param query - What the reader typed.
 * @returns The names of the close categories.
 */
export function nearCategories(
  catalog: readonly { readonly name: string; readonly title: string }[],
  query: string
): string[] {
  const words = fold(query).split(' ').filter(Boolean)
  return catalog
    .filter((category) =>
      fold(`${category.name} ${category.title}`)
        .split(' ')
        .some((part) =>
          words.some((word) => part.startsWith(word) || editDistance(word, part, 2) <= 2)
        )
    )
    .map((category) => category.name)
}

/**
 * Splits a displayed text into runs, marking the letters where a word of the query occurs.
 * The comparison is folded letter by letter, so the runs keep the text's own letters.
 *
 * @param text - The text as displayed, such as an icon's name.
 * @param query - What the reader typed.
 * @returns The runs, in order; one unmarked run when nothing occurs.
 */
export function highlight(text: string, query: string): HighlightRun[] {
  const letters = [...text]
  const folded = letters.map((letter) => fold(letter) || ' ').join('')
  const marked = letters.map(() => false)
  for (const word of fold(query).split(' ').filter(Boolean)) {
    for (let at = folded.indexOf(word); at !== -1; at = folded.indexOf(word, at + 1)) {
      for (let i = at; i < at + word.length; i++) marked[i] = true
    }
  }
  const runs: HighlightRun[] = []
  for (const [i, letter] of letters.entries()) {
    const hit = marked[i] === true
    const last = runs.at(-1)
    if (last?.hit === hit) runs.splice(-1, 1, { text: last.text + letter, hit })
    else runs.push({ text: letter, hit })
  }
  return runs
}

/** The values of a list parameter: comma separated, empty ones dropped. */
const listOf = (value: string | null): string[] => (value ?? '').split(',').filter(Boolean)

/** The types an address from before the Type control named as `?variant=`. */
const LEGACY_VARIANTS = ['filled', 'sm']

/** The types the Type control can pick, one at a time. */
const KNOWN_TYPES = ['line', 'filled', 'sm', 'brand']

/**
 * Reads the search state from an address's query string. Of the types, the first known one
 * is kept, as the Type control picks one. An older address that names a `variant` and no
 * `type` is read as that type, so a shared link keeps showing what it did.
 *
 * @param query - The query string, such as `?q=home&type=filled`.
 * @returns The query, the types and the categories, empty when absent.
 */
export function readState(query: string): SearchState {
  const params = new URLSearchParams(query)
  const legacy = LEGACY_VARIANTS.find((variant) => variant === params.get('variant'))
  // The Type control picks one type, so an address keeps its first known one; a named type,
  // even an unknown one, keeps the older variant from being read.
  const named = listOf(params.get('type'))
  const types = named.filter((type) => KNOWN_TYPES.includes(type)).slice(0, 1)
  return {
    q: params.get('q') ?? '',
    types: named.length === 0 && legacy !== undefined ? [legacy] : types,
    categories: listOf(params.get('cat'))
  }
}

/**
 * Writes the search state as a query string, leaving out what is empty.
 *
 * @param state - The query, the types and the categories.
 * @returns The query string with its `?`, or the empty string when nothing is set.
 */
export function writeState(state: SearchState): string {
  const params = new URLSearchParams()
  if (state.q !== '') params.set('q', state.q)
  if (state.types.length > 0) params.set('type', state.types.join(','))
  if (state.categories.length > 0) params.set('cat', state.categories.join(','))
  const text = params.toString()
  return text === '' ? '' : `?${text}`
}

/** The parameters of the address the search owns, `variant` being the older name of `type`. */
const OWN = ['q', 'type', 'cat', 'variant']

/**
 * Updates an address's query string with the search state, keeping every parameter the
 * search does not own and dropping the older `variant`, which `readState` has already read.
 *
 * @param current - The current query string, such as `?ref=docs&q=home`.
 * @param state - The search state to write.
 * @returns The query string with its `?`, or the empty string when nothing is left.
 */
export function mergeState(current: string, state: SearchState): string {
  const params = new URLSearchParams(current)
  for (const key of OWN) params.delete(key)
  for (const [key, value] of new URLSearchParams(writeState(state))) params.set(key, value)
  const text = params.toString()
  return text === '' ? '' : `?${text}`
}

/** The texts of one entry, folded. */
function textsOf(
  entry: CatalogEntry,
  titles: ReadonlyMap<string, string>,
  pt: readonly string[]
): SearchText[] {
  const texts: SearchText[] = [
    { field: 'name', text: fold(entry.name) },
    { field: 'label', text: fold(entry.label) },
    ...entry.aliases.map(({ name }): SearchText => ({ field: 'alias', text: fold(name) })),
    ...pt.map((term): SearchText => ({ field: 'pt', text: fold(term) })),
    ...entry.tags.map((tag): SearchText => ({ field: 'tag', text: fold(tag) })),
    ...entry.categories.map((name): SearchText => ({
      field: 'category',
      text: fold(`${name} ${titles.get(name) ?? ''}`)
    })),
    ...entry.drawings.map(({ variant }): SearchText => ({
      field: 'type',
      text: TYPE_WORDS[variant]
    })),
    ...entry.useCases.map((use): SearchText => ({ field: 'use', text: fold(use) }))
  ]
  return texts
}

/**
 * Builds the search index from the catalog and the Portuguese terms, which the site keeps
 * and the package never ships.
 *
 * @param catalog - The catalog.
 * @param terms - Brazilian Portuguese terms by entry name.
 * @param categoryTitles - Brazilian Portuguese titles by category name, searched with the
 *   English ones.
 * @returns One document per entry, in the catalog's order.
 * @throws Error naming every entry that has no Portuguese term.
 */
export function searchIndex(
  catalog: Catalog,
  terms: Readonly<Record<string, readonly string[]>>,
  categoryTitles: Readonly<Record<string, string>> = {}
): SearchDoc[] {
  const listed = catalog.entries.map((entry) => ({ entry, pt: terms[entry.name] ?? [] }))
  const missing = listed.filter(({ pt }) => pt.length === 0).map(({ entry }) => entry.name)
  if (missing.length > 0) throw new Error(`No Portuguese search term for: ${missing.join(', ')}`)
  // A category reads as its slug, its English title and its Portuguese title.
  const titles = new Map(
    catalog.categories.map((category) => [
      category.name,
      `${category.title} ${categoryTitles[category.name] ?? ''}`
    ])
  )
  return listed.map(({ entry, pt }) => ({
    name: entry.name,
    types: entry.drawings.map(({ variant }) => variant),
    categories: entry.categories,
    texts: textsOf(entry, titles, pt)
  }))
}
