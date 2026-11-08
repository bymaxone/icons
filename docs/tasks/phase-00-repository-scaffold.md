# Phase 0: repository-scaffold

> **Status**: 🔄 In Progress · **Progress**: 0 / 7 tasks · **Last updated**: 2026-11-08
> **Source roadmap**: [`../development_plan.md`](../development_plan.md) §5 (P0)
> **Source spec**: [`../technical_specification.md`](../technical_specification.md) §1.4, §11, §12, §13, §16

---

## Context

This phase stands up the complete repository toolchain and governance for `@bymax-one/icons` so that every later phase lands on green gates from its first commit. It delivers the `package.json` with the `.` and `./meta` exports map, the TypeScript and tsup build configuration, lint and format tooling, both Jest configs with the 100% coverage threshold, the Stryker configuration at `break: 100`, local commit governance (husky, commitlint, lint-staged, `.gitmessage`), the community, security and trademark files, the family quality scripts, every family workflow, the issue templates, the pull request template with the originality attestation, the Copilot instruction files, and the minimal `ICON_GRID` export that gives every gate a real artifact to measure. CI is front-loaded on purpose: the phase's own pull request runs the full gate.

At the start of this phase the repository holds only a GitHub-generated `README.md` and the approved `docs/technical_specification.md`. The current `main` of `bymaxone/nest-config` is the primary reference (its scaffold commit 2594df2 shows the file set); `bymaxone/nest-auth` supplies the React, TSX and jsdom specifics, `bymaxone/nest-cache` the newest eslint 10 + import-x setup, and `bymaxone/.github` the reusable workflows, the shared review rules and the Copilot files. Configuration is copied from their remote `main` and adapted, never invented.

---

## Rules-of-phase

1. **Copy from the family, adapt, never invent.** Every config file starts from its current remote equivalent (`gh api repos/bymaxone/<repo>/contents/<path>`), never from a local clone, which may be stale.
2. **Two subpaths exactly**: `.` (React components) and `./meta` (React-free metadata). The other subpaths of spec §8.1 are added in P2, with their `exports`, tsup entries and gate lists.
3. **`dependencies` stays `{}`.** `react ^19.0.0` is a required peer, mirrored in `devDependencies`.
4. **Both Jest configs enforce 100%** line, branch, function and statement coverage, with `maxWorkers: '50%'`.
5. **CI from the start.** `ci.yml` calls `bymaxone/.github` `node-lib-ci.yml@v1` with a local `verify` job and the `CI passed` aggregate; the companion workflows are committed now. Third-party actions are pinned by SHA exactly as in the reference; first-party reusables use `@v1`.
6. **English-only, timeless content.** No plan-stage or task references in any committed source or config file.
7. **No `.gitkeep`** or empty-directory placeholders anywhere; the shared CI refuses them.
8. **Conventional Commits** with a scope from `icons | brands | runtime | meta | site | build | deps | release`: `<type>(<scope>): <subject> (0.N)`. Never add `Co-Authored-By`, "Generated with", or any AI-attribution line to commits, PR titles, PR bodies, or comments.
9. **No drawing and no runtime.** The `Icon` base is P1 and the first drawings are B0.

---

## Reference docs

- [`../development_plan.md`](../development_plan.md) §5 "P0: repository-governance" (scope, DoD) and §4 "Global Conventions".
- [`../technical_specification.md`](../technical_specification.md) §1.4 (distribution), §11 (dependencies and packaging), §12 (quality gates), §13 (repository standard), §16 (phases).
- Remote references: `bymaxone/nest-config` (primary; scaffold commit 2594df2 for the file list, current `main` for the content), `bymaxone/nest-auth` (React, TSX, jsdom, `scripts/check-exports.mjs`, `scripts/check-consumer-runtime.mjs`), `bymaxone/nest-cache` (eslint 10 + import-x), `bymaxone/.github` (`node-lib-ci.yml` inputs, `agents/code-review-rules.md`, Copilot files).

---

## Task index

