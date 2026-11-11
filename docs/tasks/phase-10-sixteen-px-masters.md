# Phase B4c: sixteen-px-masters

> **Status**: ✅ Done · **Progress**: 4 / 4 tasks · **Last updated**: 2026-11-11
> **Source roadmap**: [`../development_plan.md`](../development_plan.md) §5 (B4)
> **Source spec**: [`../technical_specification.md`](../technical_specification.md) §2.2, §2.5, §4.2
>
> The drawings are approved by the delegated auditor on behalf of the founder, 2026-11-11.

---

## Context

B4c draws the 16 px masters of spec §4.2: the icons used at 16 px in the shell and the icons whose 24 px drawing fails at 16 px. Each master is a separate drawing on the 24-unit grid, made for 16 px, rendered with the set's 1.5 px stroke at 16 since the `sm` stroke pull request. Each icon's metadata declares the `sm` variant and the optical size 16.

### Construction and evidence

[`../contact-sheets/b4c/masters.md`](../contact-sheets/b4c/masters.md) records the rules, what each master drops or simplifies, and per icon its ink at 16 against its line icon at 24, the light between its strokes, its size and its nearest third-party drawing, with the sheets.

### Rules of the phase

- Spec §2.5 holds a master to the weight of its line icon (32.25% at 16 px and at most 1.5 times the line icon's ink at 24) and keeps one stroke fringe, at most, between distinct strokes at 16 px.
- Straight strokes sit on the centres of the 16 px pixels; a stroke between two columns is used only where crispness and the gap cannot both fit.

---

## Task index

| ID   | Task                                      | Status  | Priority | Size | Depends on |
| ---- | ----------------------------------------- | ------- | -------- | ---- | ---------- |
| 10.1 | Draw the 16 px masters and their metadata | ✅ Done | P0       | L    | none       |
| 10.2 | Evidence, budgets and spec §2.5           | ✅ Done | P0       | S    | 10.1       |
| 10.3 | Approval                                  | ✅ Done | P0       | S    | 10.2       |
| 10.4 | Phase commit and pull request             | ✅ Done | P0       | S    | 10.3       |

---

## Completion log

<!-- Append one line per completed task: - <id> ✅ YYYY-MM-DD <summary> -->

- 10.1 ✅ 2026-11-11 The 16 px masters with their metadata.
- 10.2 ✅ 2026-11-11 Sheets, per-icon measures, similarity and spec §2.5 updated.
- 10.3 ✅ 2026-11-11 Approved by the delegated auditor on behalf of the founder, after the redraw of five masters.
- 10.4 ✅ 2026-11-11 Phase pull request.
