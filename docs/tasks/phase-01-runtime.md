# Phase 1: runtime

> **Status**: ✅ Done · **Progress**: 7 / 8 tasks · **Last updated**: 2026-11-08
> **Source roadmap**: [`../development_plan.md`](../development_plan.md) §5 (P1)
> **Source spec**: [`../technical_specification.md`](../technical_specification.md) §2.1, §2.2, §2.7, §6.3, §8.1 to §8.5, §11, §12
>
> Every Definition of Done item of P1 is verified in the tree (see the completion log). Task 1.8, the phase pull request, waits for the owner's go-ahead.

---

## Context

This phase delivers the runtime every Bymax icon renders through: the `IconProps` of spec §8.3, the data shape a drawing is stored in (the element list the P2 generator will emit), the `Icon` base that turns that data into an `<svg>` with `createElement`, the stroke maths of `absoluteStrokeWidth`, the accessibility rules of spec §8.5, and the `createIcon` factory each generated module will be one call to. Everything ships from the root entry `.`; no subpath is added (P2 adds them).

At the start of this phase the root and `./meta` export only `ICON_GRID`. React 19 is the installed peer (19.3.1 in the lockfile), `@types/react` is present, and the jsdom environment, `react-dom` and `@testing-library/react` are not installed.

**React 19 `ref` as a prop, confirmed against the official documentation before implementation** (2026-11-08):

