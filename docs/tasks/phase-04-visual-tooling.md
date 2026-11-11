# Phase P3: visual-tooling

> **Status**: 👀 Review · **Progress**: 5 / 6 tasks · **Last updated**: 2026-11-10
> **Source roadmap**: [`../development_plan.md`](../development_plan.md) §5 (P3)
> **Source spec**: [`../technical_specification.md`](../technical_specification.md) §3.4, §12, §16
>
> The tools are in place and the B0 batch is measured with them. Task 4.6, the phase pull request, is open.

---

## Context

P3 makes the evidence every drawing batch needs routine, so a batch gate is a few commands and not a manual review of PNG files:

- `pnpm check:visual`: the visual regression.
- `pnpm similarity`: the similarity check, with its calibration.
- `pnpm family-sheet`: the whole set beside the batch under review.
- The pull-request preview: two workflows that comment a rendered preview and the similarity of each changed drawing.

### Decisions

**Visual regression.** Every drawing is rendered as one strip: 16, 20, 24 and 48 px on the light page, then on the dark page, in each page's ink. It is compared pixel by pixel with `visual/<variant>/<name>.png`. A pixel counts as changed when a channel moves by more than 8 of 255. resvg renders the same drawing to the same bytes, and the margin only absorbs rounding between platforms. A changed drawing writes its baseline, its render and the render with the changed pixels in red to `reports/visual/`. A missing baseline fails, and so does a baseline with no drawing. `--update` rewrites them. The baselines are committed with the drawing, so a pull request shows the drawing change and its reviewed render together.

**Similarity, the measure.** A raw comparison of two canvases is blind to a copy that was moved or rescaled. Each drawing is therefore normalised first:

- A probe render finds the bounds of its ink.
- Those bounds are drawn, centred and with a 10% margin, on a 48 px canvas.
- A stroked drawing is redrawn at 3 px on that canvas, whatever its size.

Three scores are recorded: the cosine of the blurred coverage, the overlap (IoU) of the ink masks grown by 1 px, and the symmetric chamfer distance (the mean distance from one drawing's ink to the other's, the larger of the two directions). The chamfer distance flags. It is the only one of the three that separates known copies from independent redesigns well enough.

**Similarity, the calibration.** The threshold comes from pairs whose answer is known:

- **Positives:** a regular sample of Lucide icons, each against a copy of itself, scaled by 0.95 about its centre and moved by half a unit.
- **Negatives:** the same concept drawn by two sets.

[`../similarity/calibration.md`](../similarity/calibration.md) holds the numbers, and `pnpm similarity --calibrate` rewrites it.

At 0.25 px every perturbed copy is flagged. So are about a quarter of the independent redesigns: they are the simple glyphs every set draws alike (plus, a circled arrow, a folder). A flag therefore asks for a human review and never fails a build. Every drawing is compared with every reference, not only the one of the same name, because a renamed copy is the case the check exists for. Primitive glyphs (spec §3.5) are reported as an expected flag.

**The four reference sets** are dev dependencies at exact versions: `lucide-static`, `@tabler/icons`, `@phosphor-icons/core` and `heroicons`. A version bump moves the calibration, so it is a deliberate change. None of them reaches the package: `files` ships `dist` and the licence files only, and nothing under `src/` that is built imports them.

**The pull-request preview.** It is split in two workflows, because rendering a pull request's SVG is processing untrusted input. It must not happen in a job that can write.

- **`icons-preview.yml`** (`pull_request`, read-only token, no secret):
  - It checks out the base commit and fetches the pull request's commit as data only.
  - It copies the changed files with `git show` into a copy of `icons/` and lints them with the base branch's lint.
  - It renders only when the lint passes. The lint admits nothing but geometry elements, so an `<image>`, a `<use>` or any reference to a file or URL never reaches resvg.
  - It uploads the images and a manifest as an artifact.
- **`icons-preview-publish.yml`** (`workflow_run`, from the default branch):
  - It never checks out pull-request code and installs nothing: the publish script imports no parser or renderer.
  - It treats the artifact as hostile. The manifest is validated field by field and rebuilt from its checked fields. Every image must be a PNG of bounded size, named by a strict pattern. The pull request must be open on the commit the run built.
  - The `images` job alone holds `contents: write`. It stores the images on the `icons-preview` branch, which shares no history with `main`. The `comment` job alone holds `pull-requests: write`. It writes the comment from validated fields only.
  - Every checkout sets `persist-credentials: false`, and no value from the pull request reaches a `run:` line other than through the environment.

