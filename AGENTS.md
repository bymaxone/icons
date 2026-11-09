# @bymax-one/icons — Agent Specification

`@bymax-one/icons` is a **published npm library**, not an application: an original icon set
shipped as React components, raw SVG files, an SVG sprite and typed metadata, with zero direct
dependencies and `react` as its only peer. Anything merged here reaches every screen of every
product that uses the set, so a drawing, a default attribute or the public surface is what a
change is most likely to break.

> **Prerequisite:** read [CLAUDE.md](./CLAUDE.md) first for the critical rules. The design
> language, the subpaths and the phase order live in
> [`docs/technical_specification.md`](./docs/technical_specification.md) and
> [`docs/development_plan.md`](./docs/development_plan.md); this file does not restate them.
> What follows is the review layer.

## Code Review Rules

<!-- shared:begin -->
<!--
  CANONICAL COPY: bymaxone/.github → agents/code-review-rules.md
  Do not edit this block in a consuming repository. It is replaced wholesale by
  the `agents-sync` reusable workflow, so a local edit is reverted on the next
  run. Change it here, cut a release, and every repository is offered the update.

  Repository-specific rules go OUTSIDE this block, below the closing marker.
  Editing notes: AGENTS.md in bymaxone/.github.
-->

These rules hold in every Bymax repository. What is specific to this one is written after this
block, and the two are read together.

The pipeline already enforces formatting, linting, dependency policy, coverage and — where the
repository has one — the mutation gate. Do not spend a review on a **violation** of one of those: it
is a red check, not a comment. What follows is what CI cannot see.

A violation of a rule in this block is reported at **P1** at minimum. Codex surfaces only P0 and P1
on a pull request, so a rule whose violations land at P2 is a rule nobody sees.

**When a rule moves from here into a check, it leaves here.** A red check is proportionate to a
correctness failure that is invisible without it, and disproportionate to style enforced at an
inconvenient moment. Never carry both: a rule stated here _and_ enforced by CI spends a reviewer's
attention on what a gate already reports.

**A change to the enforcing configuration is the opposite case, and it is in scope.** Every gate runs
the configuration from the branch under review — that branch's lint config, its coverage thresholds,
its mutation thresholds. So a pull request that deletes a rule, lowers a threshold or widens an
ignore glob turns the check **green**, because a gate reports on the rules it was handed. For those
diffs the review is the only independent check there is, and a weakened gate needs the same
justification a suppression does.

### A finding names what it read

Every factual claim in a review — about a library's API, about this repository's history, about what
a file contains — has to come from something read in the tree under review, and the finding should
say which. A claim assembled from recollection is likely to describe a previous version of whatever
it is about.

**Safe path**, by the kind of claim:

| Claim about                             | Read this                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| A library's API **shape**               | `node_modules/<pkg>/dist/**/*.d.ts` in this tree                               |
| A library's **runtime behaviour**       | that version's changelog entry, its documentation, or a test that exercises it |
| A commit's author or committer identity | out of scope: it is not text a change introduces                               |
| What a file contains                    | the file at the revision under review, not an earlier one                      |

The first two rows are separate on purpose: a `.d.ts` settles what a signature accepts and nothing
about what the implementation does with it, so a behavioural claim resting on one is unfounded.

Weight the checking by what acting on the finding would cost. A comment that asks for a reworded
sentence is cheap to be wrong about; one that asks for history to be rewritten, a merge reverted, or
a release pulled is not — verify that class before raising it, and raise it at the severity the
evidence supports rather than the severity the consequence would deserve if true.

### A bug reproduces, and a finding is this change's

Unless a rule here says to report without one, raise a bug only with its trigger: the input or
repository state, the command, the wrong result. Letting through what should be refused is P1 at
least, as is a crash an untrusted caller can trigger; a refusal, or a crash no untrusted caller can
reach, on input the project does not claim to support is not. Behaviour already present at the merge
base belongs to another change. On new commits, review what changed since the last reviewed commit.
A thread is settled only when the reply cites evidence that disproves the finding (a command, a
test, a file:line) or the code it names changed; a resolved thread or a bare reason is not evidence,
so re-check the current code and raise the finding again only if its trigger still reproduces. One
comment per root cause, its siblings named in it.

