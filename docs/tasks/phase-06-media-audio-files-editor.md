# Phase B2: media-audio-files-editor

> **Status**: 👀 Review · **Progress**: 4 / 6 tasks · **Last updated**: 2026-11-11
> **Source roadmap**: [`../development_plan.md`](../development_plan.md) §5 (B2)
> **Source spec**: [`../technical_specification.md`](../technical_specification.md) §2, §3, §4.1, §4.2, §16
>
> The 50 drawings, their evidence, the 16 px check and the 16 px master list are in the pull request; the batch waits for the approval of the delegated auditor.

---

## Context

B2 draws the Media and video, Audio and voice, Files and Editor and canvas categories of spec §4.1 that B0 did not: 19 media icons, 10 audio icons, 6 file icons and 15 editor icons, with their metadata. With B0 and B1 the set holds 106 drawings. B2 also fixes the list of 16 px masters (spec §4.2), which B4 draws.

The drawings follow spec §2 as amended by the B1 audit: the cut between distinct parts, the knockout where one part crosses another, an ink ceiling of 21.5%, and no part that reads as a digit or a letter.

### Where the language shows

- **The cut.** The box and the cone of `volume` and `volume-off` are two parts; the stand of `mic` stops a cut above its base; the hump of `camera` is part of the body while the lens stands free; the arrow of `extend` and the tracks of `timeline` keep a cut; the perforations of `frame` stand a cut inside the film edge; `transition` is two clips meeting point to point, a cut apart.
- **The knockout.** The blade behind in `scissors`, the slash over `mic-off`, the playhead through the clip of `split`, and the square behind the circle of `mask`; the rails of `grid` pass under one post and over the other.
- **No digit or letter.** The bars of `pause` and the box of `volume` take small corners, and the clip of `extend` and `split` is wider than tall, so none reads as a zero.

### Similarity

The report is [`../contact-sheets/b2/similarity.md`](../contact-sheets/b2/similarity.md); the alternatives are in [`../contact-sheets/b2/alternatives-sheet.png`](../contact-sheets/b2/alternatives-sheet.png). 45 drawings lie above 0.30 px from every reference. The other five are conventions (spec §3 item 5), each beside a measured alternative:

| Drawing | Nearest (d)                       | Convention, and the measured alternative                                                                |
| ------- | --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `stop`  | heroicons/stop 0.06               | The stop sign of media controls, a square. A square with a small corner measures 0.02.                  |
| `pause` | lucide/pause 0.21                 | The pause sign, two bars. Two single strokes measure 0.99, at the cost of the bars' mass.               |
| `move`  | phosphor/arrows-out-cardinal 0.20 | Four arrows, primitive glyphs. Four heads without shafts measure 0.39.                                  |
| `text`  | lucide/letter-t 0.25              | The letter T of the text tool, a typographic glyph. A T with serifs measures 0.30.                      |
| `grid`  | tabler/grid-3x3 0.25              | A lattice of lines. Four cells measure 0.12; lines around a single cell measure 0.61 but read as a sun. |

### The 16 px check and the master list

[`../contact-sheets/b2/sixteen-px.md`](../contact-sheets/b2/sixteen-px.md) renders every drawing at 16 px and 1x and records two objective tests: two parts that fuse through their inked pixels, and a closed part whose interior fills. `copy`, `duplicate`, `file`, `frame`, `lock`, `timeline` and `volume` fuse a cut at 16 px, and the small nodes of `share` close. The list of 16 px masters in spec §4.2 is the union of these and of the icons the Studio shell shows at 16 px by role, 40 in all. The list rests on role and measurement because the Studio has no application to measure usage in; the plan records when usage returns as a criterion.

### Measurements

Measured with resvg at 20x zoom. The bounding box includes the stroke, the centroid is the centre of the ink, and ink is the share of the 24 x 24 canvas the drawing covers.

