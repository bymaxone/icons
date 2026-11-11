# Phase B3: studio-ai-formats-billing

> **Status**: 👀 Review · **Progress**: 5 / 6 tasks · **Last updated**: 2026-11-11
> **Source roadmap**: [`../development_plan.md`](../development_plan.md) §5 (B3)
> **Source spec**: [`../technical_specification.md`](../technical_specification.md) §2, §3, §4.1, §4.2, §4.3, §16
>
> The 42 drawings are approved by the delegated auditor on behalf of the founder, 2026-11-11; the phase pull request is open.

---

## Context

B3 draws the Credits and billing, People and roles, Formats, AI and agent and System categories of spec §4.1 that earlier batches did not: 7 billing icons, 8 people icons, 6 formats, 10 AI icons and 11 system icons. With B0 to B2 the set holds 148 drawings.

### Approval

**Batch approved by the delegated auditor on behalf of the founder, 2026-11-11**, after one round that redrew six themes, each chosen among two variants:

- **`aspect-16-9`, `aspect-9-16`, `aspect-1-1`, `aspect-4-5`.** Corner marks made `aspect-1-1` the same glyph as `fullscreen`. Each is now the outline at its exact ratio with the diagonal of that ratio, a cut short of both corners: the slope of the diagonal states the ratio, and the four tell apart at 16 px.
- **`character`.** A bust with a badge read as `user-plus`. It is now a mask, a persona rather than a user.
- **`storyboard`.** Two equal panels read as "00". It is now a wide panel and a narrow one, with their captions.
- **`globe`.** Every alternative read as a beetle or a "no" sign, so the ring with a meridian and the equator stays, as a convention (spec §3 item 5).
- **`octopus`** (alias `polvi`, the agent of the Studio). A bulbous mantle narrowing down, four arms that open outward and hook at their ends, and two solid eyes low on the mantle. It stands far from the GitHub marks: the nearest, `brand-github-copilot`, lies at 1.87.
- **`feedback`.** A four-point star is the AI motif of the set; a five-point rating star replaces it.

`users` was centred again and the highlight of `accent` shortened so it keeps a clear pixel at 16 px. Following the naming rule of spec §4.3, the mascot is named for what it depicts, `octopus`, with the product name `polvi` as its alias.

### Where the language shows

- **AI marks.** The four-point star belongs to the AI icons only: `sparkle`, `generate`, `regenerate`, `agent`, `variations`, and the moon's companion star.
- **The cut and the knockout.** The arrow of `log-in` and `log-out` passes through the open side of the door; the lid and the box of `gift` stand a cut apart; the ceiling mark of `spending-cap` cuts its gauge; the caption lines of `storyboard` stand a cut below the panels; the plus of `user-plus` and `mail-invite` cuts what it overlaps.

### Similarity

The report is [`../contact-sheets/b3/similarity.md`](../contact-sheets/b3/similarity.md), and the alternatives are drawn side by side in [`../contact-sheets/b3/alternatives-sheet.png`](../contact-sheets/b3/alternatives-sheet.png). 39 drawings lie above 0.30 px from every reference. The other three are conventions (spec §3 item 5), each beside a measured alternative:

| Drawing      | Nearest (d)                         | Convention, and the measured alternative                                                                                          |
| ------------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | tabler/command 0.21                 | The place-of-interest sign of ISO/IEC 9995-7, in one stroke. Larger loops measure 0.05.                                           |
| `help`       | heroicons/question-mark-circle 0.21 | A character in a circle, as `info`. A squircle face measures 0.42.                                                                |
| `aspect-1-1` | tabler/zsh 0.28                     | A square and its diagonal, the 1:1 ratio itself. A diagonal that runs through the corners measures 0.54 but reads as crossed out. |

### The 16 px list

[`../contact-sheets/b3/sixteen-px.md`](../contact-sheets/b3/sixteen-px.md) repeats the 16 px check on the 148 drawings. `users`, `wallet`, `script` and `octopus` join the list of 16 px masters in spec §4.2, and `menu` leaves it, the role-only item that measures best at 16 px; the list holds 45.

### Measurements

Measured with resvg at 20x zoom. The bounding box includes the stroke, the centroid is the centre of the ink, and ink is the share of the 24 x 24 canvas the drawing covers.

