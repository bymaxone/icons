/**
 * @fileoverview The catalog's page templates: the home page with the construction specimen,
 * the search, the filters and the grid; one page per icon and brand mark; and the not-found
 * page. Every text from the metadata goes through `escapeHtml`; the only markup that is not
 * escaped is an icon's own SVG, rendered by the package's components.
 * @layer site
 */

import { escapeHtml as e } from '../src/pipeline/site.ts'

/** The site's address, written to `CNAME` and to the canonical links. */
export const ORIGIN = 'https://icons.bymax.one'

/** The repository, linked from every page. */
const REPOSITORY = 'https://github.com/bymaxone/icons'

/** The Studio accents, by name, as the controls list them. */
export const ACCENTS = ['ink', 'yellow', 'orange', 'red', 'green', 'blue', 'lilac']

/** The variants a reader can show, with their labels. */
const VARIANTS = [
  ['line', 'Line'],
  ['filled', 'Filled'],
  ['sm', '16 px']
]

/** The preview sizes, in px. */
const SIZES = [16, 20, 24, 32]

/** The variant names as the page writes them. */
const VARIANT_LABEL = { line: 'Line', filled: 'Filled', sm: '16 px master', brand: 'Brand mark' }

/** A name as a short label: `arrow-up-right` becomes `Arrow up right`. */
const label = (name) => name.charAt(0).toUpperCase() + name.slice(1).replaceAll('-', ' ')

/** The folder an entry's page sits in. */
const folder = (entry) => (entry.kind === 'brand' ? 'brands' : 'icons')

/**
 * The shared page frame.
 *
 * @param {object} page
 * @param {string} page.title - The document title.
 * @param {string} page.description - The meta description.
 * @param {string} page.path - The page's path from the site root, such as `icons/home/`.
 * @param {string} page.base - The relative path back to the site root, such as `../../`.
 * @param {string} page.body - The page's main content, already escaped.
 * @param {(component: string) => string} page.ui - Renders one of the package's components.
 * @param {string} page.version - The package version.
 * @returns {string} The document.
 */
function layout({ title, description, path, base, body, ui, version }) {
  return `<!doctype html>
<html lang="en" data-theme="light" data-accent="ink" data-variant="line">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
<link rel="canonical" href="${ORIGIN}/${path}">
<link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${base}assets/style.css">
<script src="${base}assets/app.js"></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="top-in">
    <a class="mark" href="${base}" aria-label="Bymax Icons, home">${ui('LightningIcon')}<span>Bymax <b>Icons</b></span></a>
    <nav class="links" aria-label="Project">
      <a href="${REPOSITORY}">${ui('GithubBrandIcon')}<span>GitHub</span></a>
      <span class="soon" title="The package is not published yet">npm soon</span>
      <span class="ver">v${e(version)}</span>
      <button class="theme" type="button" data-toggle-theme aria-label="Switch to the dark theme">${ui('MoonIcon')}${ui('SunIcon')}</button>
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <p>Original icons, MIT licensed. Brand marks belong to their owners and are excluded from the licence; see <a href="${REPOSITORY}/blob/main/TRADEMARKS.md">TRADEMARKS.md</a>.</p>
  <p>Built from <code>@bymax-one/icons</code> v${e(version)}; every icon on this site is rendered by the package's own components.</p>
</footer>
</body>
</html>
`
}

/**
 * The construction specimen: `home` on its visible grid, with the live area, the stroke and
 * the cut between its door and its floor marked, as a type specimen marks a letter.
 *
 * @param {(component: string) => string} render
 * @returns {string} The figure.
 */
function specimen(render) {
  const lines = Array.from(
    { length: 25 },
    (_, i) => `<line x1="${i}" y1="0" x2="${i}" y2="24"/><line x1="0" y1="${i}" x2="24" y2="${i}"/>`
  ).join('')
  return `<figure class="spec" aria-label="How an icon is built: home on the 24 px grid">
  <div class="board">
    <svg class="grid24" viewBox="0 0 24 24" aria-hidden="true">${lines}<rect class="live" x="2" y="2" width="20" height="20"/></svg>
    <div class="glyph">${render('HomeIcon')}</div>
    <svg class="marks" viewBox="0 0 24 24" aria-hidden="true">
      <rect class="cut" x="9.25" y="17" width="5.5" height="1.5"/>
      <path class="cut-dim" d="M15.7 17v1.5M15.35 17h.7M15.35 18.5h.7M12 18.5v3.4"/>
      <path class="stroke-dim" d="M3.5 12.6h1.5M3.5 12.25v.7M5 12.25v.7M3.5 12.95v8.95"/>
      <text class="cut-label" x="12.35" y="22.65">the cut · 1.5 px</text>
      <text x="3.85" y="22.65">stroke · 1.5 px</text>
    </svg>
    <span class="tag tag-grid">24 × 24 grid · 20 px live area</span>
  </div>
  <figcaption class="trio">
    <span><span class="t">${render('HomeIcon')}</span>Line</span>
    <span><span class="t">${render('HomeFilledIcon')}</span>Filled</span>
    <span><span class="t sm">${render('HomeSmIcon')}</span>16 px master</span>
  </figcaption>
</figure>`
}