| Icon             | Box (units)   | Ink centroid | Ink   |
| ---------------- | ------------- | ------------ | ----- |
| `align-center`   | 16.50 x 15.00 | 12.22, 11.18 | 13.2% |
| `asset`          | 16.50 x 16.85 | 12.22, 12.71 | 19.7% |
| `brush`          | 19.90 x 20.00 | 12.17, 11.95 | 12.7% |
| `camera`         | 19.50 x 15.00 | 12.22, 13.19 | 18.4% |
| `camera-motion`  | 19.50 x 19.50 | 12.41, 11.74 | 20.4% |
| `captions`       | 20.50 x 15.50 | 12.03, 12.72 | 21.5% |
| `crop`           | 12.00 x 20.00 | 11.97, 11.97 | 12.0% |
| `cursor`         | 15.40 x 16.80 | 10.93, 10.99 | 11.7% |
| `eraser`         | 19.45 x 19.45 | 11.04, 13.11 | 16.2% |
| `export-video`   | 19.00 x 19.00 | 11.53, 12.04 | 20.4% |
| `extend`         | 20.00 x 9.50  | 10.88, 12.22 | 12.2% |
| `file-audio`     | 15.00 x 20.00 | 11.64, 12.74 | 20.1% |
| `file-video`     | 15.00 x 20.00 | 11.76, 12.78 | 18.8% |
| `frame`          | 20.50 x 16.50 | 12.22, 12.23 | 21.4% |
| `fullscreen`     | 17.50 x 17.50 | 12.22, 12.22 | 11.8% |
| `grid`           | 19.50 x 19.50 | 12.22, 12.22 | 14.9% |
| `hand`           | 16.00 x 18.50 | 12.36, 13.42 | 12.9% |
| `image`          | 19.50 x 15.50 | 12.38, 12.31 | 21.0% |
| `keyframe`       | 16.40 x 16.40 | 12.22, 12.23 | 14.0% |
| `layers`         | 19.50 x 17.50 | 12.22, 12.05 | 20.4% |
| `lip-sync`       | 20.50 x 10.15 | 12.23, 11.86 | 13.1% |
| `loop`           | 17.50 x 16.50 | 12.22, 12.22 | 14.3% |
| `mask`           | 19.25 x 19.25 | 11.68, 11.68 | 17.2% |
| `mic`            | 15.50 x 20.00 | 12.22, 12.16 | 16.5% |
| `mic-off`        | 18.50 x 20.00 | 12.35, 12.29 | 18.2% |
| `minimize`       | 17.50 x 17.50 | 12.22, 12.22 | 11.8% |
| `move`           | 19.50 x 19.50 | 12.22, 12.23 | 12.7% |
| `music`          | 18.50 x 18.50 | 13.08, 12.26 | 17.9% |
| `narration`      | 17.25 x 18.40 | 10.73, 11.16 | 16.2% |
| `palette`        | 18.30 x 19.50 | 11.74, 11.58 | 18.6% |
| `paperclip`      | 14.00 x 17.00 | 12.30, 11.91 | 13.0% |
| `pause`          | 13.50 x 16.50 | 12.22, 12.22 | 19.0% |
| `reference-card` | 16.50 x 19.00 | 12.06, 12.40 | 21.1% |
| `render`         | 20.50 x 16.50 | 11.59, 11.27 | 21.1% |
| `scissors`       | 18.25 x 18.00 | 10.17, 12.25 | 15.0% |
| `shot`           | 19.50 x 15.50 | 12.22, 12.22 | 13.4% |
| `skip-back`      | 15.00 x 15.00 | 13.35, 12.22 | 13.0% |
| `skip-forward`   | 15.00 x 15.00 | 11.10, 12.22 | 13.0% |
| `split`          | 20.50 x 19.50 | 12.22, 12.22 | 15.8% |
| `stop`           | 14.50 x 14.50 | 12.22, 12.23 | 12.3% |
| `text`           | 16.50 x 16.50 | 12.22, 8.76  | 7.6%  |
| `timeline`       | 20.00 x 18.00 | 11.92, 12.95 | 21.5% |
| `transition`     | 19.50 x 14.30 | 12.22, 12.22 | 16.3% |
| `video`          | 20.00 x 13.50 | 11.98, 12.23 | 15.9% |
| `voice`          | 19.50 x 18.50 | 11.70, 10.95 | 20.5% |
| `volume`         | 20.75 x 14.80 | 12.21, 12.22 | 17.8% |
| `volume-off`     | 20.50 x 14.80 | 11.25, 12.22 | 16.1% |
| `waveform`       | 19.00 x 16.50 | 11.62, 12.22 | 12.8% |
| `zoom-in`        | 19.50 x 19.50 | 11.78, 11.78 | 17.8% |
| `zoom-out`       | 19.50 x 19.50 | 11.95, 11.95 | 16.5% |

### Evidence

- [`../contact-sheets/b2/contact-sheet.png`](../contact-sheets/b2/contact-sheet.png): `pnpm contact-sheet` on the 50 drawings, at 16, 20, 24 and 48 px on the light and dark Studio pages, in the ink and the six accents.
- [`../contact-sheets/b2/family-sheet.png`](../contact-sheets/b2/family-sheet.png): `pnpm family-sheet --highlight`, the batch outlined beside B0 and B1 by category.
- [`../contact-sheets/b2/similarity.md`](../contact-sheets/b2/similarity.md) and [`../contact-sheets/b2/similarity-sheet.png`](../contact-sheets/b2/similarity-sheet.png): `pnpm similarity --names` on the batch.
- [`../contact-sheets/b2/alternatives-sheet.png`](../contact-sheets/b2/alternatives-sheet.png): each conventional glyph beside its measured alternatives.
- [`../contact-sheets/b2/sixteen-px.md`](../contact-sheets/b2/sixteen-px.md): the 16 px check.

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

