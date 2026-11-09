# Contributing to @bymax-one/icons

Thank you for your interest in contributing! This document describes the
workflow and quality gates for this library. By participating, you agree to
abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Reporting security issues

**Do not open public issues for security vulnerabilities.** Follow the private
reporting process described in [SECURITY.md](./SECURITY.md).

## Prerequisites

- Node.js >= 24
- pnpm 11 (`corepack enable`; `packageManager` pins the exact version)

## Getting started

```bash
pnpm install
pnpm build
```

## Development workflow

This is a published npm library, not an application. Keep `dependencies`
empty; React is a `peerDependency`, and tooling stays in `devDependencies`.

1. Create a branch from `main`.
2. Make your change; add or update co-located `*.spec.ts` / `*.spec.tsx` tests
   (100% coverage is a hard gate, not a target).
3. Run the full verification suite before opening a PR.

## Drawing originality

The reason this package exists is that its drawings are not someone else's. Every
pull request that adds or changes a drawing follows these rules, and the pull
request template asks you to attest to them:

1. **Drawn from scratch.** No third-party SVG is pasted, traced or modified to
   create a Bymax icon. Third-party sets are never open in the working file of a
   new drawing.
2. **Attestation.** The pull request carries the checked box "This drawing is an
   original Bymax work." A drawing change without it is not reviewed.
3. **Process evidence.** Each drawing batch keeps its contact sheets in the
   repository history, so the evolution of every icon is traceable.
4. **Similarity check.** CI rasterises each new or changed icon and compares it
   with Lucide, Tabler, Phosphor and Heroicons. A close match is flagged for human
   review; it does not fail the build on its own.
5. **Primitive glyphs.** Plus, close, chevrons and arrows inevitably coincide with
   every other set. That is expected; the check matters for composite pictograms.

Brand marks are the only exception: they use the owner's official geometry, never a
Bymax redrawing, and are governed by [`TRADEMARKS.md`](./TRADEMARKS.md).

## Adding an icon

The drawing sources live in [`icons/`](./icons/README.md), one SVG per variant and one
metadata file per name:

1. Draw `icons/line/<name>.svg` on the 24 px grid; `<name>` is kebab-case and names what
   is depicted. Add `icons/filled/<name>.svg` or `icons/sm/<name>.svg` only for a variant
   the metadata declares; a brand mark goes in `icons/brands/<name>.svg`.
2. Write `icons/meta/<name>.json` against `schemas/icon.schema.json` (or
   `schemas/brand.schema.json` for a brand, with its `source`, `guidelines`, `license` and
   `retrievedAt`).
3. Run `pnpm generate`: it normalises the SVGs in place, runs the icon lint, and writes
   `src/icons/generated`, `src/brands/generated` and `src/meta/generated`. Never edit those
   directories by hand; `pnpm check:generated` fails when they differ from the sources.
4. Run `pnpm contact-sheet` and review `reports/contact-sheet.png`.
5. List the icon under `Unreleased` in `CHANGELOG.md`, and tick the originality
   attestation in the pull request.