/**
 * One cell of the grid: a link to the entry's page holding each of its drawings.
 *
 * @param {import('../src/pipeline/site.ts').CatalogEntry} entry
 * @param {(component: string) => string} render
 * @returns {string} The list item.
 */
function cell(entry, render) {
  const drawings = entry.drawings
    .map(
      (drawing) => `<span class="d" data-d="${drawing.variant}">${render(drawing.component)}</span>`
    )
    .join('')
  return `<li class="cell" data-kind="${entry.kind}" data-words="${e(entry.words)}" data-categories="${e(entry.categories.join(' '))}" data-variants="${entry.drawings.map((d) => d.variant).join(' ')}">
<a href="${folder(entry)}/${e(entry.name)}/" title="${e(entry.title)}">${drawings}<span class="n">${e(entry.title)}</span></a>
</li>`
}

/** A row of toggle buttons that set one control. */
function toggles(name, setting, options, current) {
  const buttons = options
    .map(
      ([value, text]) =>
        `<button type="button" data-set-${setting}="${value}" aria-pressed="${value === current}">${text}</button>`
    )
    .join('')
  return `<div class="seg" role="group" aria-label="${name}">${buttons}</div>`
}

/** The introduction: the claim, the install command and the counts. */
function intro(icons, brands, render) {
  const count = (variant) =>
    icons.filter((entry) => entry.drawings.some((d) => d.variant === variant)).length
  return `<div class="hero-text">
    <p class="eyebrow">An original icon set for React and the web</p>
    <h1>One grid.<br>One stroke.<br>Every part apart.</h1>
    <p class="lede">${icons.length} icons and ${brands} brand marks, drawn on a 24 px grid with a 1.5 px stroke and a cut that keeps every part clear of the next. With filled variants, hand-tuned 16 px masters, React components that render in Server Components, raw SVG, a sprite and typed metadata.</p>
    <div class="install"><code>pnpm add @bymax-one/icons</code><button type="button" class="copy" data-copy-text="pnpm add @bymax-one/icons" aria-label="Copy the install command">${render('CopyIcon')}</button></div>
    <dl class="facts">
      <div><dt>${icons.length}</dt><dd>icons</dd></div>
      <div><dt>${count('filled')}</dt><dd>filled variants</dd></div>
      <div><dt>${count('sm')}</dt><dd>16 px masters</dd></div>
      <div><dt>${brands}</dt><dd>brand marks</dd></div>
    </dl>
  </div>`
}

/** The controls bar: search and category, then variant, size, stroke and colour. */
function controls(catalog, render) {
  const options = catalog.categories
    .map((category) => `<option value="${e(category.name)}">${e(category.title)}</option>`)
    .join('')
  const accents = ACCENTS.map(
    (accent) =>
      `<button type="button" class="sw sw-${accent}" data-set-accent="${accent}" aria-pressed="${accent === 'ink'}" aria-label="${label(accent)}" title="${label(accent)}"></button>`
  ).join('')
  return `<div class="bar">
    <div class="row">
      <label class="search">${render('SearchIcon')}<span class="sr">Search</span><input id="q" type="search" placeholder="Search icons" autocomplete="off" spellcheck="false"></label>
      <label class="cat"><span class="sr">Category</span><select id="category"><option value="">All categories</option>${options}</select></label>
    </div>
    <div class="row">
      ${toggles('Variant', 'variant', VARIANTS, 'line')}
      ${toggles(
        'Size',
        'size',
        SIZES.map((size) => [String(size), String(size)]),
        '24'
      )}
      <label class="stroke"><span>Stroke</span><input id="stroke" type="range" min="1" max="2.5" step="0.25" value="1.5"><output for="stroke">1.5</output></label>
      <div class="seg sws" role="group" aria-label="Colour">${accents}</div>
    </div>
  </div>`
}

/**
 * The home page: the specimen, the controls and the grid of every icon and brand mark.
 *
 * @param {import('../src/pipeline/site.ts').Catalog} catalog
 * @param {(component: string) => string} render
 * @param {string} version
 * @returns {string} The document.
 */
