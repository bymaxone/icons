# Phase B0: keystone-icons

> **Status**: ✅ Done · **Progress**: 4 / 4 tasks · **Last updated**: 2026-11-10
> **Source roadmap**: [`../development_plan.md`](../development_plan.md) §5 (B0)
> **Source spec**: [`../technical_specification.md`](../technical_specification.md) §2, §3, §4.1, §16, §17 (D1, D2)
>
> The design language is approved and the batch is merged. Four of the twelve drawings are reopened as B0.1 (see the plan).

---

## Context

B0 draws the twelve keystone icons, `home`, `search`, `play`, `plus`, `close`, `check`, `settings`, `user`, `file`, `folder`, `lightning` and `scene`, and fixes the design language of the whole set. Nothing else is drawn until it is approved.

The drawings are written as code on the 24 unit grid (decision D1): a script computes every point, corner and gap from the rules of spec §2, and the pipeline normalises the result into `icons/line/<name>.svg`. No third-party set was open while drawing, and none was used as a reference.

### Approval

**Design language approved by the delegated auditor on behalf of the founder, 2026-11-10: signature A (the 1.5 px cut between distinct parts), drawing round v3.1.** The founder delegated the approval of B0, and of every later drawing batch, to a senior auditor, and reviews the finished set.

The drawings went through three rounds:

1. **v2.** Clean on the grid, but the founder's bar is a set that is "premium, custom, not the default of AI or of other packages" and "shows authority". The audit found the archetypes universal and the one signature, the squircle corner, invisible at 16 to 24 px. It asked for a signature that reads at those sizes, applied the same way everywhere.
2. **v3.** Two signatures on the same drawings, side by side. **A, the cut**: distinct parts never touch and stop 1.5 px short of each other. **B, the open corner**: every closed outline opens once at its top-right. B read as a rendering defect at 16 px (an open hub or head reads as "refresh") and was rejected; A was approved.
3. **v3.1.** `settings` got a smaller hub and shallower teeth, so the hub no longer fuses with the tooth root at 16 px. `user` got a bust drawn as a container, with squircle shoulders that rhyme with `file`, `folder` and `home`, instead of the half-ellipse every set draws.

### Decisions

The rules below were added to spec §2 with this batch.

**The cut (spec §2.4, item 4).** Where one part would meet another, it stops short by a 1.5 px gap, which is 3 units between the two centrelines. In this batch: the door of `home` stands 1.5 px above the floor line, the handle of `search` starts 1.5 px off the lens, the head of `user` sits 1.5 px above the shoulders, and the crease of `file` stops 1.5 px short of the page outline. Attached parts share a corner with radius 0 instead: the arm of `scene` is hinged on the board's top-left corner.

**The primitive axis (spec §2.2).** `plus` sits on 12.25, the axis the `.25` rule gives its straight strokes, and `close` shares that centre, so the two line up in a toolbar. `close` spans 13 units against 14.5 for `plus`, a ratio of 0.9, so the diagonal cross carries the same visual mass as the upright one.

**Small details take radius 0 (spec §2.3).** The tooth corners of `settings` are drawn sharp and rounded by the round join of the stroke. With a squircle corner on each tooth the module with the runtime went over its size budget; drawn sharp it fits (figures in the header of `scripts/check-size.mjs`). At 48 px the difference does not show.

**Size budgets.** The per-icon target of the specification (0.6 KiB brotli) and the runtime-with-one-icon target (1.5 KiB brotli) hold as budgets. `./meta` grows with every record, so its budget moves from 1 KiB to 1.5 KiB, and each batch recalibrates it. The figures are in the header of `scripts/check-size.mjs`.

### Measurements

Measured with resvg at 20x zoom. The bounding box includes the stroke, the centroid is the centre of the ink, and ink is the share of the 24 x 24 canvas the drawing covers.

