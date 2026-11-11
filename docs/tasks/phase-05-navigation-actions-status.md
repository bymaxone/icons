# Phase B1: navigation-actions-status

> **Status**: 👀 Review · **Progress**: 4 / 6 tasks · **Last updated**: 2026-11-11
> **Source roadmap**: [`../development_plan.md`](../development_plan.md) §5 (B1)
> **Source spec**: [`../technical_specification.md`](../technical_specification.md) §2, §3, §4.1, §16, §17 (D5)
>
> The 44 drawings, their evidence and the size budgets are in the pull request; the batch waits for the approval of the delegated auditor.

---

## Context

B1 draws the rest of the Navigation, Actions and Status categories of spec §4.1: 13 navigation icons, 17 actions and 14 status icons, with their metadata. With the 12 keystone icons the set holds 56 drawings.

The drawings are written as code on the 24 unit grid, as in B0 (decision D1), in the language B0 fixed: the 1.5 px round stroke, squircle corners, and the cut between distinct parts. No third-party set was open while drawing. The similarity check of P3 measured every drawing against the icons of the reference sets, and every composite it placed at 0.30 px or closer was redrawn or carries a justification beside a measured alternative (below).

### Where the language shows

- **The cut.** The lid of `trash` stands a cut above the can; the stem of `filter` and the needle of `pin` hang a cut below their bodies; the shackle of `lock` stops a cut above the body; the divider of `sidebar` stops a cut short of the frame; the eraser of `pencil` is a part of its own. The two hands of `clock` are two parts, the hour hand a cut away from the minute hand.
- **The knockout (spec §2.4, item 1).** Where one part crosses another, the part behind is cut 1.5 px clear of it: the check of `check-circle` and of `cloud-check` breaks through its outline, the slash of `eye-off` cuts the eye, and the front card of `copy` and `duplicate` hides the back card.
- **Arrows enter their trays.** The arrow of `download` ends a cut above the floor of its tray, and the arrow of `upload` rises from the same point.

### Similarity

The report is [`../contact-sheets/b1/similarity.md`](../contact-sheets/b1/similarity.md), and the alternatives are drawn side by side in [`../contact-sheets/b1/alternatives-sheet.png`](../contact-sheets/b1/alternatives-sheet.png). 30 drawings lie above 0.30 px from every reference. The other 14:

| Drawing                                                    | Nearest (d)                       | Why it stays, and the measured alternative                                                                                                                                                             |
| ---------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `chevron-*`, `arrow-left`, `arrow-right`, `arrow-up-right` | 0.00 to 0.02                      | Primitive glyphs, expected to coincide (spec §3 item 5).                                                                                                                                               |
| `alert-triangle`                                           | phosphor/warning 0.30             | The general warning sign of ISO 7010 (W001). A capsule glyph alternative measures 0.27.                                                                                                                |
| `alert-circle`                                             | tabler/alert-circle 0.06          | A character in a circle. Tabler draws `circle-letter-*`, `circle-number-*` and `clock-hour-*` icons, so a glyph in a ring lands near one of them. A capsule glyph measures 0.22, a squircle face 0.08. |
| `info`                                                     | heroicons/information-circle 0.05 | The information mark (ISO 7001), a character in a circle as above. A capsule glyph measures 0.22, a squircle face 0.08.                                                                                |
| `menu`                                                     | lucide/align-justify 0.03         | Three equal lines, a typographic glyph. A shorter middle line measures 0.19, two lines 0.24.                                                                                                           |
| `more-horizontal`, `more-vertical`                         | 0.01                              | Three dots, a typographic glyph. Dashes measure 0.29 and 0.51.                                                                                                                                         |
| `grip`                                                     | lucide/grip-vertical 0.12         | Six dots. Dashes measure 0.68, four dots 1.42.                                                                                                                                                         |

### Measurements

Measured with resvg at 20x zoom. The bounding box includes the stroke, the centroid is the centre of the ink, and ink is the share of the 24 x 24 canvas the drawing covers.