| ID  | Task                                                                                                                                                      | Status    | Priority | Size | Depends on              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------- | ---- | ----------------------- |
| 0.1 | `package.json` + `pnpm-workspace.yaml` + pnpm install                                                                                                     | 👀 Review | P0       | S    | none                    |
| 0.2 | Build config: tsconfig set + `tsup.config.ts` + the `ICON_GRID` source and its specs                                                                      | 👀 Review | P0       | S    | 0.1                     |
| 0.3 | Quality tooling: ESLint flat config, Prettier, Jest configs, Stryker                                                                                      | 👀 Review | P0       | M    | 0.2                     |
| 0.4 | Governance files: husky, commitlint, `.gitmessage`, LICENSE, README, CHANGELOG, SECURITY, CONTRIBUTING, CODE_OF_CONDUCT, TRADEMARKS, CLAUDE.md, AGENTS.md | 👀 Review | P0       | M    | 0.1                     |
| 0.5 | Scripts and `.github/`: family scripts, workflows, dependabot, issue and PR templates, Copilot files                                                      | 👀 Review | P0       | L    | 0.2, 0.3                |
| 0.6 | GitHub settings: ruleset, code security configuration, environment, labels                                                                                | 📋 ToDo   | P0       | S    | 0.7 (PR merged)         |
| 0.7 | Phase close: full-gate verification, dashboards, PR with Copilot review                                                                                   | 📋 ToDo   | P0       | S    | 0.1, 0.2, 0.3, 0.4, 0.5 |

Task 0.6 runs after the phase PR merges, because two of its steps need `CI passed` to have reported on `main` and the repository to contain a detected language.

---

## Tasks

### Task 0.1: `package.json` + `pnpm-workspace.yaml` + pnpm install

- **Status**: 👀 Review
- **Priority**: P0
- **Size**: S
- **Depends on**: none

#### Description

Author `package.json` under the `@bymax-one` scope with the two-subpath exports map, the family scripts, the `react` peer and `"dependencies": {}`; add `pnpm-workspace.yaml` with the pnpm 11 `allowBuilds` map and the advisory floors; install.

#### Acceptance criteria

- [x] `package.json` declares `"name": "@bymax-one/icons"`, `"version": "0.1.0"`, `"type": "module"`, `"sideEffects": false`, `"files": ["dist", "LICENSE", "README.md", "CHANGELOG.md", "TRADEMARKS.md"]`, `"engines": { "node": ">=24.0.0" }`, `"packageManager": "pnpm@11.20.0"`, `publishConfig` public with provenance.
- [x] `exports` declares `.`, `./meta` and `./package.json`, each subpath with per-condition `types` (`.d.ts` for `import`, `.d.cts` for `require`); top-level `main`/`module`/`types`; `typesVersions` lists `.d.cts` then `.d.ts` for `meta`.
- [x] `"dependencies": {}`; `react ^19.0.0` as a required peer, mirrored in `devDependencies`.
- [x] Family scripts present, including `prepublishOnly` and `release` (`npm publish --provenance --access public`).
- [x] `pnpm install` completes and generates `pnpm-lock.yaml`; `pnpm audit` reports only the advisories `osv-scanner.toml` records.

#### Files to create / modify

- `package.json`, `pnpm-lock.yaml` (generated), `pnpm-workspace.yaml`, `osv-scanner.toml`, `.npmrc`, `.gitignore`

#### Agent prompt