| Icon        | Box (units)   | Ink centroid | Ink   |
| ----------- | ------------- | ------------ | ----- |
| `check`     | 16.75 x 12.75 | 12.19, 12.90 | 6.1%  |
| `close`     | 13.00 x 13.00 | 12.22, 12.22 | 8.7%  |
| `file`      | 15.00 x 20.00 | 11.83, 11.99 | 16.3% |
| `folder`    | 19.00 x 17.00 | 11.19, 12.40 | 17.4% |
| `home`      | 17.00 x 18.00 | 11.97, 12.60 | 17.1% |
| `lightning` | 10.40 x 20.00 | 11.98, 11.98 | 11.9% |
| `play`      | 14.45 x 18.30 | 11.83, 11.97 | 12.3% |
| `plus`      | 14.50 x 14.50 | 12.22, 12.22 | 7.0%  |
| `scene`     | 18.80 x 17.80 | 11.56, 12.15 | 22.1% |
| `search`    | 19.50 x 19.50 | 12.21, 12.21 | 14.8% |
| `settings`  | 19.00 x 18.65 | 11.97, 11.98 | 21.0% |
| `user`      | 15.40 x 17.50 | 11.97, 12.76 | 14.9% |

### B0.1: four drawings redrawn

The similarity check of P3 measured the batch against 9,382 third-party icons. Four
composites lay between 0.15 and 0.23 px from the archetype another set draws, so the
auditor reopened them. The rule for the redraw: above 0.30 px from every reference, still
reading as its concept at 16 px, in the set's language. Each got two variants, and these
were approved by the delegated auditor on behalf of the founder, 2026-11-11:

- **`folder` (f5).** The folder is two parts: a front panel, and a back panel whose tab
  peeks above it and stops a cut short of it.
- **`search` (q1).** The handle is a capsule outline, heavy by its mass and not by its
  stroke, a cut away from the lens.
- **`settings` (s9).** Seven narrow teeth (18 degrees at the tip, 26 at the root), a
  proportion none of the four sets draws, around a hub that stands free of the root.
- **`lightning` (a1).** One piece, narrow and steep, with a short horizontal landing and
  sharp tips. A bolt split in two was rejected: it applies the cut to a single part, and
  it reads as a broken bolt.

The measurements above are the redrawn ones. The similarity report of the whole batch is in
[`../contact-sheets/b0.1/similarity.md`](../contact-sheets/b0.1/similarity.md): only
`plus`, `close` and `check`, the primitives of spec §3.5, are flagged.

### Evidence

- [`../contact-sheets/b0/contact-sheet.png`](../contact-sheets/b0/contact-sheet.png): `pnpm contact-sheet`, every drawing at 16, 20, 24 and 48 px on the light and dark Studio pages, in the ink and the six accents.
- [`../contact-sheets/b0/family-sheet.png`](../contact-sheets/b0/family-sheet.png): the twelve side by side at 48 px, at 24 and 16 px rendered at 1x and enlarged three times without smoothing, blurred at 16 px, and at 16 and 20 px. There is no earlier batch to sit beside.
- Similarity: reviewed by hand, as open question 1 of the plan provides for B0. The automated check arrives with P3 and runs on this batch then.

### Notes for the 16 px masters (B2)

The 24 px masters scale to 16 px with two details that do not survive: the crease of `file` collapses to a dot, and the door of `home` shrinks to a few pixels. Both are candidates for the hand-tuned 16 px masters whose list B2 fixes.

---

## Rules-of-phase

1. **Drawn from scratch** (spec §3): no third-party set open, pasted, traced or modified.
2. **Drawn on the rules of spec §2**, including the cut; a rule the drawings need and spec §2 lacks is added to spec §2 in the same pull request.
3. **Every drawing passes `pnpm lint:icons`**, and the generated modules are committed with their sources.
4. **The pull request carries the originality attestation.**
5. **English-only; no AI attribution; no em dashes in `docs/`.**

---

## Reference docs

- [`../development_plan.md`](../development_plan.md) §4 rule 11 "Drawing batch gate", §5 "B0: keystone-icons".
- [`../technical_specification.md`](../technical_specification.md) §2 "Design Language", §3 "Originality Policy", §4.1, §12.
- [`../../icons/README.md`](../../icons/README.md) "Adding an icon".

---

## Task index

