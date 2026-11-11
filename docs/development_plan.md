# Development Plan: @bymax-one/icons

> **Version:** 1.0.0
> **Last updated:** 2026-11-11
> **Status:** Approved spec, execution under way (P1, P2, B0, P3, B1, B2, B3, B4 and P4 done; P5 next; P0 awaits its GitHub settings)
> **Source spec:** [`technical_specification.md`](./technical_specification.md)
> **Derived documents:** per-phase task files under `docs/tasks/` (one file per phase, scaffolded one phase at a time)

---

## Status Legend

| Emoji | Meaning     |
| ----- | ----------- |
| 📋    | ToDo        |
| 🔄    | In Progress |
| 👀    | Review      |
| ✅    | Done        |
| ⛔    | Blocked     |
| 🟡    | Partial     |

---

## 1. Progress Dashboard

> **Overall progress: 9 / 12 phases (75%)**
> **Active phase:** P5 (hardening and release); P0 still has
> the GitHub settings of task 0.6
> **Blocked phases:** none
>
> Engineering phases are `P0` to `P6`; drawing batches are `B0` to `B4`. Every drawing batch
> closes on a founder-approval gate (section 4, rule 11), so a batch is ✅ only after that
> approval is recorded.

### Phase Table

| ID  | Name                              | Status | Progress | Size | Last Updated |
| --- | --------------------------------- | ------ | -------- | ---- | ------------ |
| P0  | repository-governance             | 🔄     | 0%       | M    | 2026-11-08   |
| P1  | runtime                           | ✅     | 100%     | M    | 2026-11-08   |
| P2  | pipeline                          | ✅     | 100%     | L    | 2026-11-10   |
| B0  | keystone-icons                    | ✅     | 100%     | M    | 2026-11-10   |
| P3  | visual-tooling                    | ✅     | 100%     | L    | 2026-11-11   |
| B1  | navigation-actions-status         | ✅     | 100%     | L    | 2026-11-11   |
| B2  | media-audio-files-editor          | ✅     | 100%     | L    | 2026-11-11   |
| B3  | studio-ai-formats-billing         | ✅     | 100%     | L    | 2026-11-11   |
| B4  | filled-variants-sm-masters-brands | ✅     | 100%     | L    | 2026-11-11   |
| P4  | catalog-site                      | ✅     | 100%     | M    | 2026-11-11   |
| P5  | hardening-release                 | 🔄     | 25%      | M    | 2026-11-11   |
| P6  | react-native                      | 📋     | 0%       | M    | 2026-11-08   |

---

## 2. Dependency Graph

```
P0 ── P1 ── P2 ── B0 ── P3 ── B1 ── B2 ── B3 ── B4 ── P4 ── P5 ── P6
                   │           │                 │                 │
                   │           │                 └─────────────────┘  P6 also waits for the complete set of B4
                   │           └── bymax-studio-web adopts the package (local link)
                   └── founder approves the design language
```

Reading guide: the order is the one section 16 of the spec fixes. P0 unlocks everything. The
runtime (P1) is the base every generated module renders through, so the pipeline (P2) waits
for it, and the first drawings (B0) wait for the pipeline's SVG lint and generator. B0 is the
design-language gate: nothing else is drawn until the founder approves it. The visual tooling
(P3) then makes contact sheets, visual regression and the similarity check routine for the
batches that follow. B2 fixes the list of 16 px masters that B4 draws. The catalog (P4) is
built on the complete set, and P5 hardens and publishes `1.0.0`. P6 adds the React Native
components after the release; it needs the complete set of B4 and the published package of
P5 (decision D6).

---

## 3. Parallelization Notes

- **Engineering and drawing are separate tracks** (spec §16). Inside a batch, drawing work
  does not touch `src/` beyond the generated modules, so a fix to the runtime or the pipeline
  can land between batches without reopening a batch's approval.
- **B1 to B4 are sequential on purpose.** Each batch's family sheet is drawn beside every
  earlier batch, so the next batch starts from an approved family, not from a draft.
- **`bymax-studio-web` adopts the package from B1 on** through a local link (decision D5) and
  switches to the npm version at `1.0.0`. A batch that changes a name the Studio already uses
  keeps the old name as a deprecated alias.
- Test suites always run with a bounded worker pool (`maxWorkers` capped in the Jest
  configs); phases are never verified by concurrent test runs of the same package.

