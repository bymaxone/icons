<p align="center">
  <img src="https://img.shields.io/badge/%40bymax--one-icons-000000?style=for-the-badge&logo=react&logoColor=61DAFB" alt="@bymax-one/icons" />
</p>

<h1 align="center">@bymax-one/icons</h1>

<p align="center">
  <strong>Original icons for Bymax products, drawn on one grid with one set of rules</strong><br />
  <sub>24 px grid · 1.5 px round stroke · React 19 and Server Components · Raw SVG and sprite · Typed metadata · Zero Runtime Dependencies</sub>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@bymax-one/icons"><img src="https://img.shields.io/npm/v/@bymax-one/icons?style=flat-square&colorA=000000&colorB=000000" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@bymax-one/icons"><img src="https://img.shields.io/npm/dm/@bymax-one/icons?style=flat-square&colorA=000000&colorB=000000" alt="npm downloads" /></a>
  <a href="https://github.com/bymaxone/icons/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/bymaxone/icons/ci.yml?branch=main&style=flat-square&colorA=000000&label=CI" alt="CI status" /></a>
  <a href="https://github.com/bymaxone/icons/actions/workflows/ci.yml"><img src="https://img.shields.io/badge/coverage-100%25-brightgreen?style=flat-square&colorA=000000" alt="coverage" /></a>
  <a href="https://scorecard.dev/viewer/?uri=github.com/bymaxone/icons"><img src="https://api.scorecard.dev/projects/github.com/bymaxone/icons/badge?style=flat-square" alt="OpenSSF Scorecard" /></a>
  <a href="https://github.com/bymaxone/icons/blob/main/LICENSE"><img src="https://img.shields.io/github/license/bymaxone/icons?style=flat-square&colorA=000000&colorB=000000" alt="license" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-24%2B-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" /></a>
</p>

<p align="center">
  <a href="https://github.com/bymaxone/icons">GitHub</a> ·
  <a href="https://github.com/bymaxone/icons/issues">Issues</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-api-reference">API Reference</a> ·
  <a href="./docs/technical_specification.md">Specification</a>
</p>

---

## ✨ Overview

`@bymax-one/icons` is a public icon set with its own drawings. It will ship every icon as a
React component, a raw SVG file, a symbol in an SVG sprite and an entry in typed metadata.
Every non-brand glyph is an original Bymax drawing built on one grid and one set of rules,
so the products that use it do not look like every other app built on the same open-source
set.

> [!NOTE]
> **Status: pre-1.0, no icons yet.** The repository, its quality gates, the release
> workflow, the runtime every icon renders through (the `Icon` base and `createIcon`) and the
> build pipeline are in place: an SVG and its metadata under `icons/` become a component, a
> raw SVG file, a sprite symbol and a metadata entry, behind an icon lint. The pipeline is
> proven on placeholder fixtures; the first drawing batch comes next, in the order the
> [development plan](./docs/development_plan.md) sets. Nothing is published to npm until
> `1.0.0`.

The library has **zero direct dependencies**: `react` arrives as a peer dependency, so you
control its version and the supply-chain surface stays minimal.

### Why @bymax-one/icons?

- **Its own identity.** Most React products draw their interface from the same two or three
  open-source sets, so the same house, gear and sparkle appear everywhere. These drawings
  are new, made for Bymax products.
- **Concepts other sets do not draw well.** Scene, shot, keyframe, credit, spending cap,
  lip-sync and version are first-class icons, not approximations.
- **One grid, one stroke, verified.** A 24 px master, a 20 px live area and a 1.5 px round
  stroke apply to every icon, and a lint checks the rules a machine can check.
- **The engineering of the most adopted sets.** One source SVG and one metadata file per
  icon, named aliases with deprecation, per-icon ES modules that tree-shake, an accessible
  default and a searchable catalog.

---

## 🔥 Features

✅ marks what the package ships today; 📋 marks what the specification commits to for 1.0
and is not built yet.

