# Phase 2: pipeline

> **Status**: ✅ Done · **Progress**: 10 / 10 tasks · **Last updated**: 2026-11-10
> **Source roadmap**: [`../development_plan.md`](../development_plan.md) §5 (P2)
> **Source spec**: [`../technical_specification.md`](../technical_specification.md) §2, §5, §6, §7, §8.1, §8.2, §11, §12
>
> Every Definition of Done item of P2 is verified and the phase is merged (see the completion log).

---

## Context

This phase turns drawing and metadata sources into everything the package publishes, and guards every source with a lint. At its start the root exported the runtime (`Icon`, `createIcon`), `./meta` exported `ICON_GRID`, and nothing read an SVG.

What it delivers:

- **Sources**: `icons/{line,filled,sm,brands,meta}/` (empty, described by `icons/README.md`), `schemas/{icon,brand,category}.schema.json` (draft 2020-12) and `categories.json` (the categories of spec §4.1). Placeholder drawings for tests live in `fixtures/icons/`, never in `icons/`.
- **Pipeline code** in `src/pipeline/`, not exported and not a tsup entry, at 100% coverage and 100% mutation: the SVG parse and formatter (SVGO), the live-area bound (resvg), the metadata validation (ajv), the icon lint, the module and data emitters, the file operations and the contact sheet.
- **Generated modules**: `src/icons/generated/<name>/{index,line,filled,sm}.ts` (one module per variant, the drawing as an `IconNode` literal in one `/* @__PURE__ */ createIcon(...)` call), `src/icons/generated/index.ts` (the root's re-exports, by package specifier), `src/brands/generated/` and `src/meta/generated/metadata.ts` (data only, no import, so it passes the `src/meta` lint).
- **Subpaths**: `./runtime`, `./brands`, `./icons/*`, `./svg/*`, `./sprite.svg` and `./metadata.json`, with `exports`, `typesVersions`, tsup entries and gates.

### Decisions

**How the TypeScript pipeline runs.** Measured on Node 24.22.1: Node's native type stripping runs `.ts` files directly but resolves no extensionless relative specifier (`ERR_MODULE_NOT_FOUND`), and the rest of `src/` imports extensionless. With `allowImportingTsExtensions` in `tsconfig.json`, `.ts`-extension imports type-check under `tsc --noEmit`, build under tsup's declaration build, and run under ts-jest. So `src/pipeline/` imports its siblings with the `.ts` extension, and `scripts/generate.mjs`, `scripts/lint-icons.mjs` and `scripts/contact-sheet.mjs` import `src/pipeline/cli.ts` directly: no build step, no compiled copy to drift. The alternative, a tsup build into an ignored `build-tools/`, costs a build on every run and a second artifact.

**Why `./runtime` exists.** Every icon module calls `createIcon`; the root re-exports every icon module by package specifier, so that each icon exists once. With the runtime inside the root, the root and each icon module would import each other: in ESM the icon module evaluates first and calls `createIcon` before the root has initialised its constants; in CommonJS the cycle hands the icon module a partial `exports`. The runtime therefore has its own entry, `./runtime`, and the root re-exports it. This is the one addition to spec §8.1.

**The export map.** Every JavaScript subpath has per-condition `types` and `.mjs`/`.cjs` defaults, and a `typesVersions` entry; `./icons/*` maps to `dist/icons/*/index.*`. `./svg/*`, `./sprite.svg` and `./metadata.json` are plain file exports; `metadata.json` also has a `typesVersions` entry, without which attw's node10 resolution fails.

**Formatting.** The formatter is SVGO `preset-default` with `convertShapeToPath` and `mergePaths` off, `floatPrecision: 3`, colours kept as six-digit hex, every `stroke*` attribute stripped from the elements, every fill control stripped from stroked drawings except the spark dot's `fill`, and the kind's fixed root attributes. SVGO's pretty printer writes one element per line; Prettier has no SVG parser without a plugin, so it formats the generated TypeScript only, through `prettier/standalone` (the Node build loads its parsers with a dynamic `import()` that Jest runs only behind `--experimental-vm-modules`).

**The live area.** resvg measures the drawing with a 1 px round probe stroke, and the geometry is that box shrunk by half a pixel, so curves and arcs are bounded exactly. The lint enforces the hard limit, the 21 x 21 square centred on the canvas (spec §2.1); the 20 x 20 guideline for shapes that are not large and round is reviewed on the contact sheet.

**The empty set and the fixtures.** The repository holds no drawing, so every gate runs on the empty set on every pull request: the barrels export nothing and the sprite holds no symbol. `pnpm check:fixtures` copies the repository to a scratch directory with `fixtures/icons` in place of `icons/` and runs every gate there (the steps are in `scripts/check-fixture-package.mjs`). It never runs pnpm in the copy: its `node_modules` is a link to the repository's, and pnpm reinstalls a modules directory it finds installed for another project in place, through the link.

**Generated code exclusions.** `**/generated/**` is excluded from both Jest coverage configs and from Stryker's `mutate`, as `bymaxone/nest-auth` excludes its generated OpenAPI directory. `src/icons/render-smoke.spec.tsx` renders every generated component, aliases included, in jsdom and through `react-dom/server`; its list comes from the generated metadata and the naming rules, so it needs no generation of its own.

**The contact sheet (open question 1).** `pnpm contact-sheet` renders every drawing at 16, 20, 24 and 48 px on the light page (`#e9eff3`) and the dark page (`#101114`) of the Studio design system (`bymax-studio-web` `docs/preview/frontend/design-system.html`, direction A), in the ink and the six accents (the values are in `src/pipeline/contact-sheet.ts`). It writes `reports/contact-sheet.png` (ignored), one device pixel per CSS pixel. Each cell is a group translated into place and scaled from the 24 px master; a nested `<svg>` would be simpler, but resvg aborts the whole process (a Rust panic, not a JavaScript error) on a nested `<svg>` that lies outside the sheet.

### Deviations from the specification

1. `./runtime` is added to the subpaths of spec §8.1 (reason above).
2. Spec §7.1 says Prettier formats the normalised SVG; SVGO's pretty printer does, because Prettier has no SVG parser of its own.
3. Spec §7 says the stale-copy check rebuilds into a copy and compares; `pnpm check:generated` generates in memory and compares with the committed files, which detects the same missing, extra and different files without writing.
4. Spec §12 calls the render smoke test "generated"; it is a hand-written spec driven by the generated metadata.
5. The 16 px masters (`icons/sm/`) are drawn on the same 24-unit viewBox and painted like the line icons, because the runtime has one grid. Whether the sm master needs its own viewBox or stroke is open for B2 and B4, where the first masters are drawn.

---

## Rules-of-phase

1. **Markup is built from data.** Generated modules hold elements as `IconNode` literals; no JSX string, no `dangerouslySetInnerHTML`, no SVG parsing at runtime.
2. **Each module exists once.** Every entry reaches a sibling by package specifier; the root re-exports icons from `@bymax-one/icons/icons/<name>` and the runtime from `@bymax-one/icons/runtime`.
3. **Generated files are written, never edited.** `pnpm check:generated` fails on any difference.
4. **The pipeline is tested like the runtime**: 100% coverage in both Jest configs, Stryker `break: 100`; a directive only on a proven equivalent, with its reason.
5. **Zero runtime dependencies**: SVGO, ajv and resvg are dev dependencies.
6. **No drawing in `icons/`**: only fixtures, outside it.
7. **English-only, timeless comments**; no AI attribution; no em dashes in `docs/`.

---

## Reference docs

- [`../development_plan.md`](../development_plan.md) §4 "Global Conventions", §5 "P2: pipeline", §6 "Open Questions", §7 "Update Protocol".
- [`../technical_specification.md`](../technical_specification.md) §2, §5, §6, §7, §8.1, §8.2, §11, §12.
- Lucide (engineering only): `icon.schema.json`, `scripts/render/processSvg.mts`, `scripts/checkIconsAndCategories.mts`.
- `node_modules/svgo/types/lib/types.d.ts`, `node_modules/ajv/dist/2020.d.ts`, `node_modules/@resvg/resvg-js/index.d.ts`.

---

## Task index

| ID   | Task                                                  | Status  | Priority | Size | Depends on          |
| ---- | ----------------------------------------------------- | ------- | -------- | ---- | ------------------- |
| 2.1  | Sources layout, JSON Schemas, categories and fixtures | ✅ Done | P0       | S    | none                |
| 2.2  | SVG parse, formatter and live-area bound              | ✅ Done | P0       | M    | 2.1                 |
| 2.3  | Icon lint (`pnpm lint:icons`)                         | ✅ Done | P0       | L    | 2.2                 |
| 2.4  | Generator outputs: modules, metadata, static files    | ✅ Done | P0       | L    | 2.3                 |
| 2.5  | Subpaths, build and package gates                     | ✅ Done | P0       | L    | 2.4                 |
| 2.6  | Stale-copy check, fixture package and CI              | ✅ Done | P0       | M    | 2.5                 |
| 2.7  | Contact sheet (open question 1)                       | ✅ Done | P1       | S    | 2.4                 |
| 2.8  | Documentation                                         | ✅ Done | P1       | S    | 2.6, 2.7            |
| 2.9  | Phase close: `mutation:full`, full gate, dashboards   | ✅ Done | P0       | S    | 2.1 to 2.8          |
| 2.10 | Phase commit and pull request with Copilot review     | ✅ Done | P0       | S    | 2.9, owner go-ahead |

---

## Tasks

### Task 2.1: Sources layout, JSON Schemas, categories and fixtures

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: S
- **Depends on**: none

#### Acceptance criteria

- [x] `schemas/icon.schema.json`, `brand.schema.json` and `category.schema.json` (draft 2020-12, ajv strict): tags, categories and at least two use cases required; aliases in Lucide's shape, a deprecated one requiring `toBeRemovedInVersion`, a current one carrying neither deprecation field; `variants` containing `line`; `opticalSizes` containing 24; brands requiring `title`, `source`, `guidelines`, `license`, `retrievedAt`, with an optional `multicolor`.
- [x] `categories.json` lists the categories of spec §4.1.
- [x] `icons/README.md` documents the layout; no `.gitkeep`, no empty directory.
- [x] `fixtures/icons/` holds two placeholder icons (one with every variant and the spark dot, one with a current and a deprecated alias) and one placeholder brand.

#### Files to create / modify

- `schemas/*.schema.json`, `categories.json`, `icons/README.md`, `fixtures/**`

#### Agent prompt

```
You are a senior TypeScript tooling engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Zero direct dependencies.

CURRENT PHASE: 2 (pipeline), Task 2.1 of 10 (FIRST)

PRECONDITIONS
- P1 is merged on main; the phase branch feat/svg-pipeline exists.

REQUIRED READING (only these):
- docs/technical_specification.md §4.1, §4.3, §5, §6.1, §6.2.
- Lucide icon.schema.json (gh api repos/lucide-icons/lucide/contents/icon.schema.json).

TASK
Write the metadata schemas, the category list, the icons layout README and the fixtures.

DELIVERABLES
1. The three schemas and categories.json of the acceptance criteria; they compile under
   ajv's Ajv2020 in strict mode.
2. icons/README.md; fixtures/icons with obviously placeholder shapes named fixture-*.

Constraints:
- No drawing under icons/. No .gitkeep. English-only. No AI attribution anywhere.

Verification:
- `pnpm format:check` expected: exit 0.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 10).
4. Append a Completion log entry: `- 2.1 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P2 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `feat(build): add the metadata schemas, categories and fixtures (2.1)`.
```

---

### Task 2.2: SVG parse, formatter and live-area bound

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: 2.1

#### Acceptance criteria

- [x] `src/pipeline/svg.ts`: `parseSvg` returns the document unchanged (SVGO with a capture-only plugin); `normalizeSvg` applies the formatting of the Decisions above and is stable on its own output; `serializeContainer` escapes attribute values.
- [x] `src/pipeline/svg-kind.ts`: the fixed root attributes of each kind match what the `Icon` base renders.
- [x] `src/pipeline/live-area.ts`: geometry bounds measured by resvg, exact for arcs; the limit is `[1.5, 22.5]` on both axes.
- [x] `src/pipeline/naming.ts`: variant names, component names (equal to `createIcon`'s `displayName`), symbol ids, the kebab-case rule.

#### Files to create / modify

- `src/pipeline/{svg,svg-kind,live-area,naming}.ts` and their specs; `tsconfig.json` (`allowImportingTsExtensions`, the new paths); `package.json` (svgo, @resvg/resvg-js dev dependencies)

#### Agent prompt

```
You are a senior TypeScript tooling engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Zero direct dependencies.

CURRENT PHASE: 2 (pipeline), Task 2.2 of 10

PRECONDITIONS
- Task 2.1 is done.

REQUIRED READING (only these):
- docs/technical_specification.md §2.1, §2.4, §6.3, §7.1.
- Lucide scripts/render/processSvg.mts; node_modules/svgo/types/lib/types.d.ts;
  node_modules/@resvg/resvg-js/index.d.ts.

TASK
Write the SVG parse, the formatter, the live-area bound and the naming rules in src/pipeline.

DELIVERABLES
1. The four modules of the acceptance criteria, relative imports with the .ts extension.
2. Specs that pin the formatter's output byte for byte for every kind.

Constraints:
- Measure Node's native type stripping before relying on it. No `in` on a plain object for
  a name read from a file (a prototype key would pass).
- Functions <= 50 lines; zero any; English-only, timeless comments.

Verification:
- `pnpm typecheck && pnpm test:cov` expected: exit 0, 100% on every metric.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 10).
4. Append a Completion log entry: `- 2.2 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P2 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `feat(build): add the SVG formatter and the live-area bound (2.2)`.
```

