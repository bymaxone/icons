# Release checklist: 1.0.0

> **Prepared**: 2026-11-14 · **Version**: 1.0.0, the first publish · **Publishes**: the founder, by hand

Each item carries the evidence it was checked with. The first publish is manual. Every release after it goes through `release.yml` with trusted publishing.

---

## 1. What the tarball holds

`npm pack --dry-run --json` on the release branch:

- 14,181 files, 2,271,554 bytes packed (2.17 MiB) and 12,634,563 bytes unpacked (12.05 MiB).
- Top level: `dist/`, `package.json`, `README.md`, `CHANGELOG.md`, `LICENSE` and `TRADEMARKS.md`. The dogfood gate checks that nothing else is in it.
- No `src/`, `scripts/`, `fixtures/`, `icons/`, `site/`, `docs/` or `.github/`.

## 2. Resolution of every subpath

- **publint** (0.3.25) on the tarball: "All good!", with no error, no warning and no suggestion.
- **arethetypeswrong** (0.18.5, `pnpm check:exports`) packs the package and resolves every non-wildcard subpath, one block per icon and flag (1,308 in all, with `.`, `./runtime`, `./meta`, `./brands` and `./flags`), in node10, node16 from CommonJS, node16 from ESM and bundler: 5,220 green results and none red.
  - It cannot follow a wildcard (`./icons/*`, `./flags/*`, `./svg/*`) or a non-script asset (`./sprite.svg`, `./metadata.json`).
- **The consumer load gate** (`pnpm check:runtime`) covers what arethetypeswrong cannot. On the packed tarball, in ESM and in CommonJS, 1,553 subpaths export exactly their 4,379 names; the 1,754 generated components and the fixture render; 1,504 sprite symbols and 1,754 raw SVG files resolve; and under the `react-server` condition the fixture and the 1,754 generated components render as Server Components. No bundle has `'use client'`.
- **The dogfood install** (`pnpm dogfood`, a release gate) installs the packed tarball in a clean directory: 14,181 entries, all under the allowed paths; ESM and CJS specifiers resolve from the consumer's directory through the `exports` map; a fixture icon and 1,754 generated components render with `react-dom/server`.

## 3. The tarball in real applications

Both applications install the packed 1.0.0 tarball of this branch with `npm install`, in empty directories outside the repository. node v24.22.1, npm 11.19.1, react 19.3.1, typescript 7.0.2.

- **Next.js 16.4.6 (App Router).** `next build` compiles, type-checks (with `skipLibCheck` off) and prerenders 3 static pages; `next start` serves the page.
  - **The page is a Server Component** with no `'use client'`. It renders, from the root, a per-icon subpath (`@bymax-one/icons/icons/lightning`), `./brands`, `./flags` and `./meta`: a line icon, a filled variant, a 16 px master, an icon with a stroke override, a brand mark, two flags and `<TrashIcon title={ICON_METADATA.trash.label} />`. Its heading reads 1,298 icon names, 250 flags and 110 brands.
  - **Its client component** uses `useState` and renders two icons. It is the only `'use client'` boundary; no import from the package needs one.
  - **The served HTML** holds 11 drawings, 9 from the page and 2 from the client component, which still renders on the server. 8 are decorative and carry `aria-hidden="true"`. 3 carry `role="img"`, with the titles "Brazil", "Delete" and "Delete".
  - **The flags:** `<BrFlagIcon size={24} />` renders `width="36" height="24"` with its source view box `0 0 513 342`; `<UsFlagIcon />` renders `width="24" height="16"`, the default height of 16 at 3:2.
- **Vite 8.3.8 with React.** The build runs `tsc` with `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` and `skipLibCheck: false`, so the package's own declarations are type-checked, and then `vite build` (1,568 modules). The app also passes `ref`, `absoluteStrokeWidth` and `className`.
  - The same component tree rendered with `react-dom/server` through `tsx` holds 8 drawings, 2 of them labelled ("Brazil" and "Delete"), and the flags at `36 x 24` and `24 x 16`. The built bundle itself was not rendered.
  - Its heading reads the 1,298 names from `ICON_NAMES` and the 250 from `FLAG_NAMES`.
- `npm install` of the tarball warns that the packed `package.json` still lists a `prepare` script (`husky`). npm runs `prepare` for installs from a git URL or a local tarball, not for a registry install, which this checklist did not test. The warning did not fail an install.

## 4. The release workflow

`.github/workflows/release.yml` runs on a `v*.*.*` tag or by hand, in the `npm-publish` environment, with `contents: write` and `id-token: write`, and a 40-minute limit: the gates take about 15. It holds no `NPM_TOKEN`.

