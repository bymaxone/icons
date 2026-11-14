#!/usr/bin/env node
/**
 * @fileoverview `pnpm site`: builds the catalog at `.site/` from the package's own build
 * output. Every icon on every page is rendered by the built components, imported by package
 * name as a consumer imports them, so the site is also a consumer test of `dist/`. The raw
 * SVG files are copied for the copy and download buttons, and `CNAME` names the domain.
 * @layer site
 *
 * Usage: node site/build.mjs (after `pnpm build`)
 */

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Resvg } from '@resvg/resvg-js'
import { build } from 'esbuild'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { searchIndex } from '../src/pipeline/site-search.ts'
import { catalogFrom } from '../src/pipeline/site.ts'
import { ORIGIN, entryPage, homePage, notFoundPage } from './pages.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, '.site')
const metadataFile = join(root, 'dist', 'metadata.json')

if (!existsSync(metadataFile)) {
  console.error('Missing build artifacts in dist/. Run "pnpm build" first.')
  process.exit(2)
}

const components = new Map([
  ...Object.entries(await import('@bymax-one/icons')),
  ...Object.entries(await import('@bymax-one/icons/brands')),
  ...Object.entries(await import('@bymax-one/icons/flags'))
])

/**
 * Renders one of the package's components with its defaults.
 *
 * @param {string} name - The component's export name.
 * @returns {string} Its SVG markup.
 */
function render(name) {
  const component = components.get(name)
  if (typeof component !== 'function') throw new Error(`The package exports no component ${name}.`)
  return renderToStaticMarkup(createElement(component))
}

const catalog = catalogFrom(JSON.parse(readFileSync(metadataFile, 'utf8')))
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'assets'), { recursive: true })

/** Writes a page, creating its folder. */
function page(path, html) {
  mkdirSync(dirname(join(out, path)), { recursive: true })
  writeFileSync(join(out, path), html)
}

page('index.html', homePage(catalog, render, version))
for (const entry of catalog.entries) {
  page(
    `${{ icon: 'icons', brand: 'brands', flag: 'flags' }[entry.kind]}/${entry.name}/index.html`,
    entryPage(entry, catalog, render, version)
  )
}
page('404.html', notFoundPage(render, version))

cpSync(join(root, 'dist', 'svg'), join(out, 'svg'), { recursive: true })
// The 16 px masters beside their line icons, rendered at 16 px for the pixel-by-pixel cards.
for (const entry of catalog.entries.filter((item) =>
  item.drawings.some((drawing) => drawing.variant === 'sm')
)) {
  for (const variant of ['line', 'sm']) {
    const svg = readFileSync(
      join(root, 'dist', 'svg', variant, `${entry.name}.svg`),
      'utf8'
    ).replaceAll('currentColor', '#0d1b24')
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 16 } }).render().asPng()
    mkdirSync(join(out, 'px', variant), { recursive: true })
    writeFileSync(join(out, 'px', variant, `${entry.name}.png`), png)
  }
}
writeFileSync(
  join(out, 'assets', 'style.css'),
  ['base', 'home', 'entry']
    .map((part) => readFileSync(join(root, 'site', 'styles', `${part}.css`), 'utf8'))
    .join('\n')
)
// The search index, with the Portuguese terms the site keeps beside the package (spec §9):
// the build fails when an entry has none.
const terms = JSON.parse(readFileSync(join(root, 'site', 'terms-pt.json'), 'utf8'))
const categoryTitles = JSON.parse(readFileSync(join(root, 'site', 'categories-pt.json'), 'utf8'))
writeFileSync(
  join(out, 'assets', 'search.json'),
  JSON.stringify(searchIndex(catalog, terms, categoryTitles))
)
writeFileSync(
  join(out, 'assets', 'favicon.svg'),
  readFileSync(join(root, 'dist', 'svg', 'filled', 'lightning.svg'), 'utf8')
)
writeFileSync(join(out, 'CNAME'), `${new URL(ORIGIN).host}\n`)
await build({
  entryPoints: [join(root, 'site', 'client.mjs')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  outfile: join(out, 'assets', 'app.js'),
  logLevel: 'warning'
})

console.log(`built ${catalog.entries.length + 2} page(s) at ${out}`)
