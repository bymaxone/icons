# Phase P5: hardening-release

> **Status**: 🔄 In Progress · **Progress**: 0 / 9 tasks · **Last updated**: 2026-11-11
> **Source roadmap**: [`../development_plan.md`](../development_plan.md) §5 (P5)
> **Source spec**: [`../technical_specification.md`](../technical_specification.md) §11, §12, §13, §16

---

## Context

P5 holds every gate at its final threshold and prepares the first publish. It adds no icon and changes no component API. The first publish is manual, by the founder; every task up to it is done in this repository.

- **Metadata for any product.** The use cases name no internal product, and each icon carries a short `label` for its standalone accessible name.
- **The PR preview branch.** `icons-preview` keeps a directory per pull request (`pr-<n>/<sha>/`). It is cleaned when a pull request closes, and the directories of closed pull requests are removed once.
- **The API surface check.** `scripts/check-api-surface.mjs`, byte-identical across the family, stops on a package that was never published: `npm view` answers E404 instead of an empty list. The fix is made in the family's canonical copy and copied here.
- **Consumers.** The packed tarball is installed clean in a Next.js App Router application, rendered in a Server Component and a client component, and in a Vite application, each built.
- **Release checklist.** `npm pack --dry-run`, publint and arethetypeswrong on the tarball, `release.yml` with trusted publishing and provenance, the version to publish first, the README against the site and the API, and the open security alerts, each with its evidence.

---

## Task index

| ID   | Task                                                     | Status    | Priority | Size | Depends on |
| ---- | -------------------------------------------------------- | --------- | -------- | ---- | ---------- |
| 12.1 | Metadata: a `label` per icon, use cases for any product  | 👀 Review | P0       | S    | none       |
| 12.2 | Clean the PR preview branch on close                     | 📋 ToDo   | P1       | S    | none       |
| 12.3 | API surface check on an unpublished package              | 📋 ToDo   | P0       | S    | none       |
| 12.4 | The tarball in Next.js (App Router) and Vite             | 📋 ToDo   | P0       | M    | 12.1       |
| 12.5 | Final gates: size budgets, cold mutation, package checks | 📋 ToDo   | P0       | M    | 12.1       |
| 12.6 | Security alerts, each with a decision                    | 📋 ToDo   | P1       | S    | none       |
| 12.7 | README against the site and the API                      | 📋 ToDo   | P1       | S    | 12.1       |
| 12.8 | The release pull request and the checklist               | 📋 ToDo   | P0       | M    | 12.2–12.7  |
| 12.9 | First publish, trusted publishing, the Studio on npm     | 📋 ToDo   | P0       | S    | 12.8       |

Task 12.9 is the founder's: the first publish is manual.

---

## Completion log

<!-- Append one line per completed task: - <id> ✅ YYYY-MM-DD <summary> -->