## Verification, run before every PR

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm lint:icons && pnpm check:generated && pnpm test:cov:all && pnpm build && pnpm size && pnpm check:exports && pnpm check:runtime && pnpm check:fixtures
```

All of the following must pass:

- **Typecheck**: `tsc --noEmit` over the source, the build config and the
  React-free `./meta` config (strict, zero errors)
- **Lint**: ESLint (zero `any`, import order, security rules, no React import in
  `./meta`)
- **Format**: Prettier over the whole tree
- **Coverage**: 100% statements / branches / functions / lines
- **Build**: tsup produces ESM + CJS + `.d.ts` + `.d.cts` for every subpath
- **Size**: every subpath stays within the budget in `scripts/check-size.mjs`
- **Exports**: `attw --profile strict` resolves every entry point from the packed
  tarball
- **Runtime**: every subpath loads from the packed tarball in ESM and CommonJS
- **Icon lint**: every SVG and metadata rule of the specification over `icons/`
- **Generated modules**: `src/**/generated` is what `pnpm generate` writes from the sources
- **Fixture package**: the whole chain, from generation to the dogfood install, on the
  placeholder icons of `fixtures/icons`

Mutation testing (`pnpm mutation:full`) is a release gate, run manually before
tagging a version, never on every PR.

### Two checks always report `SKIPPED`, and neither of them is a path filter

A pull request's rollup shows `ci / Build` and `ci / Mutation testing` as
`SKIPPED` on **every** run, whatever the diff touches. That is deliberate, and it is
worth knowing because `SKIPPED` renders as a non-failure rather than as something
visibly different from a pass.

| Check              | Why it never runs                       | What covers it instead                                                           |
| ------------------ | --------------------------------------- | -------------------------------------------------------------------------------- |
| `Build`            | `run-build: false` to the reusable      | The `verify` job here: build, output integrity across every subpath, size budget |
| `Mutation testing` | Push to `main` and manual dispatch only | The release gate, run cold before tagging                                        |

There is no `paths` or `paths-ignore` filter anywhere in `ci.yml`, so nothing is
skipped _because of_ which files a change touches. In particular `scripts/` is
linted (`pnpm lint` covers `src` and `scripts`), but not every script runs in
`ci.yml`. `check-published-surface.mjs` runs only through `prepublishOnly` and
`dogfood-smoke-test.mjs` only in `release.yml`, so a change to either is linted and
not executed by a pull request.

## Commits, Conventional Commits

Commit messages are validated by commitlint via the `commit-msg` hook:

```
<type>(<scope>): <subject>
```

The `pre-commit` hook runs lint-staged (ESLint + Prettier on staged files). Run
`git config commit.template .gitmessage` once to get the template in your editor.

## Pull requests

- Keep PRs focused and small. A drawing batch is one PR.
- Fill in the pull request template, including the originality attestation when
  the PR adds or changes a drawing.
- Record user-facing changes under the `Unreleased` section of `CHANGELOG.md`,
  listing every icon added, renamed or deprecated.
- All CI checks must be green. The `CI passed` aggregate is the check the
  organisation ruleset requires.

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](./LICENSE). Brand marks are not covered by that grant; see
[`TRADEMARKS.md`](./TRADEMARKS.md).

---

## Releasing

Publishing is driven from CI through the `release.yml` workflow, which uses npm
OIDC trusted publishing (no long-lived npm token) and attaches build provenance.
Trusted publishing can only be configured for a package that already exists on the
registry, so **the first publish, `1.0.0`, is manual**; every release after it goes
through the workflow.

Go-live is a deliberate, manual sequence performed by a maintainer:

1. **Open the release PR.** Title it `chore(release): X.Y.Z`; it bumps `version` in
   `package.json` and adds the hand-written `## [X.Y.Z] - YYYY-MM-DD` section to
   `CHANGELOG.md`. The `api-surface` workflow checks it.
2. **Verify the gates locally.** `pnpm mutation:full`, `pnpm prepublishOnly`,
   `pnpm dogfood`, and `npm publish --dry-run` (confirm the tarball packs only
   `dist/`, `LICENSE`, `README.md`, `CHANGELOG.md` and `TRADEMARKS.md`).

   **`mutation:full`, not `mutation`.** `stryker.config.json` sets
   `incremental: true`, so `pnpm mutation` may reuse stored verdicts instead of
   executing a mutant. `mutation:full` deletes `reports/stryker-incremental.json`
   first, so every mutant runs. The release bar for mutation is **100%**, and
   `break: 100` in `stryker.config.json` enforces it. An equivalent mutant is
   handled in the source, with a `// Stryker disable next-line <Mutator>: <reason>`
   directive whose reason was checked by running the mutant. A killable mutant is
   never disabled to reach the number.

3. **Merge, then tag from `main`.** Squash-merge the release PR, then push an
   annotated `vX.Y.Z` tag matching the manifest version. The tag push triggers
   `release.yml`, which waits for approval in the `npm-publish` environment,
   verifies the tag against `package.json`, re-runs the release gates, and
   publishes with provenance.
4. **Post-publish verification.** Compare the published tarball against a local
   pack, under distinct filenames: `npm pack @bymax-one/icons@<version>` and
   `npm pack` from the repository, then `diff -r` the unpacked trees. Then install
   the published version in a throwaway consumer and import every subpath in ESM
   and CommonJS.