### A dependency upgrade migrates every call site, not only the ones that fail to compile

When an upgrade tightens a contract, the compiler catches only the call sites whose **shape**
changed. A field that stays optional in the published type while becoming mandatory in behaviour
compiles, passes the unit suite, and fails in production.

A `@bymax-one/*` version number carries **no compatibility information** while the libraries are
pre-stable: breaking changes ship in minor and patch releases by explicit policy, so `^` and `~`
protect against nothing. The migration note under **Apply to a derived backend** in the library's own
changelog is the compatibility contract.

**Safe path:** read **every** changelog entry from the version being replaced up to the proposed
one, not only the proposed one's, and check every call site they name — not only the ones the
compiler rejected. Upgrades routinely skip releases, and the entry that matters is often not the
last one: adopting `@bymax-one/nest-cache` 1.1.0 → 1.2.1 skipped 1.2.0, whose entry holds a security
fix. Diff the `.d.ts` of the **previously adopted** version against the **proposed** one — `npm
pack` both, and name the two versions. Reaching for "the installed declarations" is the trap: in a
checkout of the branch under review the installed tree is already the new version, so that diff
compares a release with itself and shows nothing.

### Settled decisions are not review findings

Both are settled deliberately, and reopening either costs a round trip and changes nothing:

- **Do not propose a major version bump** for a breaking change in a `@bymax-one/*` library, and do
  not assert that this ecosystem follows strict SemVer. Until an API is declared stable, breaking
  changes ship in minor and patch releases; the migration note carries the compatibility information
  the number does not. If a document claims strict SemVer, the finding is that the claim is wrong —
  not that the version should be raised.
- **Do not propose pinning `bymaxone/.github` reusable workflows to a commit SHA.** They are
  referenced by the `@v1` alias on purpose: a fix has to land once and reach every repository, the
  tag is immutable and the alias moves only on a release, and pinning was measured to cost ~58
  dependency pull requests to propagate one change. Third-party actions are the opposite case and
  **are** pinned by SHA.

**Safe path:** if you believe a settled decision is now wrong, say so as a question in the pull
request rather than as a finding.

### Suppressions are refusals, not exceptions

`@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `eslint-disable` in any form,
`as unknown as` laundering a real type error, `istanbul ignore`, and in Rust `#[allow(...)]` over a
lint gate or `unsafe` without a `// SAFETY:` comment are blocking findings.

Anything a configured gate already reports belongs to the gate, not to a review: where a repository
lints `no-explicit-any` as an error — most do — an `as any` is a red check, and raising it here only
duplicates it. Check the repository's lint configuration before reporting a suppression rather than
assuming the list is exhaustive in either direction.

A failing gate means the code is wrong, the type is wrong, or the rule is wrong. **Safe path:** fix
whichever it is. Changing a rule's configuration with a stated reason is legitimate; scattering
per-call-site silencers is not.

### A key built from more than one field keeps its boundaries

A key or digest derived from **two or more variable fields** must not let a field's content move the
boundary between them. `${tenantId}:${recipient}` makes `('a:b','c')` and `('a','b:c')` one key,
which no digest strength repairs, and one tenant's lookup then resolves another's record. Rejecting
empty fields does not fix it, and neither does a caller that validates its input — the property has
to hold in the construction. A fixed prefix beside a single field is not this shape.

**Safe path:** encode each field so it cannot contain the delimiter, or hash each to a fixed width.
Any other composition needs an argument that every boundary is recoverable, and one bounded field
does not rescue two free ones beside it. Then assert it in a test: where the property holds only
because of the values in play, the next one added takes it away and nothing says so.

### Comments state constraints, never history

A comment must read as true for whoever opens the file next. Flag any comment that narrates what a
previous version did, names a phase, task, ticket or review round, or explains a change rather than
the code. **Safe path:** state the constraint that still holds, and let `git log` carry the history.

Evidence for a constraint is not history, and how the evidence was obtained does not decide which it
is. The test is whether the fact still binds the next reader. A measurement that predicts what they
will hit on the other path — what the alternative did, what it costs in numbers — belongs beside the
constraint it supports, however it was obtained. What ages is the part that cannot recur for them:
what a previous version of this code did, a version number, a registry state, a review round, a
failure that has since been fixed. Flag those; keep the measurement.