### 🎨 Drawing System

- ✅ **The grid as data**: `ICON_GRID` holds the viewBox, live area, padding and stroke of the
  24 px master, frozen and typed with literal values
- ✅ **The design language, approved**: the twelve keystone icons (`home`, `search`, `play`,
  `plus`, `close`, `check`, `settings`, `user`, `file`, `folder`, `lightning`, `scene`) fix
  the signature of the set, a 1.5 px cut that keeps distinct parts from touching
- ✅ **Navigation, actions and status**: 44 more icons in the same language, from
  `dashboard` and the chevrons to `trash`, `eye-off` and `cloud-check`
- ✅ **Media, audio, files and editor**: 50 more icons, from `pause` and `timeline` to
  `mic`, `lip-sync`, `layers` and `mask`
- ✅ **Studio, AI, formats, billing, people and system**: 42 more icons, from `wallet` and
  the `aspect-*` formats to `sparkle`, `octopus` (alias `polvi`) and `bell`, 148 in all
- 📋 **About 125 original icons**: common concepts plus the Studio's own (scene, shot,
  keyframe, credit, spending cap, lip-sync, version)
- 📋 **Filled variants** for the icons with a stateful meaning, with the same silhouette as
  the line icon so switching causes no size jump
- 📋 **Hand-tuned 16 px masters** for the icons used in dense UI, drawn separately rather
  than scaled
- 📋 **Brand marks** in official geometry, monochrome `currentColor`, excluded from the MIT
  grant (see [`TRADEMARKS.md`](./TRADEMARKS.md))

### ⚛️ React

- ✅ **A pure runtime**: the `Icon` base and `createIcon` use no hooks, no context and no
  `'use client'`, so they render in Server Components and client components alike
- ✅ **Accessible by default**: decorative icons are silent; a `title` turns an icon into a
  named image
- ✅ **`ref` as a regular prop** (React 19), no `forwardRef`
- ✅ **`absoluteStrokeWidth`** keeps the visual stroke constant at every size
- ✅ **One component per icon** (`LightningIcon`), generated from the drawing, from the root or
  from `./icons/<name>`

### 🧩 Developer Experience

- ✅ **Zero runtime dependencies**: `react` is a peer, so you pin the version
- ✅ **Dual-format output**: ESM and CJS with declarations for each format, verified against
  the packed tarball on every run
- ✅ **A React-free metadata entry**: `./meta` imports nothing from React, enforced by lint
- ✅ **Typed end to end**: TypeScript `strict` with `exactOptionalPropertyTypes` and
  `noUncheckedIndexedAccess`; zero `any`
- ✅ **A build pipeline**: SVGO normalisation, an icon lint over every SVG and metadata rule,
  one generated module per icon variant, raw SVG files, a sprite and merged metadata, with a
  stale-copy check in CI; proven end to end on placeholder fixtures
- 📋 **Per-icon modules** that tree-shake: the entries, their exports and their gates exist,
  and fill with the drawings

---

## 📦 Subpath Exports

| Subpath           | Contents                                                        | Status  |
| ----------------- | --------------------------------------------------------------- | ------- |
| `.`               | Every line and filled component, the `Icon` base and the types  | Partial |
| `./runtime`       | The `Icon` base, `createIcon` and their types                   | Ready   |
| `./meta`          | Typed metadata and the `IconName` union, with no React import   | Ready   |
| `./icons/<name>`  | One icon's components, for consumers that avoid barrels         | Partial |
| `./brands`        | Brand components                                                | Empty   |
| `./svg/*`         | Raw SVG files (`svg/line/<name>.svg`, `filled`, `sm`, `brands`) | Partial |
| `./sprite.svg`    | The SVG sprite, one `<symbol>` per drawing                      | Partial |
| `./metadata.json` | Merged metadata of every icon and brand                         | Partial |