---

### Task 2.3: Icon lint

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: L
- **Depends on**: 2.2

#### Acceptance criteria

- [x] Rules, each with a failing fixture in a spec: `file-name` (and strays), `svg-parse`, `svg-normalised` (including files SVGO parses and then fails on), `svg-root`, `svg-element`, `svg-attribute`, `svg-fill` (spark-dot exception, monochrome brands, `multicolor` brands), `svg-precision`, `svg-live-area`, `meta-json`, `meta-schema`, `meta-pair`, `meta-variants`, `brand-scope`, `category`, `name-unique` (names, aliases and component names).
- [x] `scripts/lint-icons.mjs` is a thin entry over `src/pipeline/cli.ts`; `pnpm lint:icons` passes on `icons/` and on `fixtures/icons`.

#### Files to create / modify

- `src/pipeline/{lint,lint-svg,lint-set,lint-issue,metadata,sources,icon-set}.ts` and their specs, `src/pipeline/__tests__/support.ts`, `scripts/lint-icons.mjs`, `package.json` (ajv)

#### Agent prompt

```
You are a senior TypeScript tooling engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Zero direct dependencies.

CURRENT PHASE: 2 (pipeline), Task 2.3 of 10

PRECONDITIONS
- Task 2.2 is done.

REQUIRED READING (only these):
- docs/technical_specification.md §5, §6.2, §6.3, §12 (SVG lint).
- Lucide scripts/checkIconsAndCategories.mts.

TASK
Write the icon lint as testable rules over in-memory sources, and its thin script.

DELIVERABLES
1. One rule per acceptance criterion, each issue `{ file, rule, message }`.
2. A spec per rule with a failing fixture asserted as the exact issue.

Constraints:
- One bad file never stops the lint: a parse or formatter failure is an issue.
- Functions <= 50 lines; files <= 800; zero any; English-only, timeless comments.

Verification:
- `pnpm lint:icons && node scripts/lint-icons.mjs --icons fixtures/icons` expected: no issue.
- `pnpm test:cov:all` expected: 100% on every metric.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 10).
4. Append a Completion log entry: `- 2.3 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P2 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `feat(build): add the icon lint (2.3)`.
```

---

### Task 2.4: Generator outputs

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: L
- **Depends on**: 2.3

#### Acceptance criteria

- [x] `pnpm generate` formats the sources in place, lints, and writes `src/icons/generated`, `src/brands/generated` and `src/meta/generated` (replacing them, so a removed icon leaves nothing behind), formatted with the repository's Prettier options.
- [x] One module per icon variant, one `./icons/<name>` entry per icon, the root re-exports by package specifier, aliases exported under their names with `@deprecated` JSDoc when deprecated, brand modules with `{ paint: 'fill' }`.
- [x] `src/meta/generated/metadata.ts` is data with no import; `src/meta/icon-metadata.ts` types and deep-freezes it (`ICON_NAMES`, `ICON_METADATA`, `BRAND_NAMES`, `BRAND_METADATA`, `ICON_CATEGORIES`, `IconName`, `BrandName`, `IconCategoryName` and the record types); the `src/meta` lint passes.
- [x] `pnpm generate --static` writes `dist/svg/{line,filled,sm,brands}/<name>.svg`, `dist/sprite.svg` and `dist/metadata.json` with the records `./meta` holds.

#### Files to create / modify

- `src/pipeline/{emit-modules,emit-data,generate,cli}.ts` and their specs, `scripts/generate.mjs`, `src/meta/{freeze,icon-metadata,index}.ts` and specs, `src/brands/index.ts`, `src/index.ts`, `src/runtime/index.ts`

#### Agent prompt

```
You are a senior TypeScript tooling engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Zero direct dependencies.

