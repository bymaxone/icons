/**
 * @fileoverview The catalog's browser script: the search over the index the build writes, the
 * type and category facets kept in the address, the category navigation, the keyboard, the
 * variant, size, stroke, theme and colour controls, and the copy buttons. It never writes
 * markup: matched words are marked with elements it creates and fills as text. It keeps the
 * reader's theme and colour in local storage.
 * @layer site
 */

import {
  highlight,
  mergeState,
  nearCategories,
  readState,
  search,
  suggestions
} from '../src/pipeline/site-search.ts'

const root = document.documentElement
const KEY = 'bx-icons-prefs'

/** The saved preferences, or none. */
function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

/** Saves one preference. */
function savePref(name, value) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...loadPrefs(), [name]: value }))
  } catch {
    // Storage can be unavailable (private browsing); the control still applies for the page.
  }
}

/** Marks the button of a group whose value is current. */
function press(setting, value) {
  for (const button of document.querySelectorAll(`[data-set-${setting}]`)) {
    button.setAttribute(
      'aria-pressed',
      String(button.getAttribute(`data-set-${setting}`) === value)
    )
  }
}

/** Shows each cell's drawing of the chosen variant, or its line drawing when it has none. A 16 px master is shown at 16 px, its only size. */
function showVariant(variant) {
  root.dataset.variant = variant
  for (const cell of document.querySelectorAll('.cell[data-variants]')) {
    const variants = cell.dataset.variants.split(' ')
    const shown = variants.includes(variant) ? variant : variants[0]
    cell.toggleAttribute('data-fallback', shown !== variant && cell.dataset.kind === 'icon')
    for (const drawing of cell.querySelectorAll('.d')) drawing.hidden = drawing.dataset.d !== shown
  }
  for (const button of document.querySelectorAll('[data-set-size]'))
    button.disabled = variant === 'sm'
  if (variant === 'sm') setSize('16')
}

/** Sets the size of the icons in the grid. */
function setSize(size) {
  root.style.setProperty('--icon', `${size}px`)
  press('size', size)
}

/** The search: the index once loaded, the categories as the page lists them, and the state. */
const finder = { docs: null, categories: [], state: readState(location.search) }

/** Writes a cell's name, marking the letters a word of the query matched. */
function markName(name, query) {
  const title = name.dataset.title
  if (query === '' && !name.hasAttribute('data-marked')) return
  name.toggleAttribute('data-marked', query !== '')
  name.replaceChildren()
  for (const run of highlight(title, query)) {
    if (!run.hit) name.append(run.text)
    else {
      const mark = document.createElement('mark')
      mark.textContent = run.text
      name.append(mark)
    }
  }
}

/** Fills a list of buttons, one per word, that run a search or pick a category. */
function offer(holder, words, act) {
  holder.replaceChildren()
  for (const word of words) {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = word.text
    button.addEventListener('click', () => {
      act(word.value)
      // The button goes with the empty state; the search keeps the focus.
      document.getElementById('q')?.focus()
    })
    holder.append(button)
  }
  holder.parentElement.hidden = words.length === 0
}

/** The empty state: the query, the words it might have meant and the close categories. */
function showEmpty(empty, nothing) {
  empty.hidden = !nothing
  if (!nothing) return
  const { q } = finder.state
  document.querySelector('.empty-title').textContent =
    q === '' ? 'Nothing matches the selected filters.' : `Nothing matches “${q}”.`
  offer(
    document.getElementById('did'),
    suggestions(finder.docs, q).map((word) => ({ text: word, value: word })),
    (word) => setQuery(word)
  )
  const titles = new Map(finder.categories.map((category) => [category.name, category.title]))
  offer(
    document.getElementById('near'),
    nearCategories(finder.categories, q).map((name) => ({ text: titles.get(name), value: name })),
    (name) => {
      // The query found nothing in any category, so a close category is shown without it.
      setQuery('', false)
      setFacet('categories', [name], true)
    }
  )
}

/** The line that names the active facets, with a button that clears them. */
function showActive() {
  const { types, categories } = finder.state
  const line = document.querySelector('.active')
  if (!line) return
  const titles = new Map(finder.categories.map((category) => [category.name, category.title]))
  const typeLabels = new Map(
    [...document.querySelectorAll('[data-type]')].map((b) => [b.dataset.type, b.textContent])
  )
  const names = [
    ...types.map((t) => typeLabels.get(t) ?? t),
    ...categories.map((c) => titles.get(c) ?? c)
  ]
  line.hidden = names.length === 0
  document.getElementById('active').textContent = names.join(', ')
}