**The family sheet** groups every drawing by the first category of its icon, in `categories.json` order, then the brand marks. It shows each drawing at 48, 24 and 16 px on the light and the dark page side by side, and outlines the icons named by `--highlight`.

### B0 measured with the tools

The similarity report of the twelve keystone icons, sent to the auditor with its sheet, gave three results:

- **Primitives:** `plus`, `close` and `check` are flagged as primitives, which is expected.
- **Flagged composites:** `folder`, `lightning`, `search` and `settings` lie between 0.15 and 0.23 px of a third-party icon (Tabler's folder, bolt and search, and Heroicons' cog). That is the range of independent redesigns of an archetype, not of the perturbed copies, whose median is 0.047 px.
- **Clear:** the other five are above 0.30 px.

The auditor accepted the method and the calibration, kept those five and the three primitives, and reopened the four composites as B0.1 (see the plan).

### Fixed on the way

- The icon lint crashed instead of reporting when an allowed element carried a namespaced
  attribute such as `xlink:href`: the live area was measured on every attribute the file
  held, and resvg aborts on an undeclared prefix. The live area is now measured on the
  geometry attributes alone, so an attribute the lint reports never reaches the renderer.
  A test in `lint-svg.spec.ts` covers it.
- The preview diffs the base against GitHub's synthetic merge of the pull request, whose
  parents the build checks, and not against the pull request's head. A pull request that is
  behind `main` would otherwise show `main`'s newer drawings as its own changes.
- `zizmor` ran over every workflow. The fixes:
  - `peer-advisory-drift.yml` and `scorecard.yml` declare their permissions per job, with
    none at the workflow level.
  - `release.yml` installs without a dependency cache.
  - The preview workflows document every permission they hold.
  - The only finding left is `unpinned-uses` on the organisation's own reusable workflows
    and actions (`bymaxone/.github/...@v1`). They are first-party and follow the family's
    shared-CI release line on purpose.

### Later (P5)

- The `icons-preview` branch keeps every preview it is given (`pr-<n>/<sha>/`). Cleaning a
  pull request's directory when it closes, or keeping only its latest commit, belongs to
  the hardening phase.

### Deviations from the specification

1. Spec §12 names Lucide's `pull_request_target` pattern for the preview. The preview uses `pull_request` and `workflow_run` instead. Under `pull_request_target`, the job that renders the pull request's drawings holds a token that can write. Here the rendering runs without one, and the job that writes renders nothing.

---

## Rules-of-phase

1. **The similarity check flags; it never fails a build.**
2. **The preview never executes pull-request code** and renders nothing the base branch's lint has not passed.
3. **The tools are tested like the runtime**: 100% coverage in both Jest configs, Stryker `break: 100`.
4. **No reference set ships**: they are dev dependencies only.
5. **English-only; no AI attribution; no em dashes in `docs/`.**

---

## Reference docs

- [`../development_plan.md`](../development_plan.md) §4 rule 11, §5 "P3: visual-tooling".
- [`../technical_specification.md`](../technical_specification.md) §3.4, §3.5, §12, §16.

---

## Task index

| ID  | Task                                 | Status    | Priority | Size | Depends on |
| --- | ------------------------------------ | --------- | -------- | ---- | ---------- |
| 4.1 | Visual regression and its baselines  | ✅ Done   | P0       | M    | none       |
| 4.2 | Similarity check and its calibration | ✅ Done   | P0       | L    | none       |
| 4.3 | Family sheet                         | ✅ Done   | P1       | S    | none       |
| 4.4 | Pull-request preview workflows       | ✅ Done   | P0       | L    | 4.2        |
| 4.5 | Documentation and CI                 | ✅ Done   | P1       | S    | 4.1 to 4.4 |
| 4.6 | Phase commit and pull request        | 👀 Review | P0       | S    | 4.5        |

---

## Tasks

### Task 4.1: Visual regression and its baselines

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: none

#### Acceptance criteria

- [x] `pnpm check:visual` fails on a changed, missing or stale baseline and writes the difference image; `--update` rewrites the baselines.
- [x] The baselines of the twelve keystone icons are committed under `visual/`, and CI runs the check.

#### Agent prompt

```
You are a senior engineer on @bymax-one/icons.

TASK
Render every drawing at 16, 20, 24 and 48 px on the light and dark pages as one strip,
compare it pixel by pixel with a committed baseline, write the difference on failure, and
run the check in CI.

Verification:
- `pnpm check:visual` exits 0 on the committed set and 1 after any change to a drawing.
```