CURRENT PHASE: 2 (pipeline), Task 2.4 of 10

PRECONDITIONS
- Task 2.3 is done.

REQUIRED READING (only these):
- docs/technical_specification.md §7, §8.1, §8.2; src/runtime/create-icon.ts.
- eslint.config.mjs (the src/meta block).

TASK
Write the emitters, the file operations and the CLI, and the typed ./meta records.

DELIVERABLES
1. The outputs of the acceptance criteria, pinned byte for byte in specs.
2. The empty-set modules committed under src/**/generated.

Constraints:
- No JSX string, no dangerouslySetInnerHTML; every createIcon call is /* @__PURE__ */.
- Metadata text can never close a JSDoc block. Key order is fixed, not the source's.

Verification:
- `pnpm generate && pnpm check:generated && pnpm lint && pnpm check:meta-react` expected: exit 0.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 10).
4. Append a Completion log entry: `- 2.4 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P2 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `feat(build): generate the icon modules, metadata and static outputs (2.4)`.
```

---

### Task 2.5: Subpaths, build and package gates

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: L
- **Depends on**: 2.4

#### Acceptance criteria

- [x] `package.json` `exports` and `typesVersions` for `./runtime`, `./brands`, `./icons/*`, `./svg/*`, `./sprite.svg`, `./metadata.json`; `sideEffects: false`; `dependencies: {}`.
- [x] `tsup.config.ts`: one entry per generated icon (`icons/<name>/index`), plus the root, runtime, meta and brands entries, every sibling external; no icon entry config when no icon exists.
- [x] `check:exports` names each `./icons/<name>` from `dist/metadata.json` (attw lists a pattern subpath as "(wildcard)" without resolving it) and excludes `./sprite.svg`, which TypeScript does not resolve.
- [x] `check:runtime` and `dogfood` read the exact export list of every subpath from `dist/metadata.json` (`scripts/package-expectations.mjs`), render every generated component, check root identity with each icon entry, the sprite symbols, every raw SVG and `metadata.json` against `./meta`; the bundle scan requires `createElement` as the runtime's only React import and no React import elsewhere.
- [x] `check-size.mjs`: per-subpath budgets from the measured bundles, per-icon rows for the spec targets, and no claim that an inlined `./meta` fails the root budget.