- [`../development_plan.md`](../development_plan.md) §4 rule 11 "Drawing batch gate", §5 "B2: media-audio-files-editor".
- [`../technical_specification.md`](../technical_specification.md) §2 "Design Language", §3 "Originality Policy", §4.1, §4.2.
- [`../../icons/README.md`](../../icons/README.md) "Adding an icon".

---

## Task index

| ID  | Task                                                      | Status    | Priority | Size | Depends on |
| --- | --------------------------------------------------------- | --------- | -------- | ---- | ---------- |
| 6.1 | Draw the media and video icons and their metadata         | ✅ Done   | P0       | M    | none       |
| 6.2 | Draw the audio and voice icons and their metadata         | ✅ Done   | P0       | M    | none       |
| 6.3 | Draw the file, editor and canvas icons and their metadata | ✅ Done   | P0       | M    | none       |
| 6.4 | Evidence, the 16 px check and list, size budgets          | ✅ Done   | P0       | S    | 6.1 to 6.3 |
| 6.5 | Batch approval                                            | 👀 Review | P0       | S    | 6.4        |
| 6.6 | Phase commit and pull request                             | 👀 Review | P0       | S    | 6.5        |

---

## Tasks

### Task 6.1: Draw the media and video icons and their metadata

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: none

#### Acceptance criteria

- [x] `pause`, `stop`, `skip-back`, `skip-forward`, `loop`, `fullscreen`, `minimize`, `video`, `camera`, `scissors`, `shot`, `keyframe`, `frame`, `extend`, `render`, `export-video`, `timeline`, `transition` and `camera-motion`, each with `icons/line/<name>.svg` and `icons/meta/<name>.json`.
- [x] `pnpm lint:icons` passes; `pnpm check:generated` is clean.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Draw the media and video icons of spec §4.1 not drawn yet as code on the 24 unit grid,
following spec §2, and write their metadata against schemas/icon.schema.json.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

### Task 6.2: Draw the audio and voice icons and their metadata

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: none

#### Acceptance criteria

- [x] `mic`, `mic-off`, `volume`, `volume-off`, `music`, `waveform`, `captions`, `voice`, `lip-sync` and `narration`, with their metadata.
- [x] `pnpm lint:icons` passes; `pnpm check:generated` is clean.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Draw the audio and voice icons of spec §4.1 as code on the 24 unit grid, following
spec §2, and write their metadata.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

### Task 6.3: Draw the file, editor and canvas icons and their metadata

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: none

#### Acceptance criteria

- [x] `file-video`, `file-audio`, `image`, `paperclip`, `reference-card`, `asset`, `layers`, `crop`, `move`, `zoom-in`, `zoom-out`, `hand`, `cursor`, `text`, `align-center`, `grid`, `palette`, `brush`, `eraser`, `split` and `mask`, with their metadata.
- [x] `pnpm lint:icons` passes; `pnpm check:generated` is clean.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Draw the file, editor and canvas icons of spec §4.1 not drawn yet as code on the 24 unit
grid, following spec §2, and write their metadata.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

### Task 6.4: Evidence, the 16 px check and list, size budgets

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: 6.1 to 6.3

#### Acceptance criteria

- [x] The contact, family, similarity and alternatives sheets, the similarity report and the 16 px check are committed under `docs/contact-sheets/b2/`.
- [x] The 16 px master list is recorded in spec §4.2.
- [x] The visual baselines are committed, and `pnpm build && pnpm size` pass with the recalibrated budgets.

#### Agent prompt

```
You are a senior icon designer and engineer on @bymax-one/icons.

TASK
Commit the evidence of the batch, run the 16 px check on every drawing, fix the list of
16 px masters in spec §4.2, update the baselines and recalibrate the budgets.

Verification:
- `pnpm generate && pnpm lint:icons && pnpm check:generated` exit 0.
```

---

### Task 6.5: Batch approval

- **Status**: 👀 Review
- **Priority**: P0
- **Size**: M
- **Depends on**: 6.4

#### Acceptance criteria

- [ ] The batch is approved by the delegated auditor on behalf of the founder, and the approval is recorded in the plan and in this file.

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

### Task 6.6: Phase commit and pull request

- **Status**: 👀 Review
- **Priority**: P0
- **Size**: M
- **Depends on**: 6.5

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

- 6.1 ✅ 2026-11-11 The 19 media and video icons drawn, with their metadata.
- 6.2 ✅ 2026-11-11 The 10 audio and voice icons drawn, with their metadata.
- 6.3 ✅ 2026-11-11 The 6 file icons and the 15 editor and canvas icons drawn, with their metadata.
- 6.4 ✅ 2026-11-11 Sheets, similarity report, alternatives, the 16 px check and the 16 px master list committed; baselines updated and the size budgets recalibrated.