export function homePage(catalog, render, version) {
  const icons = catalog.entries.filter((entry) => entry.kind === 'icon')
  const brands = catalog.entries.length - icons.length
  const body = `<section class="hero">
  ${intro(icons, brands, render)}
  ${specimen(render)}
</section>
<section class="browse" aria-label="Browse">
  ${controls(catalog, render)}
  <p class="count" aria-live="polite">Showing <span id="shown-icons">${icons.length}</span> of ${icons.length} icons and <span id="shown-brands">${brands}</span> of ${brands} brand marks</p>
  <ul class="grid">
${catalog.entries.map((entry) => cell(entry, render)).join('\n')}
  </ul>
  <p class="empty" hidden>Nothing matches. Try a tag such as <q>video</q> or <q>credits</q>.</p>
</section>`
  return layout({
    title: 'Bymax Icons: an original icon set for React and the web',
    description: `${icons.length} original icons and ${brands} brand marks on one 24 px grid with a 1.5 px stroke: React components, raw SVG, a sprite and typed metadata.`,
    path: '',
    base: '',
    body,
    ui: render,
    version
  })
}

/** A copyable code line. */
function snippet(code, name, render) {
  return `<div class="code"><pre><code>${e(code)}</code></pre><button type="button" class="copy" data-copy-text="${e(code)}" aria-label="${e(name)}">${render('CopyIcon')}</button></div>`
}

/** The buttons under a drawing: copy its SVG and JSX, download its file. */
function actions(entry, drawing, render) {
  const svgPath = `../../svg/${drawing.variant === 'brand' ? 'brands' : drawing.variant}/${e(entry.name)}.svg`
  return `<span class="acts">
      <button type="button" class="btn" data-copy-svg="${svgPath}">${render('CopyIcon')}SVG</button>
      <button type="button" class="btn" data-copy-text="&lt;${drawing.component} /&gt;">${render('CopyIcon')}JSX</button>
      <a class="btn" href="${svgPath}" download>${render('DownloadIcon')}File</a>
    </span>`
}

/** The card of a 24 px drawing: large, then from 16 to 48 px. */
function drawingCard(entry, drawing, render) {
  return `<figure class="pv">
  <div class="big">${render(drawing.component)}</div>
  <div class="sizes">${[16, 20, 24, 32, 48].map((size) => `<span class="sz" data-size="${size}">${render(drawing.component)}<i>${size}</i></span>`).join('')}</div>
  <figcaption><span class="cap"><b>${VARIANT_LABEL[drawing.variant]}</b> <code>${drawing.component}</code></span>
    ${actions(entry, drawing, render)}
  </figcaption>
</figure>`
}

/** The card of a 16 px master: the line icon reduced to 16 against the master, at 1x and pixel by pixel. */
function masterCard(entry, drawing, render) {
  const pair = (file, caption) =>
    `<span class="px-col"><span class="px-frame"><img class="px" src="../../px/${file}/${e(entry.name)}.png" width="128" height="128" alt=""></span><span class="px-1x"><img src="../../px/${file}/${e(entry.name)}.png" width="16" height="16" alt=""><i>1x</i></span><span class="px-cap">${caption}</span></span>`
  return `<figure class="pv">
  <div class="big px-pair" role="img" aria-label="The line icon reduced to 16 px beside the 16 px master, pixel by pixel">${pair('line', 'Line reduced to 16')}${pair('sm', '16 px master')}</div>
  <figcaption><span class="cap"><b>${VARIANT_LABEL[drawing.variant]}</b> <code>${drawing.component}</code></span>
    ${actions(entry, drawing, render)}
  </figcaption>
</figure>`
}