| ID  | Task                                              | Status  | Priority | Size | Depends on |
| --- | ------------------------------------------------- | ------- | -------- | ---- | ---------- |
| 3.1 | Draw the twelve keystone icons and their metadata | ✅ Done | P0       | M    | none       |
| 3.2 | Calibrate the size budgets                        | ✅ Done | P0       | S    | 3.1        |
| 3.3 | Batch evidence, design approval and spec rules    | ✅ Done | P0       | S    | 3.1, 3.2   |
| 3.4 | Phase commit and pull request                     | ✅ Done | P0       | S    | 3.3        |

---

## Tasks

### Task 3.1: Draw the twelve keystone icons and their metadata

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: none

#### Acceptance criteria

- [x] `icons/line/<name>.svg` and `icons/meta/<name>.json` for the twelve names, every category from `categories.json`, at least two use cases each.
- [x] `pnpm lint:icons` passes; `pnpm generate` leaves `pnpm check:generated` clean.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Draw home, search, play, plus, close, check, settings, user, file, folder, lightning and
scene as code on the 24 unit grid, following spec §2 to the letter, and write their
metadata against schemas/icon.schema.json.

Constraints:
- No third-party icon set open, pasted, traced or modified (spec §3).
- 1.5 px round stroke; straight strokes on .25/.75; squircle corners; the cut between
  distinct parts.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

### Task 3.2: Calibrate the size budgets

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: S
- **Depends on**: 3.1

#### Acceptance criteria

- [x] `pnpm size` passes, with every icon module and every runtime-with-icon pair inside the targets of spec §12.
- [x] The header of `scripts/check-size.mjs` records the measured figures each budget rests on.

#### Agent prompt

```
You are a senior engineer on @bymax-one/icons.

TASK
Build the package with the twelve drawings, run `pnpm size`, and calibrate the budgets
in scripts/check-size.mjs against the measured bundles. A drawing that breaks the
per-icon target is simplified, not given a larger budget.

Verification:
- `pnpm build && pnpm size` exit 0.
```

---

### Task 3.3: Batch evidence, design approval and spec rules

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: S
- **Depends on**: 3.1, 3.2

#### Acceptance criteria

- [x] The contact sheet and the family sheet are committed under `docs/contact-sheets/b0/`.
- [x] The design approval is recorded in the plan and in this file.
- [x] The rules the drawings rely on (the cut, the primitive axis, radius 0 on small details) are in spec §2.

#### Agent prompt

```
You are a senior engineer on @bymax-one/icons.

TASK
Render the batch evidence of plan §4 rule 11, obtain the design approval, and record it
in the plan and this file. Add to spec §2 every rule the drawings rely on that it lacks.

Verification:
- `pnpm contact-sheet` exits 0; the sheets are committed.
```

---

### Task 3.4: Phase commit and pull request

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: S
- **Depends on**: 3.3

#### Acceptance criteria

- [x] Committed on `feat/keystone-icons` with Conventional Commits, no attribution trailer.
- [x] The PR carries the originality attestation, the evidence and the full gate output.
- [x] Merged with CI green, the Codex review approved and no open review thread, checked after every push, before the merge and after it.

#### Agent prompt

```
You are a senior release engineer on @bymax-one/icons.

TASK
Run every gate, commit, run the bounded review, push, open the PR with the template's
originality attestation and "@codex review", and merge once CI is green, the Codex
review is approved and no review thread is open.

Verification:
- `gh pr checks` all green; `gh api graphql` reviewThreads has none with isResolved false,
  also after the merge.
```

---

## Completion log

<!-- Append one line per completed task: - <id> ✅ YYYY-MM-DD <summary> -->

- 3.1 ✅ 2026-11-10 Twelve keystone icons drawn as code on the grid in three rounds (v2, v3, v3.1); lint clean.
- 3.2 ✅ 2026-11-10 Size budgets calibrated; the figures are in the header of `scripts/check-size.mjs`.
- 3.3 ✅ 2026-11-10 Contact and family sheets committed; design language approved by the delegated auditor on behalf of the founder (signature A, v3.1); spec §2 gains the cut, the primitive axis and radius 0 on small details.
- 3.4 ✅ 2026-11-10 phase merged via PR #7 (squash `e4f110b`); Codex review approved, no open thread.
- B0.1 ✅ 2026-11-11 `folder`, `search`, `settings` and `lightning` redrawn and approved by the delegated auditor on behalf of the founder; no composite of the batch is flagged by the similarity check.