- [react.dev/blog/2024/12/05/react-19](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop), section "`ref` as a prop": "Starting in React 19, you can now access `ref` as a prop for function components ... New function components will no longer need `forwardRef`." Refs passed to class components are not props.
- [react.dev/reference/react/forwardRef](https://react.dev/reference/react/forwardRef): "In React 19, `forwardRef` is no longer necessary. Pass `ref` as a prop instead."

The jsdom spec `src/runtime/icon.dom.spec.tsx` proves it on the installed version: an object ref passed to `Icon` and to a `createIcon` component, and a callback ref passed to `Icon`, receive the rendered `SVGSVGElement`.

---

## Rules-of-phase

1. **Markup is built from data.** The runtime creates every element with `createElement`; no JSX string, no `dangerouslySetInnerHTML`, no SVG parsing. No consumer prop may become markup: `title` is text and an attribute value only, and a consumer's `children` and `dangerouslySetInnerHTML` are dropped.
2. **Pure components.** No hook, no context, no `'use client'`; `createElement` is the only value the runtime imports from `react`.
3. **The runtime reads the grid from `./meta` by package specifier** (`@bymax-one/icons/meta`), never by relative path, so the published package holds one copy of it. `src/meta` imports nothing from the runtime.
4. **No new subpath.** `exports`, the tsup entries and the gate lists keep `.` and `./meta`.
5. **React specs** use the Stryker jsdom docblock; the Server Components spec selects the `react-server` export condition through `@jest-environment-options`.
6. **Dev dependencies at the family's ranges.** `react-dom`, `@types/react-dom`, `@testing-library/react` and `jest-environment-jsdom` take the ranges `bymaxone/nest-auth` uses on `main`.
7. **English-only, timeless comments**; no AI attribution anywhere; no em dashes in `docs/`.

---

## Reference docs

- [`../development_plan.md`](../development_plan.md) §4 "Global Conventions", §5 "P1: runtime", §7 "Update Protocol".
- [`../technical_specification.md`](../technical_specification.md) §2 (grid, stroke, theme), §6.3 (allowed elements), §8.3 (props), §8.4 (Server Components), §8.5 (accessibility), §11 (packaging), §12 (gates).
- Remote `bymaxone/nest-auth` `main`: `package.json` (React test dev dependencies), `src/react/__tests__/*.spec.tsx` (jsdom docblock, Testing Library usage).
- React documentation: the two pages quoted in the Context.

---

## Task index

| ID  | Task                                                                                                | Status  | Priority | Size | Depends on                   |
| --- | --------------------------------------------------------------------------------------------------- | ------- | -------- | ---- | ---------------------------- |
| 1.1 | React test dependencies and the `ref`-as-prop confirmation                                          | ✅ Done | P0       | S    | none                         |
| 1.2 | Drawing data types and `IconProps`                                                                  | ✅ Done | P0       | S    | 1.1                          |
| 1.3 | `Icon` base: stroke maths, paint, accessibility, rendering from data, with jsdom and server specs   | ✅ Done | P0       | M    | 1.2                          |
| 1.4 | `createIcon` factory: `displayName`, class names, name rule                                         | ✅ Done | P0       | S    | 1.3                          |
| 1.5 | Server Components proof and package gates (`check:runtime`, `dogfood`, `size`) on the built tarball | ✅ Done | P0       | M    | 1.4                          |
| 1.6 | Documentation: README, CHANGELOG, CLAUDE.md, AGENTS.md                                              | ✅ Done | P1       | S    | 1.5                          |
| 1.7 | Phase close: `mutation:full`, full gate, dashboards                                                 | ✅ Done | P0       | S    | 1.1, 1.2, 1.3, 1.4, 1.5, 1.6 |
| 1.8 | Phase commit and pull request with Copilot review                                                   | 📋 ToDo | P0       | S    | 1.7, owner go-ahead          |

---

## Tasks

### Task 1.1: React test dependencies and the `ref`-as-prop confirmation

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: S
- **Depends on**: none

#### Description

Install what the React specs need, at the ranges the family uses, and confirm React 19's `ref`-as-prop behaviour against the official documentation before any code relies on it.

#### Acceptance criteria

- [x] `react-dom`, `@types/react-dom`, `@testing-library/react` and `jest-environment-jsdom` are dev dependencies (the `bymaxone/nest-auth` ranges); `dependencies` stays `{}`.
- [x] `react-server-dom-webpack` is a dev dependency for the Server Components render; its `webpack` peer is marked optional in `pnpm-workspace.yaml` `packageExtensions`, because only its `./plugin` entry needs it, so pnpm installs no webpack tree.
- [x] The two react.dev statements are quoted with their URLs in this file's Context.

#### Files to create / modify

- `package.json`, `pnpm-lock.yaml` (generated), `pnpm-workspace.yaml`

#### Agent prompt

```
You are a senior TypeScript library engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19 (components, raw SVG, sprite,
typed metadata). Zero direct dependencies; react ^19 is the only peer.

CURRENT PHASE: 1 (runtime), Task 1.1 of 8 (FIRST)

PRECONDITIONS
- P0 is merged on main; the phase branch feat/icon-runtime exists.

REQUIRED READING (only these):
- docs/development_plan.md §5 "P1: runtime" (context and preconditions).
- Remote bymaxone/nest-auth main: package.json (react-dom, @types/react-dom,
  @testing-library/react, jest-environment-jsdom ranges).
- react.dev: blog/2024/12/05/react-19 ("ref as a prop") and reference/react/forwardRef.

TASK
Install the React test dependencies and record the ref-as-prop confirmation.

DELIVERABLES
1. pnpm add -D the four packages at nest-auth's ranges.
2. pnpm add -D react-server-dom-webpack, with a packageExtensions entry marking its webpack peer
   optional and a comment saying why.
3. The quoted react.dev statements in this file's Context.

Constraints:
- dependencies stays {}. No version invented; ranges come from the reference.
- English-only. No AI attribution anywhere.

Verification:
- `pnpm install` expected: completes; `ls node_modules/.pnpm | grep -c '^webpack@'` expected: 0.
- `pnpm audit` expected: nothing beyond what osv-scanner.toml records.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 8).
4. Append a Completion log entry: `- 1.1 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P1 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `build(deps): add the React test and Server Components dev dependencies (1.1)`.
```

---

### Task 1.2: Drawing data types and `IconProps`

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: S
- **Depends on**: 1.1

#### Description

Define the data shape the P2 generator will emit and the props every icon accepts.

#### Acceptance criteria

- [x] `src/runtime/icon-node.ts`: `IconElementTag` is exactly the elements of spec §6.3; `IconAttributeName` is their geometry plus `fill`, `fillRule` and `clipRule` (no `transform`, `style`, `id`, `class`, no event handler, no `dangerouslySetInnerHTML`); `IconElement` is a `[tag, attributes]` tuple; `IconNode` is a readonly list of them; `IconPaint` is `'stroke' | 'fill'`.
- [x] `src/runtime/icon-props.ts`: `IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'>` with `size`, `strokeWidth`, `absoluteStrokeWidth`, `color`, `title` and `ref?: Ref<SVGSVGElement>`, each optional property also admitting `undefined` (as `SVGProps` does), so a consumer on `exactOptionalPropertyTypes` can pass `title={maybeTitle}`; `IconBaseProps` adds `iconNode` and `paint`.
- [x] JSDoc on every export, `@fileoverview` and `@layer` headers.

#### Files to create / modify

- `src/runtime/icon-node.ts`, `src/runtime/icon-props.ts`

#### Agent prompt

```
You are a senior TypeScript library engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Zero direct dependencies.

CURRENT PHASE: 1 (runtime), Task 1.2 of 8

PRECONDITIONS
- Task 1.1 is done.

REQUIRED READING (only these):
- docs/technical_specification.md §6.3 (allowed elements), §8.3 (props).
- node_modules/@types/react/index.d.ts: SVGProps, SVGAttributes (the shape IconProps extends).

TASK
Write the drawing data types and the props.

DELIVERABLES
1. src/runtime/icon-node.ts with the types of the acceptance criteria.
2. src/runtime/icon-props.ts with IconProps and IconBaseProps.

Constraints:
- Types only; no runtime code in these two files.
- Zero any; JSDoc on every export; English-only, timeless comments.

Verification:
- `pnpm typecheck` expected: exit 0 for all three tsc runs.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 8).
4. Append a Completion log entry: `- 1.2 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P1 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `feat(runtime): add the drawing data types and IconProps (1.2)`.
```

---

### Task 1.3: `Icon` base

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: 1.2

#### Description

Write the `Icon` base and its helpers, and pin their behaviour in jsdom and in `react-dom/server`.

#### Acceptance criteria

- [x] `src/runtime/stroke.ts`: `resolveStrokeWidth` returns `strokeWidth * 24 / size` when `absoluteStrokeWidth` is set and both values are numbers or numeric strings with a size above zero; otherwise (a CSS length such as `'1em'`, a non-numeric width, a zero, negative or infinite value) it returns the width as given, never `NaN` or `Infinity`.
- [x] `src/runtime/accessibility.ts`: a non-empty `title` gives `role="img"` and `aria-label`; without one, `aria-hidden="true"` unless the consumer passed a `role` or `aria-*` prop whose value is not `undefined` or `null`; an empty title counts as none.
- [x] `src/runtime/icon.ts`: `Icon` writes, in this order (a later one wins), `xmlns`, `width` and `height` from `size` (default 24), the grid's `viewBox`, the paint (`stroke`: `fill="none"`, `stroke`, `strokeWidth`, round caps and joins from `ICON_GRID`; `fill`: `fill` only), `focusable="false"`, the accessibility attributes, then every remaining consumer prop. A `<title>` text child comes first when titled. Each drawing element is created with `createElement`; an attribute of `currentColor` takes the `color` prop. `children` and `dangerouslySetInnerHTML` are dropped.
- [x] Specs: `stroke.spec.ts`, `accessibility.spec.ts`, `icon.server.spec.tsx` (exact markup through `renderToStaticMarkup` and `renderToString`, with and without title, title escaping, every allowed element, both paints), `icon.precedence.spec.tsx` (every override and pass-through decision), `icon.dom.spec.tsx` (jsdom: SVG namespace, role queries, `ref` object and callback, event handlers). Every `it()` carries a scenario comment.

#### Files to create / modify

- `src/runtime/stroke.ts`, `src/runtime/accessibility.ts`, `src/runtime/icon.ts` and their specs

#### Agent prompt

```
You are a senior React library engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Zero direct dependencies.
Components must render in Server Components: no hooks, no context, no 'use client'.

CURRENT PHASE: 1 (runtime), Task 1.3 of 8

PRECONDITIONS
- Task 1.2 is done: the types exist and type-check.

REQUIRED READING (only these):
- docs/technical_specification.md §2.1, §2.2, §2.7, §8.3 to §8.5.
- src/meta/icon-grid.ts (the defaults come from ICON_GRID).
- AGENTS.md "Markup is built from data" and "Components stay pure".

TASK
Write the Icon base and its helpers, with specs at 100% coverage.

DELIVERABLES
1. stroke.ts, accessibility.ts and icon.ts as in the acceptance criteria. Import ICON_GRID from
   '@bymax-one/icons/meta'; import only createElement (and types) from 'react'.
2. The five spec files of the acceptance criteria. React specs in jsdom carry the docblock
   `/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */`. Server specs assert
   the exact markup, so a dropped or reordered attribute fails.

Constraints:
- Pass children as createElement arguments, not as an array prop (no key warnings).
- A default literal that makes a mutant equivalent is avoided rather than disabled.
- Functions <= 50 lines; files <= 800; zero any; English-only, timeless comments.

Verification:
- `pnpm test:cov` expected: 100% on every metric, no React warning in the output.
- `pnpm lint && pnpm typecheck` expected: exit 0.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 8).
4. Append a Completion log entry: `- 1.3 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P1 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `feat(runtime): add the Icon base with stroke maths and accessibility (1.3)`.
```

