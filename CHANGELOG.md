# Changelog

All notable changes to `@bymax-one/icons` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

The `release.yml` workflow extracts the section matching the pushed `vX.Y.Z` tag
as the GitHub Release body, so each released version needs a matching
`## [X.Y.Z]` heading here. Every release section lists the icons it added, renamed
and deprecated, each rename with the alias that keeps the old name working.

## [Unreleased]

### Added

- The twelve keystone icons, which fix the design language of the set: `home`, `search`,
  `play`, `plus`, `close`, `check`, `settings`, `user`, `file`, `folder`, `lightning` and
  `scene` (components `HomeIcon` to `SceneIcon`, from the root and from
  `./icons/<name>`), with their raw SVG files, sprite symbols and metadata. Their
  signature is a 1.5 px cut that keeps distinct parts from touching: the door of `home`,
  the handle of `search`, the head of `user`, the crease of `file`.
- The navigation, action and status icons, 44 drawings in the same language. Navigation:
  `dashboard`, `folder-stack`, `library`, `templates`, `menu`, `sidebar`, `chevron-up`,
  `chevron-down`, `chevron-left`, `chevron-right`, `arrow-left`, `arrow-right` and
  `arrow-up-right`. Actions: `pencil`, `trash` (alias `delete`), `copy`, `duplicate`,
  `download`, `upload`, `share`, `link`, `more-horizontal`, `more-vertical`, `undo`, `redo`,
  `refresh`, `filter`, `sort`, `grip` and `pin`. Status: `check-circle`, `alert-triangle`
  (alias `warning`), `alert-circle`, `info`, `loader`, `clock`, `cloud-check`, `lock`,
  `eye`, `eye-off`, `history`, `queued`, `repair` and `version`.
- The media, audio, file and editor icons, 50 drawings. Media and video: `pause`, `stop`,
  `skip-back`, `skip-forward`, `loop`, `fullscreen`, `minimize`, `video`, `camera`,
  `scissors`, `shot`, `keyframe`, `frame`, `extend`, `render`, `export-video`, `timeline`,
  `transition` and `camera-motion`. Audio and voice: `mic`, `mic-off`, `volume`,
  `volume-off`, `music`, `waveform`, `captions`, `voice`, `lip-sync` and `narration`. Files:
  `file-video`, `file-audio`, `image`, `paperclip`, `reference-card` and `asset`. Editor and
  canvas: `layers`, `crop`, `move`, `zoom-in`, `zoom-out`, `hand`, `cursor`, `text`,
  `align-center`, `grid`, `palette`, `brush`, `eraser`, `split` and `mask`.
- The Studio, AI, format, billing, people and system icons, 42 drawings. Credits and
  billing: `wallet`, `card`, `receipt`, `gift`, `lightning-stack` (alias `credit-pack`),
  `spending-cap` and `plan`. People and roles: `users`, `user-plus`, `crown`, `mail-invite`,
  `log-in`, `log-out`, `character` and `role`. Formats: `aspect-16-9`, `aspect-9-16`,
  `aspect-1-1`, `aspect-4-5`, `duration` and `resolution`. AI and agent: `sparkle`,
  `octopus` (alias `polvi`), `agent`, `prompt`, `generate`, `regenerate`, `variations`,
  `storyboard`, `script` and `style`. System: `bell`, `message`, `help`, `feedback`, `sun`,
  `moon`, `monitor`, `globe`, `keyboard`, `command` and `accent`.
- Filled variants of 40 icons with a stateful meaning, each the silhouette of its line icon
  made solid with its interior details knocked out at 1.5 px (`HomeFilledIcon` to
  `MoonFilledIcon`, from the root and from `./icons/<name>`, aliases included, such as
  `PolviFilledIcon`), with their raw SVG files under `svg/filled/`, sprite symbols and
  metadata: `home`, `dashboard`, `folder`, `folder-stack`, `library`, `templates`,
  `settings`, `user`, `users`, `file`, `play`, `pause`, `scene`, `video`, `camera`, `mic`,
  `volume`, `image`, `layers`, `bell`, `message`, `lock`, `eye`, `pin`, `check-circle`,
  `alert-circle`, `alert-triangle`, `info`, `cloud-check`, `clock`, `lightning`,
  `lightning-stack`, `wallet`, `card`, `crown`, `sparkle`, `octopus`, `character`, `sun`
  and `moon`.