```
You are a senior TypeScript library release engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, a public npm package: an original Bymax icon set shipped as React 19
components, raw SVG files, an SVG sprite and typed metadata, on one 24 px grid with a 1.5 px
stroke. Zero direct dependencies; react ^19 is the only peer. Follows the @bymax-one library
standard in full.

CURRENT PHASE: 0 (repository-scaffold), Task 0.1 of 7 (FIRST)

PRECONDITIONS
- The repository holds only the GitHub-generated README.md and docs/technical_specification.md.

REQUIRED READING (only these, do not load more):
- docs/technical_specification.md §11 "Dependencies and Packaging".
- Remote bymaxone/nest-config main: package.json, pnpm-workspace.yaml, osv-scanner.toml, .npmrc,
  .gitignore. Remote bymaxone/nest-cache main: package.json (newest devDependency versions).
  Remote bymaxone/nest-auth main: package.json (react and @types/react versions,
  check:exports script).

TASK
Author package.json, pnpm-workspace.yaml, osv-scanner.toml, .npmrc and .gitignore, and install.

DELIVERABLES
1. package.json with the fields of the acceptance criteria; exports for ".", "./meta" and
   "./package.json"; the family scripts (build with strip-bundle-comments, check:api,
   check:exports through scripts/check-exports.mjs, check:file-length, check:lint-graph,
   check:mutants, check:published, check:runtime, clean, dogfood, format, format:check, lint,
   lint:fix, mutation, mutation:dry-run, mutation:full, prepare, prepublishOnly, release, size,
   test, test:cov, test:cov:all, test:watch, typecheck); lint-staged; devDependencies at the
   versions the reference repositories use today.
2. pnpm-workspace.yaml with allowBuilds (esbuild true, unrs-resolver true, @parcel/watcher
   false) and overrides floors only for vulnerable packages present in this tree, each with its
   advisory ids in a comment.
3. osv-scanner.toml only for advisories with no fixed release in the majors in use, each with id,
   ignoreUntil and reason.
4. Run `pnpm install`.

Constraints:
- dependencies stays {}. Copy version ranges from the references; do not invent versions.
- English-only, timeless content. No .gitkeep. No AI attribution anywhere.

Verification:
- `pnpm install` expected: completes without ERR_PNPM_IGNORED_BUILDS.
- `node -e "const p=require('./package.json'); if(Object.keys(p.dependencies||{}).length) throw new Error('deps not empty')"` expected: no throw.
- `pnpm audit` expected: only the advisories recorded in osv-scanner.toml.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 7) in the header blockquote.
4. Append a Completion log entry: `- 0.1 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P0 row in docs/development_plan.md §1 and the folder index in docs/tasks/README.md.
6. Commit: `build(deps): scaffold package manifest and workspace (0.1)`.
```

---

### Task 0.2: Build config: tsconfig set + `tsup.config.ts` + the `ICON_GRID` source and its specs

- **Status**: 👀 Review
- **Priority**: P0
- **Size**: S
- **Depends on**: 0.1

#### Description

Write the tsconfig family with the DOM library and the automatic JSX runtime, a `tsconfig.meta.json` that type-checks `./meta` without the DOM, `tsup.config.ts` with two browser entries, and the minimal real source: the frozen `ICON_GRID` constant of spec §2, exported from `./meta` and re-exported from the root by package specifier, with specs at 100% coverage.

#### Acceptance criteria

- [x] `tsconfig.json` (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `lib: ["ES2022", "DOM"]`, `jsx: "react-jsx"`, `paths` for both subpaths), `tsconfig.build.json`, `tsconfig.jest.json`, `tsconfig.meta.json` (`lib: ["ES2022"]`, `types: []`, `src/meta` only).
- [x] `tsup.config.ts` builds `index` and `meta/index` as ESM `.mjs` and CJS `.cjs` with `.d.ts` and `.d.cts`, `target: 'es2022'`, the root with `jsx: 'automatic'`, `react` and the package's own subpaths external, no `'use client'` banner.
- [x] `src/meta/icon-grid.ts` exports `ICON_GRID` (viewBox `0 0 24 24`, size 24, live area 20, padding 2, stroke 1.5, round caps and joins) and `IconGrid`; `src/meta/index.ts` and `src/index.ts` re-export them.
- [x] `pnpm typecheck` and `pnpm build` pass; `dist/index.mjs` imports `@bymax-one/icons/meta` instead of inlining the grid.

#### Files to create / modify

- `tsconfig.json`, `tsconfig.build.json`, `tsconfig.jest.json`, `tsconfig.meta.json`, `tsup.config.ts`
- `src/index.ts`, `src/index.spec.ts`, `src/meta/index.ts`, `src/meta/icon-grid.ts`, `src/meta/icon-grid.spec.ts`

#### Agent prompt

```
You are a senior TypeScript library engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19 (components, raw SVG, sprite,
typed metadata). Zero direct dependencies; react ^19 is the only peer.