| Icon              | Box (units)   | Ink centroid | Ink   |
| ----------------- | ------------- | ------------ | ----- |
| `accent`          | 14.50 x 19.00 | 12.06, 13.12 | 13.0% |
| `agent`           | 17.60 x 19.30 | 12.22, 12.11 | 19.5% |
| `aspect-1-1`      | 15.00 x 15.00 | 12.22, 12.22 | 16.3% |
| `aspect-16-9`     | 18.50 x 11.00 | 12.22, 12.22 | 15.2% |
| `aspect-4-5`      | 15.00 x 18.50 | 12.22, 12.22 | 18.6% |
| `aspect-9-16`     | 11.00 x 18.50 | 12.22, 12.22 | 15.2% |
| `bell`            | 17.50 x 17.85 | 12.22, 13.24 | 13.8% |
| `card`            | 20.00 x 15.50 | 11.70, 11.90 | 20.6% |
| `character`       | 18.50 x 16.60 | 12.22, 10.55 | 17.2% |
| `command`         | 15.50 x 16.50 | 12.22, 12.23 | 19.2% |
| `crown`           | 19.50 x 16.60 | 12.22, 13.27 | 21.3% |
| `duration`        | 19.50 x 12.50 | 12.22, 12.22 | 12.9% |
| `feedback`        | 20.00 x 18.00 | 11.58, 11.33 | 21.3% |
| `generate`        | 19.45 x 19.45 | 12.95, 10.16 | 10.9% |
| `gift`            | 16.50 x 17.60 | 12.22, 12.34 | 21.1% |
| `globe`           | 17.00 x 17.00 | 12.22, 12.22 | 20.7% |
| `help`            | 19.50 x 19.50 | 12.30, 11.85 | 20.2% |
| `keyboard`        | 20.00 x 13.50 | 12.05, 12.10 | 20.7% |
| `lightning-stack` | 13.20 x 19.40 | 11.04, 11.44 | 13.7% |
| `log-in`          | 19.00 x 19.50 | 15.45, 12.23 | 13.1% |
| `log-out`         | 19.00 x 19.50 | 10.08, 12.22 | 13.1% |
| `mail-invite`     | 20.00 x 17.00 | 12.20, 11.93 | 20.3% |
| `message`         | 20.00 x 18.00 | 11.39, 11.50 | 16.5% |
| `monitor`         | 20.00 x 19.00 | 12.02, 11.25 | 17.9% |
| `moon`            | 19.00 x 19.00 | 11.95, 12.50 | 18.4% |
| `octopus`         | 17.50 x 19.25 | 12.22, 12.43 | 21.2% |
| `plan`            | 16.50 x 16.50 | 12.22, 12.95 | 20.4% |
| `prompt`          | 20.00 x 15.50 | 11.79, 12.45 | 19.5% |
| `receipt`         | 15.50 x 20.00 | 12.11, 11.87 | 20.7% |
| `regenerate`      | 18.50 x 18.30 | 11.72, 12.57 | 17.9% |
| `resolution`      | 19.50 x 15.50 | 12.22, 12.22 | 21.1% |
| `role`            | 18.55 x 17.85 | 11.29, 13.01 | 15.7% |
| `script`          | 15.00 x 20.00 | 11.85, 12.34 | 19.8% |
| `sparkle`         | 19.40 x 19.15 | 12.34, 11.66 | 15.3% |
| `spending-cap`    | 18.80 x 10.75 | 12.47, 11.89 | 9.7%  |
| `storyboard`      | 20.00 x 15.50 | 11.52, 12.31 | 20.7% |
| `style`           | 18.50 x 15.50 | 12.49, 12.18 | 20.5% |
| `sun`             | 19.00 x 16.70 | 12.22, 12.22 | 11.1% |
| `user-plus`       | 18.85 x 18.65 | 10.96, 12.90 | 15.0% |
| `users`           | 18.55 x 17.10 | 12.01, 11.92 | 19.2% |
| `variations`      | 17.00 x 17.50 | 12.54, 11.96 | 19.2% |
| `wallet`          | 20.00 x 16.50 | 12.45, 12.46 | 20.7% |

### Evidence

- [`../contact-sheets/b3/contact-sheet.png`](../contact-sheets/b3/contact-sheet.png): `pnpm contact-sheet` on the 42 drawings.
- [`../contact-sheets/b3/family-sheet.png`](../contact-sheets/b3/family-sheet.png): the batch outlined beside B0 to B2.
- [`../contact-sheets/b3/similarity.md`](../contact-sheets/b3/similarity.md) and [`../contact-sheets/b3/similarity-sheet.png`](../contact-sheets/b3/similarity-sheet.png).
- [`../contact-sheets/b3/alternatives-sheet.png`](../contact-sheets/b3/alternatives-sheet.png).
- [`../contact-sheets/b3/sixteen-px.md`](../contact-sheets/b3/sixteen-px.md).

The root and `meta` size budgets are recalibrated in the header of `scripts/check-size.mjs`.

---

## Rules-of-phase

1. **Drawn from scratch** (spec §3): no third-party set open, pasted, traced or modified.
2. **Drawn on the rules of spec §2**, the ink ceiling and the digit-or-letter rule included.
3. **Every composite the similarity check places at 0.30 px or closer** is redrawn, or carries a justification beside a measured alternative.
4. **Every drawing passes `pnpm lint:icons`**, and the generated modules and the visual baselines are committed with their sources.
5. **The pull request carries the originality attestation.**
6. **English-only; no AI attribution; no em dashes in `docs/`.**