- The 16 px masters render at 16 px with the set's 1.5 px stroke by default. `createIcon`
  takes a `masterSize` option (16 for a `<Name>SmIcon`, 24 by default) and `Icon` a
  `masterSize` prop: it is the default `size`, and `strokeWidth` is read in px at that size,
  so a 16 px master writes its stroke as 2.25 units of the 24 grid. `ICON_GRID.smSize` is
  `16`. The raw SVG files of the 16 px masters carry `width="16" height="16"`, and both
  those files and the sprite symbols carry `stroke-width="2.25"`. Apply to a consumer: nothing changes
  for the line and filled icons; on a 16 px master, `strokeWidth` is in px at 16, and
  `absoluteStrokeWidth` still writes `strokeWidth * 24 / size`.
- The brand marks, in their owners' geometry from Simple Icons, filled with
  `currentColor` (`GoogleBrandIcon` and the others, from `./brands`). Microsoft and
  LinkedIn are not included, and the colour `google-color` mark is deferred.
- Repository scaffold: package manifest with the `.` and `./meta` exports map,
  build tooling, lint and test configuration, mutation testing configuration,
  commit governance, the open-source baseline files and the package-integrity
  scripts.
- `ICON_GRID` in `./meta`, re-exported from the root: the 24 px master grid of the
  set (viewBox, live area, padding and the 1.5 px round stroke) as frozen, typed data.
- The icon runtime in the root entry: the `Icon` base, which renders a drawing held as
  data (`IconNode`) into an `<svg>` with `createElement`, and `createIcon`, which makes a
  named component (`displayName`, `bx-icon bx-icon-<name>` classes) from a drawing.
  `IconProps` carries `size`, `strokeWidth`, `color`, `title`, `ref` as a regular prop,
  and `absoluteStrokeWidth`, which writes `strokeWidth * 24 / size` for pixel sizes.
  Icons are `aria-hidden` by default; a `title` gives `role="img"`, `aria-label` and a
  `<title>` child; a consumer `role` or `aria-*` suppresses the default. No hook, context
  or `'use client'`.
- The `./runtime` subpath, which holds the `Icon` base and `createIcon`. The root
  re-exports both, so `import { createIcon } from '@bymax-one/icons'` keeps working; every
  generated icon module imports it through the `./runtime` specifier, which keeps one copy
  in the package.
- The build pipeline. `pnpm generate` normalises the SVG sources with SVGO, runs the icon
  lint, and writes one TypeScript module per icon variant (the drawing as data for
  `createIcon`), the root and `./brands` re-exports and the typed metadata. `pnpm build`
  adds `dist/svg/{line,filled,sm,brands}/<name>.svg`, `dist/sprite.svg` (one
  `<symbol>` per drawing) and `dist/metadata.json`.
- The subpaths `./icons/<name>`, `./brands`, `./svg/*`, `./sprite.svg` and
  `./metadata.json`.
- `./meta` exports `ICON_NAMES`, `ICON_METADATA`, `BRAND_NAMES`, `BRAND_METADATA` and
  `ICON_CATEGORIES`, frozen, with the `IconName`, `BrandName` and `IconCategoryName` unions
  and the record types.
- The JSON Schemas of icon, brand and category metadata (`schemas/`), validated with ajv,
  and `categories.json`.
- `pnpm lint:icons`, the icon lint: allowed elements and attributes, fills and the spark-dot
  exception, three-decimal precision, the live area, kebab-case file names paired with
  their metadata, the schemas, alias and component-name uniqueness, declared variants and
  brand names only in `icons/brands`.
- `pnpm contact-sheet`: every drawing at 16, 20, 24 and 48 px on the light and dark Studio
  pages, in the ink and the six accents, rendered to `reports/contact-sheet.png`.
- The visual tools every drawing batch is reviewed with: `pnpm check:visual` compares every
  drawing at 16, 20, 24 and 48 px, light and dark, with committed baselines;
  `pnpm similarity` compares every drawing, normalised for position, size and stroke, with
  Lucide, Tabler, Phosphor and Heroicons and flags close matches for review;
  `pnpm family-sheet` renders the whole set by category; and a pull request that changes a
  drawing gets a preview comment with its render and its nearest matches.