#### Files to create / modify

- `package.json`, `tsup.config.ts`, `jest.config.ts`, `jest.coverage.config.ts`, `stryker.config.json`, `scripts/{check-exports,check-consumer-runtime,dogfood-smoke-test,check-size,package-expectations}.mjs`

#### Agent prompt

```
You are a senior release engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Zero direct dependencies.

CURRENT PHASE: 2 (pipeline), Task 2.5 of 10

PRECONDITIONS
- Task 2.4 is done.

REQUIRED READING (only these):
- docs/technical_specification.md §8.1, §11, §12; scripts/check-*.mjs, dogfood-smoke-test.mjs.

TASK
Ship the new subpaths and make every package gate data-driven.

DELIVERABLES
1. The manifest, tsup and gate changes of the acceptance criteria.
2. Budgets stated as measurements, with no dated history and no derived percentage.

Constraints:
- Measure attw's behaviour on pattern and asset exports before excluding anything.
- Exclude generated directories from coverage and mutation only.

Verification:
- `pnpm build && pnpm size && pnpm check:exports && pnpm check:runtime && pnpm dogfood`
  expected: exit 0 on the empty set.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 10).
4. Append a Completion log entry: `- 2.5 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P2 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `feat(build): add the icon, brand, runtime and asset subpaths (2.5)`.
```

---

### Task 2.6: Stale-copy check, fixture package and CI

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: 2.5

#### Acceptance criteria

- [x] `pnpm check:generated` fails, naming the file, when a generated module is missing, out of date or left over, and writes nothing.
- [x] `pnpm check:fixtures` runs the whole chain on `fixtures/icons` in a scratch copy, without running pnpm there.
- [x] The `verify` job of `ci.yml` runs `lint:icons`, `check:generated`, the extended output-integrity check (runtime, brands, sprite, metadata) and `check:fixtures`; `actionlint` reports nothing.

#### Files to create / modify

- `scripts/check-fixture-package.mjs`, `.github/workflows/ci.yml`, `package.json`

#### Agent prompt

```
You are a senior release engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Zero direct dependencies.