---

### Task 1.4: `createIcon` factory

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: S
- **Depends on**: 1.3

#### Description

Write the factory each generated icon module will be one call to, and export the runtime from the root.

#### Acceptance criteria

- [x] `createIcon(name, iconNode, options?)` returns a component that renders through `Icon`, with `displayName` derived from the kebab-case name (`lightning-filled` gives `LightningFilledIcon`) and the class names `bx-icon bx-icon-<name>` written before the consumer's `className` (an empty `className` adds nothing).
- [x] `options.paint` selects `stroke` (default) or `fill`.
- [x] A name that is not kebab-case (`^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`) throws a `TypeError` at creation, because it would become an ill-formed class name and component name.
- [x] `src/runtime/index.ts` and `src/index.ts` export `Icon`, `createIcon` and every runtime type; `src/index.spec.ts` pins the root's runtime names.

#### Files to create / modify

- `src/runtime/create-icon.ts`, `src/runtime/create-icon.spec.tsx`, `src/runtime/index.ts`, `src/index.ts`, `src/index.spec.ts`

#### Agent prompt

```
You are a senior React library engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Zero direct dependencies.

CURRENT PHASE: 1 (runtime), Task 1.4 of 8

PRECONDITIONS
- Task 1.3 is done: Icon renders and its specs pass.

REQUIRED READING (only these):
- docs/technical_specification.md §4.3 (naming), §8.2 (component naming).
- src/runtime/icon.ts.

TASK
Write createIcon and export the runtime from the root entry.

DELIVERABLES
1. src/runtime/create-icon.ts as in the acceptance criteria; the component calls Icon as a
   function (it is pure), so the tree holds one component per icon.
2. create-icon.spec.tsx: displayName table, class merge, paint, independence of two calls, a
   valid-name table and an invalid-name table that kills every regex mutant.
3. The barrels and the root entry spec.

Constraints:
- No new subpath; the runtime is part of the root entry.
- Functions <= 50 lines; zero any; English-only, timeless comments.

Verification:
- `pnpm test:cov:all` expected: 100% on every metric.
- `pnpm build && grep -c "use client" dist/index.mjs` expected: 0.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 8).
4. Append a Completion log entry: `- 1.4 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P1 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `feat(runtime): add the createIcon factory and export the runtime (1.4)`.
```

---

### Task 1.5: Server Components proof and package gates

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: 1.4

#### Description

Prove the runtime renders as a Server Component, from the source and from the packed tarball, and keep the package gates green with the runtime in the root bundle.

#### Acceptance criteria

- [x] `src/runtime/server-components.spec.tsx` runs with `customExportConditions: ["react-server", "node", "node-addons"]`: it checks the server build of React is loaded (no `useState`, `useEffect`, `createContext`), renders `Icon` and a `createIcon` component through `react-server-dom-webpack/server` and asserts the decoded tree and that the debug rows record the component in the `Server` environment, fails a negative-control component that calls `useState`, and scans every runtime source for a `'use client'` directive and for any value import from `react` other than `createElement`.
- [x] `scripts/check-consumer-runtime.mjs` expects `Icon` and `createIcon` on the root, renders a fixture icon made with the packed `createIcon` through `react-dom/server` in ESM and in CommonJS against the exact markup, renders it through Flight under `node --conditions=react-server`, and scans `dist/index.mjs` and `dist/index.cjs` for `'use client'` and for any React import other than `createElement`.
- [x] `scripts/dogfood-smoke-test.mjs` expects the new root names, installs `react` and `react-dom` beside the tarball at the repository's versions, and renders a titled fixture icon from the installed package.
- [x] `scripts/check-size.mjs`: the root budget is recalibrated from the measured bundle to 1.25 KiB, with the measurement in the calibration history.

**What the Server Components proof does not cover:** it runs no framework (Next.js) and no bundler, and it does not decode the Flight payload on a client. It proves the components execute and serialise under React's server build, which is where a hook, a context or another client-only API fails.

#### Files to create / modify

- `src/runtime/server-components.spec.tsx`, `scripts/check-consumer-runtime.mjs`, `scripts/dogfood-smoke-test.mjs`, `scripts/check-size.mjs`

#### Agent prompt

```
You are a senior React and release engineer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Zero direct dependencies.