### Size and layering

Functions over **50 lines** and nesting deeper than four levels are findings **for what a change
introduces** — a new function, or a change that pushes an existing one past the limit — in the
repository's own source and test directories. A test-suite grouping construct (`describe`, `context`,
`mod tests`, a table of cases) is not a function; the unit under the limit is the body of a single
`it`/`test`/`#[test]`. On the same terms, every non-trivial source file a change introduces opens
with a header stating its purpose and its layer, and every exported symbol a change introduces
carries a doc comment.

**The 800-line file limit applies to what a change introduces, not to what it inherits.** A
repository that already carries a file past the line — a generator, a long end-to-end suite — would
otherwise produce a finding on every pull request touching three lines of it, which the author
cannot act on and did not cause. Raise it for a **new** file over the limit, or when a change pushes
a file past it or materially grows one already over.

Markdown, generated output and lockfiles are **out of scope**: none has layers, and reporting their
length fires on every dependency bump and release note.

**Safe path:** extract by responsibility rather than by line count — the limit is a symptom, and one
file doing two jobs is the defect.

### Language and attribution

Everything published is English — source, comments, tests, commit messages, pull request titles and
bodies, `README.md`, `CHANGELOG.md` and everything under `.github/`.

Each repository states its language policy for `docs/` below this block. Report a language finding in
`docs/` only against what the repository states; where it states nothing, `docs/` is English like
everything else. A `docs/` language other than English is a repository-owner decision recorded in the
narrowings, not a convention a contributor may introduce.

No commit, pull request, comment or code may attribute authorship to an AI assistant or coding tool,
in any form. **Only text the change introduces is in scope** — a trailer, a "generated with" line, a
signature in a comment or a description.

A commit's author and committer fields are not that: they come from the contributor's git
configuration rather than from the diff, and a review reading the diff cannot see them. Never report
an identity field, and never present a command's reconstructed output as evidence for one. Measured:
twenty-six such findings, every SHA resolving nowhere and every `git log` line unrun, each asking to
rewrite published history.

<!-- shared:end -->

## Where this repository narrows a shared rule

<!--
  BYTE BUDGET. Codex reads this file per directory, root to changed file, and stops at
  `project_doc_max_bytes` (32768 by default), counting the root file and any nested
  `AGENTS.md` together. Past that it truncates silently: no error, no warning, and the tail
  of this file simply stops being guidance.

  The shared block above is centrally managed and grows when the org adds a rule, so the
  headroom is not this repository's alone to spend. Check `wc -c AGENTS.md` before adding a
  section, and prefer `docs/` for anything a reviewer does not need in the diff.
-->

The block above holds across every Bymax repository. What follows is the sharper form some of its
rules take here, plus what a reviewer of an icon set cannot infer from the tree.

### A drawing change carries its originality attestation

The package exists because its drawings are not someone else's. A pull request that adds or
changes an SVG under `icons/` (other than `icons/brands/`) must carry the checked box "This
drawing is an original Bymax work." in its description; its absence is a **P1** finding. A
composite pictogram that reproduces the construction of a known open-source icon (Lucide, Tabler,
Phosphor, Heroicons) is a P1 finding with the two named side by side. Primitive glyphs (plus,
close, chevrons, arrows) are expected to coincide and are not a finding. A pasted, traced or
modified third-party path is never acceptable, whatever the similarity report says.

### Markup is built from data, never from a string

A component that renders through `dangerouslySetInnerHTML`, `innerHTML`, a JSX string or any
runtime SVG parser is a **P1 security** finding: the guarantee that no icon path passes through an
HTML parser in a consumer's page is the security model in `README.md`. The same holds for any path
by which a consumer prop becomes markup; `title` is text and an attribute value only.

### Components stay pure, so they render in Server Components

No hook, no context and no `'use client'` directive in a component or in the `Icon` base. Each one
moves every consumer behind a client boundary. A context provider for default size or colour is a
settled rejection (spec §10), not a missing feature.

### Generated modules are not edited by hand

Files under `src/icons/generated/` are written by `scripts/generate.mjs` from the SVG and metadata
sources. A diff there with no matching change to `icons/` or to the generator is a finding, whatever
it fixes: the next generation run reverts it.