/** Shows the cells the search and the facets keep, ranked, and counts them by section. */
function filter() {
  if (!finder.docs) return
  const { state } = finder
  const ranked = search(finder.docs, state.q, state)
  const rank = new Map(ranked.map((hit, index) => [hit.name, index]))
  const shown = { icon: new Set(), brand: new Set(), flag: new Set() }
  for (const section of document.querySelectorAll('.group')) {
    const picked = state.categories.length === 0 || state.categories.includes(section.dataset.cat)
    let count = 0
    for (const cell of section.querySelectorAll('.cell')) {
      const at = rank.get(cell.dataset.name)
      const visible = picked && at !== undefined
      cell.hidden = !visible
      cell.style.order = visible && state.q ? String(at) : ''
      if (visible) markName(cell.querySelector('.n'), state.q)
      if (visible) {
        count += 1
        shown[cell.dataset.kind].add(cell.dataset.name)
      }
    }
    section.hidden = count === 0
    section.querySelector('[data-count]').textContent = String(count)
    const nav = document.querySelector(`[data-count-nav="${section.dataset.cat}"]`)
    if (nav) {
      nav.textContent = String(count)
      nav.parentElement.toggleAttribute('data-zero', count === 0)
    }
  }
  document.getElementById('shown-icons').textContent = String(shown.icon.size)
  document.getElementById('shown-brands').textContent = String(shown.brand.size)
  const shownFlags = document.getElementById('shown-flags')
  if (shownFlags) shownFlags.textContent = String(shown.flag.size)
  showEmpty(
    document.querySelector('.empty'),
    shown.icon.size + shown.brand.size + shown.flag.size === 0
  )
  showActive()
  history.replaceState(
    null,
    '',
    `${location.pathname}${mergeState(location.search, state)}${location.hash}`
  )
}

/** Sets the query, in the search box and in the state, and shows the result unless told not to. */
function setQuery(query, show = true) {
  finder.state = { ...finder.state, q: query }
  const box = document.getElementById('q')
  if (box) box.value = query
  if (show) filter()
}

/** Sets a facet's list, and marks its controls; the Type control also picks the drawing shown. */
function setFacet(facet, values, scroll = false) {
  finder.state = { ...finder.state, [facet]: values }
  const type = finder.state.types[0] ?? ''
  for (const button of document.querySelectorAll('[data-type]')) {
    button.setAttribute('aria-pressed', String(button.dataset.type === type))
  }
  showVariant(type === 'filled' || type === 'sm' ? type : 'line')
  for (const box of document.querySelectorAll('[data-cat]')) {
    if (box instanceof HTMLInputElement)
      box.checked = finder.state.categories.includes(box.dataset.cat)
  }
  filter()
  if (scroll) document.querySelector('.sections')?.scrollIntoView({ block: 'start' })
}

/** Toggles one value of a facet. */
function toggleFacet(facet, value, on) {
  const rest = finder.state[facet].filter((item) => item !== value)
  setFacet(facet, on ? [...rest, value] : rest)
}

/** Marks the category the reader is reading in the navigation. */
function spy() {
  const links = new Map(
    [...document.querySelectorAll('[data-nav]')].map((link) => [link.dataset.nav, link])
  )
  const observer = new IntersectionObserver(
    (seen) => {
      for (const item of seen) {
        if (!item.isIntersecting) continue
        for (const link of links.values()) link.removeAttribute('aria-current')
        links.get(item.target.dataset.cat)?.setAttribute('aria-current', 'true')
      }
    },
    { rootMargin: '-140px 0px -70% 0px' }
  )
  for (const section of document.querySelectorAll('.group')) observer.observe(section)
}

/** Moves the focus between the visible cells with the arrow keys. */
function arrows(event) {
  const from = event.target instanceof Element ? event.target.closest('.cell a') : null
  if (!from || !event.key.startsWith('Arrow')) return
  const grid = from.closest('.grid')
  const links = [...grid.querySelectorAll('.cell:not([hidden]) a')]
  links.sort((a, b) => Number(a.parentElement.style.order) - Number(b.parentElement.style.order))
  // The grid's own column count, so a short last row does not shorten the step up or down.
  const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length
  const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[event.key]
  const next = links[links.indexOf(from) + step]
  if (step !== undefined && next) {
    event.preventDefault()
    next.focus()
  }
}

/** Fits the search box's hint to its width: a narrow box reads only "Search icons". */
function fitPlaceholder(box) {
  const narrow = matchMedia('(max-width: 820px)')
  const full = box.placeholder
  const fit = () => {
    if (!box.disabled) box.placeholder = narrow.matches ? 'Search icons' : full
  }
  fit()
  narrow.addEventListener('change', fit)
}