---

## Reference docs

- [`../development_plan.md`](../development_plan.md) §4 rule 11 "Drawing batch gate", §5 "B3: studio-ai-formats-billing".
- [`../technical_specification.md`](../technical_specification.md) §2, §3, §4.1, §4.2, §4.3.

---

## Task index

| ID  | Task                                            | Status    | Priority | Size | Depends on |
| --- | ----------------------------------------------- | --------- | -------- | ---- | ---------- |
| 7.1 | Draw the credit, billing, people and role icons | ✅ Done   | P0       | M    | none       |
| 7.2 | Draw the format and AI icons                    | ✅ Done   | P0       | M    | none       |
| 7.3 | Draw the system icons                           | ✅ Done   | P0       | M    | none       |
| 7.4 | Evidence, the 16 px list and size budgets       | ✅ Done   | P0       | S    | 7.1 to 7.3 |
| 7.5 | Batch approval                                  | ✅ Done   | P0       | S    | 7.4        |
| 7.6 | Phase commit and pull request                   | 👀 Review | P0       | S    | 7.5        |

---

## Tasks

### Task 7.1: Draw the credit, billing, people and role icons

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: none

#### Acceptance criteria

- [x] `wallet`, `card`, `receipt`, `gift`, `lightning-stack`, `spending-cap`, `plan`, `users`, `user-plus`, `crown`, `mail-invite`, `log-in`, `log-out`, `character` and `role`, with their metadata.
- [x] `pnpm lint:icons` passes; `pnpm check:generated` is clean.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Draw the credit, billing, people and role icons of spec §4.1 not drawn yet, following
spec §2, and write their metadata.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

### Task 7.2: Draw the format and AI icons

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: none

#### Acceptance criteria

- [x] `aspect-16-9`, `aspect-9-16`, `aspect-1-1`, `aspect-4-5`, `duration`, `resolution`, `sparkle`, `octopus` (alias `polvi`), `agent`, `prompt`, `generate`, `regenerate`, `variations`, `storyboard`, `script` and `style`, with their metadata.
- [x] `pnpm lint:icons` passes; `pnpm check:generated` is clean.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Draw the format and AI icons of spec §4.1, following spec §2, and write their metadata.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

### Task 7.3: Draw the system icons

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: none

#### Acceptance criteria

- [x] `bell`, `message`, `help`, `feedback`, `sun`, `moon`, `monitor`, `globe`, `keyboard`, `command` and `accent`, with their metadata.
- [x] `pnpm lint:icons` passes; `pnpm check:generated` is clean.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Draw the system icons of spec §4.1, following spec §2, and write their metadata.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

### Task 7.4: Evidence, the 16 px list and size budgets

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: 7.1 to 7.3

#### Acceptance criteria

- [x] The sheets, the similarity report and the 16 px check are committed under `docs/contact-sheets/b3/`, and spec §4.2 lists 45 masters.
- [x] `pnpm build && pnpm size` pass with the recalibrated budgets.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Commit the evidence of the batch, update the 16 px list, the baselines and the budgets.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

### Task 7.5: Batch approval

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: 7.4

#### Acceptance criteria

- [x] The batch is approved by the delegated auditor on behalf of the founder, and the approval is recorded in the plan and in this file.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Send the evidence to the delegated auditor, apply what the audit asks, and record the
approval with its date.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

### Task 7.6: Phase commit and pull request

- **Status**: 👀 Review
- **Priority**: P0
- **Size**: M
- **Depends on**: 7.5

#### Acceptance criteria

- [ ] The full gate and the bounded review pass.
- [ ] Merged with CI green, the Codex review approved and no open review thread, checked after every push, before the merge and after it.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Run every gate, commit, run the bounded review, push, open the PR with the originality
checkbox and "@codex review", and merge once CI is green, the Codex review is approved,
the batch is approved and no thread is open.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

## Completion log

<!-- Append one line per completed task: - <id> ✅ YYYY-MM-DD <summary> -->

- 7.1 ✅ 2026-11-11 The 15 credit, billing, people and role icons drawn, with their metadata.
- 7.2 ✅ 2026-11-11 The 16 format and AI icons drawn, with their metadata.
- 7.3 ✅ 2026-11-11 The 11 system icons drawn, with their metadata.
- 7.4 ✅ 2026-11-11 Sheets, similarity report, alternatives and the 16 px check committed; spec §4.2 lists 45 masters; budgets recalibrated.
- 7.5 ✅ 2026-11-11 Batch approved by the delegated auditor on behalf of the founder after one round on six themes.