CURRENT PHASE: 1 (runtime), Task 1.5 of 8

PRECONDITIONS
- Task 1.4 is done: the root exports the runtime and `pnpm build` passes.

REQUIRED READING (only these):
- docs/technical_specification.md §8.4, §12 (bundle size, package integrity).
- scripts/check-consumer-runtime.mjs, scripts/dogfood-smoke-test.mjs, scripts/check-size.mjs.
- node_modules/react-server-dom-webpack/package.json (the ./server export conditions).

TASK
Add the Server Components proof and extend the package gates.

DELIVERABLES
1. The spec of the acceptance criteria. Load react-server-dom-webpack/server with
   jest.requireActual; decode element tuples ['$', type, key, props, ...debug] and skip the
   `0:D` debug rows.
2. The check-consumer-runtime additions; React, react-dom and react-server-dom-webpack resolve
   from the repository's node_modules by walking up from the consumer directory.
3. The dogfood render; the consumer pins React to the repository's installed versions.
4. The size budget, raised only as far as the measurement requires, with the numbers.

Constraints:
- Inject each failure the new checks guard against into dist/ once, confirm it is caught, and
  rebuild. Say in the spec what the RSC proof does not prove.
- English-only, timeless comments. No AI attribution anywhere.

Verification:
- `pnpm build && pnpm size && pnpm check:exports && pnpm check:runtime && pnpm dogfood`
  expected: exit 0, with the RSC line in check:runtime's output.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 8).