Every subpath is built, exported and checked on every pull request. **Partial** ones hold
the 148 icons drawn so far; **Empty** ones hold nothing until their first drawing.

```
@bymax-one/icons ──► @bymax-one/icons/icons/<name> ──► @bymax-one/icons/runtime ──► react (peer)
 (every component)    (one icon's components)          (Icon base, createIcon)
        │                                                        │
        └────────────────────────────────────────────────────────┴──► @bymax-one/icons/meta
                                                                       (typed metadata, no React)
```

Every subpath imports its siblings by package specifier, not by relative path. Each entry
point is a separate bundle, and a module reached from two of them by a relative path would
be copied into each; through the specifier the published package holds one copy of each
icon, of the runtime and of the grid. The runtime has an entry of its own because every icon
module imports `createIcon`, and the root re-exports every icon. Every JavaScript subpath
ships ESM (`.mjs`) and CommonJS (`.cjs`), each with its own declarations (`.d.ts` and
`.d.cts`).

### Install

```bash
pnpm add @bymax-one/icons react
```

### Peer dependency matrix

| Package | Version    | Needed by               |
| ------- | ---------- | ----------------------- |
| Node.js | `>=24.0.0` | Tooling and builds      |
| `react` | `^19.0.0`  | The root and `./brands` |

---

## 🚀 Quick Start

```bash
# pnpm
pnpm add @bymax-one/icons react

# npm
npm install @bymax-one/icons react

# yarn
yarn add @bymax-one/icons react
```

The grid is available now, from the React-free entry:

```typescript
import { ICON_GRID } from '@bymax-one/icons/meta'

// Rendering at 48 px doubles every unit of the 24 px master.
const scale = 48 / ICON_GRID.size
const visualStroke = ICON_GRID.strokeWidth * scale
```

Every icon is a component, from the root or from its own subpath:

```tsx
import { SearchIcon } from '@bymax-one/icons'
import { SettingsIcon } from '@bymax-one/icons/icons/settings'

export function Toolbar() {
  return (
    <nav aria-label="Tools">
      <button type="button" aria-label="Search">
        <SearchIcon size={20} />
      </button>
      <SettingsIcon size={20} title="Settings" />
    </nav>
  )
}
```

An icon inside a labelled button is silent (`aria-hidden="true"`), because the button carries
the name; `title` makes an icon a named image of its own. `createIcon` makes a component from
any drawing held as data, the same way the generated icons are made:

```tsx
import { createIcon } from '@bymax-one/icons'

const MinusIcon = createIcon('minus', [['line', { x1: 4.75, y1: 12.25, x2: 19.25, y2: 12.25 }]])
```