CURRENT PHASE: 0 (repository-scaffold), Task 0.2 of 7

PRECONDITIONS
- Task 0.1 is done: package.json and pnpm-lock.yaml exist and `pnpm install` is clean.

REQUIRED READING (only these):
- docs/technical_specification.md §2.1, §2.2 (grid and stroke), §8.1 (subpaths), §11.
- Remote bymaxone/nest-auth main: tsconfig.json, tsconfig.build.json, tsconfig.jest.json,
  tsconfig.server.json, tsup.config.ts (the react entry).
- Remote bymaxone/nest-config main: tsup.config.ts (sibling subpaths external).

TASK
Write the tsconfig set and tsup.config.ts, and the minimal real source every gate can measure.

DELIVERABLES
1. The four tsconfig files of the acceptance criteria. tsconfig.meta.json is modelled on
   nest-auth's tsconfig.server.json: it proves ./meta compiles without the DOM library.
2. tsup.config.ts as an array of two entries (index, meta/index), browser target es2022, JSX
   automatic on the root, external: react, react/jsx-runtime, /^@bymax-one\/icons\//.
3. src/meta/icon-grid.ts with ICON_GRID (Object.freeze, literal types through the IconGrid
   interface) and @fileoverview + @layer header and JSDoc with an @example; the two barrels;
   co-located specs where every it() carries a scenario comment, covering every value, the
   live-area arithmetic, the exact key set, the freeze, and the root re-export identity.

Constraints:
- No Icon component, no hooks, no drawings: those are P1 and B0.
- The root imports ./meta by package specifier, never by relative path.
- Functions <= 50 lines; files <= 800; zero any; English-only, timeless comments.

Verification:
- `pnpm typecheck` expected: exit 0 for all three tsc runs.
- `pnpm build && cat dist/index.mjs` expected: a re-export from '@bymax-one/icons/meta'.
- `pnpm test` expected: all suites pass.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 7).
4. Append a Completion log entry: `- 0.2 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P0 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `build(meta): add tsconfig, tsup entries and the icon grid (0.2)`.
```

---

### Task 0.3: Quality tooling: ESLint flat config, Prettier, Jest configs, Stryker

- **Status**: 👀 Review
- **Priority**: P0
- **Size**: M
- **Depends on**: 0.2

#### Description

Adopt the family's eslint 10 + import-x flat config with the TSX block and a React ban on `./meta`, the Prettier configuration, the two Jest configs at 100% and the Stryker configuration at `break: 100`.

#### Acceptance criteria

- [x] `eslint.config.mjs`: `@eslint/js`, `@typescript-eslint`, import-x with `import-x/parsers` mapping `.ts` and `.tsx`, `security`, `prettier`, `eslint-config-prettier` last; `src/**/*.{ts,tsx}` with `ecmaFeatures.jsx` and browser globals; a block refusing `react` imports under `src/meta/`; scripts, config-file and spec blocks.
- [x] `.prettierrc` and `.prettierignore` copied from the reference.
- [x] `jest.config.ts` and `jest.coverage.config.ts` match `.ts` and `.tsx` specs, mirror the tsconfig `paths`, exclude barrels from coverage, and enforce 100% globally; `jest.stryker.config.ts` swaps in Stryker's Node environment and documents the jsdom docblock.
- [x] `stryker.config.json` mutates `src/**/*.{ts,tsx}` minus specs and barrels, `ignoreStatic: false`, thresholds 100/100/100.
- [x] `pnpm lint`, `pnpm format:check`, `pnpm test:cov:all` and `pnpm check:lint-graph` pass.

#### Files to create / modify

- `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `jest.config.ts`, `jest.coverage.config.ts`, `jest.stryker.config.ts`, `stryker.config.json`

#### Agent prompt

```
You are a senior TypeScript tooling engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Zero direct dependencies.

CURRENT PHASE: 0 (repository-scaffold), Task 0.3 of 7