---

## 4. Global Conventions

These rules apply to every phase. Phase sections only add rules specific to them.

1. **TypeScript strict, zero `any`.** `noUncheckedIndexedAccess` and
   `exactOptionalPropertyTypes` enabled. No suppression comments (`@ts-ignore`,
   `eslint-disable`) anywhere.
2. **Clean Code sizing.** Functions at most 50 lines; files at most 800 lines with a typical
   target of 200 to 400. Split by responsibility when a limit approaches.
3. **Pure components.** No hooks, no context and no `'use client'` in a component or the
   `Icon` base, so every icon renders in Server Components and client components alike.
4. **Packaging discipline.** `dependencies` stays empty; `react ^19.0.0` is a required peer,
   mirrored in `devDependencies`. tsup produces ESM + CJS + `.d.ts` + `.d.cts` per subpath;
   sibling subpaths and icon modules import each other by package specifier and stay
   external, so each module exists once.
5. **Test discipline.** Jest with **100% line, branch, function and statement coverage**
   enforced in **both** Jest configs. Stryker `break: 100` on the runtime and the generator.
   Every `it()` carries a comment stating the scenario and the rule it protects. Generated
   modules are excluded from coverage and mutation; their correctness is proven by the
   generated render smoke test.
6. **English only.** Identifiers, comments, JSDoc, commit messages and documentation,
   `docs/` included.
7. **Timeless comments.** Code comments explain what the code does and why it is shaped that
   way. They never reference plan stages, phase numbers or task ids.
8. **JSDoc on every export.** File headers carry `@fileoverview` and `@layer`.
9. **Conventional Commits** with the scopes
   `icons | brands | runtime | meta | site | build | deps | release`. No `Co-Authored-By`, no
   "Generated with", no AI attribution anywhere.
10. **Security defaults.** Markup is built from data, never from strings; SVG sources hold only
    the allow-listed elements of spec §6.3; the PR preview never executes pull-request code.
11. **Drawing batch gate.** A batch closes only when: the SVG lint passes; a contact sheet at
    16, 20, 24 and 48 px on light and dark glass with the six accents is committed; a family
    sheet beside every earlier batch is committed; the similarity report is attached; and the
    founder approves. Every drawing pull request carries the originality attestation.

---

## 5. Phase Detail

### P0: repository-governance

- **Goal:** Stand up the repository, its governance and its quality gates so every later
  phase lands on green checks from its first commit.
