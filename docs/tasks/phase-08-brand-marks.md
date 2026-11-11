# Phase B4a: brand-marks

> **Status**: 👀 Review · **Progress**: 3 / 4 tasks · **Last updated**: 2026-11-11
> **Source roadmap**: [`../development_plan.md`](../development_plan.md) §5 (B4)
> **Source spec**: [`../technical_specification.md`](../technical_specification.md) §5, §17 (D3)
>
> The marks are approved by the delegated auditor on behalf of the founder, 2026-11-11; the phase pull request is open.

---

## Context

B4 lands as three pull requests (see the plan). B4a ships the brand marks of spec §5. They are the only third-party shapes in the package, and they are not drawn: each is the path of Simple Icons 16.37.0 (CC0-1.0), a pinned development dependency, placed in the 20 x 20 live area as a whole.

### Approval

**Approved by the delegated auditor on behalf of the founder, 2026-11-11.** The audit compared every committed mark with its source in [`../contact-sheets/b4a/brands-compare.png`](../contact-sheets/b4a/brands-compare.png): no mark is redrawn or adjusted.

### Placement

SVGO's `convertPathData` with `applyTransforms` applies `translate(2 2) scale(5/6)` to the path, at three decimals; `pnpm generate` then normalises it. A first converter written for the task differed from the source by up to 64 of 255 in coverage at the edges and was dropped for SVGO. [`../contact-sheets/b4a/brands.md`](../contact-sheets/b4a/brands.md) records, for every mark, the largest difference against the source drawn under the same transform.

### Metadata

Each mark records `source` and `guidelines` from the Simple Icons data, `license` CC0-1.0 and `retrievedAt` 2026-11-11. Simple Icons gives no guidelines for two marks, so they point at the owners' own pages.

### Not in 1.0

- **Microsoft and LinkedIn.** Simple Icons removed them at their owners' request, so no source with a clear licence exists. Provisional and reversible.
- **`google-color`.** The current official Google sign-in asset uses a gradient G built with a mask, filters and a `foreignObject` conic-gradient, which the package format does not allow; it is deferred until an official solid-colour asset exists (D3).

---

## Task index

| ID  | Task                                                   | Status    | Priority | Size | Depends on |
| --- | ------------------------------------------------------ | --------- | -------- | ---- | ---------- |
| 8.1 | Import the marks and their metadata                    | ✅ Done   | P0       | S    | none       |
| 8.2 | Evidence, budgets and the record of what is not in 1.0 | ✅ Done   | P0       | S    | 8.1        |
| 8.3 | Approval                                               | ✅ Done   | P0       | S    | 8.2        |
| 8.4 | Phase commit and pull request                          | 👀 Review | P0       | S    | 8.3        |

---

## Completion log

<!-- Append one line per completed task: - <id> ✅ YYYY-MM-DD <summary> -->

- 8.1 ✅ 2026-11-11 The marks placed in the live area from Simple Icons 16.37.0, with their metadata.
- 8.2 ✅ 2026-11-11 Comparison sheet and table, the brands budget, spec §5, D3 and `TRADEMARKS.md` updated.
- 8.3 ✅ 2026-11-11 Approved by the delegated auditor on behalf of the founder.