PRECONDITIONS
- Task 0.2 is done: the source and its specs build and pass.

REQUIRED READING (only these):
- docs/technical_specification.md §12 "Quality Gates".
- Remote bymaxone/nest-config main: eslint.config.mjs, .prettierrc, .prettierignore,
  jest.config.ts, jest.coverage.config.ts, jest.stryker.config.ts, stryker.config.json.
- Remote bymaxone/nest-auth main: eslint.config.mjs (TSX block), jest.config.ts,
  jest.stryker.config.ts, stryker.config.json.

TASK
Write the lint, format, test and mutation configuration.

DELIVERABLES
1. eslint.config.mjs as in the acceptance criteria, keeping the family's rule set and the
   denied-import list.
2. Prettier files copied from nest-config.
3. Jest configs with .tsx support and the 100% threshold in both; the Stryker Jest config
   ignoring the script specs that kill no mutant.
4. stryker.config.json at break 100.

Constraints:
- No suppression comments. No rule weakened relative to the reference.
- English-only, timeless comments.

Verification:
- `pnpm lint && pnpm format:check` expected: exit 0.
- `pnpm test:cov:all` expected: 100% on every metric.
- `pnpm check:lint-graph` expected: "import-x/no-cycle rejected a real cycle".
- A temporary `import 'react'` under src/meta/ expected: rejected by lint (then delete it).

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 7).
4. Append a Completion log entry: `- 0.3 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P0 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `build(deps): add lint, format, test and mutation configuration (0.3)`.
```

---

### Task 0.4: Governance files

- **Status**: 👀 Review
- **Priority**: P0
- **Size**: M
- **Depends on**: 0.1

#### Description

Add the commit governance and the open-source baseline files in the family layout, adapted honestly to a pre-1.0 package with no icons yet.

#### Acceptance criteria

- [x] `.husky/pre-commit` (`pnpm exec lint-staged`), `.husky/commit-msg` (`pnpm exec commitlint --edit "$1"`), `.husky/pre-push` (the family placeholder), `commitlint.config.cjs`, `.gitmessage` with the scopes of spec §13.
- [x] `LICENSE` (MIT, `Copyright (c) 2026 Bymax One`); `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1 by link); `SECURITY.md` (support@bymax.one; SVG injection, malicious path data, supply chain); `CHANGELOG.md` (Keep a Changelog, `## [Unreleased]`); `CONTRIBUTING.md` (with the drawing originality rules of spec §3); `TRADEMARKS.md` (spec §5).
- [x] `README.md` in the family layout: centred wordmark, h1, tagline, flat-square badges, link row, the emoji sections in family order; status stated as pre-1.0 with no icons; no invented numbers.
- [x] `CLAUDE.md` (`# @bymax-one/icons — AI Agent Quick Reference`, family structure) and `AGENTS.md` with the current `bymaxone/.github` `agents/code-review-rules.md` between the shared markers, byte-identical, then the repository narrowings.
- [x] A non-conventional commit message is rejected by the `commit-msg` hook.

#### Files to create / modify

- `.husky/*`, `commitlint.config.cjs`, `.gitmessage`, `LICENSE`, `README.md`, `CHANGELOG.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `TRADEMARKS.md`, `CLAUDE.md`, `AGENTS.md`

#### Agent prompt

```
You are a senior open-source maintainer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19 (components, raw SVG, sprite,
typed metadata). Zero direct dependencies. Pre-1.0: no icon is drawn yet.

CURRENT PHASE: 0 (repository-scaffold), Task 0.4 of 7

PRECONDITIONS
- Task 0.1 is done.