1. It checks the tag against the version in `package.json`.
2. It extracts the CHANGELOG section of that version as the release notes.
3. It runs `pnpm prepublishOnly`, which ends with `check:exports`, `check:published` and `check:runtime`, then `pnpm dogfood`.
4. It runs `node scripts/check-api-surface.mjs`, which passes on a first release: npm's E404 means no earlier version.
5. It publishes with `npm publish --provenance --access public --ignore-scripts`, skipping a version npm already has.

Trusted publishing needs the package to exist on npm, so the first publish is the founder's, by hand, following the runbook in section 9. Pushing a `v1.0.0` tag before that publish would fail the workflow: no package and no trusted publisher exist yet.

After that publish, the founder sets the trusted publisher on npmjs.com:

- repository `bymaxone/icons`;
- workflow `release.yml`;
- environment `npm-publish`.

## 5. The version to publish first

**Recommendation: 1.0.0.**

- The plan's definition of done names 1.0.0.
- The component API, the subpaths and the metadata shape are what the spec fixed, and P5 adds no API change.
- `bymax-studio-web` is to depend on a range that accepts compatible fixes and features.
- A 0.x version would make a caret range pin the minor version.

The release branch sets `version` and every `since` to 1.0.0 and cuts `## [1.0.0]` in the CHANGELOG.

To publish 0.1.0 instead, three things change on the branch before tagging:

- `version` becomes 0.1.0;
- the CHANGELOG heading becomes `## [0.1.0]`;
- every `since` becomes 0.1.0.

## 6. README

The README matches the API and the catalog. Every subpath is listed as ready, `./flags` and `./flags/<name>` included. The component names are listed by variant (`Icon`, `FilledIcon`, `SmIcon`, `BrandIcon`) and the flags as `<Code>FlagIcon`. The README states the counts of the package in its status line and no size budget or tarball figure; `check:published` compares those counts with `dist/metadata.json` and compiles its code snippets against `dist/`, so a release that changes a count must update that line. The metadata fields include `label`. The accessibility defaults match the runtime, and the README links to the catalog.

## 7. Security alerts

| Alert                                                               | Decision                                                                                                                                             |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependabot #1, `deepmerge` 4.3.1 (GHSA-gcqx-w48m-w2h4, low)         | Accepted risk. It reaches only `jest-config`, a development dependency. The package has no dependency, and no patched version exists.                |
| Dependabot #2 (`glob`) and #3 (`minimatch`)                         | Closed: #2 was dismissed automatically and #3 is fixed. Neither is open.                                                                             |
| Scorecard `PinnedDependencies` (9 alerts)                           | Accepted. Each points at the organisation's own reusable workflows and actions (`bymaxone/.github …@v1`). Every third-party action is pinned by SHA. |
| Scorecard `BranchProtection`                                        | Waits on the ruleset of task 0.6, which is the founder's.                                                                                            |
| Scorecard `CodeReview`, `Maintained`, `CIIBestPractices`, `Fuzzing` | Repository posture, not a defect. A new repository, an optional badge, and no fuzzing target in an icon set.                                         |
| Secret scanning                                                     | Disabled. It is free on a public repository and part of the code security configuration of task 0.6, which is the founder's.                         |

Read from the GitHub API on 2026-11-14: one open Dependabot alert and 14 open code-scanning alerts, all of them in the rows above. No paid GitHub feature is turned on.

## 8. The preview branch

`icons-preview` holds the images of pull-request previews, which spec §12 requires. It cannot go away while the preview workflow runs.

- Measured on 2026-11-11: since #21 the publish keeps only a pull request's latest commit, the one its comment shows.
- The 7 images of earlier commits were removed once, which took the branch from 7.2 MB to 4.7 MB.
- Every comment's images still load.

## 9. First-publish runbook

For the founder. Every step runs on the founder's machine, logged in to npm as an owner of the `@bymax-one` scope.

1. **The exact commit.** Use the squash commit of the release pull request on `main`, the one whose title is `chore(release): 1.0.0 with React Native`. That title is not shared with any earlier commit, so the search below cannot land on an older release commit.

   ```bash
   git clone https://github.com/bymaxone/icons.git && cd icons
   SHA="$(git log origin/main --format=%H --grep='chore(release): 1.0.0 with React Native' --fixed-strings -1)"
   echo "$SHA"                                    # must equal the merge SHA of the release pull request
   git checkout "$SHA"
   node -p "require('./package.json').version"    # 1.0.0
   test -d src/native && echo "React Native is in this commit"
   ```

   Stop if `SHA` is empty or differs from the merge SHA shown on the release pull request in GitHub: the tarball must come from that exact commit.

   Use Node 24 and pnpm 11.20.0, the versions `package.json` names.

   The date of the `## [1.0.0]` section in `CHANGELOG.md` is the day the release was prepared, not the day of the publish. Leave it as it is: the tarball must come from this exact commit, and a date-correction commit on `main` would be a different commit, so a fix to the date would need a new release pull request and a new runbook run.