- **Scope (in):** `package.json` (exports for `.` and `./meta`, family scripts, `react` peer,
  engines Node 24, pnpm 11), the tsconfig set (`tsconfig.json`, `.build`, `.jest`, `.meta`),
  `tsup.config.ts` with two browser entries, the ESLint flat config (eslint 10, import-x, TSX
  block, no React in `./meta`), Prettier, both Jest configs and the Stryker config at
  `break: 100`, husky + commitlint + lint-staged + `.gitmessage`, `pnpm-workspace.yaml`,
  `osv-scanner.toml`, the open-source baseline files (`LICENSE`, `README.md`, `CHANGELOG.md`,
  `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `TRADEMARKS.md`, `CLAUDE.md`,
  `AGENTS.md`), the family scripts, every family workflow, `dependabot.yml`, issue templates,
  the pull request template with the originality attestation, the Copilot instruction files,
  and the minimal `ICON_GRID` export with its specs.
- **Scope (out):** the `Icon` runtime (P1); any drawing, the generator and the SVG lint (P2,
  B0); `docs/AUTOPILOT.md` and `docs/guidelines/`, written once the phases they govern have a
  task file.
- **Definition of Done:**
  - `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test:cov:all` (100%),
    `pnpm build`, `pnpm size`, `pnpm check:exports`, `pnpm check:runtime` and `pnpm dogfood`
    all pass from a clean clone; `actionlint` reports nothing.
  - `pnpm build` emits `.mjs`, `.cjs`, `.d.ts` and `.d.cts` for `.` and `./meta`.
  - Husky hooks reject a non-conventional commit message locally.
  - The phase pull request is green on every check and `CI passed` reports on it.
  - After the merge, `CI passed` reports on `main`, and `icons` is added to the org ruleset
    `require-ci-passed`.
  - The org code security configuration is re-attached to the repository. The first
    attachment failed on the empty repository because no language was detected.
  - Repository settings match the family: description, topics, `npm-publish` environment
    (required reviewers, deployments restricted to `v*.*.*` tags), private vulnerability
    reporting, and the `dependencies`, `github-actions` and `peer-advisory-drift` labels.
- **Context / preconditions:** the repository holds the GitHub-generated README and the
  approved specification. `bymaxone/nest-config` (scaffold commit 2594df2) is the primary
  reference; `bymaxone/nest-auth` supplies the React, TSX and jsdom specifics,
  `bymaxone/nest-cache` the newest eslint 10 + import-x setup, and `bymaxone/.github` the
  reusable workflows and shared review rules. Configuration is copied from their current
  `main` and adapted, never invented.
- **Rules-of-phase:** `check-api-surface.mjs`, `check-file-length.mjs`,
  `strip-bundle-comments.mjs`, `check-mutation-directives.mjs`, `check-lint-graph-rules.mjs`,
  `check-published-surface.mjs` and `readme-snippets.mjs` are byte-identical with the
  reference; the other scripts are adapted to the two subpaths. Size budgets start
  provisional. No `.gitkeep` or placeholder directory anywhere.
- **References:** spec §1.4, §11, §12, §13, §16.
- **Size:** M

### P1: runtime

- **Goal:** Deliver the `Icon` base every component renders through: props, accessibility and
  stroke maths, at 100% coverage and 100% mutation.
- **Scope (in):** `IconProps` (spec §8.3) with `size`, `strokeWidth`, `absoluteStrokeWidth`,
  `color`, `title` and `ref` as a regular prop; the default root attributes from
  `ICON_GRID`; the accessibility rules of spec §8.5 (silent by default, `title` gives
  `role="img"`, `aria-label` and a `<title>` child, any consumer `aria-*` or `role` suppresses
  the default `aria-hidden`); `absoluteStrokeWidth` as `strokeWidth × 24 / size`; the element
  list the generator will emit as data; specs in jsdom and in `react-dom/server`.
- **Scope (out):** drawings, the generator and every subpath other than `.` and `./meta`.
- **Definition of Done:**
  - Rendering a fixture element list produces the expected root attributes in jsdom and in
    `react-dom/server`, with and without `title`.
  - A consumer `aria-*` attribute or `role` suppresses the default `aria-hidden`.
  - No hook, context or `'use client'` exists in the runtime, and a Server Components render
    test passes.
  - Coverage and mutation stand at 100% on the runtime.
- **Context / preconditions:** P0 done. React 19 `ref`-as-prop behaviour confirmed against
  current official documentation before implementation.
- **Rules-of-phase:** React specs use the Stryker jsdom docblock. Components never build markup
  from strings.
- **References:** spec §8.3 to §8.5, §2.7.
- **Size:** M

### P2: pipeline

- **Goal:** Turn SVG and metadata sources into generated modules, bundles and static outputs,
  with the SVG lint and the metadata schemas guarding every source.
- **Scope (in):** SVGO normalisation (spec §7.1); `scripts/generate.mjs` writing one module per
  icon variant under `src/icons/generated/`; the tsup entries for every icon module, the root
  barrel, `./brands` and the other subpaths of spec §8.1, with their `exports`,
  `typesVersions` and gate lists; `dist/svg/**`, `dist/sprite.svg` and `dist/metadata.json`;
  `scripts/lint-icons.mjs` (spec §12); the JSON Schemas validated with ajv; the stale-copy
  check that rebuilds generated modules in CI.
- **Scope (out):** any drawing beyond the fixtures the generator's tests need.
- **Definition of Done:**
  - A fixture icon goes from `icons/line/<name>.svg` and `icons/meta/<name>.json` to a
    component, a raw SVG file, a sprite symbol and a metadata entry.
  - The SVG lint rejects every forbidden element and attribute of spec §6.3 and every naming,
    alias and variant rule of spec §12.
  - A stale generated module fails CI.
  - Coverage and mutation stand at 100% on the generator; generated modules are excluded.
  - `check:exports`, `check:runtime` and `dogfood` cover every new subpath.
- **Context / preconditions:** P1 done.
- **Rules-of-phase:** generated modules hold elements as data; no JSX strings, no
  `dangerouslySetInnerHTML`.
- **Delivered with one addition to spec §8.1:** a `./runtime` subpath holding `Icon` and
  `createIcon`, which the root re-exports. Each icon module imports `createIcon`, and the
  root re-exports each icon module; with the runtime inside the root the two would import
  each other, which fails at load in ESM and in CommonJS. Details in
  [`tasks/phase-02-pipeline.md`](./tasks/phase-02-pipeline.md).
- **References:** spec §6, §7, §8.1, §8.2, §11, §12.
- **Size:** L

### B0: keystone-icons

- **Goal:** Draw the 12 keystone icons and obtain the founder's approval of the design
  language before anything else is drawn.
- **Scope (in):** home, search, play, plus, close, check, settings, user, file, folder,
  lightning, scene; their metadata; the first size-budget calibration against real icon
  modules.
- **Scope (out):** every other icon; filled variants and 16 px masters.
- **Definition of Done:**
  - The batch gate of section 4, rule 11, is met, and the founder's approval is recorded.
  - The size budgets of spec §12 are calibrated in `scripts/check-size.mjs` (each whole icon module) and `scripts/check-component-size.mjs` (each component, tree-shaken).
- **Context / preconditions:** P2 done.
- **Rules-of-phase:** drawn as code on the grid (decision D1); originality attestation on the
  pull request.
- **References:** spec §2, §3, §4.1, §16, §17 (D1, D2).
- **Approval:** design language approved by the delegated auditor on behalf of the founder,
  2026-11-10: signature A (the 1.5 px cut between distinct parts, spec §2.4), drawing
  round v3.1. The founder delegated the approval of B0 and of every later drawing batch to
  a senior auditor and reviews the finished set. The evidence is in
  [`tasks/phase-03-keystone-icons.md`](./tasks/phase-03-keystone-icons.md) and
  [`contact-sheets/b0/`](./contact-sheets/b0/).
- **Reopened (B0.1):** the similarity check of P3 flagged four composites as close to the
  archetype other sets draw (`folder`, `lightning`, `search`, `settings`). The auditor kept
  the other eight and asked for those four to be redrawn, in a pull request of their own
  after P3 and before B1, until each lies at a chamfer distance above 0.30 px from every
  reference while still reading as its concept at 16 px. `search` may instead be accepted
  as a primitive glyph (spec §3.5), with the measurement that justifies it.
- **Redrawn (B0.1):** folder f5, search q1, settings s9 and lightning a1 approved by the
  delegated auditor on behalf of the founder, 2026-11-11. The similarity report holds the
  measured distances, and only primitives are flagged. The evidence is in
  [`contact-sheets/b0.1/`](./contact-sheets/b0.1/).
- **Size:** M

### P3: visual-tooling

- **Goal:** Make the evidence every later batch gate needs routine: contact sheets, visual
  regression, the similarity check and the PR preview.
- **Scope (in):** contact and family sheet rendering; resvg renders at 16, 20, 24 and 48 px,
  light and dark, with pixel diffs against committed baselines; the similarity check against
  Lucide, Tabler, Phosphor and Heroicons (dev dependencies only), flagging rather than
  failing; `icons-preview.yml` on the safe `pull_request_target` pattern.
- **Scope (out):** new drawings.
- **Definition of Done:**
  - A changed B0 icon produces a visual diff, a similarity entry and a preview comment.
  - The preview workflow checks out the base branch, reads SVGs with `git show` and executes
    no pull-request code.
- **Context / preconditions:** B0 approved.
- **Rules-of-phase:** the similarity check flags for human review; it never fails a build on
  its own.
- **References:** spec §3.4, §12, §16.
- **Size:** L

### B1: navigation-actions-status

- **Goal:** Draw the navigation, action and status icons (about 35).
- **Scope (in):** the remaining icons of the Navigation, Actions and Status categories of spec
  §4.1, with metadata.
- **Definition of Done:** the batch gate of section 4, rule 11; `bymax-studio-web` consumes the
  package through a local link.
- **Approved (2026-11-11):** the 44 drawings, approved by the delegated auditor on behalf of
  the founder, 2026-11-11, after one round that redrew `dashboard`, `library` and `templates`.
- **Studio adoption deferred (2026-11-11):** `bymax-studio-web` is still in its specification
  phase, with documents only and no `package.json`, so it has nothing to link the package
  into. The adoption becomes a criterion again in the first batch that closes after the Studio
  has a `package.json`, and at the latest in P5, before 1.0. From then on the rule of spec
  §4.3 holds: a name the Studio already uses keeps its old name as a deprecated alias.
- **Context / preconditions:** P3 done.
- **References:** spec §4.1, §16, §17 (D5).
- **Size:** L

### B2: media-audio-files-editor

- **Goal:** Draw the media, audio, file and editor icons (about 35) and fix the 16 px master
  list.
- **Scope (in):** the Media and video, Audio and voice, Files and Editor and canvas categories
  of spec §4.1, with metadata; the 16 px master list from real usage in the Studio replica.
- **Definition of Done:** the batch gate of section 4, rule 11; the 16 px master list recorded
  in the specification's section 4.2.
- **16 px list from role and measurement (2026-11-11):** the Studio has no application yet,
  so the list cannot come from real usage. It is the union of the icons
  the Studio shell shows at 16 px by role (spec §4.2) and the drawings whose 16 px render
  fails a measured check (a fused cut or a closed interior), capped near 40 with the measured
  failures first. Usage becomes a criterion again when the Studio has an application, with
  the adoption deferred in B1.
- **Context / preconditions:** B1 approved.
- **References:** spec §4.1, §4.2, §16.
- **Size:** L

### B3: studio-ai-formats-billing

- **Goal:** Draw the Studio, AI, format, billing and Polvi icons (about 30).
- **Scope (in):** the Studio (S) concepts not drawn yet, the Formats, Credits and billing, AI and
  agent, People and roles and System categories of spec §4.1, with metadata and aliases.
- **Definition of Done:** the batch gate of section 4, rule 11.
- **Context / preconditions:** B2 approved.
- **References:** spec §4.1, §4.3, §16.
- **Size:** L

### B4: filled-variants-sm-masters-brands

- **Goal:** Draw the filled variants (about 40), the 16 px masters (about 40) and the 16 brand
  marks plus `google-color`.
- **Scope (in):** filled variants for the stateful icons (spec §2.6); the 16 px masters on the
  list fixed in B2 (spec §2.1, §2.2); the brand marks of spec §5 with per-brand metadata and
  `TRADEMARKS.md` entries.
- **Definition of Done:** the batch gate of section 4, rule 11; every brand carries `source`,
  `guidelines`, `license` and `retrievedAt`.
- **Context / preconditions:** B3 approved.
- **References:** spec §2.1, §2.2, §2.6, §5, §17 (D3).
- **Size:** L
- **Split (2026-11-11):** B4 lands as three pull requests, each with its own audit: **B4a**,
  the brand marks; **B4b**, the filled variants; **B4c**, the 16 px masters, after an
  engineering pull request that gives the `sm` kind a 1.5 px stroke at 16 px by default.
  Microsoft, LinkedIn and `google-color` are not in 1.0 (spec §5).
- **B4b ✅ (2026-11-11):** the filled variants, approved by the delegated auditor
  on behalf of the founder, 2026-11-11 (pull request #16).
- **`sm` stroke ✅ (2026-11-11):** a 16 px master renders at 16 px with a 1.5 px stroke by
  default (pull request #17).
- **B4c ✅ (2026-11-11):** the 16 px masters, approved by the delegated auditor on behalf
  of the founder, 2026-11-11. B4 is done.

### P4: catalog-site

- **Goal:** Ship the static catalog in `site/`, built on the package's own output.
- **Scope (in):** search over name, tags and aliases; category filter; size, stroke, variant,
  theme and accent controls; copy SVG, JSX and name; one page per icon with its use cases and
  aliases; GitHub Pages on `icons.bymax.one` (decision D4).
- **Definition of Done:** the site builds from `dist/` in CI and is published on
  `icons.bymax.one`; the README links to it.
- **Context / preconditions:** B4 approved.
- **References:** spec §9, §17 (D4).
- **Size:** M
- **P4 ✅ (2026-11-11):** the catalog's design is approved by the delegated auditor on behalf
  of the founder, 2026-11-11.
- **Pending (2026-11-11):** the DNS record of `icons.bymax.one` (a CNAME to
  `bymaxone.github.io`) is the founder's to create; until then the site is served at
  `bymaxone.github.io/icons`.

### P5: hardening-release

- **Goal:** Hold every gate at its final threshold and publish `1.0.0`.
- **Scope (in):** final size budgets; a cold `mutation:full` at 100% with
  `docs/mutation_testing_results.md`; the dogfood and post-publish checks; the
  `chore(release): 1.0.0` pull request; the first, manual publish; trusted publishing for every
  release after it.
- **Scope (out):** new icons or API changes.
- **From the catalog review (2026-11-11):** write the use cases of the published metadata
  without internal product names (the `octopus` cases name the Studio and Polvi; product
  meanings stay in aliases), and add a short action label to the metadata for the labelled
  `title` example of each icon page.
- **API surface check on a first release (cleared 2026-11-11):** `scripts/check-api-surface.mjs`
  stopped with an error on a package never published, because `npm view <name> versions`
  answers E404 instead of an empty list. It now reads E404 as "no earlier published version"
  and still stops on any other npm failure.
- **Definition of Done:**
  - Every gate of spec §12 is green, and `pnpm prepublishOnly` passes.
  - `@bymax-one/icons@1.0.0` is on npm; the published tarball matches a local pack.
  - Trusted publishing is configured, and `bymax-studio-web` switches to the npm version.
- **Context / preconditions:** P4 done.
- **References:** spec §11, §12, §13, §16.
- **Size:** M

### P6: react-native

- **Goal:** Ship the same icon set as React Native components.
- **Scope (in):** a `./native` subpath generated from the same `icons/` sources by the same
  pipeline; components rendering with `react-native-svg` (`Svg`, `Path`, `Circle` and the
  other allowed elements); the props contract of the web components where it applies
  (`size`, `color` as the `currentColor` equivalent, `strokeWidth`, `title` as
  `accessibilityLabel`, a decorative icon hidden with `accessibilityElementsHidden` and
  `importantForAccessibility="no-hide-descendants"`); brand marks included; `react-native`
  and `react-native-svg` as optional peer dependencies (`peerDependenciesMeta`), so
  `dependencies` stays `{}` and web consumers are unaffected; tree-shakable per-icon
  modules; Metro resolves the subpath through the `exports` map, with a `react-native`
  condition if it needs one.
- **Scope (out):** Vue, Svelte and Angular packages.
- **Definition of Done:**
  - The generated native modules pass `check:generated`.
  - A Jest test renders every native icon, through `react-native-svg` mocks or
    `react-test-renderer`.
  - A scratch Expo app on the current SDK imports from the packed tarball and renders icons
    on iOS and Android; how it was verified is recorded in the phase's task file.
  - The size and attw gates cover `./native`.
  - The README gains a React Native section.
- **Context / preconditions:** P5 done (1.0.0 published) and B4 done (the complete set).
- **Rules-of-phase:** the native components are generated from the same sources as the web
  ones; no drawing is maintained twice.
- **References:** spec §1.3, §10, §16, §17 (D6).
- **Size:** M

---

## 6. Open Questions

1. **Evidence for the B0 gate.** Resolved: P2 ships a minimal contact-sheet render,
   `pnpm contact-sheet`, which draws every icon at 16, 20, 24 and 48 px on the light and dark
   Studio pages in the ink and the six accents (the Studio design system's values), with
   `@resvg/resvg-js` as a dev dependency, into `reports/contact-sheet.png`. B0 gates on that
   sheet and a manual similarity review; P3 keeps the family sheet, the visual regression,
   the automated similarity check and the PR preview.

---

## 7. Update Protocol

When a phase changes status:

1. Update the phase's **Status** and **Progress** in the Phase Table (section 1) and set **Last
   Updated** to the current date.
2. Update the **Overall progress** counter and the **Active phase** line in the Progress
   Dashboard.
3. If the phase is blocked, set ⛔, name the blocker in the phase's Context, and list it under
   **Blocked phases** in the dashboard.
4. When a phase reaches ✅, verify its Definition of Done checklist is fully observable in the
   repository (green commands, merged commits, recorded approvals) before flipping the emoji.
5. Mirror the status change in the phase's task file under `docs/tasks/` when task files exist;
   the dashboard in **this file is canonical** and wins on divergence.
6. Commit the documentation update with a `docs:` Conventional Commit in the same change set
   that completed the phase.

---

## 8. References

- [`technical_specification.md`](./technical_specification.md), the source spec for every
  phase in this plan.
- Sibling prior art: `@bymax-one/nest-config`, `@bymax-one/nest-auth` and
  `@bymax-one/nest-cache` (repository layout, quality gates and release flow this plan
  mirrors), and `bymaxone/.github` (reusable workflows and shared review rules).