| Icon              | Box (units)   | Ink centroid | Ink   |
| ----------------- | ------------- | ------------ | ----- |
| `alert-circle`    | 18.50 x 18.50 | 12.22, 12.09 | 15.8% |
| `alert-triangle`  | 19.50 x 18.65 | 12.22, 13.79 | 16.3% |
| `arrow-left`      | 16.50 x 14.50 | 10.31, 12.22 | 8.7%  |
| `arrow-right`     | 16.50 x 14.50 | 14.14, 12.22 | 8.7%  |
| `arrow-up-right`  | 14.50 x 14.50 | 14.01, 10.44 | 10.0% |
| `check-circle`    | 19.25 x 18.00 | 11.57, 12.66 | 17.2% |
| `chevron-down`    | 13.50 x 7.50  | 12.22, 12.02 | 4.7%  |
| `chevron-left`    | 7.50 x 13.50  | 12.43, 12.22 | 4.7%  |
| `chevron-right`   | 7.50 x 13.50  | 12.02, 12.22 | 4.7%  |
| `chevron-up`      | 13.50 x 7.50  | 12.22, 12.43 | 4.7%  |
| `clock`           | 18.50 x 18.50 | 12.41, 12.14 | 17.7% |
| `cloud-check`     | 19.75 x 15.75 | 11.77, 12.99 | 12.8% |
| `copy`            | 19.00 x 19.00 | 11.85, 11.85 | 17.6% |
| `dashboard`       | 19.00 x 19.00 | 12.17, 11.86 | 24.9% |
| `download`        | 17.50 x 18.50 | 12.22, 15.90 | 13.9% |
| `duplicate`       | 19.00 x 19.00 | 12.32, 12.32 | 20.7% |
| `eye`             | 16.00 x 14.00 | 12.22, 12.23 | 14.3% |
| `eye-off`         | 17.50 x 17.50 | 12.22, 12.22 | 13.4% |
| `filter`          | 17.30 x 17.00 | 12.22, 8.91  | 11.6% |
| `folder-stack`    | 19.00 x 19.50 | 11.16, 13.38 | 21.9% |
| `grip`            | 9.50 x 16.50  | 12.22, 12.23 | 9.8%  |
| `history`         | 17.50 x 17.50 | 12.88, 11.55 | 15.6% |
| `info`            | 18.50 x 18.50 | 12.22, 12.36 | 15.8% |
| `library`         | 19.00 x 19.00 | 11.60, 12.27 | 25.6% |
| `link`            | 18.60 x 18.60 | 12.22, 12.23 | 15.3% |
| `loader`          | 17.15 x 17.50 | 14.51, 13.32 | 8.5%  |
| `lock`            | 16.50 x 19.00 | 12.22, 13.29 | 16.7% |
| `menu`            | 16.50 x 13.50 | 12.22, 12.22 | 12.6% |
| `more-horizontal` | 17.50 x 3.50  | 12.22, 12.23 | 4.9%  |
| `more-vertical`   | 3.50 x 17.50  | 12.22, 12.23 | 4.9%  |
| `pencil`          | 17.05 x 17.05 | 11.57, 12.37 | 12.0% |
| `pin`             | 13.40 x 19.50 | 12.22, 10.52 | 11.4% |
| `queued`          | 15.50 x 18.50 | 12.22, 12.22 | 19.6% |
| `redo`            | 16.75 x 15.20 | 12.18, 12.79 | 10.6% |
| `refresh`         | 17.00 x 17.00 | 12.22, 12.22 | 13.8% |
| `repair`          | 18.75 x 18.75 | 11.34, 12.61 | 12.2% |
| `share`           | 20.25 x 19.50 | 13.15, 12.22 | 14.6% |
| `sidebar`         | 20.00 x 17.50 | 11.57, 12.23 | 19.6% |
| `sort`            | 16.20 x 18.50 | 12.22, 12.23 | 11.1% |
| `templates`       | 19.00 x 19.00 | 11.36, 11.63 | 27.4% |
| `trash`           | 18.50 x 18.50 | 12.22, 11.90 | 14.5% |
| `undo`            | 16.75 x 15.20 | 12.27, 12.79 | 10.6% |
| `upload`          | 17.50 x 18.50 | 12.22, 14.21 | 13.9% |
| `version`         | 19.00 x 18.00 | 11.87, 12.75 | 21.0% |

