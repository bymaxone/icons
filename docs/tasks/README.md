# Development Tasks: @bymax-one/icons

> **Last updated:** 2026-11-11
> **Source roadmap:** [`../development_plan.md`](../development_plan.md) · **Spec:** [`../technical_specification.md`](../technical_specification.md)

Tasks live **one file per phase** in this folder (`phase-NN-<slug>.md`, numbered in execution order; a drawing batch is a phase like any other, so B0 is `phase-03-keystone-icons.md`). Each phase file is self-contained: context, rules-of-phase, reference docs, a task index, the tasks (each with an executable **Agent prompt**), and a completion log. Phase files are scaffolded one phase at a time, when the previous phase closes.

> **Canonical phase status lives in the plan's [Progress Dashboard](../development_plan.md#1-progress-dashboard).** This folder index mirrors it for convenience: when a phase or task changes state, update the plan dashboard first, then this table.

---

## Phase files (folder index)

| Phase | File                                                                               | Tasks       | Status         |
| ----- | ---------------------------------------------------------------------------------- | ----------- | -------------- |
| P0    | [`phase-00-repository-scaffold.md`](./phase-00-repository-scaffold.md)             | 0 / 7       | 🔄 In Progress |
| P1    | [`phase-01-runtime.md`](./phase-01-runtime.md)                                     | 7 / 8       | ✅ Done        |
| P2    | [`phase-02-pipeline.md`](./phase-02-pipeline.md)                                   | 10 / 10     | ✅ Done        |
| B0    | [`phase-03-keystone-icons.md`](./phase-03-keystone-icons.md)                       | 4 / 4       | ✅ Done        |
| P3    | [`phase-04-visual-tooling.md`](./phase-04-visual-tooling.md)                       | 6 / 6       | ✅ Done        |
| B1    | [`phase-05-navigation-actions-status.md`](./phase-05-navigation-actions-status.md) | 6 / 6       | ✅ Done        |
| B2    | [`phase-06-media-audio-files-editor.md`](./phase-06-media-audio-files-editor.md)   | 6 / 6       | ✅ Done        |
| B3    | [`phase-07-studio-ai-formats-billing.md`](./phase-07-studio-ai-formats-billing.md) | 6 / 6       | ✅ Done        |
| B4a   | [`phase-08-brand-marks.md`](./phase-08-brand-marks.md)                             | 4 / 4       | ✅ Done        |
| B4b   | [`phase-09-filled-variants.md`](./phase-09-filled-variants.md)                     | 4 / 4       | ✅ Done        |
| B4c   | [`phase-10-sixteen-px-masters.md`](./phase-10-sixteen-px-masters.md)               | 4 / 4       | ✅ Done        |
| P4    | [`phase-11-catalog-site.md`](./phase-11-catalog-site.md)                           | 3 / 4       | ✅ Done        |
| P5    | not scaffolded yet                                                                 | n/a         | 📋 ToDo        |
| P6    | not scaffolded yet                                                                 | n/a         | 📋 ToDo        |
|       | **Total**                                                                          | **60 / 69** | 🔄 In Progress |

---

## Status legend

| Symbol | Meaning     |
| ------ | ----------- |
| 📋     | ToDo        |
| 🔄     | In Progress |
| 👀     | Review      |
| ✅     | Done        |
| ⛔     | Blocked     |
| 🟡     | Partial     |

Task sizes: **S** (< ~100 LoC), **M** (~100 to 250), **L** (~250+). Priorities: **P0** (blocking), **P1** (important), **P2** (nice-to-have).

---

## Execution guidance for AI agents

> **Read this before executing any task.**

### Token economy

1. **Do not load a whole phase file**: jump to your task's block; use `Read` with `offset`/`limit`.
2. **Do not load the plan or spec entirely**: each task lists REQUIRED READING with exact sections; read only those.
3. **Do not load sibling libraries entirely** (`nest-config`, `nest-auth`, `nest-cache`, `.github`): read only the specific file a task references, from the remote `main` (`gh api repos/bymaxone/<repo>/contents/<path>`), never from a local clone, which may be stale.

### Branch and PR flow (mandatory, one PR per phase)

1. The FIRST task of every phase works on the phase branch, created with `git switch -c <type>/<slug>` (never `git checkout -b`).
2. All tasks of the phase commit to that branch with Conventional Commits: `<type>(<scope>): <subject> (<phase>.<task>)`, with a scope from `icons | brands | runtime | meta | site | build | deps | release`.
3. The LAST task of every phase (phase close) opens the PR via `gh pr create`, fills in the pull request template (including the originality attestation for a drawing batch), requests a **GitHub Copilot code review**, addresses every finding, and merges only with `CI passed` green and every review thread resolved (`gh pr merge --squash --delete-branch`).
4. **Never** add `Co-Authored-By`, "Generated with", or any AI-attribution line to commits, PR titles, PR bodies, or comments.

### Phase execution mode

Resolve the phase's tasks in dependency order (the `Depends on` column), execute sequentially, and after each task confirm its Status was applied. The phase closes when all its tasks are done, the roadmap's Definition of Done holds, and the phase PR is merged. A drawing batch also needs its recorded design approval: the founder's, or the delegated auditor's on the founder's behalf.

### Self-update protocol (mandatory at the end of each task)

1. The task block's **Status** + tick its acceptance criteria.
2. The phase file's **Task index** row + the header **Progress** counter (`X / Y`).
3. The phase file's **Completion log** (append `- <id> ✅ <YYYY-MM-DD> <summary>`).
4. The phase row in the **[plan dashboard](../development_plan.md#1-progress-dashboard)** (canonical) and this README's folder index; recompute the plan's overall progress.
5. Commit with Conventional Commits, no attribution trailers.

### Blocked / review

- Blocked: set `Status: ⛔`, add `> **Blocker:** ...` under the task header, no destructive commit.
- Implemented and verified locally but not yet committed or reviewed: `Status: 👀`.
- Acceptance fails after 2 red-green cycles: set `Status: 👀` plus an inline note.

---

## Project-wide constraints (apply to every task)

- **Zero `dependencies`**: `package.json` ships `"dependencies": {}`. `react ^19.0.0` is the only peer, required, mirrored in `devDependencies`.
- **Markup is built from data**: no `dangerouslySetInnerHTML`, no JSX strings, no runtime SVG parsing; SVG sources hold only the allow-listed elements of spec §6.3.
- **Pure components**: no hooks, no context, no `'use client'`; `ref` is a regular prop.
- **Drawing originality**: no third-party SVG is pasted, traced or modified; every drawing PR carries the attestation.
- **Code-Craft Standard**: TS strict (no `any`, no suppressions); 100% coverage in both Jest configs and Stryker `break: 100` on the runtime and the generator; functions <= 50 lines, files <= 800; `@fileoverview` + `@layer` header per file; official-docs-first (confirm React 19, tsup, SVGO and resvg APIs against current docs, never memory); English-only, timeless comments (no phase or task references in committed code).
- **CI green from the first PR**: every family workflow exists from Phase 0; mutation is a post-merge and pre-release gate only; `release.yml` is tag-driven with OIDC provenance; the first publish (`1.0.0`) is manual.
- **Bounded test execution**: Jest `maxWorkers: '50%'`; suites run sequentially; never run this package's tests in parallel with another package's suites.
- **No placeholder files**: never create `.gitkeep` or pre-create empty directories.
- **No em dashes** in `docs/`.