4. Append a Completion log entry: `- 1.5 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P1 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `test(runtime): prove Server Components rendering and render from the tarball (1.5)`.
```

---

### Task 1.6: Documentation

- **Status**: ✅ Done
- **Priority**: P1
- **Size**: S
- **Depends on**: 1.5

#### Description

Update the shipped and the agent-facing documentation to what the runtime makes true, and nothing more.

#### Acceptance criteria

- [x] `README.md`: the status note names the runtime; the React features are ✅ for the runtime, with "one component per icon" still 📋; a runtime-only Quick Start (`createIcon` in a button) states that no icon ships yet; the Security Model says which guarantees the runtime enforces today; the API Reference documents `IconProps`, `createIcon`, `Icon` and the drawing types; `check:published` compiles the new `tsx` snippet against `dist/`.
- [x] `CHANGELOG.md` `## [Unreleased]` lists the runtime.
- [x] `CLAUDE.md` status, Testing note and the "Today" line of Subpaths; `AGENTS.md` Architecture names `src/runtime/` (and stays under the 32768-byte budget).

#### Files to create / modify

- `README.md`, `CHANGELOG.md`, `CLAUDE.md`, `AGENTS.md`

#### Agent prompt

```
You are a senior open-source maintainer working on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Pre-1.0: the runtime exists,
no icon is drawn yet.

CURRENT PHASE: 1 (runtime), Task 1.6 of 8

PRECONDITIONS
- Task 1.5 is done: every gate is green with the runtime.

REQUIRED READING (only these):
- README.md (Overview, Features, Subpath Exports, Quick Start, Security Model, Testing, API
  Reference), CLAUDE.md, AGENTS.md "Architecture".

TASK
Document the runtime where it is now true.

DELIVERABLES
1. The README changes of the acceptance criteria; every claim matches a passing spec or gate.
2. The CHANGELOG Unreleased entry; the CLAUDE.md and AGENTS.md lines.

Constraints:
- No invented claim or number; icons stay 📋 until a batch ships.
- Never edit the AGENTS.md shared block. English-only. No AI attribution anywhere.

Verification:
- `pnpm build && pnpm check:published` expected: the README snippets compile against dist/.
- `pnpm format:check` expected: exit 0. `wc -c AGENTS.md` expected: under 32768.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 8).
4. Append a Completion log entry: `- 1.6 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P1 row in docs/development_plan.md §1 and docs/tasks/README.md.
6. Commit: `docs(runtime): document the Icon base and createIcon (1.6)`.
```

---

### Task 1.7: Phase close: `mutation:full`, full gate, dashboards

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: S
- **Depends on**: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6

#### Description

Run the cold mutation run and the full local gate, verify each P1 Definition of Done item, and update the dashboards.

#### Acceptance criteria

- [x] `pnpm mutation:full`: final score 100.00; 0 survived, 0 without coverage, 0 timeouts; every error is a `CompileError` (a mutant the TypeScript checker rejects), none a `RuntimeError`; no `// Stryker disable` directive was needed.
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test:cov:all` (100% on every metric), `pnpm build`, `pnpm size`, `pnpm check:exports`, `pnpm check:runtime`, `pnpm dogfood`, `pnpm check:lint-graph`, `pnpm check:meta-react`, `pnpm check:file-length` and `pnpm check:mutants` all pass.
- [x] P1 Definition of Done, each item observable: fixture markup in jsdom and `react-dom/server` with and without title (`icon.dom.spec.tsx`, `icon.server.spec.tsx`); a consumer `aria-*` or `role` suppresses `aria-hidden` (`icon.precedence.spec.tsx`, `accessibility.spec.ts`); no hook, context or `'use client'` and a Server Components render (`server-components.spec.tsx`, `check:runtime`); coverage and mutation at 100%.
- [x] This file, `docs/development_plan.md` §1 and `docs/tasks/README.md` are consistent.

#### Files to create / modify

- `docs/tasks/phase-01-runtime.md`, `docs/development_plan.md`, `docs/tasks/README.md`

#### Agent prompt

```
You are a senior release engineer closing a phase on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Public npm package.