### Evidence

- [`../contact-sheets/b1/contact-sheet.png`](../contact-sheets/b1/contact-sheet.png): `pnpm contact-sheet` on the 44 drawings, at 16, 20, 24 and 48 px on the light and dark Studio pages, in the ink and the six accents.
- [`../contact-sheets/b1/family-sheet.png`](../contact-sheets/b1/family-sheet.png): `pnpm family-sheet --highlight`, the batch outlined beside B0 by category.
- [`../contact-sheets/b1/similarity.md`](../contact-sheets/b1/similarity.md) and [`../contact-sheets/b1/similarity-sheet.png`](../contact-sheets/b1/similarity-sheet.png): `pnpm similarity --names` on the batch.
- [`../contact-sheets/b1/alternatives-sheet.png`](../contact-sheets/b1/alternatives-sheet.png): each justified glyph beside its measured alternatives.

### Studio adoption

The plan asks that `bymax-studio-web` consume the package through a local link from B1 on (decision D5). The Studio is still in its specification phase, with no `package.json`, so the adoption is deferred; the plan records when it returns as a criterion.

### Build

The declaration build ran out of memory with 56 icons: the bundler inside tsup 9.0.0 starts a TypeScript program for every icon entry that sits in its own directory. `tsup.config.ts` now points each icon entry at a one-line re-export in a single directory, `.tsup-entries/`, so the icons share one program. The root and `meta` size budgets are recalibrated in the header of `scripts/check-size.mjs`.

---

## Rules-of-phase

1. **Drawn from scratch** (spec §3): no third-party set open, pasted, traced or modified.
2. **Drawn on the rules of spec §2**, the cut included.
3. **Every composite the similarity check places at 0.30 px or closer** is redrawn, or carries a justification beside a measured alternative.
4. **Every drawing passes `pnpm lint:icons`**, and the generated modules and the visual baselines are committed with their sources.
5. **The pull request carries the originality attestation.**
6. **English-only; no AI attribution; no em dashes in `docs/`.**

---

## Reference docs

- [`../development_plan.md`](../development_plan.md) §4 rule 11 "Drawing batch gate", §5 "B1: navigation-actions-status".
- [`../technical_specification.md`](../technical_specification.md) §2 "Design Language", §3 "Originality Policy", §4.1.
- [`../../icons/README.md`](../../icons/README.md) "Adding an icon".

---

## Task index

| ID  | Task                                         | Status    | Priority | Size | Depends on |
| --- | -------------------------------------------- | --------- | -------- | ---- | ---------- |
| 5.1 | Draw the navigation icons and their metadata | ✅ Done   | P0       | M    | none       |
| 5.2 | Draw the action icons and their metadata     | ✅ Done   | P0       | M    | none       |
| 5.3 | Draw the status icons and their metadata     | ✅ Done   | P0       | M    | none       |
| 5.4 | Evidence, similarity and size budgets        | ✅ Done   | P0       | S    | 5.1 to 5.3 |
| 5.5 | Batch approval                               | 👀 Review | P0       | S    | 5.4        |
| 5.6 | Phase commit and pull request                | 👀 Review | P0       | S    | 5.5        |

---

## Tasks

### Task 5.1: Draw the navigation icons and their metadata

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: none

#### Acceptance criteria

- [x] `dashboard`, `folder-stack`, `library`, `templates`, `menu`, `sidebar`, the four chevrons, `arrow-left`, `arrow-right` and `arrow-up-right`, each with `icons/line/<name>.svg` and `icons/meta/<name>.json`.
- [x] `pnpm lint:icons` passes; `pnpm check:generated` is clean.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Draw the navigation icons of spec §4.1 not drawn yet as code on the 24 unit grid,
following spec §2, and write their metadata against schemas/icon.schema.json.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