See [Example Integration](./docs/technical_specification.md#15-example-integration) in the
specification for an example.

---

## ⚙️ Configuration

There is no global configuration, by design. Each icon is configured through its own props,
and a set-wide default comes from CSS (`color`, `width` and `height` on a wrapper class),
which needs no client boundary. A context provider for default size or colour is deliberately
not offered.

| Planned prop          | Default        | Description                                                  |
| --------------------- | -------------- | ------------------------------------------------------------ |
| `size`                | `24`           | Width and height                                             |
| `strokeWidth`         | `1.5`          | Stroke width at 24 px; ignored by filled and brand icons     |
| `absoluteStrokeWidth` | `false`        | Keeps the visual stroke width constant at every size         |
| `color`               | `currentColor` | Colour of the drawing                                        |
| `title`               | none           | Accessible name; when present the icon is announced as image |

---

## 📐 Design Language

These rules are the identity of the set. They apply to every icon and are checked by lint
where a machine can check them.

### Grid

- `viewBox="0 0 24 24"`, with a 20 × 20 live area (2 px padding). Large round shapes may
  reach 21 × 21.
- The 24 px drawing is the master for every icon. The 16 px masters are separate drawings.

### Stroke

- **1.5 px** at 24 px, round caps, round joins.
- Straight strokes sit on `.25` / `.75` coordinates so they render sharp at 1x and 2x.

### Corners

- Continuous-curvature (squircle) corners: radius 2.5 on shapes 10 px or larger, 1.25 on
  smaller shapes, 0 where three or more strokes meet.

### Signature details

- **Overlap knockout.** A modifier (plus, slash, badge, check) cuts the base shape with a
  uniform 1.5 px gap, and always sits in the bottom-right 10 × 10 quadrant.
- **Spark dot.** A 2 px filled dot, the only fill allowed in a line icon, marks "generated",
  "AI" or "new" from the same top-right position.
- **Recessed terminals.** Open strokes stop 0.5 px short of the live-area edge.

### Theme behaviour

Line and filled icons use `currentColor` only. They carry no colour of their own and work
on light and dark themes without variants; contrast is the consumer's text colour.

---

## ✍️ Originality

The drawings are not someone else's, and the process makes that verifiable: every icon is
drawn from scratch with no third-party SVG pasted, traced or modified; every pull request
that changes a drawing carries an originality attestation; each drawing batch keeps its
contact sheets in the repository history; and CI compares each new icon with the most
adopted open-source sets, flagging a close match for human review. The full policy is in
[`CONTRIBUTING.md`](./CONTRIBUTING.md#drawing-originality).

---

## 🏗️ Architecture

The pipeline runs from `pnpm generate` (the sources to `src/**/generated`, committed) and
`pnpm build` (tsup, then the static outputs). Its logic lives in `src/pipeline/`, tested
at 100% coverage and mutation like the runtime; the scripts in `scripts/` are thin entries,
which Node 24 runs directly with its native type stripping.

```
          icons/line/<name>.svg          icons/meta/<name>.json
          icons/filled/  sm/  brands/    (tags, categories, aliases)
                       │                          │
                       ▼                          │
        ┌──────────────────────────────┐          │
        │  Normalise                   │          │
        │  SVGO, fixed root attributes │          │
        │  icon lint (+ ajv schemas)   │          │
        └──────────────┬───────────────┘          │
                       ▼                          ▼
        ┌─────────────────────────────────────────────────┐
        │  Generate  (pnpm generate, src/pipeline)        │
        │  one TypeScript module per icon variant,        │
        │  elements held as data: no JSX strings,         │
        │  no dangerouslySetInnerHTML                     │
        └──────────────────────┬──────────────────────────┘
                               ▼
        ┌─────────────────────────────────────────────────┐
        │  Bundle  (tsup)                                 │
        │  one entry per icon, root, runtime, meta, brands│
        │  ESM + CJS, .d.ts + .d.cts, siblings external   │
        └───────┬───────────────┬───────────────┬─────────┘
                ▼               ▼               ▼
         React components   dist/svg/**     dist/sprite.svg
         on the Icon base   raw SVG files   dist/metadata.json
                │
                ▼
         Server Components and client components alike:
         no hooks, no context, no 'use client'
```

Generated modules are rebuilt from source in CI and compared with the committed copy, so a
stale copy fails the build. The org package checks then run on the packed tarball.

### Design Principles

| Principle                        | Description                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| ✏️ **Original drawings**         | Every non-brand glyph is drawn from scratch; similarity with other sets is checked, not assumed    |
| 📏 **One grid, one stroke**      | Every icon obeys the same grid and stroke rules, and the machine-checkable ones are linted         |
| 🧾 **Data, not markup strings**  | Components build their elements from data, so no icon path ever passes through an HTML parser      |
| 🌳 **One module per icon**       | Per-icon ES modules tree-shake, and sibling modules are external to each other so each exists once |
| 🔇 **Silent by default**         | A decorative icon is hidden from assistive technology; a `title` makes it a named image            |
| 🖥️ **Server-first**              | Pure functions with no hooks or context render in Server Components without a client boundary      |
| 📦 **Zero runtime dependencies** | `react` is a peer; nothing else is installed with the package                                      |

---

## 🔐 Security Model

An icon set is markup that consumers render inside their own pages, so what matters is that
nothing it ships can carry executable content or reach outside the drawing. The properties
below are fixed by the specification; each is enforced from the phase that builds the part
it protects. The runtime enforces the first and the third today; the pipeline and the
preview do not exist yet.

### Elements are built from data

Each generated module holds its drawing as a list of elements and attributes, and the
component creates those elements through React. There is no JSX string, no
`dangerouslySetInnerHTML` and no runtime parsing of SVG text, so a path never passes through
an HTML parser in the consumer's page. An icon also drops a consumer's `children` and
`dangerouslySetInnerHTML`, so no prop can add content to the drawing.

### Only drawing elements are allowed

The SVG lint admits `path`, `line`, `polyline`, `polygon`, `circle`, `ellipse` and `rect`,
and refuses `transform`, `style`, `id`, `class`, `filter`, `<use>`, gradients and masks.
Scripts, `foreignObject`, event handlers and external references therefore cannot enter a
source file, and the raw SVG outputs and the sprite are built from the same checked sources.

### Consumer text stays text

The accessible `title` becomes an `aria-label` value and the text of a `<title>` child. It
is never interpreted as markup.

### Nothing is installed with the package

`dependencies` is empty and `react` is a peer, so installing the package adds no third-party
code to a consumer's tree. Releases are published from CI with npm provenance.

### Pull-request previews run no pull-request code

The rendered preview on drawing pull requests follows the safe `pull_request_target`
pattern: the base branch is checked out, the changed SVGs are read with `git show`, and no
code from the pull request is executed with repository credentials.

---

## 🛡️ Security Table

| Layer           | Implementation                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Rendering       | Elements created from data through React; no HTML strings, no `dangerouslySetInnerHTML`                |
| SVG sources     | Allow-listed drawing elements only; no `transform`, `style`, `id`, `class`, `filter`, `<use>` or masks |
| Accessible name | `title` is rendered as text and an attribute value, never as markup                                    |
| Supply chain    | `dependencies: {}`; third-party Actions pinned by commit SHA (org reusables by tag); CodeQL, Scorecard |
| Release         | Tag-driven, `npm-publish` environment approval, OIDC trusted publishing with provenance                |

> [!IMPORTANT]
> **The guarantees cover what this package ships.** SVG that a consuming application builds
> or inlines itself around an icon is outside them.

---

## 🧱 Tech Stack

- **Runtime:** any React 19 renderer, including React Server Components
- **Tooling:** Node.js 24+, pnpm 11
- **Build:** tsup, ESM + CJS per subpath with `.d.ts` _and_ `.d.cts` declarations, browser
  entries targeting `es2022` with the automatic JSX runtime
- **Tests:** Jest + Stryker (mutation)
- **TypeScript:** 5.x strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), zero
  `any`

---

## 🧪 Testing & Quality

An icon set is rendered on every screen of every product that uses it, so a regression in
it is a regression everywhere at once. The suite is held to a bar beyond "the tests pass".

- ✅ **100% line coverage**: statements, branches, functions and lines, enforced as a gate
  in both Jest configs
- ✅ **Mutation testing at `break: 100`**: [Stryker](https://stryker-mutator.io/) runs on
  every push to `main` and cold once a week; a surviving mutant fails the run
- ✅ **Published-artifact gates**: `check:exports` resolves the types the way each module
  system does, `check:runtime` loads every subpath from the packed tarball in ESM and
  CommonJS and renders a fixture icon from it through `react-dom/server` and as a Server
  Component, `check:published` compiles this README's snippets against `dist/`, and
  `check:api` requires an "Apply to a derived backend" CHANGELOG note when the built
  declarations change
- ✅ **Bundle size budget** per subpath, measured on the brotli-compressed bundle
- ✅ **Every icon renders**: a smoke test driven by the generated metadata renders every
  component, aliases included, in jsdom and in `react-dom/server` and checks the default
  accessibility attributes
- ✅ **Icon lint**: `pnpm lint:icons` checks the allowed elements and attributes, the fills
  and the spark-dot exception, three-decimal precision, the live area, kebab-case names,
  the metadata schemas, alias and component-name uniqueness, declared variants and brand
  names; `pnpm check:generated` fails when a generated module is stale
- ✅ **Fixture package**: `pnpm check:fixtures` builds a copy of the package on placeholder
  icons and runs the generator, the smoke test and every package gate on it
- ✅ **Visual regression**: `pnpm check:visual` renders every icon at 16, 20, 24 and 48 px,
  light and dark, and compares it pixel by pixel with committed baselines
- ✅ **Similarity check**: `pnpm similarity` compares every icon, normalised for position,
  size and stroke, with Lucide, Tabler, Phosphor and Heroicons, and flags a close match for
  review; a pull request that changes a drawing gets a rendered preview comment with it

```bash
pnpm test          # unit suite
pnpm test:cov      # unit suite with the 100% coverage gate
pnpm mutation      # Stryker mutation testing (break: 100)
pnpm typecheck     # tsc strict check
pnpm lint          # ESLint
pnpm lint:icons    # the icon lint over icons/
pnpm generate      # format the sources and write src/**/generated
pnpm contact-sheet # render every drawing to reports/contact-sheet.png
pnpm family-sheet  # render the whole set by category to reports/family-sheet.png
pnpm similarity    # compare every drawing with four open-source sets, under reports/similarity
pnpm check:visual  # compare every drawing with its baseline under visual/ (--update rewrites)
```

---

## 📖 API Reference

### `ICON_GRID`

Exported from `@bymax-one/icons/meta` and re-exported from `@bymax-one/icons`. A frozen
object whose values are literal types.

| Key              | Value         | Meaning                                      |
| ---------------- | ------------- | -------------------------------------------- |
| `viewBox`        | `'0 0 24 24'` | The `viewBox` of every icon's root `<svg>`   |
| `size`           | `24`          | Width and height of the master canvas, in px |
| `liveArea`       | `20`          | Width and height a drawing may occupy, in px |
| `padding`        | `2`           | Space between the live area and each edge    |
| `strokeWidth`    | `1.5`         | Stroke width of a line icon at 24 px         |
| `strokeLinecap`  | `'round'`     | Cap applied to the open ends of every stroke |
| `strokeLinejoin` | `'round'`     | Join applied where two stroke segments meet  |

### `IconGrid`

The type of `ICON_GRID`, exported from both subpaths.

### `IconProps`

The props of every icon component. Every other SVG attribute, `className`, `style`, `data-*`
attribute and event handler is passed to the `<svg>`, and one the consumer names overrides
the default of the same name.

| Prop                  | Type                 | Default        | Behaviour                                                                                          |
| --------------------- | -------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| `size`                | `number \| string`   | `24`           | Width and height; a number is px, a string any CSS length                                          |
| `strokeWidth`         | `number \| string`   | `1.5`          | Stroke width at 24 px; ignored by filled and brand icons                                           |
| `absoluteStrokeWidth` | `boolean`            | `false`        | Writes `strokeWidth * 24 / size`; a CSS-length `size` such as `'1em'` keeps `strokeWidth` as given |
| `color`               | `string`             | `currentColor` | The stroke (or fill) colour; drawing details in `currentColor` follow it                           |
| `title`               | `string`             | none           | Gives `role="img"`, `aria-label` and a `<title>` child; an empty title counts as none              |
| `ref`                 | `Ref<SVGSVGElement>` | none           | A regular prop (React 19)                                                                          |

Without a title the icon is `aria-hidden="true"`; any `role` or `aria-*` prop with a value
suppresses that default. Every icon defaults to `focusable="false"`.

### `createIcon(name, iconNode, options?)`

Creates a named icon component from a drawing. `name` is kebab-case (a `TypeError`
otherwise) and gives the component's `displayName` (`lightning-filled` becomes
`LightningFilledIcon`) and the class names `bx-icon bx-icon-<name>`, which come before the
consumer's `className`. `options.paint` is `'stroke'` (the default, for line icons) or
`'fill'` (filled icons and brand marks: filled in `color`, no stroke attributes).

### `Icon`

The base every component renders through, for a drawing of your own:
`<Icon iconNode={...} paint="fill" />` takes the `IconProps` plus `iconNode` and `paint`.

### Drawing types

`IconNode` is a list of `IconElement` tuples, `[tag, attributes]`. `IconElementTag` is
limited to `path`, `line`, `polyline`, `polygon`, `circle`, `ellipse` and `rect`, and
`IconAttributeName` to their geometry plus `fill`, `fillRule` and `clipRule`.

### Metadata (`@bymax-one/icons/meta`)

Frozen data with no React import, generated from `icons/meta` and `categories.json`.

| Export            | Type                                         | Contents                                                     |
| ----------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `ICON_NAMES`      | `readonly IconName[]`                        | Every icon name, in name order                               |
| `ICON_METADATA`   | `Readonly<Record<IconName, IconMetadata>>`   | Tags, categories, use cases, aliases, variants, sizes, since |
| `BRAND_NAMES`     | `readonly BrandName[]`                       | Every brand name, in name order                              |
| `BRAND_METADATA`  | `Readonly<Record<BrandName, BrandMetadata>>` | Title, source, guidelines, license, retrieval date, aliases  |
| `ICON_CATEGORIES` | `readonly IconCategory[]`                    | The categories with their titles                             |

`IconName`, `BrandName` and `IconCategoryName` are the unions of the generated names, and
`IconAlias`, `IconMetadata`, `BrandMetadata`, `IconCategory` and `IconVariant` the shapes
of the records. `metadata.json` holds the same records.

### Planned surface

The components (`LightningIcon`, `LightningFilledIcon`, `LightningSmIcon`,
`GoogleBrandIcon`) are specified in the [Public API](./docs/technical_specification.md#8-public-api) section of
the specification, generated by the pipeline, and documented here as each drawing ships.

---

## 🚫 What This Library Does NOT Do

1. **No icon font.** Fonts cost accessibility and tree-shaking; SVG covers every use.
2. **No Vue, Svelte or Angular component packages.** The raw SVG output covers those
   consumers. React Native components are planned as the `./native` subpath, after 1.0.
3. **No context provider for default size or colour.** CSS does the same without a client
   boundary.
4. **No coloured or multi-colour icons**, apart from the optional `google-color` mark.
5. **No third-party drawings** other than brand marks.
6. **No dynamic loading by name at runtime.** A `<DynamicIcon name="...">` defeats
   tree-shaking; map names to components explicitly.

---

## 🤝 Contributing

Pull requests are welcome. Please open an issue first for significant changes.

- Read [`docs/technical_specification.md`](./docs/technical_specification.md) for the design
  language and architecture decisions.
- Run the full gate listed in [`CONTRIBUTING.md`](./CONTRIBUTING.md), including the drawing
  originality rules, before opening a PR.
- Conventional Commits are enforced by `commitlint.config.cjs`.

---

## 🔒 Security Policy

If you discover a security vulnerability, please **do not** open a public
issue. Instead, email us at **support@bymax.one** with `[security]
@bymax-one/icons` in the subject. We take security seriously and will
respond promptly. See [`SECURITY.md`](./SECURITY.md) for the full policy.

---

## 📄 License

[MIT](./LICENSE) © [Bymax One](https://github.com/bymaxone)

Brand marks are excluded from the MIT grant and belong to their owners; see
[`TRADEMARKS.md`](./TRADEMARKS.md).

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/bymaxone">Bymax One</a></sub>
</p>