CURRENT PHASE: 1 (runtime), Task 1.7 of 8

PRECONDITIONS
- Tasks 1.1 through 1.6 are ✅.

REQUIRED READING (only these):
- docs/development_plan.md §5 "P1: runtime" (Definition of Done) and §7 "Update Protocol".

TASK
Run every gate, verify the Definition of Done, update the dashboards.

DELIVERABLES
1. `pnpm mutation:full` under Node 24: record the score and classify every non-killed mutant
   from reports/mutation/mutation.json (a RuntimeError leaves the denominator and can hide
   mutants, so it is never accepted silently).
2. The full local gate; record the last lines of each command.
3. The dashboards: P1 ✅ in the plan, this file, and the folder index.

Constraints:
- Never lower a threshold or add a directive to reach 100. English-only. No em dashes.

Verification:
- `node -e "const r=require('./reports/mutation/mutation.json'); ..."` expected: no Survived,
  NoCoverage, Timeout or RuntimeError status.

Completion Protocol (after you finish):
1. Set this task's Status to ✅ in the per-task block and the Task index row.
2. Tick the satisfied acceptance-criteria checkboxes.
3. Bump the phase Progress counter (X / 8).
4. Append a Completion log entry: `- 1.7 ✅ <YYYY-MM-DD> <one-line summary>`.
5. Update the P1 row in docs/development_plan.md §1 and docs/tasks/README.md.
```

---

### Task 1.8: Phase commit and pull request with Copilot review

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: 1.7, and the owner's go-ahead to commit and open the pull request

#### Description

Commit the phase on `feat/icon-runtime`, open the pull request, obtain and address a GitHub Copilot code review, and merge once CI is green and every review thread is resolved.

#### Acceptance criteria

- [ ] The change set is committed with Conventional Commits (scopes `runtime`, `deps`), no attribution trailer.
- [ ] The PR is opened to `main` with the template filled in and the gate output of task 1.7 in the body.
- [ ] GitHub Copilot code review requested; every thread answered with what was measured and resolved; `reviewThreads` checked with `isResolved == false` after every push, before the merge and after it.
- [ ] Merged with `CI passed` green; branch deleted.

#### Files to create / modify

- `docs/tasks/phase-01-runtime.md`, `docs/tasks/README.md` (status only)

#### Agent prompt

```
You are a senior release engineer on @bymax-one/icons.

