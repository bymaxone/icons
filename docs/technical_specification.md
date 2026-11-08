# @bymax-one/icons: Complete Technical Specification

> **Version:** 1.0.0
> **Last updated:** 2026-11-08
> **Status:** Approved for implementation (2026-11-08)
> **Type:** Public npm package (`@bymax-one/icons`)

---

## Table of Contents

1. [Vision and Value Proposition](#1-vision-and-value-proposition)
2. [Design Language](#2-design-language)
3. [Originality Policy](#3-originality-policy)
4. [Icon Inventory](#4-icon-inventory)
5. [Brand Icons](#5-brand-icons)
6. [Source Layout and Metadata](#6-source-layout-and-metadata)
7. [Build Pipeline](#7-build-pipeline)
8. [Public API](#8-public-api)
9. [Catalog Site](#9-catalog-site)
10. [What is NOT in the package](#10-what-is-not-in-the-package)
11. [Dependencies and Packaging](#11-dependencies-and-packaging)
12. [Quality Gates](#12-quality-gates)
13. [Repository Standard](#13-repository-standard)
14. [Known Limitations](#14-known-limitations)
15. [Example Integration](#15-example-integration)
16. [Implementation Phases](#16-implementation-phases)
17. [Resolved Decisions](#17-resolved-decisions)

---

## 1. Vision and Value Proposition

### 1.1 What it is

`@bymax-one/icons` is a public icon set with its own drawings, shipped as React components, raw SVG files, an SVG sprite and typed metadata. Every non-brand glyph is an original Bymax drawing built on one grid and one set of rules, so the products that use it do not look like every other app built on the same open-source set.

### 1.2 Why it exists

Most modern React products draw their interface from the same two or three icon sets, most of all Lucide (`lucide-react` reached about 131 million weekly downloads in the week of 2026-11-01). The result is recognisable: the same house, the same gear, the same sparkle in every product. Bymax products (Studio, Bio, Life, Fitness, Daily, Run, Click) need an identity of their own, and the Studio needs concepts no general set draws well: scene, shot, keyframe, credit, spending cap, lip-sync, version.

The package keeps every engineering advantage the most adopted sets offer:

- one source SVG plus one metadata file per icon;
- named aliases with deprecation;
- per-icon ES modules that tree-shake;
- an accessible default;
- a searchable catalog;
- lint, visual regression and preview tooling on every pull request.

The drawings themselves are new.

### 1.3 Who uses it

- Bymax web apps (Next.js 16, React 19), first of all `bymax-studio-web`.
- Bymax landing pages and email templates, through the raw SVG and sprite outputs.
- Bymax mobile apps (Expo), through raw SVG via `react-native-svg`. A native component package is out of scope for 1.0 (see section 10).
- Any public consumer who wants the set, under MIT.

### 1.4 Distribution Model

| Aspect              | Detail                                                                   |
| ------------------- | ------------------------------------------------------------------------ |
| Registry            | Public npm (`@bymax-one/icons`)                                          |
| Repository          | `github.com/bymaxone/icons` (public)                                     |
| License             | MIT for code and original drawings; brand marks excluded (see section 5) |
| Runtime             | Any React 19 renderer, including React Server Components                 |
| Node (tooling)      | Node.js 24+                                                              |
| Direct dependencies | Zero                                                                     |

### 1.5 Reference model

Lucide is the reference for engineering and process: repository layout, metadata schema, guidelines, lints and the preview bot. Where Lucide and the `@bymax-one` library standard differ, the standard wins. Concretely: tsup instead of Rollup, a hand-written changelog and tag releases instead of a daily cron, 100% coverage and mutation gates, and the shared `bymaxone/.github` workflows.

---

## 2. Design Language

These rules are the identity of the set. They are applied to every icon and checked by lint where a machine can check them.

### 2.1 Grid

- `viewBox="0 0 24 24"`.
- Live area 20 × 20 (2 px padding). Large round shapes may reach 21 × 21.
- Optical masters: **24** is the master for every icon. A hand-tuned **16** master exists for the icons used in dense UI (about 40, see section 4.2); it is a separate drawing, not a scaled copy.

### 2.2 Stroke

- **1.5 px** at 24 px, round caps, round joins.
- Straight strokes sit on `.25` / `.75` coordinates so they render sharp at 1x and 2x.
- The 16 master uses 1.5 px absolute stroke with fewer details and a 1 px minimum gap.

### 2.3 Corners

- Continuous-curvature (squircle) corners, not circular arcs. This echoes the glass cards of the Estúdio de Vidro design system.
- Radius 2.5 on shapes 10 px or larger, 1.25 on smaller shapes, 0 where three or more strokes meet.

### 2.4 Signature details

1. **Overlap knockout.** Where a modifier (plus, slash, badge, check) overlaps a base shape, the base is cut with a uniform 1.5 px gap. Modifiers always sit in the bottom-right 10 × 10 quadrant.
2. **Spark dot.** A 2 px filled dot is the only fill allowed in a line icon. It marks "generated", "AI" or "new", and always sits at the same top-right position.
3. **Recessed terminals.** Open strokes stop 0.5 px short of the live-area edge.

### 2.5 Optical balance

- A 20 px circle, an 18 px square and a 21 px-tall triangle read as the same size.
- Asymmetric icons are centred by visual mass, not by bounding box.
- Every icon passes a blur test at 16 px: the silhouette must still read.

### 2.6 Filled variant

- Same outer silhouette as the line icon, so switching causes no size jump.
- Interior details are knocked out at 1.5 px.
- Drawn only for icons with a stateful meaning (active tab, selected item, favourite, playing). Expected count about 40.

### 2.7 Theme behaviour

- Line and filled icons use `currentColor` only. They carry no colour of their own and work on light and dark themes and on all six Studio accents without variants.
- Contrast is the consumer's responsibility through text colour tokens.

---

## 3. Originality Policy

The reason the package exists is that its drawings are not someone else's. The policy makes that verifiable.

1. **Drawn from scratch.** No third-party SVG is pasted, traced or modified to create a Bymax icon. Third-party sets are never open in the working file of a new drawing.
2. **Attestation.** Every pull request that adds or changes a drawing carries a checkbox: "This drawing is an original Bymax work." The PR template makes it mandatory.
3. **Process evidence.** Each drawing batch keeps its contact sheets (section 16) in the repository history, so the evolution of every icon is traceable.
4. **Similarity check in CI.** Each new or changed icon is rasterised and compared against Lucide, Tabler, Phosphor and Heroicons (all MIT or ISC, installed as dev dependencies for this purpose only). A close match is flagged for human review, not failed automatically.
5. **Primitive glyphs.** Plus, close, chevrons and arrows will inevitably coincide with every other set. That is expected; the check matters for composite pictograms.

---

## 4. Icon Inventory

### 4.1 Version 1.0

About 125 non-brand icons, roughly 85 common concepts (C) and 40 Studio concepts (S), plus 16 brands.

| Category            | Icons                                                                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation          | home, dashboard, folder-stack, library, templates, menu, sidebar, chevron-up, chevron-down, chevron-left, chevron-right, arrow-left, arrow-right, arrow-up-right, search, settings (C)                   |
| Actions             | plus, close, check, pencil, trash, copy, duplicate, download, upload, share, link, more-horizontal, more-vertical, undo, redo, refresh, filter, sort, grip, pin (C)                                      |
| Media and video     | play, pause, stop, skip-back, skip-forward, loop, fullscreen, minimize, video, camera, scissors (C); scene, shot, keyframe, frame, extend, render, export-video, timeline, transition, camera-motion (S) |
| Audio and voice     | mic, mic-off, volume, volume-off, music, waveform, captions (C); voice, lip-sync, narration (S)                                                                                                          |
| Files               | file, file-video, file-audio, image, folder, paperclip (C); reference-card, asset (S)                                                                                                                    |
| Status              | check-circle, alert-triangle, alert-circle, info, loader, clock, cloud-check, lock, eye, eye-off, history (C); queued, repair, version (S)                                                               |
| Credits and billing | wallet, card, receipt, gift (C); lightning, lightning-stack, spending-cap, plan (S)                                                                                                                      |
| People and roles    | user, users, user-plus, crown, mail-invite, log-in, log-out (C); character, role (S)                                                                                                                     |
| Formats             | aspect-16-9, aspect-9-16, aspect-1-1, aspect-4-5, duration, resolution (S)                                                                                                                               |
| Editor and canvas   | layers, crop, move, zoom-in, zoom-out, hand, cursor, text, align-center, grid, palette, brush, eraser, split (C); mask (S)                                                                               |
| AI and agent        | sparkle (C); polvi, agent, prompt, generate, regenerate, variations, storyboard, script, style (S)                                                                                                       |
| System              | bell, message, help, feedback, sun, moon, monitor, globe, keyboard, command (C); accent (S)                                                                                                              |

### 4.2 16 px masters

The icons that appear at 16 px in the Studio shell: navigation, the most common actions, status, the credit lightning and the bell. The exact list is fixed at the end of batch B2 from real usage in the Studio replica.

### 4.3 Naming

- kebab-case, American English, named for what is depicted (`lightning`, not `credits`). Product meanings live in aliases (`lightning` has the alias `credit`).
- Modifiers follow the base: `user-plus`, `mic-off`, `file-video`.
- Formats use digits: `aspect-16-9`.
- A rename keeps the old name as a deprecated alias with `toBeRemovedInVersion`; it is never a silent break.

---

## 5. Brand Icons

Brand marks are the only third-party shapes in the package.

- **Shape:** official geometry only, scaled into the live area, filled, monochrome `currentColor`. No line versions, no restyling, because modifying a logo breaks most brand guidelines.
- **Source:** path data from Simple Icons (CC0-1.0) where available, credited in `TRADEMARKS.md` even though CC0 does not require it.
- **Per-brand metadata:** `source`, `guidelines`, `license`, `retrievedAt`.
- **Notice:** `TRADEMARKS.md` states that marks belong to their owners, imply no endorsement, and are excluded from the MIT grant.
- **List for 1.0:** google, apple, github, microsoft; youtube, tiktok, instagram, facebook, linkedin, x, threads, pinterest, vimeo; whatsapp, spotify, discord.
- **Google:** the monochrome G is the default (Studio decision 103). Google's "Sign in with Google" branding guidelines require the standard colour G on the sign-in button and list monochrome versions as a "Don't". The risk is accepted by the founder and recorded in the Studio. An optional `google-color` mark ships for the sign-in button (D3).

---

## 6. Source Layout and Metadata

### 6.1 Repository layout

```
icons/
  line/<name>.svg          original line drawings (source of truth)
  filled/<name>.svg        filled variants, where declared
  sm/<name>.svg            16 px masters, where declared
  brands/<name>.svg        brand marks
  meta/<name>.json         metadata, one per icon name
schemas/                   JSON Schemas for icon, brand and category metadata
categories.json            category list with titles
src/                       runtime (Icon base, props, a11y) and generated modules
scripts/                   generator, lint, similarity, render, org check scripts
site/                      static catalog
docs/                      specification, plan, tasks, design guidelines
```

### 6.2 Metadata

```json
{
  "$schema": "../../schemas/icon.schema.json",
  "tags": ["energy", "power", "credit", "balance"],
  "categories": ["credits-billing"],
  "useCases": ["Credit balance pill in the top bar", "Cost shown before a generation"],
  "aliases": [{ "name": "credit", "deprecated": false }],
  "variants": ["line", "filled"],
  "opticalSizes": [24, 16],
  "since": "1.0.0"
}
```

- `tags`, `categories` and `useCases` are required. At least two real use cases per icon.
- Aliases follow Lucide's shape: `{ name, deprecated, deprecationReason?, toBeRemovedInVersion? }`.
- The schemas are validated with ajv in CI.

### 6.3 SVG code rules

- Root attributes are fixed and written by the formatter, never by hand.
- Allowed elements: `path`, `line`, `polyline`, `polygon`, `circle`, `ellipse`, `rect`.
- No `transform`, `style`, `id`, `class`, `filter`, `<use>`, gradients or masks.
- Line icons: no fill except the spark dot (a `circle` with `r="1"` and `fill="currentColor"`).
- Coordinates at most 3 decimals and inside the live area.

---

## 7. Build Pipeline

1. **Normalise.** SVGO with `preset-default`, `convertShapeToPath: false`, `mergePaths: false`, and fill/stroke attributes stripped from line icons. Prettier formats the result.
2. **Generate.** `scripts/generate.mjs` reads the SVGs and metadata and writes one TypeScript module per icon variant under `src/icons/generated/`, holding the element list as data (no JSX strings, no `dangerouslySetInnerHTML`).
3. **Bundle.** tsup builds one entry per icon module, the root barrel and the other subpaths, ESM and CJS with `.d.ts` / `.d.cts`. Sibling modules are external to each other so each icon exists once.
4. **Static outputs.**
   - `dist/svg/{line,filled,sm,brands}/<name>.svg` with the root attributes applied.
   - `dist/sprite.svg` with one `<symbol id="bx-<name>">` per icon.
   - `dist/metadata.json` with the merged metadata of every icon.
5. **Verify.** The org package checks run on the packed tarball (section 12).

Generated modules are rebuilt from source in CI and compared with the committed copy; a stale copy fails the build.

---

## 8. Public API

### 8.1 Subpath exports

| Subpath                          | Contents                                                      |
| -------------------------------- | ------------------------------------------------------------- |
| `@bymax-one/icons`               | Every line and filled component, plus `Icon` and the types    |
| `@bymax-one/icons/icons/<name>`  | One icon's components, for consumers that avoid barrels       |
| `@bymax-one/icons/brands`        | Brand components                                              |
| `@bymax-one/icons/meta`          | Typed metadata and the `IconName` union, with no React import |
| `@bymax-one/icons/svg/*`         | Raw SVG files                                                 |
| `@bymax-one/icons/sprite.svg`    | The sprite                                                    |
| `@bymax-one/icons/metadata.json` | Merged metadata                                               |

### 8.2 Component naming

- Line: `LightningIcon`. Filled: `LightningFilledIcon`. 16 px master: `LightningSmIcon`. Brands: `GoogleBrandIcon`.
- The `Icon` suffix is always present so names never collide with application components such as `Image`, `Link` or `Video`.
- Aliases export the same component under the alias name (`CreditIcon`), marked `@deprecated` in JSDoc when the alias is deprecated.

### 8.3 Props

```ts
interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Width and height. Default 24. */
  size?: number | string
  /** Stroke width at 24 px. Default 1.5. Ignored by filled and brand icons. */
  strokeWidth?: number | string
  /** Keep the visual stroke width constant at every size. */
  absoluteStrokeWidth?: boolean
  /** Colour. Default currentColor. */
  color?: string
  /** Accessible name. When present the icon is announced as an image. */
  title?: string
  ref?: Ref<SVGSVGElement>
}
```

- `absoluteStrokeWidth` computes `strokeWidth × 24 / size`.
- `ref` is a regular prop (React 19); no `forwardRef`.

### 8.4 Server Components

Components are pure functions with no hooks, no context and no `'use client'` directive, so they render in Server Components and in client components alike. A context-based default provider is deliberately not offered (see section 10).

### 8.5 Accessibility

- Default: `aria-hidden="true"` and `focusable="false"`. A decorative icon next to a text label is silent.
- With `title`: `role="img"`, `aria-label` set to the title, and a `<title>` child for the native tooltip. No generated ids are needed.
- If the consumer passes any `aria-*` attribute or `role`, the default `aria-hidden` is not applied.
- An icon-only button must name the button, not the icon; the README shows the pattern.

---

## 9. Catalog Site

A static site in `site/` that is part of the repository and its CI:

- Search over name, tags and aliases, filtered by category.
- Controls for size (16, 20, 24, 32), stroke, variant, light and dark theme, and the six Studio accents.
- Copy SVG, copy JSX, copy name.
- Each icon page lists its use cases and aliases.
- It uses the package's own build output, so it doubles as a consumer test.

It is published with GitHub Pages on `icons.bymax.one` (D4).

---

## 10. What is NOT in the package

- No icon font. Fonts cost accessibility and tree-shaking; SVG covers every use.
- No Vue, Svelte, Angular or React Native component packages in 1.0. Raw SVG covers those consumers; a native package is a later decision.
- No context provider for default size or colour. CSS (`color`, `width`, `height` on a wrapper class) does the same without a client boundary.
- No coloured or multi-colour icons, apart from the optional `google-color` mark (D3).
- No third-party drawings other than brand marks.
- No dynamic loading by name at runtime (`<DynamicIcon name="...">`). It defeats tree-shaking; consumers map names to components explicitly.

---

## 11. Dependencies and Packaging

- **Zero direct dependencies.** `react ^19.0.0` is a peer dependency, required by the root and `brands` subpaths and not imported by `meta`.
- **Formats:** ESM `.mjs` and CJS `.cjs`, with `.d.ts` and `.d.cts`, per the `@bymax-one` export map shape (types per condition, `typesVersions`, `./package.json` exported).
- `"sideEffects": false`, `"type": "module"`, `files: ["dist", "LICENSE", "README.md", "CHANGELOG.md", "TRADEMARKS.md"]`.
- `publishConfig`: public, provenance, npm registry.
- **Engines:** `node >= 24.0.0`, `packageManager: pnpm@11.20.0`.
- Browser entries target `es2022` with `jsx: 'automatic'`.

---

## 12. Quality Gates

| Gate               | Tool / Threshold                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type safety        | TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; zero `any`                                                                     |
| Lint               | ESLint flat config of the family, with the TSX block                                                                                                        |
| SVG lint           | `scripts/lint-icons.mjs`: section 6.3 rules, file names, metadata schema, alias and name uniqueness, declared variants exist, brand names only in `brands/` |
| Unit coverage      | Jest, **100%** line, branch, function and statement on the runtime and the generator, in both Jest configs                                                  |
| Every icon renders | A generated smoke test renders every component in jsdom and in `react-dom/server`, and checks the default accessibility attributes                          |
| Mutation testing   | Stryker `break: 100` on the runtime and the generator; generated modules excluded                                                                           |
| Visual regression  | resvg renders every icon at 16, 20, 24 and 48, light and dark; pixel diff against committed baselines                                                       |
| Similarity         | Section 3 check; flags for review                                                                                                                           |
| Bundle size        | `scripts/check-size.mjs`: one icon plus runtime at most 1.5 KiB brotli, each extra icon at most 0.6 KiB (targets calibrated after B0)                       |
| Package integrity  | `check:exports` (attw strict), `check:published`, `check:runtime`, `check:api`, dogfood smoke test from the packed tarball                                  |
| File length        | 800-line limit per source file                                                                                                                              |

A release is blocked unless every gate is green. Pull requests that touch drawings also get a rendered preview comment (Lucide's safe `pull_request_target` pattern: base branch checked out, SVGs read with `git show`, no PR code executed).

---

## 13. Repository Standard

The repository follows the `@bymax-one` library standard in full:

- `README.md` in the family layout (badges, overview, features, subpath exports, quick start, architecture, security, testing, API, contributing, license) with a visual icon grid at the top.
- `LICENSE` (MIT, Copyright (c) 2026 Bymax One), `TRADEMARKS.md`, `SECURITY.md` (support@bymax.one), `CHANGELOG.md` (Keep a Changelog, hand-written, lists icons added, renamed and deprecated), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1 by link).
- `CLAUDE.md` (agent quick reference) and `AGENTS.md`, which carries the shared review block between the sync markers.
- `docs/` in English: this specification, `development_plan.md`, `tasks/phase-*.md`, `AUTOPILOT.md`, and `guidelines/` (design principles, naming, metadata, code conventions).
- `.github/`: `ci.yml` calling `bymaxone/.github` `node-lib-ci.yml@v1` with a local `verify` job and the `CI passed` aggregate; `codeql.yml`, `scorecard.yml`, `osv-scanner.yml`, `peer-advisory-drift.yml`, `agents-sync.yml`, `mutation-full.yml`, `api-surface.yml`, `release.yml`; plus `icons-preview.yml` for the PR preview. Third-party actions pinned by SHA.
- `dependabot.yml` (npm and github-actions, weekly), issue templates, a PR template with the originality checkbox.
- husky, lint-staged, commitlint, `.gitmessage` with scopes `icons|brands|runtime|meta|site|build|deps|release`.
- Release: `chore(release): X.Y.Z` PR, tag `vX.Y.Z`, `npm-publish` environment approval, `npm publish --provenance` through OIDC. The first publish is manual.

---

## 14. Known Limitations

- About 125 icons at 1.0 against thousands in general sets. The set grows with Bymax products; it is not trying to cover every concept.
- One stroke family. Weights such as thin or bold are not offered; they would multiply the drawing work for every icon.
- The 16 px masters exist only for the dense-UI icons; the rest scale the 24 master.
- The similarity check finds close copies, not every resemblance. It supports the attestation; it does not replace it.

---

## 15. Example Integration

```tsx
import { LightningIcon, BellIcon } from '@bymax-one/icons'

export function CreditsPill({ balance }: { balance: string }) {
  return (
    <button type="button" className="credits-pill" aria-label={`Credits: ${balance}`}>
      <LightningIcon size={16} />
      <span>{balance}</span>
    </button>
  )
}
```

---

## 16. Implementation Phases

Engineering and drawing run as separate tracks. Each drawing batch ends with a gate: lint passes, a contact sheet at 16, 20, 24 and 48 on light and dark glass with the six accents, a family sheet beside earlier batches, the similarity report, and founder approval.

1. **P0 Repository and governance.** Org scaffold, CI, release workflow, docs, PR template. No icons yet.
2. **P1 Runtime.** `Icon` base, props, accessibility, stroke maths, tests at 100%.
3. **P2 Pipeline.** SVGO, generator, tsup entries, static outputs, SVG lint, metadata schemas.
4. **B0 Keystone icons (12).** home, search, play, plus, close, check, settings, user, file, folder, lightning, scene. The founder approves the design language here before anything else is drawn.
5. **P3 Visual tooling.** Contact sheets, visual regression, similarity check, PR preview bot.
6. **B1 Navigation, actions, status (about 35).**
7. **B2 Media, audio, files, editor (about 35).** Fixes the 16 px master list.
8. **B3 Studio, AI, formats, billing, Polvi (about 30).**
9. **B4 Filled variants (about 40), 16 px masters (about 40), brands (16).**
10. **P4 Catalog site.**
11. **P5 Hardening and release.** Size budgets, mutation to threshold, dogfood, first manual publish of 1.0.0, then trusted publishing.

The Studio adopts the package from B1 on, through a local link, and switches to the npm version at 1.0.0.

---

## 17. Resolved Decisions

Approved by the founder on 2026-11-08.

| #   | Question                                | Decision                                                                                                                                                           |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Who draws the icons?                    | Drawn as code on the grid in this repository and rendered to contact sheets for each gate. A human designer can take over any batch without changing the pipeline. |
| D2  | Stroke width?                           | 1.5 px at 24. It matches the light Studio interface and differs from Lucide's 2.                                                                                   |
| D3  | Colour Google mark?                     | Ship `google-color` as an optional brand extra for the sign-in button. The Studio keeps the monochrome default.                                                    |
| D4  | Catalog hosting?                        | GitHub Pages on `icons.bymax.one`.                                                                                                                                 |
| D5  | Does `bymax-studio-web` wait for 1.0.0? | No. It uses B0 and B1 through a local link while the frontend shell is built.                                                                                      |