REQUIRED READING (only these):
- docs/technical_specification.md §3 (originality), §5 (brand icons), §10, §13.
- Remote bymaxone/nest-config main: README.md, SECURITY.md, CODE_OF_CONDUCT.md,
  CONTRIBUTING.md, CHANGELOG.md (header), .gitmessage, .husky/*, commitlint.config.cjs.
- Remote bymaxone/nest-cache main: CLAUDE.md, .husky/pre-push.
- Remote bymaxone/.github main: agents/code-review-rules.md.

TASK
Write the governance and community files in the family layout.

DELIVERABLES
1. The hook, commitlint and .gitmessage files.
2. The baseline files of the acceptance criteria. README follows the family section order;
   shipped features are marked ✅ and planned ones 📋; every TypeScript fence compiles against
   dist/ (check:published compiles them).
3. CLAUDE.md and AGENTS.md; the shared block is pasted verbatim, never edited.

Constraints:
- No invented numbers, no badge for a measurement that does not exist yet.
- English-only. No AI attribution anywhere.

Verification:
- `echo "bad message" | pnpm exec commitlint` expected: non-zero exit.
- `awk '/<!-- shared:begin -->/{f=1} f; /<!-- shared:end -->/{f=0}' AGENTS.md | diff - <canonical>` expected: no output.
- `wc -c AGENTS.md` expected: under 32768.
- `pnpm format:check` expected: exit 0.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 7).
4. Append a Completion log entry: `- 0.4 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P0 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `docs(release): add governance and community files (0.4)`.
```

---

### Task 0.5: Scripts and `.github/`

- **Status**: 👀 Review
- **Priority**: P0
- **Size**: L
- **Depends on**: 0.2, 0.3

#### Description

Copy the family scripts, byte-identical where the family keeps them so, and adapt the rest to the two subpaths; copy the family workflows with their SHA pins; add dependabot, the issue templates, the pull request template and the Copilot files.

#### Acceptance criteria

- [x] Byte-identical with `nest-config` main: `check-api-surface.mjs`, `check-file-length.mjs` (+ empty `file-length-baseline.json`), `strip-bundle-comments.mjs`, `check-mutation-directives.mjs`, `check-lint-graph-rules.mjs`, `check-published-surface.mjs`, `readme-snippets.mjs`, and the specs of the first three; byte-identical with `nest-auth` main: `check-exports.mjs`.
- [x] Adapted: `check-size.mjs` (provisional budgets for `.` and `./meta`), `dogfood-smoke-test.mjs` and `check-consumer-runtime.mjs` (subpaths `.` and `./meta`, `TRADEMARKS.md` allowed in the tarball), `readme-prelude.d.ts`.
- [x] `ci.yml` calls `node-lib-ci.yml@v1` (`run-format-check: true`, `run-build: false`, `unit-command: pnpm test:cov:all`, `run-mutation: true`), runs the local `verify` job over `index` and `meta/index`, the `security` job, and the `CI passed` aggregate.
- [x] `codeql.yml`, `scorecard.yml`, `osv-scanner.yml`, `peer-advisory-drift.yml`, `agents-sync.yml`, `mutation-full.yml`, `api-surface.yml`, `release.yml` copied from `nest-config` main with identical SHA pins and adapted names.
- [x] `dependabot.yml` (npm and github-actions, weekly, React major ignored); `ISSUE_TEMPLATE/` (bug, feature, `config.yml` without a Discussions link); `pull_request_template.md` with the originality attestation; `copilot-instructions.md` (baseline plus repository rules), `instructions/code.library.instructions.md`, `instructions/tests.instructions.md`, `agents/agent-code-reviewer.agent.md` from `bymaxone/.github`.
- [x] `actionlint` reports nothing; `pnpm size`, `pnpm check:exports`, `pnpm check:runtime` and `pnpm dogfood` pass.

#### Files to create / modify

- `scripts/*`, `src/check-api-surface.spec.ts`, `src/check-file-length.spec.ts`, `src/strip-bundle-comments.spec.ts`
- `.github/workflows/*.yml`, `.github/dependabot.yml`, `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`, `.github/copilot-instructions.md`, `.github/instructions/*`, `.github/agents/*`

#### Agent prompt

```
You are a senior CI and release engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Zero direct dependencies.
Two subpaths today: "." and "./meta".

CURRENT PHASE: 0 (repository-scaffold), Task 0.5 of 7

PRECONDITIONS
- Tasks 0.2 and 0.3 are done: the package builds and every source gate is green.

REQUIRED READING (only these):
- docs/technical_specification.md §12, §13.
- Remote bymaxone/nest-config main: scripts/*, .github/**.
- Remote bymaxone/nest-auth main: scripts/check-exports.mjs, scripts/check-consumer-runtime.mjs.
- Remote bymaxone/.github main: .github/workflows/node-lib-ci.yml (inputs),
  .github/copilot-instructions.md, .github/instructions/code.library.instructions.md,
  .github/instructions/tests.instructions.md, .github/agents/agent-code-reviewer.agent.md.

TASK
Add the scripts and the .github directory.

DELIVERABLES
1. The scripts of the acceptance criteria; adapted ones keep the family structure and change
   only names, subpaths and budgets.
2. The workflows of the acceptance criteria; third-party actions keep the reference's SHA pins;
   ci.yml drops the e2e job (no e2e suite yet) and keeps verify, security and CI passed.
3. dependabot.yml, the issue templates, the pull request template (the one deliberate addition
   to the family, for the originality attestation), and the Copilot files.

Constraints:
- Never pin a bymaxone/.github reusable to a SHA; never leave a third-party action unpinned.
- The mutation-full cron is staggered against the other libraries.
- English-only. No AI attribution anywhere.

Verification:
- `actionlint` expected: no output.
- `pnpm build && pnpm size && pnpm check:exports && pnpm check:runtime && pnpm dogfood` expected: exit 0.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 7).
4. Append a Completion log entry: `- 0.5 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P0 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `ci(release): add family scripts, workflows and templates (0.5)`.
```

---

### Task 0.6: GitHub settings

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: 0.7 (the phase PR merged)

#### Description

Bring the repository's GitHub configuration in line with the family once the scaffold is on `main`. These are organisation and repository settings, performed by a maintainer with admin rights; nothing here is a file in the tree.

#### Acceptance criteria

- [ ] `CI passed` has reported on a push to `main`, and `icons` is added to the org ruleset `require-ci-passed`.
- [ ] The org code security configuration is re-attached to `bymaxone/icons`. The first attachment failed on the empty repository because no language was detected; with TypeScript on `main` it applies.
- [ ] The `npm-publish` environment exists with required reviewers and deployments restricted to `v*.*.*` tags.
- [ ] Private vulnerability reporting is enabled; the `dependencies` (#0366d6), `github-actions` (#000000) and `peer-advisory-drift` (#B60205) labels exist.
- [ ] Description, topics (including `typescript`) and merge settings match the family (squash and rebase allowed, merge commits off, delete branch on merge on).
- [ ] The first CodeQL, Scorecard and OSV-Scanner runs on `main` are green.

#### Files to create / modify

- None (GitHub settings only); `docs/tasks/phase-00-repository-scaffold.md` and `docs/development_plan.md` for status.

#### Agent prompt

```
You are a senior repository administrator for the bymaxone GitHub organisation.

PROJECT: @bymax-one/icons (github.com/bymaxone/icons), a public npm library following the
@bymax-one library standard.

CURRENT PHASE: 0 (repository-scaffold), Task 0.6 of 7

PRECONDITIONS
- The phase PR is merged and CI has run on main.
- The operator has explicit authorisation to change organisation and repository settings.

REQUIRED READING (only these):
- docs/development_plan.md §5 "P0" Definition of Done.
- The settings of bymaxone/nest-config, read with `gh api repos/bymaxone/nest-config` and
  `gh api orgs/bymaxone/rulesets`, as the reference.

TASK
Apply the settings of the acceptance criteria and record the evidence.

DELIVERABLES
1. Confirm `CI passed` on main: `gh api repos/bymaxone/icons/commits/main/check-runs --jq '.check_runs[] | select(.name=="CI passed") | .conclusion'` returns success.
2. Add the repository to the require-ci-passed ruleset's target list.
3. Re-attach the org code security configuration to the repository.
4. Create the npm-publish environment, the labels, and apply the repository settings.

Constraints:
- Change nothing on any other repository. Never weaken a ruleset to make a check pass.
- No AI attribution in any description or comment.

Verification:
- `gh api orgs/bymaxone/rulesets/<id>` expected: the icons repository is targeted.
- `gh api repos/bymaxone/icons/environments/npm-publish` expected: reviewers and tag policy set.
- A pull request opened after this task expected: `CI passed` listed as required.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 7).
4. Append a Completion log entry: `- 0.6 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P0 row in docs/development_plan.md §1 and docs/tasks/README.md, then commit
   `docs(release): record repository settings for phase 0 (0.6)`.
```

---

### Task 0.7: Phase close: full-gate verification, dashboards, PR with Copilot review

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: 0.1, 0.2, 0.3, 0.4, 0.5

#### Description

Audit every Definition of Done item that the tree can prove, update all dashboards, open the phase pull request, obtain and address a GitHub Copilot code review, and merge once CI is green and every review thread is resolved. Task 0.6 follows the merge.

#### Acceptance criteria

- [ ] Every tree-level P0 Definition of Done bullet in `../development_plan.md` §5 verified observable (green commands recorded in the PR description).
- [ ] Phase file dashboards, `docs/development_plan.md` §1 and `docs/tasks/README.md` all consistent.
- [ ] PR opened to `main` with a professional English title and body (scope summary, verification evidence, no attribution footer), using the pull request template.
- [ ] GitHub Copilot code review requested; every thread answered with what was measured and resolved.
- [ ] PR merged with `CI passed` green; branch deleted.

#### Files to create / modify

- `docs/tasks/phase-00-repository-scaffold.md` (statuses, log)
- `docs/development_plan.md` (dashboard)
- `docs/tasks/README.md` (folder index)

#### Agent prompt

```
You are a senior release engineer closing a phase on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Public npm package. This
task closes Phase 0 (repository-scaffold) up to the merge.

CURRENT PHASE: 0 (repository-scaffold), Task 0.7 of 7 (phase close)

PRECONDITIONS
- Tasks 0.1 through 0.5 are ✅ and committed on the phase branch.

REQUIRED READING (only these):
- docs/development_plan.md §5 "P0: repository-governance" (the Definition of Done list).
- docs/tasks/phase-00-repository-scaffold.md (this file's task index and completion log).

TASK
Audit the phase, update every dashboard, and drive the phase PR through Copilot review to merge.

DELIVERABLES
1. Run the full local gate and record outputs: pnpm typecheck, pnpm lint, pnpm format:check,
   pnpm test:cov:all, pnpm build, pnpm size, pnpm check:exports, pnpm check:runtime,
   pnpm dogfood, actionlint. All must be green.
2. Verify each tree-level P0 Definition of Done bullet and note the verifying command next to
   it in the PR body.
3. Update dashboards (this phase file, docs/development_plan.md §1, docs/tasks/README.md) and
   commit as `docs(release): close phase 0 dashboards (0.7)`.
4. Open the PR: `gh pr create --title "feat(meta): repository scaffold and quality gates"` with
   a body in the template's sections. No attribution footer of any kind.
5. Request a GitHub Copilot code review. Address EVERY finding: verify it against the code,
   fix valid ones in follow-up commits, answer non-applicable ones in the thread with the
   evidence, and resolve each thread. Check `reviewThreads` with `isResolved == false` through
   `gh api graphql` after every push, before the merge and after the merge.
6. Merge only when `CI passed` is green and no thread is open: `gh pr merge --squash
   --delete-branch`. Then hand over to Task 0.6.

Constraints:
- Never bypass a red gate to merge. Never use --admin or force flags.
- Never add Co-Authored-By, "Generated with", or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- English-only. No em dashes.

Verification:
- `gh pr checks` expected: all green before merge.
- `gh api graphql` reviewThreads expected: none with isResolved false.
- After merge: `git log origin/main --oneline -1` shows the squash commit.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 7).
4. Append a Completion log entry: `- 0.7 ✅ <YYYY-MM-DD> phase merged via PR #<n>`.
5. Update the P0 row in docs/development_plan.md §1 and docs/tasks/README.md.
```

---

## Completion log

<!-- Append one line per completed task: - <id> ✅ YYYY-MM-DD <summary> -->