PROJECT: @bymax-one/icons, an original Bymax icon set for React 19. Public npm package.

CURRENT PHASE: 1 (runtime), Task 1.8 of 8 (phase PR)

PRECONDITIONS
- Task 1.7 is ✅ and the owner has authorised the commit and the pull request.

REQUIRED READING (only these):
- docs/tasks/README.md "Branch and PR flow".
- This file's task index and completion log.

TASK
Commit, open the PR, drive it through Copilot review to merge.

DELIVERABLES
1. Commits on feat/icon-runtime; `gh pr create --title "feat(runtime): Icon base, createIcon and
   Server Components proof"` with the template's sections.
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
3. Bump the phase Progress counter (8 / 8).
4. Append a Completion log entry: `- 1.8 ✅ <YYYY-MM-DD> phase merged via PR #<n>`.
5. Update docs/tasks/README.md.
```

---

## Completion log

<!-- Append one line per completed task: - <id> ✅ YYYY-MM-DD <summary> -->

- 1.1 ✅ 2026-11-08 react-dom, @types/react-dom, @testing-library/react and jest-environment-jsdom at the nest-auth ranges; react-server-dom-webpack with its webpack peer made optional (no webpack); ref-as-prop confirmed on react.dev.
- 1.2 ✅ 2026-11-08 `IconNode` data types closed to the spec §6.3 elements; `IconProps` and `IconBaseProps`.
- 1.3 ✅ 2026-11-08 `Icon` base with stroke maths, paint, accessibility and consumer-prop precedence; exact-markup server specs and jsdom specs.
- 1.4 ✅ 2026-11-08 `createIcon` with derived `displayName`, merged `bx-icon` classes and the kebab-case rule; runtime exported from the root.
- 1.5 ✅ 2026-11-08 Flight render under the `react-server` condition in Jest and from the packed tarball; react-dom/server render in check:runtime (ESM, CJS) and dogfood; root budget recalibrated from the measured bundle.
- 1.6 ✅ 2026-11-08 README, CHANGELOG, CLAUDE.md and AGENTS.md updated to the runtime; README snippets compile against dist/.
- 1.7 ✅ 2026-11-08 mutation:full 100.00 (0 survived, no directive); full local gate green; dashboards updated.