CURRENT PHASE: 2 (pipeline), Task 2.6 of 10

PRECONDITIONS
- Task 2.5 is done.

REQUIRED READING (only these):
- .github/workflows/ci.yml; docs/technical_specification.md §7 (stale copy).

TASK
Gate the generated copy in CI and prove every package gate on the fixtures.

DELIVERABLES
1. The stale-copy check and the fixture package script.
2. The CI steps of the acceptance criteria.

Constraints:
- The scratch copy links node_modules; never run pnpm in it (it reinstalls through the link).
- Close the stdin of each step (tsup does not exit while stdin is open).

Verification:
- `pnpm check:generated && pnpm check:fixtures && actionlint` expected: exit 0.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 10).
4. Append a Completion log entry: `- 2.6 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P2 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `ci(build): check the generated modules and build the fixture package (2.6)`.
```

---

### Task 2.7: Contact sheet

- **Status**: ✅ Done
- **Priority**: P1
- **Size**: S
- **Depends on**: 2.4

#### Acceptance criteria

- [x] `pnpm contact-sheet [--icons <dir>] [--out <file>]` renders every drawing at 16, 20, 24 and 48 px on both Studio pages in the ink and the six accents (values in `src/pipeline/contact-sheet.ts`) to `reports/contact-sheet.png`.
- [x] Open question 1 of the plan is recorded as resolved with this choice.

