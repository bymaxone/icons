# @bymax-one/icons — AI Agent Quick Reference

> **Type:** npm public library (NOT an application)
> **Package:** `@bymax-one/icons` — original Bymax icon set: React 19 components, raw SVG, an SVG sprite and typed metadata on one 24 px grid with a 1.5 px stroke
> **Runtime:** any React 19 renderer, including Server Components | Tooling on Node.js 24+ | Zero direct dependencies (`react` is the only peer)
> **Status:** 0.1.0, pre-1.0 and unpublished. The repository scaffold and gates are in place, `./meta` exports `ICON_GRID`, and the root exports the runtime (`Icon`, `createIcon` and their types); no icon is drawn yet. The phase order is in [docs/development_plan.md](./docs/development_plan.md).

---

## Critical Rules

**1. npm Library — Not an App** (uses pnpm)

- Zero direct dependencies (`"dependencies": {}`). `react ^19` is a peer; tooling stays in `devDependencies`.
- Export the public API from `src/index.ts` and `src/{subpath}/index.ts`. Use `export type` for types, `export` for components and constants.
- The root imports a sibling subpath by package specifier (`@bymax-one/icons/meta`), never by relative path, so each module exists once in the published package.

**2. English Only**

- All code, comments, JSDoc, variable names, test names and docs in English, `docs/` included. JSDoc on every public export.
- Icon names are kebab-case American English and describe what is depicted (`lightning`, not `credits`); product meanings live in aliases.

**3. TypeScript — Zero `any`**

- Never `any` in production code. Use `unknown`, generics, or explicit types.
- `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` — no exceptions, no suppressions.

**4. Security — Non-Negotiable**

- Components build their SVG elements from data. Never `dangerouslySetInnerHTML`, `innerHTML`, JSX strings or runtime SVG parsing.
- SVG sources use only `path`, `line`, `polyline`, `polygon`, `circle`, `ellipse`, `rect`; no `transform`, `style`, `id`, `class`, `filter`, `<use>`, gradients or masks.
- Consumer text (`title`) is rendered as text and an attribute value, never as markup.
- The PR preview workflow never executes pull-request code with repository credentials.

**5. Drawing Originality**

- Every non-brand icon is drawn from scratch. No third-party SVG is pasted, traced or modified; third-party sets are never open in the working file of a new drawing.
- A pull request that adds or changes a drawing carries the originality checkbox from the PR template.
- Brand marks use the owner's official geometry only (see [TRADEMARKS.md](./TRADEMARKS.md)).

**6. React Patterns**

- Components are pure functions: no hooks, no context, no `'use client'`, so they render in Server Components and client components alike.
- `ref` is a regular prop (React 19); no `forwardRef`. No context provider for default size or colour.
- Accessible by default: `aria-hidden="true"` and `focusable="false"`; a `title` gives `role="img"`, `aria-label` and a `<title>` child.

**7. Testing — TDD, 100% Coverage (hard gate)**

- Co-located tests (`*.spec.ts`, `*.spec.tsx`). Every `it()` carries a comment stating the scenario.
- **100% statements / branches / functions / lines** in both Jest configs (`pnpm test:cov`, `pnpm test:cov:all`).
- React specs switch to jsdom with `/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */`.
- The Server Components spec resolves packages with the `react-server` condition through `@jest-environment-options` and renders through `react-server-dom-webpack/server`; `check:runtime` repeats that render on the packed tarball.
- Mutation testing (Stryker `break: 100`, `ignoreStatic: false`) is the deeper gate. Equivalent mutants carry `// Stryker disable next-line <Mutator>: <reason>`; a killable mutant is never disabled.
- Generated modules are excluded from coverage and mutation; the runtime and the generator are not.

**8. Build** — tsup builds every subpath → ESM (.mjs) + CJS (.cjs) + .d.ts + .d.cts, browser target `es2022`, JSX `automatic`, no `'use client'` banner. `sideEffects: false`. `react` and the package's own subpaths always external.

---

## Subpaths

| Subpath           | Purpose                                                  | Peer Deps | Status  |
| ----------------- | -------------------------------------------------------- | --------- | ------- |
| `.`               | Line and filled components, the `Icon` base, the types   | React 19  | Partial |
| `./meta`          | Typed metadata and the `IconName` union, no React import | None      | Partial |
| `./icons/<name>`  | One icon's components                                    | React 19  | Planned |
| `./brands`        | Brand components                                         | React 19  | Planned |
| `./svg/*`         | Raw SVG files                                            | None      | Planned |
| `./sprite.svg`    | The sprite                                               | None      | Planned |
| `./metadata.json` | Merged metadata                                          | None      | Planned |

Today `.` exports the runtime (`Icon`, `createIcon` and their types, listed in `src/index.ts`) with `ICON_GRID` and `IconGrid`; `./meta` exports `ICON_GRID` and `IconGrid`. The planned subpaths are added in the pipeline phase, together with their `exports` entries, tsup entries and gate lists (`check-size.mjs`, `check-consumer-runtime.mjs`, `dogfood-smoke-test.mjs` and the `verify` job in `ci.yml`).

---

## Verification — Run Before Completing Any Task

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test:cov:all && pnpm build && pnpm size && pnpm check:exports && pnpm check:runtime
```

`pnpm check:api` compares the built `.d.ts`/`.d.cts` with the previous published version and always prints what differs. A difference passes only when the CHANGELOG section of the version being released holds an "Apply to a derived backend" (or "Apply to a consumer") note; there is no override. The release workflow runs it before the publish.

Mutation testing (before tagging a release), under Node 24:

```bash
pnpm mutation             # incremental — re-tests only what changed; writes reports/mutation/mutation.html
pnpm mutation:full        # cold — deletes the baseline first, measures the truth
```

Mutation runs automatically **post-merge on `main`** via the shared reusable CI (`bymaxone/.github` → node-lib-ci) — never per-PR. Do **not** add it to `prepublishOnly` or the per-PR path.

---

## Documentation changes ship

**`README.md`, `CHANGELOG.md` and `TRADEMARKS.md` are in `files`, so they are part of the published package.** Once the package is published, a documentation fix that stays on `main` leaves the npm page — where people actually read it — still wrong. So a change to any shipped file gets a **patch release**, not a "next time" note:

- Bump the version and add the `## [x.y.z]` CHANGELOG section in the same pull request.
- State plainly that `dist/` is unchanged and **verify it** rather than asserting it: unpack the published tarball and diff it against a fresh build.
- It is a **patch**. There is no feature, and a minor would reach exactly the same installs anyway.

Files outside `files` — `scripts/`, `.github/`, `docs/`, `CLAUDE.md`, config — do not ship and do not justify a release on their own.

---

## Docs — Load Only What You Need

| Doc                               | Load when...                                                       |
| --------------------------------- | ------------------------------------------------------------------ |
| `docs/technical_specification.md` | Design language, originality policy, API, gates, phases, decisions |
| `docs/development_plan.md`        | Planning a phase or a drawing batch                                |
| `docs/tasks/phase-*.md`           | Picking up a specific task                                         |

For the review rules and the repository-specific narrowings, see **[AGENTS.md](./AGENTS.md)**.
