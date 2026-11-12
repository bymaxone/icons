# Redraw manifests

A pull request may change a drawing that already exists, or its visual baseline under `visual/`, only when a manifest in this folder names it. `pnpm check:redraws` enforces it in CI, against the pull request's base.

- **When:** a pull request that redraws an existing icon adds a manifest here. A batch that only adds icons needs none: new drawings and their baselines pass as they are.
- **Name:** one file per pull request, named after its branch, such as `docs/redraws/r2-polish.md`.
- **Content:** a list item per redrawn icon that opens with its name in backticks, then the reason and the approval:

  ```markdown
  - `file-zip`: the zipper reads at 16 px (auditor, 2026-11-20)
  - `book-open`: no longer reads as a double door (auditor, 2026-11-20)
  ```

- **What counts:** only the manifests the pull request adds or changes. One listed name allows every variant of that icon: line, filled, 16 px master, brand, and their baselines.

The gate exists because a normaliser run over a whole folder once rewrote existing drawings and regenerated their baselines from the damage, so every other gate passed.