### Task 5.2: Draw the action icons and their metadata

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: none

#### Acceptance criteria

- [x] `pencil`, `trash`, `copy`, `duplicate`, `download`, `upload`, `share`, `link`, `more-horizontal`, `more-vertical`, `undo`, `redo`, `refresh`, `filter`, `sort`, `grip` and `pin`, with their metadata; `trash` carries the alias `delete`.
- [x] `pnpm lint:icons` passes; `pnpm check:generated` is clean.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Draw the action icons of spec §4.1 not drawn yet as code on the 24 unit grid,
following spec §2, and write their metadata.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

### Task 5.3: Draw the status icons and their metadata

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: none

#### Acceptance criteria

- [x] `check-circle`, `alert-triangle`, `alert-circle`, `info`, `loader`, `clock`, `cloud-check`, `lock`, `eye`, `eye-off`, `history`, `queued`, `repair` and `version`, with their metadata; `alert-triangle` carries the alias `warning`.
- [x] `pnpm lint:icons` passes; `pnpm check:generated` is clean.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Draw the status icons of spec §4.1 not drawn yet, the Studio concepts queued, repair and
version included, as code on the 24 unit grid, following spec §2, and write their metadata.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

### Task 5.4: Evidence, similarity and size budgets

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: S
- **Depends on**: 5.1 to 5.3

#### Acceptance criteria

- [x] The contact, family, similarity and alternatives sheets and the similarity report are committed under `docs/contact-sheets/b1/`.
- [x] The visual baselines of the 44 drawings are committed under `visual/line/`.
- [x] `pnpm build && pnpm size` pass, with the recalibrated budgets recorded in the header of `scripts/check-size.mjs`.

#### Agent prompt

```
You are a senior engineer on @bymax-one/icons.

TASK
Run `pnpm contact-sheet`, `pnpm family-sheet --highlight` and `pnpm similarity --names`
on the batch, commit the sheets and the report, update the visual baselines, and
recalibrate the size budgets the batch outgrows.

Verification:
- `pnpm check:visual && pnpm build && pnpm size` exit 0.
```

---

### Task 5.5: Batch approval

- **Status**: 👀 Review
- **Priority**: P0
- **Size**: S
- **Depends on**: 5.4

#### Acceptance criteria

- [ ] The batch is approved by the delegated auditor on behalf of the founder, and the approval is recorded in the plan and in this file.

#### Agent prompt

```
You are a senior engineer on @bymax-one/icons.

TASK
Send the evidence to the delegated auditor, apply what the audit asks, and record the
approval with its date.
```

---

### Task 5.6: Phase commit and pull request

- **Status**: 👀 Review
- **Priority**: P0
- **Size**: S
- **Depends on**: 5.5

#### Acceptance criteria

- [ ] The full gate and the bounded review pass.
- [ ] Merged with CI green, the Codex review approved and no open review thread, checked after every push, before the merge and after it.

#### Agent prompt

```
You are a senior release engineer on @bymax-one/icons.

TASK
Run every gate, commit, run the bounded review, push, open the PR with the originality
checkbox and "@codex review", and merge once CI is green, the Codex review is approved,
the batch is approved and no thread is open.
```

---

## Completion log

<!-- Append one line per completed task: - <id> ✅ YYYY-MM-DD <summary> -->

- 5.1 ✅ 2026-11-11 The 13 navigation icons drawn, with their metadata.
- 5.2 ✅ 2026-11-11 The 17 action icons drawn, with their metadata.
- 5.3 ✅ 2026-11-11 The 14 status icons drawn, with their metadata.
- 5.4 ✅ 2026-11-11 Sheets, similarity report, alternatives and baselines committed; the declaration build fixed and the size budgets recalibrated.
