# Phase P4: catalog-site

> **Status**: ✅ Done · **Progress**: 3 / 4 tasks · **Last updated**: 2026-11-11
> **Source roadmap**: [`../development_plan.md`](../development_plan.md) §5 (P4)
> **Source spec**: [`../technical_specification.md`](../technical_specification.md) §9, §17 (D4)

---

## Context

The catalog is a static site in `site/`, built by `pnpm site` from the package's own build output. Every icon on every page is rendered by the built components, imported by package name as a consumer imports them, so the site is also a consumer test of `dist/`.

- `src/pipeline/site.ts` holds the logic a wrong value could turn into markup: the escaping of every text a page writes, the catalog built from `dist/metadata.json`, and the search and category matching. It is tested like the rest of the pipeline.
- `site/pages.mjs` holds the page templates: the home page with the construction specimen, the controls and the grid; one page per icon and brand mark; the not-found page.
- `site/client.mjs` is the browser script: search, category, variant, size, stroke, theme and colour, and the copy buttons. It never writes markup.
- `site/build.mjs` writes `.site/`: the pages, the raw SVG files, the 16 px renders of the line icons and their masters, the stylesheet and the bundled script.
- The pages carry a Content Security Policy that allows scripts and styles from the site only.

### Publishing

`.github/workflows/pages.yml` builds the site from `main` and deploys it to GitHub Pages. The CI `verify` job builds it on every pull request. The DNS record of `icons.bymax.one`, a CNAME to `bymaxone.github.io`, is the founder's to create; task 11.4 waits on it.

---

## Task index

| ID   | Task                                         | Status     | Priority | Size | Depends on |
| ---- | -------------------------------------------- | ---------- | -------- | ---- | ---------- |
| 11.1 | Model, escaping and search, with their tests | ✅ Done    | P0       | S    | none       |
| 11.2 | Pages, browser script, styles and the build  | ✅ Done    | P0       | M    | 11.1       |
| 11.3 | CI build and the Pages workflow              | ✅ Done    | P0       | S    | 11.2       |
| 11.4 | Publish on `icons.bymax.one`                 | ⛔ Blocked | P0       | S    | 11.3       |

---

## Completion log

<!-- Append one line per completed task: - <id> ✅ YYYY-MM-DD <summary> -->

- 11.1 ✅ 2026-11-11 The catalog model, the escaping and the search, at full coverage.
- 11.2 ✅ 2026-11-11 The home page with the construction specimen, one page per icon and brand mark, and the build.
- 11.3 ✅ 2026-11-11 The CI builds the site and the Pages workflow deploys it; the design is approved by the delegated auditor on behalf of the founder.