/** Wires the Type control, the filters drawer, the category boxes, the clear button and the jump list. */
function wireFacets(box) {
  for (const button of document.querySelectorAll('[data-type]')) {
    button.addEventListener('click', () =>
      setFacet('types', button.dataset.type === '' ? [] : [button.dataset.type])
    )
  }
  const toggle = document.querySelector('.more-toggle')
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true'
    toggle.setAttribute('aria-expanded', String(open))
    document.querySelector('.bar')?.toggleAttribute('data-open', open)
  })
  for (const pick of document.querySelectorAll('input[data-cat]')) {
    pick.addEventListener('change', () => toggleFacet('categories', pick.dataset.cat, pick.checked))
  }
  document.getElementById('clear')?.addEventListener('click', () => {
    finder.state = { ...finder.state, types: [], categories: [] }
    setFacet('types', [])
    box.focus()
  })
  document.getElementById('jump')?.addEventListener('change', (event) => {
    const name = event.target.value
    if (name) document.getElementById(`cat-${name}`)?.scrollIntoView({ block: 'start' })
  })
}

/** Wires the keyboard: `/` focuses the search unless a field has the focus; arrows move between results. */
function wireKeys(box) {
  document.addEventListener('keydown', (event) => {
    const typing =
      event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement
    if (event.key === '/' && !typing) {
      event.preventDefault()
      box.focus()
    } else arrows(event)
  })
}

/** Loads the search index, then applies the state; on failure, says the search cannot run. */
function loadIndex(box) {
  void fetch('assets/search.json')
    .then((response) => {
      if (!response.ok) throw new Error(`The search index answered ${response.status}`)
      return response.json()
    })
    .then((docs) => {
      finder.docs = docs
      filter()
    })
    .catch(() => {
      // Every icon stays listed; the reader is told the search cannot run.
      box.disabled = true
      box.placeholder = 'Search is unavailable; every icon is listed below'
    })
}

/** Wires the search, the facets, the navigation and the keyboard on the home page. */
function startSearch() {
  const box = document.getElementById('q')
  if (!box) return
  box.value = finder.state.q
  fitPlaceholder(box)
  finder.categories = [...document.querySelectorAll('.group')].map((section) => ({
    name: section.dataset.cat,
    title: section.querySelector('h2').firstChild.textContent.trim()
  }))
  setFacet('types', finder.state.types)
  box.addEventListener('input', () => setQuery(box.value))
  wireFacets(box)
  wireKeys(box)
  spy()
  loadIndex(box)
}

/** Applies the theme and labels the toggle with the theme it switches to. */
function setTheme(theme) {
  root.dataset.theme = theme
  const toggle = document.querySelector('[data-toggle-theme]')
  toggle?.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'
  )
}

/** Copies a text and marks the button for a moment. */
async function copy(button, text) {
  try {
    await navigator.clipboard.writeText(text)
    button.dataset.done = ''
    setTimeout(() => delete button.dataset.done, 1200)
  } catch {
    button.dataset.failed = ''
  }
}

const prefs = loadPrefs()
setTheme(prefs.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
root.dataset.accent = prefs.accent ?? 'ink'

document.addEventListener('DOMContentLoaded', () => {
  // The theme is set above, before the first paint; its toggle exists only now, so label it.
  setTheme(root.dataset.theme)
  press('accent', root.dataset.accent)
  // A page with a grid and no search (an entry's related icons) shows the line drawings.
  if (!document.getElementById('q') && document.querySelector('.grid')) showVariant('line')
  startSearch()
  const stroke = document.getElementById('stroke')
  stroke?.addEventListener('input', () => {
    root.style.setProperty('--stroke', stroke.value)
    const output = document.querySelector('output[for="stroke"]')
    if (output) output.textContent = stroke.value
  })
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('button') : null
    if (!target) return
    if (target.matches('[data-toggle-theme]')) {
      const theme = root.dataset.theme === 'dark' ? 'light' : 'dark'
      setTheme(theme)
      savePref('theme', theme)
    } else if (target.dataset.setSize) {
      setSize(target.dataset.setSize)
    } else if (target.dataset.setAccent) {
      root.dataset.accent = target.dataset.setAccent
      savePref('accent', target.dataset.setAccent)
      press('accent', target.dataset.setAccent)
    } else if (target.dataset.copyText !== undefined) {
      void copy(target, target.dataset.copyText)
    } else if (target.dataset.copySvg) {
      void fetch(target.dataset.copySvg)
        .then((response) => {
          if (!response.ok) throw new Error(`No SVG at ${target.dataset.copySvg}`)
          return response.text()
        })
        .then((text) => copy(target, text))
        .catch(() => {
          target.dataset.failed = ''
        })
    }
  })
})