#### Files to create / modify

- `src/pipeline/contact-sheet.ts` and its spec, `scripts/contact-sheet.mjs`, `docs/development_plan.md` §6

#### Agent prompt

```
You are a senior TypeScript tooling engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Zero direct dependencies.

CURRENT PHASE: 2 (pipeline), Task 2.7 of 10

PRECONDITIONS
- Task 2.4 is done.

REQUIRED READING (only these):
- docs/development_plan.md §4 rule 11, §6; bymax-studio-web docs/preview/frontend/design-system.html
  (read-only: the page, ink and accent tokens of direction A).

TASK
Render the contact sheet a drawing batch is gated on.

DELIVERABLES
1. The composer (pure, pinned in a spec) and the PNG render with @resvg/resvg-js.
2. The resolved open question.

Constraints:
- One device pixel per CSS pixel. Output under the ignored reports/ directory.

Verification:
- `pnpm contact-sheet --icons fixtures/icons` expected: a PNG of 3336 x 328 px.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 10).
4. Append a Completion log entry: `- 2.7 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P2 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `feat(build): add the contact sheet renderer (2.7)`.
```

---

### Task 2.8: Documentation

- **Status**: ✅ Done
- **Priority**: P1
- **Size**: S
- **Depends on**: 2.6, 2.7

#### Acceptance criteria

- [x] `README.md`: status, features, subpath table with `./runtime`, architecture, testing, the `./meta` records; every claim matches a passing gate.
- [x] `CONTRIBUTING.md` "Adding an icon" and the verification list; `CLAUDE.md` status, rules, subpaths and verification; `AGENTS.md` Architecture (under 32768 bytes); `CHANGELOG.md` `Unreleased`.

#### Files to create / modify

- `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `AGENTS.md`, `CHANGELOG.md`, `icons/README.md`