2. **A clean install.** Run `pnpm install --frozen-lockfile`.

3. **The build and the gates.** Run `pnpm prepublishOnly`, which cleans, checks, tests, builds and runs the package gates (the script in `package.json` is the list).

   Then run `pnpm dogfood` and `pnpm check:api`. The second prints "No earlier published version", which is the expected result for a first release.

4. **Keep the local pack to compare against.** Run `mkdir -p /tmp/icons-local && npm pack --pack-destination /tmp/icons-local`; npm does not create the directory.

5. **Publish.** Run `npm publish --access public --provenance=false --otp <code>`.
   - Provenance is generated only by a CI run with an OIDC identity. `publishConfig` asks for it, so a local publish must turn it off explicitly.
   - Every later release has provenance through `release.yml`.
   - `npm publish` runs `prepublishOnly` again before it uploads.

6. **The trusted publisher.** On npmjs.com, under the package's settings, add a trusted publisher:
   - GitHub Actions;
   - organisation or user `bymaxone`;
   - repository `icons`;
   - workflow `release.yml`;
   - environment `npm-publish`.

   Then set publishing access to require two-factor authentication and disallow tokens, so only the workflow can publish.

7. **The published tarball matches the local pack.**

   ```bash
   mkdir -p /tmp/icons-npm /tmp/icons-a /tmp/icons-b
   npm pack @bymax-one/icons@1.0.0 --pack-destination /tmp/icons-npm
   tar -xzf /tmp/icons-local/bymax-one-icons-1.0.0.tgz -C /tmp/icons-a
   tar -xzf /tmp/icons-npm/bymax-one-icons-1.0.0.tgz -C /tmp/icons-b
   diff -r /tmp/icons-a/package /tmp/icons-b/package && echo identical
   ```

8. **The tag and the release.** Run `git tag v1.0.0 && git push origin v1.0.0`.
   - `release.yml` checks the tag against the version and runs the gates.
   - It finds 1.0.0 already on npm, skips the publish and creates the GitHub Release from the CHANGELOG section.

9. **After.**
   - `bymax-studio-web` switches its dependency to `@bymax-one/icons@^1.0.0`.
   - The README's npm badge becomes a link to the package, in the next release.
   - The catalog header's "npm soon" (`site/pages.mjs`, the `soon` span) becomes a link to `https://www.npmjs.com/package/@bymax-one/icons`. It is in the site only, so it needs no package release.

---

## 10. Mutation testing

The result of the cold run on `main` (`mutation-full.yml`, commit `3f9facbf`), after pull requests #69, #70, #71, #73 and #75.

| Field                             | Value                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| Mutants (all)                     | 5,616                                                                                   |
| Killed                            | 3,800                                                                                   |
| Killed by timeout (counted apart) | 34                                                                                      |
| Runtime errors (counted apart)    | 143                                                                                     |
| Compile errors (not tested)       | 1,599                                                                                   |
| Ignored by a `Stryker disable`    | 40                                                                                      |
| Survivors                         | 0 (the gate needs 0)                                                                    |
| Score                             | 100                                                                                     |
| Time of each of the eight shards  | 35m47s, 34m30s, 31m32s, 39m50s, 66m26s, 39m45s, 57m14s, 34m17s (1 to 8)                 |
| The whole run                     | 68m27s, with the aggregate job at 1m35s                                                 |
| The run that backs these numbers  | https://github.com/bymaxone/icons/actions/runs/43789383648                              |
| The main CI mutation job after it | https://github.com/bymaxone/icons/actions/runs/43789318683 (green, rerun on `3f9facbf`) |

What was measured before that run:

- A cold local run of 5,582 mutants left 184 survivors in eight files, with 33 timeouts, 143 runtime errors and 1,598 compile errors. Pull request #71 kills them.
- The per-push gate on `main` had been cancelled for about 14 merges: its baseline is restored from a cache that is saved only after a run succeeds, and a run that fails never seeds it. A green cold run is what seeds it (pull request #70 splits that run across runners, #71 sets eight shards, #73 raises the ceiling to 240 minutes after a shard was cancelled at 90, #75 removes the last equivalent survivor).
- Two repository sweeps of about 75 seconds each ran inside the Stryker suite, so a mutant they reached timed out instead of being killed. Pull request #69 moved them out of it.
- A mutant killed by timeout does not prove a test catches the defect, so the timeouts are listed on their own and are not part of "killed".

---

## 11. The catalogue at the size a reader sees

The sheets in [`contact-sheets/release-1.0/`](./contact-sheets/release-1.0/) were made from the built package of this commit:

- `page-1.png` to `page-11.png`: every line icon at 24 px, 1x, in the catalogue's cell and order.
- `flags-light-finland-greece-japan.png` and `flags-light-south-korea.png`: the Flags section of the catalogue in the light theme, 1x, with the hairline outline on the white-edged flags.
- `flags-categories-listed.png`: the Flag type lists only the Flags category; the other categories no longer show a count of zero.

---

## 12. React Native in 1.0.0

> **Prepared**: 2026-11-19 · **Version**: 1.0.0, the first publish, with the `./native` entries in it · **Decided**: by the founder on 2026-11-19; there is no separate 1.1.0.

The first publish carries everything on `main`, React Native included. `pnpm check:api` prints "No earlier published version" and needs no "Apply to a consumer" note, because there is nothing earlier to differ from.

**The tarball** (`npm pack --dry-run --json` on the release branch): 14,181 files, 2,271,554 bytes packed and 12,634,563 bytes unpacked; every drawing ships a second renderer for `./native`. The dogfood gate checks that the 14,181 entries sit under the allowed paths.

**The gates**, on the release branch: `pnpm prepublishOnly` passes with 83 suites and 3,440 tests at 100% coverage; `pnpm dogfood` passes; `pnpm check:api` prints "No earlier published version", the expected result until 1.0.0 is on npm. `pnpm check:runtime` resolves 1,552 `./native` subpaths in ESM and CommonJS to the declared files, with exactly their names, and the 1,553 web subpaths still export their 4,379 names.

**Size budgets.** Every `./native` entry is held to a budget in `scripts/check-size.mjs`, with a negative test: index 12.11 kB brotli (budget 14.50 kB), runtime 1.74 kB (2.10 kB), brands 41.60 kB (50.00 kB), flags 0.71 kB (0.90 kB); an icon module is held to the web budget of 1.5 KiB and a flag module to 2 KiB. The build peaks at 4.84 GB of resident memory, which fits a GitHub runner.

**On a device**, the Expo bench from the packed tarball renders the seven rows (line, filled, 16 px master, brand, flag, per-icon subpath, title) at three sizes in the default colour and in red:

| `react-native-svg` | React Native, architecture | Platforms                          |
| ------------------ | -------------------------- | ---------------------------------- |
| 15.16.0            | 0.88.1 on Expo SDK 58, New | iOS Simulator, Android 36 emulator |
| 15.11.1            | 0.78.3, old                | iOS Simulator, Android 36 emulator |

The peer floor is `>=15.11.1`: the npm tarball of 15.11.0 has no `scripts/rnsvg_utils.rb`, so `pod install` fails on it, and 15.11.1 was republished the same day. 15.11.0 also does not compile with the New Architecture on React Native 0.78, 0.79 or 0.88. Metro below React Native 0.79 needs `resolver.unstable_enablePackageExports: true`; the README says so.

**Mutation.** The cold run on `main` (`mutation-full.yml`, commit `dfc68e1d`, the merge of the native runtime and the glob 14 toolchain): https://github.com/bymaxone/icons/actions/runs/43899908966, green.

| Field                             | Value                                                                   |
| --------------------------------- | ----------------------------------------------------------------------- |
| Mutants (all)                     | 5,881                                                                   |
| Killed                            | 4,020                                                                   |
| Killed by timeout (counted apart) | 34                                                                      |
| Runtime errors (counted apart)    | 175                                                                     |
| Compile errors (not tested)       | 1,612                                                                   |
| Ignored by a `Stryker disable`    | 40                                                                      |
| Survivors                         | 0 (the gate needs 0)                                                    |
| Score                             | 100                                                                     |
| Time of each of the eight shards  | 47m54s, 37m35s, 34m24s, 46m58s, 49m28s, 53m02s, 71m51s, 42m33s (1 to 8) |
| The whole run                     | 74m02s, with the aggregate job at 1m47s                                 |

Against section 10 the run adds 265 mutants, all killed or counted apart, from the native runtime and the generator: the 5,616 of the first run grew to 5,881.