### A rename is never a silent break

An icon renamed without its old name kept as a deprecated alias carrying `toBeRemovedInVersion` is a
breaking change shipped without notice. So is a removed alias. Names are kebab-case, American
English and describe what is depicted; product meanings live in aliases.

### Brand marks are official geometry

A brand mark is the owner's geometry scaled into the live area, filled, monochrome
`currentColor`. A restyled, simplified or line version of a logo is a finding, and so is a brand
name outside `icons/brands/`. Every brand needs `source`, `guidelines`, `license` and
`retrievedAt` in its metadata and a line in `TRADEMARKS.md`.

### `./meta` loads without React

Lint refuses a React import under `src/meta/`, and `tsconfig.meta.json` type-checks it without the
DOM library. A change that widens either (an ignore, a `lib` entry, a moved file) is in scope even
though the gate stays green, because the gate reports on the rules it was handed.

### A `// Stryker disable` directive is not a suppression

The shared suppression policy holds here. A Stryker directive is a different thing and is
**required** by this repository's mutation policy: an equivalent mutant carries its reason on the
line it applies to, in the form `// Stryker disable next-line <Mutator>: <reason>`, and
`pnpm check:mutants` fails the build when one parses without a reason. A directive without a
reason, or placed over a mutant the suite could kill, is the finding.

### The version number carries no compatibility information

This library follows the interim policy shared across the `@bymax-one/*` libraries: breaking
changes ship in minor and patch releases, and the `CHANGELOG.md` entry is the compatibility
contract. `files` ships `README.md`, `CHANGELOG.md` and `TRADEMARKS.md`, so once the package is
published a fix to any of them needs a version bump and a `## [x.y.z]` section in the same pull
request.

### `docs/` is English in this repository

Every file under `docs/` is English, as are `README.md`, `CHANGELOG.md` and every comment, JSDoc,
test name and error message. There is no Portuguese carve-out here.

### The pull request template is a deliberate addition

The `@bymax-one/*` libraries carry no pull request template; this one does, because the
originality attestation has to be asked for on every drawing change. Do not report it as drift
from the family.

## Architecture

- `src/index.ts`: the root entry. It re-exports `ICON_GRID`, the runtime and the generated
  icons; sibling subpaths come in by package specifier, so each module exists once.
- `src/runtime/`: the `./runtime` entry: the `Icon` base, `createIcon`, the props, the drawing
  data types, the stroke maths and the accessibility rules.
- `src/meta/`: the React-free entry (the grid, the typed metadata, the name unions).
- `src/icons/generated/`, `src/brands/generated/`, `src/meta/generated/`: written by
  `pnpm generate`, committed, checked by `pnpm check:generated`.
- `src/pipeline/`: the generator, the icon lint and the contact sheet; not shipped, held to
  100% coverage and mutation; run by Node's native type stripping through `scripts/*.mjs`.
- `icons/`, `schemas/`, `categories.json`: the drawing sources and their schemas;
  `fixtures/icons/`: placeholder drawings for tests and `pnpm check:fixtures`. `site/` comes
  with the catalog phase.
- `scripts/`: the Node gates and the thin entries of the pipeline.

## Testing

Co-located `*.spec.ts` / `*.spec.tsx`; 100% coverage in both Jest configs; Stryker `break: 100`.
A React spec switches to jsdom with the docblock
`/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */`, which is transparent
outside Stryker. Every `it()` carries a comment stating the scenario.

## Session memory (Obsidian vault)

Lessons from earlier sessions live outside the repository, in the owner's Obsidian vault at `~/Documents/MyApps/obsidian/Brain/`, when it is present on this machine. Before a task, find this repository's hub under `02 - Areas/`: the table in `02 - Areas/Bymax/Bymax.md` maps each Bymax repository to its folder; for any other repository, search `02 - Areas/` for the repository name. Read the hub with its `Learnings.md` and `Decisions.md`, and the relevant stack notes under `03 - Resources/`. When the vault and the code disagree, the code wins. Record each non-obvious gotcha, root cause or decision in the hub as the vault's `_meta/conventions.md` describes; a repository without a hub gets one from `_meta/templates/project-hub.md`.