/** The entries most like this one: shared tags first, then a shared category. */
function relatedTo(entry, catalog) {
  return catalog.entries
    .filter((other) => other !== entry)
    .map((other) => ({
      other,
      score:
        2 * other.tags.filter((tag) => entry.tags.includes(tag)).length +
        other.categories.filter((category) => entry.categories.includes(category)).length
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.other.name.localeCompare(b.other.name))
    .slice(0, 12)
    .map(({ other }) => other)
}

/** How to use an entry: its import, a decorative use and a labelled one. */
function usage(entry, render) {
  const subpath = entry.kind === 'brand' ? '@bymax-one/icons/brands' : '@bymax-one/icons'
  const first = entry.drawings[0].component
  return `<section class="use">
      <h2>Use it</h2>
      ${snippet(`import { ${first} } from '${subpath}'`, 'Copy the import', render)}
      ${snippet(`<${first} size={20} />`, 'Copy the decorative use', render)}
      <p class="note">Decorative by default, beside a text that says the same. When the icon stands alone, give it a name with <code>title</code>; it then has <code>role="img"</code>:</p>
      ${snippet(`<${first} size={20} title="${label(entry.name)}" />`, 'Copy the labelled use', render)}
    </section>`
}

/** What the metadata says about an entry: its name, tags, aliases and first version. */
function details(entry, render) {
  const aliases = entry.aliases.length
    ? `<dt>Aliases</dt><dd><ul class="chips">${entry.aliases
        .map(
          (alias) =>
            `<li><code>${e(alias.name)}</code>${alias.deprecated ? ` <em>deprecated, removed in ${e(alias.toBeRemovedInVersion)}</em>` : ''}</li>`
        )
        .join('')}</ul></dd>`
    : ''
  return `<section class="meta">
      <h2>Details</h2>
      <dl>
        <dt>Name</dt><dd><code>${e(entry.name)}</code> <button type="button" class="copy" data-copy-text="${e(entry.name)}" aria-label="Copy the name">${render('CopyIcon')}</button></dd>
        <dt>Tags</dt><dd><ul class="chips">${entry.tags.map((tag) => `<li>${e(tag)}</li>`).join('')}</ul></dd>
        ${aliases}
        <dt>Since</dt><dd>v${e(entry.since)}</dd>
      </dl>
    </section>`
}

/** The use cases of an entry, or nothing when it has none. */
function useCasesOf(entry) {
  return entry.useCases.length
    ? `<section class="uses"><h2>Use it for</h2><ul>${entry.useCases.map((use) => `<li>${e(use)}</li>`).join('')}</ul></section>`
    : ''
}

/** The related entries as a small grid, or nothing when none is related. */
function relatedSection(entry, catalog, render) {
  const related = relatedTo(entry, catalog)
  return related.length
    ? `<section class="rel"><h2>Related</h2><ul class="grid small">${related
        .map(
          (other) =>
            `<li class="cell"><a href="../../${folder(other)}/${e(other.name)}/" title="${e(other.title)}"><span class="d">${render(other.drawings[0].component)}</span><span class="n">${e(other.title)}</span></a></li>`
        )
        .join('')}</ul></section>`
    : ''
}

/**
 * The page of one icon or brand mark: its drawings, how to use it, and what the metadata
 * says about it.
 *
 * @param {import('../src/pipeline/site.ts').CatalogEntry} entry
 * @param {import('../src/pipeline/site.ts').Catalog} catalog
 * @param {(component: string) => string} render
 * @param {string} version
 * @returns {string} The document.
 */
export function entryPage(entry, catalog, render, version) {
  const titles = new Map(catalog.categories.map((category) => [category.name, category.title]))
  const cards = entry.drawings
    .map((drawing) =>
      drawing.variant === 'sm'
        ? masterCard(entry, drawing, render)
        : drawingCard(entry, drawing, render)
    )
    .join('\n')
  const body = `<nav class="crumbs" aria-label="Breadcrumb"><a href="../../">${render('ArrowLeftIcon')}All icons</a></nav>
<section class="entry">
  <header class="entry-h">
    <h1>${e(entry.title)}</h1>
    <ul class="chips">${entry.categories.map((category) => `<li>${e(titles.get(category) ?? category)}</li>`).join('')}</ul>
  </header>
  <div class="pvs">
${cards}
  </div>
  <div class="cols">
    ${usage(entry, render)}
    ${details(entry, render)}
  </div>
  ${useCasesOf(entry)}
  ${relatedSection(entry, catalog, render)}
</section>`
  return layout({
    title: `${entry.title}: Bymax Icons`,
    description: `The ${entry.title} ${entry.kind === 'brand' ? 'brand mark' : 'icon'} of @bymax-one/icons, as a React component and raw SVG.`,
    path: `${folder(entry)}/${entry.name}/`,
    base: '../../',
    body,
    ui: render,
    version
  })
}

/**
 * The page GitHub Pages serves for a missing path.
 *
 * @param {(component: string) => string} render
 * @param {string} version
 * @returns {string} The document, which links to the root by absolute path.
 */
export function notFoundPage(render, version) {
  return layout({
    title: 'Not found: Bymax Icons',
    description: 'This page does not exist.',
    path: '404.html',
    base: '/',
    body: `<section class="hero lone"><div class="hero-text"><h1>Not found</h1><p class="lede">This page does not exist. <a href="/">See every icon</a>.</p></div></section>`,
    ui: render,
    version
  })
}
