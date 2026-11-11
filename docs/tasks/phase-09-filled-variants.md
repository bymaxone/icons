# Phase B4b: filled-variants

> **Status**: 👀 Review · **Progress**: 2 / 4 tasks · **Last updated**: 2026-11-11
> **Source roadmap**: [`../development_plan.md`](../development_plan.md) §5 (B4)
> **Source spec**: [`../technical_specification.md`](../technical_specification.md) §2.5, §2.6, §12
>
> The drawings wait for the delegated auditor's approval on behalf of the founder.

---

## Context

B4 lands as three pull requests (see the plan). B4b ships the filled variants of spec §2.6: forty icons with a stateful meaning, each the silhouette of its line icon made solid with its interior details knocked out. Each icon's metadata declares the `filled` variant and adds a use case, starting with "Filled:", that names the state the filled drawing shows.

The forty: `home`, `dashboard`, `folder`, `folder-stack`, `library`, `templates`, `settings`, `user`, `users`, `file`, `play`, `pause`, `scene`, `video`, `camera`, `mic`, `volume`, `image`, `layers`, `bell`, `message`, `lock`, `eye`, `pin`, `check-circle`, `alert-circle`, `alert-triangle`, `info`, `cloud-check`, `clock`, `lightning`, `lightning-stack`, `wallet`, `card`, `crown`, `sparkle`, `octopus`, `character`, `sun` and `moon`.

### Construction and evidence

[`../contact-sheets/b4b/filled.md`](../contact-sheets/b4b/filled.md) records how each drawing is built, the precision rule, and per icon its precision, size, bounding box against the line icon and knockouts, with the line and filled sheets and the comparison of the three analytic drawings (`eye`, `octopus`, `settings`) with their Skia outlines.

### Rules of the phase

- The ink ceiling of spec §2.5 does not apply to a filled drawing; spec §2.6 holds it to its line icon: the same silhouette and bounding box, knockouts of at least 1.5 units, a silhouette that reads in the 16 px blur test, and every knockout that closes at 16 px reported.
- The size budget of spec §12 holds per component: at most 614.4 bytes brotli alone and 1536 with the runtime. No drawing is simplified to fit it.

---

## Task index

| ID  | Task                                        | Status    | Priority | Size | Depends on |
| --- | ------------------------------------------- | --------- | -------- | ---- | ---------- |
| 9.1 | Draw the filled variants and their metadata | ✅ Done   | P0       | L    | none       |
| 9.2 | Evidence, budgets and spec §2.5 and §2.6    | ✅ Done   | P0       | S    | 9.1        |
| 9.3 | Approval                                    | 👀 Review | P0       | S    | 9.2        |
| 9.4 | Phase commit and pull request               | 📋 ToDo   | P0       | S    | 9.3        |

---

## Completion log

<!-- Append one line per completed task: - <id> ✅ YYYY-MM-DD <summary> -->

- 9.1 ✅ 2026-11-11 Forty filled drawings with their metadata; `eye`, `octopus` and `settings` written from their geometry.
- 9.2 ✅ 2026-11-11 Sheets, per-icon measures, the precision rule, and spec §2.5 and §2.6 updated.
