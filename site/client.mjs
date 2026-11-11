/**
 * @fileoverview The catalog's browser script: the search and the category filter over the
 * grid, the variant, size, stroke, theme and colour controls, and the copy buttons. It never
 * writes markup, and keeps the reader's theme and colour in local storage.
 * @layer site
 */

import { inCategory, matchesQuery } from '../src/pipeline/site.ts'

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
  press('variant', variant)
}

/** Sets the size of the icons in the grid. */
function setSize(size) {
  root.style.setProperty('--icon', `${size}px`)
  press('size', size)
}

/** Hides the cells that do not match the search and the category, and counts the rest by kind. */
function filter() {
  const query = document.getElementById('q')?.value ?? ''
  const category = document.getElementById('category')?.value ?? ''
  let icons = 0
  let brands = 0
  for (const cell of document.querySelectorAll('.cell[data-words]')) {
    const visible =
      matchesQuery(cell.dataset.words, query) &&
      inCategory(cell.dataset.categories.split(' '), category)
    cell.hidden = !visible
    if (visible && cell.dataset.kind === 'brand') brands += 1
    else if (visible) icons += 1
  }
  const iconCount = document.getElementById('shown-icons')
  if (iconCount) iconCount.textContent = String(icons)
  const brandCount = document.getElementById('shown-brands')
  if (brandCount) brandCount.textContent = String(brands)
  const empty = document.querySelector('.empty')
  if (empty) empty.hidden = icons + brands > 0
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
  const requested = new URLSearchParams(location.search).get('variant')
  if (document.querySelector('.grid'))
    showVariant(['filled', 'sm'].includes(requested) ? requested : 'line')
  document.getElementById('q')?.addEventListener('input', filter)
  document.getElementById('category')?.addEventListener('change', filter)
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
    } else if (target.dataset.setVariant) {
      showVariant(target.dataset.setVariant)
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