#### Agent prompt

```
You are a senior open-source maintainer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Pre-1.0: the runtime and
the pipeline exist, no icon is drawn yet.

CURRENT PHASE: 2 (pipeline), Task 2.8 of 10

PRECONDITIONS
- Tasks 2.6 and 2.7 are done.

REQUIRED READING (only these):
- README.md, CONTRIBUTING.md, CLAUDE.md, AGENTS.md "Architecture".

TASK
Document the pipeline where it is now true, and how to add an icon.

DELIVERABLES
1. The changes of the acceptance criteria.

Constraints:
- Icons stay 📋 until a batch ships. Never edit the AGENTS.md shared block. English-only.

Verification:
- `pnpm format:check` expected: exit 0. `wc -c AGENTS.md` expected: under 32768.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 10).
4. Append a Completion log entry: `- 2.8 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P2 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `docs(build): document the pipeline and how to add an icon (2.8)`.
```

---

### Task 2.9: Phase close: `mutation:full`, full gate, dashboards

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: S
- **Depends on**: 2.1 to 2.8

#### Acceptance criteria

- [x] `pnpm mutation:full`: final score 100.00, 0 survived, 0 without coverage. The `// Stryker disable next-line StringLiteral` directives, each with its reason, cover the names of the custom SVGO plugins, which SVGO uses only as labels.
- [x] `pnpm typecheck`, `lint`, `format:check`, `test:cov:all`, `build`, `size`, `check:exports`, `check:runtime`, `dogfood`, `check:lint-graph`, `check:meta-react`, `check:file-length`, `check:mutants`, `check:generated`, `lint:icons`, `check:fixtures` and `actionlint` pass.
- [x] P2 Definition of Done, each item observable: a fixture icon becomes a component, a raw SVG, a sprite symbol and a metadata entry (`check:fixtures`); the lint rejects every rule of spec §6.3 and §12 (`lint-svg.spec.ts`, `lint-set.spec.ts`, `lint.spec.ts`); a stale module fails CI (`cli.spec.ts`, the `verify` job); 100% coverage and mutation on the pipeline; `check:exports`, `check:runtime` and `dogfood` cover every subpath.
- [x] This file, `docs/development_plan.md` §1 and `docs/tasks/README.md` agree (P2 👀 until the merge).

#### Files to create / modify

- `docs/tasks/phase-02-pipeline.md`, `docs/development_plan.md`, `docs/tasks/README.md`

#### Agent prompt