---

### Task 4.2: Similarity check and its calibration

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: L
- **Depends on**: none

#### Acceptance criteria

- [x] Every drawing is compared, normalised, with every icon of the four reference sets; the report lists the three nearest with their scores and a sheet of thumbnails.
- [x] The threshold is set from known pairs, and the calibration is committed.

#### Agent prompt

```
You are a senior engineer on @bymax-one/icons.

TASK
Compare every drawing with Lucide, Tabler, Phosphor and Heroicons after normalising
position, size and stroke; record cosine, overlap and chamfer distance; calibrate the flag
threshold on perturbed copies and independent redesigns; write the report and its sheet.

Verification:
- `pnpm similarity` writes reports/similarity/{report.md,sheet.png}.
- `pnpm similarity --calibrate` reproduces docs/similarity/calibration.md.
```

---

### Task 4.3: Family sheet

- **Status**: ✅ Done
- **Priority**: P1
- **Size**: S
- **Depends on**: none

#### Acceptance criteria

- [x] `pnpm family-sheet --highlight <names>` renders the whole set by category, light and dark, with the named icons outlined.

#### Agent prompt

```
You are a senior engineer on @bymax-one/icons.

TASK
Render every drawing grouped by category at 48, 24 and 16 px on both pages, outlining
the batch under review.

Verification:
- `pnpm family-sheet` writes reports/family-sheet.png.
```

---

### Task 4.4: Pull-request preview workflows

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: L
- **Depends on**: 4.2

#### Acceptance criteria

- [x] The unprivileged workflow lints before it renders, and a drawing that references a file is refused before rendering (a test proves it).
- [x] The privileged workflow validates the artifact, the pull request and its commit before it stores an image or writes the comment, with the least permission per job.
- [ ] A changed drawing on a pull request produces a visual diff, a similarity entry and a preview comment. This is proven on the first pull request after this phase merges, B0.1, because `workflow_run` runs only the default branch's file.

#### Agent prompt

```
You are a senior engineer on @bymax-one/icons.

TASK
Write the preview as two workflows: a `pull_request` job that renders the base-linted
drawings into an artifact, and a `workflow_run` job that validates the artifact and
publishes the images and the comment. No job runs pull-request code; no job that can
write renders anything.

Verification:
- actionlint is clean; the build and publish modules are at 100% coverage and mutation.
```

---

### Task 4.5: Documentation and CI

- **Status**: ✅ Done
- **Priority**: P1
- **Size**: S
- **Depends on**: 4.1 to 4.4

#### Acceptance criteria

- [x] The contributor flow, README, CLAUDE.md, AGENTS.md, `icons/README.md`, spec §3.4 and the plan describe the tools.

#### Agent prompt

```
You are a senior engineer on @bymax-one/icons.

TASK
Document the visual tools where a contributor and an agent look for them, and add
`pnpm check:visual` to the CI verify job and to the verification command.
```

---

### Task 4.6: Phase commit and pull request

- **Status**: 👀 Review
- **Priority**: P0
- **Size**: S
- **Depends on**: 4.5

#### Acceptance criteria

- [ ] The full gate, `mutation:full` on the new modules and the bounded review pass.
- [ ] Merged with CI green, the Codex review approved and no open review thread, checked after every push, before the merge and after it.

#### Agent prompt

```
You are a senior release engineer on @bymax-one/icons.

TASK
Run every gate, commit, run the bounded review, push, open the PR with "@codex review",
and merge once CI is green, the Codex review is approved and no thread is open.
```

---

## Completion log

<!-- Append one line per completed task: - <id> ✅ YYYY-MM-DD <summary> -->

- 4.1 ✅ 2026-11-10 `pnpm check:visual` with strips at four sizes on both pages, difference images, `--update`, and a CI step; twelve baselines committed.
- 4.2 ✅ 2026-11-10 `pnpm similarity` against the four reference sets, normalised; the chamfer threshold calibrated on perturbed copies and same-concept pairs.
- 4.3 ✅ 2026-11-10 `pnpm family-sheet` by category on both pages, with the batch outlined.
- 4.4 ✅ 2026-11-10 Two preview workflows: an unprivileged build that lints before it renders, and a privileged publish that validates the artifact and holds one write permission per job.
- 4.5 ✅ 2026-11-10 Contributor docs, spec §3.4 and the CI verify job updated.