```
You are a senior release engineer closing a phase on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Public npm package.

CURRENT PHASE: 2 (pipeline), Task 2.9 of 10

PRECONDITIONS
- Tasks 2.1 through 2.8 are ✅.

REQUIRED READING (only these):
- docs/development_plan.md §5 "P2: pipeline" (Definition of Done) and §7 "Update Protocol".

TASK
Run every gate, verify the Definition of Done, update the dashboards.

DELIVERABLES
1. `pnpm mutation:full` under Node 24, every non-killed mutant classified from
   reports/mutation/mutation.json.
2. The full local gate; the last lines of each command.
3. P2 👀 in the plan, this file and the folder index (✅ only after the merge).

Constraints:
- Never lower a threshold or add a directive to reach 100. No em dashes.

Verification:
- reports/mutation/mutation.json expected: no Survived, NoCoverage, Timeout or RuntimeError.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 10).
4. Append a Completion log entry: `- 2.9 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P2 row in docs/development_plan.md §1 and docs/tasks/README.md.
```

---

### Task 2.10: Phase commit and pull request with Copilot review

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: S
- **Depends on**: 2.9, and the owner's go-ahead to commit and open the pull request

#### Acceptance criteria

- [x] The change set is committed on `feat/svg-pipeline` with Conventional Commits (scopes `build`, `meta`, `runtime`, `deps`), no attribution trailer.
- [x] The PR is opened to `main` with the template filled in (no drawing, so no originality attestation) and the gate output of task 2.9 in the body.
- [x] GitHub Copilot code review requested; every thread answered with what was measured and resolved; `reviewThreads` checked with `isResolved == false` after every push, before the merge and after it. The review came from the Codex connector, which the repository uses in place of Copilot (no paid seat); it reported no finding.
- [x] Merged with `CI passed` green; branch deleted; P2 ✅ in the plan, this file and the folder index.

#### Files to create / modify

- `docs/tasks/phase-02-pipeline.md`, `docs/tasks/README.md`, `docs/development_plan.md` (status only)

#### Agent prompt

```
You are a senior release engineer on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Public npm package.

CURRENT PHASE: 2 (pipeline), Task 2.10 of 10 (phase PR)

PRECONDITIONS
- Task 2.9 is ✅ and the owner has authorised the commit and the pull request.

REQUIRED READING (only these):
- docs/tasks/README.md "Branch and PR flow".
- This file's task index and completion log.

TASK
Commit, open the PR, drive it through Copilot review to merge.

DELIVERABLES
1. Commits on feat/svg-pipeline; `gh pr create --title "feat(build): SVG pipeline, icon lint
   and the icon, brand, runtime and asset subpaths"` with the template's sections.
2. Copilot review requested and every thread resolved with evidence.
3. `gh pr merge --squash --delete-branch` once CI passed is green and no thread is open.

Constraints:
- Never bypass a red gate; never --admin or force. No AI attribution anywhere. English-only.

Verification:
- `gh pr checks` expected: all green before merge.
- `gh api graphql` reviewThreads expected: none with isResolved false, also after the merge.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (10 / 10).
4. Append a Completion log entry: `- 2.10 ✅ <YYYY-MM-DD> phase merged via PR #<n>`.
5. Update docs/tasks/README.md and docs/development_plan.md (P2 ✅).
```

---

## Completion log

<!-- Append one line per completed task: - <id> ✅ YYYY-MM-DD <summary> -->

- 2.1 ✅ 2026-11-08 Icon, brand and category schemas (ajv strict), the categories, the icons layout README and placeholder fixtures outside `icons/`.
- 2.2 ✅ 2026-11-08 SVGO formatter, capture-only parse, resvg live-area bound and the naming rules, run by Node's native type stripping.
- 2.3 ✅ 2026-11-08 Icon lint, each rule with a failing fixture; a file SVGO cannot optimise is reported, not thrown; allowed elements are a Map, so a prototype key such as `constructor` is refused.
- 2.4 ✅ 2026-11-08 Generated variant modules, icon entries, barrels, brand modules, typed and frozen `./meta` records, and the static outputs.
- 2.5 ✅ 2026-11-08 `./runtime`, `./brands`, `./icons/*` and asset subpaths; data-driven `check:exports`, `check:runtime`, `dogfood` and `size`.
- 2.6 ✅ 2026-11-08 `check:generated`, `check:fixtures` and the CI `verify` steps; actionlint clean.
- 2.7 ✅ 2026-11-08 `pnpm contact-sheet` with the Studio pages and accents; open question 1 resolved.
- 2.8 ✅ 2026-11-08 README, CONTRIBUTING, CLAUDE.md, AGENTS.md and CHANGELOG updated to the pipeline.
- 2.9 ✅ 2026-11-08 mutation:full 100.00; full local gate and `check:fixtures` green; dashboards at P2 👀.
- 2.10 ✅ 2026-11-08 phase merged via PR #5 (squash `deb3bb7`); Codex review clean, no open thread.
